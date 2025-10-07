(function () {
  const DEFAULT_WEEK = [
    { key: 'sat', label: 'شنبه' },
    { key: 'sun', label: 'یکشنبه' },
    { key: 'mon', label: 'دوشنبه' },
    { key: 'tue', label: 'سه‌شنبه' },
    { key: 'wed', label: 'چهارشنبه' },
    { key: 'thu', label: 'پنجشنبه' },
    { key: 'fri', label: 'جمعه' },
  ];

  const state = {
    programs: [],
    groups: [],
    students: [],
    assignments: [],
    payments: [],
  };

  const caches = {
    goals: new Map(), // studentId -> goals[]
    logs: new Map(), // studentId -> logs[]
    medicalDocs: new Map(), // studentId -> docs[]
    dayComments: new Map(), // key(programId|studentId|dayKey) -> comments[]
    logComments: new Map(), // logId -> comments[]
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function arrayClone(arr) {
    return Array.isArray(arr) ? arr.map(item => (item && typeof item === 'object' ? { ...item } : item)) : [];
  }

  function invalidateStudentCaches(studentId) {
    caches.goals.delete(studentId);
    caches.logs.delete(studentId);
    caches.medicalDocs.delete(studentId);
    for (const key of caches.dayComments.keys()) {
      if (key.includes(`|${studentId}|`)) caches.dayComments.delete(key);
    }
    for (const [logId, list] of caches.logComments.entries()) {
      if (list.some(c => c.authorStudentId === studentId)) caches.logComments.delete(logId);
    }
  }

  async function loadInitialData() {
    if (!window.API || !window.API_BASE) {
      console.warn('API not configured. DB layer cannot sync with server.');
      return;
    }
    const [programs, groups, students, assignments, payments] = await Promise.all([
      API.listPrograms(),
      API.listGroups(),
      API.listStudents(),
      API.listAssignments(),
      API.listPayments(),
    ]);
    state.programs = programs || [];
    state.groups = groups || [];
    state.students = students || [];
    state.assignments = assignments || [];
    state.payments = payments || [];
  }

  async function ensureGoals(studentId) {
    if (!caches.goals.has(studentId)) {
      const goals = await API.listGoalsForStudent(studentId);
      caches.goals.set(studentId, goals || []);
    }
    return caches.goals.get(studentId);
  }

  async function ensureLogs(studentId) {
    if (!caches.logs.has(studentId)) {
      const logs = await API.listLogsForStudent(studentId);
      caches.logs.set(studentId, logs || []);
    }
    return caches.logs.get(studentId);
  }

  async function ensureMedicalDocs(studentId) {
    if (!caches.medicalDocs.has(studentId)) {
      const docs = await API.listMedicalDocs(studentId);
      caches.medicalDocs.set(studentId, docs || []);
    }
    return caches.medicalDocs.get(studentId);
  }

  function keyDayComments(programId, studentId, dayKey) {
    return `${programId || ''}|${studentId || ''}|${dayKey || ''}`;
  }

  async function ensureDayComments(programId, studentId, dayKey) {
    const key = keyDayComments(programId, studentId, dayKey);
    if (!caches.dayComments.has(key)) {
      const comments = await API.listDayComments({ programId, studentId, dayKey });
      caches.dayComments.set(key, comments || []);
    }
    return caches.dayComments.get(key);
  }

  async function ensureLogComments(logId) {
    if (!caches.logComments.has(logId)) {
      const comments = await API.listComments(logId);
      caches.logComments.set(logId, comments || []);
    }
    return caches.logComments.get(logId);
  }

  function findStudent(studentId) {
    return state.students.find(s => s.id === studentId) || null;
  }

  function getGroup(groupId) {
    return state.groups.find(g => g.id === groupId) || null;
  }

  function recomputeAssignmentsForStudent(studentId) {
    const student = findStudent(studentId);
    if (!student) return [];
    const groupAssignments = student.groupId
      ? state.assignments.filter(a => a.targetType === 'group' && a.targetId === student.groupId)
      : [];
    const personalAssignments = state.assignments.filter(a => a.targetType === 'student' && a.targetId === studentId);
    return [...groupAssignments, ...personalAssignments];
  }

  const readyPromise = (async () => {
    try {
      await loadInitialData();
    } catch (err) {
      console.error('DB initial load failed:', err);
    }
  })();

  const DB = {
    ready: readyPromise,

    defaultWeek() {
      return DEFAULT_WEEK.map(d => ({ ...d }));
    },

    async seedDemo() {
      await API.seedDemo();
      await loadInitialData();
    },

    // Programs -------------------------------------------------------------
    listPrograms() {
      return arrayClone(state.programs);
    },
    async addProgram(payload) {
      const created = await API.addProgram(payload);
      state.programs.unshift(created);
      return created;
    },
    async updateProgram(id, patch) {
      const updated = await API.updateProgram(id, patch);
      const idx = state.programs.findIndex(p => p.id === id);
      if (idx >= 0) state.programs[idx] = updated;
      return updated;
    },
    async deleteProgram(id) {
      await API.deleteProgram(id);
      state.programs = state.programs.filter(p => p.id !== id);
      state.assignments = state.assignments.filter(a => a.programId !== id);
      for (const logs of caches.logs.values()) {
        logs.forEach(l => { if (l.programId === id) l.programId = null; });
      }
    },

    // Groups ---------------------------------------------------------------
    listGroups() {
      return arrayClone(state.groups);
    },
    async addGroup(payload) {
      const group = await API.addGroup(payload);
      state.groups.unshift(group);
      return group;
    },
    async updateGroup(id, patch) {
      const updated = await API.updateGroup(id, patch);
      const idx = state.groups.findIndex(g => g.id === id);
      if (idx >= 0) state.groups[idx] = updated;
      return updated;
    },
    async deleteGroup(id) {
      await API.deleteGroup(id);
      state.groups = state.groups.filter(g => g.id !== id);
      state.students.forEach(s => { if (s.groupId === id) s.groupId = null; });
      state.assignments = state.assignments.filter(a => !(a.targetType === 'group' && a.targetId === id));
    },

    // Students -------------------------------------------------------------
    listStudents() {
      return arrayClone(state.students);
    },
    getStudentByEmail(email) {
      if (!email) return null;
      const lower = String(email).toLowerCase();
      return state.students.find(s => (s.email || '').toLowerCase() === lower) || null;
    },
    async addStudent(payload) {
      const student = await API.addStudent(payload);
      student.profile = student.profile || {};
      state.students.unshift(student);
      return student;
    },
    async updateStudent(id, patch) {
      const updated = await API.updateStudent(id, patch);
      const idx = state.students.findIndex(s => s.id === id);
      if (idx >= 0) state.students[idx] = Object.assign({}, state.students[idx], updated);
      return updated;
    },
    async deleteStudent(id) {
      await API.deleteStudent(id);
      state.students = state.students.filter(s => s.id !== id);
      state.assignments = state.assignments.filter(a => !(a.targetType === 'student' && a.targetId === id));
      state.payments = state.payments.filter(p => p.studentId !== id);
      invalidateStudentCaches(id);
    },
    async markStudentVerified(id) {
      const res = await API.manualVerify(id);
      if (res && res.ok) {
        const s = findStudent(id);
        if (s) s.verifiedAt = new Date().toISOString();
      }
      return res;
    },
    startEmailVerification(id) {
      return API.startVerification(id);
    },
    verifyStudentEmail(id, code) {
      return API.confirmVerification(id, code).then(res => {
        if (res?.ok) {
          const s = findStudent(id);
          if (s) s.verifiedAt = new Date().toISOString();
        }
        return res?.ok || false;
      });
    },

    // Assignments ----------------------------------------------------------
    listAssignments() {
      return arrayClone(state.assignments);
    },
    listAssignmentsForStudent(studentId) {
      return recomputeAssignmentsForStudent(studentId);
    },
    async assignProgramToGroup(programId, groupId, options = {}) {
      const created = await API.addAssignment({
        programId,
        targetType: 'group',
        targetId: groupId,
        startDate: options.startDate,
        durationDays: options.durationDays,
      });
      state.assignments.unshift(created);
      return created;
    },
    async assignProgramToStudent(programId, studentId, options = {}) {
      const created = await API.addAssignment({
        programId,
        targetType: 'student',
        targetId: studentId,
        startDate: options.startDate,
        durationDays: options.durationDays,
      });
      state.assignments.unshift(created);
      return created;
    },
    async updateAssignmentDates(id, patch) {
      const updated = await API.updateAssignment(id, patch);
      const idx = state.assignments.findIndex(a => a.id === id);
      if (idx >= 0) state.assignments[idx] = updated;
      return updated;
    },
    async deleteAssignment(id) {
      await API.deleteAssignment(id);
      state.assignments = state.assignments.filter(a => a.id !== id);
    },

    getProgramsForStudent(studentId) {
      const assignments = recomputeAssignmentsForStudent(studentId);
      const programIds = [...new Set(assignments.map(a => a.programId))];
      return programIds.map(pid => state.programs.find(p => p.id === pid)).filter(Boolean).map(p => clone(p));
    },

    // Payments -------------------------------------------------------------
    listPayments() {
      return arrayClone(state.payments);
    },
    listPaymentsForStudent(studentId) {
      return state.payments.filter(p => p.studentId === studentId).map(p => ({ ...p }));
    },
    async addPayment(studentId, { file, note, month, monthJalali }) {
      const payment = await API.uploadPayment(studentId, file, { note, month, monthJalali });
      state.payments.unshift(payment);
      return payment;
    },
    async updatePayment(id, patch) {
      const updated = await API.updatePayment(id, patch);
      const idx = state.payments.findIndex(p => p.id === id);
      if (idx >= 0) state.payments[idx] = updated;
      return updated;
    },
    async deletePayment(id) {
      await API.deletePayment(id);
      state.payments = state.payments.filter(p => p.id !== id);
    },
    getPaymentsForStudent(studentId) {
      return this.listPaymentsForStudent(studentId);
    },

    // Goals ----------------------------------------------------------------
    async addGoal(studentId, payload) {
      const model = await API.addGoal(Object.assign({}, payload, { studentId }));
      const goals = await ensureGoals(studentId);
      goals.unshift(model);
      return model;
    },
    async updateGoalMetrics(goalId, patch) {
      const model = await API.updateGoal(goalId, patch);
      const goalsEntry = [...caches.goals.values()].find(list => list.some(g => g.id === goalId));
      if (goalsEntry) {
        const list = goalsEntry;
        const idx = list.findIndex(g => g.id === goalId);
        if (idx >= 0) list[idx] = model;
      }
      return model;
    },
    async updateGoalTitle(goalId, title) {
      return this.updateGoalMetrics(goalId, { title });
    },
    async deleteGoal(goalId) {
      await API.deleteGoal(goalId);
      for (const [sid, goals] of caches.goals.entries()) {
        caches.goals.set(sid, goals.filter(g => g.id !== goalId));
      }
    },
    async listGoalsForStudent(studentId) {
      const goals = await ensureGoals(studentId);
      return goals.map(g => clone(g));
    },
    async addMilestone(goalId, text) {
      const ms = await API.addMilestone(goalId, text);
      for (const [sid, goals] of caches.goals.entries()) {
        const goal = goals.find(g => g.id === goalId);
        if (goal) {
          goal.milestones = goal.milestones || [];
          goal.milestones.push(ms);
        }
      }
      return ms;
    },
    async updateMilestone(goalId, milestoneId, text) {
      const ms = await API.updateMilestone(goalId, milestoneId, text);
      for (const goals of caches.goals.values()) {
        const goal = goals.find(g => g.id === goalId);
        if (goal && Array.isArray(goal.milestones)) {
          const idx = goal.milestones.findIndex(m => m.id === milestoneId);
          if (idx >= 0) goal.milestones[idx] = Object.assign({}, ms);
        }
      }
      return ms;
    },
    async toggleMilestone(goalId, milestoneId, done) {
      const ms = await API.toggleMilestone(goalId, milestoneId, done);
      for (const goals of caches.goals.values()) {
        const goal = goals.find(g => g.id === goalId);
        if (goal && Array.isArray(goal.milestones)) {
          const idx = goal.milestones.findIndex(m => m.id === milestoneId);
          if (idx >= 0) goal.milestones[idx] = Object.assign({}, ms);
        }
      }
      return ms;
    },
    async deleteMilestone(goalId, milestoneId) {
      await API.deleteMilestone(goalId, milestoneId);
      for (const goals of caches.goals.values()) {
        const goal = goals.find(g => g.id === goalId);
        if (goal && Array.isArray(goal.milestones)) {
          goal.milestones = goal.milestones.filter(m => m.id !== milestoneId);
        }
      }
    },

    // Logs -----------------------------------------------------------------
    async addLog(studentId, payload) {
      const log = await API.addLog(studentId, payload);
      const logs = await ensureLogs(studentId);
      logs.unshift(log);
      return log;
    },
    async updateLog(id, patch) {
      const updated = await API.updateLog(id, patch);
      for (const logs of caches.logs.values()) {
        const idx = logs.findIndex(l => l.id === id);
        if (idx >= 0) logs[idx] = updated;
      }
      return updated;
    },
    async deleteLog(id) {
      await API.deleteLog(id);
      for (const logs of caches.logs.values()) {
        const idx = logs.findIndex(l => l.id === id);
        if (idx >= 0) logs.splice(idx, 1);
      }
      caches.logComments.delete(id);
    },
    async listLogsForStudent(studentId) {
      const logs = await ensureLogs(studentId);
      return logs.map(log => clone(log));
    },

    // Comments -------------------------------------------------------------
    async listCommentsForLog(logId) {
      const comments = await ensureLogComments(logId);
      return comments.map(c => clone(c));
    },
    async addComment({ logId, author, authorName, authorStudentId, text }) {
      const comment = await API.addComment(logId, { author, authorName, authorStudentId, text });
      const comments = await ensureLogComments(logId);
      comments.push(comment);
      return comment;
    },
    async addDayComment({ programId, studentId, dayKey, author, authorName, text }) {
      const comment = await API.addDayComment({ programId, studentId, dayKey, author, authorName, text });
      const key = keyDayComments(programId, studentId, dayKey);
      const list = await ensureDayComments(programId, studentId, dayKey);
      list.push(comment);
      return comment;
    },
    async listDayComments(programId, studentId, dayKey) {
      const comments = await ensureDayComments(programId, studentId, dayKey);
      return comments.map(c => clone(c));
    },

    // Medical docs ---------------------------------------------------------
    async addMedicalDoc(studentId, file) {
      const doc = await API.uploadMedicalDoc(studentId, file);
      const docs = await ensureMedicalDocs(studentId);
      docs.unshift(doc);
      return doc;
    },
    async deleteMedicalDoc(studentId, docId) {
      await API.deleteMedicalDoc(studentId, docId);
      const docs = await ensureMedicalDocs(studentId);
      caches.medicalDocs.set(studentId, docs.filter(d => d.id !== docId));
    },
    async listMedicalDocsForStudent(studentId) {
      const docs = await ensureMedicalDocs(studentId);
      return docs.map(d => clone(d));
    },

    getStudentProfile(studentId) {
      const student = findStudent(studentId);
      return student ? clone(student.profile || {}) : {};
    },
    async updateStudentProfile(studentId, patch) {
      const profile = await API.updateProfile(studentId, patch);
      const student = findStudent(studentId);
      if (student) student.profile = Object.assign({}, student.profile || {}, profile);
      caches.medicalDocs.delete(studentId);
      return profile;
    },
  };

  window.DB = DB;
})();
