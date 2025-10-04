const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'db.sqlite'));
db.pragma('journal_mode = WAL');

// ساخت جداول
db.exec(`
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  name TEXT,
  email TEXT UNIQUE,
  verified_at TEXT,
  profile_json TEXT
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  title TEXT,
  target_distance_km REAL,
  target_duration_sec INTEGER,
  target_pace_sec_per_km INTEGER,
  created_at TEXT
);
CREATE TABLE IF NOT EXISTS medical_docs (
  id TEXT PRIMARY KEY,
  student_id TEXT,
  name TEXT,
  url TEXT,
  uploaded_at TEXT
);
`);

function now() { return new Date().toISOString(); }
function genId(prefix){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }

// Students
function listStudents(){
  return db.prepare('SELECT id,name,email,verified_at,profile_json FROM students ORDER BY name').all();
}
function getStudent(id){
  return db.prepare('SELECT id,name,email,verified_at,profile_json FROM students WHERE id=?').get(id);
}
function addStudent({name,email}){
  const id = genId('std');
  db.prepare('INSERT INTO students(id,name,email,verified_at,profile_json) VALUES(?,?,?,?,?)')
    .run(id, name, email, null, JSON.stringify({}));
  return getStudent(id);
}
function updateStudent(id, { name, email }){
  const cur = getStudent(id); if(!cur) throw new Error('not found');
  db.prepare('UPDATE students SET name=?, email=? WHERE id=?')
    .run(name ?? cur.name, email ?? cur.email, id);
  return getStudent(id);
}

// Profile
function getProfile(studentId){
  const s = getStudent(studentId); if(!s) return {};
  return s.profile_json ? JSON.parse(s.profile_json) : {};
}
function updateProfile(studentId, patch){
  const s = getStudent(studentId); if(!s) throw new Error('not found');
  const cur = s.profile_json ? JSON.parse(s.profile_json) : {};
  const next = Object.assign({}, cur, patch || {});
  db.prepare('UPDATE students SET profile_json=? WHERE id=?')
    .run(JSON.stringify(next), studentId);
  return next;
}

// Medical docs
function addMedicalDoc(studentId, { name, url }){
  const id = genId('mdoc');
  db.prepare('INSERT INTO medical_docs(id,student_id,name,url,uploaded_at) VALUES (?,?,?,?,?)')
    .run(id, studentId, name || 'سند', url, now());
  return db.prepare('SELECT * FROM medical_docs WHERE id=?').get(id);
}
function listMedicalDocs(studentId){
  return db.prepare('SELECT * FROM medical_docs WHERE student_id=? ORDER BY uploaded_at DESC').all(studentId);
}
function deleteMedicalDoc(studentId, docId){
  db.prepare('DELETE FROM medical_docs WHERE id=? AND student_id=?').run(docId, studentId);
}

// Goals
function listGoals(studentId){
  return db.prepare('SELECT * FROM goals WHERE student_id=? ORDER BY created_at DESC').all(studentId);
}
function addGoal({ studentId, title, targetDistanceKm, targetDurationSec, targetPaceSecPerKm }){
  const id = genId('goal');
  db.prepare('INSERT INTO goals(id, student_id, title, target_distance_km, target_duration_sec, target_pace_sec_per_km, created_at) VALUES (?,?,?,?,?,?,?)')
    .run(id, studentId, title, targetDistanceKm ?? null, targetDurationSec ?? null, targetPaceSecPerKm ?? null, now());
  return db.prepare('SELECT * FROM goals WHERE id=?').get(id);
}
function updateGoal(id, patch){
  const g = db.prepare('SELECT * FROM goals WHERE id=?').get(id); if(!g) throw new Error('not found');
  db.prepare('UPDATE goals SET title=?, target_distance_km=?, target_duration_sec=?, target_pace_sec_per_km=? WHERE id=?')
    .run(patch.title ?? g.title, patch.targetDistanceKm ?? g.target_distance_km, patch.targetDurationSec ?? g.target_duration_sec, patch.targetPaceSecPerKm ?? g.target_pace_sec_per_km, id);
  return db.prepare('SELECT * FROM goals WHERE id=?').get(id);
}
function deleteGoal(id){
  db.prepare('DELETE FROM goals WHERE id=?').run(id);
}

module.exports = {
  listStudents, getStudent, addStudent, updateStudent,
  getProfile, updateProfile,
  addMedicalDoc, listMedicalDocs, deleteMedicalDoc,
  listGoals, addGoal, updateGoal, deleteGoal
};
