const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'db.sqlite');
const uploadsDir = path.join(__dirname, 'uploads');
const paymentsDir = path.join(uploadsDir, 'payments');

if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(paymentsDir)) fs.mkdirSync(paymentsDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

const WEEK_ORDER = [
  { key: 'sat', label: 'شنبه' },
  { key: 'sun', label: 'یکشنبه' },
  { key: 'mon', label: 'دوشنبه' },
  { key: 'tue', label: 'سه‌شنبه' },
  { key: 'wed', label: 'چهارشنبه' },
  { key: 'thu', label: 'پنجشنبه' },
  { key: 'fri', label: 'جمعه' },
];

function now() {
  return new Date().toISOString();
}

function genId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function ensureColumn(table, column, type) {
  const info = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!info.some(col => col.name === column)) {
    db.prepare(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`).run();
  }
}

function ensureSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE,
      verified_at TEXT,
      profile_json TEXT,
      group_id TEXT,
      verification_code TEXT,
      verification_expires_at TEXT
    );

    CREATE TABLE IF NOT EXISTS programs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      week_json TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      program_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT NOT NULL,
      start_date TEXT,
      end_date TEXT,
      duration_days INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      note TEXT,
      month TEXT,
      month_jalali TEXT,
      image_url TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_distance_km REAL,
      target_duration_sec INTEGER,
      target_pace_sec_per_km INTEGER,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS goal_milestones (
      id TEXT PRIMARY KEY,
      goal_id TEXT NOT NULL,
      text TEXT,
      done INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS medical_docs (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      name TEXT,
      url TEXT,
      uploaded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      student_id TEXT NOT NULL,
      date TEXT,
      assignment_id TEXT,
      program_id TEXT,
      day_key TEXT,
      mood INTEGER,
      mood_emoji TEXT,
      sleep_quality INTEGER,
      sleep_hours REAL,
      nutrition INTEGER,
      hydration REAL,
      rpe INTEGER,
      distance_km REAL,
      duration_sec INTEGER,
      hr_avg INTEGER,
      location TEXT,
      shoe TEXT,
      companions TEXT,
      note TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      log_id TEXT,
      program_id TEXT,
      day_key TEXT,
      author TEXT,
      author_name TEXT,
      author_student_id TEXT,
      text TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS admins (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      is_super INTEGER DEFAULT 0,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS coaches (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      password_hash TEXT NOT NULL,
      created_at TEXT,
      last_login_at TEXT
    );
  `);

  ensureColumn('students', 'group_id', 'TEXT');
  ensureColumn('students', 'phone', 'TEXT');
  ensureColumn('students', 'phone_verified_at', 'TEXT');
  ensureColumn('students', 'phone_verification_code', 'TEXT');
  ensureColumn('students', 'phone_verification_expires_at', 'TEXT');
  ensureColumn('students', 'status', 'TEXT');
  ensureColumn('students', 'password_hash', 'TEXT');
  ensureColumn('students', 'created_at', 'TEXT');
  ensureColumn('students', 'last_login_at', 'TEXT');
  ensureColumn('students', 'reset_token', 'TEXT');
  ensureColumn('students', 'reset_expires_at', 'TEXT');
  ensureColumn('students', 'verification_code', 'TEXT');
  ensureColumn('students', 'verification_expires_at', 'TEXT');
  ensureColumn('students', 'profile_json', 'TEXT');

  ensureColumn('payments', 'image_url', 'TEXT');
  ensureColumn('payments', 'month_jalali', 'TEXT');

  ensureColumn('logs', 'hydration', 'REAL');

  ensureColumn('coaches', 'last_login_at', 'TEXT');
}

ensureSchema();
db.prepare(`UPDATE students SET status = 'approved' WHERE status IS NULL`).run();

function parseJSON(input, fallback) {
  if (!input) return fallback;
  try { return JSON.parse(input); } catch { return fallback; }
}

function normalizeWeek(week) {
  const map = new Map((Array.isArray(week) ? week : []).map(d => [d.key, d]));
  return WEEK_ORDER.map(d => {
    const src = map.get(d.key) || {};
    return { key: d.key, label: d.label, content: String(src.content || '') };
  });
}

function computeEndDate(startDate, durationDays) {
  if (!startDate) return null;
  const [y, m, d] = startDate.split('-').map(n => parseInt(n, 10));
  if (!y || !m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const days = Math.max(1, parseInt(durationDays || 7, 10));
  dt.setUTCDate(dt.getUTCDate() + days - 1);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

function normalizePhone(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/\D+/g, '');
  return digits || null;
}

function hashPassword(password) {
  if (!password) throw new Error('پسورد الزامی است');
  if (password.length < 6) throw new Error('پسورد باید حداقل ۶ کاراکتر باشد');
  return bcrypt.hashSync(password, 10);
}

function checkPassword(password, hash) {
  if (!hash || !password) return false;
  try {
    return bcrypt.compareSync(password, hash);
  } catch {
    return false;
  }
}

// Admins --------------------------------------------------------------------

function rowToAdmin(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name || '',
    isSuper: !!row.is_super,
    createdAt: row.created_at,
    passwordHash: row.password_hash,
  };
}

function countAdmins() {
  const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM admins').get();
  return cnt;
}

function createAdmin({ email, name, passwordHash, isSuper = false }) {
  const id = genId('adm');
  db.prepare('INSERT INTO admins(id, email, name, password_hash, is_super, created_at) VALUES(?,?,?,?,?,?)')
    .run(id, email.toLowerCase(), name || '', passwordHash, isSuper ? 1 : 0, now());
  return getAdminById(id);
}

function listAdmins() {
  const rows = db.prepare('SELECT id, email, name, is_super, created_at FROM admins ORDER BY created_at ASC').all();
  return rows.map(r => ({
    id: r.id,
    email: r.email,
    name: r.name || '',
    isSuper: !!r.is_super,
    createdAt: r.created_at,
  }));
}

function getAdminByEmail(email) {
  if (!email) return null;
  const row = db.prepare('SELECT * FROM admins WHERE email = ?').get(email.toLowerCase());
  return rowToAdmin(row);
}

function getAdminById(id) {
  const row = db.prepare('SELECT * FROM admins WHERE id = ?').get(id);
  return rowToAdmin(row);
}

function updateAdmin(id, { name, passwordHash, isSuper }) {
  const admin = getAdminById(id);
  if (!admin) throw new Error('Admin not found');
  const nextName = name !== undefined ? name : admin.name;
  const nextHash = passwordHash !== undefined ? passwordHash : admin.passwordHash;
  const nextSuper = isSuper !== undefined ? (isSuper ? 1 : 0) : (admin.isSuper ? 1 : 0);
  db.prepare('UPDATE admins SET name = ?, password_hash = ?, is_super = ? WHERE id = ?')
    .run(nextName, nextHash, nextSuper, id);
  return getAdminById(id);
}

function deleteAdmin(id) {
  db.prepare('DELETE FROM admins WHERE id = ?').run(id);
}

function countSuperAdminsExcluding(id) {
  const { cnt } = db.prepare('SELECT COUNT(*) AS cnt FROM admins WHERE is_super = 1 AND id <> ?').get(id);
  return cnt;
}

// Coaches -------------------------------------------------------------------

function rowToCoach(row) {
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    name: row.name || '',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || null,
    passwordHash: row.password_hash,
  };
}

