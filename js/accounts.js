/* ==========================================================================
   Accounts — student login gate + teacher dashboard (classes, students,
   printable ID slips, Box Calculation results by date range).
   Uses window.Cloud only. Does nothing visible until Cloud.enabled.
   ========================================================================== */
(function () {
  'use strict';

  const KH = '០១២៣៤៥៦៧៨៩';
  const kh = (v) => String(v).replace(/[0-9]/g, (d) => KH[d]);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const OPS = { add: '+', sub: '−', mul: '×', div: '÷', mix: '±' };
  const OPN = { add: 'បូក', sub: 'ដក', mul: 'គុណ', div: 'ចែក', mix: 'ចម្រុះ' };
  const sizeOf = (r) => (r.boxes ? `${r.boxes} ប្រអប់` : `${r.size}×${r.size}`);
  const MEDAL = { gold: '🥇', silver: '🥈', bronze: '🥉', none: '—' };
  const pad2 = (n) => String(n).padStart(2, '0');
  const fmtDate = (ms) => { if (!ms) return '—'; const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };
  const dayStr = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

  const A = {
    root: null,
    classes: [],
    cls: null,
    students: [],
    results: [],
    tab: 'students',
    range: '7',
    from: '',
    to: '',
    openRow: null
  };

  /* ======================================================================
     1. Student login inside the existing Private Gate
     ====================================================================== */
  function enhanceGate() {
    const pane = document.querySelector('#gate-view-select .modal-body');
    if (!pane || pane.querySelector('.sg-tabs')) return;

    Array.from(pane.children).forEach((el) => el.classList.add('sg-teacher-part'));

    const wrap = document.createElement('div');
    wrap.className = 'sg';
    wrap.innerHTML = `
      <div class="sg-tabs" role="tablist">
        <button type="button" class="sg-tab active" data-sg="student">👩‍🎓 សិស្ស</button>
        <button type="button" class="sg-tab" data-sg="teacher">👨‍🏫 គ្រូបង្រៀន</button>
      </div>
      <form class="sg-student" autocomplete="on">
        <img src="assets/mascot.jpg" alt="" class="sg-mascot">
        <h4>ចូលរៀនដោយ ID របស់ប្អូន</h4>
        <p class="sg-hint">មើល ID និងលេខសម្ងាត់ នៅលើសន្លឹកដែលលោកគ្រូចែកឲ្យ</p>
        <label class="sg-field"><span>ID សិស្ស</span>
          <input id="sg-id" inputmode="numeric" autocomplete="username" placeholder="ឧ. 074821" required>
        </label>
        <label class="sg-field"><span>លេខសម្ងាត់</span>
          <span class="sg-pw-wrap">
            <input id="sg-pw" type="password" inputmode="numeric" autocomplete="current-password" placeholder="••••••" required>
            <button type="button" class="sg-eye" title="បង្ហាញ/លាក់">👁️</button>
          </span>
        </label>
        <p class="sg-error" role="alert"></p>
        <button type="submit" class="sg-submit">ចូលរៀន →</button>
      </form>`;
    pane.prepend(wrap);
    pane.classList.add('sg-mode-student');
    const title = document.getElementById('login-modal-title');
    if (title) title.textContent = '🔐 ចូលប្រព័ន្ធ Worksheet.Kh';

    wrap.querySelectorAll('.sg-tab').forEach((t) => t.addEventListener('click', () => {
      wrap.querySelectorAll('.sg-tab').forEach((x) => x.classList.toggle('active', x === t));
      pane.classList.toggle('sg-mode-student', t.dataset.sg === 'student');
    }));
    wrap.querySelector('.sg-eye').addEventListener('click', () => {
      const i = wrap.querySelector('#sg-pw');
      i.type = i.type === 'password' ? 'text' : 'password';
    });
    wrap.querySelector('.sg-student').addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = wrap.querySelector('.sg-submit');
      const err = wrap.querySelector('.sg-error');
      err.textContent = '';
      btn.disabled = true;
      btn.textContent = 'កំពុងចូល...';
      try {
        const p = await Cloud.signIn(wrap.querySelector('#sg-id').value, wrap.querySelector('#sg-pw').value);
        if (p.role !== 'student') {
          err.textContent = 'នេះជាគណនីគ្រូ។ សូមចូលតាម «🎓 សិស្ស & លទ្ធផល» វិញ';
          await Cloud.signOut();
        }
      } catch (ex) {
        err.textContent = ex.message;
      }
      btn.disabled = false;
      btn.textContent = 'ចូលរៀន →';
    });
  }

  /* Apply the signed-in state to the portal lock and top bar */
  function applySession(profile) {
    const app = window.App;
    if (!app) return;
    if (profile && profile.role === 'student') {
      app.currentStudent = profile;
      try {
        const prev = app.getStudentInfo ? app.getStudentInfo() : {};
        app.saveStudentInfo(Object.assign({}, prev, {
          name: profile.name,
          classRoom: profile.className,
          grade: String(profile.grade || prev.grade || ''),
          rollNo: profile.loginId
        }));
      } catch (e) {}
      document.body.classList.remove('portal-locked');
      if (app.closeLoginModal) app.closeLoginModal(true);
      // Students see only Box Calculation
      if (window.BoxCalc && BoxCalc.setStudentMode) {
        BoxCalc.setStudentMode(profile, () => Cloud.signOut());
      }
    } else {
      app.currentStudent = null;
      if (window.BoxCalc && BoxCalc.setStudentMode) BoxCalc.setStudentMode(null);
      if (!app.isTeacher && !app.isExamMode && !(profile && profile.role !== 'student')) {
        document.body.classList.add('portal-locked');
        if (app.openLoginModal) app.openLoginModal(true);
      }
      if (profile && profile.role !== 'student') {
        document.body.classList.remove('portal-locked');
        if (app.closeLoginModal) app.closeLoginModal(true);
      }
    }
    paintTopBar();
  }

  function paintTopBar() {
    const app = window.App || {};
    const navBtn = document.getElementById('btn-students-nav');
    if (navBtn) {
      const show = (Cloud.enabled && (app.isTeacher || Cloud.isTeacher())) || app.isAdmin;
      navBtn.style.display = show ? 'inline-flex' : 'none';
    }
    const authBtn = document.getElementById('btn-admin-auth');
    const p = Cloud.profile();
    if (authBtn && p && p.role === 'student' && !app.currentTeacher) {
      authBtn.className = 'btn btn-secondary nav-auth-btn';
      authBtn.title = `គណនីសិស្ស ៖ ${p.name} (${p.className})`;
      authBtn.innerHTML = `
        <span class="nav-user is-student">
          <span class="nav-user-dot"></span>
          <span class="nav-auth-text">${esc(p.name)}</span>
          <span class="nav-user-role">${esc(p.className || 'សិស្ស')}</span>
        </span>
        <span class="nav-user-out" title="ចាកចេញ (Logout)">✕</span>`;
      authBtn.onclick = null;
      authBtn.querySelector('.nav-user-out').addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('តើប្អូនចង់ចាកចេញពីគណនីមែនទេ?')) Cloud.signOut();
      });
    }
  }

  /* ======================================================================
     2. Teacher dashboard
     ====================================================================== */
  function ensureRoot() {
    if (A.root) return;
    let zt = null;
    window.addEventListener('resize', () => { clearTimeout(zt); zt = setTimeout(applyZoomFix, 150); });
    A.root = document.createElement('div');
    A.root.className = 'acc';
    A.root.id = 'accounts-dashboard';
    document.body.appendChild(A.root);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && A.root.classList.contains('open') && !document.querySelector('.acc-modal')) closeDashboard();
    });
  }

  function openDashboard() {
    ensureRoot();
    applyZoomFix();
    A.root.classList.add('open');
    document.body.classList.add('bx-lock');
    if (!Cloud.enabled) return renderSetupNeeded();
    renderLoading('កំពុងភ្ជាប់...');
    Cloud.ready().then(() => {
      if (Cloud.isTeacher()) loadHome();
      else renderTeacherLogin();
    }).catch((e) => renderError(e.message));
  }

  function closeDashboard() {
    if (A.root) A.root.classList.remove('open');
    document.body.classList.remove('bx-lock');
  }

  /* Browser zoom (desktop) = window outer/inner width ratio. Chrome remembers
     zoom per site, so a teacher who once zoomed out keeps seeing tiny text.
     The dashboard scales itself back up (CSS zoom) so it always looks like
     100% without pressing Ctrl+0. Zooming IN (for bigger text) is respected. */
  function browserZoom() {
    try {
      if (window.__forceZoomRatio) return window.__forceZoomRatio; // tests
      if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return 1;
      const z = window.outerWidth / window.innerWidth;
      return z && isFinite(z) ? z : 1;
    } catch (e) { return 1; }
  }
  const cssZoomSupported = typeof document !== 'undefined' && 'zoom' in document.documentElement.style;

  function applyZoomFix() {
    // The whole page is now zoom-corrected in index.html; nothing extra here
    if (A.root) A.root.style.zoom = '';
  }

  function zoomHint() {
    // Fallback only for browsers without CSS zoom support
    const z = browserZoom();
    if (cssZoomSupported || z > 0.85) return '';
    return `<span class="acc-zoom">🔍 Zoom ${Math.round(z * 100)}% · ចុច <kbd>Ctrl</kbd> + <kbd>0</kbd> ដើម្បីឲ្យធំធម្មតា</span>`;
  }

  function header(extra) {
    const p = Cloud.profile();
    return `
      <header class="acc-top">
        <button class="acc-icon" data-a="close" title="បិទ">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="acc-title"><b>🎓 សិស្ស & លទ្ធផល</b><small>${p && Cloud.isTeacher() ? esc(p.name) + (Cloud.isAdmin() ? ' · Admin' : '') : 'គ្រប់គ្រងគណនីសិស្ស'}</small></div>
        ${zoomHint()}
        ${extra || ''}
        ${p && Cloud.isTeacher() ? '<button class="acc-btn ghost sm" data-a="chpw">🔑 ប្តូរលេខសម្ងាត់</button><button class="acc-btn ghost sm" data-a="logout">ចាកចេញ</button>' : ''}
      </header>`;
  }

  function bindHeader() {
    const c = A.root.querySelector('[data-a="close"]');
    if (c) c.addEventListener('click', closeDashboard);
    const cp = A.root.querySelector('[data-a="chpw"]');
    if (cp) cp.addEventListener('click', changePasswordDialog);
    const l = A.root.querySelector('[data-a="logout"]');
    if (l) l.addEventListener('click', async () => {
      if (!confirm('ចាកចេញពីគណនីគ្រូ (Firebase)?')) return;
      await Cloud.signOut();
      renderTeacherLogin();
    });
  }

  function changePasswordDialog() {
    const m = modal(`
      <h3>🔑 ប្តូរលេខសម្ងាត់</h3>
      <label class="acc-field"><span>លេខសម្ងាត់បច្ចុប្បន្ន</span><input id="acc-op" type="password" autocomplete="current-password"></label>
      <label class="acc-field"><span>លេខសម្ងាត់ថ្មី (យ៉ាងតិច ៦ តួ)</span><input id="acc-np" type="password" autocomplete="new-password"></label>
      <label class="acc-field"><span>វាយលេខសម្ងាត់ថ្មីម្តងទៀត</span><input id="acc-np2" type="password" autocomplete="new-password"></label>
      <p class="acc-err"></p>
      <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>ប្តូរ</button></div>`);
    const err = m.querySelector('.acc-err');
    m.querySelector('#acc-op').focus();
    m.querySelector('[data-x]').addEventListener('click', () => m.remove());
    m.querySelector('[data-ok]').addEventListener('click', async () => {
      const op = m.querySelector('#acc-op').value;
      const np = m.querySelector('#acc-np').value;
      if (np.length < 6) { err.textContent = 'លេខសម្ងាត់ថ្មីត្រូវមានយ៉ាងតិច ៦ តួ'; return; }
      if (np !== m.querySelector('#acc-np2').value) { err.textContent = 'លេខសម្ងាត់ថ្មីទាំងពីរមិនដូចគ្នា'; return; }
      m.dataset.busy = '1';
      m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      try {
        await Cloud.changeMyPassword(op, np);
        m.remove();
        if (window.App && App.showToast) App.showToast('✅ បានប្តូរលេខសម្ងាត់ (ប្រើលេខថ្មីពេលចូលលើកក្រោយ)', 'success');
      } catch (e) {
        delete m.dataset.busy;
        err.textContent = e.message;
        m.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      }
    });
  }

  function renderLoading(msg) {
    A.root.innerHTML = header() + `<div class="acc-center"><div class="acc-spin"></div><p>${esc(msg)}</p></div>`;
    bindHeader();
  }
  function renderError(msg) {
    A.root.innerHTML = header() + `<div class="acc-center"><p class="acc-err">⚠️ ${esc(msg)}</p><button class="acc-btn" data-a="retry">សាកម្តងទៀត</button></div>`;
    bindHeader();
    A.root.querySelector('[data-a="retry"]').addEventListener('click', openDashboard);
  }

  function renderSetupNeeded() {
    A.root.innerHTML = header() + `
      <div class="acc-center acc-setup">
        <div class="acc-setup-ico">☁️</div>
        <h3>មិនទាន់ភ្ជាប់ Firebase</h3>
        <p>ដើម្បីបង្កើតគណនីសិស្ស និងមើលលទ្ធផលក្នុង App សូមបង្កើតគម្រោង Firebase (ឥតគិតថ្លៃ) រួចបិទភ្ជាប់ការកំណត់ក្នុងឯកសារ <code>js/firebase-config.js</code>។</p>
        <p>ការណែនាំមួយជំហានម្តងៗ មាននៅក្នុងឯកសារ <code>FIREBASE_SETUP.md</code>។</p>
      </div>`;
    bindHeader();
  }

  function renderTeacherLogin() {
    A.root.innerHTML = header() + `
      <div class="acc-center">
        <form class="acc-card acc-login">
          <h3>ចូលគណនីគ្រូ</h3>
          <p class="acc-muted">ប្រើ ID និងលេខសម្ងាត់គ្រូ ដែល Admin បានបង្កើតឲ្យ</p>
          <label class="acc-field"><span>ID គ្រូ</span><input id="acc-tid" autocomplete="username" placeholder="ឧ. sokha" required></label>
          <label class="acc-field"><span>លេខសម្ងាត់</span><input id="acc-tpw" type="password" autocomplete="current-password" required></label>
          <p class="acc-err"></p>
          <button class="acc-btn wide" type="submit">ចូល</button>
        </form>
      </div>`;
    bindHeader();
    const f = A.root.querySelector('.acc-login');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = f.querySelector('.acc-err');
      const btn = f.querySelector('button[type="submit"]');
      err.textContent = '';
      btn.disabled = true;
      try {
        const p = await Cloud.signIn(f.querySelector('#acc-tid').value, f.querySelector('#acc-tpw').value);
        if (p.role === 'student') {
          await Cloud.signOut();
          throw new Error('នេះជាគណនីសិស្ស មិនមែនគណនីគ្រូទេ');
        }
        loadHome();
      } catch (ex) {
        err.textContent = ex.message;
        btn.disabled = false;
      }
    });
  }

  async function loadHome() {
    renderLoading('កំពុងផ្ទុកថ្នាក់...');
    try {
      A.classes = await Cloud.listClasses();
      if (A.cls) A.cls = A.classes.find((c) => c.id === A.cls.id) || null;
      if (!A.cls && A.classes.length) A.cls = A.classes[0];
      renderShell();
      if (A.cls) await loadClass();
    } catch (e) {
      renderError(e.message);
    }
  }

  async function loadClass() {
    const main = A.root.querySelector('.acc-main');
    if (!A.cls) { renderShell(); return; }
    main.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
    try {
      A.studentCache = A.studentCache || {};
      if (!A.studentCache[A.cls.id]) A.studentCache[A.cls.id] = await Cloud.listStudents(A.cls);
      A.students = A.studentCache[A.cls.id];
      if (A.tab === 'results') await loadResults();
      renderMain();
    } catch (e) {
      main.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message)}</p>`;
    }
  }

  function renderShell() {
    const classItems = A.classes.map((c) => `
      <button class="acc-class ${A.cls && A.cls.id === c.id ? 'active' : ''}" data-cid="${c.id}">
        <b>${esc(c.name)}</b>
        <small>ថ្នាក់ទី ${kh(c.grade || '?')}${Cloud.isAdmin() && c.teacherName ? ' · ' + esc(c.teacherName) : ''}</small>
      </button>`).join('');

    A.root.innerHTML = header() + `
      <div class="acc-layout">
        <aside class="acc-side">
          <div class="acc-side-head">
            <h4>ថ្នាក់របស់ខ្ញុំ</h4>
            <button class="acc-btn sm" data-a="new-class">+ ថ្នាក់ថ្មី</button>
          </div>
          <div class="acc-class-list">${classItems || '<p class="acc-muted">មិនទាន់មានថ្នាក់។ ចុច «+ ថ្នាក់ថ្មី» ដើម្បីចាប់ផ្តើម។</p>'}</div>
          <select class="acc-class-select" aria-label="ជ្រើសថ្នាក់">
            ${A.classes.map((c) => `<option value="${c.id}" ${A.cls && A.cls.id === c.id ? 'selected' : ''}>${esc(c.name)} · ថ្នាក់ទី ${kh(c.grade || '?')}</option>`).join('')}
          </select>
          ${Cloud.isAdmin() ? '<button class="acc-btn ghost wide" data-a="teachers">👨‍🏫 គ្រប់គ្រងគណនីគ្រូ</button>' : ''}
        </aside>
        <main class="acc-main"></main>
      </div>`;
    bindHeader();
    A.root.querySelectorAll('[data-cid]').forEach((b) => b.addEventListener('click', () => selectClass(b.dataset.cid)));
    A.root.querySelector('.acc-class-select').addEventListener('change', (e) => selectClass(e.target.value));
    A.root.querySelector('[data-a="new-class"]').addEventListener('click', newClassDialog);
    const t = A.root.querySelector('[data-a="teachers"]');
    if (t) t.addEventListener('click', renderTeachers);
    if (!A.cls) {
      A.root.querySelector('.acc-main').innerHTML = `
        <div class="acc-center"><div class="acc-setup-ico">🏫</div><h3>បង្កើតថ្នាក់ដំបូង</h3>
        <p class="acc-muted">បង្កើតថ្នាក់ (ឧ. 7A) រួចបញ្ចូលឈ្មោះសិស្ស ដើម្បីបង្កើត ID និងលេខសម្ងាត់។</p>
        <button class="acc-btn" data-a="new-class2">+ ថ្នាក់ថ្មី</button></div>`;
      A.root.querySelector('[data-a="new-class2"]').addEventListener('click', newClassDialog);
    }
  }

  function selectClass(cid) {
    A.cls = A.classes.find((c) => c.id === cid) || null;
    A.openRow = null;
    A.root.querySelectorAll('.acc-class').forEach((b) => b.classList.toggle('active', b.dataset.cid === cid));
    const sel = A.root.querySelector('.acc-class-select');
    if (sel) sel.value = cid;
    loadClass();
  }

  function renderMain() {
    const main = A.root.querySelector('.acc-main');
    const c = A.cls;
    main.innerHTML = `
      <div class="acc-main-head">
        <div><h3>${esc(c.name)}</h3><small>ថ្នាក់ទី ${kh(c.grade || '?')} · ${kh(A.students.length)} សិស្ស</small>
          <button class="acc-btn ghost sm acc-del-class" data-a="del-class" title="លុបថ្នាក់នេះ">🗑️ លុបថ្នាក់</button></div>
        <div class="acc-tabs">
          <button class="acc-tab ${A.tab === 'students' ? 'active' : ''}" data-tab="students">👩‍🎓 សិស្ស</button>
          <button class="acc-tab ${A.tab === 'results' ? 'active' : ''}" data-tab="results">🧮 លទ្ធផលប្រអប់គណនា</button>
          <button class="acc-tab ${A.tab === 'scores' ? 'active' : ''}" data-tab="scores">📊 ពិន្ទុសកម្មភាព</button>
        </div>
      </div>
      <div class="acc-pane"></div>`;
    main.querySelector('[data-a="del-class"]').addEventListener('click', deleteClassDialog);
    main.querySelectorAll('[data-tab]').forEach((b) => b.addEventListener('click', async () => {
      A.tab = b.dataset.tab;
      main.querySelectorAll('[data-tab]').forEach((x) => x.classList.toggle('active', x === b));
      if (A.tab === 'results') {
        main.querySelector('.acc-pane').innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
        try { await loadResults(); } catch (e) { main.querySelector('.acc-pane').innerHTML = `<p class="acc-err">⚠️ ${esc(e.message)}</p>`; return; }
      }
      paintPane();
    }));
    paintPane();
  }

  function paintPane() {
    if (A.tab === 'results') paintResults();
    else if (A.tab === 'scores' && window.Scores) Scores.mountTeacher(A.root.querySelector('.acc-pane'), A.cls, A.students);
    else paintStudents();
  }

  /* ---------- students tab ---------- */
  function paintStudents() {
    const pane = A.root.querySelector('.acc-pane');
    const rows = A.students.map((s, i) => `
      <tr class="${s.active === false ? 'off' : ''}">
        <td>${kh(i + 1)}</td>
        <td class="nm">${esc(s.name)}</td>
        <td><code>${esc(s.loginId)}</code></td>
        <td><code class="pw">${esc(s.pw || '—')}</code></td>
        <td><button class="acc-pill ${s.active === false ? 'off' : 'on'}" data-uid="${s.uid}">${s.active === false ? 'ផ្អាក' : 'សកម្ម'}</button></td>
      </tr>`).join('');
    pane.innerHTML = `
      <div class="acc-toolbar">
        <button class="acc-btn" data-a="add">➕ បន្ថែមសិស្ស</button>
        <button class="acc-btn ghost" data-a="print" ${A.students.length ? '' : 'disabled'}>🖨️ បោះពុម្ពសន្លឹក ID</button>
      </div>
      ${A.students.length ? `
      <div class="acc-table-wrap">
        <table class="acc-table">
          <thead><tr><th>ល.រ</th><th>ឈ្មោះ</th><th>ID</th><th>លេខសម្ងាត់</th><th>ស្ថានភាព</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="acc-muted acc-note">🔒 លេខសម្ងាត់បង្ហាញតែលោកគ្រូនៃថ្នាក់នេះប៉ុណ្ណោះ។ ប្រសិនបើសិស្សភ្លេច លោកគ្រូអាចមើលនៅទីនេះ។ ចុច «សកម្ម/ផ្អាក» ដើម្បីបិទ ឬបើកគណនី។</p>`
      : '<div class="acc-center small"><p class="acc-muted">មិនទាន់មានសិស្សក្នុងថ្នាក់នេះ។ ចុច «➕ បន្ថែមសិស្ស»។</p></div>'}`;
    pane.querySelector('[data-a="add"]').addEventListener('click', addStudentsDialog);
    pane.querySelector('[data-a="print"]').addEventListener('click', printSlips);
    pane.querySelectorAll('[data-uid]').forEach((b) => b.addEventListener('click', async () => {
      const s = A.students.find((x) => x.uid === b.dataset.uid);
      const next = s.active === false;
      if (!next && !confirm(`ផ្អាកគណនី «${s.name}»? សិស្សនឹងមិនអាចចូលបាន។`)) return;
      b.disabled = true;
      try { await Cloud.setStudentActive(s.uid, next); s.active = next; paintStudents(); }
      catch (e) { alert(e.message); b.disabled = false; }
    }));
  }

  function modal(html) {
    const m = document.createElement('div');
    m.className = 'acc-modal';
    m.innerHTML = `<div class="acc-modal-card">${html}</div>`;
    A.root.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m && !m.dataset.busy) m.remove(); });
    return m;
  }

  function deleteClassDialog() {
    const c = A.cls;
    const m = modal(`
      <h3>🗑️ លុបថ្នាក់ ${esc(c.name)}</h3>
      <p class="acc-muted">នឹងលុបជាអចិន្ត្រៃយ៍ ៖ <b>ថ្នាក់នេះ</b> · <b>សិស្ស ${kh(A.students.length)} នាក់</b> (គណនីចូលប្រើ) · <b>ពិន្ទុសកម្មភាពទាំងអស់</b>។ មិនអាចយកមកវិញបានទេ។</p>
      <p class="acc-muted">💡 សូម Export Excel ពិន្ទុ និងបោះពុម្ពសន្លឹក ID មុនលុប បើនៅត្រូវការ។</p>
      <label class="acc-field"><span>វាយឈ្មោះថ្នាក់ «${esc(c.name)}» ដើម្បីបញ្ជាក់</span><input id="acc-dc" autocomplete="off"></label>
      <p class="acc-err"></p>
      <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn danger" data-ok>លុបជាអចិន្ត្រៃយ៍</button></div>`);
    const err = m.querySelector('.acc-err');
    m.querySelector('#acc-dc').focus();
    m.querySelector('[data-x]').addEventListener('click', () => m.remove());
    m.querySelector('[data-ok]').addEventListener('click', async () => {
      if (m.querySelector('#acc-dc').value.trim().toUpperCase() !== String(c.name).toUpperCase()) { err.textContent = 'ឈ្មោះថ្នាក់មិនត្រូវគ្នា'; return; }
      m.dataset.busy = '1';
      m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      try {
        await Cloud.deleteClassFull(c, A.students, (msg) => { err.textContent = msg; });
        if (A.studentCache) delete A.studentCache[c.id];
        m.remove();
        A.cls = null;
        A.tab = 'students';
        if (window.App && App.showToast) App.showToast('✅ បានលុបថ្នាក់', 'success');
        await loadHome();
      } catch (e) {
        delete m.dataset.busy;
        err.textContent = (e.message || e.code) + ' — ការលុបអាចមិនទាន់ចប់។ សូមសាកម្តងទៀត។';
        m.querySelectorAll('button').forEach((b) => { b.disabled = false; });
        if (A.studentCache) delete A.studentCache[c.id];
      }
    });
  }

  function newClassDialog() {
    const m = modal(`
      <h3>បង្កើតថ្នាក់ថ្មី</h3>
      <label class="acc-field"><span>ឈ្មោះថ្នាក់</span><input id="acc-cname" placeholder="ឧ. 7A" maxlength="20"></label>
      <label class="acc-field"><span>កម្រិតថ្នាក់</span>
        <select id="acc-cgrade">${[7, 8, 9, 10, 11, 12].map((g) => `<option value="${g}">ថ្នាក់ទី ${kh(g)}</option>`).join('')}</select>
      </label>
      <p class="acc-err"></p>
      <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>បង្កើត</button></div>`);
    const name = m.querySelector('#acc-cname');
    name.focus();
    name.addEventListener('input', () => {
      const g = (name.value.match(/^(1[0-2]|[7-9])/) || [])[1];
      if (g) m.querySelector('#acc-cgrade').value = g;
    });
    m.querySelector('[data-x]').addEventListener('click', () => m.remove());
    m.querySelector('[data-ok]').addEventListener('click', async () => {
      const n = name.value.trim();
      if (!n) { m.querySelector('.acc-err').textContent = 'សូមបញ្ចូលឈ្មោះថ្នាក់'; return; }
      if (A.classes.some((c) => c.name === n.toUpperCase())) { m.querySelector('.acc-err').textContent = 'ថ្នាក់នេះមានរួចហើយ'; return; }
      m.dataset.busy = '1';
      m.querySelector('[data-ok]').disabled = true;
      try {
        const id = await Cloud.createClass(n, m.querySelector('#acc-cgrade').value);
        m.remove();
        A.cls = { id };
        A.tab = 'students';
        await loadHome();
      } catch (e) {
        delete m.dataset.busy;
        m.querySelector('.acc-err').textContent = e.message;
        m.querySelector('[data-ok]').disabled = false;
      }
    });
  }

  function addStudentsDialog() {
    const m = modal(`
      <h3>បន្ថែមសិស្សក្នុងថ្នាក់ ${esc(A.cls.name)}</h3>
      <p class="acc-muted">បញ្ចូលឈ្មោះសិស្ស <b>មួយជួរម្នាក់</b> (អាចចម្លងពី Excel)។ ប្រព័ន្ធនឹងបង្កើត ID និងលេខសម្ងាត់ ៦ ខ្ទង់ឲ្យសិស្សម្នាក់ៗ។</p>
      <textarea id="acc-names" rows="9" placeholder="សុខ សុភា&#10;ចាន់ ដារ៉ា&#10;លី មុន្នី"></textarea>
      <p class="acc-count acc-muted">០ នាក់</p>
      <div class="acc-progress" hidden><span></span></div>
      <p class="acc-err"></p>
      <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>បង្កើតគណនី</button></div>`);
    const ta = m.querySelector('#acc-names');
    const parse = () => (window.Scores && Scores.parseNames ? Scores.parseNames(ta.value) : ta.value.split(/\r?\n/).map((s) => s.replace(/^\s*\d+[.)\-\s]+/, '').replace(/\t.*$/, '').trim()).filter(Boolean));
    ta.focus();
    ta.addEventListener('input', () => { m.querySelector('.acc-count').textContent = `${kh(parse().length)} នាក់`; });
    m.querySelector('[data-x]').addEventListener('click', () => m.remove());
    m.querySelector('[data-ok]').addEventListener('click', async () => {
      const names = parse();
      if (!names.length) { m.querySelector('.acc-err').textContent = 'សូមបញ្ចូលឈ្មោះយ៉ាងតិចម្នាក់'; return; }
      if (names.length > 80) { m.querySelector('.acc-err').textContent = 'បញ្ចូលបានច្រើនបំផុត ៨០ នាក់ក្នុងមួយដង'; return; }
      m.dataset.busy = '1';
      m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      ta.disabled = true;
      const bar = m.querySelector('.acc-progress');
      bar.hidden = false;
      const startSeq = A.students.reduce((mx, s) => Math.max(mx, s.seq || 0), 0) + 1;
      try {
        const created = await Cloud.createStudents(A.cls, names, startSeq, (done, total) => {
          bar.querySelector('span').style.width = `${(done / total) * 100}%`;
          m.querySelector('.acc-count').textContent = `កំពុងបង្កើត ${kh(done)} / ${kh(total)}...`;
        });
        A.students = A.students.concat(created);
        if (A.studentCache) A.studentCache[A.cls.id] = A.students;
        m.remove();
        paintStudents();
        const hd = A.root.querySelector('.acc-main-head small');
        if (hd) hd.textContent = `ថ្នាក់ទី ${kh(A.cls.grade || '?')} · ${kh(A.students.length)} សិស្ស`;
        if (window.App && App.showToast) App.showToast(`✅ បានបង្កើតគណនី ${created.length} នាក់`, 'success');
      } catch (e) {
        delete m.dataset.busy;
        m.querySelector('.acc-err').textContent = e.message + ' — គណនីដែលបង្កើតរួច នៅតែមាន។ សូមបិទ ហើយពិនិត្យបញ្ជី។';
        m.querySelector('[data-x]').disabled = false;
        if (A.studentCache) delete A.studentCache[A.cls.id];
        loadClass();
      }
    });
  }

  function printSlips() {
    let box = document.getElementById('acc-print');
    if (!box) {
      box = document.createElement('div');
      box.id = 'acc-print';
      document.body.appendChild(box);
    }
    const site = location.origin + location.pathname;
    box.innerHTML = `<div class="slip-grid">${A.students.filter((s) => s.active !== false).map((s) => `
      <div class="slip">
        <div class="slip-head"><b>Worksheet.Kh</b><span>${esc(A.cls.name)}</span></div>
        <div class="slip-name">${esc(s.name)}</div>
        <div class="slip-row"><span>ID</span><b>${esc(s.loginId)}</b></div>
        <div class="slip-row"><span>លេខសម្ងាត់</span><b>${esc(s.pw || '')}</b></div>
        <div class="slip-foot">${esc(site)}</div>
      </div>`).join('')}</div>`;
    document.body.classList.add('printing-slips');
    const done = () => { document.body.classList.remove('printing-slips'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done);
    setTimeout(() => { window.print(); setTimeout(done, 1500); }, 50);
  }

  /* ---------- results tab ---------- */
  function rangeDates() {
    const now = new Date();
    const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const tomorrow = new Date(startOfDay(now).getTime() + 86400000);
    if (A.range === 'custom' && A.from && A.to) {
      const f = new Date(A.from + 'T00:00:00');
      const t = new Date(new Date(A.to + 'T00:00:00').getTime() + 86400000);
      return [f, t];
    }
    const days = A.range === 'today' ? 1 : Number(A.range) || 7;
    return [new Date(tomorrow.getTime() - days * 86400000), tomorrow];
  }

  async function loadResults(refresh) {
    const [f, t] = rangeDates();
    A.results = (await Cloud.classResults(A.cls.id, f, t, { refresh: !!refresh })).filter((r) => r.type === 'boxcalc');
    A.loadedAt = Date.now();
  }

  function paintResults() {
    const pane = A.root.querySelector('.acc-pane');
    const [f, t] = rangeDates();
    if (!A.from) A.from = dayStr(f);
    if (!A.to) A.to = dayStr(new Date(t.getTime() - 86400000));

    const by = {};
    A.students.forEach((s) => { by[s.uid] = { s, list: [] }; });
    A.results.forEach((r) => {
      if (!by[r.uid]) by[r.uid] = { s: { uid: r.uid, name: r.name, loginId: r.loginId }, list: [] };
      by[r.uid].list.push(r);
    });
    const groups = Object.values(by);
    const medals = { gold: 0, silver: 0, bronze: 0 };
    A.results.forEach((r) => { if (medals[r.medal] !== undefined) medals[r.medal]++; });
    const activeStudents = groups.filter((g) => g.list.length).length;
    const avgAcc = A.results.length ? Math.round(A.results.reduce((a, r) => a + (r.acc || 0), 0) / A.results.length) : 0;

    const rows = groups.sort((a, b) => b.list.length - a.list.length || String(a.s.name).localeCompare(String(b.s.name), 'km')).map((g) => {
      const L = g.list;
      if (!L.length) {
        return `<tr class="none"><td class="nm">${esc(g.s.name)}<small>${esc(g.s.loginId || '')}</small></td><td>០</td><td>—</td><td>—</td><td>—</td><td>មិនទាន់ហ្វឹកហាត់</td></tr>`;
      }
      const avg = Math.round(L.reduce((a, r) => a + (r.acc || 0), 0) / L.length);
      const best = L.slice().sort((a, b) => (b.acc - a.acc) || (a.sec - b.sec))[0];
      const m = { gold: 0, silver: 0, bronze: 0 };
      L.forEach((r) => { if (m[r.medal] !== undefined) m[r.medal]++; });
      const open = A.openRow === g.s.uid;
      const detail = open ? `
        <tr class="detail"><td colspan="6">
          <table class="acc-sub">
            <thead><tr><th>ពេលវេលា</th><th>ប្រមាណវិធី</th><th>កម្រិត</th><th>ប្រអប់</th><th>ត្រឹមត្រូវ</th><th>ពេល</th><th>មេដាយ</th></tr></thead>
            <tbody>${L.map((r) => `<tr><td>${fmtDate(r.playedAt || r.createdAt)}</td><td><span class="acc-op op-${r.op}">${OPS[r.op] || '?'}</span> ${OPN[r.op] || ''}</td><td>${kh(r.level)}</td><td>${sizeOf(r)}</td><td>${r.acc}% <small>(${r.correct}/${r.total})</small></td><td>${Number(r.sec).toFixed(1)}s</td><td>${MEDAL[r.medal] || '—'}</td></tr>`).join('')}</tbody>
          </table>
        </td></tr>` : '';
      return `
        <tr class="row ${open ? 'open' : ''}" data-row="${g.s.uid}">
          <td class="nm">${esc(g.s.name)}<small>${esc(g.s.loginId || '')}</small></td>
          <td>${kh(L.length)}</td>
          <td><span class="acc-acc ${avg >= 90 ? 'hi' : avg >= 70 ? 'mid' : 'lo'}">${avg}%</span></td>
          <td>${best.acc}% · ${Number(best.sec).toFixed(1)}s <small>${OPS[best.op] || ''} · កម្រិត ${kh(best.level)}</small></td>
          <td class="md">🥇${kh(m.gold)} 🥈${kh(m.silver)} 🥉${kh(m.bronze)}</td>
          <td>${fmtDate(L[0].playedAt || L[0].createdAt)} <span class="acc-caret">${open ? '▴' : '▾'}</span></td>
        </tr>${detail}`;
    }).join('');

    pane.innerHTML = `
      <div class="acc-range">
        <div class="acc-chips">
          ${[['today', 'ថ្ងៃនេះ'], ['7', '៧ ថ្ងៃ'], ['30', '៣០ ថ្ងៃ'], ['custom', 'កំណត់ខ្លួនឯង']].map(([k, l]) => `<button class="acc-chip ${A.range === k ? 'active' : ''}" data-range="${k}">${l}</button>`).join('')}
        </div>
        <div class="acc-dates ${A.range === 'custom' ? '' : 'dim'}">
          <label>ពី <input type="date" id="acc-from" value="${A.from}"></label>
          <label>ដល់ <input type="date" id="acc-to" value="${A.to}"></label>
          <button class="acc-btn sm" data-a="apply">បង្ហាញ</button>
        </div>
      </div>
      <div class="acc-sum">
        <div><b>${kh(A.results.length)}</b><span>ដងសរុប</span></div>
        <div><b>${kh(activeStudents)}/${kh(A.students.length)}</b><span>សិស្សបានហ្វឹកហាត់</span></div>
        <div><b>${avgAcc}%</b><span>ត្រឹមត្រូវមធ្យម</span></div>
        <div class="md"><b>🥇${kh(medals.gold)} 🥈${kh(medals.silver)} 🥉${kh(medals.bronze)}</b><span>មេដាយ</span></div>
      </div>
      <div class="acc-toolbar end">
        <span class="acc-muted acc-updated">ធ្វើបច្ចុប្បន្នភាព ${A.loadedAt ? fmtDate(A.loadedAt).slice(11) : ''}</span>
        <button class="acc-btn ghost sm" data-a="refresh" title="ទាញយកលទ្ធផលថ្មីៗ">🔄 ផ្ទុកថ្មី</button>
        <button class="acc-btn ghost sm" data-a="csv" ${A.results.length ? '' : 'disabled'}>⬇️ ទាញយក CSV (Excel)</button>
      </div>
      <div class="acc-table-wrap">
        <table class="acc-table res">
          <thead><tr><th>សិស្ស</th><th>ចំនួនដង</th><th>ត្រឹមត្រូវមធ្យម</th><th>ល្អបំផុត</th><th>មេដាយ</th><th>ចុងក្រោយ</th></tr></thead>
          <tbody>${rows || '<tr><td colspan="6" class="acc-muted">គ្មានទិន្នន័យ</td></tr>'}</tbody>
        </table>
      </div>`;

    pane.querySelectorAll('[data-range]').forEach((b) => b.addEventListener('click', async () => {
      A.range = b.dataset.range;
      if (A.range !== 'custom') {
        A.from = ''; A.to = '';
        await reloadResults();
      } else {
        paintResults();
      }
    }));
    pane.querySelector('[data-a="apply"]').addEventListener('click', async () => {
      A.range = 'custom';
      A.from = pane.querySelector('#acc-from').value;
      A.to = pane.querySelector('#acc-to').value;
      if (!A.from || !A.to || A.from > A.to) { alert('សូមជ្រើសកាលបរិច្ឆេទ «ពី» និង «ដល់» ឲ្យត្រឹមត្រូវ'); return; }
      await reloadResults();
    });
    ['#acc-from', '#acc-to'].forEach((s) => pane.querySelector(s).addEventListener('change', () => {
      if (A.range !== 'custom') { A.range = 'custom'; pane.querySelector('.acc-dates').classList.remove('dim'); pane.querySelectorAll('[data-range]').forEach((x) => x.classList.toggle('active', x.dataset.range === 'custom')); }
    }));
    pane.querySelectorAll('[data-row]').forEach((tr) => tr.addEventListener('click', () => {
      A.openRow = A.openRow === tr.dataset.row ? null : tr.dataset.row;
      paintResults();
    }));
    pane.querySelector('[data-a="csv"]').addEventListener('click', exportCsv);
    pane.querySelector('[data-a="refresh"]').addEventListener('click', () => reloadResults(true));
  }

  async function reloadResults(refresh) {
    const pane = A.root.querySelector('.acc-pane');
    pane.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
    try { await loadResults(refresh); paintResults(); }
    catch (e) { pane.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message)}</p>`; }
  }

  function exportCsv() {
    const head = ['ពេលវេលា', 'ឈ្មោះ', 'ID', 'ថ្នាក់', 'ប្រមាណវិធី', 'កម្រិត', 'ទំហំ', 'ត្រូវ', 'សរុប', 'ត្រឹមត្រូវ %', 'ពេល (វិនាទី)', 'មេដាយ'];
    const medalName = { gold: 'មាស', silver: 'ប្រាក់', bronze: 'សំរិទ្ធ', none: '-' };
    const q = (v) => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
    const lines = [head.map(q).join(',')].concat(A.results.map((r) => [
      fmtDate(r.playedAt || r.createdAt), r.name, r.loginId, r.className, OPN[r.op] || r.op, r.level, r.boxes ? `${r.boxes}` : `${r.size}x${r.size}`,
      r.correct, r.total, r.acc, Number(r.sec).toFixed(1), medalName[r.medal] || '-'
    ].map(q).join(',')));
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `boxcalc_${A.cls.name}_${A.from || ''}_${A.to || ''}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- admin: teachers ---------- */
  async function renderTeachers() {
    const main = A.root.querySelector('.acc-main');
    A.root.querySelectorAll('.acc-class').forEach((b) => b.classList.remove('active'));
    main.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
    let list = [];
    try { list = await Cloud.listTeachers(); } catch (e) { main.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message)}</p>`; return; }
    main.innerHTML = `
      <div class="acc-main-head"><div><h3>👨‍🏫 គណនីគ្រូ</h3><small>${kh(list.length)} គ្រូ</small></div></div>
      <form class="acc-card acc-teacher-form">
        <h4>បង្កើតគណនីគ្រូថ្មី</h4>
        <div class="acc-form-row">
          <label class="acc-field"><span>ឈ្មោះ</span><input id="acc-tn" placeholder="ឧ. លោកគ្រូ សុខា" required></label>
          <label class="acc-field"><span>ID គ្រូ (អក្សរឡាតាំង)</span><input id="acc-ti" placeholder="ឧ. sokha" required></label>
          <label class="acc-field"><span>លេខសម្ងាត់ (≥ ៦ តួ)</span><input id="acc-tp" minlength="6" required></label>
        </div>
        <p class="acc-err"></p>
        <button class="acc-btn" type="submit">បង្កើតគណនីគ្រូ</button>
      </form>
      <div class="acc-table-wrap">
        <table class="acc-table">
          <thead><tr><th>ឈ្មោះ</th><th>ID ចូល</th><th>ស្ថានភាព</th></tr></thead>
          <tbody>${list.map((t) => `<tr class="${t.active === false ? 'off' : ''}"><td class="nm">${esc(t.name)}</td><td><code>${esc(t.loginId)}</code></td><td><button class="acc-pill ${t.active === false ? 'off' : 'on'}" data-tuid="${esc(t.uid)}" title="ចុចដើម្បីផ្អាក ឬបើកគណនី">${t.active === false ? 'ផ្អាក' : 'សកម្ម'}</button></td></tr>`).join('') || '<tr><td colspan="3" class="acc-muted">មិនទាន់មានគ្រូ</td></tr>'}</tbody>
        </table>
      </div>`;
    main.querySelectorAll('[data-tuid]').forEach((b) => b.addEventListener('click', async () => {
      const t = list.find((x) => x.uid === b.dataset.tuid);
      const next = t.active === false;
      if (!next && !confirm(`ផ្អាកគណនីគ្រូ «${t.name}»? គាត់នឹងមិនអាចចូលបានទៀតទេ (ទិន្នន័យនៅដដែល)។`)) return;
      b.disabled = true;
      try { await Cloud.setTeacherActive(t.uid, next); t.active = next; renderTeachers(); }
      catch (e) { alert(e.message); b.disabled = false; }
    }));
    const f = main.querySelector('.acc-teacher-form');
    f.addEventListener('submit', async (e) => {
      e.preventDefault();
      const err = f.querySelector('.acc-err');
      err.textContent = '';
      f.querySelector('button').disabled = true;
      try {
        await Cloud.createTeacher(f.querySelector('#acc-tn').value.trim(), f.querySelector('#acc-ti').value, f.querySelector('#acc-tp').value);
        if (window.App && App.showToast) App.showToast('✅ បានបង្កើតគណនីគ្រូ', 'success');
        renderTeachers();
      } catch (ex) {
        err.textContent = ex.message;
        f.querySelector('button').disabled = false;
      }
    });
  }

  /* ======================================================================
     3. Boot
     ====================================================================== */
  function boot() {
    if (!window.Cloud) return;
    const app = window.App;
    if (app && typeof app.updateAdminUI === 'function' && !app.__accWrapped) {
      const orig = app.updateAdminUI;
      app.updateAdminUI = function () { orig.apply(this, arguments); try { paintTopBar(); } catch (e) {} };
      app.__accWrapped = true;
    }
    paintTopBar();
    if (!Cloud.enabled) return;

    enhanceGate();
    // Optimistic unlock for a returning student, verified once Firebase is ready
    const cached = Cloud.cachedProfile();
    if (cached && cached.role === 'student') applySession(cached);
    Cloud.onChange(applySession);
    Cloud.ready().catch((e) => console.warn('Cloud', e));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  window.Accounts = { openDashboard, closeDashboard };
})();
