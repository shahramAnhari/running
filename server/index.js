const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();

const uploadsRoot = path.join(__dirname, 'uploads');
const docsDir = path.join(uploadsRoot, 'docs');
const paymentsDir = path.join(uploadsRoot, 'payments');

[uploadsRoot, docsDir, paymentsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(uploadsRoot));

function makeStorage(subDir) {
  const dest = path.join(uploadsRoot, subDir);
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  return multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, dest),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname || '').toLowerCase();
      const name = `${subDir}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`;
      cb(null, name);
    },
  });
}

const docUpload = multer({ storage: makeStorage('docs') });
const paymentUpload = multer({ storage: makeStorage('payments') });

// ---------------------------------------------------------------------------
// Helpers

function handle(res, fn) {
  try {
    const result = fn();
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message || 'خطای ناشناخته' });
  }
}

function paymentResponse(p) {
  if (!p) return null;
  const imageUrl = p.imageUrl || null;
  return Object.assign({}, p, {
    imageUrl,
    imageDataUrl: imageUrl, // سازگاری با کلاینت فعلی
  });
}

// ---------------------------------------------------------------------------
// Health

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// Students

app.get('/api/students', (_req, res) => res.json(db.listStudents()));

app.post('/api/students', (req, res) => handle(res, () => {
  const { name, email, groupId } = req.body || {};
  return db.addStudent({ name, email, groupId });
}));

app.get('/api/students/:id', (req, res) => {
  const student = db.getStudent(req.params.id);
  if (!student) return res.status(404).json({ error: 'یافت نشد' });
  res.json(student);
});

app.put('/api/students/:id', (req, res) => handle(res, () => db.updateStudent(req.params.id, req.body || {})));

app.delete('/api/students/:id', (req, res) => handle(res, () => {
  db.deleteStudent(req.params.id);
  return { ok: true };
}));

app.post('/api/students/:id/verify/start', (req, res) => handle(res, () => db.startEmailVerification(req.params.id)));

app.post('/api/students/:id/verify/confirm', (req, res) => handle(res, () => {
  const ok = db.verifyStudentEmail(req.params.id, req.body?.code);
  return { ok };
}));

app.post('/api/students/:id/verify/manual', (req, res) => handle(res, () => {
  db.markStudentVerified(req.params.id);
  return { ok: true };
}));

app.get('/api/students/:id/profile', (req, res) => res.json(db.getProfile(req.params.id)));
app.put('/api/students/:id/profile', (req, res) => res.json(db.updateProfile(req.params.id, req.body || {})));

app.get('/api/students/:id/assignments', (req, res) => res.json(db.listAssignmentsForStudent(req.params.id)));
app.get('/api/students/:id/programs', (req, res) => res.json(db.getProgramsForStudent(req.params.id)));

app.get('/api/students/:id/payments', (req, res) => res.json(db.listPaymentsForStudent(req.params.id).map(paymentResponse)));

app.post('/api/students/:id/payments', paymentUpload.single('file'), (req, res) => handle(res, () => {
  if (!req.file) throw new Error('فایل ارسال نشده است');
  const rel = `/uploads/payments/${req.file.filename}`;
  const { note, month, monthJalali } = req.body || {};
  const payment = db.addPayment({
    studentId: req.params.id,
    note,
    month,
    monthJalali,
    imageUrl: rel,
  });
  return paymentResponse(payment);
}));

app.put('/api/payments/:id', (req, res) => handle(res, () => paymentResponse(db.updatePayment(req.params.id, req.body || {}))));
app.delete('/api/payments/:id', (req, res) => handle(res, () => {
  db.deletePayment(req.params.id);
  return { ok: true };
}));

app.get('/api/students/:id/logs', (req, res) => res.json(db.listLogsForStudent(req.params.id)));
app.post('/api/students/:id/logs', (req, res) => handle(res, () => db.addLog(req.params.id, req.body || {})));
app.put('/api/logs/:id', (req, res) => handle(res, () => db.updateLog(req.params.id, req.body || {})));
app.delete('/api/logs/:id', (req, res) => handle(res, () => {
  db.deleteLog(req.params.id);
  return { ok: true };
}));

app.get('/api/logs/:id/comments', (req, res) => res.json(db.listCommentsForLog(req.params.id)));
app.post('/api/logs/:id/comments', (req, res) => handle(res, () => db.addComment({
  logId: req.params.id,
  author: req.body?.author,
  authorName: req.body?.authorName,
  authorStudentId: req.body?.authorStudentId,
  text: req.body?.text,
})));

