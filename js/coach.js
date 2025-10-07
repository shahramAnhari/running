document.addEventListener('DOMContentLoaded', () => {
  initCoach().catch(err => {
    console.error('Coach panel init failed', err);
    alert('خطا در بارگذاری داده‌ها. لطفاً صفحه را دوباره باز کنید.');
  });
});

async function initCoach() {
  try {
    await (window.DB?.ready || Promise.resolve());
  } catch (err) {
    console.error('DB init failed', err);
    alert('اتصال به سرور برقرار نشد.');
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

  const studentForm = document.getElementById('studentForm');
  const studentName = document.getElementById('studentName');
  const studentEmail = document.getElementById('studentEmail');
  const studentGroup = document.getElementById('studentGroup');
  const studentList = document.getElementById('studentList');

  const assignGroupForm = document.getElementById('assignGroupForm');
  const assignProgramForGroup = document.getElementById('assignProgramForGroup');
  const assignTargetGroup = document.getElementById('assignTargetGroup');
  const assignGroupStartISO = document.getElementById('assignGroupStartISO');
  const assignGroupDuration = document.getElementById('assignGroupDuration');

  const assignStudentForm = document.getElementById('assignStudentForm');
  const assignProgramForStudent = document.getElementById('assignProgramForStudent');
  const assignTargetStudent = document.getElementById('assignTargetStudent');
  const assignStudentStartISO = document.getElementById('assignStudentStartISO');
  const assignStudentDuration = document.getElementById('assignStudentDuration');

  const assignmentList = document.getElementById('assignmentList');
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

  // Sidebar nav
  const sideLinks = document.querySelectorAll('.side-link');
  const panels = document.querySelectorAll('.panel');

  const runAsync = (fn) => (...args) => Promise.resolve(fn(...args)).catch(err => console.error(err));

  function refreshSelects() {
    const programs = DB.listPrograms();
    const groups = DB.listGroups();
    const students = DB.listStudents();

    // clear
    [assignProgramForGroup, assignProgramForStudent, assignTargetGroup, assignTargetStudent, studentGroup]
      .forEach(sel => sel.innerHTML = '');

    // programs
    programs.forEach(p => {
      const o1 = document.createElement('option'); o1.value = p.id; o1.textContent = p.title; assignProgramForGroup.appendChild(o1);
      const o2 = document.createElement('option'); o2.value = p.id; o2.textContent = p.title; assignProgramForStudent.appendChild(o2);
    });

    // groups
    groups.forEach(g => {
      const og1 = document.createElement('option'); og1.value = g.id; og1.textContent = g.name; assignTargetGroup.appendChild(og1);
      const og2 = document.createElement('option'); og2.value = g.id; og2.textContent = g.name; studentGroup.appendChild(og2);
    });

    // students
    students.forEach(s => {
      const os = document.createElement('option'); os.value = s.id; os.textContent = `${s.name} (${s.email})`; assignTargetStudent.appendChild(os);
    });

    // payment filter students (+ All)
    if (paymentFilterStudent) {
      paymentFilterStudent.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'همه شاگردها'; paymentFilterStudent.appendChild(all);
      students.forEach(s => {
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${s.email})`;
        paymentFilterStudent.appendChild(o);
      });
    }

    // overview students
    if (ovStudent) {
      ovStudent.innerHTML = '';
      const all = document.createElement('option'); all.value = ''; all.textContent = 'یک شاگرد را انتخاب کنید'; ovStudent.appendChild(all);
      students.forEach(s => {
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${s.email})`;
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
        const o = document.createElement('option'); o.value = s.id; o.textContent = `${s.name} (${s.email})`;
        goalFilterStudent.appendChild(o);
      });
    }
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
      el.querySelector('[data-edit-program]')?.addEventListener('click', async () => {
        const newTitle = prompt('عنوان جدید برنامه:', p.title);
        if (newTitle == null) return;
        const newDesc = prompt('توضیحات جدید (اختیاری):', p.description || '');
        try {
          await DB.updateProgram(p.id, { title: newTitle.trim() || p.title, description: (newDesc ?? '').trim() });
          await renderPrograms();
          refreshSelects();
        } catch (err) {
          console.error(err);
          alert('به‌روزرسانی برنامه ناموفق بود.');
        }
      });
      el.querySelector('[data-del-program]')?.addEventListener('click', async () => {
        if (!confirm('حذف برنامه؟ انتساب‌های مرتبط نیز حذف می‌شوند.')) return;
        try {
          await DB.deleteProgram(p.id);
          await renderPrograms();
          await renderAssignments();
          refreshSelects();
        } catch (err) {
          console.error(err);
          alert('حذف برنامه انجام نشد.');
        }
      });
    });
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
      el.querySelector('[data-rename-group]')?.addEventListener('click', async () => {
        const name = prompt('نام جدید گروه:', g.name);
        if (name == null) return;
        try {
          await DB.updateGroup(g.id, { name: name.trim() || g.name });
          await renderGroups();
          refreshSelects();
        } catch (err) {
          console.error(err);
          alert('ویرایش گروه انجام نشد.');
        }
      });
      el.querySelector('[data-del-group]')?.addEventListener('click', async () => {
        if (!confirm('حذف گروه؟ انتساب‌های مربوط به گروه حذف می‌شوند.')) return;
        try {
          await DB.deleteGroup(g.id);
          await renderGroups();
          await renderAssignments();
          refreshSelects();
        } catch (err) {
          console.error(err);
          alert('حذف گروه انجام نشد.');
        }
      });
    });
  }

  async function renderStudents() {
    const students = DB.listStudents();
    const groups = DB.listGroups();
    studentList.innerHTML = students.length ? '' : '<div class="muted">شاگردی ثبت نشده است</div>';
    students.forEach(s => {
      const gName = groups.find(g => g.studentIds.includes(s.id))?.name || '—';
      const el = document.createElement('div');
      el.className = 'item';
      el.innerHTML = `
        <div class="row-between">
          <div><strong>${escapeHtml(s.name)}</strong> <span class="muted">(${escapeHtml(s.email)}) — گروه: ${escapeHtml(gName)}</span> ${s.verifiedAt ? '<span class="chip">تایید شده</span>' : '<span class="chip">در انتظار تایید</span>'}</div>
          <div class="actions">
            <button class="btn-sm" data-edit-student="${s.id}">ویرایش</button>
            <button class="btn-sm danger" data-del-student="${s.id}">حذف</button>
            ${s.verifiedAt ? '' : `<button class="btn-sm" data-verify-student="${s.id}">تایید دستی</button>`}
          </div>
        </div>`;
      studentList.appendChild(el);
      el.querySelector('[data-edit-student]')?.addEventListener('click', async () => {
        const newName = prompt('نام جدید:', s.name);
        if (newName == null) return;
        const newEmail = prompt('ایمیل جدید:', s.email);
        try {
          await DB.updateStudent(s.id, { name: newName.trim() || s.name, email: (newEmail ?? '').trim() || s.email });
          await renderStudents();
          refreshSelects();
        } catch (err) { alert(err.message || 'خطا'); }
      });
      el.querySelector('[data-del-student]')?.addEventListener('click', async () => {
        if (!confirm('حذف شاگرد؟ پرداخت‌ها و اهداف شاگرد نیز حذف می‌شوند.')) return;
        try {
          await DB.deleteStudent(s.id);
          await renderStudents();
          await renderAssignments();
          refreshSelects();
          await renderCoachPayments();
        } catch (err) {
          console.error(err);
          alert('حذف شاگرد انجام نشد.');
        }
      });
      el.querySelector('[data-verify-student]')?.addEventListener('click', async () => {
        try {
          await DB.markStudentVerified(s.id);
          await renderStudents();
        } catch (err) {
          console.error(err);
          alert('خطا در تایید شاگرد');
        }
      });
    });
  }

  async function renderAssignments() {
    const assignments = DB.listAssignments();
    const groups = DB.listGroups();
    const students = DB.listStudents();
    const programs = DB.listPrograms();

    assignmentList.innerHTML = assignments.length ? '' : '<div class="muted">انتسابی وجود ندارد</div>';
    assignments.forEach(a => {
      const p = programs.find(p => p.id === a.programId);
      let targetLabel = '';
      if (a.targetType === 'group') {
        const g = groups.find(g => g.id === a.targetId);
        targetLabel = `گروه: ${g ? escapeHtml(g.name) : 'نامشخص'}`;
      } else {
        const s = students.find(s => s.id === a.targetId);
        targetLabel = `شاگرد: ${s ? escapeHtml(s.name) : 'نامشخص'}`;
      }
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
      el.querySelector('[data-edit-asg]')?.addEventListener('click', async () => {
        const sd = prompt('تاریخ شروع (YYYY-MM-DD):', a.startDate || '');
        if (sd == null) return;
        const dd = prompt('مدت (روز):', String(a.durationDays || 7));
        try {
          await DB.updateAssignmentDates(a.id, { startDate: sd.trim(), durationDays: parseInt(dd||'7',10) });
          await renderAssignments();
        } catch (err) {
          console.error(err);
          alert('به‌روزرسانی انتساب انجام نشد.');
        }
      });
      el.querySelector('[data-del-asg]')?.addEventListener('click', async () => {
        if (!confirm('حذف انتساب؟')) return;
        try {
          await DB.deleteAssignment(a.id);
          await renderAssignments();
        } catch (err) {
          console.error(err);
          alert('حذف انتساب انجام نشد.');
        }
      });
    });
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
      el.querySelector('[data-edit-payment]')?.addEventListener('click', async () => {
        const curMonth = p.monthJalali || (p.month ? Jalali.fromGregorianYYYYMMToJalaliLabel(p.month) : '');
        const m = prompt('ماه (شمسی) به صورت YYYY-MM، مثلاً 1403-07:', (p.monthJalali || ''));
        if (m === null) return;
        const n = prompt('توضیح رسید:', p.note || '');
        // normalize m to YYYY-MM
        const mNorm = (m || '').replace('/', '-').trim();
        try {
          await DB.updatePayment(p.id, { monthJalali: mNorm || null, month: null, note: (n || '').trim() });
          await renderCoachPayments();
        } catch (err) {
          console.error(err);
          alert('بروزرسانی پرداخت انجام نشد.');
        }
      });
      el.querySelector('[data-del-payment]')?.addEventListener('click', async () => {
        if (!confirm('حذف این پرداختی؟')) return;
        try {
          await DB.deletePayment(p.id);
          await renderCoachPayments();
        } catch (err) {
          console.error(err);
          alert('حذف پرداخت انجام نشد.');
        }
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
      } catch (err) {
        console.error(err);
        alert('ارسال پیام انجام نشد.');
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
      } catch (err) {
        console.error(err);
        alert('ارسال نظر انجام نشد.');
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
    if (!title) return;
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
    } catch (err) {
      console.error(err);
      alert('ثبت برنامه انجام نشد.');
    }
  });

  groupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = groupName.value.trim();
    if (!name) return;
    try {
      await DB.addGroup({ name });
      groupName.value = '';
      await renderGroups();
      refreshSelects();
    } catch (err) {
      console.error(err);
      alert('ثبت گروه انجام نشد.');
    }
  });

  studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = studentName.value.trim();
    const email = studentEmail.value.trim();
    const groupId = studentGroup.value;
    if (!name || !email || !groupId) return;
    try {
      await DB.addStudent({ name, email, groupId });
      studentName.value = '';
      studentEmail.value = '';
      await renderStudents();
      await renderGroups();
      refreshSelects();
    } catch (err) {
      alert(err.message || 'خطا در افزودن شاگرد');
    }
  });

  assignGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const programId = assignProgramForGroup.value;
    const groupId = assignTargetGroup.value;
    const startDate = assignGroupStartISO.value || new Date().toISOString().slice(0,10);
    const durationDays = Math.max(1, parseInt(assignGroupDuration.value || '7', 10));
    if (!programId || !groupId) return;
    try {
      await DB.assignProgramToGroup(programId, groupId, { startDate, durationDays });
      await renderAssignments();
    } catch (err) {
      console.error(err);
      alert('انتساب برنامه به گروه انجام نشد.');
    }
  });

  assignStudentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const programId = assignProgramForStudent.value;
    const studentId = assignTargetStudent.value;
    const startDate = assignStudentStartISO.value || new Date().toISOString().slice(0,10);
    const durationDays = Math.max(1, parseInt(assignStudentDuration.value || '7', 10));
    if (!programId || !studentId) return;
    try {
      await DB.assignProgramToStudent(programId, studentId, { startDate, durationDays });
      await renderAssignments();
    } catch (err) {
      console.error(err);
      alert('انتساب برنامه به شاگرد انجام نشد.');
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
      alert('داده‌ی نمونه افزوده شد. ایمیل ورود شاگرد نمونه: ali@example.com');
    } catch (err) {
      console.error(err);
      alert('افزودن داده نمونه ناموفق بود (ممکن است از قبل وجود داشته باشد).');
    }
    await renderPrograms();
    await renderGroups();
    await renderStudents();
    await renderAssignments();
    refreshSelects();
    await renderCoachPayments();
    await renderOverview();
    await renderCoachLogs();
    await renderCoachGoals();
  }));

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

  // initial render
  await renderPrograms();
  await renderGroups();
  await renderStudents();
  await renderAssignments();
  refreshSelects();
  await renderCoachPayments();
  await renderOverview();
  await renderCoachLogs();
  await renderCoachGoals();
  initJDatePicker('g');
  initJDatePicker('s');
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
