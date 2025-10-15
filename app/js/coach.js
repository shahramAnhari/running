document.addEventListener('DOMContentLoaded', () => {
  initCoach().catch(err => {
    console.error('Coach panel init failed', err);
    showToast('خطا در بارگذاری داده‌ها. لطفاً صفحه را دوباره باز کنید.', 'danger');
  });
});

async function initCoach() {
  const coachLoginCard = document.getElementById('coachLoginCard');
  const coachAppArea = document.getElementById('coachAppArea');
  const coachLoginForm = document.getElementById('coachLoginForm');
  const coachLoginEmail = document.getElementById('coachLoginEmail');
  const coachLoginPassword = document.getElementById('coachLoginPassword');
  const coachLoginMsg = document.getElementById('coachLoginMsg');
  const coachLogoutBtn = document.getElementById('coachLogout');

  const coachTokenKey = 'csa_coach_token';
  let coachToken = localStorage.getItem(coachTokenKey) || '';
  let coachProfile = null;

  if (coachToken) {
    persistCoachToken(coachToken);
  } else if (API?.clearCoachToken) {
    API.clearCoachToken();
  }

  try {
    await (window.DB?.ready || Promise.resolve());
  } catch (err) {
    console.error('DB init failed', err);
    showToast('اتصال به سرور برقرار نشد.', 'danger');
    throw err;
  }

  // Forms & UI refs
  const programForm = document.getElementById('programForm');
  const programTitle = document.getElementById('programTitle');
  const programDesc = document.getElementById('programDesc');
  const programList = document.getElementById('programList');
  // week inputs
  const w_sat = document.getElementById('w_sat');
  const w_sun = document.getElementById('w_sun');
  const w_mon = document.getElementById('w_mon');
  const w_tue = document.getElementById('w_tue');
  const w_wed = document.getElementById('w_wed');
  const w_thu = document.getElementById('w_thu');
  const w_fri = document.getElementById('w_fri');

  const groupForm = document.getElementById('groupForm');
  const groupName = document.getElementById('groupName');
  const groupList = document.getElementById('groupList');

  const groupingCreateForm = document.getElementById('groupingCreateForm');
  const groupingCreateName = document.getElementById('groupingCreateName');
  const groupingGroupList = document.getElementById('groupingGroupList');
  const groupingClearSelection = document.getElementById('groupingClearSelection');
  const groupingDetails = document.getElementById('groupingDetails');
  const groupingSelectedName = document.getElementById('groupingSelectedName');
  const groupingRenameBtn = document.getElementById('groupingRenameBtn');
  const groupingDeleteBtn = document.getElementById('groupingDeleteBtn');
  const groupingMemberList = document.getElementById('groupingMemberList');
  const groupingSearchInput = document.getElementById('groupingSearchInput');
  const groupingCandidateList = document.getElementById('groupingCandidateList');
  const groupingAssignForm = document.getElementById('groupingAssignForm');
  const groupingAssignProgram = document.getElementById('groupingAssignProgram');
  const groupingAssignStart = document.getElementById('groupingAssignStart');
  const groupingAssignDuration = document.getElementById('groupingAssignDuration');
  const groupingAssignmentsList = document.getElementById('groupingAssignmentsList');

  const studentForm = document.getElementById('studentForm');
  const studentName = document.getElementById('studentName');
  const studentEmail = document.getElementById('studentEmail');
  const studentPhone = document.getElementById('studentPhone');
  const studentPassword = document.getElementById('studentPassword');
  const studentGroup = document.getElementById('studentGroup');
  const studentList = document.getElementById('studentList');
  const pendingStudentList = document.getElementById('pendingStudentList');
  const pendingStudentCount = document.getElementById('pendingStudentCount');
  const approvedStudentCount = document.getElementById('approvedStudentCount');

  const assignGroupForm = document.getElementById('assignGroupForm');
  const assignProgramForGroup = document.getElementById('assignProgramForGroup');
  const assignGroupStartISO = document.getElementById('assignGroupStartISO');
  const assignGroupDuration = document.getElementById('assignGroupDuration');
  const assignGroupTargets = document.getElementById('assignGroupTargets');

  const assignStudentForm = document.getElementById('assignStudentForm');
  const assignProgramForStudent = document.getElementById('assignProgramForStudent');
  const assignStudentStartISO = document.getElementById('assignStudentStartISO');
  const assignStudentDuration = document.getElementById('assignStudentDuration');
  const assignStudentTargets = document.getElementById('assignStudentTargets');

  const assignmentList = document.getElementById('assignmentList');
  const assignTabButtons = document.querySelectorAll('[data-assign-target]');
  const assignViews = document.querySelectorAll('[data-assign-view]');
  const seedDemoBtn = document.getElementById('seedDemo');

  // Payments (coach view)
  const paymentFilterStudent = document.getElementById('paymentFilterStudent');
  const clearPaymentFilter = document.getElementById('clearPaymentFilter');
  const coachPaymentList = document.getElementById('coachPaymentList');
  const paymentSearch = document.getElementById('paymentSearch');

  // Overview (coach view)
  const ovSearch = document.getElementById('ovSearch');
  const ovStudent = document.getElementById('ovStudent');
  const ovClear = document.getElementById('ovClear');
  const ovContent = document.getElementById('ovContent');
  // chart canvases (created dynamically per render)

  // Logs (coach view)
  const logFilterStudent = document.getElementById('logFilterStudent');
  const logSearch = document.getElementById('logSearch');
  const clearLogFilter = document.getElementById('clearLogFilter');
  const coachLogList = document.getElementById('coachLogList');

  // Goals (coach view)
  const goalFilterStudent = document.getElementById('goalFilterStudent');
  const coachGoalList = document.getElementById('coachGoalList');

  const coachDialog = document.getElementById('coachDialog');
  const coachDialogTitle = document.getElementById('coachDialogTitle');
  const coachDialogBody = document.getElementById('coachDialogBody');
  const coachDialogConfirm = document.getElementById('coachDialogConfirm');
  const coachDialogCancel = document.getElementById('coachDialogCancel');
  const coachDialogClose = document.getElementById('coachDialogClose');
  const coachToast = document.getElementById('coachToast');

  // Sidebar nav
  const sideLinks = document.querySelectorAll('.side-link');
  const panels = document.querySelectorAll('.panel');

  const runAsync = (fn) => (...args) => Promise.resolve(fn(...args)).catch(err => console.error(err));
  let appInitialized = false;
  let groupingSelectedGroupId = null;
  let dialogResolver = null;
  let dialogSubmit = null;
  let toastTimer = null;

  if (groupingSearchInput) groupingSearchInput.disabled = true;

  function closeDialog(result = false) {
    if (!coachDialog) return;
    coachDialog.classList.remove('open');
    setTimeout(() => {
      if (coachDialog) coachDialog.hidden = true;
    }, 150);
    document.body.classList.remove('dialog-open');
    if (coachDialogConfirm) coachDialogConfirm.classList.remove('danger');
    const resolver = dialogResolver;
    dialogResolver = null;
    dialogSubmit = null;
    if (typeof resolver === 'function') resolver(result);
  }

  function openDialog({ title = '', render, confirmText = 'تایید', cancelText = 'انصراف', confirmVariant = 'primary', onSubmit }) {
    if (!coachDialog) return Promise.resolve(false);
    coachDialogTitle.textContent = title;
    coachDialogBody.innerHTML = '';
    let content = typeof render === 'function' ? render() : render;
    if (typeof content === 'string') {
      coachDialogBody.innerHTML = content;
    } else if (content instanceof Node) {
      coachDialogBody.appendChild(content);
    }
    if (coachDialogConfirm) {
      coachDialogConfirm.textContent = confirmText || 'تایید';
      coachDialogConfirm.classList.toggle('danger', confirmVariant === 'danger');
    }
    if (coachDialogCancel) {
      if (cancelText === null) {
        coachDialogCancel.hidden = true;
      } else {
        coachDialogCancel.hidden = false;
        coachDialogCancel.textContent = cancelText || 'انصراف';
      }
    }
    dialogSubmit = onSubmit;
    dialogResolver = null;
    coachDialog.hidden = false;
    requestAnimationFrame(() => coachDialog.classList.add('open'));
    document.body.classList.add('dialog-open');
    return new Promise(resolve => {
      dialogResolver = resolve;
    });
  }

  function showToast(message, variant = 'info') {
    if (!coachToast) {
      console.log(message);
      return;
    }
    coachToast.textContent = message;
    coachToast.dataset.variant = variant;
    coachToast.hidden = false;
    coachToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      coachToast.classList.remove('show');
      toastTimer = setTimeout(() => {
        coachToast.hidden = true;
      }, 250);
    }, 3200);
  }

  coachDialogConfirm?.addEventListener('click', async () => {
    if (!dialogResolver) return;
    try {
      const result = dialogSubmit ? await dialogSubmit() : true;
      if (result === false) return;
      closeDialog(true);
    } catch (err) {
      console.error(err);
      showToast(err.message || 'خطای ناشناخته', 'danger');
    }
  });
  const cancelDialog = () => {
    if (!dialogResolver) return;
    closeDialog(false);
  };
  coachDialogCancel?.addEventListener('click', cancelDialog);
  coachDialogClose?.addEventListener('click', cancelDialog);
  coachDialog?.addEventListener('click', (evt) => {
    if (evt.target === coachDialog && dialogResolver) {
      cancelDialog();
    }
  });
  document.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape' && dialogResolver) {
      cancelDialog();
    }
  });

  function switchAssignTab(target) {
    assignTabButtons.forEach(btn => {
      const isActive = btn.dataset.assignTarget === target;
      btn.classList.toggle('active', isActive);
      if (isActive) {
        btn.setAttribute('aria-current', 'true');
      } else {
        btn.removeAttribute('aria-current');
      }
    });
    assignViews.forEach(view => {
      const match = view.dataset.assignView === target;
      view.hidden = !match;
    });
  }

  function persistCoachToken(token) {
    coachToken = token || '';
    if (coachToken) {
      localStorage.setItem(coachTokenKey, coachToken);
      if (API?.setCoachToken) API.setCoachToken(coachToken);
    } else {
      localStorage.removeItem(coachTokenKey);
      if (API?.clearCoachToken) API.clearCoachToken();
    }
  }

  function showLoginView(message = '') {
    if (coachAppArea) coachAppArea.style.display = 'none';
    if (coachLoginCard) coachLoginCard.style.display = '';
    if (coachLoginMsg) coachLoginMsg.textContent = message || '';
    if (coachLoginPassword) coachLoginPassword.value = '';
  }

  function showAppView() {
    if (coachLoginCard) coachLoginCard.style.display = 'none';
    if (coachAppArea) coachAppArea.style.display = '';
    if (coachLoginMsg) coachLoginMsg.textContent = '';
  }

  async function enterCoachApp() {
    showAppView();
    try {
      await loadAllData();
    } catch (err) {
      console.error('Failed to load coach data', err);
      showToast('بارگذاری داده‌ها ناموفق بود. دوباره وارد شوید.', 'danger');
      persistCoachToken('');
      coachProfile = null;
      showLoginView('لطفاً دوباره وارد شوید.');
    }
  }

  showLoginView();

  function refreshSelects() {
    const programs = DB.listPrograms();
    const groups = DB.listGroups();
    const students = DB.listStudents();

    const prevStudentGroupValue = studentGroup ? studentGroup.value : '';
    const prevGroupTargets = assignGroupTargets
      ? new Set(Array.from(assignGroupTargets.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value))
      : new Set();
    const prevStudentTargets = assignStudentTargets
      ? new Set(Array.from(assignStudentTargets.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value))
      : new Set();

    [assignProgramForGroup, assignProgramForStudent, studentGroup]
      .forEach(sel => { if (sel) sel.innerHTML = ''; });

    // programs
    programs.forEach(p => {
      const o1 = document.createElement('option'); o1.value = p.id; o1.textContent = p.title; assignProgramForGroup.appendChild(o1);
      const o2 = document.createElement('option'); o2.value = p.id; o2.textContent = p.title; assignProgramForStudent.appendChild(o2);
    });

    // groups
    if (studentGroup) {
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = 'یک گروه را انتخاب کنید';
      placeholder.disabled = true;
      if (!prevStudentGroupValue) placeholder.selected = true;
      studentGroup.appendChild(placeholder);
    }

    groups.forEach(g => {
      const og2 = document.createElement('option');
      og2.value = g.id;
      og2.textContent = g.name;
      if (prevStudentGroupValue && prevStudentGroupValue === g.id) og2.selected = true;
      studentGroup.appendChild(og2);
    });

    if (assignGroupTargets) {
      assignGroupTargets.innerHTML = groups.length ? '' : '<div class="muted">گروهی وجود ندارد.</div>';
      groups.forEach(g => {
        const label = document.createElement('label');
        label.className = 'assign-check-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = g.id;
        checkbox.checked = prevGroupTargets.has(g.id);
        const textWrap = document.createElement('div');
        textWrap.className = 'assign-check-text';
        const title = document.createElement('span');
        title.textContent = g.name;
        const info = document.createElement('small');
        const count = g.studentIds.length;
        info.textContent = count ? `${count} شاگرد` : 'بدون شاگرد';
        textWrap.append(title, info);
        label.append(checkbox, textWrap);
        assignGroupTargets.appendChild(label);
      });
    }

    if (assignStudentTargets) {
      assignStudentTargets.innerHTML = students.length ? '' : '<div class="muted">شاگردی وجود ندارد.</div>';
      students.forEach(s => {
        const label = document.createElement('label');
        label.className = 'assign-check-item';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = s.id;
        checkbox.checked = prevStudentTargets.has(s.id);
        const textWrap = document.createElement('div');
        textWrap.className = 'assign-check-text';
        const title = document.createElement('span');
        title.textContent = s.name;
        const info = document.createElement('small');
        const contact = s.email || s.phone || 'بدون اطلاعات تماس';
        info.textContent = contact;
        textWrap.append(title, info);
        label.append(checkbox, textWrap);
        assignStudentTargets.appendChild(label);
      });
    }

    // payment filter students (+ All)
    if (paymentFilterStudent) {
      paymentFilterStudent.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'همه شاگردها'; paymentFilterStudent.appendChild(all);
      students.forEach(s => {
        const contact = s.email || s.phone || 'بدون اطلاعات تماس';
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${contact})`;
        paymentFilterStudent.appendChild(o);
      });
    }

    // overview students
    if (ovStudent) {
      ovStudent.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'یک شاگرد را انتخاب کنید'; ovStudent.appendChild(all);
      students.forEach(s => {
        const contact = s.email || s.phone || 'بدون اطلاعات تماس';
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${contact})`;
        ovStudent.appendChild(o);
      });
    }

    // logs filter students
    if (logFilterStudent) {
      logFilterStudent.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'همه شاگردها'; logFilterStudent.appendChild(all);
      students.forEach(s => {
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${s.email})`;
        logFilterStudent.appendChild(o);
      });
    }

    // goals filter students
    if (goalFilterStudent) {
      goalFilterStudent.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'یک شاگرد را انتخاب کنید'; goalFilterStudent.appendChild(all);
      students.forEach(s => {
        const contact = s.email || s.phone || 'بدون اطلاعات تماس';
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${contact})`;
        goalFilterStudent.appendChild(o);
      });
    }
    updateGroupingUI();
  }

  async function renderPrograms() {
    const programs = DB.listPrograms();
    programList.innerHTML = programs.length ? '' : '<div class="muted">برنامه‌ای ثبت نشده است</div>';
    programs.forEach(p => {
      const el = document.createElement('div');
      el.className = 'item';
      const week = Array.isArray(p.week) ? p.week : DB.defaultWeek();
      const filledDays = week.filter(d => (d.content || '').trim().length > 0).map(d => d.label);
      const chips = filledDays.length ? `<div class="chips">${filledDays.map(l => `<span class="chip">${escapeHtml(l)}</span>`).join(' ')}</div>` : '<div class="muted">بدون روز مشخص</div>';
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(p.title)}</strong><br/><span class="muted">${escapeHtml(p.description || '')}</span></div>
          <div class="actions">
            <button class="btn-sm" data-edit-program="${p.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-program="${p.id}">حذف</button>
          </div>
        </div>
        ${chips}`;
      programList.appendChild(el);
      el.querySelector('[data-edit-program]')?.addEventListener('click', () => {
        const container = document.createElement('div');
        container.className = 'dialog-field';
        const labelTitle = document.createElement('label');
        labelTitle.textContent = 'عنوان برنامه';
        const inputTitle = document.createElement('input');
        inputTitle.type = 'text';
        inputTitle.value = p.title;
        inputTitle.className = 'dialog-input';
        labelTitle.appendChild(inputTitle);
        const labelDesc = document.createElement('label');
        labelDesc.textContent = 'توضیحات (اختیاری)';
        const textareaDesc = document.createElement('textarea');
        textareaDesc.className = 'dialog-textarea';
        textareaDesc.rows = 4;
        textareaDesc.value = p.description || '';
        labelDesc.appendChild(textareaDesc);
        container.append(labelTitle, labelDesc);
        openDialog({
          title: 'ویرایش برنامه',
          render: () => container,
          confirmText: 'ذخیره',
          onSubmit: async () => {
            const title = inputTitle.value.trim();
            if (!title) {
              inputTitle.classList.add('invalid');
              inputTitle.focus();
              return false;
            }
            await DB.updateProgram(p.id, { title, description: textareaDesc.value.trim() });
            showToast('برنامه بروزرسانی شد.', 'success');
            await renderPrograms();
            refreshSelects();
            return true;
          },
        });
        setTimeout(() => inputTitle.focus(), 50);
      });
      el.querySelector('[data-del-program]')?.addEventListener('click', () => {
        const body = document.createElement('p');
        body.innerHTML = `برنامه <strong>${escapeHtml(p.title)}</strong> حذف شود؟<br/><span class="muted">انتساب‌های مرتبط با این برنامه نیز حذف می‌شوند.</span>`;
        openDialog({
          title: 'حذف برنامه',
          render: () => body,
          confirmText: 'حذف برنامه',
          confirmVariant: 'danger',
          onSubmit: async () => {
            await DB.deleteProgram(p.id);
            showToast('برنامه حذف شد.', 'success');
            await renderPrograms();
            await renderAssignments();
            refreshSelects();
            return true;
          },
        });
      });
    });
  }

  function updateGroupingUI() {
    if (!groupingGroupList) return;
    const groups = DB.listGroups();
    const students = DB.listStudents().filter(s => !s.status || s.status === 'approved');
    const programs = DB.listPrograms();
    const assignments = DB.listAssignments();

    if (groupingSelectedGroupId && !groups.some(g => g.id === groupingSelectedGroupId)) {
      groupingSelectedGroupId = groups[0]?.id || null;
    }

    groupingGroupList.innerHTML = '';
    if (!groups.length) {
      groupingGroupList.innerHTML = '<div class="muted">هنوز گروهی ساخته نشده است.</div>';
    } else {
      groups.forEach(g => {
        const btn = document.createElement('button');
        btn.type = 'button';
        const memberCount = g.studentIds.length;
        const countLabel = memberCount ? `${memberCount} شاگرد` : 'بدون شاگرد';
        btn.className = `grouping-group-item${g.id === groupingSelectedGroupId ? ' active' : ''}`;
        btn.dataset.groupId = g.id;
        btn.innerHTML = `<span>${escapeHtml(g.name)}</span><span>${escapeHtml(countLabel)}</span>`;
        btn.addEventListener('click', () => {
          groupingSelectedGroupId = g.id;
          updateGroupingUI();
        });
        groupingGroupList.appendChild(btn);
      });
    }

    if (groupingClearSelection) {
      groupingClearSelection.disabled = !groupingSelectedGroupId;
      groupingClearSelection.onclick = () => {
        groupingSelectedGroupId = null;
        updateGroupingUI();
      };
    }

    if (!groupingDetails) return;
    if (!groupingSelectedGroupId) {
      groupingDetails.hidden = true;
      if (groupingSearchInput) {
        groupingSearchInput.value = '';
        groupingSearchInput.disabled = true;
      }
      if (groupingCandidateList) {
        groupingCandidateList.innerHTML = '<div class="muted">برای افزودن شاگرد، ابتدا یک گروه را انتخاب کنید.</div>';
      }
      return;
    }

    const selected = groups.find(g => g.id === groupingSelectedGroupId);
    if (!selected) {
      groupingDetails.hidden = true;
      return;
    }
    groupingDetails.hidden = false;
    if (groupingSelectedName) groupingSelectedName.textContent = selected.name;
    if (groupingSearchInput) groupingSearchInput.disabled = false;

    if (groupingRenameBtn) {
      groupingRenameBtn.onclick = () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'dialog-field';
        const label = document.createElement('label');
        label.textContent = 'نام جدید گروه';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = selected.name;
        input.className = 'dialog-input';
        label.appendChild(input);
        wrapper.appendChild(label);
        openDialog({
          title: 'ویرایش نام گروه',
          render: () => wrapper,
          confirmText: 'ذخیره',
          onSubmit: async () => {
            const nextName = input.value.trim();
            if (!nextName) {
              input.classList.add('invalid');
              input.focus();
              return false;
            }
            await DB.updateGroup(selected.id, { name: nextName });
            showToast('نام گروه به‌روزرسانی شد.', 'success');
            await renderGroups();
            refreshSelects();
            return true;
          },
        });
        setTimeout(() => input.focus(), 50);
      };
    }

    if (groupingDeleteBtn) {
      groupingDeleteBtn.onclick = () => {
        const body = document.createElement('div');
        body.innerHTML = `<p>گروه <strong>${escapeHtml(selected.name)}</strong> حذف شود؟</p><p class="muted">تمام انتساب‌های مربوط به این گروه نیز حذف می‌شود.</p>`;
        openDialog({
          title: 'حذف گروه',
          render: () => body,
          confirmText: 'حذف گروه',
          confirmVariant: 'danger',
          onSubmit: async () => {
            await DB.deleteGroup(selected.id);
            showToast('گروه حذف شد.', 'success');
            groupingSelectedGroupId = null;
            await renderGroups();
            await renderAssignments();
            await renderStudents();
            refreshSelects();
            return true;
          },
        });
      };
    }

    if (groupingMemberList) {
      const members = students.filter(s => s.groupId === selected.id);
      groupingMemberList.innerHTML = members.length ? '' : '<div class="muted">شاگردی در این گروه ثبت نشده است.</div>';
      members.forEach(s => {
        const item = document.createElement('div');
        item.className = 'item';
        const contact = s.email || s.phone || 'بدون اطلاعات تماس';
        item.innerHTML = `
          <div class="row-between">
            <div>
              <strong>${escapeHtml(s.name)}</strong>
              <div class="muted">${escapeHtml(contact)}</div>
            </div>
            <div class="actions">
              <button class="btn-sm danger" data-remove="${s.id}">حذف از گروه</button>
            </div>
          </div>`;
        groupingMemberList.appendChild(item);
        item.querySelector('[data-remove]')?.addEventListener('click', () => {
          const body = document.createElement('p');
          body.innerHTML = `شاگرد <strong>${escapeHtml(s.name)}</strong> از گروه <strong>${escapeHtml(selected.name)}</strong> خارج شود؟`;
          openDialog({
            title: 'حذف شاگرد از گروه',
            render: () => body,
            confirmText: 'خروج از گروه',
            confirmVariant: 'danger',
            onSubmit: async () => {
              await DB.updateStudent(s.id, { groupId: null });
              showToast('شاگرد از گروه خارج شد.', 'success');
              await renderStudents();
              await renderGroups();
              refreshSelects();
              return true;
            },
          });
        });
      });
    }

    if (groupingCandidateList) {
      const searchTerm = (groupingSearchInput?.value || '').trim().toLowerCase();
      const matchesSearch = (student) => {
        if (!searchTerm) return true;
        const haystack = [
          student.name,
          student.email,
          student.phone,
        ].map(v => (v || '').toLowerCase());
        return haystack.some(v => v.includes(searchTerm));
      };

      const candidates = students
        .filter(st => st.id && st.groupId !== selected.id && matchesSearch(st))
        .sort((a, b) => a.name.localeCompare(b.name, 'fa'));

      groupingCandidateList.innerHTML = candidates.length
        ? ''
        : '<div class="muted">شاگردی مطابق جستجو یافت نشد.</div>';

      candidates.forEach(st => {
        const item = document.createElement('div');
        item.className = 'item';
        const contact = st.email || st.phone || 'بدون اطلاعات تماس';
        const currentGroup = groups.find(g => g.id === st.groupId)?.name || 'بدون گروه';
        item.innerHTML = `
          <div class="row-between">
            <div>
              <strong>${escapeHtml(st.name)}</strong>
              <div class="muted">${escapeHtml(contact)}</div>
              <div class="muted">${escapeHtml(currentGroup === 'بدون گروه' ? 'بدون گروه' : `گروه فعلی: ${currentGroup}`)}</div>
            </div>
            <div class="actions">
              <button class="btn-sm" data-add="${st.id}">افزودن</button>
            </div>
          </div>`;
        groupingCandidateList.appendChild(item);
        item.querySelector('[data-add]')?.addEventListener('click', async () => {
          try {
            await DB.updateStudent(st.id, { groupId: selected.id });
            showToast('شاگرد به گروه اضافه شد.', 'success');
            await renderStudents();
            await renderGroups();
            refreshSelects();
          } catch (err) {
            console.error(err);
            showToast(err.message || 'خطا در افزودن شاگرد به گروه', 'danger');
          }
        });
      });
    }

    if (groupingAssignProgram) {
      const previousValue = groupingAssignProgram.value;
      groupingAssignProgram.innerHTML = '';
      if (!programs.length) {
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = 'برنامه‌ای وجود ندارد';
        groupingAssignProgram.appendChild(opt);
        groupingAssignProgram.disabled = true;
      } else {
        groupingAssignProgram.disabled = false;
        programs.forEach(p => {
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.title;
          groupingAssignProgram.appendChild(opt);
        });
        if (previousValue && programs.some(p => p.id === previousValue)) {
          groupingAssignProgram.value = previousValue;
        } else if (!programs.some(p => p.id === groupingAssignProgram.value)) {
          groupingAssignProgram.value = programs[0]?.id || '';
        }
      }
    }
    if (groupingAssignStart && !groupingAssignStart.value) {
      groupingAssignStart.value = new Date().toISOString().slice(0, 10);
    }
    if (groupingAssignDuration && !groupingAssignDuration.value) {
      groupingAssignDuration.value = '7';
    }
    if (groupingAssignForm) {
      const assignButton = groupingAssignForm.querySelector('button');
      if (!programs.length) {
        if (assignButton) assignButton.disabled = true;
        groupingAssignForm.onsubmit = (e) => { e.preventDefault(); };
      } else {
        if (assignButton) assignButton.disabled = false;
        groupingAssignForm.onsubmit = async (e) => {
          e.preventDefault();
          const programId = groupingAssignProgram?.value;
          if (!programId) {
            showToast('لطفاً یک برنامه را انتخاب کنید.', 'warning');
            return;
          }
          const startDate = groupingAssignStart?.value || new Date().toISOString().slice(0, 10);
          const durationDays = Math.max(1, parseInt(groupingAssignDuration?.value || '7', 10));
          try {
            await DB.assignProgramToGroup(programId, selected.id, { startDate, durationDays });
            await renderAssignments();
            updateGroupingUI();
          } catch (err) {
            console.error(err);
            showToast(err.message || 'خطا در انتساب برنامه به گروه', 'danger');
          }
        };
      }
    }

    if (groupingAssignmentsList) {
      const groupAssignments = assignments.filter(a => a.targetType === 'group' && a.targetId === selected.id);
      groupingAssignmentsList.innerHTML = groupAssignments.length ? '' : '<div class="muted">برنامه‌ای برای این گروه ثبت نشده است.</div>';
      groupAssignments.forEach(a => {
        const program = programs.find(p => p.id === a.programId);
        const title = program ? program.title : 'برنامه حذف‌شده';
        const rangeLabel = formatJalaliRange(a.startDate, a.endDate) || 'بدون تاریخ مشخص';
        const item = document.createElement('div');
        item.className = 'item';
        item.innerHTML = `
          <div class="row-between">
            <div>
              <strong>${escapeHtml(title)}</strong>
              <div class="muted">${escapeHtml(rangeLabel)}</div>
            </div>
            <div class="actions">
              <button class="btn-sm danger" data-remove-assignment="${a.id}">حذف</button>
            </div>
          </div>`;
        groupingAssignmentsList.appendChild(item);
        item.querySelector('[data-remove-assignment]')?.addEventListener('click', () => {
          const body = document.createElement('p');
          body.innerHTML = `برنامه <strong>${escapeHtml(title)}</strong> از این گروه حذف شود؟`;
          openDialog({
            title: 'حذف برنامه از گروه',
            render: () => body,
            confirmText: 'حذف برنامه',
            confirmVariant: 'danger',
            onSubmit: async () => {
              await DB.deleteAssignment(a.id);
              showToast('برنامه از گروه حذف شد.', 'success');
              await renderAssignments();
              updateGroupingUI();
              return true;
            },
          });
        });
      });
    }
  }

  async function renderGroups() {
    const groups = DB.listGroups();
    const students = DB.listStudents();
    groupList.innerHTML = groups.length ? '' : '<div class="muted">گروهی ثبت نشده است</div>';
    groups.forEach(g => {
      const count = g.studentIds.length;
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(g.name)}</strong> <span class="muted">— ${count} شاگرد</span></div>
          <div class="actions">
            <button class="btn-sm" data-rename-group="${g.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-group="${g.id}">حذف</button>
          </div>
        </div>`;
      groupList.appendChild(el);
      el.querySelector('[data-rename-group]')?.addEventListener('click', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'dialog-field';
        const label = document.createElement('label');
        label.textContent = 'نام جدید گروه';
        const input = document.createElement('input');
        input.type = 'text';
        input.value = g.name;
        input.className = 'dialog-input';
        label.appendChild(input);
        wrapper.appendChild(label);
        openDialog({
          title: 'ویرایش گروه',
          render: () => wrapper,
          confirmText: 'ذخیره',
          onSubmit: async () => {
            const nextName = input.value.trim();
            if (!nextName) {
              input.classList.add('invalid');
              input.focus();
              return false;
            }
            await DB.updateGroup(g.id, { name: nextName });
            showToast('نام گروه به‌روزرسانی شد.', 'success');
            await renderGroups();
            refreshSelects();
            return true;
          },
        });
        setTimeout(() => input.focus(), 50);
      });
      el.querySelector('[data-del-group]')?.addEventListener('click', () => {
        const body = document.createElement('div');
        body.innerHTML = `<p>گروه <strong>${escapeHtml(g.name)}</strong> حذف شود؟</p><p class="muted">تمام انتساب‌های مرتبط با این گروه نیز حذف می‌شود.</p>`;
        openDialog({
          title: 'حذف گروه',
          render: () => body,
          confirmText: 'حذف گروه',
          confirmVariant: 'danger',
          onSubmit: async () => {
            await DB.deleteGroup(g.id);
            if (groupingSelectedGroupId === g.id) groupingSelectedGroupId = null;
            showToast('گروه حذف شد.', 'success');
            await renderGroups();
            await renderAssignments();
            refreshSelects();
            return true;
          },
        });
      });
    });
    updateGroupingUI();
  }

  async function renderStudents() {
    const students = DB.listStudents().filter(s => !s.status || s.status === 'approved');
    if (approvedStudentCount) approvedStudentCount.textContent = String(students.length);
    const groups = DB.listGroups();
    studentList.innerHTML = students.length ? '' : '<div class="muted">شاگردی ثبت نشده است</div>';
    students.forEach(s => {
      const gName = groups.find(g => g.studentIds.includes(s.id))?.name || '—';
      const emailLabel = s.email ? escapeHtml(s.email) : '—';
      const phoneLabel = s.phone ? escapeHtml(s.phone) : '—';
      const statusChip = (() => {
        if (s.status === 'approved') return '<span class="chip success">تایید شده</span>';
        if (s.status === 'pending') return '<span class="chip">در انتظار تایید</span>';
        if (s.status === 'rejected') return '<span class="chip danger">رد شده</span>';
        return '';
      })();
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <div class="row-between">
          <div>
            <strong>${escapeHtml(s.name)}</strong>
            <div class="muted">گروه: ${escapeHtml(gName)}</div>
            <div class="muted">ایمیل: ${emailLabel}</div>
            <div class="muted">موبایل: ${phoneLabel}</div>
            <div class="chips" style="margin-top:6px">${statusChip}</div>
          </div>
          <div class="actions" data-actions>
            <button class="btn-sm" data-edit-student="${s.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-student="${s.id}">حذف</button>
          </div>
        </div>`;
      studentList.appendChild(el);
      const actionsBox = el.querySelector('[data-actions]');
      if (s.status !== 'approved') {
        const approveBtn = document.createElement('button');
        approveBtn.className = 'btn-sm success';
        approveBtn.textContent = 'تایید';
        approveBtn.addEventListener('click', async () => {
          try {
            await DB.approveStudent(s.id);
            await renderStudents();
            await renderPendingStudents();
            refreshSelects();
            showToast('شاگرد تایید شد.', 'success');
            updateGroupingUI();
          } catch (err) {
            console.error(err);
            showToast(err.message || 'خطا در تایید شاگرد', 'danger');
          }
        });
        actionsBox?.prepend(approveBtn);
      }
      if (s.status !== 'rejected') {
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'btn-sm danger';
        rejectBtn.textContent = 'رد';
        rejectBtn.addEventListener('click', () => {
          const body = document.createElement('p');
          body.innerHTML = `شاگرد <strong>${escapeHtml(s.name)}</strong> رد شود؟`;
          openDialog({
            title: 'رد شاگرد',
            render: () => body,
            confirmText: 'رد شاگرد',
            confirmVariant: 'danger',
            onSubmit: async () => {
              await DB.rejectStudent(s.id);
              showToast('شاگرد رد شد.', 'info');
              await renderStudents();
              await renderPendingStudents();
              refreshSelects();
              updateGroupingUI();
              return true;
            },
          });
        });
        actionsBox?.appendChild(rejectBtn);
      }
      el.querySelector('[data-edit-student]')?.addEventListener('click', () => {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-field';

        const labelName = document.createElement('label');
        labelName.textContent = 'نام شاگرد';
        const inputName = document.createElement('input');
        inputName.type = 'text';
        inputName.value = s.name;
        inputName.className = 'dialog-input';
        labelName.appendChild(inputName);

        const labelEmail = document.createElement('label');
        labelEmail.textContent = 'ایمیل (اختیاری)';
        const inputEmail = document.createElement('input');
        inputEmail.type = 'email';
        inputEmail.value = s.email || '';
        inputEmail.className = 'dialog-input';
        labelEmail.appendChild(inputEmail);

        const labelPhone = document.createElement('label');
        labelPhone.textContent = 'موبایل (اختیاری)';
        const inputPhone = document.createElement('input');
        inputPhone.type = 'tel';
        inputPhone.value = s.phone || '';
        inputPhone.className = 'dialog-input';
        labelPhone.appendChild(inputPhone);

        const labelGroup = document.createElement('label');
        labelGroup.textContent = 'گروه';
        const selectGroup = document.createElement('select');
        selectGroup.className = 'dialog-input';
        const optNone = document.createElement('option');
        optNone.value = '';
        optNone.textContent = 'بدون گروه';
        selectGroup.appendChild(optNone);
        groups.forEach(g => {
          const opt = document.createElement('option');
          opt.value = g.id;
          opt.textContent = g.name;
          if (g.studentIds.includes(s.id) || g.id === s.groupId) opt.selected = true;
          selectGroup.appendChild(opt);
        });
        labelGroup.appendChild(selectGroup);

        dialog.append(labelName, labelEmail, labelPhone, labelGroup);

        openDialog({
          title: 'ویرایش شاگرد',
          render: () => dialog,
          confirmText: 'ذخیره',
          onSubmit: async () => {
            const name = inputName.value.trim();
            const email = inputEmail.value.trim();
            const phone = inputPhone.value.trim();
            if (!name) {
              inputName.classList.add('invalid');
              inputName.focus();
              return false;
            }
            if (!email && !phone) {
              showToast('حداقل یکی از ایمیل یا موبایل را وارد کنید.', 'warning');
              return false;
            }
            await DB.updateStudent(s.id, {
              name,
              email: email || null,
              phone: phone || null,
              groupId: selectGroup.value || null,
            });
            showToast('اطلاعات شاگرد بروزرسانی شد.', 'success');
            await renderStudents();
            refreshSelects();
            updateGroupingUI();
            return true;
          },
        });
        setTimeout(() => inputName.focus(), 50);
      });
      el.querySelector('[data-del-student]')?.addEventListener('click', () => {
        const body = document.createElement('p');
        body.innerHTML = `شاگرد <strong>${escapeHtml(s.name)}</strong> حذف شود؟<br/><span class="muted">پرداخت‌ها، اهداف و گزارش‌های مربوط به این شاگرد نیز حذف می‌شود.</span>`;
        openDialog({
          title: 'حذف شاگرد',
          render: () => body,
          confirmText: 'حذف شاگرد',
          confirmVariant: 'danger',
          onSubmit: async () => {
            await DB.deleteStudent(s.id);
            showToast('شاگرد حذف شد.', 'success');
            await renderStudents();
            await renderAssignments();
            refreshSelects();
            await renderCoachPayments();
            updateGroupingUI();
            return true;
          },
        });
      });
    });
    updateGroupingUI();
  }

  async function renderPendingStudents() {
    if (!pendingStudentList) return;
    pendingStudentList.innerHTML = '<div class="muted">در حال بارگذاری...</div>';
    try {
      const students = DB.listStudents();
      const pending = students.filter(s => s.status === 'pending');
      const rejected = students.filter(s => s.status === 'rejected');
      const total = pending.length + rejected.length;
      if (pendingStudentCount) pendingStudentCount.textContent = String(total);
      if (!total) {
        pendingStudentList.innerHTML = '<div class="muted">همه شاگردها تایید شده‌اند.</div>';
        return;
      }
      pendingStudentList.innerHTML = '';

      const appendGroupTitle = (title) => {
        const titleEl = document.createElement('div');
        titleEl.className = 'pending-group-title muted';
        titleEl.textContent = title;
        pendingStudentList.appendChild(titleEl);
      };

      if (pending.length) appendGroupTitle('در انتظار تایید');
      pending.forEach(s => {
        const el = document.createElement('div'); el.className = 'item';
        const emailLabel = s.email ? escapeHtml(s.email) : '—';
        const phoneLabel = s.phone ? escapeHtml(s.phone) : '—';
        const createdLabel = formatJalaliDate(s.createdAt || new Date().toISOString());
        el.innerHTML = `
          <div class="row-between">
            <div>
              <strong>${escapeHtml(s.name)}</strong>
              <div class="muted">ایمیل: ${emailLabel}</div>
              <div class="muted">موبایل: ${phoneLabel}</div>
              <div class="muted">در تاریخ ${escapeHtml(createdLabel)} ثبت‌نام کرده است.</div>
            </div>
            <div class="actions">
              <button class="btn-sm" data-approve="${s.id}">تایید</button>
              <button class="btn-sm danger" data-reject="${s.id}">رد</button>
            </div>
          </div>`;
        pendingStudentList.appendChild(el);
        el.querySelector('[data-approve]')?.addEventListener('click', async () => {
          try {
            await DB.approveStudent(s.id);
            await renderPendingStudents();
            await renderStudents();
            refreshSelects();
            showToast('شاگرد تایید شد.', 'success');
            updateGroupingUI();
          } catch (err) {
            console.error(err);
            showToast(err.message || 'خطا در تایید شاگرد', 'danger');
          }
        });
        el.querySelector('[data-reject]')?.addEventListener('click', async () => {
          try {
            await DB.rejectStudent(s.id);
            await renderPendingStudents();
            await renderStudents();
            refreshSelects();
            showToast('شاگرد رد شد.', 'info');
            updateGroupingUI();
          } catch (err) {
            console.error(err);
            showToast(err.message || 'خطا در رد شاگرد', 'danger');
          }
        });
      });
      if (rejected.length) appendGroupTitle('رد شده');
      rejected.forEach(s => {
        const el = document.createElement('div'); el.className = 'item';
        const emailLabel = s.email ? escapeHtml(s.email) : '—';
        const phoneLabel = s.phone ? escapeHtml(s.phone) : '—';
        const createdLabel = formatJalaliDate(s.createdAt || new Date().toISOString());
        el.innerHTML = `
          <div class="row-between">
            <div>
              <strong>${escapeHtml(s.name)}</strong>
              <div class="muted">ایمیل: ${emailLabel}</div>
              <div class="muted">موبایل: ${phoneLabel}</div>
              <div class="muted">تاریخ ثبت‌نام: ${escapeHtml(createdLabel)}</div>
              <div class="chips" style="margin-top:6px"><span class="chip danger">رد شده</span></div>
            </div>
            <div class="actions">
              <button class="btn-sm success" data-approve="${s.id}">تایید مجدد</button>
            </div>
          </div>`;
        pendingStudentList.appendChild(el);
        el.querySelector('[data-approve]')?.addEventListener('click', async () => {
          try {
            await DB.approveStudent(s.id);
            await renderPendingStudents();
            await renderStudents();
            refreshSelects();
            showToast('شاگرد تایید شد.', 'success');
            updateGroupingUI();
          } catch (err) {
            console.error(err);
            showToast(err.message || 'خطا در تایید شاگرد', 'danger');
          }
        });
      });
    } catch (err) {
      console.error(err);
      pendingStudentList.innerHTML = '<div class="danger">خطا در دریافت درخواست‌ها</div>';
      if (pendingStudentCount) pendingStudentCount.textContent = '0';
    }
  }

  async function renderAssignments() {
    const assignments = DB.listAssignments();
    const groups = DB.listGroups();
    const students = DB.listStudents();
    const programs = DB.listPrograms();

    assignmentList.innerHTML = assignments.length ? '' : '<div class="muted">انتسابی وجود ندارد</div>';
    assignments.forEach(a => {
      const p = programs.find(p => p.id === a.programId);
      const isGroupTarget = a.targetType === 'group';
      const targetEntity = isGroupTarget
        ? groups.find(g => g.id === a.targetId)
        : students.find(s => s.id === a.targetId);
      const targetTypeLabel = isGroupTarget ? 'گروه' : 'شاگرد';
      const targetName = targetEntity ? (targetEntity.name || 'نامشخص') : 'نامشخص';
      const targetNameSafe = escapeHtml(targetName);
      const targetLabel = `${targetTypeLabel}: ${targetNameSafe}`;
      const rangeLabel = formatJalaliRange(a.startDate, a.endDate);
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(p?.title || 'برنامه نامشخص')}</strong> <span class="muted">→ ${targetLabel}</span><div class="muted">${escapeHtml(rangeLabel)}</div></div>
          <div class="actions">
            <button class="btn-sm" data-edit-asg="${a.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-asg="${a.id}">حذف</button>
          </div>
        </div>`;
      assignmentList.appendChild(el);
      el.querySelector('[data-edit-asg]')?.addEventListener('click', () => {
        const wrapper = document.createElement('div');
        wrapper.className = 'dialog-field';
        const info = document.createElement('div');
        info.className = 'muted';
        info.textContent = targetLabel;
        const labelDate = document.createElement('label');
        labelDate.textContent = 'تاریخ شروع (میلادی)';
        const inputDate = document.createElement('input');
        inputDate.type = 'date';
        inputDate.value = a.startDate || '';
        inputDate.className = 'dialog-input';
        labelDate.appendChild(inputDate);
        const labelDuration = document.createElement('label');
        labelDuration.textContent = 'مدت (روز)';
        const inputDuration = document.createElement('input');
        inputDuration.type = 'number';
        inputDuration.min = '1';
        inputDuration.value = String(a.durationDays || 7);
        inputDuration.className = 'dialog-input';
        labelDuration.appendChild(inputDuration);
        wrapper.append(info, labelDate, labelDuration);
        openDialog({
          title: 'ویرایش انتساب',
          render: () => wrapper,
          confirmText: 'ذخیره',
          onSubmit: async () => {
            const nextDate = inputDate.value;
            const nextDuration = Math.max(1, parseInt(inputDuration.value || '7', 10));
            if (!nextDate) {
              inputDate.classList.add('invalid');
              inputDate.focus();
              return false;
            }
            await DB.updateAssignmentDates(a.id, { startDate: nextDate, durationDays: nextDuration });
            showToast('انتساب بروزرسانی شد.', 'success');
            await renderAssignments();
            updateGroupingUI();
            return true;
          },
        });
      });
      el.querySelector('[data-del-asg]')?.addEventListener('click', () => {
        const body = document.createElement('p');
        body.innerHTML = `انتساب برنامه <strong>${escapeHtml(p?.title || 'برنامه')}</strong> برای <strong>${escapeHtml(targetTypeLabel)}</strong> با نام <strong>${targetNameSafe}</strong> حذف شود؟`;
        openDialog({
          title: 'حذف انتساب',
          render: () => body,
          confirmText: 'حذف',
          confirmVariant: 'danger',
          onSubmit: async () => {
            await DB.deleteAssignment(a.id);
            showToast('انتساب حذف شد.', 'success');
            await renderAssignments();
            updateGroupingUI();
            return true;
          },
        });
      });
    });
    updateGroupingUI();
  }

  async function renderCoachPayments() {
    if (!coachPaymentList) return;
    const payments = DB.listPayments();
    const students = DB.listStudents();
    const selectedStudent = paymentFilterStudent?.value || '';
    const filteredByStudent = selectedStudent ? payments.filter(p => p.studentId === selectedStudent) : payments;

    // search filter
    const q = (paymentSearch?.value || '').trim().toLowerCase();
    const filtered = q
      ? filteredByStudent.filter(p => {
          const s = students.find(x => x.id === p.studentId);
          const name = (s?.name || '').toLowerCase();
          const email = (s?.email || p.studentEmail || '').toLowerCase();
          const note = (p.note || '').toLowerCase();
          const monthLabel = (p.monthJalali ? formatJMonthLabel(p.monthJalali) : (p.month ? Jalali.fromGregorianYYYYMMToJalaliLabel(p.month) : ''))
            .toLowerCase();
          return name.includes(q) || email.includes(q) || note.includes(q) || monthLabel.includes(q);
        })
      : filteredByStudent;
    coachPaymentList.innerHTML = filtered.length ? '' : '<div class="muted">پرداختی یافت نشد</div>';
    filtered.forEach(p => {
      const s = students.find(x => x.id === p.studentId);
      const el = document.createElement('div');
      el.className = 'item payment-item';
      const monthLabel = p.monthJalali ? formatJMonthLabel(p.monthJalali) : (p.month ? Jalali.fromGregorianYYYYMMToJalaliLabel(p.month) : 'بدون ماه');
      const imgUrl = p.imageUrl || p.imageDataUrl || '';
      el.innerHTML = `
        <div class="payment">
          <a href="${imgUrl}" target="_blank" rel="noopener">
            <img src="${imgUrl}" alt="رسید" class="thumb" />
          </a>
          <div class="payment-meta">
            <div><strong>${escapeHtml(s ? s.name : 'نامشخص')}</strong> <span class="muted">${escapeHtml(s ? `(${s.email})` : (p.studentEmail ? `(${p.studentEmail})` : ''))}</span></div>
            <div>${escapeHtml(monthLabel)}</div>
            <div class="muted">${escapeHtml(p.note || '')}</div>
          </div>
          <div class="actions">
            <button class="btn-sm" data-edit-payment="${p.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-payment="${p.id}">حذف</button>
          </div>
        </div>`;
      coachPaymentList.appendChild(el);
      el.querySelector('[data-edit-payment]')?.addEventListener('click', () => {
        const dialog = document.createElement('div');
        dialog.className = 'dialog-field';

        const labelMonth = document.createElement('label');
        labelMonth.textContent = 'ماه (شمسی، مثل 1403-07)';
        const inputMonth = document.createElement('input');
        inputMonth.type = 'text';
        inputMonth.placeholder = 'مثلاً 1403-07';
        inputMonth.value = p.monthJalali || '';
        inputMonth.className = 'dialog-input';
        labelMonth.appendChild(inputMonth);

        const labelNote = document.createElement('label');
        labelNote.textContent = 'توضیح رسید';
        const textareaNote = document.createElement('textarea');
        textareaNote.className = 'dialog-textarea';
        textareaNote.rows = 3;
        textareaNote.value = p.note || '';
        labelNote.appendChild(textareaNote);

        dialog.append(labelMonth, labelNote);

        openDialog({
          title: 'ویرایش پرداخت',
          render: () => dialog,
          confirmText: 'ذخیره',
          onSubmit: async () => {
            const monthValue = inputMonth.value.trim().replace('/', '-');
            const noteValue = textareaNote.value.trim();
            await DB.updatePayment(p.id, { monthJalali: monthValue || null, month: null, note: noteValue });
            showToast('پرداخت بروزرسانی شد.', 'success');
            await renderCoachPayments();
            return true;
          },
        });
        setTimeout(() => inputMonth.focus(), 50);
      });
      el.querySelector('[data-del-payment]')?.addEventListener('click', () => {
        const body = document.createElement('p');
        body.innerHTML = `پرداخت مربوط به <strong>${escapeHtml(s ? s.name : 'شاگرد')}</strong> حذف شود؟`;
        openDialog({
          title: 'حذف پرداخت',
          render: () => body,
          confirmText: 'حذف پرداخت',
          confirmVariant: 'danger',
          onSubmit: async () => {
            await DB.deletePayment(p.id);
            showToast('پرداخت حذف شد.', 'success');
            await renderCoachPayments();
            return true;
          },
        });
      });
    });
  }

  async function renderOverview() {
    if (!ovContent) return;
    const sid = ovStudent?.value || '';
    if (!sid) { ovContent.innerHTML = '<div class="muted">یک شاگرد را از بالا انتخاب کنید یا جستجو کنید.</div>'; return; }
    const students = DB.listStudents();
    const s = students.find(x => x.id === sid);
    if (!s) { ovContent.innerHTML = '<div class="muted">شاگرد یافت نشد</div>'; return; }

    // Profile
    const groups = DB.listGroups();
    const gName = groups.find(g => g.studentIds.includes(s.id))?.name || '—';
    const verified = s.verifiedAt ? '<span class="chip">تایید شده</span>' : '<span class="chip">در انتظار تایید</span>';
    const prof = DB.getStudentProfile(s.id) || {};
    const genderLabel = prof.gender === 'female' ? 'مونث' : (prof.gender === 'male' ? 'مذکر' : '—');
    const birthLabel = prof.birthISO ? formatJalaliDate(prof.birthISO) : '';
    const cycleLabel = prof.cycleApproxISO ? formatJalaliDate(prof.cycleApproxISO) : '';
    const chips = [
      chip('ایمیل', s.email),
      chip('گروه', gName),
      verified,
      (genderLabel !== '—' ? chip('جنسیت', genderLabel) : ''),
      (birthLabel ? chip('تولد', birthLabel) : ''),
      (prof.weightKg!=null ? chip('وزن', `${prof.weightKg} kg`) : ''),
      (prof.heightCm!=null ? chip('قد', `${prof.heightCm} cm`) : ''),
      (cycleLabel ? chip('سیکل', cycleLabel) : ''),
    ].filter(Boolean).join(' ');
    const profileBox = document.createElement('div'); profileBox.className = 'item';
    profileBox.innerHTML = `<div class="row-between">
      <div class="header-user">
        ${prof.photoDataUrl ? `<img src="${prof.photoDataUrl}" class="avatar-sm" alt="" />` : ''}
        <strong>${escapeHtml(s.name)}</strong>
      </div>
    </div>
    <div class="chips" style="margin-top:6px">${chips}</div>`;

    // Charts box
    const chartsBox = document.createElement('div'); chartsBox.className = 'item';
    chartsBox.innerHTML = `
      <div class="section-subtitle">خلاصه تحلیلی</div>
      <div class="form-grid two">
        <div><div class="hint">مسافت ۳۰ روز اخیر</div><canvas id="ovDistChart" height="60"></canvas></div>
        <div><div class="hint">پیس ۱۰ تمرین اخیر</div><canvas id="ovPaceChart" height="60"></canvas></div>
        <div><div class="hint">HR ۱۰ تمرین اخیر</div><canvas id="ovHRChart" height="60"></canvas></div>
        <div><div class="hint">حال ۱۴ روز اخیر</div><canvas id="ovMoodChart" height="60"></canvas></div>
      </div>`;

    // Assignments (programs)
    const asgs = DB.listAssignmentsForStudent(s.id);
    const progs = DB.getProgramsForStudent(s.id);
    const progById = new Map(progs.map(p=>[p.id,p]));
    const asgBox = document.createElement('div'); asgBox.className = 'item';
    if (!asgs.length) {
      asgBox.innerHTML = '<div class="muted">انتساب برنامه‌ای وجود ندارد</div>';
    } else {
      const list = asgs.map(a => {
        const p = progById.get(a.programId);
        const range = formatJalaliRange(a.startDate, a.endDate);
        return `<div class="arch-item"><strong>${escapeHtml(p?.title || 'برنامه')}</strong> <span class="muted">${escapeHtml(range)}</span></div>`;
      }).join('');
      asgBox.innerHTML = `<div class="section-subtitle">برنامه‌ها</div>${list}`;
    }

    // Payments
    const pays = DB.getPaymentsForStudent(s.id);
    const payBox = document.createElement('div'); payBox.className = 'item';
    if (!pays.length) {
      payBox.innerHTML = '<div class="muted">پرداختی ثبت نشده</div>';
    } else {
      const items = pays.map(p => {
        const imgUrl = p.imageUrl || p.imageDataUrl || '';
        const monthLabel = p.monthJalali ? formatJMonthLabel(p.monthJalali) : (p.month ? Jalali.fromGregorianYYYYMMToJalaliLabel(p.month) : 'بدون ماه');
        return `<div class="payment" style="margin:6px 0;">
          <a href="${imgUrl}" target="_blank" rel="noopener"><img src="${imgUrl}" class="thumb" alt="رسید"/></a>
          <div class="payment-meta"><div><strong>${escapeHtml(monthLabel)}</strong></div><div class="muted">${escapeHtml(p.note || '')}</div></div>
        </div>`;
      }).join('');
      payBox.innerHTML = `<div class="section-subtitle">پرداخت‌ها</div>${items}`;
    }

    // Logs (recent up to 10)
    const logs = await DB.listLogsForStudent(s.id);
    const logBox = document.createElement('div'); logBox.className = 'item';
    if (!logs.length) {
      logBox.innerHTML = '<div class="muted">گزارش روزانه ثبت نشده</div>';
    } else {
      const items = logs.slice(0, 10).map(l => {
        const dateLabel = formatJalaliDate(l.date);
        const dayLabel = dayKeyLabel(l.dayKey);
        const chips = [
          (dayLabel ? chip('روز', dayLabel) : ''),
          (l.moodEmoji ? chip('حال', l.moodEmoji) : (l.mood ? chip('حال', scaleLabel(l.mood)) : '')),
          (l.sleepQuality ? chip('خواب', scaleLabel(l.sleepQuality)) : ''),
          (l.sleepHours!=null ? chip('ساعت خواب', String(l.sleepHours)) : ''),
          (l.nutrition ? chip('تغذیه', scaleLabel(l.nutrition)) : ''),
          (l.rpe!=null ? chip('RPE', String(l.rpe)) : ''),
          distanceChip(l),
          paceChip(l),
          hrChip(l),
          (l.location ? chip('محل', l.location) : ''),
          (l.shoe ? chip('کفش', l.shoe) : ''),
          (l.companions ? chip('همراهان', l.companions) : ''),
        ].filter(Boolean).join(' ');
        return `<div class="arch-item"><strong>${escapeHtml(dateLabel)}</strong><div class="chips" style="margin-top:6px">${chips}</div><div class="muted">${escapeHtml(l.note||'')}</div></div>`;
      }).join('');
      logBox.innerHTML = `<div class="section-subtitle">گزارش‌های اخیر</div>${items}`;
    }

    // Goals (with metrics)
    const goals = await DB.listGoalsForStudent(s.id);
    const goalBox = document.createElement('div'); goalBox.className = 'item';
    if (!goals.length) {
      goalBox.innerHTML = '<div class="muted">هدف ثبت نشده</div>';
    } else {
      const items = goals.map(g => {
        const chips = [];
        if (g.targetDistanceKm != null) chips.push(chip('هدف مسافت', `${g.targetDistanceKm} km`));
        if (g.targetPaceSecPerKm != null){ const mm=Math.floor(g.targetPaceSecPerKm/60), ss=Math.round(g.targetPaceSecPerKm%60); chips.push(chip('هدف پیس', `${mm}:${String(ss).padStart(2,'0')} /km`)); }
        if (g.targetDurationSec != null){ const hh=Math.floor(g.targetDurationSec/3600), mm2=Math.floor((g.targetDurationSec%3600)/60), ss2=Math.floor(g.targetDurationSec%60); chips.push(chip('هدف زمان', `${String(hh).padStart(2,'0')}:${String(mm2).padStart(2,'0')}:${String(ss2).padStart(2,'0')}`)); }
        const msHtml = (g.milestones||[]).map(ms => `<div class=\"milestone\"><label style=\"display:flex; gap:8px; align-items:center;\"><input type=\"checkbox\" disabled ${ms.done?'checked':''} /><span ${ms.done?'class=\\"done\\"':''}>${escapeHtml(ms.text)}</span></label></div>`).join('');
        const chipHtml = chips.length ? `<div class=\"chips\" style=\"margin:6px 0\">${chips.join(' ')}</div>` : '';
        return `<div class=\"arch-item\"><strong>${escapeHtml(g.title)}</strong>${chipHtml}<div class=\"milestones\" style=\"margin-top:6px\">${msHtml || '<span class=\\"muted\\">پیش‌هدف ندارد</span>'}</div></div>`;
      }).join('');
      goalBox.innerHTML = `<div class="section-subtitle">اهداف</div>${items}`;
    }

    ovContent.innerHTML = '';
    ovContent.appendChild(profileBox);
    ovContent.appendChild(chartsBox);
    ovContent.appendChild(asgBox);
    ovContent.appendChild(payBox);
   ovContent.appendChild(logBox);
   ovContent.appendChild(goalBox);

    // After DOM is in place, draw charts
    drawOverviewCharts(logs || []);

    // day comments disabled
  }

  async function renderCoachDayComments(studentId, programId, dayKey, container){
    const cmts = await DB.listDayComments(programId, studentId, dayKey);
    container.innerHTML = '';
    const list = document.createElement('div'); list.className = 'list';
    if (!cmts.length) {
      const empty = document.createElement('div'); empty.className = 'muted'; empty.textContent = 'پیامی ثبت نشده';
      container.appendChild(empty);
    } else {
      cmts.forEach(c => {
        const row = document.createElement('div'); row.className = 'item';
        const who = c.author === 'coach' ? 'مربی' : (c.authorName || 'شاگرد');
        row.innerHTML = `<div><strong>${escapeHtml(who)}</strong> <span class="muted">${escapeHtml(formatJalaliDateTime(c.createdAt))}</span></div><div>${escapeHtml(c.text)}</div>`;
        list.appendChild(row);
      });
      container.appendChild(list);
    }
    const form = document.createElement('form'); form.className = 'mini';
    form.innerHTML = `<input type="text" placeholder="پیام مربی برای این روز..." /><button type="submit">ارسال</button>`;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const inp = form.querySelector('input'); const text = (inp.value||'').trim(); if(!text) return;
      try {
        await DB.addDayComment({ programId, studentId, dayKey, author: 'coach', authorName: 'coach', text });
        inp.value='';
        await renderCoachDayComments(studentId, programId, dayKey, container);
        showToast('پیام ارسال شد.', 'success');
      } catch (err) {
        console.error(err);
        showToast(err.message || 'ارسال پیام انجام نشد.', 'danger');
      }
    });
    container.appendChild(form);
  }

  function drawOverviewCharts(logs){
    const distC = document.getElementById('ovDistChart');
    const paceC = document.getElementById('ovPaceChart');
    const hrC = document.getElementById('ovHRChart');
    const moodC = document.getElementById('ovMoodChart');
    if (distC) {
      const days = 30; const today = new Date(); today.setHours(12,0,0,0);
      const series = [];
      for(let i=days-1;i>=0;i--){ const d0=new Date(today); d0.setDate(today.getDate()-i); const iso=`${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`; const sum = logs.filter(l=>l.date===iso).reduce((a,l)=>a+(Number(l.distanceKm)||0),0); series.push(sum); }
      drawSparkline(distC, series, { color: '#0ea5e9' });
    }
    if (paceC) {
      const runs = logs.filter(l=> (l.distanceKm||0)>0 && (l.durationSec||0)>0).slice(0,10).reverse();
      const series = runs.map(l=> l.durationSec / l.distanceKm);
      drawSparkline(paceC, series, { color: '#f97316', invertY: true });
    }
    if (hrC) {
      const hrs = logs.filter(l=> l.hrAvg!=null).slice(0,10).reverse();
      const series = hrs.map(l=> Number(l.hrAvg)||0);
      drawSparkline(hrC, series, { color: '#ef4444' });
    }
    if (moodC) {
      const days = 14; const today = new Date(); today.setHours(12,0,0,0);
      const series = [];
      for(let i=days-1;i>=0;i--){ const d0=new Date(today); d0.setDate(today.getDate()-i); const iso=`${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`; const l = logs.find(x=>x.date===iso); const val = l ? (l.moodEmoji ? emojiToScale(l.moodEmoji) : (Number(l.mood)||0)) : 0; series.push(val); }
      drawSparkline(moodC, series, { color: '#22c55e' });
    }
  }

  function emojiToScale(e){ const map = { '😫':1,'😕':2,'😐':3,'🙂':4,'😄':5 }; return map[e] || 0; }
  function drawSparkline(canvas, values, opts={}){
    const color = opts.color || '#000'; const invertY = !!opts.invertY; const dpr = window.devicePixelRatio || 1;
    let w = canvas.clientWidth || 320; let h = canvas.height || 60; if (w < 100) w = 320;
    canvas.width = w * dpr; canvas.height = h * dpr; const ctx = canvas.getContext('2d'); ctx.scale(dpr, dpr); ctx.clearRect(0,0,w,h);
    const n = values.length||0; if(!n) return; const min = Math.min(...values), max = Math.max(...values); const pad=4, innerH=h-pad*2, innerW=w-pad*2; const range=(max-min)||1;
    ctx.strokeStyle=color; ctx.lineWidth=2; ctx.beginPath(); values.forEach((v,i)=>{ const x=pad + innerW * (i/(n-1||1)); const nv=(v-min)/range; const y= pad + innerH * (invertY? nv : (1-nv)); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }); ctx.stroke();
  }

  async function renderCoachLogs() {
    if (!coachLogList) return;
    const students = DB.listStudents();
    const selectedStudent = logFilterStudent?.value || '';
    // gather logs with student context
    let items = [];
    await Promise.all(students.map(async s => {
      if (selectedStudent && s.id !== selectedStudent) return;
      const logs = await DB.listLogsForStudent(s.id);
      logs.forEach(l => items.push({ l, s }));
    }));
    // search
    const q = (logSearch?.value || '').trim().toLowerCase();
    if (q) {
      items = items.filter(({ l, s }) => {
        const progs = DB.getProgramsForStudent(s.id) || [];
        const pTitle = l.programId ? (progs.find(p => p.id === l.programId)?.title || '') : '';
        return [s.name, s.email, l.note, l.location, l.shoe, l.companions, pTitle]
          .some(v => String(v || '').toLowerCase().includes(q));
      });
    }
    coachLogList.innerHTML = items.length ? '' : '<div class="muted">گزارشی ثبت نشده</div>';
    items.forEach(({ l, s }) => {
      const progs = DB.getProgramsForStudent(s.id) || [];
      const p = l.programId ? progs.find(pp => pp.id === l.programId) : null;
      const el = document.createElement('div'); el.className = 'item';
      const dateLabel = formatJalaliDate(l.date);
      const dayLabel = dayKeyLabel(l.dayKey);
      const chips = [
        chip('شاگرد', `${s.name}`),
        (p ? chip('برنامه', p.title) : chip('برنامه', 'آزاد')),
        (dayLabel ? chip('روز', dayLabel) : ''),
        (l.moodEmoji ? chip('حال', l.moodEmoji) : (l.mood ? chip('حال', scaleLabel(l.mood)) : '')),
        (l.sleepQuality ? chip('خواب', scaleLabel(l.sleepQuality)) : ''),
        (l.sleepHours!=null ? chip('ساعت خواب', String(l.sleepHours)) : ''),
        (l.nutrition ? chip('تغذیه', scaleLabel(l.nutrition)) : ''),
        (l.rpe!=null ? chip('RPE', String(l.rpe)) : ''),
        distanceChip(l),
        paceChip(l),
        hrChip(l),
        (l.location ? chip('محل', l.location) : ''),
        (l.shoe ? chip('کفش', l.shoe) : ''),
        (l.companions ? chip('همراهان', l.companions) : ''),
      ].filter(Boolean).join(' ');
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(dateLabel)}</strong><div class="chips" style="margin-top:6px">${chips}</div><div class="muted">${escapeHtml(l.note||'')}</div></div>
        </div>
        <div class="muted" style="margin-top:6px">
          <button class="btn-sm" data-toggle-cmt="${l.id}">کامنت‌ها</button>
        </div>
        <div class="comments" data-cmts="${l.id}" style="display:none; margin-top:6px"></div>
      `;
      coachLogList.appendChild(el);
    });

    // bind comments toggle
    coachLogList.querySelectorAll('[data-toggle-cmt]')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-cmt');
        const wrap = coachLogList.querySelector(`[data-cmts="${id}"]`);
        if (!wrap) return;
        const isHidden = wrap.style.display === 'none';
        wrap.style.display = isHidden ? '' : 'none';
        if (isHidden) renderCoachCommentsForLog(id, wrap).catch(err => console.error(err));
      });
    });
  }

  async function renderCoachCommentsForLog(logId, container){
    const cmts = await DB.listCommentsForLog(logId);
    container.innerHTML = '';
    const list = document.createElement('div'); list.className = 'list';
    if (!cmts.length) {
      const empty = document.createElement('div'); empty.className = 'muted'; empty.textContent = 'کامنتی ثبت نشده';
      container.appendChild(empty);
    } else {
      cmts.forEach(c => {
        const row = document.createElement('div'); row.className = 'item';
        const who = c.author === 'coach' ? 'مربی' : (c.authorName || 'شاگرد');
        row.innerHTML = `<div><strong>${escapeHtml(who)}</strong> <span class="muted">${escapeHtml(formatJalaliDateTime(c.createdAt))}</span></div><div>${escapeHtml(c.text)}</div>`;
        list.appendChild(row);
      });
      container.appendChild(list);
    }
    const form = document.createElement('form'); form.className = 'mini'; form.setAttribute('data-cmt-form', logId);
    form.innerHTML = `<input type="text" placeholder="نوشتن نظر مربی..." /><button type="submit">ارسال</button>`;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const inp = form.querySelector('input');
      const text = (inp.value || '').trim(); if(!text) return;
      try {
        await DB.addComment({ logId, author: 'coach', authorName: 'coach', text });
        inp.value='';
        await renderCoachCommentsForLog(logId, container);
        showToast('نظر ثبت شد.', 'success');
      } catch (err) {
        console.error(err);
        showToast(err.message || 'ارسال نظر انجام نشد.', 'danger');
      }
    });
    container.appendChild(form);
  }

  function formatJalaliDateTime(iso){
    try {
      const d = new Date(iso);
      const j = Jalali.toJalali(d.getFullYear(), d.getMonth()+1, d.getDate());
      const hh = String(d.getHours()).padStart(2,'0');
      const mm = String(d.getMinutes()).padStart(2,'0');
      return `${j.jy} ${Jalali.monthNames[j.jm-1]} ${j.jd}، ${hh}:${mm}`;
    } catch { return ''; }
  }

  async function renderCoachGoals() {
    if (!coachGoalList) return;
    const sid = goalFilterStudent?.value || '';
    coachGoalList.innerHTML = sid ? '' : '<div class="muted">یک شاگرد را انتخاب کنید</div>';
    if (!sid) return;
    const goals = await DB.listGoalsForStudent(sid);
    coachGoalList.innerHTML = goals.length ? '' : '<div class="muted">هدف ثبت نشده</div>';
    goals.forEach(g => {
      const el = document.createElement('div'); el.className = 'item';
      const msHtml = (g.milestones||[]).map(ms => `<div class="milestone"><label style=\"display:flex; gap:8px; align-items:center;\"><input type=\"checkbox\" disabled ${ms.done?'checked':''} /><span ${ms.done?'class=\\"done\\"':''}>${escapeHtml(ms.text)}</span></label></div>`).join('');
      el.innerHTML = `<div class=\"row-between\"><div><strong>${escapeHtml(g.title)}</strong></div></div><div class=\"milestones\" style=\"margin-top:6px\">${msHtml || '<span class=\\"muted\\">پیش‌هدف ندارد</span>'}</div>`;
      coachGoalList.appendChild(el);
    });
  }

  // helpers for logs/goals
  function scaleLabel(v){ const map = {0:'—',1:'خیلی بد',2:'بد',3:'معمولی',4:'خوب',5:'عالی'}; return map[Number(v)||0] || '—'; }
  function dayKeyLabel(key){ const wk = DB.defaultWeek(); const d = wk.find(x=>x.key===key); return d ? d.label : ''; }
  function chip(label, value){ return `<span class=\"chip\">${escapeHtml(label)}: ${escapeHtml(value)}</span>`; }
  function distanceChip(l){ return (l.distanceKm ? chip('مسافت', `${l.distanceKm} km`) : ''); }
  function paceChip(l){ const dist=l.distanceKm||0, dur=l.durationSec||0; if(!dist||!dur) return ''; const s=dur/dist; const mm=Math.floor(s/60), ss=Math.round(s%60); return chip('پیس', `${mm}:${String(ss).padStart(2,'0')} /km`); }
  function hrChip(l){ return (l.hrAvg!=null ? chip('HR', `${l.hrAvg} bpm`) : ''); }

  // Event handlers
  programForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = programTitle.value.trim();
    const description = programDesc.value.trim();
    if (!title) {
      showToast('عنوان برنامه را وارد کنید.', 'warning');
      return;
    }
    const week = [
      { key: 'sat', content: (w_sat?.value || '').trim() },
      { key: 'sun', content: (w_sun?.value || '').trim() },
      { key: 'mon', content: (w_mon?.value || '').trim() },
      { key: 'tue', content: (w_tue?.value || '').trim() },
      { key: 'wed', content: (w_wed?.value || '').trim() },
      { key: 'thu', content: (w_thu?.value || '').trim() },
      { key: 'fri', content: (w_fri?.value || '').trim() },
    ];
    try {
      await DB.addProgram({ title, description, week });
      programTitle.value = '';
      programDesc.value = '';
      if (w_sat) w_sat.value = '';
      if (w_sun) w_sun.value = '';
      if (w_mon) w_mon.value = '';
      if (w_tue) w_tue.value = '';
      if (w_wed) w_wed.value = '';
      if (w_thu) w_thu.value = '';
      if (w_fri) w_fri.value = '';
      await renderPrograms();
      refreshSelects();
      showToast('برنامه جدید ثبت شد.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'ثبت برنامه انجام نشد.', 'danger');
    }
  });

  groupingCreateForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = (groupingCreateName?.value || '').trim();
    if (!name) {
      showToast('نام گروه را وارد کنید.', 'warning');
      return;
    }
    try {
      const created = await DB.addGroup({ name });
      if (groupingCreateName) groupingCreateName.value = '';
      groupingSelectedGroupId = created?.id || groupingSelectedGroupId;
      await renderGroups();
      refreshSelects();
      showToast('گروه جدید ثبت شد.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'ثبت گروه انجام نشد.', 'danger');
    }
  });

  groupingSearchInput?.addEventListener('input', () => updateGroupingUI());

  groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = groupName.value.trim();
    if (!name) {
      showToast('نام گروه را وارد کنید.', 'warning');
      return;
    }
    try {
      await DB.addGroup({ name });
      groupName.value = '';
      await renderGroups();
      refreshSelects();
      showToast('گروه جدید ثبت شد.', 'success');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'ثبت گروه انجام نشد.', 'danger');
    }
  });

  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = studentName.value.trim();
    const email = studentEmail.value.trim();
    const phone = studentPhone.value.trim();
    const groupId = studentGroup.value;
    if (!name || !groupId) {
      showToast('نام و گروه الزامی هستند.', 'warning');
      return;
    }
    if (!email && !phone) {
      showToast('حداقل یکی از ایمیل یا موبایل را وارد کنید.', 'warning');
      return;
    }
    try {
      await DB.addStudent({ name, email: email || null, phone: phone || null, groupId });
      studentName.value = '';
      studentEmail.value = '';
      if (studentPhone) studentPhone.value = '';
      if (studentGroup) studentGroup.selectedIndex = 0;
      await renderStudents();
      await renderGroups();
      refreshSelects();
      updateGroupingUI();
      showToast('شاگرد جدید ثبت شد.', 'success');
    } catch (err) {
      showToast(err.message || 'خطا در افزودن شاگرد', 'danger');
    }
  });

  assignTabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.assignTarget || 'groups';
      switchAssignTab(target);
    });
  });
  switchAssignTab('groups');

  assignGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const programId = assignProgramForGroup.value;
    const selectedGroups = assignGroupTargets
      ? Array.from(assignGroupTargets.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
      : [];
    const startDate = assignGroupStartISO.value || new Date().toISOString().slice(0, 10);
    const durationDays = Math.max(1, parseInt(assignGroupDuration.value || '7', 10));
    if (!programId) {
      showToast('لطفاً یک برنامه را انتخاب کنید.', 'warning');
      return;
    }
    if (!selectedGroups.length) {
      showToast('حداقل یک گروه را انتخاب کنید.', 'warning');
      return;
    }
    let successCount = 0;
    for (const gid of selectedGroups) {
      try {
        await DB.assignProgramToGroup(programId, gid, { startDate, durationDays });
        successCount += 1;
      } catch (err) {
        console.error(err);
        showToast(err.message || 'خطا در انتساب برنامه به گروه', 'danger');
      }
    }
    if (successCount) {
      showToast(`برنامه برای ${successCount} گروه ثبت شد.`, 'success');
      await renderAssignments();
      updateGroupingUI();
    }
  });

  assignStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const programId = assignProgramForStudent.value;
    const selectedStudents = assignStudentTargets
      ? Array.from(assignStudentTargets.querySelectorAll('input[type="checkbox"]:checked')).map(cb => cb.value)
      : [];
    const startDate = assignStudentStartISO.value || new Date().toISOString().slice(0, 10);
    const durationDays = Math.max(1, parseInt(assignStudentDuration.value || '7', 10));
    if (!programId) {
      showToast('لطفاً یک برنامه را انتخاب کنید.', 'warning');
      return;
    }
    if (!selectedStudents.length) {
      showToast('حداقل یک شاگرد را انتخاب کنید.', 'warning');
      return;
    }
    let successCount = 0;
    for (const sid of selectedStudents) {
      try {
        await DB.assignProgramToStudent(programId, sid, { startDate, durationDays });
        successCount += 1;
      } catch (err) {
        console.error(err);
        showToast(err.message || 'خطا در انتساب برنامه به شاگرد', 'danger');
      }
    }
    if (successCount) {
      showToast(`برنامه برای ${successCount} شاگرد ثبت شد.`, 'success');
      await renderAssignments();
    }
  });

  paymentFilterStudent?.addEventListener('change', runAsync(renderCoachPayments));
  clearPaymentFilter?.addEventListener('click', async () => {
    if (paymentFilterStudent) paymentFilterStudent.value = '';
    if (paymentSearch) paymentSearch.value = '';
    await renderCoachPayments();
  });

  paymentSearch?.addEventListener('input', runAsync(renderCoachPayments));

  // Overview filter logic
  ovSearch?.addEventListener('input', () => {
    const q = (ovSearch.value || '').trim().toLowerCase();
    const students = DB.listStudents();
    const match = students.find(s => (`${s.name} ${s.email}`).toLowerCase().includes(q));
    if (match && ovStudent) ovStudent.value = match.id;
    else if (ovStudent && !q) ovStudent.value = '';
    runAsync(renderOverview)();
  });
  ovStudent?.addEventListener('change', runAsync(renderOverview));
  ovClear?.addEventListener('click', () => {
    if(ovSearch) ovSearch.value='';
    if(ovStudent) ovStudent.value='';
    runAsync(renderOverview)();
  });

  // Logs/Goals filters
  logFilterStudent?.addEventListener('change', runAsync(renderCoachLogs));
  logSearch?.addEventListener('input', runAsync(renderCoachLogs));
  clearLogFilter?.addEventListener('click', () => {
    if (logFilterStudent) logFilterStudent.value='';
    if (logSearch) logSearch.value='';
    runAsync(renderCoachLogs)();
  });
  goalFilterStudent?.addEventListener('change', runAsync(renderCoachGoals));

  seedDemoBtn.addEventListener('click', runAsync(async () => {
    try {
      await DB.seedDemo();
      showToast('داده‌ی نمونه افزوده شد. ایمیل ورود شاگرد نمونه: ali@example.com', 'success');
    } catch (err) {
      console.error(err);
      showToast('افزودن داده نمونه ناموفق بود (ممکن است قبلاً اضافه شده باشد).', 'warning');
    }
    await renderPrograms();
    await renderGroups();
    await renderStudents();
    await renderPendingStudents();
    await renderAssignments();
    refreshSelects();
    await renderCoachPayments();
    await renderOverview();
    await renderCoachLogs();
    await renderCoachGoals();
  }));

  async function attemptRestoreSession() {
    if (!coachToken) {
      showLoginView();
      return;
    }
    try {
      const data = await API.coachProfile();
      coachProfile = data?.coach || null;
      await enterCoachApp();
  } catch (err) {
    console.warn('Coach session invalid', err);
    const lastEmail = coachProfile?.email || coachLoginEmail?.value || '';
    persistCoachToken('');
    coachProfile = null;
    if (coachLoginEmail) coachLoginEmail.value = lastEmail;
    showLoginView('نشست منقضی شده است. لطفاً دوباره وارد شوید.');
  }
}

  coachLoginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (coachLoginMsg) coachLoginMsg.textContent = '';
    const email = (coachLoginEmail?.value || '').trim();
    const password = (coachLoginPassword?.value || '').trim();
    if (!email || !password) {
      if (coachLoginMsg) coachLoginMsg.textContent = 'ایمیل و پسورد را وارد کنید.';
      return;
    }
    try {
      const data = await API.coachLogin({ email, password });
      persistCoachToken(data.token);
      coachProfile = data.coach || null;
      if (coachLoginEmail && coachProfile?.email) coachLoginEmail.value = coachProfile.email;
      if (coachLoginPassword) coachLoginPassword.value = '';
      await enterCoachApp();
    } catch (err) {
      if (coachLoginMsg) coachLoginMsg.textContent = err.message || 'خطا در ورود';
    }
  });

  coachLogoutBtn?.addEventListener('click', () => {
    const body = document.createElement('p');
    body.textContent = 'از حساب مربی خارج شوید؟';
    openDialog({
      title: 'خروج از حساب',
      render: () => body,
      confirmText: 'خروج',
      confirmVariant: 'danger',
      onSubmit: async () => {
        const lastEmail = coachProfile?.email || coachLoginEmail?.value || '';
        persistCoachToken('');
        coachProfile = null;
        if (coachLoginEmail) coachLoginEmail.value = lastEmail;
        showLoginView('با موفقیت خارج شدید.');
        showToast('با موفقیت خارج شدید.', 'info');
        return true;
      },
    });
  });

  await attemptRestoreSession();

  // Helpers
  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // Sidebar behavior
  sideLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      sideLinks.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const name = btn.getAttribute('data-panel');
      panels.forEach(p => {
        const match = p.getAttribute('data-panel') === name;
        p.hidden = !match;
      });
    });
  });

  async function loadAllData() {
    if (typeof DB.reload === 'function') {
      await DB.reload();
    }
    await renderPrograms();
    await renderGroups();
    await renderStudents();
    await renderPendingStudents();
    await renderAssignments();
    refreshSelects();
    await renderCoachPayments();
    await renderOverview();
    await renderCoachLogs();
    await renderCoachGoals();
    if (!appInitialized) {
      initJDatePicker('g');
      initJDatePicker('s');
      appInitialized = true;
    }
  }
}

