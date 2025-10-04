const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('./db');

const app = express();

// ایجاد پوشه uploads اگر وجود ندارد
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// میدل‌ورها
app.use(cors()); // در تولید: origin را محدود کنید
app.use(express.json({ limit: '5mb' }));
app.use('/uploads', express.static(uploadsDir));

// تنظیم Multer برای آپلود فایل
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const name = `file_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext || ''}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

// سلامت
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Students
app.get('/api/students', (_req, res) => res.json(db.listStudents()));
app.post('/api/students', (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) return res.status(400).json({ error: 'نام/ایمیل الزامی است' });
  try { res.json(db.addStudent({ name, email })); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
app.put('/api/students/:id', (req, res) => {
  try { res.json(db.updateStudent(req.params.id, req.body || {})); }
  catch (e) { res.status(400).json({ error: e.message }); }
});

// Profile
app.get('/api/students/:id/profile', (req, res) => res.json(db.getProfile(req.params.id)));
app.put('/api/students/:id/profile', (req, res) => res.json(db.updateProfile(req.params.id, req.body || {})));

// Medical docs
app.post('/api/students/:id/docs', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'فایل ارسال نشده' });
  const url = `/uploads/${req.file.filename}`;
  const doc = db.addMedicalDoc(req.params.id, { name: req.file.originalname, url });
  res.json(doc);
});
app.get('/api/students/:id/docs', (req, res) => res.json(db.listMedicalDocs(req.params.id)));
app.delete('/api/students/:id/docs/:docId', (req, res) => { db.deleteMedicalDoc(req.params.id, req.params.docId); res.json({ ok: true }); });

// Goals
app.get('/api/goals', (req, res) => res.json(db.listGoals(req.query.studentId)));
app.post('/api/goals', (req, res) => {
  const { studentId, title, targetDistanceKm, targetDurationSec, targetPaceSecPerKm } = req.body || {};
  if (!studentId || !title) return res.status(400).json({ error: 'studentId/title الزامی' });
  res.json(db.addGoal({ studentId, title, targetDistanceKm, targetDurationSec, targetPaceSecPerKm }));
});
app.put('/api/goals/:id', (req, res) => res.json(db.updateGoal(req.params.id, req.body || {})));
app.delete('/api/goals/:id', (req, res) => { db.deleteGoal(req.params.id); res.json({ ok: true }); });

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('API on http://localhost:' + PORT));

