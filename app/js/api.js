if (!window.API_BASE) {
  console.warn('API_BASE not set'); // fallback برای حالت آفلاین
}

let coachToken = '';

function apiUrl(path) {
  const base = window.API_BASE || '';
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function request(path, options = {}) {
  const opts = Object.assign({}, options);
  const headers = Object.assign({}, opts.headers || {});
  if (coachToken && !headers.Authorization) {
    headers.Authorization = `Bearer ${coachToken}`;
  }
  opts.headers = headers;
  const res = await fetch(apiUrl(path), opts);
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data && data.error) message = data.error;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return text; }
}

function jsonRequest(path, method, body) {
  return request(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
}

const API = {
  // Health ---------------------------------------------------------------
  health() {
    return request('/health');
  },

  // Auth -----------------------------------------------------------------
  signup(payload) {
    return jsonRequest('/auth/signup', 'POST', payload);
  },
  login(payload) {
    return jsonRequest('/auth/login', 'POST', payload);
  },
  forgotPassword(payload) {
    return jsonRequest('/auth/password/forgot', 'POST', payload);
  },
  resetPassword(payload) {
    return jsonRequest('/auth/password/reset', 'POST', payload);
  },
  coachLogin(payload) {
    return jsonRequest('/coach/login', 'POST', payload);
  },
  coachProfile() {
    return request('/coach/me');
  },

  // Students -------------------------------------------------------------
  listStudents() {
    return request('/students');
  },
  getStudent(id) {
    return request(`/students/${encodeURIComponent(id)}`);
  },
  getStudentByPhone(phone) {
    return request(`/students/by-phone?phone=${encodeURIComponent(phone)}`);
  },
  listPendingStudents() {
    return request('/students/pending');
  },
  addStudent(payload) {
    return jsonRequest('/students', 'POST', payload);
  },
  updateStudent(id, patch) {
    return jsonRequest(`/students/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deleteStudent(id) {
    return jsonRequest(`/students/${encodeURIComponent(id)}`, 'DELETE');
  },
  approveStudent(id) {
    return jsonRequest(`/students/${encodeURIComponent(id)}/approve`, 'POST');
  },
  rejectStudent(id) {
    return jsonRequest(`/students/${encodeURIComponent(id)}/reject`, 'POST');
  },
  getProfile(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/profile`);
  },
  updateProfile(studentId, patch) {
    return jsonRequest(`/students/${encodeURIComponent(studentId)}/profile`, 'PUT', patch);
  },
  listAssignmentsForStudent(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/assignments`);
  },
  listProgramsForStudent(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/programs`);
  },

  // Programs -------------------------------------------------------------
  listPrograms() {
    return request('/programs');
  },
  addProgram(payload) {
    return jsonRequest('/programs', 'POST', payload);
  },
  updateProgram(id, patch) {
    return jsonRequest(`/programs/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deleteProgram(id) {
    return jsonRequest(`/programs/${encodeURIComponent(id)}`, 'DELETE');
  },

  // Groups ---------------------------------------------------------------
  listGroups() {
    return request('/groups');
  },
  addGroup(payload) {
    return jsonRequest('/groups', 'POST', payload);
  },
  updateGroup(id, patch) {
    return jsonRequest(`/groups/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deleteGroup(id) {
    return jsonRequest(`/groups/${encodeURIComponent(id)}`, 'DELETE');
  },

  // Assignments ----------------------------------------------------------
  listAssignments() {
    return request('/assignments');
  },
  addAssignment(payload) {
    return jsonRequest('/assignments', 'POST', payload);
  },
  updateAssignment(id, patch) {
    return jsonRequest(`/assignments/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deleteAssignment(id) {
    return jsonRequest(`/assignments/${encodeURIComponent(id)}`, 'DELETE');
  },

  // Goals ----------------------------------------------------------------
  listGoals(studentId) {
    if (!studentId) throw new Error('studentId الزامی است');
    return request(`/goals?studentId=${encodeURIComponent(studentId)}`);
  },
  listGoalsForStudent(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/goals`);
  },
  addGoal(payload) {
    return jsonRequest('/goals', 'POST', payload);
  },
  updateGoal(id, patch) {
    return jsonRequest(`/goals/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deleteGoal(id) {
    return jsonRequest(`/goals/${encodeURIComponent(id)}`, 'DELETE');
  },
  addMilestone(goalId, text) {
    return jsonRequest(`/goals/${encodeURIComponent(goalId)}/milestones`, 'POST', { text });
  },
  updateMilestone(goalId, milestoneId, text) {
    return jsonRequest(`/goals/${encodeURIComponent(goalId)}/milestones/${encodeURIComponent(milestoneId)}`, 'PUT', { text });
  },
  toggleMilestone(goalId, milestoneId, done) {
    return jsonRequest(`/goals/${encodeURIComponent(goalId)}/milestones/${encodeURIComponent(milestoneId)}/toggle`, 'POST', { done });
  },
  deleteMilestone(goalId, milestoneId) {
    return jsonRequest(`/goals/${encodeURIComponent(goalId)}/milestones/${encodeURIComponent(milestoneId)}`, 'DELETE');
  },

  // Medical docs ---------------------------------------------------------
  uploadMedicalDoc(studentId, file) {
    const fd = new FormData();
    fd.append('file', file);
    return request(`/students/${encodeURIComponent(studentId)}/docs`, {
      method: 'POST',
      body: fd,
    });
  },
  listMedicalDocs(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/docs`);
  },
  deleteMedicalDoc(studentId, docId) {
    return jsonRequest(`/students/${encodeURIComponent(studentId)}/docs/${encodeURIComponent(docId)}`, 'DELETE');
  },

  // Payments --------------------------------------------------------------
  listPayments() {
    return request('/payments');
  },
  listPaymentsForStudent(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/payments`);
  },
  uploadPayment(studentId, file, extra = {}) {
    const fd = new FormData();
    fd.append('file', file);
    if (extra.note) fd.append('note', extra.note);
    if (extra.month) fd.append('month', extra.month);
    if (extra.monthJalali) fd.append('monthJalali', extra.monthJalali);
    return request(`/students/${encodeURIComponent(studentId)}/payments`, {
      method: 'POST',
      body: fd,
    });
  },
  updatePayment(id, patch) {
    return jsonRequest(`/payments/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deletePayment(id) {
    return jsonRequest(`/payments/${encodeURIComponent(id)}`, 'DELETE');
  },

  // Logs & comments -------------------------------------------------------
  listLogsForStudent(studentId) {
    return request(`/students/${encodeURIComponent(studentId)}/logs`);
  },
  addLog(studentId, payload) {
    return jsonRequest(`/students/${encodeURIComponent(studentId)}/logs`, 'POST', payload);
  },
  updateLog(id, patch) {
    return jsonRequest(`/logs/${encodeURIComponent(id)}`, 'PUT', patch);
  },
  deleteLog(id) {
    return jsonRequest(`/logs/${encodeURIComponent(id)}`, 'DELETE');
  },
  listComments(logId) {
    return request(`/logs/${encodeURIComponent(logId)}/comments`);
  },
  addComment(logId, payload) {
    return jsonRequest(`/logs/${encodeURIComponent(logId)}/comments`, 'POST', payload);
  },
  listDayComments(params) {
    const qs = new URLSearchParams(params || {}).toString();
    return request(`/day-comments?${qs}`);
  },
  addDayComment(payload) {
    return jsonRequest('/day-comments', 'POST', payload);
  },

  // Groups helper ---------------------------------------------------------
  defaultWeek() {
    return (window.DB && typeof window.DB.defaultWeek === 'function')
      ? window.DB.defaultWeek()
      : [];
  },

  // Seed demo -------------------------------------------------------------
  seedDemo() {
    return jsonRequest('/seed-demo', 'POST');
  },

  setCoachToken(token) {
    coachToken = token || '';
  },
  getCoachToken() {
    return coachToken || '';
  },
  clearCoachToken() {
    coachToken = '';
  },
};

window.API = API;
