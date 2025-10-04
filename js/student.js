document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const loginEmail = document.getElementById('loginEmail');
  const rememberMe = document.getElementById('rememberMe');
  const loginMsg = document.getElementById('loginMsg');
  const appArea = document.getElementById('appArea');
  const studentPrograms = document.getElementById('studentPrograms');
  // Verify
  const verifyArea = document.getElementById('verifyArea');
  const sendCodeBtn = document.getElementById('sendCode');
  const verifyCodeInput = document.getElementById('verifyCode');
  const confirmCodeBtn = document.getElementById('confirmCode');
  const verifyMsg = document.getElementById('verifyMsg');

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
  const profDocFile = document.getElementById('profDocFile');
  const profUpload = document.getElementById('profUpload');
  const profDocs = document.getElementById('profDocs');
  const profAvatar = document.getElementById('profAvatar');
  const profAvatarFile = document.getElementById('profAvatarFile');
  const profAvatarUpload = document.getElementById('profAvatarUpload');
  const profAvatarRemove = document.getElementById('profAvatarRemove');
  const studentNameHdr = document.getElementById('studentNameHdr');
  const studentAvatarHdr = document.getElementById('studentAvatarHdr');

  let currentStudent = null;
  let currentJYear = null;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = (loginEmail.value || '').trim();
    if (!email) return;

    // Save/clear remember preference
    setRemember(email, !!rememberMe?.checked);

    const s = DB.getStudentByEmail(email);
    if (!s) {
      loginMsg.textContent = 'شاگردی با این ایمیل یافت نشد. از مربی بخواهید شما را اضافه کند. یا در پنل مربی «داده‌ی نمونه» را اضافه کنید و با ali@example.com وارد شوید.';
      currentStudent = null;
      studentPrograms.innerHTML = '';
      appArea.style.display = 'none';
      return;
    }
    currentStudent = s;
    if (s.verifiedAt) {
      loginMsg.textContent = `خوش آمدید ${s.name}`;
      appArea.style.display = '';
      // hide login card after success
      try { loginForm.closest('section').style.display = 'none'; } catch {}
      verifyArea.style.display = 'none';
      renderPrograms();
      renderPayments();
      renderGoals();
      initJalaliPicker();
      renderArchive();
      initLogDefaults();
      populateLogSessionOptions();
      updateSessionDayUI();
      initEmojiQuick();
      renderLogs();
      renderStudentCharts();
      initJDatePicker('p');
      initJDatePicker('c');
      renderProfile();
      updateHeaderFromProfile();
    } else {
      loginMsg.textContent = `${s.name} عزیز، لطفاً ایمیل خود را تایید کنید.`;
      verifyArea.style.display = '';
      appArea.style.display = 'none';
      verifyMsg.textContent = '';
      verifyCodeInput.value = '';
    }
  });

  sendCodeBtn?.addEventListener('click', () => {
    if (!currentStudent) return;
    const res = DB.startEmailVerification(currentStudent.id);
    verifyMsg.textContent = `کد تایید ارسال شد. (نمونه: ${res.code})`;
  });

  confirmCodeBtn?.addEventListener('click', () => {
    if (!currentStudent) return;
    const code = (verifyCodeInput.value || '').trim();
    if (!code) { verifyMsg.textContent = 'کد را وارد کنید'; return; }
    const ok = DB.verifyStudentEmail(currentStudent.id, code);
    if (ok) {
      verifyMsg.textContent = 'ایمیل تایید شد!';
      loginMsg.textContent = `خوش آمدید ${currentStudent.name}`;
      verifyArea.style.display = 'none';
      appArea.style.display = '';
      try { loginForm.closest('section').style.display = 'none'; } catch {}
      renderPrograms();
      renderPayments();
      renderGoals();
      initJalaliPicker();
      renderArchive();
      initLogDefaults();
      populateLogSessionOptions();
      updateSessionDayUI();
      initEmojiQuick();
      renderLogs();
      renderStudentCharts();
      initJDatePicker('p');
      initJDatePicker('c');
      renderProfile();
      updateHeaderFromProfile();
    } else {
      verifyMsg.textContent = 'کد نامعتبر است یا منقضی شده است.';
    }
  });

  function renderPrograms() {
    if (!currentStudent) return;
    const programs = DB.getProgramsForStudent(currentStudent.id);
    studentPrograms.innerHTML = programs.length ? '' : '<div class="muted">برنامه‌ای برای شما ثبت نشده است</div>';
    programs.forEach(p => {
      const el = document.createElement('div');
      el.className = 'item';
      const week = Array.isArray(p.week) ? p.week : DB.defaultWeek();
      const todayIdx = mapJsDayToSatFirst(new Date().getDay()); // 0..6 (0=Sat)
      const daysHtml = week.map((d, idx) => {
        const has = (d.content || '').trim().length > 0;
        const cls = `day${has ? ' has' : ''}${idx===todayIdx ? ' today' : ''}`;
        const content = has ? `<div class="day-content">${escapeHtml(d.content)}</div>` : '<div class="day-empty muted">بدون برنامه</div>';
        return `<div class="${cls}"><div class="day-title">${d.label}</div>${content}</div>`;
      }).join('');
      el.innerHTML = `
        <div class="program-title"><strong>${escapeHtml(p.title)}</strong></div>
        <div class="muted">${escapeHtml(p.description || '')}</div>
        <div class="week-grid days">${daysHtml}</div>
      `;
      studentPrograms.appendChild(el);
    });
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

  function initEmojiQuick(){
    if(!emojiQuick) return;
    emojiQuick.querySelectorAll('.emoji-btn')?.forEach(btn => {
      btn.addEventListener('click', ()=>{
        const val = btn.getAttribute('data-emoji') || '';
        const inp = document.getElementById('logEmoji');
        if(inp) inp.value = val;
        emojiQuick.querySelectorAll('.emoji-btn').forEach(b=>b.classList.remove('active'));
        if(val) btn.classList.add('active');
      });
    });
  }

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

  logForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    const date = new Date().toISOString().slice(0,10);
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
        DB.updateLog(editingId, { date, assignmentId, programId, dayKey: (logDay?.value||null)||null, mood, moodEmoji, sleepQuality, sleepHours, nutrition, rpe, distanceKm: dist, durationSec, hrAvg, location, shoe, companions, note });
      } else {
        DB.addLog(currentStudent.id, { date, assignmentId, programId, dayKey: (logDay?.value||null)||null, mood, moodEmoji, sleepQuality, sleepHours, nutrition, rpe, distanceKm: dist, durationSec, hrAvg, location, shoe, companions, note });
      }
    } catch (err) {
      alert(err.message || 'خطا در ثبت');
      return;
    }

    // reset minimal
    logEditingId.value = '';
    logSubmit.textContent = 'ثبت';
    logCancel.style.display = 'none';
    logNote.value = '';
    renderLogs();
  });

  logCancel?.addEventListener('click', () => {
    logEditingId.value = '';
    logSubmit.textContent = 'ثبت';
    logCancel.style.display = 'none';
    logForm?.reset();
    initLogDefaults();
  });

  function renderLogs(){
    if (!currentStudent || !logList) return;
    const logs = DB.listLogsForStudent(currentStudent.id);
    logList.innerHTML = logs.length ? '' : '<div class="muted">ورودی ثبت نشده است</div>';
    const programs = DB.getProgramsForStudent(currentStudent.id);
    const pMap = new Map(programs.map(p=>[p.id, p]));
    logs.forEach(l => {
      const el = document.createElement('div');
      el.className = 'item';
      const pTitle = l.programId && pMap.get(l.programId) ? pMap.get(l.programId).title : 'تمرین آزاد';
      const chips = [
        (l.moodEmoji? chip('حال', l.moodEmoji) : chip('حال', scaleLabel(l.mood))),
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
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-edit-log');
        const logs = DB.listLogsForStudent(currentStudent.id);
        const l = logs.find(x => x.id === id);
        if (!l) return;
        logEditingId.value = l.id;
        // select session
        if (logSession){
          populateLogSessionOptions();
          if(l.assignmentId) logSession.value = `asg:${l.assignmentId}`;
          else if(l.programId) logSession.value = `prg:${l.programId}`;
          else logSession.value = '';
          updateSessionDayUI();
          if(logDay && l.dayKey) logDay.value = l.dayKey;
        }
        if (logMood) logMood.value = String(l.mood || 0);
        if (logSleepQ) logSleepQ.value = String(l.sleepQuality || 0);
        if (logSleepH) logSleepH.value = l.sleepHours != null ? String(l.sleepHours) : '';
        if (logNutrition) logNutrition.value = String(l.nutrition || 0);
        if (logRPE) logRPE.value = l.rpe != null ? String(l.rpe) : '';
        if (logDist) logDist.value = l.distanceKm != null ? String(l.distanceKm) : '';
        const h = Math.floor((l.durationSec||0)/3600), m = Math.floor(((l.durationSec||0)%3600)/60), s = Math.floor((l.durationSec||0)%60);
        if (logH) logH.value = h ? String(h) : '';
        if (logM) logM.value = m ? String(m) : '';
        if (logS) logS.value = s ? String(s) : '';
        if (logHR) logHR.value = l.hrAvg != null ? String(l.hrAvg) : '';
        const emojiInp = document.getElementById('logEmoji');
        if (emojiInp) {
          emojiInp.value = l.moodEmoji || '';
          // reflect in quick bar
          if (emojiQuick){
            emojiQuick.querySelectorAll('.emoji-btn').forEach(b=>{
              const val = b.getAttribute('data-emoji') || '';
              b.classList.toggle('active', val === emojiInp.value && val !== '');
            });
          }
        }
        if (logLocation) logLocation.value = l.location || '';
        if (logShoe) logShoe.value = l.shoe || '';
        if (logBuddies) logBuddies.value = l.companions || '';
        if (logNote) logNote.value = l.note || '';
        logSubmit.textContent = 'ویرایش';
        logCancel.style.display = '';
      });
    });
    logList.querySelectorAll('[data-del-log]')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-del-log');
        if (!confirm('حذف این ورودی؟')) return;
        DB.deleteLog(id);
        renderLogs();
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
        if (isHidden) renderCommentsForLog(id, wrap);
      });
    });
  }

  function renderCommentsForLog(logId, container){
    const cmts = DB.listCommentsForLog(logId);
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
    form.addEventListener('submit', (e)=>{
      e.preventDefault();
      const inp = form.querySelector('input');
      const text = (inp.value || '').trim();
      if (!text) return;
      DB.addComment({ logId, author: 'student', authorName: currentStudent?.name || '', authorStudentId: currentStudent?.id || null, text });
      inp.value='';
      renderCommentsForLog(logId, container);
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

  // Charts (student)
  function renderStudentCharts(){
    if(!currentStudent) return;
    const logs = DB.listLogsForStudent(currentStudent.id) || [];
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
    const dataUrl = await fileToDataURL(file);
    const monthJalaliStr = paymentMonthJalaliHidden.value || null;
    const note = paymentNote.value || '';
    DB.addPayment(currentStudent.id, { imageDataUrl: dataUrl, note, month: null, monthJalali: monthJalaliStr });
    paymentImage.value = '';
    paymentNote.value = '';
    renderPayments();
  });

  function renderPayments() {
    if (!currentStudent || !paymentList) return;
    const payments = DB.getPaymentsForStudent(currentStudent.id).slice();
    paymentList.innerHTML = payments.length ? '' : '<div class="muted">پرداختی ثبت نشده است</div>';
    // group by Jalali month label
    const groups = new Map();
    payments.forEach(p => {
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
        row.innerHTML = `
          <div class="payment">
            <a href="${p.imageDataUrl}" target="_blank" rel="noopener">
              <img src="${p.imageDataUrl}" alt="رسید" class="thumb" />
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
  function renderProfile(){
    if(!currentStudent || !profileForm) return;
    profName.value = currentStudent.name || '';
    const apply = (p)=>{
      p = p || {};
      profGender.value = p.gender || '';
      profBirthISO.value = p.birthISO || '';
      profBirthJalali.value = '';
      if (p.birthISO){ const d = parseISODate(p.birthISO); const j = Jalali.toJalali(d.getFullYear(), d.getMonth()+1, d.getDate()); profBirthJalali.value = `${j.jy}/${String(j.jm).padStart(2,'0')}/${String(j.jd).padStart(2,'0')}`; }
      profWeight.value = (p.weightKg != null) ? String(p.weightKg) : '';
      profHeight.value = (p.heightCm != null) ? String(p.heightCm) : '';
      cycleISO.value = p.cycleApproxISO || '';
      cycleJalali.value = '';
      if (p.cycleApproxISO){ const d2 = parseISODate(p.cycleApproxISO); const j2 = Jalali.toJalali(d2.getFullYear(), d2.getMonth()+1, d2.getDate()); cycleJalali.value = `${j2.jy}/${String(j2.jm).padStart(2,'0')}/${String(j2.jd).padStart(2,'0')}`; }
      if (femaleOnly) femaleOnly.style.display = (profGender.value === 'female') ? '' : 'none';
      if (profAvatar) profAvatar.src = p.photoDataUrl || '';
      renderMedicalDocs();
    };
    if (window.API && window.API_BASE){
      API.getProfile(currentStudent.id).then(apply).catch(()=>apply(DB.getStudentProfile(currentStudent.id)));
    } else {
      apply(DB.getStudentProfile(currentStudent.id));
    }
  }
  profGender?.addEventListener('change', ()=>{ if(femaleOnly) femaleOnly.style.display = (profGender.value === 'female') ? '' : 'none'; });
  profileForm?.addEventListener('submit', async (e)=>{
    e.preventDefault(); if(!currentStudent) return;
    const patch = { gender: profGender.value || null, birthISO: profBirthISO.value || null, weightKg: profWeight.value ? Number(profWeight.value) : null, heightCm: profHeight.value ? Number(profHeight.value) : null, cycleApproxISO: cycleISO.value || null };
    const newName = (profName.value || '').trim() || currentStudent.name;
    try {
      if (window.API && window.API_BASE) {
        await fetch(`${API_BASE}/students/${currentStudent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName })
        }).then(r=>r.json());
        await API.updateProfile(currentStudent.id, patch);
      } else {
        DB.updateStudent(currentStudent.id, { name: newName });
        DB.updateStudentProfile(currentStudent.id, patch);
      }
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
    if (window.API && window.API_BASE){
      await API.uploadMedicalDoc(currentStudent.id, f);
    } else {
      const dataUrl = await fileToDataURL(f);
      DB.addMedicalDoc(currentStudent.id, { name: f.name, dataUrl });
    }
    profDocFile.value=''; renderMedicalDocs();
  });

  profAvatarUpload?.addEventListener('click', async ()=>{
    if(!currentStudent || !profAvatarFile || !profAvatarFile.files || profAvatarFile.files.length===0) return;
    const f = profAvatarFile.files[0]; const dataUrl = await fileToDataURL(f);
    DB.updateStudentProfile(currentStudent.id, { photoDataUrl: dataUrl });
    profAvatarFile.value=''; renderProfile();
    updateHeaderFromProfile();
  });
  profAvatarRemove?.addEventListener('click', ()=>{
    if(!currentStudent) return; DB.updateStudentProfile(currentStudent.id, { photoDataUrl: null }); renderProfile(); updateHeaderFromProfile();
  });

  function updateHeaderFromProfile(){
    if(!currentStudent) return;
    if (studentNameHdr) studentNameHdr.textContent = currentStudent.name || 'پنل شاگرد';
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
    let docs = [];
    if (window.API && window.API_BASE){
      docs = await API.listMedicalDocs(currentStudent.id);
    } else {
      docs = DB.listMedicalDocsForStudent(currentStudent.id);
    }
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
        if (window.API && window.API_BASE){ await API.deleteMedicalDoc(currentStudent.id, id); }
        else { DB.deleteMedicalDoc(currentStudent.id, id); }
        renderMedicalDocs();
      });
    });
  }

  // Goals
  goalForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!currentStudent) return;
    const title = goalTitle.value.trim();
    if (!title) return;
    const dist = goalDist?.value ? Number(goalDist.value) : null;
    const paceSec = (goalPaceM?.value || goalPaceS?.value) ? (Number(goalPaceM.value||0)*60 + Number(goalPaceS.value||0)) : null;
    const durSec = (goalH?.value || goalM?.value || goalS?.value) ? (Number(goalH.value||0)*3600 + Number(goalM.value||0)*60 + Number(goalS.value||0)) : null;
    DB.addGoal(currentStudent.id, { title, targetDistanceKm: dist, targetPaceSecPerKm: paceSec, targetDurationSec: durSec });
    goalTitle.value = '';
    if (goalDist) goalDist.value = '';
    if (goalPaceM) goalPaceM.value = '';
    if (goalPaceS) goalPaceS.value = '';
    if (goalH) goalH.value = '';
    if (goalM) goalM.value = '';
    if (goalS) goalS.value = '';
    renderGoals();
    renderArchive();
  });

  async function renderGoals() {
    if (!currentStudent || !goalList) return;
    const goals = (window.API && window.API_BASE) ? await API.listGoals(currentStudent.id) : DB.listGoalsForStudent(currentStudent.id);
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
      f.addEventListener('submit', (e) => {
        e.preventDefault();
        const goalId = f.getAttribute('data-add-ms');
        const inp = f.querySelector('input');
        const text = (inp.value || '').trim();
        if (!text) return;
        DB.addMilestone(goalId, text);
        inp.value = '';
        renderGoals();
      });
    });

    // bind checkbox toggles
    goalList.querySelectorAll('input[type="checkbox"][data-goal]')?.forEach(chk => {
      chk.addEventListener('change', () => {
        const goalId = chk.getAttribute('data-goal');
        const msId = chk.getAttribute('data-ms');
        DB.toggleMilestone(goalId, msId, chk.checked);
        renderGoals();
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
        if (window.API && window.API_BASE) {
          await API.updateGoal(id, { title: newTitle, targetDistanceKm: dist ? Number(dist) : null, targetPaceSecPerKm: pace ? paceSec : null, targetDurationSec: dur ? durSec : null });
        } else {
          DB.updateGoalTitle(id, newTitle);
          DB.updateGoalMetrics(id, { targetDistanceKm: dist ? Number(dist) : null, targetPaceSecPerKm: pace ? paceSec : null, targetDurationSec: dur ? durSec : null });
        }
        renderGoals();
      });
    });
    goalList.querySelectorAll('[data-del-goal]')?.forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-del-goal');
        if (!confirm('حذف این هدف؟')) return;
        if (window.API && window.API_BASE) { await API.deleteGoal(id); }
        else { DB.deleteGoal(id); }
        renderGoals();
      });
    });

    // bind edit/delete milestone
    goalList.querySelectorAll('[data-edit-ms]')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const [gid, mid] = btn.getAttribute('data-edit-ms').split(':');
        const g = goals.find(x => x.id === gid);
        if (!g) return;
        const ms = (g.milestones || []).find(m => m.id === mid);
        const text = prompt('متن پیش‌هدف:', ms?.text || '');
        if (text == null) return;
        DB.updateMilestone(gid, mid, text);
        renderGoals();
      });
    });
    goalList.querySelectorAll('[data-del-ms]')?.forEach(btn => {
      btn.addEventListener('click', () => {
        const [gid, mid] = btn.getAttribute('data-del-ms').split(':');
        if (!confirm('حذف این پیش‌هدف؟')) return;
        DB.deleteMilestone(gid, mid);
        renderGoals();
      });
    });
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
      if (name === 'profile') renderProfile();
      if (name === 'log') renderStudentCharts();
    });
  });

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

  function setRemember(email, on){
    if(on){
      setCookie('csa_last_email', email, 180);
      setCookie('csa_remember', '1', 180);
      try { localStorage.setItem('csa_last_email', email); localStorage.setItem('csa_remember','1'); } catch {}
    } else {
      delCookie('csa_last_email'); delCookie('csa_remember');
      try { localStorage.removeItem('csa_last_email'); localStorage.removeItem('csa_remember'); } catch {}
    }
  }
  function getRememberedEmail(){
    return getCookie('csa_last_email') || (typeof localStorage!=='undefined' ? localStorage.getItem('csa_last_email') : '') || '';
  }
  function isRememberOn(){
    const c = getCookie('csa_remember');
    const l = (typeof localStorage!=='undefined' ? localStorage.getItem('csa_remember') : null);
    return c === '1' || l === '1';
  }

  // Auto-fill and optional auto-login
  (function initRemember(){
    const last = getRememberedEmail();
    if(last && loginEmail){ loginEmail.value = last; if(rememberMe) rememberMe.checked = isRememberOn(); }
    if(last && isRememberOn()){
      // Try auto-login using the saved email
      setTimeout(()=>{ try { loginForm?.dispatchEvent(new Event('submit', { cancelable:true, bubbles:true })); } catch{} }, 0);
    }
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
  paymentList?.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const idEdit = btn.getAttribute('data-edit-payment');
    const idDel = btn.getAttribute('data-del-payment');
    if (idEdit) {
      const p = DB.getPaymentsForStudent(currentStudent.id).find(x => x.id === idEdit);
      if (!p) return;
      const m = prompt('ماه (شمسی) به صورت YYYY-MM، مثلاً 1403-07:', (p.monthJalali || ''));
      if (m === null) return;
      const n = prompt('توضیح رسید:', p.note || '');
      const mNorm = (m || '').replace('/', '-').trim();
      DB.updatePayment(p.id, { monthJalali: mNorm || null, month: null, note: (n || '').trim() });
      renderPayments();
      return;
    }
    if (idDel) {
      if (!confirm('حذف این پرداختی؟')) return;
      DB.deletePayment(idDel);
      renderPayments();
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
    if(!txt || !hidden || !toggle || !popup || !prev || !next || !ymLabel || !daysWrap) return;
    const today = new Date();
    let j = Jalali.toJalali(today.getFullYear(), today.getMonth()+1, today.getDate());
    let jy=j.jy, jm=j.jm, jd=j.jd;
    function setSelected(jy0,jm0,jd0){ jy=jy0; jm=jm0; jd=jd0; txt.value = `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`; const g=Jalali.toGregorian(jy, jm, jd); const iso=`${g.gy}-${String(g.gm).padStart(2,'0')}-${String(g.gd).padStart(2,'0')}`; hidden.value=iso; }
    function render(){ ymLabel.textContent = `${jy} ${Jalali.monthNames[jm-1]}`; daysWrap.innerHTML=''; daysWrap.className='j-days'; const gFirst=Jalali.toGregorian(jy, jm, 1); const dFirst=new Date(gFirst.gy, gFirst.gm-1, gFirst.gd); const jsStart=dFirst.getDay(); const satFirst={6:0,0:1,1:2,2:3,3:4,4:5,5:6}[jsStart] ?? 0; for(let i=0;i<satFirst;i++){ const b=document.createElement('div'); b.className='j-day blank'; daysWrap.appendChild(b);} const daysInMonth=jMonthDays(jy,jm); for(let d=1; d<=daysInMonth; d++){ const btn=document.createElement('button'); btn.type='button'; btn.className='j-day'; btn.textContent=d; if(d===jd) btn.classList.add('selected'); btn.onclick=()=>{ setSelected(jy,jm,d); popup.hidden=true; }; daysWrap.appendChild(btn);} }
    function jMonthDays(jy,jm){ const g1=Jalali.toGregorian(jy,jm,1); const jy2=jm===12?jy+1:jy; const jm2=jm===12?1:jm+1; const g2=Jalali.toGregorian(jy2,jm2,1); const d1=new Date(g1.gy,g1.gm-1,g1.gd); const d2=new Date(g2.gy,g2.gm-1,g2.gd); return Math.round((d2-d1)/86400000); }
    toggle.onclick=()=>{ popup.hidden = !popup.hidden; };
    prev.onclick=()=>{ if(jm===1){ jm=12; jy--; } else { jm--; } render(); };
    next.onclick=()=>{ if(jm===12){ jm=1; jy++; } else { jm++; } render(); };
    document.addEventListener('click', (e)=>{ if(root && !root.contains(e.target)) popup.hidden = true; });
    setSelected(jy,jm,jd); render();
  }

  function mapJsDayToSatFirstKey(jsDay){
    const map = { 6:'sat', 0:'sun', 1:'mon', 2:'tue', 3:'wed', 4:'thu', 5:'fri' };
    return map[jsDay] || 'sat';
  }
});
