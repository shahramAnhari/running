const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'change-this-secret';
const TOKEN_EXPIRY = process.env.ADMIN_JWT_EXPIRES_IN || '4h';

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

function sanitizeAdmin(admin) {
  if (!admin) return null;
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name || '',
    isSuper: !!admin.isSuper,
    createdAt: admin.createdAt,
  };
}

function getAuthToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}

function requireAdmin(req, res, next) {
  const token = getAuthToken(req);
  if (!token) return res.status(401).json({ error: 'توکن ارسال نشده' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'توکن نامعتبر است' });
  }
  const admin = db.getAdminById(payload.sub);
  if (!admin) return res.status(401).json({ error: 'ادمین یافت نشد' });
  req.admin = sanitizeAdmin(admin);
  next();
}

function requireSuperAdmin(req, res, next) {
  requireAdmin(req, res, () => {
    if (!req.admin?.isSuper) return res.status(403).json({ error: 'دسترسی مجاز نیست' });
    next();
  });
}

function signToken(admin) {
  return jwt.sign(
    { sub: admin.id, email: admin.email, isSuper: !!admin.isSuper },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRY }
  );
}

function assertPasswordStrong(password) {
  if (!password || password.length < 6) {
    throw new Error('پسورد باید حداقل ۶ کاراکتر باشد');
  }
}

// ---------------------------------------------------------------------------
// Admin Auth

app.get('/api/admin/bootstrap/status', (_req, res) => {
  res.json({ hasAdmin: db.countAdmins() > 0 });
});

app.post('/api/admin/bootstrap', (req, res) => {
  try {
    const total = db.countAdmins();
    if (total > 0) return res.status(403).json({ error: 'ادمین قبلاً تعریف شده است' });
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'ایمیل و پسورد الزامی است' });
    assertPasswordStrong(password);
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return res.status(400).json({ error: 'ایمیل نامعتبر است' });
    const hash = bcrypt.hashSync(password, 10);
    const admin = db.createAdmin({ email, name, passwordHash: hash, isSuper: true });
    const token = signToken(admin);
    res.json({ token, admin: sanitizeAdmin(admin) });
  } catch (err) {
    res.status(400).json({ error: err.message || 'خطا در ساخت ادمین' });
  }
});

app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'ایمیل/پسورد الزامی است' });
    const admin = db.getAdminByEmail(email);
    if (!admin) return res.status(401).json({ error: 'اطلاعات ورود نادرست است' });
    const ok = bcrypt.compareSync(password, admin.passwordHash);
    if (!ok) return res.status(401).json({ error: 'اطلاعات ورود نادرست است' });
    const token = signToken(admin);
    res.json({ token, admin: sanitizeAdmin(admin) });
  } catch (err) {
    res.status(400).json({ error: err.message || 'خطای ورود' });
  }
});

app.get('/api/admin/me', requireAdmin, (req, res) => {
  res.json({ admin: req.admin });
});

app.get('/api/admins', requireSuperAdmin, (_req, res) => {
  res.json(db.listAdmins());
});

app.post('/api/admins', requireSuperAdmin, (req, res) => {
  try {
    const { email, password, name, isSuper } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'ایمیل/پسورد الزامی است' });
    assertPasswordStrong(password);
    if (db.getAdminByEmail(email)) return res.status(400).json({ error: 'این ایمیل قبلاً ثبت شده است' });
    const admin = db.createAdmin({
      email,
      name,
      passwordHash: bcrypt.hashSync(password, 10),
      isSuper: !!isSuper,
    });
    res.json(sanitizeAdmin(admin));
  } catch (err) {
    res.status(400).json({ error: err.message || 'خطا در ایجاد ادمین' });
  }
});

app.put('/api/admins/:id', requireSuperAdmin, (req, res) => {
  try {
    const { name, password, isSuper } = req.body || {};
    let passwordHash;
    if (password !== undefined) {
      assertPasswordStrong(password);
      passwordHash = bcrypt.hashSync(password, 10);
    }
    const target = db.getAdminById(req.params.id);
    if (!target) return res.status(404).json({ error: 'ادمین یافت نشد' });
    if (req.params.id === req.admin.id && isSuper === false) {
      return res.status(400).json({ error: 'امکان حذف دسترسی سوپر از خود وجود ندارد' });
    }
    const updated = db.updateAdmin(req.params.id, {
      name,
      passwordHash,
      isSuper,
    });
    res.json(sanitizeAdmin(updated));
  } catch (err) {
    res.status(400).json({ error: err.message || 'خطا در بروزرسانی ادمین' });
  }
});

app.delete('/api/admins/:id', requireSuperAdmin, (req, res) => {
  try {
    if (req.params.id === req.admin.id) return res.status(400).json({ error: 'حذف اکانت خود امکان‌پذیر نیست' });
    const target = db.getAdminById(req.params.id);
    if (!target) return res.json({ ok: true });
    if (target.isSuper && db.countSuperAdminsExcluding(req.params.id) === 0) {
      return res.status(400).json({ error: 'نمی‌توان آخرین سوپر ادمین را حذف کرد' });
    }
    db.deleteAdmin(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(400).json({ error: err.message || 'خطا در حذف ادمین' });
  }
});

// ---------------------------------------------------------------------------
// Health

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ---------------------------------------------------------------------------
// Students

app.get('/api/students', (_req, res) => res.json(db.listStudents()));

app.post('/api/students', (req, res) => handle(res, () => {
  const { name, email, groupId, phone } = req.body || {};
  return db.addStudent({ name, email, groupId, phone });
}));

app.get('/api/students/:id', (req, res) => {
  const student = db.getStudent(req.params.id);
  if (!student) return res.status(404).json({ error: 'یافت نشد' });
  res.json(student);
});

app.get('/api/students/by-phone', (req, res) => {
  const { phone } = req.query || {};
  if (!phone) return res.status(400).json({ error: 'phone الزامی است' });
  const student = db.getStudentByPhone(phone);
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

app.post('/api/students/:id/phone/verify/start', (req, res) => handle(res, () => db.startPhoneVerification(req.params.id)));

app.post('/api/students/:id/phone/verify/confirm', (req, res) => handle(res, () => {
  const ok = db.verifyStudentPhone(req.params.id, req.body?.code);
  return { ok };
}));

app.post('/api/students/:id/phone/verify/manual', (req, res) => handle(res, () => {
  db.markStudentPhoneVerified(req.params.id);
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