function listCoaches() {
  const rows = db.prepare('SELECT id, email, name, created_at, last_login_at FROM coaches ORDER BY created_at ASC').all();
  return rows.map(row => ({
    id: row.id,
    email: row.email,
    name: row.name || '',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at || null,
  }));
}

function getCoachByEmail(email) {
  if (!email) return null;
  const row = db.prepare('SELECT * FROM coaches WHERE LOWER(email) = LOWER(?)').get(String(email));
  return rowToCoach(row);
}

function getCoachById(id) {
  if (!id) return null;
  const row = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id);
  return rowToCoach(row);
}

function createCoach({ email, name, passwordHash }) {
  if (!email || !passwordHash) throw new Error('Email and passwordHash required');
  const id = genId('coach');
  const existing = db.prepare('SELECT id FROM coaches WHERE LOWER(email) = LOWER(?)').get(String(email));
  if (existing) throw new Error('این ایمیل قبلاً برای مربی دیگری ثبت شده است');
  db.prepare('INSERT INTO coaches(id, email, name, password_hash, created_at) VALUES(?,?,?,?,?)')
    .run(id, String(email).toLowerCase(), name || '', passwordHash, now());
  return getCoachById(id);
}

function updateCoach(id, { name, email, passwordHash }) {
  const current = db.prepare('SELECT * FROM coaches WHERE id = ?').get(id);
  if (!current) throw new Error('Coach not found');

  const nextName = name !== undefined ? name : current.name;
  const nextEmail = email !== undefined ? (email ? String(email).toLowerCase() : null) : current.email;
  const nextHash = passwordHash !== undefined ? passwordHash : current.password_hash;

  if (!nextEmail) throw new Error('Email cannot be empty');
  if (nextEmail !== current.email) {
    const existing = db.prepare('SELECT id FROM coaches WHERE LOWER(email) = ? AND id <> ?').get(nextEmail, id);
    if (existing) throw new Error('این ایمیل قبلاً برای مربی دیگری ثبت شده است');
  }
  db.prepare('UPDATE coaches SET name = ?, email = ?, password_hash = ? WHERE id = ?')
    .run(nextName || '', nextEmail, nextHash, id);
  return getCoachById(id);
}

function deleteCoach(id) {
  db.prepare('DELETE FROM coaches WHERE id = ?').run(id);
}

function authenticateCoach({ email, password }) {
  if (!email || !password) return null;
  const row = db.prepare('SELECT * FROM coaches WHERE LOWER(email) = LOWER(?)').get(String(email));
  if (!row) return null;
  if (!checkPassword(password, row.password_hash)) return null;
  db.prepare('UPDATE coaches SET last_login_at = ? WHERE id = ?').run(now(), row.id);
  return getCoachById(row.id);
}

// Students -------------------------------------------------------------------

function rowToStudent(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    verifiedAt: row.verified_at || null,
    groupId: row.group_id || null,
    phone: row.phone || null,
    phoneVerifiedAt: row.phone_verified_at || null,
    status: row.status || 'pending',
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
    profile: parseJSON(row.profile_json, {}),
  };
}

function listStudents() {
  const rows = db.prepare('SELECT * FROM students ORDER BY name COLLATE NOCASE').all();
  return rows.map(rowToStudent);
}

function getStudent(id) {
  const row = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  return row ? rowToStudent(row) : null;
}

function getStudentByEmail(email) {
  if (!email) return null;
  const row = db.prepare('SELECT * FROM students WHERE LOWER(email) = LOWER(?)').get(email);
  return row ? rowToStudent(row) : null;
}

function getStudentByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  const row = db.prepare('SELECT * FROM students WHERE phone = ?').get(normalized);
  return row ? rowToStudent(row) : null;
}

