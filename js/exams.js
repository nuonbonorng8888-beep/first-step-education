/* ==========================================================================
   Exams — MCQ tests for a class, linked to the activity-score sheet.
   - Teacher/admin (Scores sheet → "🎯 ប្រឡង MCQ"): create a timed exam from the
     question bank, see the live results with cheating flags, and copy the
     scores into the linked activity column (automatic once the exam ended).
   - Student (button "🎯 តេស្ត MCQ"): sees only their own class's exams, a
     countdown until the start, then takes the test once; the score lands in
     the linked column.
   Honest limits: browsers cannot see a second device. We record leaving the
   page, timing and answers, shuffle per student, and let the teacher judge.
   ========================================================================== */
(function () {
  'use strict';

  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const r2 = (v) => Math.round(v * 100) / 100;
  const api = () => Cloud.scoresApi();
  const toast = (m, t) => { if (window.App && App.showToast) App.showToast(m, t || 'info'); else alert(m); };
  const pad = (n) => String(n).padStart(2, '0');
  const fmtTime = (ms) => { const d = new Date(ms); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
  const mmss = (sec) => { sec = Math.max(0, Math.round(sec)); const h = Math.floor(sec / 3600); const m = Math.floor((sec % 3600) / 60); const s = sec % 60; return (h ? h + ':' : '') + pad(m) + ':' + pad(s); };
  const msOf = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : (typeof v === 'number' ? v : 0));

  /* ----- small deterministic helpers ----- */
  function h53(str, seed) {
    let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
    for (let i = 0; i < str.length; i++) {
      const ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
  }
  const keyHash = (eid, qid, idx) => h53(`${eid}|${qid}|${idx}`).toString(36);
  function rngFrom(seedStr) {
    let a = h53(seedStr) >>> 0;
    return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function shuffled(arr, rng) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  /* server clock (the page's own host) so the countdown cannot be cheated by changing the phone time */
  let skew = 0;
  async function syncClock() {
    try {
      const t0 = Date.now();
      const r = await fetch('version.json?t=' + t0, { cache: 'no-store' });
      const d = r.headers.get('Date');
      if (d) skew = new Date(d).getTime() - (t0 + Date.now()) / 2;
    } catch (e) {}
  }
  const now = () => Date.now() + skew;

  function renderMath(el) {
    try { if (window.App && App.renderMath) App.renderMath(el); else if (typeof renderMathInElement === 'function') renderMathInElement(el, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], strict: 'ignore', throwOnError: false }); } catch (e) {}
  }
  const html = (s) => esc(s).replace(/\n/g, '<br>');

  function modalIn(root, htmlStr, wide) {
    const m = document.createElement('div');
    m.className = 'acc-modal';
    m.innerHTML = `<div class="acc-modal-card ${wide ? 'acc-modal-wide' : ''}">${htmlStr}</div>`;
    root.appendChild(m);
    m.addEventListener('click', (e) => { if (e.target === m && !m.dataset.busy) m.remove(); });
    return m;
  }

  /* ----- question bank (teacher side only; students get a snapshot inside the exam) ----- */
  let bank = null;
  async function loadBank() {
    if (bank) return bank;
    const r = await fetch('data/question_bank.json');
    if (!r.ok) throw new Error('ផ្ទុកធនាគារសំណួរមិនបាន');
    const d = await r.json();
    bank = d.questions.filter((q) => q.kind === 'mcq' && Array.isArray(q.o) && q.o.length === 4 && Number.isInteger(q.a)
      && !/<(img|svg|div|table|canvas)/.test(q.q + q.o.join('')) && !q.o.every((o) => String(o).length <= 2));
    return bank;
  }
  const gradePrefix = (cls) => 'les-g' + (parseInt(cls.grade, 10) || 7);
  const LEVELS = ['ងាយ', 'មធ្យម', 'ពិបាក'];

  function pickQuestions(pool, lessonIds, n, level) {
    const rng = Math.random;
    let p = pool.filter((q) => lessonIds.includes(q.lesId));
    if (level !== 'all') p = p.filter((q) => q.level === level);
    const seen = new Set();
    p = p.filter((q) => { const k = q.q.trim(); if (seen.has(k)) return false; seen.add(k); return true; });
    const by = {};
    p.forEach((q) => { (by[q.lesId] = by[q.lesId] || []).push(q); });
    Object.keys(by).forEach((k) => { by[k] = shuffled(by[k], rng); });
    const out = [];
    const keys = Object.keys(by);
    let i = 0;
    while (out.length < n && keys.some((k) => by[k].length)) {
      const k = keys[i % keys.length];
      if (by[k].length) out.push(by[k].shift());
      i++;
    }
    return shuffled(out, rng);
  }

  /* ======================================================================
     TEACHER
     ====================================================================== */
  function examState(ex) {
    const t = now();
    const s = msOf(ex.startAt), e = msOf(ex.endAt);
    return t < s ? 'upcoming' : (t <= e ? 'open' : 'ended');
  }
  const STATE_TXT = { upcoming: '⏳ មិនទាន់ចាប់ផ្តើម', open: '🟢 កំពុងប្រឡង', ended: '✔️ ចប់ហើយ' };

  async function openManager(ctx) {
    await syncClock();
    const root = ctx.root();
    const m = modalIn(root, '<div class="acc-center small"><div class="acc-spin"></div></div>', true);
    m.dataset.busy = '1';
    async function paintList() {
      let list = [];
      try { list = await api().listExams(ctx.cls.id); } catch (e) { m.querySelector('.acc-modal-card').innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p><div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បិទ</button></div>`; m.querySelector('[data-x]').addEventListener('click', () => m.remove()); delete m.dataset.busy; return; }
      delete m.dataset.busy;
      const colName = (ex) => { const c = ctx.allCols().find((x) => x.id === ex.colId); return c ? (c.label || 'សកម្មភាព') : '—'; };
      m.querySelector('.acc-modal-card').innerHTML = `
        <h3>🎯 ប្រឡង MCQ · ថ្នាក់ ${esc(ctx.cls.name)}</h3>
        <div class="sc-bar">
          <button class="acc-btn sm" data-a="new">➕ បង្កើតការប្រឡងថ្មី</button>
          <button class="acc-btn ghost sm" data-a="sheets" title="តេស្តតាមតំណសម្រាប់មនុស្សទូទៅ ពិន្ទុចូល Google Sheets">🔗 តេស្តតាមតំណ (Google Sheets)</button>
        </div>
        ${list.length ? `<div class="acc-table-wrap"><table class="acc-table"><thead><tr><th>ការប្រឡង</th><th>ម៉ោង</th><th>ជួរពិន្ទុ</th><th>ស្ថានភាព</th><th></th></tr></thead><tbody>
          ${list.map((ex) => `<tr><td class="nm">${esc(ex.title)}<small>${ex.total} សំណួរ</small></td><td>${fmtTime(msOf(ex.startAt))}<small>${ex.durationMin} នាទី</small></td><td>${esc(colName(ex))}${ex.synced ? ' <small>✅ ផ្ទេរហើយ</small>' : ''}</td><td>${STATE_TXT[examState(ex)]}</td>
            <td class="sc-ex-act"><button class="acc-btn ghost sm" data-res="${esc(ex.id)}">📊 លទ្ធផល</button><button class="acc-btn ghost sm" data-del="${esc(ex.id)}">🗑️</button></td></tr>`).join('')}
          </tbody></table></div>` : '<p class="acc-muted">មិនទាន់មានការប្រឡងទេ។ ចុច «➕ បង្កើតការប្រឡងថ្មី»។</p>'}
        <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បិទ</button></div>`;
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      m.querySelector('[data-a="new"]').addEventListener('click', () => createDialog(ctx, root, paintList));
      m.querySelector('[data-a="sheets"]').addEventListener('click', () => {
        m.remove();
        if (window.Accounts && Accounts.closeDashboard) Accounts.closeDashboard();
        if (window.App && App.openTeacherSheetModal) App.openTeacherSheetModal();
      });
      m.querySelectorAll('[data-res]').forEach((b) => b.addEventListener('click', () => showResults(ctx, root, list.find((x) => x.id === b.dataset.res), paintList)));
      m.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
        const ex = list.find((x) => x.id === b.dataset.del);
        if (!confirm(`លុបការប្រឡង «${ex.title}» ព្រមទាំងលទ្ធផលសិស្ស? (ពិន្ទុដែលបានផ្ទេរចូលជួរនៅដដែល)`)) return;
        b.disabled = true;
        try { await api().deleteExam(ctx.cls.id, ex.id); paintList(); } catch (e) { toast(e.message, 'error'); b.disabled = false; }
      }));
    }
    paintList();
  }

  async function createDialog(ctx, root, done) {
    let pool;
    try { pool = await loadBank(); } catch (e) { toast(e.message, 'error'); return; }
    const pre = gradePrefix(ctx.cls);
    const lessons = [];
    const seen = new Map();
    pool.filter((q) => q.lesId.startsWith(pre)).forEach((q) => {
      const s = seen.get(q.lesId) || { id: q.lesId, label: q.l, n: 0 };
      s.n++; seen.set(q.lesId, s);
    });
    seen.forEach((v) => lessons.push(v));
    const lessonKey = (id) => { const p = id.split('-'); return { book: p[1] || '', nums: p.slice(2).map((x) => parseInt(x, 10) || 0) }; };
    lessons.sort((a, b) => {
      const x = lessonKey(a.id), y = lessonKey(b.id);
      if (x.book !== y.book) return x.book.localeCompare(y.book, 'en', { numeric: true });
      for (let i = 0; i < Math.max(x.nums.length, y.nums.length); i++) { const d = (x.nums[i] || 0) - (y.nums[i] || 0); if (d) return d; }
      return 0;
    });
    const books = new Set(lessons.map((l) => lessonKey(l.id).book));
    const bookTag = (id) => { const b = lessonKey(id).book; return books.size > 1 ? `<em>${esc(b.replace(/^g/, '').toUpperCase())}</em>` : ''; };
    const nowD = new Date(now() + 10 * 60000);
    nowD.setSeconds(0, 0);
    const local = `${nowD.getFullYear()}-${pad(nowD.getMonth() + 1)}-${pad(nowD.getDate())}T${pad(nowD.getHours())}:${pad(nowD.getMinutes())}`;
    const cols = ctx.cols();
    const m = modalIn(root, `
      <h3>➕ បង្កើតការប្រឡង MCQ</h3>
      <label class="acc-field"><span>ឈ្មោះការប្រឡង</span><input id="ex-t" maxlength="60" placeholder="ឧ. តេស្តខ្លី មេរៀនទី ១"></label>
      <div class="acc-field"><span>ជ្រើសមេរៀន (${lessons.length ? 'សំណួរត្រូវបានបែងចែកស្មើគ្នា' : 'គ្មានសំណួរសម្រាប់ថ្នាក់នេះ'})</span>
        <div class="ex-lessons">${lessons.map((l) => `<label class="ex-les"><input type="checkbox" value="${esc(l.id)}"><span>${bookTag(l.id)}${esc(l.label)}</span><small>${l.n}</small></label>`).join('')}</div></div>
      <div class="acc-row2">
        <label class="acc-field"><span>ចំនួនសំណួរ</span><input id="ex-n" type="number" min="3" max="40" value="10"></label>
        <label class="acc-field"><span>កម្រិត</span><select id="ex-lv"><option value="all">ចម្រុះ</option>${LEVELS.map((l) => `<option>${l}</option>`).join('')}</select></label>
      </div>
      <div class="acc-row2">
        <label class="acc-field"><span>ចាប់ផ្តើមម៉ោង</span><input id="ex-s" type="datetime-local" value="${local}"></label>
        <label class="acc-field"><span>រយៈពេល (នាទី)</span><input id="ex-d" type="number" min="3" max="180" value="15"></label>
      </div>
      <div class="acc-row2">
        <label class="acc-field"><span>ពេលក្នុង ១ សំណួរ (វិនាទី)</span><select id="ex-q"><option value="0">មិនកំណត់</option><option value="30">៣០</option><option value="45">៤៥</option><option value="60" selected>៦០</option><option value="90">៩០</option><option value="120">១២០</option></select></label>
        <label class="acc-field"><span>បញ្ជូនស្វ័យប្រវត្តិពេលចាកចេញ (ដង)</span><select id="ex-l"><option value="0">បិទ</option><option value="2">២</option><option value="3" selected>៣</option><option value="5">៥</option></select></label>
      </div>
      <div class="acc-row2">
        <label class="acc-field"><span>ភ្ជាប់ទៅជួរសកម្មភាព</span><select id="ex-c"><option value="">➕ បង្កើតជួរថ្មី</option>${cols.map((c, i) => `<option value="${esc(c.id)}">${esc(c.label || ('សកម្មភាព ' + (i + 1)))} (/${c.max})</option>`).join('')}</select></label>
        <label class="acc-field"><span>ពិន្ទុអតិបរមាក្នុងជួរថ្មី</span><input id="ex-m" type="number" min="1" step="0.5" value="5"></label>
      </div>
      <p class="acc-muted">ពិន្ទុប្រឡងត្រូវបំលែងតាមសមាមាត្រទៅជួរ (ឧ. ត្រូវ ៨/១០ ក្នុងជួរអតិបរមា ៥ = ៤)។ សិស្សធ្វើបានតែ ១ ដង។ សំណួរនិងចម្លើយត្រូវបានរៀបខុសគ្នាសម្រាប់សិស្សម្នាក់ៗ។</p>
      <p class="acc-err"></p>
      <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>បង្កើតការប្រឡង</button></div>`, true);
    const err = m.querySelector('.acc-err');
    m.querySelector('[data-x]').addEventListener('click', () => m.remove());
    m.querySelector('[data-ok]').addEventListener('click', async () => {
      const title = m.querySelector('#ex-t').value.trim();
      const ids = [...m.querySelectorAll('.ex-lessons input:checked')].map((x) => x.value);
      const n = Math.round(Number(m.querySelector('#ex-n').value));
      const lv = m.querySelector('#ex-lv').value;
      const startMs = new Date(m.querySelector('#ex-s').value).getTime();
      const dur = Math.round(Number(m.querySelector('#ex-d').value));
      const perQ = Number(m.querySelector('#ex-q').value);
      const maxLeaves = Number(m.querySelector('#ex-l').value);
      let colId = m.querySelector('#ex-c').value;
      const colMax = Number(m.querySelector('#ex-m').value);
      if (!title) { err.textContent = 'សូមវាយឈ្មោះការប្រឡង'; return; }
      if (!ids.length) { err.textContent = 'សូមជ្រើសមេរៀនយ៉ាងតិច ១'; return; }
      if (!(n >= 3 && n <= 40)) { err.textContent = 'ចំនួនសំណួរត្រូវនៅចន្លោះ ៣–៤០'; return; }
      if (!isFinite(startMs)) { err.textContent = 'សូមជ្រើសម៉ោងចាប់ផ្តើម'; return; }
      if (startMs < now() - 60000) { err.textContent = 'ម៉ោងចាប់ផ្តើមបានកន្លងហួសហើយ'; return; }
      if (!(dur >= 3)) { err.textContent = 'រយៈពេលយ៉ាងតិច ៣ នាទី'; return; }
      if (!colId && !(colMax > 0)) { err.textContent = 'ពិន្ទុអតិបរមាក្នុងជួរមិនត្រឹមត្រូវ'; return; }
      const qs = pickQuestions(pool, ids, n, lv);
      if (qs.length < 3) { err.textContent = `សំណួរមិនគ្រប់ (រកបាន ${qs.length})។ សូមជ្រើសមេរៀនបន្ថែម ឬកម្រិត «ចម្រុះ»`; return; }
      if (qs.length < n && !confirm(`រកបានតែ ${qs.length} សំណួរ (ស្នើ ${n})។ បន្តដែរឬទេ?`)) return;
      const eid = 'e' + Date.now().toString(36);
      const exam = {
        title, monthId: ctx.mid(), colId: '', startAt: new Date(startMs), endAt: new Date(startMs + dur * 60000),
        durationMin: dur, total: qs.length, perQ, maxLeaves, synced: false,
        questions: qs.map((q) => ({ id: q.id, q: q.q, o: q.o, k: keyHash(eid, q.id, q.a) }))
      };
      const key = { correct: qs.map((q) => q.a), expl: qs.map((q) => q.e || '') };
      m.dataset.busy = '1';
      m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
      try {
        // link / create the activity column first
        const next = ctx.cols().map((c) => Object.assign({}, c));
        if (colId) { const c = next.find((x) => x.id === colId); c.exam = eid; }
        else { colId = ctx.newColId(); next.push({ id: colId, label: title, max: colMax, day: '', exam: eid }); }
        exam.colId = colId;
        await ctx.saveCols(next);
        await api().createExam(ctx.cls.id, eid, exam, key);
        m.remove();
        toast('✅ បានបង្កើតការប្រឡង', 'success');
        done();
      } catch (e) {
        delete m.dataset.busy;
        err.textContent = e.code === 'permission-denied' ? 'គ្មានសិទ្ធិ (ត្រូវ Publish firestore.rules ថ្មី)' : (e.message || e.code);
        m.querySelectorAll('button').forEach((b) => { b.disabled = false; });
      }
    });
  }

  /* verified scores: recompute from the answers with the teacher-only key */
  async function loadVerified(ctx, ex) {
    const [results, keyDoc] = await Promise.all([api().listExamResults(ctx.cls.id, ex.id), api().getExamKey(ctx.cls.id, ex.id)]);
    const correct = (keyDoc && keyDoc.correct) || [];
    const col = ctx.allCols().find((c) => c.id === ex.colId);
    const colMax = col ? Number(col.max) : 0;
    const byUid = new Map();
    results.forEach((r) => {
      const ans = Array.isArray(r.answers) ? r.answers : [];
      const real = correct.length ? ans.reduce((a, v, i) => a + (v === correct[i] ? 1 : 0), 0) : r.score;
      const qSec = Array.isArray(r.qSec) ? r.qSec : [];
      const avg = qSec.length ? qSec.reduce((a, v) => a + v, 0) / qSec.length : null;
      const mismatch = correct.length > 0 && real !== r.score;
      let flag = 'ok';
      if ((r.leaves || 0) >= 3 || (avg !== null && avg < 2.5) || mismatch || r.auto) flag = 'red';
      else if ((r.leaves || 0) >= 1 || (avg !== null && avg < 4)) flag = 'yellow';
      byUid.set(r.uid, { r, real, avg, mismatch, flag, scaled: colMax ? r2(colMax * real / ex.total) : null });
    });
    return { byUid, colMax };
  }

  async function syncScores(ctx, ex, quiet) {
    const v = await loadVerified(ctx, ex);
    const entries = [];
    v.byUid.forEach((x, uid) => { if (v.colMax && ctx.students.some((s) => s.uid === uid) || (v.colMax && !ctx.students.length)) entries.push({ uid, value: x.scaled }); });
    if (!v.colMax) throw new Error('រកមិនឃើញជួរពិន្ទុដែលភ្ជាប់ (ប្រហែលត្រូវបានលុប)');
    if (entries.length) await api().setColumnValues(ctx.cls.id, ex.monthId, ex.colId, entries, ex.title, ctx.expiry(ex.monthId));
    if (examState(ex) === 'ended') { await api().updateExam(ctx.cls.id, ex.id, { synced: true }); ex.synced = true; }
    if (!quiet) toast(`✅ ផ្ទេរពិន្ទុ ${entries.length} នាក់ ចូលជួរសកម្មភាព`, 'success');
    return entries.length;
  }

  async function showResults(ctx, root, ex, back) {
    const m = modalIn(root, '<div class="acc-center small"><div class="acc-spin"></div></div>', true);
    m.dataset.busy = '1';
    try {
      const v = await loadVerified(ctx, ex);
      delete m.dataset.busy;
      const students = ctx.students.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));
      const rows = students.map((s, i) => {
        const x = v.byUid.get(s.uid);
        if (!x) return `<tr class="none"><td>${i + 1}</td><td class="nm">${esc(s.name)}</td><td colspan="5">មិនទាន់ធ្វើ</td></tr>`;
        const flag = { ok: '🟢', yellow: '🟡', red: '🔴' }[x.flag];
        const why = [x.r.leaves ? `ចាកចេញ ${x.r.leaves} ដង (${Math.round(x.r.leaveSec || 0)} វិ)` : '', x.avg !== null && x.avg < 4 ? `លឿនខុសធម្មតា (${r2(x.avg)} វិ/សំណួរ)` : '', x.mismatch ? 'ពិន្ទុមិនត្រូវនឹងចម្លើយ' : '', x.r.auto ? 'បញ្ជូនស្វ័យប្រវត្តិ' : ''].filter(Boolean).join(' · ');
        return `<tr><td>${i + 1}</td><td class="nm">${esc(s.name)}</td><td><b>${x.real}/${ex.total}</b>${x.mismatch ? ` <small>(អះអាង ${x.r.score})</small>` : ''}</td><td>${x.scaled == null ? '—' : x.scaled}</td><td>${flag}</td><td class="ex-why">${esc(why) || '—'}</td><td>${x.r.submittedAt ? fmtTime(msOf(x.r.submittedAt)) : ''}</td></tr>`;
      }).join('');
      const done = students.filter((s) => v.byUid.has(s.uid)).length;
      m.querySelector('.acc-modal-card').innerHTML = `
        <h3>📊 ${esc(ex.title)}</h3>
        <p class="acc-muted">${STATE_TXT[examState(ex)]} · បានធ្វើ ${done}/${students.length} នាក់។ ពិន្ទុត្រូវគណនាឡើងវិញពីចម្លើយរបស់សិស្ស (មិនទុកចិត្តតម្លៃដែលសិស្សផ្ញើ)។ 🟢 ធម្មតា · 🟡 ចាកចេញ ១–២ ដង ឬលឿន · 🔴 ចាកចេញ ≥ ៣ ដង ឬមិនប្រក្រតី។ ការសម្រេចចិត្តជារបស់គ្រូ។</p>
        <div class="sc-bar"><button class="acc-btn sm" data-a="sync">🔄 ផ្ទេរពិន្ទុចូលជួរសកម្មភាព</button><button class="acc-btn ghost sm" data-a="csv">⬇️ Excel</button></div>
        <div class="acc-table-wrap"><table class="acc-table"><thead><tr><th>ល.រ</th><th>ឈ្មោះ</th><th>ត្រូវ</th><th>ក្នុងជួរ</th><th></th><th>កំណត់ចំណាំ</th><th>ម៉ោងបញ្ជូន</th></tr></thead><tbody>${rows}</tbody></table></div>
        <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បិទ</button></div>`;
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      m.querySelector('[data-a="sync"]').addEventListener('click', async (e) => {
        e.target.disabled = true;
        try { await syncScores(ctx, ex); if (ctx.onSynced) ctx.onSynced(ex.monthId); if (back) back(); } catch (er) { toast(er.message || er.code, 'error'); }
        e.target.disabled = false;
      });
      m.querySelector('[data-a="csv"]').addEventListener('click', () => {
        const q = (x) => '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"';
        const lines = [['ល.រ', 'ឈ្មោះ', 'ត្រូវ', 'សរុប', 'ក្នុងជួរ', 'ចាកចេញ(ដង)', 'ចាកចេញ(វិ)', 'វិ/សំណួរ', 'ស្ថានភាព'].map(q).join(',')];
        students.forEach((s, i) => { const x = v.byUid.get(s.uid); lines.push([i + 1, s.name, x ? x.real : '', ex.total, x ? x.scaled : '', x ? x.r.leaves || 0 : '', x ? Math.round(x.r.leaveSec || 0) : '', x && x.avg !== null ? r2(x.avg) : '', x ? x.flag : 'មិនធ្វើ'].map(q).join(',')); });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' }));
        a.download = `ប្រឡង_${ctx.cls.name}_${ex.title}.csv`;
        document.body.appendChild(a); a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      });
    } catch (e) {
      delete m.dataset.busy;
      m.querySelector('.acc-modal-card').innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p><div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បិទ</button></div>`;
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
    }
  }

  /* when the teacher opens the sheet: copy the scores of exams that have ended */
  async function autoSync(ctx) {
    try {
      await syncClock();
      const list = await api().listExams(ctx.cls.id);
      let changed = false;
      for (const ex of list) {
        if (ex.synced || ex.monthId !== ctx.mid() || now() < msOf(ex.endAt) + 60000) continue;
        const n = await syncScores(ctx, ex, true);
        if (n) changed = true;
      }
      return changed;
    } catch (e) { return false; }
  }

  /* ======================================================================
     STUDENT
     ====================================================================== */
  let overlay = null;
  let tick = null;
  const stKey = (eid, uid) => `ws_exam_${eid}_${uid}`;

  async function openStudent() {
    const p = Cloud.profile();
    if (!p || p.role !== 'student') return;
    await syncClock();
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'acc sc-overlay ex-overlay';
      overlay.id = 'exams-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('open');
    const close = () => { clearInterval(tick); overlay.classList.remove('open'); };
    overlay.innerHTML = `
      <header class="acc-top">
        <button class="acc-icon" data-a="close" title="ត្រឡប់"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
        <div class="acc-title"><b>🎯 តេស្ត MCQ</b><small>${esc(p.name)} · ថ្នាក់ ${esc(p.className || '')}</small></div>
      </header>
      <main class="acc-main sc-body"><div class="acc-center small"><div class="acc-spin"></div></div></main>`;
    overlay.querySelector('[data-a="close"]').addEventListener('click', close);
    const body = overlay.querySelector('.sc-body');
    try {
      const exams = await api().listExams(p.classId);
      const results = await Promise.all(exams.map((e) => api().getMyExamResult(p.classId, e.id).catch(() => null)));
      const res = new Map(exams.map((e, i) => [e.id, results[i]]));
      paintList(body, p, exams, res, close);
    } catch (e) {
      body.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p>`;
    }
  }

  function paintList(body, p, exams, res, close) {
    clearInterval(tick);
    const card = (ex) => {
      const st = examState(ex);
      const r = res.get(ex.id);
      const s = msOf(ex.startAt), e = msOf(ex.endAt);
      let status, action = '';
      if (r) {
        status = `<span class="ex-st done">✅ បានធ្វើរួច · ${r.score}/${ex.total}</span>`;
        if (st === 'ended') action = `<button class="acc-btn ghost sm" data-review="${esc(ex.id)}">មើលចម្លើយត្រឹមត្រូវ</button>`;
        else status += '<small>ចម្លើយត្រឹមត្រូវបង្ហាញពេលការប្រឡងចប់</small>';
      } else if (st === 'upcoming') {
        status = `<span class="ex-st wait">⏳ ចាប់ផ្តើមក្នុង <b data-cd="${s}">${mmss((s - now()) / 1000)}</b></span>`;
        action = '<button class="acc-btn sm" disabled>🔒 មិនទាន់ដល់ម៉ោង</button>';
      } else if (st === 'open') {
        status = `<span class="ex-st open">🟢 កំពុងប្រឡង · នៅសល់ <b data-cd="${e}">${mmss((e - now()) / 1000)}</b></span>`;
        action = `<button class="acc-btn sm" data-start="${esc(ex.id)}">ចាប់ផ្តើមប្រឡង</button>`;
      } else {
        status = '<span class="ex-st miss">⌛ ចប់ហើយ (មិនបានធ្វើ)</span>';
      }
      return `<section class="sc-card ex-card" data-ex="${esc(ex.id)}"><h4>${esc(ex.title)}</h4>
        <div class="ex-meta">📅 ${fmtTime(s)} · ⏱️ ${ex.durationMin} នាទី · ❓ ${ex.total} សំណួរ</div>
        <div class="ex-status">${status}</div>${action ? `<div class="ex-act">${action}</div>` : ''}</section>`;
    };
    body.innerHTML = `<div class="sc sc-member">${exams.length ? exams.map(card).join('') : '<div class="acc-center small"><p class="acc-muted">មិនទាន់មានការប្រឡងទេ។ នៅពេលលោកគ្រូបង្កើត វានឹងបង្ហាញនៅទីនេះ។</p></div>'}</div>`;
    body.querySelectorAll('[data-start]').forEach((b) => b.addEventListener('click', () => startExam(body, p, exams.find((x) => x.id === b.dataset.start), res, exams, close)));
    body.querySelectorAll('[data-review]').forEach((b) => b.addEventListener('click', () => review(body, p, exams.find((x) => x.id === b.dataset.review), res.get(b.dataset.review), () => paintList(body, p, exams, res, close))));
    // live countdown; when a state changes, repaint
    const states = new Map(exams.map((ex) => [ex.id, examState(ex)]));
    tick = setInterval(() => {
      if (!overlay.classList.contains('open') || !body.isConnected) { clearInterval(tick); return; }
      let changed = false;
      exams.forEach((ex) => { if (examState(ex) !== states.get(ex.id)) changed = true; });
      if (changed) { paintList(body, p, exams, res, close); return; }
      body.querySelectorAll('[data-cd]').forEach((el) => { el.textContent = mmss((Number(el.dataset.cd) - now()) / 1000); });
    }, 1000);
  }

  async function review(body, p, ex, r, back) {
    body.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
    try {
      const key = await api().getExamKey(p.classId, ex.id);
      const ans = (r && r.answers) || [];
      body.innerHTML = `<div class="sc sc-member"><button class="acc-btn ghost sm" data-a="back">← ត្រឡប់</button><h3 class="ex-h">${esc(ex.title)} · ${r ? r.score : '?'}/${ex.total}</h3>
        ${ex.questions.map((q, i) => { const c = key.correct[i], a = ans[i]; return `<section class="sc-card"><div class="ex-q">${i + 1}. ${html(q.q)}</div>
          <ul class="ex-opts">${q.o.map((o, j) => `<li class="${j === c ? 'ok' : (j === a ? 'bad' : '')}">${'ក ខ គ ឃ'.split(' ')[j]}. ${html(o)}${j === c ? ' ✔' : (j === a ? ' ✘ (ចម្លើយរបស់អ្នក)' : '')}</li>`).join('')}</ul>
          ${key.expl && key.expl[i] ? `<div class="ex-expl">💡 ${html(key.expl[i])}</div>` : ''}</section>`; }).join('')}</div>`;
      body.querySelector('[data-a="back"]').addEventListener('click', back);
      renderMath(body);
    } catch (e) { body.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p><button class="acc-btn ghost sm" data-a="back">← ត្រឡប់</button>`; body.querySelector('[data-a="back"]').addEventListener('click', back); }
  }

  function startExam(body, p, ex, res, exams, close) {
    if (!ex || examState(ex) !== 'open') { toast('ការប្រឡងមិនបើកទេ', 'warning'); return; }
    body.innerHTML = `<div class="sc sc-member"><section class="sc-card"><h4>${esc(ex.title)}</h4>
      <ul class="ex-rules">
        <li>មាន <b>${ex.total} សំណួរ</b> · ពេលសរុបដល់ <b>${fmtTime(msOf(ex.endAt))}</b> (ម្នាក់ៗចប់ក្នុងម៉ោងតែមួយ)។</li>
        ${ex.perQ ? `<li>ម្នាក់ៗមាន <b>${ex.perQ} វិនាទី</b> ក្នុងមួយសំណួរ។</li>` : ''}
        <li>ធ្វើបានតែ <b>មួយដង</b> ហើយ<b>មិនអាចត្រឡប់ក្រោយ</b>បានទេ។</li>
        <li>ការ<b>ចាកចេញពីអេក្រង់នេះ</b> (ប្តូរ App/Tab) ត្រូវបានកត់ត្រាជូនលោកគ្រូ${ex.maxLeaves ? ` ហើយបើចាកចេញ <b>${ex.maxLeaves} ដង</b> ការប្រឡងនឹងបញ្ជូនដោយស្វ័យប្រវត្តិ` : ''}។</li>
        <li>សូមធ្វើដោយខ្លួនឯង។ សំណួរនិងចម្លើយរៀបខុសគ្នាពីមិត្តភក្តិ។</li>
      </ul>
      <div class="ex-act"><button class="acc-btn ghost sm" data-a="back">← ត្រឡប់</button><button class="acc-btn sm" data-a="go">ចាប់ផ្តើមឥឡូវ</button></div></section></div>`;
    body.querySelector('[data-a="back"]').addEventListener('click', () => paintList(body, p, exams, res, close));
    body.querySelector('[data-a="go"]').addEventListener('click', () => runExam(body, p, ex, res, exams, close));
  }

  function runExam(body, p, ex, res, exams, close) {
    clearInterval(tick);
    const KEY = stKey(ex.id, p.uid);
    const rng = rngFrom(p.uid + '|' + ex.id);
    const order = shuffled(ex.questions.map((_, i) => i), rng);
    const perms = ex.questions.map(() => shuffled([0, 1, 2, 3], rng));
    let st;
    try { st = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { st = null; }
    if (!st || st.v !== 1) st = { v: 1, pos: 0, answers: ex.questions.map(() => -1), qSec: ex.questions.map(() => 0), leaves: 0, leaveSec: 0, qStart: now(), startedMs: now() };
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };
    let away = 0, finished = false, selected = -1, qTimer = null, totalTimer = null;
    document.body.classList.add('ex-running');

    function cleanup() {
      finished = true;
      clearInterval(qTimer); clearInterval(totalTimer);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('beforeunload', onUnload);
      document.body.classList.remove('ex-running');
    }
    function leave() { if (!away && !finished) away = Date.now(); }
    function back() {
      if (!away || finished) return;
      st.leaves++; st.leaveSec += (Date.now() - away) / 1000; away = 0; save();
      toast(`⚠️ ការចាកចេញត្រូវបានកត់ត្រា (${st.leaves} ដង)`, 'warning');
      const b = body.querySelector('.ex-leaves'); if (b) b.textContent = `ចាកចេញ ${st.leaves}`;
      if (ex.maxLeaves && st.leaves >= ex.maxLeaves) submit(true);
    }
    const onVis = () => { if (document.hidden) leave(); else back(); };
    const onBlur = () => { if (!document.hidden) leave(); };
    const onFocus = () => { if (!document.hidden) back(); };
    const onUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    window.addEventListener('beforeunload', onUnload);

    function recordTime() {
      const q = order[st.pos];
      st.qSec[q] = (st.qSec[q] || 0) + (now() - st.qStart) / 1000;
      st.qStart = now();
    }

    function paintQ() {
      if (st.pos >= order.length) return submit(false);
      const qi = order[st.pos];
      const q = ex.questions[qi];
      const perm = perms[qi];
      selected = -1;
      const last = st.pos === order.length - 1;
      body.innerHTML = `<div class="sc sc-member ex-run">
        <div class="ex-bar"><span>សំណួរ <b>${st.pos + 1}</b>/${order.length}</span><span class="ex-leaves">ចាកចេញ ${st.leaves}</span><span>⏱️ <b class="ex-total">--:--</b></span></div>
        <div class="ex-prog"><i style="width:${(st.pos / order.length) * 100}%"></i></div>
        ${ex.perQ ? `<div class="ex-qt">ពេលសំណួរនេះ <b class="ex-qtime">${ex.perQ}</b> វិ</div>` : ''}
        <section class="sc-card"><div class="ex-q">${html(q.q)}</div>
          <div class="ex-options">${perm.map((orig, j) => `<button class="ex-opt" data-o="${orig}"><b>${'ក ខ គ ឃ'.split(' ')[j]}</b><span>${html(q.o[orig])}</span></button>`).join('')}</div>
        </section>
        <div class="ex-act"><button class="acc-btn" data-a="next" disabled>${last ? 'បញ្ជូន' : 'បន្ទាប់ →'}</button></div></div>`;
      renderMath(body);
      body.querySelectorAll('.ex-opt').forEach((b) => b.addEventListener('click', () => {
        selected = Number(b.dataset.o);
        body.querySelectorAll('.ex-opt').forEach((x) => x.classList.toggle('sel', x === b));
        body.querySelector('[data-a="next"]').disabled = false;
      }));
      body.querySelector('[data-a="next"]').addEventListener('click', () => next(false));
      clearInterval(qTimer);
      if (ex.perQ) {
        qTimer = setInterval(() => {
          const left = Math.ceil(ex.perQ - (now() - st.qStart) / 1000);
          const el = body.querySelector('.ex-qtime');
          if (el) { el.textContent = Math.max(0, left); el.parentElement.classList.toggle('low', left <= 10); }
          if (left <= 0) next(true);
        }, 500);
      }
    }
    function next(timedOut) {
      if (finished) return;
      recordTime();
      st.answers[order[st.pos]] = timedOut && selected < 0 ? -1 : selected;
      st.pos++; save();
      paintQ();
    }
    async function submit(auto) {
      if (finished) return;
      if (away) { st.leaves++; st.leaveSec += (Date.now() - away) / 1000; away = 0; }
      if (st.pos < order.length) { recordTime(); if (selected >= 0 && st.answers[order[st.pos]] === -1) st.answers[order[st.pos]] = selected; }
      cleanup();
      let score = 0;
      ex.questions.forEach((q, i) => { if (st.answers[i] >= 0 && keyHash(ex.id, q.id, st.answers[i]) === q.k) score++; });
      const result = { uid: p.uid, name: p.name, score, total: ex.total, answers: st.answers, qSec: st.qSec.map((v) => Math.round(v * 10) / 10), leaves: st.leaves, leaveSec: Math.round(st.leaveSec), auto: !!auto, startedMs: st.startedMs };
      body.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div><p>កំពុងបញ្ជូនចម្លើយ...</p></div>';
      const send = async () => {
        try {
          await api().submitExamResult(p.classId, ex.id, result);
          try { localStorage.removeItem(KEY); } catch (e) {}
          res.set(ex.id, result);
          done();
        } catch (e) {
          body.innerHTML = `<div class="sc sc-member"><section class="sc-card"><h4>⚠️ បញ្ជូនមិនបាន</h4><p class="acc-muted">${esc(e.code === 'permission-denied' ? 'ហួសម៉ោងកំណត់ ឬបានបញ្ជូនរួចហើយ' : (e.message || 'សូមពិនិត្យអ៊ីនធឺណិត'))}</p>
            <div class="ex-act"><button class="acc-btn sm" data-a="retry">សាកម្តងទៀត</button><button class="acc-btn ghost sm" data-a="list">ត្រឡប់</button></div></section></div>`;
          body.querySelector('[data-a="retry"]').addEventListener('click', send);
          body.querySelector('[data-a="list"]').addEventListener('click', () => paintList(body, p, exams, res, close));
        }
      };
      const done = () => {
        const pct = Math.round((score / ex.total) * 100);
        body.innerHTML = `<div class="sc sc-member"><div class="sc-grand"><span>${esc(ex.title)}</span><b>${score}/${ex.total}</b><small>${pct}%${auto ? ' · បញ្ជូនដោយស្វ័យប្រវត្តិ' : ''}</small></div>
          <p class="acc-muted" style="text-align:center">ពិន្ទុត្រូវបានផ្ញើទៅលោកគ្រូ ហើយនឹងចូលក្នុងពិន្ទុសកម្មភាពរបស់អ្នក។ ចម្លើយត្រឹមត្រូវបង្ហាញពេលការប្រឡងចប់។</p>
          <div class="ex-act"><button class="acc-btn sm" data-a="list">ត្រឡប់ទៅបញ្ជី</button></div></div>`;
        body.querySelector('[data-a="list"]').addEventListener('click', () => paintList(body, p, exams, res, close));
      };
      send();
    }
    // global deadline
    totalTimer = setInterval(() => {
      const left = (msOf(ex.endAt) - now()) / 1000;
      const el = body.querySelector('.ex-total');
      if (el) { el.textContent = mmss(left); el.parentElement.classList.toggle('low', left <= 60); }
      if (left <= 0) submit(true);
    }, 500);
    // block copy / context menu while taking the test
    const block = (e) => { if (!finished) e.preventDefault(); };
    body.oncontextmenu = block; body.oncopy = block; body.oncut = block; body.onselectstart = block;
    paintQ();
  }

  window.Exams = { openManager, openStudent, autoSync, syncScores };
})();
