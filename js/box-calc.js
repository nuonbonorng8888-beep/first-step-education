/* ==========================================================================
   Box Calculation (ប្រអប់គណនា) — mental arithmetic for speed & accuracy
   - 5 operations: + − × ÷ and mixed (ចម្រុះ), each with levels 1–10
   - 10 / 20 / 50 / 100 boxes (2×5, 4×5, 5×10, 10×10)
   - Own number pad (no phone keyboard), timer, progress, medals
   - Records on the device; logged-in students also save to their account
     (window.Cloud); others can send to the teacher's Google Sheet
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
    div: { sym: '÷', name: 'ចែក', color: 'op-div' },
    mix: { sym: '±', name: 'ចម្រុះ', color: 'op-mix', long: '+ − × ÷ ចម្រុះ' }
  };
  const CELL_OP_SYM = { add: '+', sub: MINUS, mul: '×', div: '÷' };

  const BOXES = {
    10: { rows: 2, cols: 5 },
    20: { rows: 4, cols: 5 },
    50: { rows: 5, cols: 10 },
    100: { rows: 10, cols: 10 }
  };
  const BOX_LIST = [10, 20, 50, 100];

  /* ---------- number pools ---------- */
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const tenths = (a, b) => range(a, b).map((k) => k / 10);
  const hundredths = (a, b) => range(a, b).map((k) => k / 100);
  const nz = (a) => range(-a, a).filter((x) => x !== 0);
  const nzTenths = (a) => nz(a).map((k) => k / 10);

  /* Levels 1–10 per operation.
     add/sub/mul: top & side pools, cell = side ⊕ top
     div:         divisor (top) & quotient pools, cell shows top×q, answer q
     mix:         ops per cell; ÷ cells work like div; noNeg avoids negative − */
  /* Levels 1–10 per operation. Every box reads: TOP (sign) LEFT.
     add/sub/mul: top & side pools
     div:         see below (always exact)
     mix:         sign per box; ÷ only where it divides exactly (divDec allows
                  answers with up to 2 decimals); noNeg keeps − answers ≥ 0 */
  const LV = {
    add: [null,
      { name: 'លេខ ១ ខ្ទង់', ex: '7 + 5', top: range(1, 9), side: range(1, 9) },
      { name: 'ដប់ជាង + ១ ខ្ទង់', ex: '14 + 8', top: range(10, 20), side: range(1, 9) },
      { name: '២ ខ្ទង់ + ១ ខ្ទង់', ex: '46 + 7', top: range(21, 99), side: range(1, 9) },
      { name: '២ ខ្ទង់ + ២ ខ្ទង់', ex: '47 + 38', top: range(11, 99), side: range(11, 99) },
      { name: '៣ ខ្ទង់ + ២ ខ្ទង់', ex: '356 + 47', top: range(100, 999), side: range(11, 99) },
      { name: 'ចំនួនអវិជ្ជមាន', ex: '(−3) + 7', top: nz(10), side: nz(10) },
      { name: 'អវិជ្ជមាន ២ ខ្ទង់', ex: '(−24) + 37', top: nz(50), side: nz(50) },
      { name: 'ទសភាគ ១ ខ្ទង់', ex: '2.5 + 0.4', top: tenths(11, 99), side: tenths(1, 9) },
      { name: 'ទសភាគ ២ ខ្ទង់', ex: '3.4 + 0.25', top: tenths(10, 99), side: hundredths(1, 99) },
      { name: 'ទសភាគអវិជ្ជមាន', ex: '(−2.5) + 1.7', top: nzTenths(99), side: nzTenths(99) }
    ],
    sub: [null,
      { name: 'ដកក្នុង ២០', ex: '12 − 5', top: range(9, 18), side: range(1, 9) },
      { name: '២ ខ្ទង់ − ១ ខ្ទង់', ex: '34 − 8', top: range(20, 50), side: range(1, 9) },
      { name: '២ ខ្ទង់ − ២ ខ្ទង់', ex: '73 − 28', top: range(50, 99), side: range(10, 49) },
      { name: '៣ ខ្ទង់ − ២ ខ្ទង់', ex: '352 − 47', top: range(100, 999), side: range(11, 99) },
      { name: 'លទ្ធផលអវិជ្ជមាន', ex: '4 − 12', top: range(1, 9), side: range(10, 20) },
      { name: 'ចំនួនអវិជ្ជមាន', ex: '(−3) − 5', top: nz(10), side: nz(10) },
      { name: 'អវិជ្ជមាន ២ ខ្ទង់', ex: '(−24) − (−37)', top: nz(50), side: nz(50) },
      { name: 'ទសភាគ ១ ខ្ទង់', ex: '5.2 − 0.7', top: tenths(10, 99), side: tenths(1, 9) },
      { name: 'ទសភាគ ២ ខ្ទង់', ex: '4.5 − 0.25', top: tenths(10, 99), side: hundredths(1, 99) },
      { name: 'ទសភាគអវិជ្ជមាន', ex: '(−2.5) − 1.7', top: nzTenths(99), side: nzTenths(99) }
    ],
    mul: [null,
      { name: 'តារាងគុណ ១–៥', ex: '4 × 7', top: range(1, 5), side: range(1, 9) },
      { name: 'តារាងគុណ ៦–៩', ex: '8 × 7', top: range(6, 9), side: range(1, 9) },
      { name: 'តារាងគុណ ២–១២', ex: '11 × 12', top: range(2, 12), side: range(2, 12) },
      { name: 'ដប់ជាង × ១ ខ្ទង់', ex: '15 × 6', top: range(11, 20), side: range(2, 9) },
      { name: '២ ខ្ទង់ × ១ ខ្ទង់', ex: '47 × 6', top: range(21, 99), side: range(2, 9) },
      { name: 'ចំនួនអវិជ្ជមាន', ex: '(−6) × 7', top: nz(10), side: nz(10) },
      { name: '២ ខ្ទង់ × ២ ខ្ទង់', ex: '17 × 23', top: range(11, 25), side: range(11, 25) },
      { name: 'ទសភាគ × ចំនួនគត់', ex: '0.4 × 7', top: tenths(1, 9), side: range(2, 9) },
      { name: 'ទសភាគ × ទសភាគ', ex: '0.3 × 0.6', top: tenths(1, 9), side: tenths(1, 9) },
      { name: 'ទសភាគអវិជ្ជមាន', ex: '(−0.4) × 7', top: nzTenths(9), side: nz(9) }
    ],
    // Division: top ÷ left, always exact. Left numbers (d) come from a small
    // set (they may repeat); top numbers are LCM(left) × k, so every box divides.
    div: [null,
      { name: 'ចែកនឹង ១ និង ២', ex: '16 ÷ 2', d: [1, 2], k: range(1, 10) },
      { name: 'ចែកនឹង ២ និង ៣', ex: '42 ÷ 3', d: [2, 3], k: range(1, 10) },
      { name: 'ចែកនឹង ២ និង ៤', ex: '36 ÷ 4', d: [2, 4], k: range(1, 10) },
      { name: 'ចែកនឹង ២ ៣ ៦', ex: '54 ÷ 6', d: [2, 3, 6], k: range(1, 12) },
      { name: 'ចែកនឹង ២ ៤ ៨', ex: '72 ÷ 8', d: [2, 4, 8], k: range(1, 12) },
      { name: 'ចែកនឹង ៣ ៦ ៩', ex: '126 ÷ 9', d: [3, 6, 9], k: range(1, 10) },
      { name: 'ចែកនឹង ២ ដល់ ១២', ex: '132 ÷ 12', d: [2, 3, 4, 6, 12], k: range(1, 12) },
      { name: 'ចែកនឹង ៥ និង ១០', ex: '170 ÷ 5', d: [5, 10], k: range(2, 20) },
      { name: 'ចែកនឹង ២ ដល់ ២០', ex: '240 ÷ 20', d: [2, 4, 5, 10, 20], k: range(1, 12) },
      { name: 'ចំនួនអវិជ្ជមាន', ex: '(−42) ÷ 6', d: [-6, -3, -2, 2, 3, 6], k: nz(10) }
    ],
    mix: [null,
      { name: 'បូក ដក ១ ខ្ទង់', ex: '7 + 5 · 9 − 4', ops: ['add', 'sub'], top: range(1, 9), side: range(1, 9), noNeg: true },
      { name: 'បូក ដក គុណ', ex: '6 × 4 · 9 − 2', ops: ['add', 'sub', 'mul'], top: range(1, 9), side: range(1, 9), noNeg: true },
      { name: '+ − × ÷ ១ ខ្ទង់', ex: '8 ÷ 2 · 7 × 3', ops: ['add', 'sub', 'mul', 'div'], top: range(1, 9), side: range(1, 9), noNeg: true },
      { name: '+ − × ÷ ដល់ ១២', ex: '96 ÷ 8 · 11 × 12', ops: ['add', 'sub', 'mul', 'div'], top: range(12, 99), side: range(2, 12), noNeg: true },
      { name: '២ ខ្ទង់ និង ១ ខ្ទង់', ex: '84 ÷ 7 · 47 − 6', ops: ['add', 'sub', 'mul', 'div'], top: range(11, 99), side: range(2, 9), noNeg: true },
      { name: 'ចំនួនអវិជ្ជមាន', ex: '(−6) × 7 · (−42) ÷ 6', ops: ['add', 'sub', 'mul', 'div'], top: nz(50), side: nz(9) },
      { name: '២ ខ្ទង់ និង ២ ខ្ទង់', ex: '78 ÷ 13 · 64 − 38', ops: ['add', 'sub', 'mul', 'div'], top: range(26, 99), side: range(11, 15), noNeg: true, divChance: 1 },
      { name: 'ទសភាគ និងចំនួនគត់', ex: '4.2 ÷ 6 · 2.5 × 4', ops: ['add', 'sub', 'mul', 'div'], top: tenths(10, 99), side: range(2, 9), noNeg: true, divDec: true },
      { name: 'ទសភាគ និងទសភាគ', ex: '2.4 ÷ 0.3 · 5.2 − 0.7', ops: ['add', 'sub', 'mul', 'div'], top: tenths(10, 99), side: tenths(1, 9), noNeg: true, divDec: true },
      { name: 'ទសភាគអវិជ្ជមាន', ex: '(−4.2) ÷ 6 · (−2.5) × 4', ops: ['add', 'sub', 'mul', 'div'], top: nzTenths(99), side: nz(9), divDec: true }
    ]
  };

  // Seconds allowed per box for a gold medal (base × level factor)
  const SEC_BASE = { add: 1.6, sub: 1.9, mul: 2.0, div: 2.4, mix: 2.3 };
  const SEC_LEVEL = [0, 1, 1.2, 1.5, 2, 2.4, 1.8, 2.4, 2.4, 3, 3.2];

  /* ---------- helpers ---------- */
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  /* n values from pool, all different when the pool is big enough */
  const pick = (pool, n) => { let out = []; while (out.length < n) out = out.concat(shuffle(pool)); return out.slice(0, n); };
  const rnd = (pool) => pool[Math.floor(Math.random() * pool.length)];
  const round4 = (v) => Math.round(v * 10000) / 10000;
  const fmt = (v) => {
    const s = String(round4(v));
    return s.startsWith('-') ? MINUS + s.slice(1) : s;
  };
  const fmtHead = (v) => (v < 0 ? `(${fmt(v)})` : fmt(v));
  const fmtEx = (s) => kh(s).replace(/-/g, MINUS);
  const calc = (op, t, s) => (op === 'add' ? t + s : op === 'sub' ? t - s : t * s); // top (op) left
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const lcm = (list) => list.reduce((acc, x) => { const v = Math.abs(x); return v ? (acc * v) / gcd(acc, v) : acc; }, 1);
  /* exact top ÷ left: whole number, or up to 2 decimals when allowed */
  const divides = (t, s, allowDec) => {
    if (s === 0) return false;
    const q = t / s;
    const scaled = allowDec ? q * 100 : q;
    return Math.abs(scaled - Math.round(scaled)) < 1e-6;
  };

  /* ---------- puzzle generator ---------- */
  function generate(op, level, boxes) {
    const { rows, cols } = BOXES[boxes] || BOXES[100];
    const spec = LV[op][level];

    if (op === 'div') {
      const side = pick(spec.d, rows);
      const L = lcm(side);
      const top = pick(spec.k, cols).map((k) => L * k);
      const cells = side.map((s) => top.map((t) => ({ op: 'div', ans: round4(t / s) })));
      return { top, side, cells, rows, cols, kind: 'div' };
    }

    const top = pick(spec.top, cols);
    const side = pick(spec.side, rows);

    if (op === 'mix') {
      const cells = side.map((s) => top.map((t) => {
        const canDiv = spec.ops.includes('div') && divides(t, s, spec.divDec);
        // when a box divides exactly, make it ÷ half of the time
        let o = canDiv && Math.random() < (spec.divChance || 0.5) ? 'div' : rnd(spec.ops.filter((x) => x !== 'div'));
        if (o === 'div') return { op: 'div', ans: round4(t / s) };
        if (o === 'sub' && spec.noNeg && t < s) o = 'add';
        return { op: o, ans: round4(calc(o, t, s)) };
      }));
      return { top, side, cells, rows, cols, kind: 'mix' };
    }

    const cells = side.map((s) => top.map((t) => ({ op, ans: round4(calc(op, t, s)) })));
    return { top, side, cells, rows, cols, kind: 'plain' };
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
  const bestKey = (op, level, boxes) => `${op}|${level}|b${boxes}`;
  const sizeLabel = (a) => (a.boxes ? `${kh(a.boxes)} ប្រអប់` : `${a.size}×${a.size}`);

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
  const MEDAL_RANK = { gold: 3, silver: 2, bronze: 1, none: 0 };

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
    op: 'add',
    level: 1,
    boxes: 20,
    prefs: {},          // per operation: { level, boxes }
    puzzle: null,
    answers: [],
    active: 0,
    startAt: 0,
    elapsed: 0,
    timer: null,
    running: false,
    finished: false,
    lastResult: null,
    cloudSave: null
  };
  const total = () => S.puzzle.rows * S.puzzle.cols;

  let root = null;
  const $ = (sel) => root.querySelector(sel);

  /* Student mode: a logged-in student sees only Box Calculation.
     It cannot be closed; the header shows the student and a logout button. */
  let student = null;
  let onLogout = null;

  function setStudentMode(profile, logoutFn) {
    const changed = (student && student.uid) !== (profile && profile.uid);
    student = profile || null;
    onLogout = logoutFn || null;
    if (changed) { S.cloudSum = null; S.sumState = ''; S.sumQueue = []; }
    if (student) {
      open();
      document.body.classList.add('bx-student-mode');
      if (!S.sumState) loadCloudSummary();
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

  function loadPrefs() {
    try {
      const p = JSON.parse(localStorage.getItem(STORE_KEY + '_pref2') || '{}');
      if (p && typeof p === 'object') S.prefs = p;
    } catch (e) {}
  }
  function savePrefs() {
    S.prefs[S.op] = { level: S.level, boxes: S.boxes };
    try { localStorage.setItem(STORE_KEY + '_pref2', JSON.stringify(S.prefs)); } catch (e) {}
  }

  function open() {
    ensureRoot();
    loadPrefs();
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

  const backIcon = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';

  function headerHtml(sub) {
    if (student) {
      return `
      <header class="bx-top">
        <img src="assets/mascot.jpg" alt="" class="bx-brand-img">
        <div class="bx-top-title"><b>🧮 ប្រអប់គណនា</b><small>👋 ${escapeAttr(student.name)} · ថ្នាក់ ${escapeAttr(student.className || '')}</small></div>
        <button class="bx-logout" data-act="logout" title="ចាកចេញពីគណនី">ចាកចេញ</button>
      </header>`;
    }
    return `
      <header class="bx-top">
        <button class="bx-icon-btn" data-act="close" title="ត្រឡប់ទៅទំព័រដើម">${backIcon}</button>
        <div class="bx-top-title"><b>🧮 ប្រអប់គណនា</b><small>${sub || 'ពង្រឹងល្បឿន និងភាពត្រឹមត្រូវ'}</small></div>
      </header>`;
  }
  function bindHeader() {
    const closeBtn = $('[data-act="close"]');
    if (closeBtn) closeBtn.addEventListener('click', close);
    const logoutBtn = $('[data-act="logout"]');
    if (logoutBtn) logoutBtn.addEventListener('click', () => {
      if (confirm('តើប្អូនចង់ចាកចេញពីគណនីមែនទេ?') && onLogout) onLogout();
    });
  }

  /* ---------- student's record across devices (Firebase summary) ---------- */
  const emptySum = () => ({ v: 1, count: 0, totalSec: 0, medals: { gold: 0, silver: 0, bronze: 0 }, best: {}, recent: [] });

  function addToSummary(sum, a) {
    const s = sum ? JSON.parse(JSON.stringify(sum)) : emptySum();
    s.count = (s.count || 0) + 1;
    s.totalSec = Math.round(((s.totalSec || 0) + (Number(a.sec) || 0)) * 10) / 10;
    s.medals = s.medals || { gold: 0, silver: 0, bronze: 0 };
    if (s.medals[a.medal] !== undefined) s.medals[a.medal] += 1;
    s.best = s.best || {};
    const key = bestKey(a.op, a.level, a.boxes);
    const prev = s.best[key];
    if (!prev || a.acc > prev.acc || (a.acc === prev.acc && a.sec < prev.sec)) {
      s.best[key] = { acc: a.acc, sec: a.sec, medal: prev && MEDAL_RANK[prev.medal] > MEDAL_RANK[a.medal] ? prev.medal : a.medal };
    } else if (MEDAL_RANK[a.medal] > MEDAL_RANK[prev.medal]) {
      prev.medal = a.medal;
    }
    s.recent = [{ op: a.op, level: a.level, boxes: a.boxes, acc: a.acc, sec: a.sec, medal: a.medal, date: a.date }]
      .concat(s.recent || []).slice(0, 8);
    return s;
  }

  function fromResult(r) {
    const ms = r.playedAt || r.createdAt || 0;
    const d = new Date(ms);
    const p2 = (n) => String(n).padStart(2, '0');
    return {
      op: r.op, level: r.level, boxes: r.boxes || (r.size ? r.size * r.size : 100),
      acc: r.acc, sec: Number(r.sec) || 0, medal: r.medal || 'none',
      date: ms ? `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}` : ''
    };
  }

  async function loadCloudSummary() {
    if (!(window.Cloud && Cloud.getMySummary)) return;
    S.sumState = 'loading';
    try {
      const r = await Cloud.getMySummary();
      if (!r) { S.sumState = 'offline'; return; }
      let sum = r.doc;
      if (!r.exists) {
        // first time: build it once from the results already saved
        const rs = (await Cloud.myResults(300)).filter((x) => x.type === 'boxcalc').reverse();
        sum = rs.reduce((acc, x) => addToSummary(acc, fromResult(x)), emptySum());
      }
      (S.sumQueue || []).forEach((a) => { sum = addToSummary(sum, a); });
      const needSave = !r.exists || (S.sumQueue || []).length;
      S.sumQueue = [];
      S.cloudSum = sum;
      S.sumState = 'ready';
      if (needSave) Cloud.saveMySummary(sum).catch(() => {});
    } catch (e) {
      console.warn('summary', e);
      S.sumState = 'offline';
    }
    if (S.view === 'lobby' && !S.running) renderLobby();
    else if (S.view === 'setup' && !S.running) renderSetup(S.op);
  }

  /* Records to show: the account summary for a student (all devices),
     this device's records otherwise. */
  function recordView() {
    const store = loadStore();
    if (student) {
      if (S.cloudSum) {
        const c = S.cloudSum;
        return { totalSec: c.totalSec || 0, count: c.count || 0, counts: c.medals || {}, recent: c.recent || [], best: c.best || {}, source: 'cloud' };
      }
      // not loaded yet: only this student's games on this (maybe shared) device
      const mine = store.attempts.filter((a) => a.uid === student.uid);
      const counts = { gold: 0, silver: 0, bronze: 0 };
      const best = {};
      mine.forEach((a) => {
        if (counts[a.medal] !== undefined) counts[a.medal]++;
        const k = bestKey(a.op, a.level, a.boxes);
        if (!best[k] || a.acc > best[k].acc || (a.acc === best[k].acc && a.sec < best[k].sec)) best[k] = { acc: a.acc, sec: a.sec, medal: a.medal };
      });
      return { totalSec: mine.reduce((t, a) => t + (a.sec || 0), 0), count: mine.length, counts, recent: mine.slice(0, 8), best, source: S.sumState === 'loading' ? 'loading' : 'local' };
    }
    const counts = { gold: 0, silver: 0, bronze: 0 };
    store.attempts.forEach((a) => { if (counts[a.medal] !== undefined) counts[a.medal]++; });
    return { totalSec: store.totalSec || 0, count: store.attempts.length, counts, recent: store.attempts.slice(0, 6), best: store.best, source: 'device' };
  }

  /* ---------- lobby: choose an operation ---------- */
  function bestLevel(store, op) {
    // highest level with a gold medal (any box count)
    let lvl = 0;
    Object.keys(store.best).forEach((k) => {
      const [o, l] = k.split('|');
      if (o === op && store.best[k].medal === 'gold') lvl = Math.max(lvl, Number(l));
    });
    return lvl;
  }

  function renderLobby() {
    stopTimer();
    S.running = false;
    S.finished = false;
    S.view = 'lobby';
    const store = recordView();
    const counts = store.counts;

    const opTiles = Object.keys(OPS).map((k) => {
      const gl = bestLevel(store, k);
      const tag = gl ? `🥇 ដល់កម្រិត ${kh(gl)}` : 'កម្រិត ១–១០';
      return `
        <button class="bx-op ${OPS[k].color} ${k === 'mix' ? 'is-mix' : ''}" data-op="${k}">
          <span class="bx-op-sym">${k === 'mix' ? '<i>+</i><i>−</i><i>×</i><i>÷</i>' : OPS[k].sym}</span>
          <span class="bx-op-name">${OPS[k].name}</span>
          <span class="bx-op-best">${tag}</span>
        </button>`;
    }).join('');

    const pending = (window.Cloud && Cloud.isStudent() && Cloud.pendingCount) ? Cloud.pendingCount() : 0;
    const pendingNote = pending
      ? `<p class="bx-pending">⏳ មានលទ្ធផល ${kh(pending)} កំពុងរង់ចាំផ្ញើទៅលោកគ្រូ — នឹងផ្ញើដោយស្វ័យប្រវត្តិពេលមានអ៊ីនធឺណិត</p>`
      : '';
    const recent = store.recent.slice(0, 6).map((a) => {
      const o = OPS[a.op] || OPS.add;
      return `
      <li>
        <span class="bx-rec-op ${o.color}">${o.sym}</span>
        <span class="bx-rec-main">${o.name} · កម្រិត ${kh(a.level)} · ${sizeLabel(a)}<small>${a.date}</small></span>
        <span class="bx-rec-score">${a.acc}%<small>${a.sec.toFixed(1)}s</small></span>
        <span class="bx-rec-medal">${MEDAL[a.medal].ico}</span>
      </li>`;
    }).join('');

    root.innerHTML = headerHtml() + `
      <main class="bx-lobby">
        <section class="bx-intro">
          <div class="bx-intro-grid" aria-hidden="true">
            <span>+</span><span>៣</span><span>៧</span>
            <span>៥</span><span class="on">៨</span><span>១២</span>
            <span>៩</span><span>១២</span><span class="cur"></span>
          </div>
          <p>យកលេខ <b>ខាងលើ</b> គណនាជាមួយលេខ <b>ខាងឆ្វេង</b> ហើយដាក់ចម្លើយក្នុងប្រអប់ ពីឆ្វេងទៅស្តាំ ពីលើចុះក្រោម។ ព្យាយាមឲ្យ <b>ត្រូវទាំងអស់</b> និង <b>លឿនបំផុត</b>!</p>
        </section>

        <h3 class="bx-h">ជ្រើសប្រមាណវិធី</h3>
        <div class="bx-ops">${opTiles}</div>

        <section class="bx-record">
          <h3 class="bx-h">📒 កំណត់ត្រាសិក្សារបស់ខ្ញុំ</h3>
          <div class="bx-record-stats">
            <div><b>${kh(Math.round(store.totalSec / 60))}</b><span>នាទីហ្វឹកហាត់</span></div>
            <div><b>${kh(store.count)}</b><span>ដងបានលេង</span></div>
            <div class="bx-medals"><span>🥇 ${kh(counts.gold)}</span><span>🥈 ${kh(counts.silver)}</span><span>🥉 ${kh(counts.bronze)}</span></div>
          </div>
          ${pendingNote}
          ${recent ? `<ul class="bx-recent">${recent}</ul>` : '<p class="bx-empty">មិនទាន់មានកំណត់ត្រា។ តោះចាប់ផ្តើមប្រអប់ដំបូង! 🚀</p>'}
          <p class="bx-medal-rule">🥇 ត្រូវ ១០០% ក្នុងពេលកំណត់ · 🥈 ត្រូវ ៩០% ឡើង · 🥉 ត្រូវ ៧០% ឡើង</p>
          ${store.source === 'cloud' ? '<p class="bx-rec-src">☁️ កំណត់ត្រាពីគណនីរបស់ប្អូន (គ្រប់ឧបករណ៍)</p>' : store.source === 'loading' ? '<p class="bx-rec-src">☁️ កំពុងទាញកំណត់ត្រាពីគណនី...</p>' : ''}
          <p class="bx-version">កំណែ ${(window.App && App.formatVersion && App.getRunningBuild) ? App.formatVersion(App.getRunningBuild()) : ''}</p>
        </section>
      </main>`;

    bindHeader();
    root.querySelectorAll('[data-op]').forEach((b) => b.addEventListener('click', () => renderSetup(b.dataset.op)));
    root.scrollTop = 0;
  }

  /* ---------- setup: boxes + level ---------- */
  function renderSetup(op) {
    stopTimer();
    S.running = false;
    S.finished = false;
    S.op = op;
    const pref = S.prefs[op] || {};
    S.level = pref.level || S.level || 1;
    S.boxes = BOXES[pref.boxes] ? pref.boxes : (BOXES[S.boxes] ? S.boxes : 20);
    S.view = 'setup';
    const store = recordView();
    const o = OPS[op];

    const boxChips = BOX_LIST.map((b) => `
      <button class="bx-box ${S.boxes === b ? 'active' : ''}" data-boxes="${b}">
        <b>${kh(b)}</b><small>ប្រអប់ · ${BOXES[b].rows}×${BOXES[b].cols}</small>
      </button>`).join('');

    const levelCards = LV[op].slice(1).map((l, i) => {
      const n = i + 1;
      const b = store.best[bestKey(op, n, S.boxes)];
      const badge = b ? `<span class="bx-lv-best">${MEDAL[b.medal].ico} ${b.acc}%</span>` : '';
      return `
        <button class="bx-lv ${S.level === n ? 'active' : ''}" data-level="${n}">
          <span class="bx-lv-num">${kh(n)}</span>
          <span class="bx-lv-txt"><b>${l.name}</b><small>${fmtEx(l.ex)}</small></span>
          ${badge}
        </button>`;
    }).join('');

    root.innerHTML = `
      <header class="bx-top">
        <button class="bx-icon-btn" data-act="lobby" title="ត្រឡប់">${backIcon}</button>
        <div class="bx-top-title"><b><span class="bx-op-chip ${o.color}">${o.sym}</span> ${o.long || o.name}</b><small>ជ្រើសចំនួនប្រអប់ និងកម្រិត</small></div>
      </header>
      <main class="bx-lobby bx-setup">
        <h3 class="bx-h">១. ចំនួនប្រអប់</h3>
        <div class="bx-boxes">${boxChips}</div>

        <h3 class="bx-h">២. កម្រិត</h3>
        <div class="bx-lvs">${levelCards}</div>

        <div class="bx-start-bar">
          <div class="bx-start-sum"><b>${o.name} · កម្រិត ${kh(S.level)}</b><small>${LV[op][S.level].name} · ${kh(S.boxes)} ប្រអប់</small></div>
          <button class="bx-start ${o.color}" data-act="start">ចាប់ផ្តើម ▶</button>
        </div>
      </main>`;

    $('[data-act="lobby"]').addEventListener('click', renderLobby);
    root.querySelectorAll('[data-boxes]').forEach((b) => b.addEventListener('click', () => {
      S.boxes = Number(b.dataset.boxes); savePrefs(); renderSetup(op);
    }));
    root.querySelectorAll('[data-level]').forEach((b) => b.addEventListener('click', () => {
      S.level = Number(b.dataset.level); savePrefs(); renderSetup(op);
    }));
    $('[data-act="start"]').addEventListener('click', () => { savePrefs(); start(); });
    const active = $('.bx-lv.active');
    if (active && active.scrollIntoView && S.level > 4) active.scrollIntoView({ block: 'center' });
    else root.scrollTop = 0;
  }

  /* ---------- play ---------- */
  function start() {
    S.puzzle = generate(S.op, S.level, S.boxes);
    S.answers = new Array(total()).fill('');
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
    const P = S.puzzle;
    const o = OPS[S.op];
    const lvl = LV[S.op][S.level];

    let grid = `<div class="bx-grid bx-${P.kind}" style="--cols:${P.cols};--rows:${P.rows}">`;
    grid += `<div class="bx-corner ${o.color}">${o.sym}</div>`;
    P.top.forEach((t) => { grid += `<div class="bx-head bx-head-top">${fmtHead(t)}</div>`; });
    for (let r = 0; r < P.rows; r++) {
      grid += `<div class="bx-head bx-head-side">${fmtHead(P.side[r])}</div>`;
      for (let c = 0; c < P.cols; c++) {
        const i = r * P.cols + c;
        const cell = P.cells[r][c];
        const given = cell.given !== undefined ? `<i class="bx-given">${fmt(cell.given)}</i>` : '';
        const badge = P.kind === 'mix' ? `<i class="bx-cell-op op-${cell.op}">${CELL_OP_SYM[cell.op]}</i>` : '';
        grid += `<button class="bx-cell ${cell.given !== undefined ? 'has-given' : ''}" data-i="${i}">${badge}${given}<span class="bx-val"></span></button>`;
      }
    }
    grid += '</div>';

    const instr = P.kind === 'div'
      ? 'យកលេខ <b>ខាងលើ</b> ÷ លេខ <b>ខាងឆ្វេង</b> ហើយដាក់ចម្លើយក្នុងប្រអប់'
      : P.kind === 'mix'
        ? 'យកលេខ <b>ខាងលើ</b> (សញ្ញាក្នុងប្រអប់) លេខ <b>ខាងឆ្វេង</b> ហើយដាក់ចម្លើយក្នុងប្រអប់'
        : `យកលេខ <b>ខាងលើ</b> ${o.sym} លេខ <b>ខាងឆ្វេង</b> ហើយដាក់ចម្លើយក្នុងប្រអប់`;

    root.innerHTML = `
      <header class="bx-top">
        <button class="bx-icon-btn" data-act="back" title="ត្រឡប់">${backIcon}</button>
        <div class="bx-top-title"><b><span class="bx-op-chip ${o.color}">${o.sym}</span> ${o.name} · កម្រិត ${kh(S.level)}</b><small>${lvl.name} · ${kh(total())} ប្រអប់</small></div>
        <div class="bx-clock-wrap"><span class="bx-clock">0.0</span><small>វិនាទី</small></div>
      </header>

      <div class="bx-play">
        <div class="bx-board">
          <div class="bx-progress"><span class="bx-progress-fill"></span><b class="bx-progress-txt">0 / ${total()}</b></div>
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
    $('[data-act="finish"]').addEventListener('click', () => finish());
    $('[data-act="back"]').addEventListener('click', () => {
      if (S.running && !confirm('កំពុងគណនា! តើចង់ឈប់ ហើយត្រឡប់ក្រោយមែនទេ?')) return;
      renderSetup(S.op);
    });
    setActive(0);
    root.scrollTop = 0;
  }

  function setActive(i) {
    if (i < 0 || i >= total()) return;
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
    else if (/^[0-9]$/.test(k)) { if (v.replace(/[-.]/g, '').length < 7) v += k; }
    S.answers[i] = v;
    paintCell(i);
    updateProgress();
  }

  function advance() {
    const n = total();
    // Jump to the next empty box (left→right, top→down, wrapping)
    for (let step = 1; step < n; step++) {
      const j = (S.active + step) % n;
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
    const n = total();
    const filled = S.answers.filter((v) => v !== '' && v !== '-').length;
    const fill = $('.bx-progress-fill');
    const txt = $('.bx-progress-txt');
    if (fill) fill.style.width = `${(filled / n) * 100}%`;
    if (txt) txt.textContent = `${filled} / ${n}`;
    if (filled === n) {
      const fin = $('.bx-finish');
      if (fin) fin.classList.add('ready');
    }
  }

  const parse = (v) => {
    if (v === '' || v === '-' || v === '.') return NaN;
    return Number(v);
  };

  function finish() {
    if (!S.running || S.finished) return;
    const P = S.puzzle;
    const n = total();
    const filled = S.answers.filter((v) => v !== '' && v !== '-').length;
    if (filled < n && !confirm(`នៅសល់ ${n - filled} ប្រអប់ទទេ។ តើចង់បញ្ចប់ឥឡូវនេះមែនទេ?`)) return;

    tick();
    stopTimer();
    S.running = false;
    S.finished = true;

    let correct = 0;
    for (let i = 0; i < n; i++) {
      const r = Math.floor(i / P.cols), c = i % P.cols;
      const ans = P.cells[r][c].ans;
      const got = parse(S.answers[i]);
      const ok = !isNaN(got) && Math.abs(got - ans) < 1e-6;
      if (ok) correct++;
      const el = root.querySelector(`.bx-cell[data-i="${i}"]`);
      el.classList.remove('active');
      el.classList.add(ok ? 'ok' : 'bad');
      if (!ok) el.insertAdjacentHTML('beforeend', `<em class="bx-fix">${fmt(ans)}</em>`);
    }

    const sec = Math.round(S.elapsed * 10) / 10;
    const acc = Math.round((correct / n) * 100);
    const target = SEC_BASE[S.op] * SEC_LEVEL[S.level] * n;
    const medal = medalFor(acc, sec, target);

    const now = new Date();
    const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const attempt = { op: S.op, level: S.level, boxes: S.boxes, rows: P.rows, cols: P.cols, correct, total: n, acc, sec, medal, date };
    if (student) attempt.uid = student.uid;

    const store = loadStore();
    store.attempts.unshift(attempt);
    if (store.attempts.length > 200) store.attempts.length = 200;
    store.totalSec = (store.totalSec || 0) + sec;
    const key = bestKey(S.op, S.level, S.boxes);
    const prevBest = store.best[key];
    const isBest = !prevBest || acc > prevBest.acc || (acc === prevBest.acc && sec < prevBest.sec);
    if (isBest) store.best[key] = { acc, sec, medal: MEDAL_RANK[medal] >= MEDAL_RANK[(prevBest && prevBest.medal) || 'none'] ? medal : prevBest.medal };
    saveStore(store);

    S.lastResult = Object.assign({ isBest, target }, attempt);
    S.cloudSave = null;
    if (student && window.Cloud && Cloud.saveMySummary) {
      if (S.sumState === 'ready') {
        S.cloudSum = addToSummary(S.cloudSum, attempt);
        Cloud.saveMySummary(S.cloudSum).catch(() => {});
      } else {
        // summary not loaded yet: add it once loaded (never overwrite the account)
        S.sumQueue = (S.sumQueue || []).concat([attempt]);
        if (S.sumState !== 'loading') loadCloudSummary();
      }
    }
    if (window.Cloud && Cloud.isStudent()) {
      S.cloudSave = Cloud.saveResult('boxcalc', {
        op: attempt.op, level: attempt.level, boxes: attempt.boxes,
        rows: attempt.rows, cols: attempt.cols,
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
    const o = OPS[R.op];
    const canNext = R.acc >= 90 && R.level < 10;

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
      <p class="bx-saved">💾 លទ្ធផលបានរក្សាទុកក្នុងឧបករណ៍នេះរួចហើយ។</p>`;

    $('.bx-result-layer').innerHTML = `
      <div class="bx-result medal-${R.medal}">
        <button class="bx-result-min" data-act="peek" title="មើលប្រអប់">មើលចម្លើយ ▾</button>
        <div class="bx-result-medal">${m.ico}</div>
        <h3>${m.name}</h3>
        <p class="bx-result-sub">${o.name} · កម្រិត ${kh(R.level)} · ${kh(R.total)} ប្រអប់</p>
        ${R.isBest ? '<span class="bx-best-tag">🏆 កំណត់ត្រាថ្មី!</span>' : ''}
        <div class="bx-result-stats">
          <div><b>${R.acc}%</b><span>ត្រឹមត្រូវ</span></div>
          <div><b>${R.sec.toFixed(1)}s</b><span>${fmtTime(R.sec)}</span></div>
          <div><b>${R.correct}/${R.total}</b><span>ប្រអប់ត្រូវ</span></div>
        </div>
        <p class="bx-target">⏱️ ពេលកំណត់សម្រាប់មេដាយមាស៖ ${fmtTime(R.target)}</p>
        ${sendBlock}
        <div class="bx-result-actions ${canNext ? 'three' : ''}">
          <button class="bx-btn bx-btn-ghost" data-act="setup">← ជ្រើសកម្រិត</button>
          <button class="bx-btn ${canNext ? 'bx-btn-ghost' : o.color}" data-act="again">🔁 ម្តងទៀត</button>
          ${canNext ? `<button class="bx-btn ${o.color}" data-act="next">កម្រិត ${kh(R.level + 1)} →</button>` : ''}
        </div>
      </div>`;

    const layer = $('.bx-result-layer');
    layer.classList.add('show');
    layer.querySelector('[data-act="setup"]').addEventListener('click', () => renderSetup(S.op));
    layer.querySelector('[data-act="again"]').addEventListener('click', start);
    const nextBtn = layer.querySelector('[data-act="next"]');
    if (nextBtn) nextBtn.addEventListener('click', () => { S.level += 1; savePrefs(); start(); });
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

    const o = OPS[R.op];
    const payload = {
      timestamp: R.date,
      studentName: name,
      studentClass: classRoom,
      rollNumber: rollNo || '-',
      grade: info.grade || '7',
      lessonTitle: `🧮 ប្រអប់គណនា (${o.sym} ${o.name}) · កម្រិត ${R.level} ${LV[R.op][R.level].name} · ${R.total} ប្រអប់`,
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
    const cols = S.puzzle.cols;
    const n = total();
    const k = e.key;
    if (/^[0-9]$/.test(k)) press(k);
    else if (k === '.' || k === ',') press('.');
    else if (k === '-' || k === '−') press('-');
    else if (k === 'Backspace') press('back');
    else if (k === 'Enter' || k === 'Tab') advance();
    else if (k === 'ArrowRight') setActive(Math.min(S.active + 1, n - 1));
    else if (k === 'ArrowLeft') setActive(Math.max(S.active - 1, 0));
    else if (k === 'ArrowDown') setActive(Math.min(S.active + cols, n - 1));
    else if (k === 'ArrowUp') setActive(Math.max(S.active - cols, 0));
    else return;
    e.preventDefault();
  }

  window.BoxCalc = { open, close, setStudentMode, _generate: generate, _levels: LV };
})();