app.get('/api/day-comments', (req, res) => {
  const { programId, studentId, dayKey } = req.query || {};
  res.json(db.listDayComments(programId, studentId, dayKey));
});

app.post('/api/day-comments', (req, res) => handle(res, () => db.addDayComment(req.body || {})));

// ---------------------------------------------------------------------------
// Programs

app.get('/api/programs', (_req, res) => res.json(db.listPrograms()));
app.post('/api/programs', (req, res) => handle(res, () => db.addProgram(req.body || {})));
app.put('/api/programs/:id', (req, res) => handle(res, () => db.updateProgram(req.params.id, req.body || {})));
app.delete('/api/programs/:id', (req, res) => handle(res, () => {
  db.deleteProgram(req.params.id);
  return { ok: true };
}));

// ---------------------------------------------------------------------------
// Groups

app.get('/api/groups', (_req, res) => res.json(db.listGroups()));
app.post('/api/groups', (req, res) => handle(res, () => db.addGroup(req.body || {})));
app.put('/api/groups/:id', (req, res) => handle(res, () => db.updateGroup(req.params.id, req.body || {})));
app.delete('/api/groups/:id', (req, res) => handle(res, () => {
  db.deleteGroup(req.params.id);
  return { ok: true };
}));

// ---------------------------------------------------------------------------
// Assignments

app.get('/api/assignments', (_req, res) => res.json(db.listAssignments()));
app.post('/api/assignments', (req, res) => handle(res, () => db.addAssignment(req.body || {})));
app.put('/api/assignments/:id', (req, res) => handle(res, () => db.updateAssignmentDates(req.params.id, req.body || {})));
app.delete('/api/assignments/:id', (req, res) => handle(res, () => {
  db.deleteAssignment(req.params.id);
  return { ok: true };
}));

// ---------------------------------------------------------------------------
// Goals

app.get('/api/goals', (req, res) => {
  const { studentId } = req.query || {};
  if (!studentId) return res.status(400).json({ error: 'studentId الزامی است' });
  res.json(db.listGoals(studentId));
});

app.get('/api/students/:id/goals', (req, res) => res.json(db.listGoals(req.params.id)));

app.post('/api/goals', (req, res) => handle(res, () => db.addGoal(req.body || {})));
app.put('/api/goals/:id', (req, res) => handle(res, () => db.updateGoal(req.params.id, req.body || {})));
app.delete('/api/goals/:id', (req, res) => handle(res, () => {
  db.deleteGoal(req.params.id);
  return { ok: true };
}));

app.post('/api/goals/:id/milestones', (req, res) => handle(res, () => db.addMilestone(req.params.id, req.body?.text)));
app.put('/api/goals/:id/milestones/:mid', (req, res) => handle(res, () => db.updateMilestone(req.params.id, req.params.mid, req.body?.text)));
app.post('/api/goals/:id/milestones/:mid/toggle', (req, res) => handle(res, () => db.toggleMilestone(req.params.id, req.params.mid, !!req.body?.done)));
app.delete('/api/goals/:id/milestones/:mid', (req, res) => handle(res, () => {
  db.deleteMilestone(req.params.id, req.params.mid);
  return { ok: true };
}));

// ---------------------------------------------------------------------------
// Medical docs

app.post('/api/students/:id/docs', docUpload.single('file'), (req, res) => handle(res, () => {
  if (!req.file) throw new Error('فایلی ارسال نشده است');
  const rel = `/uploads/docs/${req.file.filename}`;
  return db.addMedicalDoc(req.params.id, { name: req.file.originalname, url: rel });
}));
app.get('/api/students/:id/docs', (req, res) => res.json(db.listMedicalDocs(req.params.id)));
app.delete('/api/students/:id/docs/:docId', (req, res) => handle(res, () => {
  db.deleteMedicalDoc(req.params.id, req.params.docId);
  return { ok: true };
}));

// ---------------------------------------------------------------------------
// Payments (coach list)

app.get('/api/payments', (_req, res) => res.json(db.listPayments().map(paymentResponse)));

// ---------------------------------------------------------------------------
// Seed demo data

app.post('/api/seed-demo', (_req, res) => handle(res, () => {
  const seeded = db.seedDemo();
  return { ok: true, seeded };
}));

// ---------------------------------------------------------------------------

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
