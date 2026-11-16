/* ==========================================================================
   Box Calculation (ប្រអប់គណនា) — mental arithmetic for speed & accuracy
   - 4 operations (+ − × ÷), 5 levels for grades 7–12, 5×5 or 10×10 grid
   - Own number pad (no phone keyboard), timer, progress, medals
   - Records stay on the device; results can be sent to the teacher's
     Google Sheet through the existing Apps Script (App.getTeacherSheetUrl)
   ========================================================================== */
(function () {
  'use strict';

  const STORE_KEY = 'ngs_boxcalc_v1';
  const KH_DIGITS = '០១២៣៤៥៦៧៨៩';
  const kh = (v) => String(v).replace(/[0-9]/g, (d) => KH_DIGITS[d]);
  const MINUS = '−';

  const OPS = {
    add: { sym: '+', name: 'បូក', color: 'op-add' },
    sub: { sym: MINUS, name: 'ដក', color: 'op-sub' },
    mul: { sym: '×', name: 'គុណ', color: 'op-mul' },
    div: { sym: '÷', name: 'ចែក', color: 'op-div' }
  };

  const LEVELS = [
    { id: 1, name: 'មូលដ្ឋាន', hint: '៧ + ៥', note: 'លេខ ១ ខ្ទង់' },
    { id: 2, name: 'ពីរខ្ទង់', hint: '៤៦ + ៨', note: 'ពីរខ្ទង់ និង ១ ខ្ទង់' },
    { id: 3, name: 'ចំនួនអវិជ្ជមាន', hint: '(−៣) + ៧', note: 'ចំនួនគត់វិជ្ជមាន និងអវិជ្ជមាន' },
    { id: 4, name: 'ទសភាគ', hint: '២.៥ + ០.៤', note: 'ទសភាគ ១ ខ្ទង់' },
    { id: 5, name: 'ប្រកួត', hint: '៤៧ + ៣៨', note: 'ពីរខ្ទង់ និង ពីរខ្ទង់' }
  ];

  // Seconds allowed per cell for a gold medal (base × level factor)
  const SEC_BASE = { add: 1.6, sub: 1.9, mul: 2.0, div: 2.4 };
  const SEC_LEVEL = [0, 1, 1.8, 1.7, 2.2, 3.2];

  /* ---------- number helpers ---------- */
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const pick = (pool, n) => shuffle(pool).slice(0, n);
  const rnd = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const round4 = (v) => Math.round(v * 10000) / 10000;
  const tenths = (a, b) => range(a, b).map((k) => k / 10);
  const fmt = (v) => {
    const s = String(round4(v));
    return s.startsWith('-') ? MINUS + s.slice(1) : s;
  };
  const fmtHead = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v));

  /* ---------- puzzle generator ---------- */
  function generate(op, level, n) {
    const nonZero = range(-10, 10).filter((x) => x !== 0);
    let top, side, divisorPool, quotientPool;

    if (op === 'div') {
      if (level === 1) { divisorPool = range(1, 10); quotientPool = range(1, 10); }
      else if (level === 2) { divisorPool = range(2, 11); quotientPool = range(2, 15); }
      else if (level === 3) { divisorPool = nonZero; quotientPool = nonZero; }
      else if (level === 4) { divisorPool = range(2, 11); quotientPool = tenths(1, 20); }
      else { divisorPool = range(11, 20); quotientPool = range(2, 12); }
      top = pick(divisorPool, n);
      const cells = [];
      for (let r = 0; r < n; r++) {
        const row = [];
        for (let c = 0; c < n; c++) {
          const q = rnd(quotientPool);
          row.push({ ans: round4(q), given: round4(top[c] * q) });
        }
        cells.push(row);
      }
      return { top, side: range(1, n), cells, isDiv: true };
    }

    const L = {
      add: [
        null,
        [range(1, 10), range(1, 10)],
        [range(1, 10), range(11, 99)],
        [nonZero, nonZero],
        [tenths(1, 10), tenths(11, 99)],
        [range(11, 99), range(11, 99)]
      ],
      sub: [
        null,
        [range(1, 10), range(11, 20)],
        [range(1, 10), range(20, 99)],
        [nonZero, nonZero],
        [tenths(1, 10), tenths(11, 99)],
        [range(11, 49), range(50, 99)]
      ],
      mul: [
        null,
        [range(1, 10), range(1, 10)],
        [range(2, 11), range(11, 30)],
        [nonZero, nonZero],
        [tenths(1, 10), range(2, 11)],
        [range(11, 20), range(11, 25)]
      ]
    }[op][level];

    top = pick(L[0], n);
    side = pick(L[1], n);
    const cells = side.map((s) => top.map((t) => {
      let ans = op === 'add' ? s + t : op === 'sub' ? s - t : s * t;
      return { ans: round4(ans) };
    }));
    return { top, side, cells, isDiv: false };
  }

  /* ---------- storage ---------- */
  function loadStore() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s && Array.isArray(s.attempts)) return Object.assign({ best: {}, totalSec: 0 }, s);
      }
    } catch (e) {}
    return { attempts: [], best: {}, totalSec: 0 };
  }
  function saveStore(s) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(s)); } catch (e) {}
  }
  const bestKey = (op, level, size) => `${op}|${level}|${size}`;

  function medalFor(acc, sec, target) {
    if (acc >= 100 && sec <= target) return 'gold';
    if (acc >= 90) return 'silver';
    if (acc >= 70) return 'bronze';
    return 'none';
  }
  const MEDAL = {
    gold: { ico: '🥇', name: 'មេដាយមាស' },
    silver: { ico: '🥈', name: 'មេដាយប្រាក់' },
    bronze: { ico: '🥉', name: 'មេដាយសំរិទ្ធ' },
    none: { ico: '💪', name: 'ព្យាយាមម្តងទៀត' }
  };

  const fmtTime = (sec) => {
    if (sec < 60) return `${sec.toFixed(1)} វិនាទី`;
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    return `${m} នាទី ${s} វិនាទី`;
  };
  const fmtClock = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec - m * 60;
    return m > 0 ? `${m}:${s.toFixed(1).padStart(4, '0')}` : s.toFixed(1);
  };

  /* ---------- state ---------- */
  const S = {
    level: 1,
    size: 10,
    op: null,
    puzzle: null,
    answers: [],
    active: 0,
    startAt: 0,
    elapsed: 0,
    timer: null,
    running: false,
    finished: false,
    lastResult: null
  };

  let root = null;
  const $ = (sel) => root.querySelector(sel);

  /* Student mode: a logged-in student sees only Box Calculation.
     It cannot be closed; the header shows the student and a logout button. */
  let student = null;      // { name, className } while in student mode
  let onLogout = null;

  function setStudentMode(profile, logoutFn) {
    student = profile || null;
    onLogout = logoutFn || null;
    if (student) {
      open();
      document.body.classList.add('bx-student-mode');
    } else {
      document.body.classList.remove('bx-student-mode');
      stopTimer();
      S.running = false;
      if (root) root.classList.remove('open');
      document.body.classList.remove('bx-lock');
    }
  }

  /* ---------- shell ---------- */
  function ensureRoot() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'box-calc';
    root.className = 'bx';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'ប្រអប់គណនា');
    document.body.appendChild(root);
    document.addEventListener('keydown', onKey);
  }

  function open() {
    ensureRoot();
    try {
      const pref = JSON.parse(localStorage.getItem(STORE_KEY + '_pref') || '{}');
      if (pref.level) S.level = pref.level;
      if (pref.size) S.size = pref.size;
    } catch (e) {}
    const alreadyOpen = root.classList.contains('open');
    root.classList.add('open');
    document.body.classList.add('bx-lock');
    if (!alreadyOpen || !root.innerHTML) renderLobby();
  }

  function close() {
    if (student) return; // students stay in Box Calculation
    if (S.running && !confirm('កំពុងគណនា! តើចង់ចាកចេញមែនទេ?')) return;
    stopTimer();
    S.running = false;
    if (root) root.classList.remove('open');
    document.body.classList.remove('bx-lock');
  }

  function savePref() {
    try { localStorage.setItem(STORE_KEY + '_pref', JSON.stringify({ level: S.level, size: S.size })); } catch (e) {}
  }

  /* ---------- lobby ---------- */
  function renderLobby() {
    stopTimer();
    S.running = false;
    S.finished = false;
    const store = loadStore();
    const counts = { gold: 0, silver: 0, bronze: 0 };
    store.attempts.forEach((a) => { if (counts[a.medal] !== undefined) counts[a.medal]++; });

    const opTiles = Object.keys(OPS).map((k) => {
      const b = store.best[bestKey(k, S.level, S.size)];
      const bestTxt = b ? `${MEDAL[b.medal] ? MEDAL[b.medal].ico : ''} ${b.acc}% · ${b.sec.toFixed(1)}s` : 'មិនទាន់លេង';
      return `
        <button class="bx-op ${OPS[k].color}" data-op="${k}">
          <span class="bx-op-sym">${OPS[k].sym}</span>
          <span class="bx-op-name">${OPS[k].name}</span>
          <span class="bx-op-best">${bestTxt}</span>
        </button>`;
    }).join('');

    const levelChips = LEVELS.map((l) => `
      <button class="bx-level ${S.level === l.id ? 'active' : ''}" data-level="${l.id}">
        <span class="bx-level-num">${kh(l.id)}</span>
        <span class="bx-level-txt"><b>${l.name}</b><small>${l.hint}</small></span>
      </button>`).join('');

    const pending = (window.Cloud && Cloud.isStudent() && Cloud.pendingCount) ? Cloud.pendingCount() : 0;
    const pendingNote = pending
      ? `<p class="bx-pending">⏳ មានលទ្ធផល ${kh(pending)} កំពុងរង់ចាំផ្ញើទៅលោកគ្រូ — នឹងផ្ញើដោយស្វ័យប្រវត្តិពេលមានអ៊ីនធឺណិត</p>`
      : '';
    const recent = store.attempts.slice(0, 6).map((a) => `
      <li>
        <span class="bx-rec-op ${OPS[a.op].color}">${OPS[a.op].sym}</span>
        <span class="bx-rec-main">កម្រិត ${kh(a.level)} · ${a.size}×${a.size}<small>${a.date}</small></span>
        <span class="bx-rec-score">${a.acc}%<small>${a.sec.toFixed(1)}s</small></span>
        <span class="bx-rec-medal">${MEDAL[a.medal].ico}</span>
      </li>`).join('');

    root.innerHTML = `
      <header class="bx-top">
        ${student ? `
        <img src="assets/mascot.jpg" alt="" class="bx-brand-img">
        <div class="bx-top-title"><b>🧮 ប្រអប់គណនា</b><small>👋 ${escapeAttr(student.name)} · ថ្នាក់ ${escapeAttr(student.className || '')}</small></div>
        <button class="bx-logout" data-act="logout" title="ចាកចេញពីគណនី">ចាកចេញ</button>` : `
        <button class="bx-icon-btn" data-act="close" title="ត្រឡប់ទៅទំព័រដើម">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="bx-top-title"><b>🧮 ប្រអប់គណនា</b><small>ពង្រឹងល្បឿន និងភាពត្រឹមត្រូវ</small></div>`}
      </header>

      <main class="bx-lobby">
        <section class="bx-intro">
          <div class="bx-intro-grid" aria-hidden="true">
            <span>+</span><span>៣</span><span>៧</span>
            <span>៥</span><span class="on">៨</span><span>១២</span>
            <span>៩</span><span>១២</span><span class="cur"></span>
          </div>
          <p>យកលេខ <b>ខាងឆ្វេង</b> គណនាជាមួយលេខ <b>ខាងលើ</b> ហើយបំពេញប្រអប់ពីឆ្វេងទៅស្តាំ ពីលើចុះក្រោម។ ព្យាយាមឲ្យ <b>ត្រូវទាំងអស់</b> និង <b>លឿនបំផុត</b>!</p>
        </section>

        <h3 class="bx-h">១. ជ្រើសកម្រិត</h3>
        <div class="bx-levels">${levelChips}</div>

        <h3 class="bx-h">២. ទំហំប្រអប់</h3>
        <div class="bx-sizes">
          <button class="bx-size ${S.size === 5 ? 'active' : ''}" data-size="5"><b>5 × 5</b><small>២៥ ប្រអប់ · លឿន</small></button>
          <button class="bx-size ${S.size === 10 ? 'active' : ''}" data-size="10"><b>10 × 10</b><small>១០០ ប្រអប់ · ពេញ</small></button>
        </div>

        <h3 class="bx-h">៣. ចុចប្រមាណវិធី ដើម្បីចាប់ផ្តើម</h3>
        <div class="bx-ops">${opTiles}</div>

        <section class="bx-record">
          <h3 class="bx-h">📒 កំណត់ត្រាសិក្សារបស់ខ្ញុំ</h3>
          <div class="bx-record-stats">
            <div><b>${kh(Math.round(store.totalSec / 60))}</b><span>នាទីហ្វឹកហាត់</span></div>
            <div><b>${kh(store.attempts.length)}</b><span>ប្រអប់បានធ្វើ</span></div>
            <div class="bx-medals"><span>🥇 ${kh(counts.gold)}</span><span>🥈 ${kh(counts.silver)}</span><span>🥉 ${kh(counts.bronze)}</span></div>
          </div>
          ${pendingNote}
          ${recent ? `<ul class="bx-recent">${recent}</ul>` : '<p class="bx-empty">មិនទាន់មានកំណត់ត្រា។ តោះចាប់ផ្តើមប្រអប់ដំបូង! 🚀</p>'}
          <p class="bx-medal-rule">🥇 ត្រូវ ១០០% ក្នុងពេលកំណត់ · 🥈 ត្រូវ ៩០% ឡើង · 🥉 ត្រូវ ៧០% ឡើង</p>
        </section>
      </main>`;

    root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => {
      S.level = Number(b.dataset.level); savePref(); renderLobby();
    }));
    root.querySelectorAll('[data-size]').forEach((b) => b.addEventListener('click', () => {
      S.size = Number(b.dataset.size); savePref(); renderLobby();
    }));
    root.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => start(b.dataset.op)));
    const closeBtn = $('[data-act="close"]');
    if (closeBtn) closeBtn.addEventListener('click', close);
    const logoutBtn = $('[data-act="logout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      if (confirm('តើប្អូនចង់ចាកចេញពីគណនីមែនទេ?') && onLogout) onLogout();
    });
    root.scrollTop = 0;
  }

  /* ---------- play ---------- */
  function start(op) {
    S.op = op;
    S.puzzle = generate(op, S.level, S.size);
    S.answers = new Array(S.size * S.size).fill('');
    S.active = 0;
    S.elapsed = 0;
    S.finished = false;
    S.lastResult = null;
    renderPlay();
    countdown(() => {
      S.running = true;
      S.startAt = performance.now();
      S.timer = setInterval(tick, 100);
    });
  }

  function countdown(done) {
    const cd = $('.bx-countdown');
    let n = 3;
    cd.textContent = kh(n);
    cd.classList.add('show');
    const iv = setInterval(() => {
      n--;
      if (n <= 0) {
        clearInterval(iv);
        cd.classList.remove('show');
        done();
      } else {
        cd.textContent = kh(n);
      }
    }, 650);
  }

  function tick() {
    S.elapsed = (performance.now() - S.startAt) / 1000;
    const t = $('.bx-clock');
    if (t) t.textContent = fmtClock(S.elapsed);
  }
  function stopTimer() {
    if (S.timer) clearInterval(S.timer);
    S.timer = null;
  }

  function renderPlay() {
    const { top, side, cells, isDiv } = S.puzzle;
    const n = S.size;
    const opInfo = OPS[S.op];
    const lvl = LEVELS[S.level - 1];

    let grid = `<div class="bx-grid ${isDiv ? 'is-div' : ''}" style="--n:${n}">`;
    grid += `<div class="bx-corner ${opInfo.color}">${opInfo.sym}</div>`;
    top.forEach((t) => { grid += `<div class="bx-head bx-head-top">${fmtHead(t)}</div>`; });
    for (let r = 0; r < n; r++) {
      grid += `<div class="bx-head bx-head-side">${isDiv ? r + 1 : fmtHead(side[r])}</div>`;
      for (let c = 0; c < n; c++) {
        const i = r * n + c;
        const given = isDiv ? `<i class="bx-given">${fmt(cells[r][c].given)}</i>` : '';
        grid += `<button class="bx-cell" data-i="${i}">${given}<span class="bx-val"></span></button>`;
      }
    }
    grid += '</div>';

    const instr = isDiv
      ? 'យកលេខតូចក្នុងប្រអប់ ចែកនឹងលេខខាងលើ'
      : `យកលេខខាងឆ្វេង ${opInfo.sym} លេខខាងលើ`;

    root.innerHTML = `
      <header class="bx-top">
        <button class="bx-icon-btn" data-act="back" title="ត្រឡប់">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div class="bx-top-title"><b><span class="bx-op-chip ${opInfo.color}">${opInfo.sym}</span> ${opInfo.name} · កម្រិត ${kh(S.level)}</b><small>${lvl.name} · ${n}×${n}</small></div>
        <div class="bx-clock-wrap"><span class="bx-clock">0.0</span><small>វិនាទី</small></div>
      </header>

      <div class="bx-play">
        <div class="bx-board">
          <div class="bx-progress"><span class="bx-progress-fill"></span><b class="bx-progress-txt">0 / ${n * n}</b></div>
          <p class="bx-instr">${instr}</p>
          <div class="bx-grid-scroll">${grid}</div>
        </div>
        <aside class="bx-pad">
          <div class="bx-pad-keys">
            ${['7', '8', '9', '4', '5', '6', '1', '2', '3'].map((d) => `<button data-k="${d}">${d}</button>`).join('')}
            <button data-k="-" class="k-soft">${MINUS}</button>
            <button data-k="0">0</button>
            <button data-k="." class="k-soft">.</button>
            <button data-k="back" class="k-soft" title="លុប">⌫</button>
            <button data-k="enter" class="k-enter">បន្ទាប់ ↵</button>
          </div>
          <button class="bx-finish" data-act="finish">✅ បញ្ចប់ & ពិនិត្យ</button>
        </aside>
      </div>
      <div class="bx-countdown"></div>
      <div class="bx-result-layer"></div>`;

    root.querySelectorAll('.bx-cell').forEach((cell) => cell.addEventListener('click', () => {
      if (S.finished) return;
      setActive(Number(cell.dataset.i));
    }));
    root.querySelectorAll('[data-k]').forEach((b) => b.addEventListener('click', () => press(b.dataset.k)));
    $('[data-act="finish"]').addEventListener('click', () => finish(false));
    $('[data-act="back"]').addEventListener('click', () => {
      if (S.running && !confirm('កំពុងគណនា! តើចង់ឈប់ ហើយត្រឡប់ក្រោយមែនទេ?')) return;
      renderLobby();
    });
    setActive(0);
    root.scrollTop = 0;
  }

  function setActive(i) {
    const n2 = S.size * S.size;
    if (i < 0 || i >= n2) return;
    const prev = root.querySelector('.bx-cell.active');
    if (prev) prev.classList.remove('active');
    S.active = i;
    const cell = root.querySelector(`.bx-cell[data-i="${i}"]`);
    if (cell) {
      cell.classList.add('active');
      const sc = $('.bx-grid-scroll');
      if (sc) {
        const cr = cell.getBoundingClientRect();
        const sr = sc.getBoundingClientRect();
        if (cr.right > sr.right) sc.scrollLeft += cr.right - sr.right + 12;
        if (cr.left < sr.left + 40) sc.scrollLeft -= sr.left + 40 - cr.left;
      }
      if (cell.getBoundingClientRect().bottom > window.innerHeight - 20 || cell.getBoundingClientRect().top < 70) {
        cell.scrollIntoView({ block: 'center', inline: 'nearest' });
      }
    }
  }

  function press(k) {
    if (!S.running || S.finished) return;
    const i = S.active;
    let v = S.answers[i];
    if (k === 'enter') { advance(); return; }
    if (k === 'back') v = v.slice(0, -1);
    else if (k === '-') v = v.startsWith('-') ? v.slice(1) : '-' + v;
    else if (k === '.') { if (!v.includes('.')) v = (v === '' || v === '-' ? v + '0' : v) + '.'; }
    else if (/^[0-9]$/.test(k)) { if (v.replace(/[-.]/g, '').length < 6) v += k; }
    S.answers[i] = v;
    paintCell(i);
    updateProgress();
  }

  function advance() {
    const n2 = S.size * S.size;
    // Jump to the next empty cell (left→right, top→down, wrapping)
    for (let step = 1; step < n2; step++) {
      const j = (S.active + step) % n2;
      if (S.answers[j] === '' || S.answers[j] === '-') { setActive(j); return; }
    }
  }

  function paintCell(i) {
    const cell = root.querySelector(`.bx-cell[data-i="${i}"] .bx-val`);
    if (!cell) return;
    const v = S.answers[i];
    cell.textContent = v.startsWith('-') ? MINUS + v.slice(1) : v;
    cell.parentElement.classList.toggle('filled', v !== '' && v !== '-');
  }

  function updateProgress() {
    const total = S.size * S.size;
    const filled = S.answers.filter((v) => v !== '' && v !== '-').length;
    const fill = $('.bx-progress-fill');
    const txt = $('.bx-progress-txt');
    if (fill) fill.style.width = `${(filled / total) * 100}%`;
    if (txt) txt.textContent = `${filled} / ${total}`;
    if (filled === total) {
      const fin = $('.bx-finish');
      if (fin) fin.classList.add('ready');
    }
  }

  const parse = (v) => {
    if (v === '' || v === '-' || v === '.') return NaN;
    return Number(v);
  };

  function finish(fromKey) {
    if (!S.running || S.finished) return;
    const total = S.size * S.size;
    const filled = S.answers.filter((v) => v !== '' && v !== '-').length;
    if (filled < total && !confirm(`នៅសល់ ${total - filled} ប្រអប់ទទេ។ តើចង់បញ្ចប់ឥឡូវនេះមែនទេ?`)) return;

    tick();
    stopTimer();
    S.running = false;
    S.finished = true;

    const n = S.size;
    let correct = 0;
    for (let i = 0; i < total; i++) {
      const r = Math.floor(i / n), c = i % n;
      const ans = S.puzzle.cells[r][c].ans;
      const got = parse(S.answers[i]);
      const ok = !isNaN(got) && Math.abs(got - ans) < 1e-6;
      if (ok) correct++;
      const el = root.querySelector(`.bx-cell[data-i="${i}"]`);
      el.classList.remove('active');
      el.classList.add(ok ? 'ok' : 'bad');
      if (!ok) el.insertAdjacentHTML('beforeend', `<em class="bx-fix">${fmt(ans)}</em>`);
    }

    const sec = Math.round(S.elapsed * 10) / 10;
    const acc = Math.round((correct / total) * 100);
    const target = SEC_BASE[S.op] * SEC_LEVEL[S.level] * total;
    const medal = medalFor(acc, sec, target);

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const attempt = { op: S.op, level: S.level, size: n, correct, total, acc, sec, medal, date };

    const store = loadStore();
    store.attempts.unshift(attempt);
    if (store.attempts.length > 200) store.attempts.length = 200;
    store.totalSec = (store.totalSec || 0) + sec;
    const key = bestKey(S.op, S.level, n);
    const prevBest = store.best[key];
    const isBest = !prevBest || acc > prevBest.acc || (acc === prevBest.acc && sec < prevBest.sec);
    if (isBest) store.best[key] = { acc, sec, medal };
    saveStore(store);

    S.lastResult = Object.assign({ isBest, target }, attempt);
    S.cloudSave = null;
    if (window.Cloud && Cloud.isStudent()) {
      S.cloudSave = Cloud.saveResult('boxcalc', {
        op: attempt.op, level: attempt.level, size: attempt.size,
        correct: attempt.correct, total: attempt.total, acc: attempt.acc,
        sec: attempt.sec, medal: attempt.medal
      });
    }
    showResult();
  }

  function showResult() {
    const R = S.lastResult;
    const m = MEDAL[R.medal];
    const sheetUrl = (window.App && typeof App.getTeacherSheetUrl === 'function') ? App.getTeacherSheetUrl() : '';
    const info = (window.App && typeof App.getStudentInfo === 'function') ? App.getStudentInfo() : {};
    const opInfo = OPS[R.op];

    const isCloud = !!S.cloudSave;
    const sendBlock = isCloud ? `
      <p class="bx-saved bx-cloud">☁️ កំពុងរក្សាទុកក្នុងគណនីរបស់ប្អូន...</p>` : sheetUrl ? `
      <div class="bx-send">
        <p class="bx-send-title">📤 ផ្ញើលទ្ធផលទៅលោកគ្រូ</p>
        <div class="bx-send-form">
          <input class="bx-in" id="bx-name" placeholder="ឈ្មោះសិស្ស" value="${escapeAttr(info.name || '')}">
          <input class="bx-in" id="bx-class" placeholder="ថ្នាក់ (ឧ. 7A)" value="${escapeAttr(info.classRoom || '')}">
          <input class="bx-in bx-in-sm" id="bx-roll" placeholder="លេខ" value="${escapeAttr(info.rollNo || '')}">
        </div>
        <button class="bx-btn bx-btn-send" data-act="send">ផ្ញើទៅ Google Sheet</button>
        <p class="bx-send-status"></p>
      </div>` : `
      <p class="bx-saved">💾 លទ្ធផលបានរក្សាទុកក្នុងឧបករណ៍នេះរួចហើយ។ ដើម្បីផ្ញើទៅលោកគ្រូ សូមបើកតាម Link ដែលលោកគ្រូផ្ញើឲ្យ។</p>`;

    $('.bx-result-layer').innerHTML = `
      <div class="bx-result medal-${R.medal}">
        <button class="bx-result-min" data-act="peek" title="មើលប្រអប់">មើលចម្លើយ ▾</button>
        <div class="bx-result-medal">${m.ico}</div>
        <h3>${m.name}</h3>
        ${R.isBest ? '<span class="bx-best-tag">🏆 កំណត់ត្រាថ្មី!</span>' : ''}
        <div class="bx-result-stats">
          <div><b>${R.acc}%</b><span>ត្រឹមត្រូវ</span></div>
          <div><b>${R.sec.toFixed(1)}s</b><span>${fmtTime(R.sec)}</span></div>
          <div><b>${R.correct}/${R.total}</b><span>ប្រអប់ត្រូវ</span></div>
        </div>
        <p class="bx-target">⏱️ ពេលកំណត់សម្រាប់មេដាយមាស៖ ${fmtTime(R.target)}</p>
        ${sendBlock}
        <div class="bx-result-actions">
          <button class="bx-btn bx-btn-ghost" data-act="lobby">← ម៉ឺនុយ</button>
          <button class="bx-btn ${opInfo.color}" data-act="again">🔁 លេងម្តងទៀត</button>
        </div>
      </div>`;

    const layer = $('.bx-result-layer');
    layer.classList.add('show');
    layer.querySelector('[data-act="lobby"]').addEventListener('click', renderLobby);
    layer.querySelector('[data-act="again"]').addEventListener('click', () => start(S.op));
    layer.querySelector('[data-act="peek"]').addEventListener('click', () => {
      layer.classList.remove('show');
      const fin = $('.bx-finish');
      if (fin) {
        fin.textContent = '📊 មើលលទ្ធផលវិញ';
        fin.classList.add('ready');
        fin.onclick = (e) => { e.stopImmediatePropagation(); layer.classList.add('show'); };
      }
    });
    if (isCloud) {
      const line = layer.querySelector('.bx-cloud');
      S.cloudSave.then((res) => {
        if (res && res.queued) {
          line.textContent = '⏳ គ្មានអ៊ីនធឺណិត ឬប្រព័ន្ធរវល់ — បានរក្សាទុកក្នុងឧបករណ៍នេះ ហើយនឹងផ្ញើទៅលោកគ្រូដោយស្វ័យប្រវត្តិ';
          line.classList.add('wait');
        } else {
          line.textContent = '✅ បានរក្សាទុកក្នុងគណនី — លោកគ្រូអាចមើលលទ្ធផលនេះបាន';
          line.classList.add('ok');
        }
      }).catch((e) => {
        line.textContent = '⚠️ ' + ((e && e.message) || 'រក្សាទុកក្នុងគណនីមិនបាន') + ' — បានរក្សាទុកក្នុងឧបករណ៍នេះ';
        line.classList.add('warn');
      });
    }
    const sendBtn = layer.querySelector('[data-act="send"]');
    if (sendBtn) sendBtn.addEventListener('click', () => sendResult(sheetUrl));
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  }

  async function sendResult(sheetUrl) {
    const R = S.lastResult;
    const name = ($('#bx-name').value || '').trim();
    const classRoom = ($('#bx-class').value || '').trim().toUpperCase();
    const rollNo = ($('#bx-roll').value || '').trim();
    const status = $('.bx-send-status');
    if (!name || !classRoom) {
      status.textContent = '⚠️ សូមបំពេញឈ្មោះ និងថ្នាក់ជាមុនសិន';
      status.className = 'bx-send-status warn';
      return;
    }
    const prev = (window.App && App.getStudentInfo) ? App.getStudentInfo() : {};
    const info = Object.assign({}, prev, { name, classRoom, rollNo });
    if (window.App && App.saveStudentInfo) App.saveStudentInfo(info);

    const opInfo = OPS[R.op];
    const payload = {
      timestamp: R.date,
      studentName: name,
      studentClass: classRoom,
      rollNumber: rollNo || '-',
      grade: info.grade || '7',
      lessonTitle: `🧮 ប្រអប់គណនា (${opInfo.sym} ${opInfo.name}) · កម្រិត ${R.level} ${LEVELS[R.level - 1].name} · ${R.size}×${R.size}`,
      pointTitle: `⏱️ ${R.sec.toFixed(1)} វិនាទី · ${MEDAL[R.medal].ico} ${MEDAL[R.medal].name}`,
      score: R.correct,
      total: R.total,
      percentage: `${R.acc}%`,
      teacherName: (window.App && (App.examTeacherName || (App.currentTeacher && App.currentTeacher.name))) || ''
    };

    const btn = $('[data-act="send"]');
    btn.disabled = true;
    status.textContent = 'កំពុងផ្ញើ...';
    status.className = 'bx-send-status';
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      status.textContent = `✅ បានផ្ញើទៅតារាងថ្នាក់ «${classRoom}» រួចរាល់!`;
      status.className = 'bx-send-status ok';
      btn.textContent = '✓ បានផ្ញើ';
    } catch (e) {
      status.textContent = '⚠️ ផ្ញើមិនបាន (គ្មានអ៊ីនធឺណិត?) សូមសាកម្តងទៀត';
      status.className = 'bx-send-status warn';
      btn.disabled = false;
    }
  }

  /* ---------- keyboard ---------- */
  function onKey(e) {
    if (!root || !root.classList.contains('open')) return;
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'Escape') { if (!student) { e.preventDefault(); close(); } return; }
    if (!S.running) return;
    const n = S.size;
    const k = e.key;
    if (/^[0-9]$/.test(k)) press(k);
    else if (k === '.' || k === ',') press('.');
    else if (k === '-' || k === '−') press('-');
    else if (k === 'Backspace') press('back');
    else if (k === 'Enter' || k === 'Tab' || k === 'ArrowRight') { if (k === 'ArrowRight') setActive(Math.min(S.active + 1, n * n - 1)); else advance(); }
    else if (k === 'ArrowLeft') setActive(Math.max(S.active - 1, 0));
    else if (k === 'ArrowDown') setActive(Math.min(S.active + n, n * n - 1));
    else if (k === 'ArrowUp') setActive(Math.max(S.active - n, 0));
    else return;
    e.preventDefault();
  }

  window.BoxCalc = { open, close, setStudentMode, _generate: generate };
})();