function formatJMonthLabel(jStr){
  const parts = String(jStr||'').split('-');
  if(parts.length<2) return jStr || '';
  const jy = +parts[0], jm = +parts[1];
  return Jalali.formatJalaliMonth(jy, jm);
}

function formatJalaliRange(startISO, endISO){
  if(!startISO && !endISO) return '';
  const s = parseISODate(startISO);
  const e = parseISODate(endISO || startISO);
  const sj = Jalali.toJalali(s.getFullYear(), s.getMonth()+1, s.getDate());
  const ej = Jalali.toJalali(e.getFullYear(), e.getMonth()+1, e.getDate());
  const sLabel = `${sj.jy} ${Jalali.monthNames[sj.jm-1]} ${sj.jd}`;
  const eLabel = `${ej.jy} ${Jalali.monthNames[ej.jm-1]} ${ej.jd}`;
  return `از ${sLabel} تا ${eLabel}`;
}

function parseISODate(iso){
  const [y,m,d] = String(iso||'').split('-').map(v=>parseInt(v,10));
  return new Date(y||1970, (m||1)-1, d||1, 12, 0, 0, 0);
}
function formatJalaliDate(iso){
  const d = parseISODate(iso);
  const j = Jalali.toJalali(d.getFullYear(), d.getMonth()+1, d.getDate());
  return `${j.jy} ${Jalali.monthNames[j.jm-1]} ${j.jd}`;
}
function initJDatePicker(prefix){
  const txt = document.getElementById(prefix + 'JDate')?.querySelector('input[type="text"]');
  const hidden = document.getElementById(prefix + 'JDate')?.querySelector('input[type="hidden"]');
  const toggle = document.getElementById(prefix + 'JDateToggle');
  const popup = document.getElementById(prefix + 'JDatePopup');
  const prev = document.getElementById(prefix + 'Prev');
  const next = document.getElementById(prefix + 'Next');
  const ymLabel = document.getElementById(prefix + 'YMLabel');
  const daysWrap = document.getElementById(prefix + 'Days');
  if(!txt || !hidden || !toggle || !popup || !prev || !next || !ymLabel || !daysWrap) return;

  const today = new Date();
  let j = Jalali.toJalali(today.getFullYear(), today.getMonth()+1, today.getDate());
  let jy = j.jy, jm = j.jm, jd = j.jd;

  function setSelected(jy0, jm0, jd0){
    jy = jy0; jm = jm0; jd = jd0;
    txt.value = `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
    const g = Jalali.toGregorian(jy, jm, jd);
    const iso = `${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;
    hidden.value = iso;
  }

  function render(){
    ymLabel.textContent = `${jy} ${Jalali.monthNames[jm-1]}`;
    daysWrap.innerHTML = '';
    daysWrap.className = 'j-days';
    const gFirst = Jalali.toGregorian(jy, jm, 1);
    const dFirst = new Date(gFirst.gy, gFirst.gm-1, gFirst.gd);
    const jsStart = dFirst.getDay(); // 0 Sun ..6 Sat
    const satFirst = {6:0,0:1,1:2,2:3,3:4,4:5,5:6}[jsStart] ?? 0;
    // leading blanks
    for(let i=0;i<satFirst;i++){
      const b = document.createElement('div'); b.className='j-day blank'; daysWrap.appendChild(b);
    }
    const daysInMonth = jMonthDays(jy, jm);
    for(let d=1; d<=daysInMonth; d++){
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'j-day'; btn.textContent = d;
      if(d===jd) btn.classList.add('selected');
      btn.onclick = ()=>{ setSelected(jy, jm, d); popup.hidden = true; };
      daysWrap.appendChild(btn);
    }
  }

  function jMonthDays(jy, jm){
    const g1 = Jalali.toGregorian(jy, jm, 1);
    const jy2 = jm===12 ? jy+1 : jy; const jm2 = jm===12 ? 1 : jm+1;
    const g2 = Jalali.toGregorian(jy2, jm2, 1);
    const d1 = new Date(g1.gy, g1.gm-1, g1.gd);
    const d2 = new Date(g2.gy, g2.gm-1, g2.gd);
    return Math.round((d2 - d1) / 86400000);
  }

  toggle.onclick = ()=>{ popup.hidden = !popup.hidden; };
  prev.onclick = ()=>{ if(jm===1){ jm=12; jy--; } else { jm--; } render(); };
  next.onclick = ()=>{ if(jm===12){ jm=1; jy++; } else { jm++; } render(); };
  document.addEventListener('click', (e)=>{
    const root = document.getElementById(prefix + 'JDate');
    if(root && !root.contains(e.target)) popup.hidden = true;
  });

  // initialize to today
  setSelected(jy, jm, jd);
  render();
}