function addStudent({ name, email, groupId, phone, password, status = 'approved' }) {
  const displayName = name && String(name).trim() ? String(name).trim() : 'کاربر';
  const emailNorm = email ? String(email).trim() : null;
  const phoneNorm = normalizePhone(phone);
  if (!emailNorm && !phoneNorm) throw new Error('ایمیل یا موبایل الزامی است');

  if (emailNorm) {
    const exists = db.prepare('SELECT id FROM students WHERE LOWER(email) = LOWER(?)').get(emailNorm);
    if (exists) throw new Error('این ایمیل قبلاً ثبت شده است');
  }
  if (phoneNorm) {
    const existsPhone = db.prepare('SELECT id FROM students WHERE phone = ?').get(phoneNorm);
    if (existsPhone) throw new Error('این شماره موبایل قبلاً ثبت شده است');
  }

  const id = genId('std');
  const passwordHash = password ? hashPassword(password) : null;
  db.prepare(`INSERT INTO students(
      id, name, email, verified_at, profile_json, group_id, phone, phone_verified_at,
      status, password_hash, created_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      id,
      displayName,
      emailNorm,
      emailNorm ? now() : null,
      JSON.stringify({}),
      groupId || null,
      phoneNorm,
      phoneNorm ? now() : null,
      status || 'approved',
      passwordHash,
      now()
    );
  return getStudent(id);
}

function registerStudent({ name, email, password, phone }) {
  if (!email || !password) throw new Error('ایمیل و رمز الزامی است');
  const emailNorm = String(email).trim().toLowerCase();
  const displayName = name && String(name).trim() ? String(name).trim() : 'کاربر جدید';
  const phoneNorm = normalizePhone(phone);

  const existing = db.prepare('SELECT id FROM students WHERE LOWER(email) = ?').get(emailNorm);
  if (existing) throw new Error('این ایمیل قبلاً ثبت شده است');

  if (phoneNorm) {
    const existsPhone = db.prepare('SELECT id FROM students WHERE phone = ?').get(phoneNorm);
    if (existsPhone) throw new Error('این شماره موبایل قبلاً ثبت شده است');
  }

  const created = addStudent({
    name: displayName,
    email: emailNorm,
    phone: phoneNorm,
    password,
    status: 'pending',
  });
  return created;
}

function updateStudent(id, { name, email, groupId, phone }) {
  const current = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!current) throw new Error('Student not found');

  const emailNorm = email !== undefined ? (email ? String(email).trim() : null) : current.email;
  const phoneNorm = phone !== undefined ? normalizePhone(phone) : current.phone;

  if (!emailNorm && !phoneNorm) throw new Error('ایمیل یا موبایل الزامی است');

  if (email !== undefined && emailNorm && emailNorm.toLowerCase() !== (current.email || '').toLowerCase()) {
    const exists = db.prepare('SELECT id FROM students WHERE LOWER(email) = LOWER(?) AND id <> ?').get(emailNorm, id);
    if (exists) throw new Error('این ایمیل قبلاً ثبت شده است');
  }

  if (phone !== undefined) {
    if (phoneNorm) {
      const existsPhone = db.prepare('SELECT id FROM students WHERE phone = ? AND id <> ?').get(phoneNorm, id);
      if (existsPhone) throw new Error('این شماره موبایل قبلاً ثبت شده است');
    }
    if (phoneNorm !== current.phone) {
      db.prepare('UPDATE students SET phone_verified_at = NULL, phone_verification_code = NULL, phone_verification_expires_at = NULL WHERE id = ?')
        .run(id);
    }
  }

  db.prepare('UPDATE students SET name = ?, email = ?, group_id = ?, phone = ? WHERE id = ?')
    .run(
      name ?? current.name,
      emailNorm ?? null,
      groupId ?? current.group_id ?? null,
      phoneNorm ?? null,
      id
    );
  return getStudent(id);
}

function createPendingStudent({ name, email, phone }) {
  const displayName = name && String(name).trim() ? String(name).trim() : 'کاربر جدید';
  const emailNorm = email ? String(email).trim().toLowerCase() : null;
  const phoneNorm = normalizePhone(phone);
  if (!emailNorm && !phoneNorm) throw new Error('ایمیل یا موبایل الزامی است');

  const code = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
  const expiresAt = String(Date.now() + 10 * 60 * 1000);

  let candidate = null;
  if (emailNorm) {
    candidate = db.prepare('SELECT * FROM students WHERE LOWER(email) = ?').get(emailNorm);
  }
  if (!candidate && phoneNorm) {
    candidate = db.prepare('SELECT * FROM students WHERE phone = ?').get(phoneNorm);
  }

  if (candidate) {
    if (candidate.status === 'approved') throw new Error('این حساب قبلاً تایید شده است. لطفاً وارد شوید.');
    db.prepare(`UPDATE students SET
      name = ?,
      email = ?,
      phone = ?,
      status = 'pending',
      verification_code = ?,
      verification_expires_at = ?,
      phone_verification_code = ?,
      phone_verification_expires_at = ?,
      password_hash = password_hash
      WHERE id = ?`)
      .run(
        displayName || candidate.name,
        emailNorm || candidate.email,
        phoneNorm || candidate.phone,
        emailNorm ? code : candidate.verification_code,
        emailNorm ? expiresAt : candidate.verification_expires_at,
        phoneNorm ? code : candidate.phone_verification_code,
        phoneNorm ? expiresAt : candidate.phone_verification_expires_at,
        candidate.id
      );
    return { student: getStudent(candidate.id), code, expiresAt: Number(expiresAt), via: emailNorm ? 'email' : 'phone' };
  }

  const id = genId('std');
  db.prepare(`INSERT INTO students(
      id, name, email, verified_at, profile_json, group_id,
      verification_code, verification_expires_at,
      phone, phone_verified_at, phone_verification_code, phone_verification_expires_at,
      status, password_hash, created_at
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(
      id,
      displayName,
      emailNorm,
      null,
      JSON.stringify({}),
      null,
      emailNorm ? code : null,
      emailNorm ? expiresAt : null,
      phoneNorm,
      null,
      phoneNorm ? code : null,
      phoneNorm ? expiresAt : null,
      'pending',
      null,
      now()
    );
  return { student: getStudent(id), code, expiresAt: Number(expiresAt), via: emailNorm ? 'email' : 'phone' };
}

function confirmStudentSignupByEmail({ email, code, password }) {
  if (!email || !code) throw new Error('ایمیل و کد الزامی است');
  const row = db.prepare('SELECT * FROM students WHERE LOWER(email) = ?').get(String(email).trim().toLowerCase());
  if (!row) throw new Error('شاگرد یافت نشد');
  if (!row.verification_code) throw new Error('کدی برای این شاگرد ثبت نشده است');
  const expires = parseInt(row.verification_expires_at || '0', 10);
  if (row.verification_code !== String(code).trim()) throw new Error('کد نامعتبر است');
  if (Date.now() > expires) throw new Error('کد منقضی شده است');
  const hash = hashPassword(password);
  db.prepare(`UPDATE students SET
      verified_at = ?,
      verification_code = NULL,
      verification_expires_at = NULL,
      password_hash = ?,
      status = COALESCE(status, 'pending')
    WHERE id = ?`)
    .run(now(), hash, row.id);
  return getStudent(row.id);
}

function authenticateStudent({ email, password }) {
  if (!email || !password) throw new Error('ایمیل/رمز الزامی است');
  const row = db.prepare('SELECT * FROM students WHERE LOWER(email) = ?').get(String(email).trim().toLowerCase());
  if (!row) throw new Error('شاگرد یافت نشد');
  if (!row.password_hash) throw new Error('برای این حساب رمزی تعیین نشده است');
  if (!checkPassword(password, row.password_hash)) throw new Error('رمز نادرست است');
  if (row.status && row.status !== 'approved') {
    if (row.status === 'pending') throw new Error('حساب شما هنوز توسط مربی تایید نشده است');
    if (row.status === 'rejected') throw new Error('دسترسی این حساب غیرفعال شده است');
    throw new Error('ورود برای این حساب ممکن نیست');
  }
  db.prepare('UPDATE students SET last_login_at = ? WHERE id = ?').run(now(), row.id);
  return getStudent(row.id);
}

function setStudentPassword(id, password) {
  const hash = hashPassword(password);
  db.prepare('UPDATE students SET password_hash = ? WHERE id = ?').run(hash, id);
  return getStudent(id);
}

function createStudentResetToken({ email, token, expiresAt }) {
  if (!email || !token || !expiresAt) throw new Error('ایمیل و توکن الزامی است');
  const row = db.prepare('SELECT * FROM students WHERE LOWER(email) = ?').get(String(email).trim().toLowerCase());
  if (!row) throw new Error('شاگرد یافت نشد');
  db.prepare('UPDATE students SET reset_token = ?, reset_expires_at = ? WHERE id = ?')
    .run(String(token), String(expiresAt), row.id);
  return getStudent(row.id);
}

function resetStudentPasswordWithToken({ email, token, password }) {
  if (!email || !token || !password) throw new Error('اطلاعات کامل نیست');
  const row = db.prepare('SELECT * FROM students WHERE LOWER(email) = ?').get(String(email).trim().toLowerCase());
  if (!row) throw new Error('شاگرد یافت نشد');
  if (!row.reset_token || !row.reset_expires_at) throw new Error('درخواست بازیابی یافت نشد');
  if (row.reset_token !== String(token).trim()) throw new Error('کد بازیابی نامعتبر است');
  const expires = Number(row.reset_expires_at);
  if (!expires || Date.now() > expires) throw new Error('کد بازیابی منقضی شده است');

  const hash = hashPassword(password);
  db.prepare(`UPDATE students SET password_hash = ?, reset_token = NULL, reset_expires_at = NULL WHERE id = ?`)
    .run(hash, row.id);
  return getStudent(row.id);
}

function listPendingStudents() {
  const rows = db.prepare("SELECT * FROM students WHERE status = 'pending' ORDER BY created_at DESC").all();
  return rows.map(rowToStudent);
}

function setStudentStatus(id, status) {
  const allowed = new Set(['pending', 'approved', 'rejected']);
  if (!allowed.has(status)) throw new Error('وضعیت نامعتبر است');
  db.prepare('UPDATE students SET status = ? WHERE id = ?').run(status, id);
  return getStudent(id);
}

function deleteStudent(id) {
  const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!student) return;
  const paymentFiles = db.prepare('SELECT image_url FROM payments WHERE student_id = ?').all(id);
  const docFiles = db.prepare('SELECT url FROM medical_docs WHERE student_id = ?').all(id);
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM comments WHERE author_student_id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE log_id IN (SELECT id FROM logs WHERE student_id = ?)').run(id);
    db.prepare('DELETE FROM logs WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM payments WHERE student_id = ?').run(id);
    db.prepare("DELETE FROM assignments WHERE target_type = 'student' AND target_id = ?").run(id);
    db.prepare('DELETE FROM goals WHERE student_id = ?').run(id);
    db.prepare('DELETE FROM students WHERE id = ?').run(id);
  });
  transaction();
  paymentFiles.forEach(p => {
    if (p.image_url) {
      const rel = p.image_url.replace(/^\//, '');
      const abs = path.join(__dirname, '..', rel);
      fs.promises.unlink(abs).catch(() => {});
    }
  });
  docFiles.forEach(d => {
    if (d.url) {
      const rel = d.url.replace(/^\//, '');
      const abs = path.join(__dirname, '..', rel);
      fs.promises.unlink(abs).catch(() => {});
    }
  });
}

function markStudentVerified(id) {
  db.prepare('UPDATE students SET verified_at = ?, verification_code = NULL, verification_expires_at = NULL WHERE id = ?')
    .run(now(), id);
  return getStudent(id);
}

function markStudentPhoneVerified(id) {
  db.prepare('UPDATE students SET phone_verified_at = ?, phone_verification_code = NULL, phone_verification_expires_at = NULL WHERE id = ?')
    .run(now(), id);
  return getStudent(id);
}

function startEmailVerification(studentId) {
  const student = db.prepare('SELECT id, email FROM students WHERE id = ?').get(studentId);
  if (!student) throw new Error('Student not found');
  if (!student.email) throw new Error('ایمیل برای این شاگرد ثبت نشده است');
  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000;
  db.prepare('UPDATE students SET verification_code = ?, verification_expires_at = ? WHERE id = ?')
    .run(code, String(expiresAt), studentId);
  return { code, expiresAt };
}

function verifyStudentEmail(studentId, code) {
  const student = db.prepare('SELECT verification_code, verification_expires_at FROM students WHERE id = ?').get(studentId);
  if (!student || !student.verification_code) return false;
  const expires = parseInt(student.verification_expires_at || '0', 10);
  const ok = student.verification_code === String(code).trim() && Date.now() <= expires;
  if (ok) {
    markStudentVerified(studentId);
    return true;
  }
  return false;
}

function startPhoneVerification(studentId) {
  const student = db.prepare('SELECT id, phone FROM students WHERE id = ?').get(studentId);
  if (!student) throw new Error('Student not found');
  if (!student.phone) throw new Error('شماره موبایل برای این شاگرد ثبت نشده است');
  const code = String(Math.floor(100000 + Math.random() * 900000)).padStart(6, '0');
  const expiresAt = Date.now() + 10 * 60 * 1000;
  db.prepare('UPDATE students SET phone_verification_code = ?, phone_verification_expires_at = ? WHERE id = ?')
    .run(code, String(expiresAt), studentId);
  return { code, expiresAt };
}

function verifyStudentPhone(studentId, code) {
  const student = db.prepare('SELECT phone_verification_code, phone_verification_expires_at FROM students WHERE id = ?').get(studentId);
  if (!student || !student.phone_verification_code) return false;
  const expires = parseInt(student.phone_verification_expires_at || '0', 10);
  const ok = student.phone_verification_code === String(code).trim() && Date.now() <= expires;
  if (ok) {
    markStudentPhoneVerified(studentId);
    return true;
  }
  return false;
}

function getProfile(studentId) {
  const student = db.prepare('SELECT profile_json FROM students WHERE id = ?').get(studentId);
  return student ? parseJSON(student.profile_json, {}) : {};
}

function updateProfile(studentId, patch) {
  const current = getProfile(studentId);
  const next = Object.assign({}, current || {}, patch || {});
  db.prepare('UPDATE students SET profile_json = ? WHERE id = ?').run(JSON.stringify(next), studentId);
  return next;
}

// Programs -------------------------------------------------------------------

function rowToProgram(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    week: normalizeWeek(parseJSON(row.week_json, [])),
    createdAt: row.created_at,
  };
}

