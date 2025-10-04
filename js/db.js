// Simple localStorage-backed DB
(function () {
  const DB_KEY = 'coach_student_app_db_v1';

  function now() { return new Date().toISOString(); }
  function genId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  const WEEK_ORDER = [
    { key: 'sat', label: 'شنبه' },
    { key: 'sun', label: 'یکشنبه' },
    { key: 'mon', label: 'دوشنبه' },
    { key: 'tue', label: 'سه‌شنبه' },
    { key: 'wed', label: 'چهارشنبه' },
    { key: 'thu', label: 'پنجشنبه' },
    { key: 'fri', label: 'جمعه' },
  ];

  function defaultWeek() {
    return WEEK_ORDER.map(d => ({ key: d.key, label: d.label, content: '' }));
  }

  function normalizeWeek(week) {
    const base = defaultWeek();
    if (!Array.isArray(week)) return base;
    const map = new Map(week.map(d => [d.key, d.content || '']));
    return base.map(d => ({ key: d.key, label: d.label, content: map.get(d.key) || '' }));
  }

  function loadDB() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      const base = { programs: [], groups: [], students: [], assignments: [], payments: [], goals: [], logs: [], comments: [] };
      if (!raw) return initDB();
      const parsed = JSON.parse(raw);
      // merge defaults to avoid wiping older versions on schema evolve
      const db = Object.assign({}, base, parsed);
      // Normalize missing arrays
      db.programs = Array.isArray(db.programs) ? db.programs : [];
      db.groups = Array.isArray(db.groups) ? db.groups : [];
      db.students = Array.isArray(db.students) ? db.students : [];
      db.assignments = Array.isArray(db.assignments) ? db.assignments : [];
      db.payments = Array.isArray(db.payments) ? db.payments : [];
      db.goals = Array.isArray(db.goals) ? db.goals : [];
      db.logs = Array.isArray(db.logs) ? db.logs : [];
      db.comments = Array.isArray(db.comments) ? db.comments : [];
      return db;
    } catch (e) {
      console.warn('DB load error, re-init', e);
      return initDB();
    }
  }

  function initDB() {
    const empty = { programs: [], groups: [], students: [], assignments: [], payments: [], goals: [], logs: [], comments: [] };
    saveDB(empty);
    return empty;
  }

  function saveDB(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  // Program operations
  function addProgram({ title, description, week }) {
    const db = loadDB();
    const program = { id: genId('prg'), title, description: description || '', week: normalizeWeek(week), createdAt: now() };
    db.programs.unshift(program);
    saveDB(db);
    return program;
  }
  function updateProgram(id, patch) {
    const db = loadDB();
    const p = db.programs.find(x => x.id === id);
    if (!p) throw new Error('Program not found');
    if (patch.title != null) p.title = String(patch.title);
    if (patch.description != null) p.description = String(patch.description);
    if (patch.week != null) p.week = normalizeWeek(patch.week);
    saveDB(db);
    return p;
  }
  function deleteProgram(id) {
    const db = loadDB();
    db.programs = db.programs.filter(p => p.id !== id);
    db.assignments = db.assignments.filter(a => a.programId !== id);
    saveDB(db);
  }

  // Group operations
  function addGroup({ name }) {
    const db = loadDB();
    const group = { id: genId('grp'), name, studentIds: [] };
    db.groups.unshift(group);
    saveDB(db);
    return group;
  }
  function updateGroup(id, patch) {
    const db = loadDB();
    const g = db.groups.find(x => x.id === id);
    if (!g) throw new Error('Group not found');
    if (patch.name != null) g.name = String(patch.name);
    saveDB(db);
    return g;
  }
  function deleteGroup(id) {
    const db = loadDB();
    db.groups = db.groups.filter(g => g.id !== id);
    db.assignments = db.assignments.filter(a => !(a.targetType === 'group' && a.targetId === id));
    saveDB(db);
  }

  function addStudent({ name, email, groupId }) {
    const db = loadDB();
    // prevent duplicate email
    const exists = db.students.find(s => s.email.toLowerCase() === email.toLowerCase());
    if (exists) throw new Error('این ایمیل قبلاً ثبت شده است');
    const student = { id: genId('std'), name, email, verifiedAt: null, verification: null };
    db.students.unshift(student);
    const g = db.groups.find(g => g.id === groupId);
    if (g) g.studentIds.unshift(student.id);
    saveDB(db);
    return student;
  }
  function updateStudent(id, patch) {
    const db = loadDB();
    const s = db.students.find(x => x.id === id);
    if (!s) throw new Error('Student not found');
    if (patch.email && db.students.some(o => o.id !== id && o.email.toLowerCase() === String(patch.email).toLowerCase())) {
      throw new Error('این ایمیل قبلاً ثبت شده است');
    }
    if (patch.name != null) s.name = String(patch.name);
    if (patch.email != null) s.email = String(patch.email);
    if (patch.profile) {
      s.profile = Object.assign({}, s.profile || {}, normalizeProfile(patch.profile));
    }
    if (patch.groupId !== undefined) {
      db.groups.forEach(g => { g.studentIds = g.studentIds.filter(sid => sid !== id); });
      const newG = db.groups.find(g => g.id === patch.groupId);
      if (newG) newG.studentIds.unshift(id);
    }
    saveDB(db);
    return s;
  }
  function deleteStudent(id) {
    const db = loadDB();
    db.students = db.students.filter(s => s.id !== id);
    db.groups.forEach(g => g.studentIds = g.studentIds.filter(sid => sid !== id));
    db.assignments = db.assignments.filter(a => !(a.targetType === 'student' && a.targetId === id));
    db.payments = db.payments.filter(p => p.studentId !== id);
    db.goals = db.goals.filter(g => g.studentId !== id);
    db.comments = db.comments.filter(c => c.authorStudentId !== id);
    saveDB(db);
  }

  function pad2(n){ return (n<10?'0':'') + n; }
  function computeEndDate(startDate, durationDays) {
    try {
      const [y,m,d] = (startDate||'').split('-').map(x=>parseInt(x,10));
      if (!y || !m || !d) return null;
      const dt = new Date(y, m-1, d);
      dt.setHours(12,0,0,0); // mitigate DST edge cases
      dt.setDate(dt.getDate() + Math.max(1, durationDays || 7) - 1);
      const yy = dt.getFullYear();
      const mm = pad2(dt.getMonth()+1);
      const dd = pad2(dt.getDate());
      return `${yy}-${mm}-${dd}`;
    } catch { return null; }
  }

  function assignProgramToGroup(programId, groupId, opts = {}) {
    const db = loadDB();
    const { startDate, durationDays = 7 } = opts;
    // avoid duplicate exact assignment for same time window
    const dup = db.assignments.find(a => a.programId === programId && a.targetType === 'group' && a.targetId === groupId && (!a.startDate || a.startDate === startDate));
    if (dup) return dup;
    const sd = startDate || new Date().toISOString().slice(0,10);
    const ed = computeEndDate(sd, durationDays);
    const asg = { id: genId('asg'), programId, targetType: 'group', targetId: groupId, startDate: sd, endDate: ed, durationDays, createdAt: now() };
    db.assignments.unshift(asg);
    saveDB(db);
    return asg;
  }

  function assignProgramToStudent(programId, studentId, opts = {}) {
    const db = loadDB();
    const { startDate, durationDays = 7 } = opts;
    const dup = db.assignments.find(a => a.programId === programId && a.targetType === 'student' && a.targetId === studentId && (!a.startDate || a.startDate === startDate));
    if (dup) return dup;
    const sd = startDate || new Date().toISOString().slice(0,10);
    const ed = computeEndDate(sd, durationDays);
    const asg = { id: genId('asg'), programId, targetType: 'student', targetId: studentId, startDate: sd, endDate: ed, durationDays, createdAt: now() };
    db.assignments.unshift(asg);
    saveDB(db);
    return asg;
  }
  function updateAssignmentDates(id, { startDate, durationDays }) {
    const db = loadDB();
    const a = db.assignments.find(x => x.id === id);
    if (!a) throw new Error('Assignment not found');
    if (startDate) a.startDate = startDate;
    if (durationDays != null) a.durationDays = Math.max(1, parseInt(durationDays, 10) || 7);
    a.endDate = computeEndDate(a.startDate, a.durationDays);
    saveDB(db);
    return a;
  }
  function deleteAssignment(id) {
    const db = loadDB();
    db.assignments = db.assignments.filter(a => a.id !== id);
    saveDB(db);
  }

  // Payments
  function addPayment(studentId, { imageDataUrl, note, month, monthJalali }) {
    const db = loadDB();
    const student = db.students.find(s => s.id === studentId) || null;
    const p = { id: genId('pay'), studentId, studentEmail: student?.email || null, imageDataUrl, note: note || '', month: month || null, monthJalali: monthJalali || null, createdAt: now() };
    db.payments.unshift(p);
    saveDB(db);
    return p;
  }
  function listPayments() { return loadDB().payments; }
  function getPaymentsForStudent(studentId) {
    const db = loadDB();
    return db.payments.filter(p => p.studentId === studentId);
  }
  function updatePayment(id, patch) {
    const db = loadDB();
    const p = db.payments.find(x => x.id === id);
    if (!p) throw new Error('Payment not found');
    if (patch.note !== undefined) p.note = String(patch.note || '');
    if (patch.month !== undefined) p.month = patch.month || null;
    if (patch.monthJalali !== undefined) p.monthJalali = patch.monthJalali || null;
    if (patch.imageDataUrl !== undefined) p.imageDataUrl = patch.imageDataUrl || p.imageDataUrl;
    saveDB(db);
    return p;
  }
  function deletePayment(id) {
    const db = loadDB();
    db.payments = db.payments.filter(p => p.id !== id);
    saveDB(db);
  }

  // Goals
  function addGoal(studentId, payload) {
    const db = loadDB();
    let title = payload;
    let metrics = {};
    if (typeof payload === 'object' && payload) {
      title = payload.title || '';
      metrics = {
        targetDistanceKm: payload.targetDistanceKm != null ? Number(payload.targetDistanceKm) : null,
        targetDurationSec: payload.targetDurationSec != null ? Number(payload.targetDurationSec) : null,
        targetPaceSecPerKm: payload.targetPaceSecPerKm != null ? Number(payload.targetPaceSecPerKm) : null,
      };
    }
    const goal = { id: genId('goal'), studentId, title, milestones: [], createdAt: now(), ...metrics };
    db.goals.unshift(goal);
    saveDB(db);
    return goal;
  }
  function addMilestone(goalId, text) {
    const db = loadDB();
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    const ms = { id: genId('ms'), text, done: false };
    goal.milestones.push(ms);
    saveDB(db);
    return ms;
  }
  function toggleMilestone(goalId, milestoneId, done) {
    const db = loadDB();
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    const ms = goal.milestones.find(m => m.id === milestoneId);
    if (!ms) throw new Error('Milestone not found');
    ms.done = !!done;
    saveDB(db);
    return ms;
  }
  function updateMilestone(goalId, milestoneId, text) {
    const db = loadDB();
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    const ms = goal.milestones.find(m => m.id === milestoneId);
    if (!ms) throw new Error('Milestone not found');
    ms.text = String(text || '');
    saveDB(db);
    return ms;
  }
  function deleteMilestone(goalId, milestoneId) {
    const db = loadDB();
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) return;
    goal.milestones = goal.milestones.filter(m => m.id !== milestoneId);
    saveDB(db);
  }
  function updateGoalTitle(goalId, title) {
    const db = loadDB();
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    goal.title = String(title || '');
    saveDB(db);
    return goal;
  }
  function updateGoalMetrics(goalId, patch) {
    const db = loadDB();
    const goal = db.goals.find(g => g.id === goalId);
    if (!goal) throw new Error('Goal not found');
    if (patch.targetDistanceKm !== undefined) goal.targetDistanceKm = (patch.targetDistanceKm != null ? Number(patch.targetDistanceKm) : null);
    if (patch.targetDurationSec !== undefined) goal.targetDurationSec = (patch.targetDurationSec != null ? Number(patch.targetDurationSec) : null);
    if (patch.targetPaceSecPerKm !== undefined) goal.targetPaceSecPerKm = (patch.targetPaceSecPerKm != null ? Number(patch.targetPaceSecPerKm) : null);
    saveDB(db);
    return goal;
  }
  function deleteGoal(goalId) {
    const db = loadDB();
    db.goals = db.goals.filter(g => g.id !== goalId);
    saveDB(db);
  }
  function listGoalsForStudent(studentId) {
    const db = loadDB();
    return db.goals.filter(g => g.studentId === studentId);
  }

  // Student profile helpers
  function normalizeProfile(p){
    const out = Object.assign({}, p||{});
    if (out.gender && !['male','female'].includes(String(out.gender))) out.gender = null;
    if (out.weightKg != null) out.weightKg = Number(out.weightKg);
    if (out.heightCm != null) out.heightCm = Number(out.heightCm);
    if (out.birthISO != null) out.birthISO = String(out.birthISO || '');
    if (out.cycleApproxISO != null) out.cycleApproxISO = String(out.cycleApproxISO || '');
    if (out.photoDataUrl !== undefined) out.photoDataUrl = out.photoDataUrl ? String(out.photoDataUrl) : null;
    if (!Array.isArray(out.medicalDocs)) out.medicalDocs = (p && Array.isArray(p.medicalDocs)) ? p.medicalDocs : undefined;
    return out;
  }
  function getStudentProfile(studentId){
    const db = loadDB();
    const s = db.students.find(x=>x.id===studentId);
    return s?.profile || {};
  }
  function updateStudentProfile(studentId, patch){
    return updateStudent(studentId, { profile: patch });
  }
  function addMedicalDoc(studentId, { name, dataUrl }){
    const db = loadDB();
    const s = db.students.find(x=>x.id===studentId);
    if (!s) throw new Error('Student not found');
    if (!s.profile) s.profile = {};
    if (!Array.isArray(s.profile.medicalDocs)) s.profile.medicalDocs = [];
    const doc = { id: genId('mdoc'), name: String(name||'سند'), dataUrl: String(dataUrl||''), uploadedAt: now() };
    s.profile.medicalDocs.unshift(doc);
    saveDB(db);
    return doc;
  }
  function deleteMedicalDoc(studentId, docId){
    const db = loadDB();
    const s = db.students.find(x=>x.id===studentId);
    if (!s || !s.profile || !Array.isArray(s.profile.medicalDocs)) return;
    s.profile.medicalDocs = s.profile.medicalDocs.filter(d=>d.id!==docId);
    saveDB(db);
  }
  function listMedicalDocsForStudent(studentId){
    const p = getStudentProfile(studentId);
    return Array.isArray(p.medicalDocs) ? p.medicalDocs : [];
  }

  // Training logs
  function addLog(studentId, log) {
    const db = loadDB();
    const id = genId('log');
    const entry = Object.assign({
      id,
      studentId,
      date: log.date || new Date().toISOString().slice(0,10),
      assignmentId: log.assignmentId || null,
      programId: log.programId || null,
      dayKey: log.dayKey || null, // 'sat' | 'sun' | ...
      mood: Number(log.mood || 0),
      moodEmoji: String(log.moodEmoji || ''),
      sleepQuality: Number(log.sleepQuality || 0),
      sleepHours: log.sleepHours != null ? Number(log.sleepHours) : null,
      nutrition: Number(log.nutrition || 0),
      hydration: log.hydration != null ? Number(log.hydration) : undefined,
      rpe: log.rpe != null ? Number(log.rpe) : null,
      distanceKm: log.distanceKm != null ? Number(log.distanceKm) : null,
      durationSec: log.durationSec != null ? Number(log.durationSec) : null,
      hrAvg: log.hrAvg != null ? Number(log.hrAvg) : null,
      location: String(log.location || ''),
      shoe: String(log.shoe || ''),
      companions: String(log.companions || ''),
      note: String(log.note || ''),
      createdAt: now(),
      updatedAt: now(),
    });
    db.logs.unshift(entry);
    saveDB(db);
    return entry;
  }
  function updateLog(id, patch) {
    const db = loadDB();
    const e = db.logs.find(x => x.id === id);
    if (!e) throw new Error('Log not found');
    ['date','assignmentId','programId','dayKey','mood','moodEmoji','sleepQuality','sleepHours','nutrition','hydration','rpe','distanceKm','durationSec','hrAvg','location','shoe','companions','note']
      .forEach(k => { if (patch[k] !== undefined) e[k] = patch[k]; });
    e.updatedAt = now();
    saveDB(db);
    return e;
  }
  function deleteLog(id) {
    const db = loadDB();
    db.logs = db.logs.filter(l => l.id !== id);
    db.comments = db.comments.filter(c => c.logId !== id);
    saveDB(db);
  }
  function listLogsForStudent(studentId) {
    const db = loadDB();
    return db.logs.filter(l => l.studentId === studentId).sort((a,b)=> (b.date||'').localeCompare(a.date||''));
  }

  // Comments on logs (coach/student threads)
  function addComment({ logId, author, text, authorName, authorStudentId, programId, dayKey }) {
    const db = loadDB();
    const log = db.logs.find(l => l.id === logId);
    if (!log) throw new Error('Log not found');
    const c = {
      id: genId('cmt'),
      logId: logId || null,
      programId: programId || null,
      dayKey: dayKey || null,
      author: author === 'coach' ? 'coach' : 'student',
      authorName: String(authorName || ''),
      authorStudentId: authorStudentId || null,
      text: String(text || ''),
      createdAt: now(),
    };
    db.comments.push(c);
    saveDB(db);
    return c;
  }
  function listCommentsForLog(logId) {
    const db = loadDB();
    return db.comments.filter(c => c.logId === logId).sort((a,b)=> (a.createdAt||'').localeCompare(b.createdAt||''));
  }

  function addDayComment({ programId, studentId, dayKey, author, text, authorName }) {
    return addComment({ logId: null, programId, dayKey, author, text, authorName, authorStudentId: studentId });
  }
  function listDayComments(programId, studentId, dayKey){
    const db = loadDB();
    return db.comments.filter(c => !c.logId && c.programId === programId && c.authorStudentId === studentId && c.dayKey === dayKey)
      .sort((a,b)=> (a.createdAt||'').localeCompare(b.createdAt||''));
  }

  // Queries
  function listPrograms() { return loadDB().programs; }
  function listGroups() { return loadDB().groups; }
  function listStudents() { return loadDB().students; }
  function listAssignments() { return loadDB().assignments; }

  function listAssignmentsForStudent(studentId) {
    const db = loadDB();
    const groupIds = db.groups.filter(g => g.studentIds.includes(studentId)).map(g => g.id);
    return db.assignments.filter(a => (a.targetType === 'student' && a.targetId === studentId) || (a.targetType === 'group' && groupIds.includes(a.targetId)));
  }

  function getStudentByEmail(email) {
    const db = loadDB();
    return db.students.find(s => s.email.toLowerCase() === String(email || '').toLowerCase()) || null;
  }

  // Email verification (prototype)
  function startEmailVerification(studentId) {
    const db = loadDB();
    const s = db.students.find(x => x.id === studentId);
    if (!s) throw new Error('Student not found');
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
    s.verification = { code, expiresAt };
    saveDB(db);
    return { code, expiresAt };
  }
  function verifyStudentEmail(studentId, code) {
    const db = loadDB();
    const s = db.students.find(x => x.id === studentId);
    if (!s) throw new Error('Student not found');
    if (!s.verification) return false;
    const nowTs = Date.now();
    const ok = s.verification.code === String(code || '').trim() && nowTs <= s.verification.expiresAt;
    if (ok) {
      s.verifiedAt = now();
      s.verification = null;
      saveDB(db);
      return true;
    }
    return false;
  }
  function markStudentVerified(studentId) {
    const db = loadDB();
    const s = db.students.find(x => x.id === studentId);
    if (!s) throw new Error('Student not found');
    s.verifiedAt = now();
    s.verification = null;
    saveDB(db);
    return s;
  }

  function getProgramsForStudent(studentId) {
    const db = loadDB();
    const studentGroups = db.groups.filter(g => g.studentIds.includes(studentId)).map(g => g.id);
    const programIds = new Set();
    db.assignments.forEach(a => {
      if (a.targetType === 'student' && a.targetId === studentId) programIds.add(a.programId);
      if (a.targetType === 'group' && studentGroups.includes(a.targetId)) programIds.add(a.programId);
    });
    const programs = db.programs.filter(p => programIds.has(p.id));
    return programs;
  }

  function seedDemo() {
    const db = loadDB();
    if (db.programs.length || db.groups.length || db.students.length || db.assignments.length) return; // already seeded/used
    const p1 = addProgram({
      title: 'برنامه پایه',
      description: 'سه روز در هفته، تمرین بدنسازی',
      week: [
        { key: 'sat', content: 'بالا تنه: 3x12 شنا، 3x10 پرس' },
        { key: 'mon', content: 'پایین تنه: 3x12 اسکات، 3x10 لانج' },
        { key: 'wed', content: 'استراحت فعال: کشش و موبیلیتی' },
      ],
    });
    const p2 = addProgram({
      title: 'کاردیو سبک',
      description: '۲۰ دقیقه پیاده‌روی روزانه',
      week: [
        { key: 'sun', content: '۲۰ دقیقه پیاده‌روی' },
        { key: 'tue', content: '۲۰ دقیقه پیاده‌روی' },
        { key: 'thu', content: '۲۰ دقیقه پیاده‌روی' },
      ],
    });
    const g1 = addGroup({ name: 'گروه A' });
    const s1 = addStudent({ name: 'علی رضایی', email: 'ali@example.com', groupId: g1.id });
    const s2 = addStudent({ name: 'سارا احمدی', email: 'sara@example.com', groupId: g1.id });
    assignProgramToGroup(p1.id, g1.id);
    assignProgramToStudent(p2.id, s1.id);
    return { p1, p2, g1, s1, s2 };
  }

  // expose globally
  window.DB = {
    loadDB, saveDB, seedDemo,
    addProgram, updateProgram, deleteProgram,
    addGroup, updateGroup, deleteGroup,
    addStudent, updateStudent, deleteStudent,
    assignProgramToGroup, assignProgramToStudent, updateAssignmentDates, deleteAssignment,
    listPrograms, listGroups, listStudents, listAssignments, listAssignmentsForStudent,
    getStudentByEmail, getProgramsForStudent,
    startEmailVerification, verifyStudentEmail, markStudentVerified,
    // payments
    addPayment, listPayments, getPaymentsForStudent, updatePayment, deletePayment,
    // goals
    addGoal, addMilestone, toggleMilestone, updateMilestone, deleteMilestone, updateGoalTitle, deleteGoal, listGoalsForStudent,
    updateGoalMetrics,
    // training logs
    addLog, updateLog, deleteLog, listLogsForStudent,
    // profiles
    getStudentProfile, updateStudentProfile, addMedicalDoc, deleteMedicalDoc, listMedicalDocsForStudent,
    // comments
    addComment, listCommentsForLog, addDayComment, listDayComments,
    // week helpers
    defaultWeek,
  };
})();
