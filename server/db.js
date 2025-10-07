const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

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
      email TEXT UNIQUE NOT NULL,
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
  `);

  ensureColumn('students', 'group_id', 'TEXT');
  ensureColumn('students', 'verification_code', 'TEXT');
  ensureColumn('students', 'verification_expires_at', 'TEXT');
  ensureColumn('students', 'profile_json', 'TEXT');

  ensureColumn('payments', 'image_url', 'TEXT');
  ensureColumn('payments', 'month_jalali', 'TEXT');

  ensureColumn('logs', 'hydration', 'REAL');
}

ensureSchema();

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

// Students -------------------------------------------------------------------

function rowToStudent(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    verifiedAt: row.verified_at || null,
    groupId: row.group_id || null,
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
  const row = db.prepare('SELECT * FROM students WHERE LOWER(email) = LOWER(?)').get(email);
  return row ? rowToStudent(row) : null;
}

function addStudent({ name, email, groupId }) {
  if (!name || !email) throw new Error('نام و ایمیل الزامی است');
  const exists = db.prepare('SELECT id FROM students WHERE LOWER(email) = LOWER(?)').get(email);
  if (exists) throw new Error('این ایمیل قبلاً ثبت شده است');
  const id = genId('std');
  db.prepare('INSERT INTO students(id, name, email, verified_at, profile_json, group_id) VALUES(?,?,?,?,?,?)')
    .run(id, name, email, null, JSON.stringify({}), groupId || null);
  return getStudent(id);
}

function updateStudent(id, { name, email, groupId }) {
  const current = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
  if (!current) throw new Error('Student not found');
  if (email && email.toLowerCase() !== current.email.toLowerCase()) {
    const exists = db.prepare('SELECT id FROM students WHERE LOWER(email) = LOWER(?) AND id <> ?').get(email, id);
    if (exists) throw new Error('این ایمیل قبلاً ثبت شده است');
  }
  db.prepare('UPDATE students SET name = ?, email = ?, group_id = ? WHERE id = ?')
    .run(name ?? current.name, email ?? current.email, groupId ?? current.group_id ?? null, id);
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
    db.prepare('DELETE FROM assignments WHERE target_type = "student" AND target_id = ?').run(id);
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

function startEmailVerification(studentId) {
  const student = db.prepare('SELECT id FROM students WHERE id = ?').get(studentId);
  if (!student) throw new Error('Student not found');
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
    db.prepare('DELETE FROM assignments WHERE target_type = "group" AND target_id = ?').run(id);
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
  const direct = db.prepare('SELECT * FROM assignments WHERE target_type = "student" AND target_id = ?').all(studentId);
  let groupAssignments = [];
  if (student.groupId) {
    groupAssignments = db.prepare('SELECT * FROM assignments WHERE target_type = "group" AND target_id = ?').all(student.groupId);
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
  addStudent,
  updateStudent,
  deleteStudent,
  markStudentVerified,
  startEmailVerification,
  verifyStudentEmail,
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

  defaultWeek,
  seedDemo,

  WEEK_ORDER,
};
