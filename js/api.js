// اگر API_BASE نبود، فقط اخطار بده؛ window.API را همچنان می‌سازیم
if (!window.API_BASE) { console.warn('API_BASE not set'); }

function apiUrl(path) {
  return `${window.API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
}

window.API = {
  // Goals
  listGoals(studentId) {
    return fetch(apiUrl(`/goals?studentId=${encodeURIComponent(studentId)}`)).then(r => r.json());
  },
  addGoal(payload) {
    return fetch(apiUrl('/goals'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json());
  },
  updateGoal(id, patch) {
    return fetch(apiUrl(`/goals/${encodeURIComponent(id)}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(r => r.json());
  },
  deleteGoal(id) {
    return fetch(apiUrl(`/goals/${encodeURIComponent(id)}`), { method: 'DELETE' }).then(r => r.json());
  },

  // Profile
  getProfile(studentId) {
    return fetch(apiUrl(`/students/${encodeURIComponent(studentId)}/profile`)).then(r => r.json());
  },
  updateProfile(studentId, patch) {
    return fetch(apiUrl(`/students/${encodeURIComponent(studentId)}/profile`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) }).then(r => r.json());
  },

  // Medical docs
  uploadMedicalDoc(studentId, file) {
    const fd = new FormData(); fd.append('file', file);
    return fetch(apiUrl(`/students/${encodeURIComponent(studentId)}/docs`), { method: 'POST', body: fd }).then(r => r.json());
  },
  listMedicalDocs(studentId) {
    return fetch(apiUrl(`/students/${encodeURIComponent(studentId)}/docs`)).then(r => r.json());
  },
  deleteMedicalDoc(studentId, docId) {
    return fetch(apiUrl(`/students/${encodeURIComponent(studentId)}/docs/${encodeURIComponent(docId)}`), { method: 'DELETE' }).then(r => r.json());
  },
};