function listPrograms() {
  const rows = db.prepare('SELECT * FROM programs ORDER BY created_at DESC').all();
  return rows.map(rowToProgram);
}

function getProgram(id) {
  const row = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
  return row ? rowToProgram(row) : null;
}

function addProgram({ title, description, week }) {
  if (!title) throw new Error('عنوان الزامی است');
  const id = genId('prg');
  db.prepare('INSERT INTO programs(id, title, description, week_json, created_at) VALUES(?,?,?,?,?)')
    .run(id, title, description || '', JSON.stringify(normalizeWeek(week)), now());
  return getProgram(id);
}

function updateProgram(id, patch) {
  const program = db.prepare('SELECT * FROM programs WHERE id = ?').get(id);
  if (!program) throw new Error('Program not found');
  const next = {
    title: patch.title ?? program.title,
    description: patch.description ?? program.description,
    week_json: patch.week ? JSON.stringify(normalizeWeek(patch.week)) : program.week_json,
  };
  db.prepare('UPDATE programs SET title = ?, description = ?, week_json = ? WHERE id = ?')
    .run(next.title, next.description, next.week_json, id);
  return getProgram(id);
}

function deleteProgram(id) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM assignments WHERE program_id = ?').run(id);
    db.prepare('UPDATE logs SET program_id = NULL WHERE program_id = ?').run(id);
    db.prepare('DELETE FROM programs WHERE id = ?').run(id);
  });
  transaction();
}

