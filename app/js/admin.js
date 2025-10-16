(() => {
  const tokenKey = 'csa_admin_token';
  let authToken = localStorage.getItem(tokenKey) || '';
  let currentAdmin = null;
  let admins = [];
  let coaches = [];

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
  const createCoachForm = document.getElementById('createCoachForm');
  const createCoachMsg = document.getElementById('createCoachMsg');
  const coachList = document.getElementById('coachList');
  const panelTabs = document.getElementById('panelTabs');
  const panelTabButtons = panelTabs ? Array.from(panelTabs.querySelectorAll('[data-tab]')) : [];
  const panelViews = panelCard ? Array.from(panelCard.querySelectorAll('[data-panel-view]')) : [];
  const quickTabLinks = panelCard ? Array.from(panelCard.querySelectorAll('[data-switch-tab]')) : [];
  const statTotalAdmins = document.getElementById('statTotalAdmins');
  const statSuperAdmins = document.getElementById('statSuperAdmins');
  const statCoaches = document.getElementById('statCoaches');

  function setCardVisibility({ bootstrap = false, login = false, panel = false }) {
    if (bootstrapCard) bootstrapCard.hidden = !bootstrap;
    if (loginCard) loginCard.hidden = !login;
  if (panelCard) panelCard.hidden = !panel;
}

  function switchPanelTab(target) {
    if (!panelViews.length) return;
    let desired = target;
    let activeButton = panelTabButtons.find(btn => !btn.hidden && btn.dataset.tab === desired);
    if (!activeButton) {
      activeButton = panelTabButtons.find(btn => !btn.hidden);
      if (!activeButton) return;
      desired = activeButton.dataset.tab;
    }
    panelTabButtons.forEach(btn => {
      const isActive = btn === activeButton;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-selected', String(isActive));
      btn.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    panelViews.forEach(view => {
      const match = view.dataset.panelView === desired;
      view.hidden = !match;
    });
  }

  function syncTabsWithRole() {
    if (!panelTabs) return;
    const isSuper = !!currentAdmin?.isSuper;
    let anyVisible = false;
    panelTabButtons.forEach(btn => {
      const requiresSuper = btn.dataset.role === 'super';
      const hidden = requiresSuper && !isSuper;
      btn.hidden = hidden;
      if (!hidden) anyVisible = true;
    });
  quickTabLinks.forEach(link => {
    const requiresSuper = link.dataset.role === 'super';
    if (requiresSuper) {
      if (isSuper) link.removeAttribute('hidden');
      else link.setAttribute('hidden', '');
    }
  });
    panelTabs.hidden = !anyVisible;
    const activeVisible = panelTabButtons.find(btn => btn.classList.contains('active') && !btn.hidden);
    const preferred = activeVisible ? activeVisible.dataset.tab : (isSuper ? 'overview' : 'coaches');
    switchPanelTab(preferred);
  }

  function updateStats() {
    const isSuper = !!currentAdmin?.isSuper;
    if (statTotalAdmins) {
      const totalAdmins = isSuper ? admins.length : (currentAdmin ? 1 : 0);
      statTotalAdmins.textContent = String(totalAdmins);
    }
    if (statSuperAdmins) {
      const superCount = isSuper
        ? admins.filter(adm => adm.isSuper).length
        : (currentAdmin?.isSuper ? 1 : 0);
      statSuperAdmins.textContent = String(superCount);
    }
    if (statCoaches) {
      statCoaches.textContent = String(coaches.length);
    }
  }

  panelTabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchPanelTab(btn.dataset.tab));
  });

  quickTabLinks.forEach(link => {
    const tab = link.dataset.switchTab;
    if (!tab) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchPanelTab(tab);
    });
  });

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
    if (!currentAdmin) {
      admins = [];
      renderAdmins();
      updateStats();
      return;
    }
    if (!currentAdmin.isSuper) {
      admins = [];
      renderAdmins();
      updateStats();
      return;
    }
    const res = await apiFetch('/admins');
    if (!res.ok) throw new Error('خطا در دریافت فهرست ادمین‌ها');
    admins = await res.json();
    renderAdmins();
    updateStats();
  }

  async function refreshCoaches() {
    if (!currentAdmin) {
      coaches = [];
      renderCoaches();
      updateStats();
      return;
    }
    const res = await apiFetch('/coaches');
    if (!res.ok) throw new Error('خطا در دریافت فهرست مربی‌ها');
    const data = await res.json().catch(() => []);
    coaches = Array.isArray(data) ? data : [];
    renderCoaches();
    updateStats();
  }

  function renderAdmins() {
    if (!adminsList) return;
    adminsList.innerHTML = '';
    if (!currentAdmin) {
      adminsList.innerHTML = '<div class="muted">برای مشاهده فهرست، ابتدا وارد شوید.</div>';
      return;
    }
    if (!currentAdmin.isSuper) {
      adminsList.innerHTML = '<div class="muted">برای مشاهده فهرست کامل باید دسترسی سوپر ادمین داشته باشید.</div>';
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

  function renderCoaches() {
    if (!coachList) return;
    coachList.innerHTML = '';
    if (!currentAdmin) {
      coachList.innerHTML = '<div class="muted">برای مشاهده فهرست، ابتدا وارد شوید.</div>';
      return;
    }
    if (!coaches.length) {
      coachList.innerHTML = '<div class="muted">مربی‌ای ثبت نشده است.</div>';
      return;
    }
    coaches.forEach(coach => {
      const card = document.createElement('div');
      card.className = 'item';
      const lastLogin = coach.lastLoginAt ? `<div class="muted">آخرین ورود: ${escapeHtml(new Date(coach.lastLoginAt).toLocaleString('fa-IR'))}</div>` : '<div class="muted">آخرین ورود ثبت نشده</div>';
      card.innerHTML = `
        <div class="row-between">
          <div>
            <strong>${escapeHtml(coach.email)}</strong>
            <div class="muted">${escapeHtml(coach.name || '')}</div>
            ${lastLogin}
          </div>
          <div class="actions" data-actions></div>
        </div>
      `;
      const actions = card.querySelector('[data-actions]');
      const editBtn = document.createElement('button');
      editBtn.className = 'btn-sm';
      editBtn.textContent = 'ویرایش';
      editBtn.addEventListener('click', () => editCoach(coach));
      actions.appendChild(editBtn);

      const resetBtn = document.createElement('button');
      resetBtn.className = 'btn-sm';
      resetBtn.textContent = 'تغییر پسورد';
      resetBtn.addEventListener('click', () => resetCoachPassword(coach));
      actions.appendChild(resetBtn);

      const delBtn = document.createElement('button');
      delBtn.className = 'btn-sm danger';
      delBtn.textContent = 'حذف';
      delBtn.addEventListener('click', () => deleteCoachEntry(coach));
      actions.appendChild(delBtn);

      coachList.appendChild(card);
    });
  }

  async function editCoach(coach) {
    const newEmail = prompt('ایمیل مربی:', coach.email || '');
    if (newEmail === null) return;
    const trimmedEmail = (newEmail || '').trim();
    if (!trimmedEmail) {
      alert('ایمیل نمی‌تواند خالی باشد.');
      return;
    }
    const newName = prompt('نام مربی (اختیاری):', coach.name || '');
    try {
      const res = await apiFetch(`/coaches/${coach.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, name: (newName ?? '').trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در بروزرسانی مربی');
      await refreshCoaches();
      alert('اطلاعات مربی بروزرسانی شد.');
    } catch (err) {
      alert(err.message);
    }
  }

  async function resetCoachPassword(coach) {
    const pwd = prompt(`پسورد جدید برای ${coach.email}:`, '');
    if (pwd === null) return;
    const trimmed = (pwd || '').trim();
    if (!trimmed) {
      alert('پسورد نمی‌تواند خالی باشد.');
      return;
    }
    try {
      const res = await apiFetch(`/coaches/${coach.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در تغییر پسورد مربی');
      await refreshCoaches();
      alert('پسورد مربی با موفقیت تغییر کرد.');
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteCoachEntry(coach) {
    if (!confirm(`آیا از حذف مربی ${coach.email} مطمئن هستید؟`)) return;
    try {
      const res = await apiFetch(`/coaches/${coach.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'خطا در حذف مربی');
      }
      await refreshCoaches();
    } catch (err) {
      alert(err.message);
    }
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
      syncTabsWithRole();
      updateStats();
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
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(str || '').replace(/[&<>"']/g, ch => map[ch]);
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
    coaches = [];
    renderAdmins();
    renderCoaches();
    updateHeader();
    updateStats();
    syncTabsWithRole();
    switchPanelTab('overview');
    initView();
  }

  async function initView() {
    loginMsg.textContent = '';
    bootstrapMsg.textContent = '';
    createAdminMsg.textContent = '';
    if (createCoachMsg) createCoachMsg.textContent = '';

    const hasAdmin = await fetchBootstrapStatus().catch(() => true);
    const hasSession = await loadCurrentAdmin();

    if (hasSession) {
      setCardVisibility({ panel: true });
      updateHeader();
      syncTabsWithRole();
      await Promise.all([
        refreshAdmins().catch(err => { console.error(err); }),
        refreshCoaches().catch(err => { console.error(err); }),
      ]);
      updateStats();
      return;
    }

    admins = [];
    renderAdmins();
    coaches = [];
    renderCoaches();
    updateHeader();
    syncTabsWithRole();
    updateStats();

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

  createCoachForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (createCoachMsg) createCoachMsg.textContent = '';
    if (!currentAdmin) {
      if (createCoachMsg) createCoachMsg.textContent = 'ابتدا وارد شوید.';
      return;
    }
    const formData = new FormData(createCoachForm);
    const email = (formData.get('email') || '').trim();
    const name = (formData.get('name') || '').trim();
    const password = (formData.get('password') || '').trim();
    if (!email || !password) {
      if (createCoachMsg) createCoachMsg.textContent = 'ایمیل و پسورد الزامی است.';
      return;
    }
    try {
      const res = await apiFetch('/coaches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'خطا در ایجاد مربی');
      createCoachForm.reset();
      await refreshCoaches();
      if (createCoachMsg) createCoachMsg.textContent = 'مربی جدید با موفقیت ثبت شد.';
    } catch (err) {
      if (createCoachMsg) createCoachMsg.textContent = err.message;
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
