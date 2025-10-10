(() => {
  const tokenKey = 'csa_admin_token';
  let authToken = localStorage.getItem(tokenKey) || '';
  let currentAdmin = null;
  let admins = [];

  const bootstrapCard = document.getElementById('bootstrapCard');
  const loginCard = document.getElementById('loginCard');
  const panelCard = document.getElementById('panelCard');

  const bootstrapForm = document.getElementById('bootstrapForm');
  const bootstrapMsg = document.getElementById('bootstrapMsg');
  const loginForm = document.getElementById('loginForm');
  const loginMsg = document.getElementById('loginMsg');
  const currentAdminBox = document.getElementById('currentAdmin');
  const createAdminForm = document.getElementById('createAdminForm');
  const createAdminMsg = document.getElementById('createAdminMsg');
  const adminsList = document.getElementById('adminsList');
  const logoutBtn = document.getElementById('logoutBtn');

  function setCardVisibility({ bootstrap = false, login = false, panel = false }) {
    if (bootstrapCard) bootstrapCard.hidden = !bootstrap;
    if (loginCard) loginCard.hidden = !login;
    if (panelCard) panelCard.hidden = !panel;
  }

  async function fetchBootstrapStatus() {
    const res = await fetch(`${API_BASE}/admin/bootstrap/status`);
    if (!res.ok) throw new Error('خطا در بررسی وضعیت ادمین‌ها');
    const data = await res.json();
    return !!data.hasAdmin;
  }

  function apiFetch(path, options = {}) {
    const headers = Object.assign({}, options.headers || {});
    if (authToken) headers.Authorization = `Bearer ${authToken}`;
    return fetch(`${API_BASE}${path.startsWith('/') ? path : `/${path}`}`, Object.assign({}, options, { headers }));
  }

  async function loadCurrentAdmin() {
    if (!authToken) {
      currentAdmin = null;
      return false;
    }
    try {
      const res = await apiFetch('/admin/me');
      if (!res.ok) throw new Error();
      const data = await res.json();
      currentAdmin = data.admin;
      return true;
    } catch {
      currentAdmin = null;
      authToken = '';
      localStorage.removeItem(tokenKey);
      return false;
    }
  }

  async function refreshAdmins() {
    if (!currentAdmin?.isSuper) {
      admins = [];
      renderAdmins();
      return;
    }
    const res = await apiFetch('/admins');
    if (!res.ok) throw new Error('خطا در دریافت فهرست ادمین‌ها');
    admins = await res.json();
    renderAdmins();
  }

  function renderAdmins() {
    if (!adminsList) return;
    adminsList.innerHTML = '';
    if (!currentAdmin) {
      adminsList.innerHTML = '<div class="muted">برای مشاهده فهرست، ابتدا وارد شوید.</div>';
      return;
    }
    if (!admins.length) {
      adminsList.innerHTML = '<div class="muted">ادمینی ثبت نشده است.</div>';
      return;
    }
    admins.forEach(adm => {
      const card = document.createElement('div');
      card.className = 'item';
      const badge = adm.isSuper ? '<span class="chip">سوپر ادمین</span>' : '';
      const selfLabel = adm.id === currentAdmin.id ? '<span class="chip">شما</span>' : '';
      card.innerHTML = `
        <div class="row-between">
          <div>
            <strong>${escapeHtml(adm.email)}</strong>
            ${badge}
            ${selfLabel}
            <div class="muted">${escapeHtml(adm.name || '')}</div>
          </div>
          <div class="actions" data-actions></div>
        </div>
      `;
      const actions = card.querySelector('[data-actions]');
      if (currentAdmin.isSuper) {
        if (adm.id !== currentAdmin.id) {
          const toggleBtn = document.createElement('button');
          toggleBtn.className = 'btn-sm';
          toggleBtn.textContent = adm.isSuper ? 'تبدیل به عادی' : 'تبدیل به سوپر';
          toggleBtn.addEventListener('click', () => toggleSuper(adm));
          actions.appendChild(toggleBtn);

          const resetBtn = document.createElement('button');
          resetBtn.className = 'btn-sm';
          resetBtn.textContent = 'تغییر پسورد';
          resetBtn.addEventListener('click', () => resetPassword(adm));
          actions.appendChild(resetBtn);

          const delBtn = document.createElement('button');
          delBtn.className = 'btn-sm danger';
          delBtn.textContent = 'حذف';
          delBtn.addEventListener('click', () => deleteAdmin(adm));
          actions.appendChild(delBtn);
        } else {
          const resetBtn = document.createElement('button');
          resetBtn.className = 'btn-sm';
          resetBtn.textContent = 'تغییر پسورد';
          resetBtn.addEventListener('click', () => resetPassword(adm));
          actions.appendChild(resetBtn);
        }
      }
      adminsList.appendChild(card);
    });
  }

  async function toggleSuper(admin) {
    if (!confirm(`آیا از تغییر دسترسی ${admin.email} مطمئن هستید؟`)) return;
    try {
      const res = await apiFetch(`/admins/${admin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isSuper: !admin.isSuper }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'خطا در تغییر دسترسی');
      }
      await refreshAdmins();
      await loadCurrentAdmin(); // ممکن است دسترسی خود کاربر تغییر کند
      updateHeader();
    } catch (err) {
      alert(err.message);
    }
  }

  async function resetPassword(admin) {
    const pwd = prompt(`پسورد جدید برای ${admin.email}:`, '');
    if (pwd === null) return;
    if (!pwd.trim()) {
      alert('پسورد نمی‌تواند خالی باشد');
      return;
    }
    try {
      const res = await apiFetch(`/admins/${admin.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pwd.trim() }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'خطا در تغییر پسورد');
      }
      if (admin.id === currentAdmin.id) {
        alert('پسورد شما تغییر کرد. لطفاً دوباره وارد شوید.');
        handleLogout();
      } else {
        alert('پسورد با موفقیت تغییر کرد.');
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteAdmin(admin) {
    if (!confirm(`آیا از حذف ${admin.email} مطمئن هستید؟`)) return;
    try {
      const res = await apiFetch(`/admins/${admin.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'خطا در حذف ادمین');
      }
      await refreshAdmins();
    } catch (err) {
      alert(err.message);
    }
  }

  function updateHeader() {
    if (!currentAdminBox) return;
    if (!currentAdmin) {
      currentAdminBox.textContent = '';
      return;
    }
    currentAdminBox.innerHTML = `
      <div><strong>${escapeHtml(currentAdmin.email)}</strong>${currentAdmin.isSuper ? ' — سوپر ادمین' : ''}</div>
      ${currentAdmin.name ? `<div class="muted">${escapeHtml(currentAdmin.name)}</div>` : ''}
    `;
  }

  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function setToken(token) {
    authToken = token || '';
    if (authToken) {
      localStorage.setItem(tokenKey, authToken);
    } else {
      localStorage.removeItem(tokenKey);
    }
  }

  function handleLogout() {
    setToken('');
    currentAdmin = null;
    admins = [];
    renderAdmins();
    updateHeader();
    initView();
  }

  async function initView() {
    loginMsg.textContent = '';
    bootstrapMsg.textContent = '';
    createAdminMsg.textContent = '';

    const hasAdmin = await fetchBootstrapStatus().catch(() => true);
    const hasSession = await loadCurrentAdmin();

    if (hasSession) {
      setCardVisibility({ panel: true });
      updateHeader();
      await refreshAdmins().catch(err => { console.error(err); });
      return;
    }

    admins = [];
    renderAdmins();
    updateHeader();

    if (!hasAdmin) {
      setCardVisibility({ bootstrap: true, login: false, panel: false });
    } else {
      setCardVisibility({ bootstrap: false, login: true, panel: false });
    }
  }

  bootstrapForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    bootstrapMsg.textContent = '';
    const formData = new FormData(bootstrapForm);
    try {
      const res = await fetch(`${API_BASE}/admin/bootstrap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name'),
          password: formData.get('password'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در ساخت ادمین');
      setToken(data.token);
      currentAdmin = data.admin;
      bootstrapForm.reset();
      await initView();
    } catch (err) {
      bootstrapMsg.textContent = err.message;
    }
  });

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginMsg.textContent = '';
    const formData = new FormData(loginForm);
    try {
      const res = await fetch(`${API_BASE}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'اطلاعات ورود نادرست است');
      setToken(data.token);
      currentAdmin = data.admin;
      loginForm.reset();
      await initView();
    } catch (err) {
      loginMsg.textContent = err.message;
    }
  });

  createAdminForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    createAdminMsg.textContent = '';
    const formData = new FormData(createAdminForm);
    try {
      const res = await apiFetch('/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          name: formData.get('name'),
          password: formData.get('password'),
          isSuper: formData.get('isSuper') === 'on',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد ادمین');
      createAdminForm.reset();
      await refreshAdmins();
      createAdminMsg.textContent = 'ادمین جدید با موفقیت اضافه شد.';
    } catch (err) {
      createAdminMsg.textContent = err.message;
    }
  });

  logoutBtn?.addEventListener('click', () => {
    if (confirm('آیا می‌خواهید خارج شوید؟')) {
      handleLogout();
    }
  });

  initView().catch(err => {
    console.error(err);
    setCardVisibility({ login: true });
    loginMsg.textContent = 'خطا در راه‌اندازی پنل';
  });
})();