// Groups ---------------------------------------------------------------------

function listGroups() {
  const groups = db.prepare('SELECT * FROM groups ORDER BY created_at DESC').all();
  const members = db.prepare('SELECT id, group_id FROM students WHERE group_id IS NOT NULL').all();
  const map = new Map();
  members.forEach(m => {
    if (!map.has(m.group_id)) map.set(m.group_id, []);
    map.get(m.group_id).push(m.id);
  });
  return groups.map(g => ({
    id: g.id,
    name: g.name,
    createdAt: g.created_at,
    studentIds: map.get(g.id) || [],
  }));
}

function addGroup({ name }) {
  if (!name) throw new Error('نام گروه الزامی است');
  const id = genId('grp');
  db.prepare('INSERT INTO groups(id, name, created_at) VALUES(?,?,?)')
    .run(id, name, now());
  return listGroups().find(g => g.id === id);
}

function updateGroup(id, patch) {
  db.prepare('UPDATE groups SET name = ? WHERE id = ?').run(patch.name, id);
  return listGroups().find(g => g.id === id);
}

function deleteGroup(id) {
  const transaction = db.transaction(() => {
    db.prepare('UPDATE students SET group_id = NULL WHERE group_id = ?').run(id);
    db.prepare("DELETE FROM assignments WHERE target_type = 'group' AND target_id = ?").run(id);
    db.prepare('DELETE FROM groups WHERE id = ?').run(id);
  });
  transaction();
}

// Assignments ----------------------------------------------------------------

function listAssignments() {
  return db.prepare('SELECT * FROM assignments ORDER BY created_at DESC').all().map(a => ({
    id: a.id,
    programId: a.program_id,
    targetType: a.target_type,
    targetId: a.target_id,
    startDate: a.start_date,
    endDate: a.end_date,
    durationDays: a.duration_days,
    createdAt: a.created_at,
  }));
}

function listAssignmentsForStudent(studentId) {
  const student = getStudent(studentId);
  if (!student) return [];
  const direct = db.prepare("SELECT * FROM assignments WHERE target_type = 'student' AND target_id = ?").all(studentId);
  let groupAssignments = [];
  if (student.groupId) {
    groupAssignments = db.prepare("SELECT * FROM assignments WHERE target_type = 'group' AND target_id = ?").all(student.groupId);
  }
  return [...direct, ...groupAssignments].map(a => ({
    id: a.id,
    programId: a.program_id,
    targetType: a.target_type,
    targetId: a.target_id,
    startDate: a.start_date,
    endDate: a.end_date,
    durationDays: a.duration_days,
    createdAt: a.created_at,
  }));
}

