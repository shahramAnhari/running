document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    try {
      await (window.DB?.ready || Promise.resolve());
    } catch (err) {
      console.error('DB init failed', err);
    }

  const authTabs = document.querySelectorAll('[data-auth]');
  const authViews = document.querySelectorAll('[data-auth-view]');
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const rememberMe = document.getElementById('rememberMe');
  const registerForm = document.getElementById('registerForm');
  const registerName = document.getElementById('registerName');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const registerPasswordConfirm = document.getElementById('registerPasswordConfirm');
  const forgotRequestForm = document.getElementById('forgotRequestForm');
  const forgotEmail = document.getElementById('forgotEmail');
  const forgotResetForm = document.getElementById('forgotResetForm');
  const forgotResetEmail = document.getElementById('forgotResetEmail');
  const forgotTokenInput = document.getElementById('forgotToken');
  const forgotNewPassword = document.getElementById('forgotNewPassword');
  const appArea = document.getElementById('appArea');
  const studentPrograms = document.getElementById('studentPrograms');
  const authAlert = document.getElementById('authAlert');

  // Sidebar panels
  const sideLinks = document.querySelectorAll('.side-link');
  const panels = document.querySelectorAll('.panel');

  // Payments
  const paymentForm = document.getElementById('paymentForm');
  const paymentMonthJalali = document.getElementById('paymentMonthJalali');
  const paymentMonthJalaliHidden = document.getElementById('paymentMonthJalaliHidden');
  const paymentNote = document.getElementById('paymentNote');
  const paymentImage = document.getElementById('paymentImage');
  const paymentList = document.getElementById('paymentList');

  // Goals
  const goalForm = document.getElementById('goalForm');
  const goalTitle = document.getElementById('goalTitle');
  const goalDist = document.getElementById('goalDist');
  const goalPaceM = document.getElementById('goalPaceM');
  const goalPaceS = document.getElementById('goalPaceS');
  const goalH = document.getElementById('goalH');
  const goalM = document.getElementById('goalM');
  const goalS = document.getElementById('goalS');
  const goalList = document.getElementById('goalList');
  const archiveList = document.getElementById('archiveList');

  // Calculators - Heart Rate
  const hrQuickForm = document.getElementById('hrQuickForm');
  const hrQuickAge = document.getElementById('hrQuickAge');
  const hrSex = document.getElementById('hrSex');
  const hrRest = document.getElementById('hrRest');
  const hrQuickResult = document.getElementById('hrQuickResult');
  const hrForm = document.getElementById('hrForm');
  const hrBeats = document.getElementById('hrBeats');
  const hrSeconds = document.getElementById('hrSeconds');
  const hrAge = document.getElementById('hrAge');
  const hrResult = document.getElementById('hrResult');

  // Calculators - Pace
  const paceForm = document.getElementById('paceForm');
  const paceDistance = document.getElementById('paceDistance');
  const paceH = document.getElementById('paceH');
  const paceM = document.getElementById('paceM');
  const paceS = document.getElementById('paceS');
  const paceResult = document.getElementById('paceResult');

  // Training Log
  const logForm = document.getElementById('logForm');
  const logSession = document.getElementById('logSession');
  const logMood = document.getElementById('logMood');
  const logDay = document.getElementById('logDay');
  const logSleepQ = document.getElementById('logSleepQ');
  const logSleepH = document.getElementById('logSleepH');
  const logNutrition = document.getElementById('logNutrition');
  const logRPE = document.getElementById('logRPE');
  const logEmoji = document.getElementById('logEmoji');
  const logCompleted = document.getElementById('logCompleted');
  const logLocation = document.getElementById('logLocation');
  const logShoe = document.getElementById('logShoe');
  const logBuddies = document.getElementById('logBuddies');
  const logDist = document.getElementById('logDist');
  const logH = document.getElementById('logH');
  const logM = document.getElementById('logM');
  const logS = document.getElementById('logS');
  const logHR = document.getElementById('logHR');
  const logNote = document.getElementById('logNote');
  const logEditingId = document.getElementById('logEditingId');
  const logSubmit = document.getElementById('logSubmit');
  const logCancel = document.getElementById('logCancel');
  const logList = document.getElementById('logList');
  const logPaceHint = document.getElementById('logPaceHint');
  const emojiQuick = document.getElementById('emojiQuick');
  const stDistChart = document.getElementById('stDistChart');
  const stPaceChart = document.getElementById('stPaceChart');
  const stHRChart = document.getElementById('stHRChart');
  const stMoodChart = document.getElementById('stMoodChart');
  const logSelectedDateBadge = document.getElementById('logSelectedDate');
  const logTabButtons = document.querySelectorAll('[data-log-view-tab]');
  const logViews = document.querySelectorAll('[data-log-view]');
  // Profile
  const profileForm = document.getElementById('profileForm');
  const profName = document.getElementById('profName');
  const profGender = document.getElementById('profGender');
  const profBirthJalali = document.getElementById('profBirthJalali');
  const profBirthISO = document.getElementById('profBirthISO');
  const profWeight = document.getElementById('profWeight');
  const profHeight = document.getElementById('profHeight');
  const femaleOnly = document.getElementById('femaleOnly');
  const cycleJalali = document.getElementById('cycleJalali');
  const cycleISO = document.getElementById('cycleISO');
  const periodStartJalali = document.getElementById('periodStartJalali');
  const periodStartISO = document.getElementById('periodStartISO');
  const periodEndJalali = document.getElementById('periodEndJalali');
  const periodEndISO = document.getElementById('periodEndISO');
  const profStrava = document.getElementById('profStrava');
  const profDocFile = document.getElementById('profDocFile');
  const profUpload = document.getElementById('profUpload');
  const profDocs = document.getElementById('profDocs');
  const profAvatar = document.getElementById('profAvatar');
  const profAvatarFile = document.getElementById('profAvatarFile');
  const profAvatarUpload = document.getElementById('profAvatarUpload');
  const profAvatarRemove = document.getElementById('profAvatarRemove');
  const studentNameHdr = document.getElementById('studentNameHdr');
  const studentAvatarHdr = document.getElementById('studentAvatarHdr');

  const logoutBtn = document.getElementById('logoutBtn');
  const loginSection = loginForm ? loginForm.closest('section') : null;

  let currentStudent = null;
  let currentJYear = null;
  const AUTH_DEFAULT = 'login';

  function showAuthAlert(message, variant = 'info') {
    if (!authAlert) return;
    authAlert.textContent = message || '';
    authAlert.dataset.variant = variant;
    authAlert.hidden = !message;
  }

  function switchAuth(tab) {
    authTabs.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.auth === tab);
    });
    authViews.forEach(view => {
      view.hidden = view.dataset.authView !== tab;
    });
    showAuthAlert('');
  }

  function activatePanel(name) {
    if (!name) return;
    sideLinks.forEach(link => {
      const match = link.dataset.panel === name;
      link.classList.toggle('active', match);
    });
    panels.forEach(panel => {
      const match = panel.getAttribute('data-panel') === name;
      panel.hidden = !match;
    });
    if (name === 'profile') renderProfile().catch(err => console.error(err));
    if (name === 'log') renderStudentCharts().catch(err => console.error(err));
  }

  authTabs.forEach(btn => {
    btn.addEventListener('click', () => switchAuth(btn.dataset.auth));
  });
  if (authTabs.length) switchAuth(AUTH_DEFAULT);

  sideLinks.forEach(link => {
    link.addEventListener('click', () => activatePanel(link.dataset.panel));
  });
  if (sideLinks.length) activatePanel(sideLinks[0].dataset.panel);

  function enterApp() {
    if (appArea) appArea.style.display = '';
    if (loginSection) loginSection.style.display = 'none';
    activatePanel('programs');
  }

  function showLoginView() {
    if (appArea) appArea.style.display = 'none';
    if (loginSection) loginSection.style.display = '';
    switchAuth('login');
  }

  async function finalizeLogin() {
    if (!currentStudent) return;
    try {
      const refreshed = await DB.refreshStudent(currentStudent.id);
      if (refreshed) currentStudent = refreshed;
    } catch (err) {
      console.error('Failed to refresh student', err);
    }
    showAuthAlert(`${currentStudent.name} عزیز خوش آمدید!`, 'success');
    enterApp();
    await loadStudentWorkspace();
  }

  function handleLogout() {
    currentStudent = null;
    currentJYear = null;
    showLoginView();
    if (loginForm) {
      loginForm.reset();
      const savedEmail = getRememberedEmail();
      const savedPassword = getRememberedPassword();
      if (rememberMe) rememberMe.checked = !!(savedEmail || savedPassword);
      if (loginEmail && savedEmail) loginEmail.value = savedEmail;
      if (loginPassword && savedPassword) loginPassword.value = savedPassword;
    }
    if (studentPrograms) studentPrograms.innerHTML = '';
    if (paymentList) paymentList.innerHTML = '';
    if (goalList) goalList.innerHTML = '';
    if (archiveList) archiveList.innerHTML = '';
    if (coachLogList) coachLogList.innerHTML = '';
  }

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthAlert('');

    const email = (loginEmail?.value || '').trim().toLowerCase();
    const password = (loginPassword?.value || '').trim();

    if (!email || !password) {
      showAuthAlert('ایمیل و رمز عبور را وارد کنید.', 'danger');
      return;
    }

    try {
      const result = await DB.loginStudent({ email, password });
      const student = result?.student;
      if (!student) {
        showAuthAlert('ورود ناموفق بود.', 'danger');
        return;
      }
      currentStudent = student;
      if (rememberMe?.checked) {
        setRemember(email, password, true);
      } else {
        setRemember('', '', false);
      }
      await finalizeLogin();
    } catch (err) {
      console.error(err);
      showAuthAlert(err.message || 'خطا در ورود', 'danger');
    }
  });

  registerForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthAlert('');

    const name = (registerName?.value || '').trim();
    const email = (registerEmail?.value || '').trim().toLowerCase();
    const password = (registerPassword?.value || '').trim();
    const confirm = (registerPasswordConfirm?.value || '').trim();

    if (!email || !password) {
      showAuthAlert('ایمیل و رمز عبور الزامی است.', 'danger');
      return;
    }
    if (password !== confirm) {
      showAuthAlert('تکرار رمز با رمز وارد شده یکسان نیست.', 'danger');
      return;
    }

    try {
      await DB.signupStudent({ name, email, password });
      if (loginEmail) loginEmail.value = email;
      if (loginPassword) loginPassword.value = '';
      switchAuth('login');
      registerForm?.reset();
      showAuthAlert('ثبت‌نام انجام شد. پس از تایید مربی می‌توانید وارد شوید.', 'info');
    } catch (err) {
      console.error(err);
      showAuthAlert(err.message || 'خطا در ثبت‌نام', 'danger');
    }
  });

  forgotRequestForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthAlert('');
    const email = (forgotEmail?.value || '').trim().toLowerCase();
    if (!email) {
      showAuthAlert('لطفاً ایمیل خود را وارد کنید.', 'danger');
      return;
    }
    try {
      const res = await DB.requestPasswordReset(email);
      let message = 'درخواست بازیابی رمز با موفقیت ثبت شد. در صورت فعال بودن ایمیل، کد بازیابی ارسال می‌شود.';
      if (res?.token) {
        message += `\nکد بازیابی (برای تست): ${res.token}`;
        if (forgotTokenInput) forgotTokenInput.value = res.token;
        if (forgotResetEmail) forgotResetEmail.value = email;
      }
      showAuthAlert(message, 'info');
    } catch (err) {
      console.error(err);
      showAuthAlert(err.message || 'خطا در ارسال درخواست بازیابی', 'danger');
    }
  });

  forgotResetForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    showAuthAlert('');

    const email = (forgotResetEmail?.value || '').trim().toLowerCase();
    const token = (forgotTokenInput?.value || '').trim();
    const password = (forgotNewPassword?.value || '').trim();

    if (!email || !token || !password) {
      showAuthAlert('ایمیل، کد و رمز جدید الزامی است.', 'danger');
      return;
    }

    try {
      await DB.confirmPasswordReset({ email, token, password });
      if (loginEmail) loginEmail.value = email;
      if (loginPassword) loginPassword.value = '';
      switchAuth('login');
      showAuthAlert('رمز عبور با موفقیت تغییر کرد. لطفاً وارد شوید.', 'success');
      forgotRequestForm?.reset();
      forgotResetForm?.reset();
    } catch (err) {
      console.error(err);
      showAuthAlert(err.message || 'خطا در تغییر رمز', 'danger');
    }
  });

  async function loadStudentWorkspace() {
    if (!currentStudent) return;
    try {
      await Promise.all([
        DB.listLogsForStudent(currentStudent.id),
        DB.listGoalsForStudent(currentStudent.id),
        DB.listMedicalDocsForStudent(currentStudent.id),
      ]);
    } catch (err) {
      console.error('Student data prefetch failed', err);
    }
    initJalaliPicker();
    await renderPrograms();
    await renderPayments();
    await renderGoals();
    await renderArchive();
    initLogDefaults();
    populateLogSessionOptions();
    updateSessionDayUI();
    initEmojiQuick();
    await renderLogs();
    await renderStudentCharts();
    initJDatePicker('p');
    initJDatePicker('c');
    initJDatePicker('periodStart');
    initJDatePicker('periodEnd');
    await renderProfile();
    updateHeaderFromProfile();
  }

  logoutBtn?.addEventListener('click', handleLogout);

  async function renderPrograms() {
    if (!currentStudent) return;
    const programs = DB.getProgramsForStudent(currentStudent.id) || [];
    const programMap = new Map(programs.map(p => [p.id, p]));
    const assignments = (DB.listAssignmentsForStudent(currentStudent.id) || []).slice().sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate);
      if (a.startDate) return -1;
      if (b.startDate) return 1;
      return 0;
    });

    studentPrograms.innerHTML = '';

    const logs = await DB.listLogsForStudent(currentStudent.id) || [];
    const logEntries = Array.isArray(logs) ? logs : [];

    const renderAssignmentCard = (program, assignment) => {
      const week = Array.isArray(program.week) ? program.week : DB.defaultWeek();
      const card = document.createElement('div');
      card.className = 'program-card';

      const header = document.createElement('div');
      header.className = 'program-card-header';
      const startISO = assignment?.startDate || new Date().toISOString().slice(0, 10);
      const endISO = calcAssignmentEnd(startISO, assignment?.durationDays || week.length);
      const monthLabel = formatMonthFromISO(startISO);
      const range = formatJalaliRange(startISO, endISO);
      header.innerHTML = `<div><h3>${escapeHtml(program.title)}</h3>
        <div class="program-meta"><span>${escapeHtml(monthLabel)}</span><span>${escapeHtml(range)}</span></div>
        ${program.description ? `<p>${escapeHtml(program.description)}</p>` : ''}</div>`;

      const table = document.createElement('div');
      table.className = 'program-week';
      const todayIdx = mapJsDayToSatFirst(new Date().getDay());
      const assignmentId = assignment?.id || '';
      const programId = program?.id || '';

      week.forEach((day, idx) => {
        const dateISO = addDaysISO(startISO, idx);
        const content = String(day.content || '').trim();
        const rowLog = findMatchingLog(logEntries, {
          assignmentId,
          programId,
          dayKey: day.key,
          dateISO,
        });
        const moodEmoji = rowLog ? (rowLog.moodEmoji || scaleToEmoji(rowLog.mood) || '') : '';
        const moodDisplay = moodEmoji || (rowLog && rowLog.mood ? scaleLabel(rowLog.mood) : '–');
        const moodTitle = rowLog
          ? (rowLog.moodEmoji ? `حال انتخابی: ${rowLog.moodEmoji}` : `حال ثبت‌شده: ${scaleLabel(rowLog.mood)}`)
          : 'حال ثبت نشده';
        const completed = !!rowLog?.completed;
        const effectiveDateISO = rowLog?.date || dateISO;
        const row = document.createElement('div');
        row.className = 'program-week-row';
        if (idx === todayIdx) row.classList.add('today');

        row.innerHTML = `
          <div class="program-week-date">${escapeHtml(formatJalaliDate(effectiveDateISO))}</div>
          <div class="program-week-label">${escapeHtml(day.label)}</div>
          <div class="program-week-desc">${content ? escapeHtml(content) : '<span class="muted">بدون برنامه</span>'}</div>
          <div class="program-week-mood" title="${escapeHtml(moodTitle)}">${escapeHtml(moodDisplay)}</div>
          <div class="program-week-actions">
            <button type="button"
              class="status-toggle ${completed ? 'done' : ''}"
              data-status-toggle="1"
              data-log-id="${rowLog?.id || ''}"
              data-program-id="${programId}"
              data-assignment-id="${assignmentId}"
              data-log-date="${effectiveDateISO}"
              data-day-key="${day.key}"
              data-completed="${completed ? '1' : '0'}"
              title="${escapeHtml(completed ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شد')}"
              aria-label="${escapeHtml(completed ? 'علامت‌گذاری به عنوان انجام نشده' : 'علامت‌گذاری به عنوان انجام شد')}">
              <span class="status-emoji">${completed ? '✅' : '⏱️'}</span>
              <span class="status-text">${escapeHtml(completed ? 'انجام شد' : 'انجام نشده')}</span>
            </button>
            <button type="button"
              class="btn-link"
              data-log-day="${day.key}"
              data-log-date="${effectiveDateISO}"
              data-program-id="${programId}"
              data-assignment-id="${assignmentId}"
              data-log-id="${rowLog?.id || ''}">
              دفترچه تمرین
            </button>
          </div>
        `;
        table.appendChild(row);
      });

      card.append(header, table);
      studentPrograms.appendChild(card);
    };

    if (assignments.length) {
      assignments.forEach(asg => {
        const program = programMap.get(asg.programId);
        if (!program) return;
        renderAssignmentCard(program, asg);
      });
    } else if (programs.length) {
      programs.forEach(program => renderAssignmentCard(program, null));
    } else {
      studentPrograms.innerHTML = '<div class="muted">برنامه‌ای برای شما تعریف نشده است.</div>';
    }

    studentPrograms.querySelectorAll('[data-log-day]').forEach(btn => {
      btn.addEventListener('click', () => {
        openLogForDay({
          dayKey: btn.dataset.logDay || '',
          dateISO: btn.dataset.logDate || '',
          assignmentId: btn.dataset.assignmentId || '',
          programId: btn.dataset.programId || '',
          logId: btn.dataset.logId || '',
        });
      });
    });

    studentPrograms.querySelectorAll('[data-status-toggle]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.pending === '1') return;
        btn.dataset.pending = '1';
        btn.disabled = true;
        toggleProgramDayCompletion({
          logId: btn.dataset.logId || '',
          assignmentId: btn.dataset.assignmentId || '',
          programId: btn.dataset.programId || '',
          dayKey: btn.dataset.dayKey || '',
          dateISO: btn.dataset.logDate || '',
          completed: btn.dataset.completed === '1',
        }).finally(() => {
          delete btn.dataset.pending;
          btn.disabled = false;
        });
      });
    });
  }

  function calcAssignmentEnd(startISO, durationDays) {
    const start = parseISODate(startISO);
    const end = new Date(start);
    end.setDate(end.getDate() + Math.max(1, parseInt(durationDays || 7, 10)) - 1);
    return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
  }

  function addDaysISO(startISO, offset) {
    const base = parseISODate(startISO);
    const d = new Date(base);
    d.setDate(d.getDate() + offset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  function formatMonthFromISO(iso) {
    try {
      const d = parseISODate(iso);
      const j = Jalali.toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
      return `${j.jy} ${Jalali.monthNames[j.jm - 1]}`;
    } catch {
      return '';
    }
  }

  function renderArchive(){
    if (!currentStudent || !archiveList) return;
    const assignments = DB.listAssignmentsForStudent(currentStudent.id);
    const programs = DB.listPrograms();
    // group by jalali month of startDate
    const groups = {};
    assignments.forEach(a => {
      const s = new Date((a.startDate||'') + 'T00:00:00');
      if (Number.isNaN(s.getTime())) return;
      const j = Jalali.toJalali(s.getFullYear(), s.getMonth()+1, s.getDate());
      const key = `${j.jy}-${String(j.jm).padStart(2,'0')}`;
      if(!groups[key]) groups[key] = { label: `${j.jy} ${Jalali.monthNames[j.jm-1]}`, items: [] };
      const p = programs.find(x => x.id === a.programId);
      groups[key].items.push({ a, p });
    });
    const keys = Object.keys(groups).sort();
    archiveList.innerHTML = keys.length ? '' : '<div class="muted">آیتمی در آرشیو نیست</div>';
    keys.forEach(k => {
      const box = document.createElement('div');
      box.className = 'item';
      const month = groups[k];
      const itemsHtml = month.items.map(({a,p}) => {
        const range = formatJalaliRange(a.startDate, a.endDate);
        return `<div class="arch-item"><strong>${escapeHtml(p?.title || 'برنامه')}</strong> <span class="muted">${escapeHtml(range)}</span></div>`;
      }).join('');
      box.innerHTML = `<div class="arch-month"><strong>${month.label}</strong></div><div class="arch-items">${itemsHtml}</div>`;
      archiveList.appendChild(box);
    });
  }

  // Training log
  function initLogDefaults(){
    // No date input; logs are timestamped as today internally
  }

  function fillLogForm(log, overrides = {}) {
    if (!logForm) return;
    logForm.reset();
    initLogDefaults();

    const assignmentId = overrides.assignmentId || log?.assignmentId || '';
    const programId = overrides.programId || log?.programId || '';
    const dayKey = overrides.dayKey || log?.dayKey || '';
    const dateISOOverride = overrides.dateISO || '';
    const baseDateISO = log?.date || '';
    const pendingDateISO = dateISOOverride || baseDateISO || new Date().toISOString().slice(0, 10);
    if (logForm) {
      logForm.dataset.pendingDate = pendingDateISO;
    }
    if (logSelectedDateBadge) {
      const shouldShowDate = !!(dateISOOverride || baseDateISO);
      if (shouldShowDate) {
        logSelectedDateBadge.hidden = false;
        logSelectedDateBadge.textContent = `تاریخ تمرین: ${formatJalaliDate(pendingDateISO)}`;
      } else {
        logSelectedDateBadge.hidden = true;
        logSelectedDateBadge.textContent = '';
      }
    }

    if (logEditingId) logEditingId.value = log?.id || '';
    if (logSubmit) logSubmit.textContent = log ? 'ویرایش' : 'ثبت';
    if (logCancel) logCancel.style.display = log ? '' : 'none';

    populateLogSessionOptions();
    if (logSession) {
      if (assignmentId) {
        logSession.value = `asg:${assignmentId}`;
      } else if (programId) {
        logSession.value = `prg:${programId}`;
      } else {
        logSession.value = '';
      }
    }
    updateSessionDayUI();
    if (logDay) {
      if (dayKey && Array.from(logDay.options).some(opt => opt.value === dayKey)) {
        logDay.value = dayKey;
      } else {
        logDay.value = '';
      }
      logDay.dispatchEvent(new Event('change'));
    }

    if (logMood) logMood.value = String(log?.mood || 0);
    if (logSleepQ) logSleepQ.value = String(log?.sleepQuality || 0);
    if (logSleepH) logSleepH.value = log?.sleepHours != null ? String(log.sleepHours) : '';
    if (logNutrition) logNutrition.value = String(log?.nutrition || 0);
    if (logRPE) logRPE.value = log?.rpe != null ? String(log.rpe) : '';
    if (logDist) logDist.value = log?.distanceKm != null ? String(log.distanceKm) : '';

    const durationSec = Number(log?.durationSec || 0);
    const h = Math.floor(durationSec / 3600);
    const m = Math.floor((durationSec % 3600) / 60);
    const s = Math.floor(durationSec % 60);
    if (logH) logH.value = h ? String(h) : '';
    if (logM) logM.value = m ? String(m) : '';
    if (logS) logS.value = s ? String(s) : '';
    if (logHR) logHR.value = log?.hrAvg != null ? String(log.hrAvg) : '';

    const emojiVal = log?.moodEmoji || '';
    if (logEmoji) logEmoji.value = emojiVal;
    syncEmojiQuickButtons(emojiVal);

    if (logLocation) logLocation.value = log?.location || '';
    if (logShoe) logShoe.value = log?.shoe || '';
    if (logBuddies) logBuddies.value = log?.companions || '';
    if (logNote) logNote.value = log?.note || '';

    if (logCompleted) {
      const completedOverride = overrides.completed;
      logCompleted.checked = completedOverride != null ? !!completedOverride : !!log?.completed;
    }
  }

  function populateLogSessionOptions(){
    if(!currentStudent || !logSession) return;
    const programs = DB.getProgramsForStudent(currentStudent.id);
    const assignments = DB.listAssignmentsForStudent(currentStudent.id) || [];
    // Clear (keep first option)
    logSession.innerHTML = '<option value="">تمرین آزاد/سایر</option>';
    // Add active assignments first (today within range), then other assignments, then all programs
    const today = new Date().toISOString().slice(0,10);
    const isActive = (a)=> !a.startDate || !a.endDate || (a.startDate <= today && today <= a.endDate);
    const progsById = new Map(programs.map(p=>[p.id,p]));
    const active = assignments.filter(isActive);
    const inactive = assignments.filter(a=>!isActive(a));
    const addAsg = (a)=>{
      const p = progsById.get(a.programId);
      const opt = document.createElement('option');
      opt.value = `asg:${a.id}`;
      opt.textContent = p ? `برنامه: ${p.title}` : `انتساب ${a.id}`;
      logSession.appendChild(opt);
    };
    active.forEach(addAsg);
    if(inactive.length){
      const grp = document.createElement('optgroup'); grp.label = 'انتساب‌های قدیمی';
      logSession.appendChild(grp);
      inactive.forEach(a=>{
        const p = progsById.get(a.programId);
        const opt = document.createElement('option');
        opt.value = `asg:${a.id}`;
        opt.textContent = p ? `قدیمی: ${p.title}` : `انتساب ${a.id}`;
        grp.appendChild(opt);
      });
    }
    if(programs.length){
      const grp2 = document.createElement('optgroup'); grp2.label = 'فهرست برنامه‌ها';
      logSession.appendChild(grp2);
      programs.forEach(p=>{
        const opt = document.createElement('option');
        opt.value = `prg:${p.id}`;
        opt.textContent = p.title;
        grp2.appendChild(opt);
      });
    }
  }

  // Build day-of-program options based on selected session
  function updateSessionDayUI(){
    if(!logDay) return;
    // reset
    logDay.innerHTML = '<option value="">—</option>';
    const sel = String(logSession?.value || '');
    if(!sel){ setDayPreview(''); return; }
    // find program
    let program = null;
    if(sel.startsWith('prg:')){
      const pid = sel.slice(4);
      const programs = DB.getProgramsForStudent(currentStudent?.id || '');
      program = programs.find(p=>p.id===pid) || null;
    } else if(sel.startsWith('asg:')){
      const aid = sel.slice(4);
      const asgs = DB.listAssignmentsForStudent(currentStudent?.id || '') || [];
      const a = asgs.find(x=>x.id===aid);
      if(a){
        const programs = DB.getProgramsForStudent(currentStudent?.id || '');
        program = programs.find(p=>p.id===a.programId) || null;
      }
    }
    if(!program){ setDayPreview(''); return; }
    const week = Array.isArray(program.week) ? program.week : DB.defaultWeek();
    week.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.key;
      const has = (d.content||'').trim().length>0;
      opt.textContent = `${d.label}${has?'' : ' (بدون تمرین)'}`;
      logDay.appendChild(opt);
    });
    // preselect today
    const todayKey = mapJsDayToSatFirstKey(new Date().getDay());
    logDay.value = todayKey;
    setDayPreview((week.find(d=>d.key===todayKey)||{}).content || '');
  }

  function setDayPreview(text){
    const el = document.getElementById('logDayPreview');
    if(!el) return;
    const t = String(text||'').trim();
    el.textContent = t ? `برنامه روز: ${t}` : '';
  }

  function syncEmojiQuickButtons(value){
    if (!emojiQuick) return;
    const normalized = value || '';
    emojiQuick.querySelectorAll('.emoji-btn')?.forEach(btn => {
      const val = btn.getAttribute('data-emoji') || '';
      btn.classList.toggle('active', val === normalized && val !== '');
    });
  }

  function initEmojiQuick(){
    if(!emojiQuick) return;
    emojiQuick.querySelectorAll('.emoji-btn')?.forEach(btn => {
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-emoji') || '';
        if (logEmoji) logEmoji.value = val;
        syncEmojiQuickButtons(val);
      });
    });
  }

  function switchLogView(target) {
    if (!logViews.length) return;
    const desired = target && Array.from(logViews).some(view => view.dataset.logView === target)
      ? target
      : (logViews[0].dataset.logView || 'form');
    logViews.forEach(view => {
      view.hidden = view.dataset.logView !== desired;
    });
    logTabButtons.forEach(btn => {
      const isActive = btn.dataset.logViewTab === desired;
      btn.classList.toggle('active', isActive);
    });
    if (desired === 'charts') {
      renderStudentCharts().catch(err => console.error(err));
    }
  }

  logTabButtons.forEach(btn => {
    btn.addEventListener('click', () => switchLogView(btn.dataset.logViewTab));
  });
  if (logViews.length) switchLogView('form');

  logSession?.addEventListener('change', ()=>{ updateSessionDayUI(); });
  logDay?.addEventListener('change', ()=>{
    // update preview
    const sel = String(logSession?.value||'');
    let program = null;
    if(sel.startsWith('prg:')){
      const pid = sel.slice(4);
      const programs = DB.getProgramsForStudent(currentStudent?.id || '');
      program = programs.find(p=>p.id===pid) || null;
    } else if(sel.startsWith('asg:')){
      const aid = sel.slice(4);
      const asgs = DB.listAssignmentsForStudent(currentStudent?.id || '') || [];
      const a = asgs.find(x=>x.id===aid);
      if(a){
        const programs = DB.getProgramsForStudent(currentStudent?.id || '');
        program = programs.find(p=>p.id===a.programId) || null;
      }
    }
    const week = program && Array.isArray(program.week) ? program.week : DB.defaultWeek();
    const chosen = week.find(d=>d.key===String(logDay.value));
    setDayPreview((chosen||{}).content || '');
  });

  logForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    const date = (logForm?.dataset.pendingDate || new Date().toISOString().slice(0,10));
    const mood = Number(logMood?.value || 0);
    const sleepQuality = Number(logSleepQ?.value || 0);
    const sleepHours = logSleepH?.value ? Number(logSleepH.value) : null;
    const nutrition = Number(logNutrition?.value || 0);
    const rpe = logRPE?.value ? Number(logRPE.value) : null;
    const moodEmoji = (document.getElementById('logEmoji')?.value || '').trim();
    const location = (logLocation?.value || '').trim();
    const shoe = (logShoe?.value || '').trim();
    const companions = (logBuddies?.value || '').trim();
    const dist = logDist?.value ? Number(logDist.value) : null;
    const h = Number(logH?.value || 0), m = Number(logM?.value || 0), s = Number(logS?.value || 0);
    const durationSec = (h*3600 + m*60 + s) || null;
    const hrAvg = logHR?.value ? Number(logHR.value) : null;
    const note = logNote?.value || '';
    const editingId = logEditingId?.value || '';
    const completed = !!logCompleted?.checked;
    // parse selected session
    let assignmentId = null, programId = null;
    const sel = String(logSession?.value || '');
    if(sel.startsWith('asg:')) assignmentId = sel.slice(4);
    if(sel.startsWith('prg:')) programId = sel.slice(4);
    if(assignmentId && !programId){
      const allAsg = DB.listAssignmentsForStudent(currentStudent.id);
      const asg = allAsg.find(a=>a.id===assignmentId);
      if(asg) programId = asg.programId;
    }

    try {
      if (editingId) {
        await DB.updateLog(editingId, { date, assignmentId, programId, dayKey: (logDay?.value||null)||null, completed, mood, moodEmoji, sleepQuality, sleepHours, nutrition, rpe, distanceKm: dist, durationSec, hrAvg, location, shoe, companions, note });
      } else {
        await DB.addLog(currentStudent.id, { date, assignmentId, programId, dayKey: (logDay?.value||null)||null, completed, mood, moodEmoji, sleepQuality, sleepHours, nutrition, rpe, distanceKm: dist, durationSec, hrAvg, location, shoe, companions, note });
      }
    } catch (err) {
      console.error(err);
      alert(err.message || 'خطا در ثبت');
      return;
    }

    switchLogView('form');
    fillLogForm(null);
    await renderLogs();
    await renderPrograms();
  });

  logCancel?.addEventListener('click', () => {
    switchLogView('form');
    fillLogForm(null);
  });

  async function renderLogs(){
    if (!currentStudent || !logList) return;
    const logs = await DB.listLogsForStudent(currentStudent.id);
    logList.innerHTML = logs.length ? '' : '<div class="muted">ورودی ثبت نشده است</div>';
    const programs = DB.getProgramsForStudent(currentStudent.id);
    const pMap = new Map(programs.map(p=>[p.id, p]));
    logs.forEach(l => {
      const el = document.createElement('div');
      el.className = 'item';
      const pTitle = l.programId && pMap.get(l.programId) ? pMap.get(l.programId).title : 'تمرین آزاد';
      const chips = [
        chip('وضعیت', l.completed ? '✅ انجام شد' : '⏱️ انجام نشده'),
        (l.moodEmoji ? chip('حال', l.moodEmoji) : (l.mood ? chip('حال', scaleLabel(l.mood)) : '')),
        chip('خواب', scaleLabel(l.sleepQuality)),
        (l.sleepHours!=null? chip('ساعت خواب', String(l.sleepHours)) : ''),
        chip('تغذیه', scaleLabel(l.nutrition)),
        (l.rpe!=null? chip('RPE', String(l.rpe)) : ''),
        distanceChip(l),
        paceChip(l),
        hrChip(l),
        (l.location ? chip('محل', l.location) : ''),
        (l.shoe ? chip('کفش', l.shoe) : ''),
        (l.companions ? chip('همراهان', l.companions) : '')
      ].filter(Boolean).join(' ');
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(pTitle)}</strong><div class="chips" style="margin-top:6px">${chips}</div><div class="muted">${escapeHtml(l.note||'')}</div></div>
          <div class="actions">
            <button class="btn-sm" data-edit-log="${l.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-log="${l.id}">حذف</button>
          </div>
        </div>
        <div class="muted" style="margin-top:6px">
          <button class="btn-sm" data-toggle-cmt="${l.id}">کامنت‌ها</button>
        </div>
        <div class="comments" data-cmts="${l.id}" style="display:none; margin-top:6px"></div>
      `;
      logList.appendChild(el);
    });

    // bind edit/delete
    logList.querySelectorAll('[data-edit-log]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-edit-log');
        const logs = await DB.listLogsForStudent(currentStudent.id);
        const l = logs.find(x => x.id === id);
        if (!l) return;
        fillLogForm(l);
        activatePanel('log');
      });
    });
    logList.querySelectorAll('[data-del-log]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-log');
        if (!confirm('حذف این ورودی؟')) return;
        try {
          await DB.deleteLog(id);
          await renderLogs();
        } catch (err) {
          console.error(err);
          alert('حذف گزارش انجام نشد.');
        }
      });
    });

    // bind comments toggle
    logList.querySelectorAll('[data-toggle-cmt]')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-toggle-cmt');
        const wrap = logList.querySelector(`[data-cmts="${id}"]`);
        if (!wrap) return;
        const isHidden = wrap.style.display === 'none';
        wrap.style.display = isHidden ? '' : 'none';
        if (isHidden) renderCommentsForLog(id, wrap).catch(err => console.error(err));
      });
    });
  }

  async function renderCommentsForLog(logId, container){
    const cmts = await DB.listCommentsForLog(logId);
    container.innerHTML = '';
    const list = document.createElement('div');
    list.className = 'list';
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
    // add form
    const form = document.createElement('form'); form.className = 'mini'; form.setAttribute('data-cmt-form', logId);
    form.innerHTML = `<input type="text" placeholder="نوشتن پاسخ..." /><button type="submit">ارسال</button>`;
    form.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const inp = form.querySelector('input');
      const text = (inp.value || '').trim();
      if (!text) return;
      try {
        await DB.addComment({ logId, author: 'student', authorName: currentStudent?.name || '', authorStudentId: currentStudent?.id || null, text });
        inp.value='';
        await renderCommentsForLog(logId, container);
      } catch (err) {
        console.error(err);
        alert('ارسال کامنت انجام نشد.');
      }
    });
    container.appendChild(form);
  }

  function formatJalaliDate(iso){
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '';
      const j = Jalali.toJalali(d.getFullYear(), d.getMonth()+1, d.getDate());
      return `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`;
    } catch {
      return '';
    }
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

  // Charts (student)
  async function renderStudentCharts(){
    if(!currentStudent) return;
    const logs = await DB.listLogsForStudent(currentStudent.id) || [];
    // Distance last 30 days (daily sum)
    if (stDistChart) {
      const days = 30;
      const today = new Date(); today.setHours(12,0,0,0);
      const series = [];
      for(let i=days-1;i>=0;i--){
        const d0 = new Date(today); d0.setDate(today.getDate()-i);
        const iso = `${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`;
        const sum = logs.filter(l=>l.date===iso).reduce((acc,l)=>acc + (Number(l.distanceKm)||0), 0);
        series.push(sum);
      }
      drawSparkline(stDistChart, series, { color: '#0ea5e9' });
    }
    // Pace over last 10 runs (sec/km)
    if (stPaceChart) {
      const runs = logs.filter(l=> (l.distanceKm||0)>0 && (l.durationSec||0)>0).slice(0, 10).reverse();
      const series = runs.map(l => (l.durationSec/l.distanceKm));
      drawSparkline(stPaceChart, series, { color: '#f97316', invertY: true });
    }
    // HR over last 10 runs
    if (stHRChart) {
      const hrs = logs.filter(l=> l.hrAvg!=null).slice(0,10).reverse();
      const series = hrs.map(l=> Number(l.hrAvg)||0);
      drawSparkline(stHRChart, series, { color: '#ef4444' });
    }
    // Mood last 14 days
    if (stMoodChart) {
      const days = 14;
      const today = new Date(); today.setHours(12,0,0,0);
      const series = [];
      for(let i=days-1;i>=0;i--){
        const d0 = new Date(today); d0.setDate(today.getDate()-i);
        const iso = `${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`;
        const l = logs.find(x=>x.date===iso);
        const val = l ? (l.moodEmoji ? emojiToScale(l.moodEmoji) : (Number(l.mood)||0)) : 0;
        series.push(val);
      }
      drawSparkline(stMoodChart, series, { color: '#22c55e' });
    }
  }

  function emojiToScale(e){
    const map = { '😫':1,'😕':2,'😐':3,'🙂':4,'😄':5 };
    return map[e] || 0;
  }
  function scaleToEmoji(n){
    const value = Number(n || 0);
    if (value >= 4.5) return '😄';
    if (value >= 3.5) return '🙂';
    if (value >= 2.5) return '😐';
    if (value >= 1.5) return '😕';
    if (value > 0) return '😫';
    return '';
  }

  function drawSparkline(canvas, values, opts={}){
    const color = opts.color || '#000';
    const invertY = !!opts.invertY;
    const dpr = window.devicePixelRatio || 1;
    let w = canvas.clientWidth || 320; let h = canvas.height || 60;
    if (w < 100) w = 320; // fallback when hidden
    canvas.width = w * dpr; canvas.height = h * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0,0,w,h);
    const n = values.length || 0;
    if (n === 0) return;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const pad = 4; const innerH = h - pad*2; const innerW = w - pad*2;
    const range = (max - min) || 1;
    ctx.strokeStyle = color; ctx.lineWidth = 2;
    ctx.beginPath();
    values.forEach((v, i) => {
      const x = pad + (innerW * (i/(n-1||1)));
      const nv = (v - min) / range;
      let y = pad + innerH * (invertY ? nv : (1 - nv));
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    });
    ctx.stroke();
  }

  function chip(label, value){
    return `<span class="chip">${escapeHtml(label)}: ${escapeHtml(value)}</span>`;
  }
  function scaleLabel(v){
    const map = {0:'—',1:'خیلی بد',2:'بد',3:'معمولی',4:'خوب',5:'عالی'};
    return map[Number(v)||0] || '—';
    }
  function runMetrics(l){
    const dist = l.distanceKm || 0;
    const dur = l.durationSec || 0;
    if (!dist || !dur) return '';
    const secPerKm = dur / dist;
    const mm = Math.floor(secPerKm/60);
    const ss = Math.round(secPerKm%60);
    const pace = `${mm}:${String(ss).padStart(2,'0')}/km`;
    return chip('دویدن', `${dist} km @ ${pace}`);
  }
  function distanceChip(l){ return (l.distanceKm ? chip('مسافت', `${l.distanceKm} km`) : ''); }
  function paceChip(l){
    const dist = l.distanceKm || 0; const dur = l.durationSec || 0; if(!dist || !dur) return '';
    const secPerKm = dur / dist; const mm = Math.floor(secPerKm/60); const ss = Math.round(secPerKm%60);
    return chip('پیس', `${mm}:${String(ss).padStart(2,'0')} /km`);
  }
  function hrChip(l){ return (l.hrAvg!=null ? chip('HR', `${l.hrAvg} bpm`) : ''); }

  // live pace hint
  [logDist, logH, logM, logS].forEach(inp => {
    inp?.addEventListener('input', () => {
      const dist = Number(logDist?.value || 0);
      const h = Number(logH?.value || 0), m = Number(logM?.value || 0), s = Number(logS?.value || 0);
      const total = h*3600 + m*60 + s;
      if(dist>0 && total>0){
        const secPerKm = total / dist;
        const mm = Math.floor(secPerKm/60);
        const ss = Math.round(secPerKm%60);
        logPaceHint.textContent = `پیس تقریبی: ${mm}:${String(ss).padStart(2,'0')} دقیقه/کیلومتر`;
      } else {
        logPaceHint.textContent = '';
      }
    });
  });

  // Payments
  paymentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    const file = paymentImage.files && paymentImage.files[0];
    if (!file) return;
    const monthJalaliStr = paymentMonthJalaliHidden.value || null;
    const note = paymentNote.value || '';
    try {
      await DB.addPayment(currentStudent.id, { file, note, month: null, monthJalali: monthJalaliStr });
      paymentImage.value = '';
      paymentNote.value = '';
      await renderPayments();
    } catch (err) {
      console.error(err);
      alert('ثبت رسید پرداخت با خطا مواجه شد.');
    }
  });

  async function renderPayments() {
    if (!currentStudent || !paymentList) return;
    const payments = await Promise.resolve(DB.getPaymentsForStudent(currentStudent.id));
    const list = (payments || []).slice();
    paymentList.innerHTML = payments.length ? '' : '<div class="muted">پرداختی ثبت نشده است</div>';
    // group by Jalali month label
    const groups = new Map();
    list.forEach(p => {
      const label = p.monthJalali ? formatJMonthLabel(p.monthJalali) : (p.month ? Jalali.fromGregorianYYYYMMToJalaliLabel(p.month) : 'بدون ماه');
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(p);
    });
    // render groups
    groups.forEach((items, label) => {
      const box = document.createElement('div'); box.className = 'item';
      const inner = document.createElement('div'); inner.className = 'list';
      items.forEach(p => {
        const row = document.createElement('div'); row.className = 'item payment-item';
        const imgUrl = p.imageUrl || p.imageDataUrl || '';
        row.innerHTML = `
          <div class="payment">
            <a href="${imgUrl}" target="_blank" rel="noopener">
              <img src="${imgUrl}" alt="رسید" class="thumb" />
            </a>
            <div class="payment-meta">
              <div class="muted">${escapeHtml(p.note || '')}</div>
            </div>
            <div class="actions">
              <button class="btn-sm" data-edit-payment="${p.id}">ویرایش</button>
              <button class="btn-sm danger" data-del-payment="${p.id}">حذف</button>
            </div>
          </div>`;
        inner.appendChild(row);
      });
      box.innerHTML = `<div class="arch-month"><strong>${escapeHtml(label)}</strong></div>`;
      box.appendChild(inner);
      paymentList.appendChild(box);
    });
  }

  // Profile render/save
  async function renderProfile(){
    if(!currentStudent || !profileForm) return;
    profName.value = currentStudent.name || '';
    const p = DB.getStudentProfile(currentStudent.id) || {};
    profGender.value = p.gender || '';
    setJalaliField(profBirthJalali, profBirthISO, p.birthISO);
    profWeight.value = (p.weightKg != null) ? String(p.weightKg) : '';
    profHeight.value = (p.heightCm != null) ? String(p.heightCm) : '';
    setJalaliField(cycleJalali, cycleISO, p.cycleApproxISO);
    setJalaliField(periodStartJalali, periodStartISO, p.periodStartISO);
    setJalaliField(periodEndJalali, periodEndISO, p.periodEndISO);
    if (femaleOnly) femaleOnly.style.display = (profGender.value === 'female') ? '' : 'none';
    if (profAvatar) profAvatar.src = p.photoDataUrl || '';
    if (profStrava) profStrava.value = p.stravaUrl || '';
    await renderMedicalDocs();
  }
  profGender?.addEventListener('change', ()=>{ if(femaleOnly) femaleOnly.style.display = (profGender.value === 'female') ? '' : 'none'; });
  profileForm?.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(!currentStudent) return;
    const stravaValue = profStrava?.value ? profStrava.value.trim() : '';
    const patch = {
      gender: profGender.value || null,
      birthISO: profBirthISO.value || null,
      weightKg: profWeight.value ? Number(profWeight.value) : null,
      heightCm: profHeight.value ? Number(profHeight.value) : null,
      cycleApproxISO: cycleISO.value || null,
      periodStartISO: periodStartISO?.value || null,
      periodEndISO: periodEndISO?.value || null,
      stravaUrl: stravaValue || null,
    };
    const newName = (profName.value || '').trim() || currentStudent.name;
    try {
      await DB.updateStudent(currentStudent.id, { name: newName });
      await DB.updateStudentProfile(currentStudent.id, patch);
      currentStudent.name = newName;
      await renderProfile();
      updateHeaderFromProfile();
      alert('ذخیره شد');
    } catch (err) {
      alert('خطا در ذخیره پروفایل');
      console.error(err);
    }
  });
  profUpload?.addEventListener('click', async ()=>{
    if(!currentStudent || !profDocFile || !profDocFile.files || profDocFile.files.length===0) return;
    const f = profDocFile.files[0];
    try {
      await DB.addMedicalDoc(currentStudent.id, f);
      profDocFile.value='';
      await renderMedicalDocs();
    } catch (err) {
      console.error(err);
      alert('آپلود سند انجام نشد.');
    }
  });

  profAvatarUpload?.addEventListener('click', async ()=>{
    if(!currentStudent || !profAvatarFile || !profAvatarFile.files || profAvatarFile.files.length===0) return;
    const f = profAvatarFile.files[0]; const dataUrl = await fileToDataURL(f);
    try {
      await DB.updateStudentProfile(currentStudent.id, { photoDataUrl: dataUrl });
      profAvatarFile.value='';
      await renderProfile();
      updateHeaderFromProfile();
    } catch (err) {
      console.error(err);
      alert('ذخیره عکس انجام نشد.');
    }
  });
  profAvatarRemove?.addEventListener('click', async ()=>{
    if(!currentStudent) return;
    try {
      await DB.updateStudentProfile(currentStudent.id, { photoDataUrl: null });
      await renderProfile();
      updateHeaderFromProfile();
    } catch (err) {
      console.error(err);
    }
  });

  function updateHeaderFromProfile(){
    if(!currentStudent) return;
    if (studentNameHdr) studentNameHdr.textContent = currentStudent.name || 'پنل شاطران';
    const p = DB.getStudentProfile(currentStudent.id) || {};
    if (studentAvatarHdr){
      if (p.photoDataUrl){ studentAvatarHdr.src = p.photoDataUrl; studentAvatarHdr.style.display=''; }
      else { studentAvatarHdr.removeAttribute('src'); studentAvatarHdr.style.display='none'; }
    }
  }
  function absApiFileUrl(rel){
    try {
      const base = window.API_BASE ? window.API_BASE.replace(/\/api$/, '/') : '/';
      return new URL(rel, base).toString();
    } catch { return rel; }
  }
  async function renderMedicalDocs(){
    if(!currentStudent || !profDocs) return;
    const docs = await DB.listMedicalDocsForStudent(currentStudent.id);
    profDocs.innerHTML = docs.length ? '' : '<div class="muted">سندی آپلود نشده</div>';
    docs.forEach(d => {
      const el = document.createElement('div'); el.className='item';
      const href = d.dataUrl || (d.url ? absApiFileUrl(d.url) : '');
      const link = href ? `<a href="${href}" target="_blank" rel="noopener">مشاهده</a>` : '';
      el.innerHTML = `<div class=\"row-between\"><div><strong>${escapeHtml(d.name||'سند')}</strong></div><div class=\"actions\">${link} <button class=\"btn-sm danger\" data-del-doc=\"${d.id}\">حذف</button></div></div>`;
      profDocs.appendChild(el);
    });
    profDocs.querySelectorAll('[data-del-doc]')?.forEach(btn => {
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-del-doc');
        if (!confirm('حذف این سند؟')) return;
        try {
          await DB.deleteMedicalDoc(currentStudent.id, id);
          await renderMedicalDocs();
        } catch (err) {
          console.error(err);
          alert('حذف سند انجام نشد.');
        }
      });
    });
  }

  // Goals
  goalForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    const title = goalTitle.value.trim();
    if (!title) return;
    const dist = goalDist?.value ? Number(goalDist.value) : null;
    const paceSec = (goalPaceM?.value || goalPaceS?.value) ? (Number(goalPaceM.value||0)*60 + Number(goalPaceS.value||0)) : null;
    const durSec = (goalH?.value || goalM?.value || goalS?.value) ? (Number(goalH.value||0)*3600 + Number(goalM.value||0)*60 + Number(goalS.value||0)) : null;
    try {
      await DB.addGoal(currentStudent.id, { title, targetDistanceKm: dist, targetPaceSecPerKm: paceSec, targetDurationSec: durSec });
    } catch (err) {
      console.error(err);
      alert('ثبت هدف ناموفق بود.');
      return;
    }
    goalTitle.value = '';
    if (goalDist) goalDist.value = '';
    if (goalPaceM) goalPaceM.value = '';
    if (goalPaceS) goalPaceS.value = '';
    if (goalH) goalH.value = '';
    if (goalM) goalM.value = '';
    if (goalS) goalS.value = '';
    await renderGoals();
    await renderArchive();
  });

  async function renderGoals() {
    if (!currentStudent || !goalList) return;
    const goals = await DB.listGoalsForStudent(currentStudent.id);
    goalList.innerHTML = goals.length ? '' : '<div class="muted">هنوز هدفی ثبت نشده است</div>';
    goals.forEach(g => {
      const el = document.createElement('div');
      el.className = 'item';
      const metricChips = [];
      if (g.targetDistanceKm != null) metricChips.push(chip('هدف مسافت', `${g.targetDistanceKm} km`));
      if (g.targetPaceSecPerKm != null) {
        const mm = Math.floor(g.targetPaceSecPerKm/60), ss = Math.round(g.targetPaceSecPerKm%60);
        metricChips.push(chip('هدف پیس', `${mm}:${String(ss).padStart(2,'0')} /km`));
      }
      if (g.targetDurationSec != null) {
        const hh = Math.floor(g.targetDurationSec/3600), mm2 = Math.floor((g.targetDurationSec%3600)/60), ss2 = Math.floor(g.targetDurationSec%60);
        metricChips.push(chip('هدف زمان', `${String(hh).padStart(2,'0')}:${String(mm2).padStart(2,'0')}:${String(ss2).padStart(2,'0')}`));
      }
      const metricsHtml = metricChips.length ? `<div class="chips" style="margin:6px 0">${metricChips.join(' ')}</div>` : '';
      const msHtml = (g.milestones || []).map(ms => `
        <div class="milestone">
          <label style="display:flex; gap:8px; align-items:center; flex:1;">
            <input type="checkbox" data-goal="${g.id}" data-ms="${ms.id}" ${ms.done ? 'checked' : ''} />
            <span ${ms.done ? 'class="done"' : ''}>${escapeHtml(ms.text)}</span>
          </label>
          <div class="actions">
            <button type="button" class="btn-sm" data-edit-ms="${g.id}:${ms.id}">ویرایش</button>
            <button type="button" class="btn-sm danger" data-del-ms="${g.id}:${ms.id}">حذف</button>
          </div>
        </div>
      `).join('');
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(g.title)}</strong></div>
          <div class="actions">
            <button type="button" class="btn-sm" data-edit-goal="${g.id}">ویرایش</button>
            <button type="button" class="btn-sm danger" data-del-goal="${g.id}">حذف</button>
          </div>
        </div>
        ${metricsHtml}
        <div class="milestones">${msHtml || '<span class="muted">پیش‌هدف تعریف نشده</span>'}</div>
        <form class="mini" data-add-ms="${g.id}">
          <input type="text" placeholder="افزودن پیش‌هدف" />
          <button type="submit">+</button>
        </form>
      `;
      goalList.appendChild(el);
    });

    // bind add milestone forms
    goalList.querySelectorAll('form[data-add-ms]')?.forEach(f => {
      f.addEventListener('submit', async (e) => {
        e.preventDefault();
        const goalId = f.getAttribute('data-add-ms');
        const inp = f.querySelector('input');
        const text = (inp.value || '').trim();
        if (!text) return;
        try {
          await DB.addMilestone(goalId, text);
          inp.value = '';
          await renderGoals();
        } catch (err) {
          console.error(err);
          alert('افزودن پیش‌هدف انجام نشد.');
        }
      });
    });

    // bind checkbox toggles
    goalList.querySelectorAll('input[type="checkbox"][data-goal]')?.forEach(chk => {
      chk.addEventListener('change', async () => {
        const goalId = chk.getAttribute('data-goal');
        const msId = chk.getAttribute('data-ms');
        try {
          await DB.toggleMilestone(goalId, msId, chk.checked);
        } catch (err) {
          console.error(err);
          alert('بروزرسانی پیش‌هدف انجام نشد.');
        }
        await renderGoals();
      });
    });

    // bind edit/delete goal
    goalList.querySelectorAll('[data-edit-goal]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-edit-goal');
        const g = goals.find(x => x.id === id);
        if (!g) return;
        const title = prompt('عنوان جدید هدف:', g.title);
        if (title == null) return;
        const newTitle = (title || '').trim() || g.title;
        // metrics prompts
        const dist = prompt('هدف مسافت (کیلومتر) — خالی رها کنید:', g.targetDistanceKm != null ? String(g.targetDistanceKm) : '');
        const pace = prompt('هدف پیس (mm:ss) — خالی رها کنید:', (g.targetPaceSecPerKm != null ? `${Math.floor(g.targetPaceSecPerKm/60)}:${String(Math.round(g.targetPaceSecPerKm%60)).padStart(2,'0')}` : ''));
        const dur = prompt('هدف زمان (hh:mm:ss) — خالی رها کنید:', (g.targetDurationSec != null ? `${String(Math.floor(g.targetDurationSec/3600)).padStart(2,'0')}:${String(Math.floor((g.targetDurationSec%3600)/60)).padStart(2,'0')}:${String(Math.floor(g.targetDurationSec%60)).padStart(2,'0')}` : ''));
        let paceSec = null; if (pace && pace.includes(':')) { const [pm, ps] = pace.split(':'); paceSec = (Number(pm)||0)*60 + (Number(ps)||0); }
        let durSec = null; if (dur && dur.includes(':')) { const parts = dur.split(':'); const hh = Number(parts[0]||0), mm = Number(parts[1]||0), ss = Number(parts[2]||0); durSec = hh*3600 + mm*60 + ss; }
        try {
          await DB.updateGoalMetrics(id, { title: newTitle, targetDistanceKm: dist ? Number(dist) : null, targetPaceSecPerKm: pace ? paceSec : null, targetDurationSec: dur ? durSec : null });
          await renderGoals();
        } catch (err) {
          console.error(err);
          alert('ویرایش هدف انجام نشد.');
        }
      });
    });
    goalList.querySelectorAll('[data-del-goal]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-goal');
        if (!confirm('حذف این هدف؟')) return;
        try {
          await DB.deleteGoal(id);
          await renderGoals();
        } catch (err) {
          console.error(err);
          alert('حذف هدف انجام نشد.');
        }
      });
    });

    // bind edit/delete milestone
    goalList.querySelectorAll('[data-edit-ms]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const [gid, mid] = btn.getAttribute('data-edit-ms').split(':');
        const g = goals.find(x => x.id === gid);
        if (!g) return;
        const ms = (g.milestones || []).find(m => m.id === mid);
        const text = prompt('متن پیش‌هدف:', ms?.text || '');
        if (text == null) return;
        try {
          await DB.updateMilestone(gid, mid, text);
          await renderGoals();
        } catch (err) {
          console.error(err);
          alert('ویرایش پیش‌هدف انجام نشد.');
        }
      });
    });
    goalList.querySelectorAll('[data-del-ms]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const [gid, mid] = btn.getAttribute('data-del-ms').split(':');
        if (!confirm('حذف این پیش‌هدف؟')) return;
        try {
          await DB.deleteMilestone(gid, mid);
          await renderGoals();
        } catch (err) {
          console.error(err);
          alert('حذف پیش‌هدف انجام نشد.');
        }
      });
    });
  }

  // Cookie/localStorage helpers for remember-me
  function setCookie(name, value, days){
    try {
      const maxAge = days ? days*24*60*60 : 365*24*60*60;
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}`;
    } catch {}
  }
  function getCookie(name){
    try {
      const m = document.cookie.match(new RegExp('(?:^|; )'+name.replace(/([.$?*|{}()\[\]\\\/\+^])/g,'\\$1')+'=([^;]*)'));
      return m ? decodeURIComponent(m[1]) : null;
    } catch { return null; }
  }
  function delCookie(name){ setCookie(name, '', -1); }

  const STORAGE_EMAIL_KEY = 'csa_stud_email';
  const STORAGE_PWD_KEY = 'csa_stud_pwd';
  const LEGACY_EMAIL_KEY = 'csa_last_email';

  function encodeValue(value) {
    if (!value) return '';
    try {
      return btoa(unescape(encodeURIComponent(value)));
    } catch {
      return '';
    }
  }

  function decodeValue(value) {
    if (!value) return '';
    try {
      return decodeURIComponent(escape(atob(value)));
    } catch {
      return '';
    }
  }

  function setRemember(email, password, on) {
    if (on && email) {
      setCookie(STORAGE_EMAIL_KEY, email, 365);
      try { localStorage.setItem(STORAGE_EMAIL_KEY, email); } catch {}
      try { sessionStorage.setItem(STORAGE_EMAIL_KEY, email); } catch {}
      const pwdToStore = password || getRememberedPassword();
      if (pwdToStore) {
        const encoded = encodeValue(pwdToStore);
        setCookie(STORAGE_PWD_KEY, encoded, 365);
        try { localStorage.setItem(STORAGE_PWD_KEY, encoded); } catch {}
        try { sessionStorage.setItem(STORAGE_PWD_KEY, encoded); } catch {}
      }
    } else {
      delCookie(STORAGE_EMAIL_KEY);
      delCookie(LEGACY_EMAIL_KEY);
      delCookie(STORAGE_PWD_KEY);
      try { localStorage.removeItem(STORAGE_EMAIL_KEY); localStorage.removeItem(LEGACY_EMAIL_KEY); localStorage.removeItem(STORAGE_PWD_KEY); } catch {}
      try { sessionStorage.removeItem(STORAGE_EMAIL_KEY); sessionStorage.removeItem(STORAGE_PWD_KEY); } catch {}
    }
  }

  function getRememberedEmail() {
    return (
      sessionStorage.getItem(STORAGE_EMAIL_KEY) ||
      localStorage.getItem(STORAGE_EMAIL_KEY) ||
      getCookie(STORAGE_EMAIL_KEY) ||
      getCookie(LEGACY_EMAIL_KEY) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem(LEGACY_EMAIL_KEY) : '') ||
      ''
    );
  }

  function getRememberedPassword() {
    const raw = sessionStorage.getItem(STORAGE_PWD_KEY) ||
      localStorage.getItem(STORAGE_PWD_KEY) ||
      getCookie(STORAGE_PWD_KEY) || '';
    return decodeValue(raw);
  }

  rememberMe?.addEventListener('change', () => {
    const emailVal = (loginEmail?.value || '').trim().toLowerCase();
    const pwdValInput = (loginPassword?.value || '').trim();
    const pwdVal = pwdValInput || getRememberedPassword();
    if (rememberMe.checked && emailVal && pwdVal) {
      setRemember(emailVal, pwdVal, true);
    } else if (!rememberMe.checked) {
      setRemember('', '', false);
      if (loginPassword) loginPassword.value = '';
    }
  });

  (function initRemember() {
    const savedEmail = getRememberedEmail();
    const savedPassword = getRememberedPassword();
    if (loginEmail && savedEmail && !loginEmail.value) loginEmail.value = savedEmail;
    if (loginPassword && savedPassword && !loginPassword.value) loginPassword.value = savedPassword;
    if (rememberMe) rememberMe.checked = !!(savedEmail || savedPassword);
  })();

  // Heart Rate quick estimator (by age & sex)
  hrQuickForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const age = Number(hrQuickAge?.value || 0);
    const sex = String(hrSex?.value || 'male');
    const rest = Number(hrRest?.value || 0);
    if (!age || age < 1) { if(hrQuickResult) hrQuickResult.textContent = 'سن معتبر وارد کنید.'; return; }
    const max = estimateMaxHr(age, sex);
    const usingHRR = !!rest && rest > 20 && rest < max;
    const zones = [
      { range: [50, 60], label: 'ریکاوری (Z1)' },
      { range: [60, 70], label: 'چربی‌سوزی (Z2)' },
      { range: [70, 80], label: 'هوازی (Z3)' },
      { range: [80, 90], label: 'آستانه (Z4)' },
      { range: [90, 100], label: 'شدید (Z5)' },
    ];
    const items = zones.map(z => {
      const [lo, hi] = z.range;
      const loBpm = usingHRR ? Math.round(rest + (lo/100)*(max - rest)) : Math.round((lo/100)*max);
      const hiBpm = usingHRR ? Math.round(rest + (hi/100)*(max - rest)) : Math.round((hi/100)*max);
      return `<div class="row-between"><div>${escapeHtml(z.label)} <span class="muted">(${lo}-${hi}%)</span></div><div><strong>${loBpm}-${hiBpm} bpm</strong></div></div>`;
    }).join('');
    const subtitle = usingHRR ? 'روش کاروون (HRR) با ضربان استراحت' : 'درصدی از حداکثر ضربان';
    if (hrQuickResult) {
      hrQuickResult.innerHTML = `
        <div><strong>حداکثر تخمینی:</strong> ${Math.round(max)} bpm <span class="muted">(${sex==='female' ? 'فرمول مونث' : 'فرمول مذکر'})</span></div>
        <div class="muted" style="margin-top:4px">${escapeHtml(subtitle)}</div>
        <div style="margin-top:8px; display:grid; gap:6px;">${items}</div>
      `;
    }
  });

  function estimateMaxHr(age, sex){
    const a = Number(age || 0);
    const s = String(sex || 'male').toLowerCase();
    // Sex-specific formulas:
    // Female: Gulati (2005): 206 - 0.88*age
    // Male/general: Nes (2013): 211 - 0.64*age
    const max = s === 'female' ? (206 - 0.88*a) : (211 - 0.64*a);
    return Math.max(100, max);
  }

  // Heart Rate calculator
  hrForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const beats = Number(hrBeats?.value || 0);
    const secs = Number(hrSeconds?.value || 0);
    const age = Number(hrAge?.value || 0);
    if (!beats || !secs) { if(hrResult) hrResult.textContent = 'مقادیر را کامل وارد کنید.'; return; }
    const bpm = (beats / secs) * 60;
    let html = `<div><strong>${Math.round(bpm)} ضربه/دقیقه</strong></div>`;
    if (age > 0) {
      const maxHr = Math.max(100, 220 - age);
      const pct = (bpm / maxHr) * 100;
      const zone = hrZoneLabel(pct);
      html += `<div class="muted">حداکثر تخمینی: ${Math.round(maxHr)} | درصد از حداکثر: ${pct.toFixed(1)}% (${zone})</div>`;
    }
    if (hrResult) hrResult.innerHTML = html;
  });

  function hrZoneLabel(pct){
    if (pct < 50) return 'خیلی سبک';
    if (pct < 60) return 'ریکاوری (Z1)';
    if (pct < 70) return 'چربی‌سوزی (Z2)';
    if (pct < 80) return 'هوازی (Z3)';
    if (pct < 90) return 'آستانه (Z4)';
    return 'شدید (Z5)';
  }

  // Pace calculator
  paceForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const dist = Number(paceDistance?.value || 0);
    const h = Number(paceH?.value || 0);
    const m = Number(paceM?.value || 0);
    const s = Number(paceS?.value || 0);
    const totalSec = (h*3600) + (m*60) + s;
    if (!dist || !totalSec) { if(paceResult) paceResult.textContent = 'مسافت و زمان معتبر وارد کنید.'; return; }
    const secPerKm = totalSec / dist;
    const paceMin = Math.floor(secPerKm / 60);
    const paceSec = Math.round(secPerKm % 60);
    const paceStr = `${paceMin}:${String(paceSec).padStart(2, '0')} دقیقه/کیلومتر`;
    const speed = dist / (totalSec / 3600);
    const speedStr = `${speed.toFixed(2)} کیلومتر/ساعت`;
    if (paceResult) {
      paceResult.innerHTML = `<div><strong>پیس: ${escapeHtml(paceStr)}</strong></div><div class="muted">سرعت: ${escapeHtml(speedStr)}</div>`;
    }
  });

  function escapeHtml(str) {
    return String(str || '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function fileToDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Edit/Delete payment handlers (delegate on list)
  paymentList?.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idEdit = btn.getAttribute('data-edit-payment');
    const idDel = btn.getAttribute('data-del-payment');
    if (idEdit) {
      const payments = await Promise.resolve(DB.getPaymentsForStudent(currentStudent.id));
      const p = payments.find(x => x.id === idEdit);
      if (!p) return;
      const m = prompt('ماه (شمسی) به صورت YYYY-MM، مثلاً 1403-07:', (p.monthJalali || ''));
      if (m === null) return;
      const n = prompt('توضیح رسید:', p.note || '');
      const mNorm = (m || '').replace('/', '-').trim();
      try {
        await DB.updatePayment(p.id, { monthJalali: mNorm || null, month: null, note: (n || '').trim() });
        await renderPayments();
      } catch (err) {
        console.error(err);
        alert('بروزرسانی پرداخت انجام نشد.');
      }
      return;
    }
    if (idDel) {
      if (!confirm('حذف این پرداختی؟')) return;
      try {
        await DB.deletePayment(idDel);
        await renderPayments();
      } catch (err) {
        console.error(err);
        alert('حذف پرداخت ناموفق بود.');
      }
    }
  });

  // Jalali month picker
  function initJalaliPicker(){
    const toggle = document.getElementById('jMonthToggle');
    const popup = document.getElementById('jMonthPopup');
    const prevY = document.getElementById('jPrevYear');
    const nextY = document.getElementById('jNextYear');
    const yearLbl = document.getElementById('jYearLabel');
    const grid = document.getElementById('jMonthsGrid');
    if(!toggle || !popup || !prevY || !nextY || !yearLbl || !grid) return;

    const today = new Date();
    const j = Jalali.toJalali(today.getFullYear(), today.getMonth()+1, today.getDate());
    currentJYear = j.jy;
    setSelection(j.jy, j.jm);
    renderYear();

    toggle.onclick = (e)=>{ popup.hidden = !popup.hidden; };
    prevY.onclick = ()=>{ currentJYear--; renderYear(); };
    nextY.onclick = ()=>{ currentJYear++; renderYear(); };
    document.addEventListener('click', (e)=>{
      const root = document.getElementById('jMonth');
      if(!root) return;
      if(!root.contains(e.target)) popup.hidden = true;
    });

    function renderYear(){
      yearLbl.textContent = currentJYear;
      grid.innerHTML = '';
      Jalali.monthNames.forEach((name, idx)=>{
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = name;
        btn.className = 'j-cell';
        btn.onclick = ()=>{
          setSelection(currentJYear, idx+1);
          popup.hidden = true;
        };
        grid.appendChild(btn);
      });
    }
    function setSelection(jy, jm){
      paymentMonthJalali.value = Jalali.formatJalaliMonth(jy, jm);
      paymentMonthJalaliHidden.value = Jalali.formatJalaliYYYYMM(jy, jm);
    }
  }

  function formatJMonthLabel(jStr){
    const parts = String(jStr||'').split('-');
    if(parts.length<2) return jStr || '';
    const jy = +parts[0], jm = +parts[1];
    return Jalali.formatJalaliMonth(jy, jm);
  }

  function mapJsDayToSatFirst(jsDay){
    // JS: 0=Sun..6=Sat => We need 0=Sat..6=Fri
    const map = { 6:0, 0:1, 1:2, 2:3, 3:4, 4:5, 5:6 };
    return map[jsDay] ?? 0;
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

  function isoToJalaliText(iso) {
    if (!iso) return '';
    const d = parseISODate(iso);
    if (Number.isNaN(d.getTime())) return '';
    const j = Jalali.toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate());
    return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`;
  }

  function setJalaliField(displayInput, hiddenInput, iso) {
    if (hiddenInput) hiddenInput.value = iso || '';
    if (displayInput) displayInput.value = isoToJalaliText(iso);
  }
  // Jalali date picker (for profile dates)
  function initJDatePicker(prefix){
    const root = document.getElementById(prefix + 'JDate');
    if(!root) return;
    const txt = root.querySelector('input[type="text"]');
    const hidden = root.querySelector('input[type="hidden"]');
    const toggle = document.getElementById(prefix + 'JDateToggle');
    const popup = document.getElementById(prefix + 'JDatePopup');
    const prev = document.getElementById(prefix + 'Prev');
    const next = document.getElementById(prefix + 'Next');
    const ymLabel = document.getElementById(prefix + 'YMLabel');
    const daysWrap = document.getElementById(prefix + 'Days');
    const yearSelect = document.getElementById(prefix + 'YearSelect');
    const minYear = Number(root.dataset.minYear || '1300');
    const maxYear = Number(root.dataset.maxYear || '1500');
    if(!txt || !hidden || !toggle || !popup || !prev || !next || !ymLabel || !daysWrap) return;
    const today = new Date();
    let j = Jalali.toJalali(today.getFullYear(), today.getMonth()+1, today.getDate());
    let jy = clampYear(j.jy);
    let jm = j.jm;
    let jd = j.jd;

    function clampYear(value) {
      return Math.min(maxYear, Math.max(minYear, value));
    }

    function populateYearSelect() {
      if (!yearSelect) return;
      yearSelect.innerHTML = '';
      for (let y = maxYear; y >= minYear; y--) {
        const opt = document.createElement('option');
        opt.value = String(y);
        opt.textContent = String(y);
        yearSelect.appendChild(opt);
      }
    }

    function setSelected(jy0,jm0,jd0){
      jy = clampYear(jy0);
      jm = Math.min(12, Math.max(1, jm0));
      jd = jd0;
      if (yearSelect) yearSelect.value = String(jy);
      txt.value = `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
      const g=Jalali.toGregorian(jy, jm, jd);
      const iso=`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`;
      hidden.value=iso;
    }

    function render(){
      ymLabel.textContent = `${Jalali.monthNames[jm-1]} ${jy}`;
      if (yearSelect) yearSelect.value = String(jy);
      daysWrap.innerHTML='';
      daysWrap.className='j-days';
      const gFirst=Jalali.toGregorian(jy, jm, 1);
      const dFirst=new Date(gFirst.gy, gFirst.gm-1, gFirst.gd);
      const jsStart=dFirst.getDay();
      const satFirst={6:0,0:1,1:2,2:3,3:4,4:5,5:6}[jsStart] ?? 0;
      for(let i=0;i<satFirst;i++){
        const b=document.createElement('div');
        b.className='j-day blank';
        daysWrap.appendChild(b);
      }
      const daysInMonth=jMonthDays(jy,jm);
      if (jd > daysInMonth) {
        jd = daysInMonth;
      }
      for(let d=1; d<=daysInMonth; d++){
        const btn=document.createElement('button');
        btn.type='button'; btn.className='j-day'; btn.textContent=d;
        if(d===jd) btn.classList.add('selected');
        btn.onclick=()=>{ setSelected(jy,jm,d); popup.hidden=true; render(); };
        daysWrap.appendChild(btn);
      }
      prev.disabled = jy <= minYear && jm === 1;
      next.disabled = jy >= maxYear && jm === 12;
    }
    function jMonthDays(jy,jm){ const g1=Jalali.toGregorian(jy,jm,1); const jy2=jm===12?jy+1:jy; const jm2=jm===12?1:jm+1; const g2=Jalali.toGregorian(jy2,jm2,1); const d1=new Date(g1.gy,g1.gm-1,g1.gd); const d2=new Date(g2.gy,g2.gm-1,g2.gd); return Math.round((d2-d1)/86400000); }
    if (yearSelect) {
      populateYearSelect();
      yearSelect.addEventListener('change', () => {
        const selected = clampYear(Number(yearSelect.value));
        if (selected !== jy) {
          jy = selected;
          render();
        }
      });
    }
    toggle.onclick=()=>{ popup.hidden = !popup.hidden; };
    prev.onclick=()=>{
      if (jm === 1) {
        if (jy <= minYear) return;
        jm = 12;
        jy = clampYear(jy - 1);
      } else {
        jm--;
      }
      render();
    };
    next.onclick=()=>{
      if (jm === 12) {
        if (jy >= maxYear) return;
        jm = 1;
        jy = clampYear(jy + 1);
      } else {
        jm++;
      }
      render();
    };
    document.addEventListener('click', (e)=>{ if(root && !root.contains(e.target)) popup.hidden = true; });
    setSelected(jy,jm,jd); render();
  }

  function mapJsDayToSatFirstKey(jsDay){
    const map = { 6:'sat', 0:'sun', 1:'mon', 2:'tue', 3:'wed', 4:'thu', 5:'fri' };
    return map[jsDay] || 'sat';
  }
  })().catch(err => {
    console.error('Student panel init failed', err);
    alert('خطا در بارگذاری داده‌ها. لطفاً دوباره تلاش کنید.');
  });
});
  function findMatchingLog(logs, { logId, assignmentId, programId, dayKey, dateISO }) {
    if (!Array.isArray(logs) || !logs.length) return null;
    const normalizedAssignment = assignmentId || '';
    const normalizedProgram = programId || '';
    const normalizedDay = dayKey || '';
    const normalizedDate = dateISO || '';

    if (logId) {
      const byId = logs.find(l => l.id === logId);
      if (byId) return byId;
    }

    const filtered = normalizedDate
      ? logs.filter(l => (l.date || '') === normalizedDate)
      : logs.slice();
    const eq = (a, b) => (a || '') === (b || '');
    const runSearch = (source) => {
      if (!source.length) return null;
      if (normalizedAssignment && normalizedProgram && normalizedDay) {
        const found = source.find(l =>
          eq(l.assignmentId, normalizedAssignment) &&
          eq(l.programId, normalizedProgram) &&
          eq(l.dayKey, normalizedDay)
        );
        if (found) return found;
      }
      if (normalizedAssignment && normalizedDay) {
        const found = source.find(l =>
          eq(l.assignmentId, normalizedAssignment) &&
          eq(l.dayKey, normalizedDay)
        );
        if (found) return found;
      }
      if (normalizedProgram && normalizedDay) {
        const found = source.find(l =>
          eq(l.programId, normalizedProgram) &&
          eq(l.dayKey, normalizedDay)
        );
        if (found) return found;
      }
      if (normalizedAssignment) {
        const found = source.find(l => eq(l.assignmentId, normalizedAssignment));
        if (found) return found;
      }
      if (normalizedProgram) {
        const found = source.find(l => eq(l.programId, normalizedProgram));
        if (found) return found;
      }
      if (normalizedDay) {
        const found = source.find(l => eq(l.dayKey, normalizedDay));
        if (found) return found;
      }
      if (normalizedDate) {
        const found = source.find(l => eq(l.date, normalizedDate));
        if (found) return found;
      }
      return source[0] || null;
    };

    let match = runSearch(filtered.length ? filtered : logs);
    if (!match && normalizedDate) {
      match = runSearch(logs);
    }
    return match || null;
  }

  function celebrateCompletion() {
    const existing = document.querySelector('.celebrate-pop');
    if (existing) {
      existing.remove();
    }
    const pop = document.createElement('div');
    pop.className = 'celebrate-pop';
    pop.innerHTML = `
      <div class="celebrate-icon">🏆</div>
      <div class="celebrate-text">آفرین! تمرین انجام شد 🎉</div>
    `;
    document.body.appendChild(pop);
    requestAnimationFrame(() => pop.classList.add('show'));
    setTimeout(() => {
      pop.classList.remove('show');
      setTimeout(() => pop.remove(), 350);
    }, 2000);
  }

  async function toggleProgramDayCompletion({ logId, assignmentId, programId, dayKey, dateISO }) {
    if (!currentStudent) return;
    const logs = await DB.listLogsForStudent(currentStudent.id);
    const targetLog = findMatchingLog(logs, { logId, assignmentId, programId, dayKey, dateISO });
    const nextState = targetLog ? !targetLog.completed : true;
    try {
      if (targetLog) {
        await DB.updateLog(targetLog.id, { completed: nextState });
      } else {
        const iso = dateISO || new Date().toISOString().slice(0, 10);
        await DB.addLog(currentStudent.id, {
          date: iso,
          assignmentId: assignmentId || null,
          programId: programId || null,
          dayKey: dayKey || null,
          completed: nextState,
        });
      }
      if (nextState) celebrateCompletion();
      await renderPrograms();
      await renderLogs();
    } catch (err) {
      console.error(err);
      alert(err.message || 'ثبت وضعیت انجام نشد.');
    }
  }

  async function openLogForDay({ dayKey, dateISO, assignmentId, programId, logId }) {
    if (!currentStudent) return;
    activatePanel('log');
    switchLogView('form');
    const logs = await DB.listLogsForStudent(currentStudent.id);
    const targetLog = findMatchingLog(logs, { logId, assignmentId, programId, dayKey, dateISO });
    fillLogForm(targetLog || null, {
      assignmentId,
      programId,
      dayKey,
      completed: targetLog ? targetLog.completed : false,
      dateISO: targetLog?.date || dateISO || '',
    });
    if (logMood) logMood.focus({ preventScroll: false });
    requestAnimationFrame(() => {
      logForm?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