function addAssignment({ programId, targetType, targetId, startDate, durationDays }) {
  if (!programId || !targetType || !targetId) throw new Error('برنامه و هدف الزامی است');
  const id = genId('asg');
  const start = startDate || now().slice(0, 10);
  const duration = Math.max(1, parseInt(durationDays || 7, 10));
  const end = computeEndDate(start, duration);
  db.prepare('INSERT INTO assignments(id, program_id, target_type, target_id, start_date, end_date, duration_days, created_at) VALUES(?,?,?,?,?,?,?,?)')
    .run(id, programId, targetType, targetId, start, end, duration, now());
  return listAssignments().find(a => a.id === id);
}

function getProgramsForStudent(studentId) {
  const assignments = listAssignmentsForStudent(studentId);
  const programIds = [...new Set(assignments.map(a => a.programId).filter(Boolean))];
  if (!programIds.length) return [];
  return programIds.map(pid => getProgram(pid)).filter(Boolean);
}

function updateAssignmentDates(id, { startDate, durationDays }) {
  const current = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  if (!current) throw new Error('Assignment not found');
  const start = startDate || current.start_date || now().slice(0, 10);
  const duration = durationDays != null ? Math.max(1, parseInt(durationDays, 10) || 7) : current.duration_days || 7;
  const end = computeEndDate(start, duration);
  db.prepare('UPDATE assignments SET start_date = ?, end_date = ?, duration_days = ? WHERE id = ?')
    .run(start, end, duration, id);
  return listAssignments().find(a => a.id === id);
}

function deleteAssignment(id) {
  db.prepare('DELETE FROM assignments WHERE id = ?').run(id);
}

// Payments -------------------------------------------------------------------

function rowToPayment(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    note: row.note || '',
    month: row.month || null,
    monthJalali: row.month_jalali || null,
    imageUrl: row.image_url || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listPayments() {
  const rows = db.prepare('SELECT * FROM payments ORDER BY created_at DESC').all();
  return rows.map(rowToPayment);
}

function listPaymentsForStudent(studentId) {
  const rows = db.prepare('SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
  return rows.map(rowToPayment);
}

function addPayment({ studentId, note, month, monthJalali, imageUrl }) {
  if (!studentId) throw new Error('studentId الزامی است');
  const id = genId('pay');
  const ts = now();
  db.prepare('INSERT INTO payments(id, student_id, note, month, month_jalali, image_url, created_at, updated_at) VALUES(?,?,?,?,?,?,?,?)')
    .run(id, studentId, note || '', month || null, monthJalali || null, imageUrl || null, ts, ts);
  return rowToPayment(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
}

function updatePayment(id, patch) {
  const current = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  if (!current) throw new Error('Payment not found');
  db.prepare('UPDATE payments SET note = ?, month = ?, month_jalali = ?, image_url = ?, updated_at = ? WHERE id = ?')
    .run(
      patch.note ?? current.note,
      patch.month ?? current.month,
      patch.monthJalali ?? current.month_jalali,
      patch.imageUrl ?? current.image_url,
      now(),
      id,
    );
  return rowToPayment(db.prepare('SELECT * FROM payments WHERE id = ?').get(id));
}

function deletePayment(id) {
  const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
  if (!payment) return;
  if (payment.image_url) {
    const rel = payment.image_url.replace(/^\//, '');
    const abs = path.join(__dirname, '..', rel);
    fs.promises.unlink(abs).catch(() => {});
  }
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
}

// Goals & milestones ---------------------------------------------------------

function rowToGoal(row) {
  const milestones = db.prepare('SELECT * FROM goal_milestones WHERE goal_id = ?').all(row.id).map(m => ({
    id: m.id,
    text: m.text || '',
    done: !!m.done,
  }));
  return {
    id: row.id,
    studentId: row.student_id,
    title: row.title,
    targetDistanceKm: row.target_distance_km,
    targetDurationSec: row.target_duration_sec,
    targetPaceSecPerKm: row.target_pace_sec_per_km,
    createdAt: row.created_at,
    milestones,
  };
}

function listGoals(studentId) {
  const rows = db.prepare('SELECT * FROM goals WHERE student_id = ? ORDER BY created_at DESC').all(studentId);
  return rows.map(rowToGoal);
}

function addGoal({ studentId, title, targetDistanceKm, targetDurationSec, targetPaceSecPerKm }) {
  if (!studentId) throw new Error('studentId الزامی است');
  const id = genId('goal');
  db.prepare('INSERT INTO goals(id, student_id, title, target_distance_km, target_duration_sec, target_pace_sec_per_km, created_at) VALUES(?,?,?,?,?,?,?)')
    .run(id, studentId, title || '', targetDistanceKm ?? null, targetDurationSec ?? null, targetPaceSecPerKm ?? null, now());
  return rowToGoal(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
}

function updateGoal(id, patch) {
  const current = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  if (!current) throw new Error('Goal not found');
  db.prepare('UPDATE goals SET title = ?, target_distance_km = ?, target_duration_sec = ?, target_pace_sec_per_km = ? WHERE id = ?')
    .run(
      patch.title ?? current.title,
      patch.targetDistanceKm ?? current.target_distance_km,
      patch.targetDurationSec ?? current.target_duration_sec,
      patch.targetPaceSecPerKm ?? current.target_pace_sec_per_km,
      id,
    );
  return rowToGoal(db.prepare('SELECT * FROM goals WHERE id = ?').get(id));
}

function deleteGoal(id) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM goal_milestones WHERE goal_id = ?').run(id);
    db.prepare('DELETE FROM goals WHERE id = ?').run(id);
  });
  transaction();
}

function addMilestone(goalId, text) {
  const id = genId('ms');
  db.prepare('INSERT INTO goal_milestones(id, goal_id, text, done) VALUES(?,?,?,0)').run(id, goalId, text || '');
  const row = db.prepare('SELECT * FROM goal_milestones WHERE id = ?').get(id);
  return { id: row.id, text: row.text || '', done: !!row.done };
}

function updateMilestone(goalId, milestoneId, text) {
  db.prepare('UPDATE goal_milestones SET text = ? WHERE id = ? AND goal_id = ?').run(text || '', milestoneId, goalId);
  const row = db.prepare('SELECT * FROM goal_milestones WHERE id = ?').get(milestoneId);
  return row ? { id: row.id, text: row.text || '', done: !!row.done } : null;
}

function toggleMilestone(goalId, milestoneId, done) {
  db.prepare('UPDATE goal_milestones SET done = ? WHERE id = ? AND goal_id = ?').run(done ? 1 : 0, milestoneId, goalId);
  const row = db.prepare('SELECT * FROM goal_milestones WHERE id = ?').get(milestoneId);
  return row ? { id: row.id, text: row.text || '', done: !!row.done } : null;
}

function deleteMilestone(goalId, milestoneId) {
  db.prepare('DELETE FROM goal_milestones WHERE id = ? AND goal_id = ?').run(milestoneId, goalId);
}

// Medical docs ---------------------------------------------------------------

function addMedicalDoc(studentId, { name, url }) {
  const id = genId('mdoc');
  db.prepare('INSERT INTO medical_docs(id, student_id, name, url, uploaded_at) VALUES(?,?,?,?,?)')
    .run(id, studentId, name || 'سند', url, now());
  return db.prepare('SELECT * FROM medical_docs WHERE id = ?').get(id);
}

function listMedicalDocs(studentId) {
  return db.prepare('SELECT * FROM medical_docs WHERE student_id = ? ORDER BY uploaded_at DESC').all(studentId);
}

function deleteMedicalDoc(studentId, docId) {
  const doc = db.prepare('SELECT * FROM medical_docs WHERE id = ? AND student_id = ?').get(docId, studentId);
  if (!doc) return;
  if (doc.url) {
    const rel = doc.url.replace(/^\//, '');
    const abs = path.join(__dirname, '..', rel);
    fs.promises.unlink(abs).catch(() => {});
  }
  db.prepare('DELETE FROM medical_docs WHERE id = ? AND student_id = ?').run(docId, studentId);
}

// Logs -----------------------------------------------------------------------

function rowToLog(row) {
  return {
    id: row.id,
    studentId: row.student_id,
    date: row.date,
    assignmentId: row.assignment_id,
    programId: row.program_id,
    dayKey: row.day_key,
    mood: row.mood,
    moodEmoji: row.mood_emoji,
    sleepQuality: row.sleep_quality,
    sleepHours: row.sleep_hours,
    nutrition: row.nutrition,
    hydration: row.hydration,
    rpe: row.rpe,
    distanceKm: row.distance_km,
    durationSec: row.duration_sec,
    hrAvg: row.hr_avg,
    location: row.location,
    shoe: row.shoe,
    companions: row.companions,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function listLogsForStudent(studentId) {
  const rows = db.prepare('SELECT * FROM logs WHERE student_id = ? ORDER BY date DESC, created_at DESC').all(studentId);
  return rows.map(rowToLog);
}

function addLog(studentId, payload) {
  const id = genId('log');
  const ts = now();
  db.prepare(`
    INSERT INTO logs(
      id, student_id, date, assignment_id, program_id, day_key,
      mood, mood_emoji, sleep_quality, sleep_hours, nutrition, hydration, rpe,
      distance_km, duration_sec, hr_avg, location, shoe, companions, note,
      created_at, updated_at
    ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).run(
    id,
    studentId,
    payload.date || null,
    payload.assignmentId || null,
    payload.programId || null,
    payload.dayKey || null,
    payload.mood != null ? Number(payload.mood) : null,
    payload.moodEmoji || null,
    payload.sleepQuality != null ? Number(payload.sleepQuality) : null,
    payload.sleepHours != null ? Number(payload.sleepHours) : null,
    payload.nutrition != null ? Number(payload.nutrition) : null,
    payload.hydration != null ? Number(payload.hydration) : null,
    payload.rpe != null ? Number(payload.rpe) : null,
    payload.distanceKm != null ? Number(payload.distanceKm) : null,
    payload.durationSec != null ? Number(payload.durationSec) : null,
    payload.hrAvg != null ? Number(payload.hrAvg) : null,
    payload.location || '',
    payload.shoe || '',
    payload.companions || '',
    payload.note || '',
    ts,
    ts,
  );
  return rowToLog(db.prepare('SELECT * FROM logs WHERE id = ?').get(id));
}

function updateLog(id, patch) {
  const current = db.prepare('SELECT * FROM logs WHERE id = ?').get(id);
  if (!current) throw new Error('Log not found');
  const ts = now();
  db.prepare(`
    UPDATE logs SET
      date = ?, assignment_id = ?, program_id = ?, day_key = ?,
      mood = ?, mood_emoji = ?, sleep_quality = ?, sleep_hours = ?, nutrition = ?, hydration = ?, rpe = ?,
      distance_km = ?, duration_sec = ?, hr_avg = ?, location = ?, shoe = ?, companions = ?, note = ?, updated_at = ?
    WHERE id = ?
  `).run(
    patch.date ?? current.date,
    patch.assignmentId ?? current.assignment_id,
    patch.programId ?? current.program_id,
    patch.dayKey ?? current.day_key,
    patch.mood != null ? Number(patch.mood) : current.mood,
    patch.moodEmoji ?? current.mood_emoji,
    patch.sleepQuality != null ? Number(patch.sleepQuality) : current.sleep_quality,
    patch.sleepHours != null ? Number(patch.sleepHours) : current.sleep_hours,
    patch.nutrition != null ? Number(patch.nutrition) : current.nutrition,
    patch.hydration != null ? Number(patch.hydration) : current.hydration,
    patch.rpe != null ? Number(patch.rpe) : current.rpe,
    patch.distanceKm != null ? Number(patch.distanceKm) : current.distance_km,
    patch.durationSec != null ? Number(patch.durationSec) : current.duration_sec,
    patch.hrAvg != null ? Number(patch.hrAvg) : current.hr_avg,
    patch.location ?? current.location,
    patch.shoe ?? current.shoe,
    patch.companions ?? current.companions,
    patch.note ?? current.note,
    ts,
    id,
  );
  return rowToLog(db.prepare('SELECT * FROM logs WHERE id = ?').get(id));
}

function deleteLog(id) {
  const transaction = db.transaction(() => {
    db.prepare('DELETE FROM comments WHERE log_id = ?').run(id);
    db.prepare('DELETE FROM logs WHERE id = ?').run(id);
  });
  transaction();
}

// Comments -------------------------------------------------------------------

function listCommentsForLog(logId) {
  return db.prepare('SELECT * FROM comments WHERE log_id = ? ORDER BY created_at ASC').all(logId).map(c => ({
    id: c.id,
    logId: c.log_id,
    programId: c.program_id,
    dayKey: c.day_key,
    author: c.author,
    authorName: c.author_name,
    authorStudentId: c.author_student_id,
    text: c.text,
    createdAt: c.created_at,
  }));
}

function addComment({ logId, programId, dayKey, author, authorName, authorStudentId, text }) {
  const id = genId('cmt');
  db.prepare('INSERT INTO comments(id, log_id, program_id, day_key, author, author_name, author_student_id, text, created_at) VALUES(?,?,?,?,?,?,?,?,?)')
    .run(id, logId || null, programId || null, dayKey || null, author || 'coach', authorName || '', authorStudentId || null, text || '', now());
  return db.prepare('SELECT * FROM comments WHERE id = ?').get(id);
}

function listDayComments(programId, studentId, dayKey) {
  return db.prepare('SELECT * FROM comments WHERE log_id IS NULL AND program_id = ? AND author_student_id = ? AND day_key = ? ORDER BY created_at ASC')
    .all(programId, studentId, dayKey)
    .map(c => ({
      id: c.id,
      programId: c.program_id,
      author: c.author,
      authorName: c.author_name,
      authorStudentId: c.author_student_id,
      dayKey: c.day_key,
      text: c.text,
      createdAt: c.created_at,
    }));
}

function addDayComment({ programId, studentId, dayKey, author, authorName, text }) {
  return addComment({ programId, dayKey, author, authorName, authorStudentId: studentId, text, logId: null });
}

function defaultWeek() {
  return normalizeWeek([]);
}

function seedDemo() {
  const hasData = db.prepare('SELECT COUNT(*) as cnt FROM programs').get().cnt;
  if (hasData) return;
  const group = addGroup({ name: 'گروه A' });
  const studentA = addStudent({ name: 'علی رضایی', email: 'ali@example.com', groupId: group.id });
  const studentB = addStudent({ name: 'سارا احمدی', email: 'sara@example.com', groupId: group.id });
  const program1 = addProgram({
    title: 'برنامه پایه',
    description: 'سه روز تمرین',
    week: [
      { key: 'sat', content: 'بالا تنه' },
      { key: 'mon', content: 'پایین تنه' },
      { key: 'wed', content: 'کاردیو' },
    ],
  });
  const program2 = addProgram({
    title: 'کاردیو سبک',
    description: 'پیاده‌روی روزانه',
    week: [
      { key: 'sun', content: '۲۰ دقیقه پیاده‌روی' },
      { key: 'tue', content: '۲۰ دقیقه پیاده‌روی' },
      { key: 'thu', content: '۲۰ دقیقه پیاده‌روی' },
    ],
  });
  addAssignment({ programId: program1.id, targetType: 'group', targetId: group.id, durationDays: 7 });
  addAssignment({ programId: program2.id, targetType: 'student', targetId: studentA.id, durationDays: 7 });
  return { group, studentA, studentB, program1, program2 };
}

module.exports = {
  listStudents,
  getStudent,
  getStudentByEmail,
  getStudentByPhone,
  addStudent,
  updateStudent,
  deleteStudent,
  markStudentVerified,
  markStudentPhoneVerified,
  createPendingStudent,
  confirmStudentSignupByEmail,
  authenticateStudent,
  setStudentPassword,
  registerStudent,
  createStudentResetToken,
  resetStudentPasswordWithToken,
  listPendingStudents,
  setStudentStatus,
  startEmailVerification,
  verifyStudentEmail,
  startPhoneVerification,
  verifyStudentPhone,
  getProfile,
  updateProfile,

  listPrograms,
  getProgram,
  addProgram,
  updateProgram,
  deleteProgram,

  listGroups,
  addGroup,
  updateGroup,
  deleteGroup,

  listAssignments,
  listAssignmentsForStudent,
  addAssignment,
  updateAssignmentDates,
  deleteAssignment,
  getProgramsForStudent,

  listPayments,
  listPaymentsForStudent,
  addPayment,
  updatePayment,
  deletePayment,

  listGoals,
  addGoal,
  updateGoal,
  deleteGoal,
  addMilestone,
  updateMilestone,
  toggleMilestone,
  deleteMilestone,

  addMedicalDoc,
  listMedicalDocs,
  deleteMedicalDoc,

  listLogsForStudent,
  addLog,
  updateLog,
  deleteLog,

  listCommentsForLog,
  addComment,
  listDayComments,
  addDayComment,

  countAdmins,
  createAdmin,
  listAdmins,
  getAdminByEmail,
  getAdminById,
  updateAdmin,
  deleteAdmin,
  countSuperAdminsExcluding,
  listCoaches,
  createCoach,
  getCoachByEmail,
  getCoachById,
  updateCoach,
  deleteCoach,
  authenticateCoach,

  defaultWeek,
  seedDemo,

  WEEK_ORDER,
};
