/* ==========================================================================
   Scores — ពិន្ទុសកម្មភាព (activity scores)
   - Teacher/admin: full sheet per month (add/edit/delete activity columns,
     enter scores, lock a month, choose class leaders, export, audit log).
   - Class leader: after typing a SEPARATE edit password (set by the teacher, not
     printed on the ID slip) may enter scores in own class; session ends on close.
   - Other students: see only their own scores.
   Data lives in Firestore (see Cloud.scoresApi and firestore.rules).
   ========================================================================== */
(function () {
  'use strict';

  const KH = '០១២៣៤៥៦៧៨៩';
  const kh = (v) => String(v).replace(/[0-9]/g, (d) => KH[d]);
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const MONTHS = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'];
  const r2 = (v) => Math.round(v * 100) / 100;
  const fmt = (v) => kh(r2(v));
  const monthLabel = (id) => { const p = String(id).split('-'); return `ខែ${MONTHS[+p[1] - 1] || p[1]} ${kh(p[0])}`; };
  const toast = (m, t) => { if (window.App && App.showToast) App.showToast(m, t || 'info'); else alert(m); };
  const api = () => Cloud.scoresApi();

  /* total score of a class: G7-9 = 100, G10 = 150, G11-12 = 125; activity share defaults to 60% */
  const defaultTotal = (grade) => { const g = parseInt(grade, 10) || 0; return g === 10 ? 150 : (g >= 11 ? 125 : 100); };
  const totalOf = (cls) => Number(cls.scoreTotal) > 0 ? Number(cls.scoreTotal) : defaultTotal(cls.grade);
  const pctOf = (cls) => Number(cls.scorePct) > 0 ? Number(cls.scorePct) : 60;
  const capOf = (cls) => r2(totalOf(cls) * pctOf(cls) / 100);
  const rowTotal = (row, cols) => r2(cols.reduce((a, c) => a + (Number(row && row.s && row.s[c.id]) || 0), 0));
  const colMaxSum = (cols) => r2(cols.reduce((a, c) => a + (Number(c.max) || 0), 0));
  const keepOf = (cls) => (cls.scoreKeep === 0 ? 0 : (Number(cls.scoreKeep) > 0 ? Number(cls.scoreKeep) : 14));
  /* Firestore TTL deletes documents once expireAt has passed: end of the month + keep months */
  const expiryFor = (cls, mid) => {
    const keep = keepOf(cls);
    if (!keep) return null;
    const p = String(mid).split('-');
    return new Date(+p[0], +p[1] - 1 + 1 + keep, 1);
  };
  /* Names pasted from Excel: drop the row-number cell (Latin or Khmer digits) and keep the name */
  const NUM_CELL = /^[\s0-9\u17E0-\u17E9]+[.)]?\s*$/;
  const parseNames = (text) => String(text || '').split(/\r?\n/).map((line) => {
    const cells = line.split('\t').map((c) => c.trim()).filter((c) => c && !NUM_CELL.test(c));
    let n = cells.length ? cells[0] : '';
    if (!n && !line.includes('\t')) n = line.trim();
    return n.replace(/^[\s0-9\u17E0-\u17E9]+[.)\-]\s*/, '').trim();
  }).filter(Boolean);
  /* Encouragement level of a student: share of the activity points available so far.
     A student only ever sees the message box of their OWN level. */
  const levelA = (cls) => (Number(cls.scoreA) > 0 ? Number(cls.scoreA) : 80);
  const levelB = (cls) => (Number(cls.scoreB) > 0 ? Number(cls.scoreB) : 60);
  const LEVELS = {
    A: { icon: '🌟', title: 'កម្រិត A', msg: 'អ្នកធ្វើបានល្អណាស់! សូមរក្សាភាពល្អនេះជាបន្តទៀត។' },
    B: { icon: '💪', title: 'កម្រិត B', msg: 'ប្រឹងទៀតយក A! អ្នកជិតដល់ហើយ ចូលរួមសកម្មភាពឱ្យបានច្រើនទៀត។' },
    C: { icon: '🌱', title: 'កម្រិត C', msg: 'ខំប្រឹងចូលរួម! រាល់សកម្មភាពតូចៗរាប់ជាពិន្ទុ ហើយអ្នកអាចធ្វើបាន។' }
  };
  const levelOf = (cls, num, den) => {
    if (!(den > 0)) return null;
    const p = (num / den) * 100;
    return p >= levelA(cls) ? 'A' : (p >= levelB(cls) ? 'B' : 'C');
  };
  const BLANK_COLS = 5;
  const colName = (c, i) => (c.label && c.label.trim()) || `សកម្មភាព ${kh(i + 1)}`;
  const newColId = () => 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const blankCols = (n) => Array.from({ length: n }, () => ({ id: newColId(), label: '', max: 5, day: '' }));

  /* ----- a sheet (one class) rendered into a host element ----- */
  function Sheet(host, init) {
    const S = {
      cls: init.cls,
      mode: init.mode, // 'teacher' | 'leader' | 'member'
      students: init.students || [],
      months: [],
      mid: '',
      rows: [],
      view: 'month', // 'month' | 'summary'
      summary: null,
      sort: { key: 'seq', dir: 1 },
      onModal: init.modal,
      onActivity: init.onActivity
    };
    const canEdit = () => S.mode === 'teacher' || S.mode === 'leader';
    const month = () => S.months.find((m) => m.id === S.mid) || null;
    const cols = () => (month() && month().cols) || [];
    const locked = () => !!(month() && month().locked);
    const editableNow = () => S.mode === 'teacher' || (S.mode === 'leader' && !locked());

    function modal(html) {
      const m = document.createElement('div');
      m.className = 'acc-modal';
      m.innerHTML = `<div class="acc-modal-card">${html}</div>`;
      (S.onModal ? S.onModal() : host.closest('.acc') || document.body).appendChild(m);
      m.addEventListener('click', (e) => { if (e.target === m && !m.dataset.busy) m.remove(); });
      return m;
    }

    /* ---------- loading ---------- */
    async function load(keepMid) {
      host.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
      try {
        S.months = await api().listMonths(S.cls.id);
        const now = new Date();
        const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        if (S.mode === 'teacher' && !S.months.length) {
          const first = { label: monthLabel(cur), cols: blankCols(BLANK_COLS), locked: false };
          const e0 = expiryFor(S.cls, cur);
          if (e0) first.expireAt = e0;
          await api().saveMonth(S.cls.id, cur, first);
          S.months = [Object.assign({ id: cur }, first)];
        }
        if (!(keepMid && S.months.some((m) => m.id === keepMid))) {
          S.mid = S.months.some((m) => m.id === cur) ? cur : (S.months.length ? S.months[S.months.length - 1].id : '');
        } else S.mid = keepMid;
        await loadRows();
        paint();
      } catch (e) {
        host.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code || e)}</p>`;
      }
    }

    async function loadRows() {
      S.rows = [];
      if (!S.mid) return;
      if (S.mode === 'member') {
        const r = await api().myRow(S.cls.id, S.mid);
        S.rows = r ? [r] : [];
        return;
      }
      S.rows = await api().listRows(S.cls.id, S.mid);
      if (S.mode === 'teacher') {
        const have = new Set(S.rows.map((r) => r.uid));
        const missing = S.students.filter((s) => !have.has(s.uid) && s.active !== false);
        if (missing.length) {
          S.rows = S.rows.concat(await api().createRows(S.cls.id, S.mid, missing, expiryFor(S.cls, S.mid)));
          S.rows.sort((a, b) => (a.seq || 0) - (b.seq || 0));
        }
      }
    }

    /* ---------- painting ---------- */
    /* footer: how many students have a score + the average of each column */
    function footHtml() {
      const cs = cols();
      if (!S.rows.length) return '';
      const stat = (vals) => (vals.length ? `${fmt(vals.reduce((a, v) => a + v, 0) / vals.length)}<small>${kh(vals.length)}/${kh(S.rows.length)}</small>` : '—');
      const cells = cs.map((c) => `<td>${stat(S.rows.map((r) => (r.s && r.s[c.id] != null ? Number(r.s[c.id]) : null)).filter((v) => v !== null))}</td>`).join('');
      const tot = S.rows.map((r) => rowTotal(r, cs));
      return `<tr class="sc-foot"><td class="sc-n"></td><td class="sc-nm">មធ្យមភាគ <small>(ដាក់រួច/សរុប)</small></td>${cells}<td class="sc-tot">${fmt(tot.reduce((a, v) => a + v, 0) / tot.length)}</td>${S.mode === 'teacher' ? '<td class="sc-addcol"></td>' : ''}</tr>`;
    }

    /* rows in the order shown on screen (original order = seq; sorting is only a view) */
    function viewRows() {
      const rs = S.rows.slice();
      const { key, dir } = S.sort;
      if (key === 'seq') return rs;
      const cs = cols();
      const val = (r) => {
        if (key === 'total') return rowTotal(r, cs);
        if (key === 'name') return String(r.name || '');
        const id = key.slice(2);
        return r.s && r.s[id] != null ? Number(r.s[id]) : -1;
      };
      rs.sort((a, b) => {
        const x = val(a), y = val(b);
        const c = typeof x === 'string' ? x.localeCompare(y, 'km') : x - y;
        return c * dir || (S.rows.indexOf(a) - S.rows.indexOf(b));
      });
      return rs;
    }
    const mark = (key) => (S.sort.key === key ? (S.sort.dir === 1 ? ' ▲' : ' ▼') : '');
    function toggleSort(key) {
      if (key === 'seq') S.sort = { key: 'seq', dir: 1 };
      else if (S.sort.key === key) S.sort = { key, dir: -S.sort.dir };
      else S.sort = { key, dir: key === 'name' ? 1 : -1 };
      paint();
    }

    function hintHtml() {
      const cap = capOf(S.cls);
      const maxSum = colMaxSum(cols());
      const allMax = r2(S.months.reduce((a, x) => a + colMaxSum(x.cols || []), 0));
      const over = allMax > cap;
      return `<p class="sc-hint ${over ? 'warn' : ''}">${locked() ? '🔒 ខែនេះត្រូវបានបិទ ' : ''}ខែនេះអតិបរមា <b>${fmt(maxSum)}</b> · គ្រប់ខែ <b>${fmt(allMax)}</b>${over ? ` — លើសកម្រិត ${fmt(cap)} (សិស្សម្នាក់បានតែ ${fmt(cap)} ជាអតិបរមា)` : ` · កម្រិតអតិបរមាសិស្សម្នាក់ ${fmt(cap)}`}</p>`;
    }
    function paint() {
      if (S.view === 'summary') return paintSummary();
      if (S.mode === 'member') return paintMember();
      const m = month();
      const cs = cols();
      const cap = capOf(S.cls);
      const leaderIds = new Set(S.students.filter((s) => s.editorOn === true).map((s) => s.uid));
      const opts = S.months.map((x) => `<option value="${esc(x.id)}" ${x.id === S.mid ? 'selected' : ''}>${esc(x.label || monthLabel(x.id))}</option>`).join('');
      const ed = editableNow();

      const head = cs.map((c, i) => S.mode === 'teacher' ? `
        <th class="sc-col sc-col-ed">
          <input class="sc-h sc-h-label" data-hc="${esc(c.id)}" data-f="label" maxlength="40" value="${esc(c.label)}" placeholder="ឈ្មោះសកម្មភាព ${kh(i + 1)}" title="វាយឈ្មោះសកម្មភាព ឧ. ឡើងក្តាខៀន, VDO, ឡើងពន្យល់">
          <div class="sc-h-meta">
            <input class="sc-h sc-h-day" data-hc="${esc(c.id)}" data-f="day" maxlength="20" value="${esc(c.day || '')}" placeholder="ថ្ងៃ/ផ្នែក" title="ថ្ងៃ ឬផ្នែក (ស្រេចចិត្ត)">
            <span>/</span>
            <input class="sc-h sc-h-max" data-hc="${esc(c.id)}" data-f="max" type="number" min="0.25" step="0.25" value="${c.max}" title="ពិន្ទុអតិបរមា">
          </div>
          <div class="sc-h-tools"><button data-fill="${esc(c.id)}" title="ដាក់ពិន្ទុដូចគ្នាឱ្យទាំងថ្នាក់">⚡ ទាំងថ្នាក់</button><button data-sort="c:${esc(c.id)}" title="តម្រៀបតាមជួរនេះ">↕${mark('c:' + c.id)}</button></div>
          <button class="sc-h-del" data-dc="${esc(c.id)}" title="លុបជួរនេះ">✕</button>
        </th>` : `
        <th class="sc-col">
          <div class="sc-col-name">${esc(colName(c, i))}</div>
          <small>${c.day ? esc(c.day) + ' · ' : ''}/${fmt(c.max)}</small>
          <div class="sc-h-tools">${ed ? `<button data-fill="${esc(c.id)}" title="ដាក់ពិន្ទុដូចគ្នាឱ្យទាំងថ្នាក់">⚡ ទាំងថ្នាក់</button>` : ''}<button data-sort="c:${esc(c.id)}" title="តម្រៀបតាមជួរនេះ">↕${mark('c:' + c.id)}</button></div>
        </th>`).join('');

      const body = viewRows().map((r) => {
        const i = S.rows.indexOf(r);
        const cells = cs.map((c) => {
          const v = r.s && r.s[c.id] != null ? r.s[c.id] : '';
          return `<td class="sc-cell"><input type="number" inputmode="decimal" step="0.25" min="0" max="${c.max}" value="${v}" data-uid="${esc(r.uid)}" data-col="${esc(c.id)}" ${ed ? '' : 'disabled'}></td>`;
        }).join('');
        const lead = S.mode === 'teacher' ? `<button class="sc-lead ${leaderIds.has(r.uid) ? 'on' : ''}" data-lead="${esc(r.uid)}" title="កំណត់ពាក្យសម្ងាត់កែពិន្ទុ (ប្រធាន/អនុប្រធាន)">🔑</button>` : '';
        return `<tr data-row="${esc(r.uid)}"><td class="sc-n">${kh(i + 1)}</td><td class="sc-nm">${esc(r.name)} ${lead}</td>${cells}<td class="sc-tot" data-tot="${esc(r.uid)}">${fmt(rowTotal(r, cs))}</td>${S.mode === 'teacher' ? '<td class="sc-addcol"></td>' : ''}</tr>`;
      }).join('');

      host.innerHTML = `
        <div class="sc">
          <div class="sc-bar">
            <select class="sc-month" ${S.months.length ? '' : 'disabled'}>${opts || '<option>មិនទាន់មានខែ</option>'}</select>
            ${S.mode === 'teacher' ? '<button class="acc-btn sm" data-a="new-month">➕ ខែថ្មី</button>' : ''}
            ${S.mode === 'teacher' && m ? `<button class="acc-btn sm" data-a="add-col">➕ ជួរសកម្មភាព</button>
              <button class="acc-btn ghost sm" data-a="lock">${locked() ? '🔓 បើកខែ' : '🔒 បិទខែ'}</button>` : ''}
            ${m && S.mode !== 'member' ? '<input class="sc-search" type="search" placeholder="🔍 ស្វែងរកឈ្មោះ" aria-label="ស្វែងរកឈ្មោះ">' : ''}
            ${S.sort.key !== 'seq' ? '<button class="acc-btn sm" data-a="sort-reset">↺ លំដាប់ដើម</button>' : ''}
            ${m ? '<button class="acc-btn ghost sm" data-a="print">🖨️ បោះពុម្ព</button><button class="acc-btn ghost sm" data-a="csv">⬇️ Excel</button>' : ''}
            ${S.months.length ? '<button class="acc-btn ghost sm" data-a="summary">∑ សរុបគ្រប់ខែ</button>' : ''}
            ${S.mode === 'teacher' && m ? '<button class="acc-btn ghost sm" data-a="rename" title="កែឈ្មោះសិស្សទាំងថ្នាក់ម្តងដោយបិទភ្ជាប់ពី Excel">✏️ កែឈ្មោះ</button><button class="acc-btn ghost sm" data-a="log">🕘 ប្រវត្តិកែ</button><button class="acc-btn ghost sm" data-a="del-month">🗑️</button>' : ''}
          </div>
          ${S.mode === 'teacher' ? `
          <div class="sc-cfg">
            <label>ពិន្ទុសរុបថ្នាក់ <input type="number" id="sc-total" min="1" value="${totalOf(S.cls)}"></label>
            <label>ពិន្ទុសកម្មភាព <input type="number" id="sc-pct" min="1" max="100" value="${pctOf(S.cls)}">%</label>
            <b>អតិបរមា ${fmt(cap)}</b>
            <label title="សិស្សដែលបានពិន្ទុ ចាប់ពី % នេះនៃពិន្ទុសកម្មភាពសរុបដែលមាន ទទួលសារកម្រិត A">A ≥ <input type="number" id="sc-ta" min="1" max="100" value="${levelA(S.cls)}">%</label>
            <label title="ចាប់ពី % នេះទទួលសារកម្រិត B ក្រោមនេះទទួលសារកម្រិត C">B ≥ <input type="number" id="sc-tb" min="1" max="100" value="${levelB(S.cls)}">%</label>
            <label title="បន្ទាប់ពីផុតរយៈពេលនេះ ទិន្នន័យនឹងត្រូវលុបដោយស្វ័យប្រវត្តិ (បើបានបើក TTL ក្នុង Firebase)។ ០ = មិនលុប">រក្សាទុក <input type="number" id="sc-keep" min="0" max="120" value="${keepOf(S.cls)}"> ខែក្រោយខែនោះ</label>
            <button class="acc-btn ghost sm" data-a="cfg">រក្សាទុក</button>
          </div>` : ''}
          ${m ? hintHtml() : ''}
          ${m ? (cs.length ? `
          <div class="acc-table-wrap sc-wrap">
            <table class="acc-table sc-table">
              <thead><tr><th class="sc-n sc-sort" data-sort="seq" title="តាមលំដាប់ដើម">ល.រ${S.sort.key === 'seq' ? '' : ' ↺'}</th><th class="sc-nm sc-sort" data-sort="name" title="តម្រៀបតាមឈ្មោះ">ឈ្មោះ${mark('name')}</th>${head}<th class="sc-tot sc-sort" data-sort="total" title="តម្រៀបតាមពិន្ទុសរុប">សរុប${mark('total')}</th>${S.mode === 'teacher' ? '<th class="sc-addcol"><button class="sc-plus" data-a="add-col2" title="បន្ថែមជួរសកម្មភាព">＋</button></th>' : ''}</tr></thead>
              <tbody>${body || `<tr><td colspan="${cs.length + 4}" class="acc-muted">មិនទាន់មានសិស្ស</td></tr>`}</tbody>
              <tfoot>${footHtml()}</tfoot>
            </table>
          </div>` : `<div class="acc-center small"><p class="acc-muted">${S.mode === 'teacher' ? 'ចុច «➕ ជួរសកម្មភាព» ដើម្បីបន្ថែមជួរ' : 'លោកគ្រូមិនទាន់បន្ថែមសកម្មភាពក្នុងខែនេះទេ'}</p></div>`)
          : `<div class="acc-center small"><p class="acc-muted">${S.mode === 'teacher' ? 'មិនទាន់មានខែណាមួយទេ។ ចុច «➕ ខែថ្មី» ដើម្បីចាប់ផ្តើម។' : 'មិនទាន់មានពិន្ទុ'}</p></div>`}
        </div>`;
      bind();
    }

    function bind() {
      const q = (s) => host.querySelector(s);
      const on = (sel, fn) => { const el = q(sel); if (el) el.addEventListener('click', fn); };
      const sel = q('.sc-month');
      if (sel) sel.addEventListener('change', async () => { S.mid = sel.value; host.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>'; try { await loadRows(); } catch (e) { toast(e.message, 'error'); } paint(); });
      on('[data-a="new-month"]', newMonthDialog);
      on('[data-a="add-col"]', addCol);
      on('[data-a="add-col2"]', addCol);
      on('[data-a="lock"]', toggleLock);
      on('[data-a="csv"]', exportCsv);
      on('[data-a="summary"]', openSummary);
      on('[data-a="log"]', showLog);
      on('[data-a="del-month"]', deleteMonth);
      on('[data-a="cfg"]', saveCfg);
      on('[data-a="rename"]', renameDialog);
      on('[data-a="print"]', printSheet);
      on('[data-a="sort-reset"]', () => toggleSort('seq'));
      host.querySelectorAll('[data-sort]').forEach((b) => b.addEventListener('click', () => toggleSort(b.dataset.sort)));
      host.querySelectorAll('[data-fill]').forEach((b) => b.addEventListener('click', () => fillDialog(b.dataset.fill)));
      const srch = q('.sc-search');
      if (srch) srch.addEventListener('input', () => {
        const t = srch.value.trim().toLowerCase();
        host.querySelectorAll('tbody tr[data-row]').forEach((tr) => { tr.style.display = !t || tr.querySelector('.sc-nm').textContent.toLowerCase().includes(t) ? '' : 'none'; });
      });
      host.querySelectorAll('input.sc-h').forEach((inp) => {
        inp.addEventListener('change', () => onHeader(inp));
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); inp.blur(); } });
      });
      host.querySelectorAll('[data-dc]').forEach((b) => b.addEventListener('click', () => deleteCol(b.dataset.dc)));
      host.querySelectorAll('[data-lead]').forEach((b) => b.addEventListener('click', () => editorDialog(b.dataset.lead)));
      host.querySelectorAll('.sc-cell input').forEach((inp) => {
        inp.addEventListener('change', () => onCell(inp));
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); focusBelow(inp); } });
        inp.addEventListener('focus', () => inp.select());
      });
    }

    function focusBelow(inp) {
      const tr = inp.closest('tr').nextElementSibling;
      if (!tr) return;
      const n = tr.querySelector(`input[data-col="${inp.dataset.col}"]`);
      if (n) n.focus();
    }

    /* ---------- editing a cell ---------- */
    async function onCell(inp) {
      if (S.onActivity) S.onActivity();
      const row = S.rows.find((r) => r.uid === inp.dataset.uid);
      const col = cols().find((c) => c.id === inp.dataset.col);
      if (!row || !col) return;
      const old = row.s && row.s[col.id] != null ? row.s[col.id] : null;
      const raw = inp.value.trim();
      let val = raw === '' ? null : Number(raw);
      if (val !== null && (!isFinite(val) || val < 0 || val > Number(col.max))) {
        toast(`ពិន្ទុត្រូវនៅចន្លោះ ០ ដល់ ${fmt(col.max)}`, 'warning');
        inp.value = old == null ? '' : old;
        return;
      }
      if (val !== null) val = r2(val);
      if (val === old) return;
      inp.classList.add('saving');
      try {
        await api().setCell(S.cls.id, S.mid, row.uid, col.id, val, old, col.label, row.name, expiryFor(S.cls, S.mid));
        row.s = row.s || {};
        if (val === null) delete row.s[col.id]; else row.s[col.id] = val;
        const t = host.querySelector(`[data-tot="${CSS.escape(row.uid)}"]`);
        if (t) t.textContent = fmt(rowTotal(row, cols()));
        const tf = host.querySelector('.sc-table tfoot');
        if (tf) tf.innerHTML = footHtml();
        inp.classList.remove('saving');
        inp.classList.add('saved');
        setTimeout(() => inp.classList.remove('saved'), 900);
      } catch (e) {
        inp.classList.remove('saving');
        inp.value = old == null ? '' : old;
        toast(e.code === 'permission-denied' ? 'គ្មានសិទ្ធិកែ (ខែអាចត្រូវបានបិទ)' : (e.message || 'រក្សាទុកមិនបាន'), 'error');
      }
    }

    /* ---------- teacher actions ---------- */
    function newMonthDialog() {
      const now = new Date();
      const cur = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const last = S.months.length ? S.months[S.months.length - 1] : null;
      const m = modal(`
        <h3>ខែថ្មី</h3>
        <label class="acc-field"><span>ជ្រើសខែ</span><input type="month" id="sc-m" value="${cur}"></label>
        ${last && (last.cols || []).length ? `<label class="sc-check"><input type="checkbox" id="sc-copy" checked> ចម្លងសកម្មភាពពី ${esc(last.label || monthLabel(last.id))} (កែបន្ថែម/ដកចេញបានក្រោយ)</label>` : ''}
        <p class="acc-err"></p>
        <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>បង្កើត</button></div>`);
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      m.querySelector('[data-ok]').addEventListener('click', async () => {
        const id = m.querySelector('#sc-m').value;
        const err = m.querySelector('.acc-err');
        if (!/^\d{4}-\d{2}$/.test(id)) { err.textContent = 'សូមជ្រើសខែ'; return; }
        if (S.months.some((x) => x.id === id)) { err.textContent = 'ខែនេះមានរួចហើយ'; return; }
        const copy = m.querySelector('#sc-copy');
        const data = { label: monthLabel(id), cols: copy && copy.checked ? (last.cols || []).map((c) => Object.assign({}, c)) : blankCols(BLANK_COLS), locked: false };
        const exp = expiryFor(S.cls, id);
        if (exp) data.expireAt = exp;
        m.dataset.busy = '1';
        m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        try {
          await api().saveMonth(S.cls.id, id, data);
          m.remove();
          await load(id);
        } catch (e) { delete m.dataset.busy; err.textContent = e.message; m.querySelectorAll('button').forEach((b) => { b.disabled = false; }); }
      });
    }

    async function addCol() {
      const next = cols().map((c) => Object.assign({}, c)).concat(blankCols(1));
      try { await api().saveMonth(S.cls.id, S.mid, { cols: next }); month().cols = next; paint(); }
      catch (e) { toast(e.message, 'error'); }
    }

    /* header cell edited in place: name, day/section, max score */
    async function onHeader(inp) {
      const c = cols().find((x) => x.id === inp.dataset.hc);
      if (!c) return;
      const f = inp.dataset.f;
      const old = c[f];
      let v = inp.value.trim();
      if (f === 'max') {
        v = Number(v);
        if (!(v > 0) || v > 1000) { toast('ពិន្ទុអតិបរមាមិនត្រឹមត្រូវ', 'warning'); inp.value = old; return; }
        const others = S.months.filter((x) => x.id !== S.mid).reduce((a, x) => a + colMaxSum(x.cols || []), 0);
        const trial = cols().map((x) => (x.id === c.id ? Object.assign({}, x, { max: v }) : x));
        if (r2(others + colMaxSum(trial)) > capOf(S.cls) && !confirm(`ពិន្ទុអតិបរមាសរុបគ្រប់ខែនឹងលើសកម្រិត ${fmt(capOf(S.cls))}។ សិស្សនឹងបានតែ ${fmt(capOf(S.cls))} ជាអតិបរមា។ បន្តទេ?`)) { inp.value = old; return; }
      }
      if (v === old) return;
      const next = cols().map((x) => (x.id === c.id ? Object.assign({}, x, { [f]: v }) : Object.assign({}, x)));
      inp.classList.add('saving');
      try {
        await api().saveMonth(S.cls.id, S.mid, { cols: next });
        month().cols = next;
        inp.classList.remove('saving');
        inp.classList.add('saved');
        setTimeout(() => inp.classList.remove('saved'), 900);
        if (f === 'max') {
          host.querySelectorAll(`.sc-cell input[data-col="${CSS.escape(c.id)}"]`).forEach((x) => { x.max = v; });
          const h = host.querySelector('.sc-hint');
          if (h) h.outerHTML = hintHtml();
        }
      } catch (e) {
        inp.classList.remove('saving');
        inp.value = old == null ? '' : old;
        toast(e.message || 'រក្សាទុកមិនបាន', 'error');
      }
    }

    async function deleteCol(id) {
      const c = cols().find((x) => x.id === id);
      if (!c || !confirm(`លុបជួរ «${c.label || 'គ្មានឈ្មោះ'}»? ពិន្ទុដែលបានដាក់ក្នុងជួរនេះនឹងលែងរាប់។`)) return;
      const next = cols().filter((x) => x.id !== id);
      try { await api().saveMonth(S.cls.id, S.mid, { cols: next }); month().cols = next; paint(); }
      catch (e) { toast(e.message, 'error'); }
    }

    async function toggleLock() {
      const next = !locked();
      if (next && !confirm('បិទខែនេះ? ប្រធាន/អនុប្រធានថ្នាក់នឹងមិនអាចកែពិន្ទុបានទៀតទេ។')) return;
      try { await api().saveMonth(S.cls.id, S.mid, { locked: next }); month().locked = next; paint(); }
      catch (e) { toast(e.message, 'error'); }
    }

    async function deleteMonth() {
      const m = month();
      if (!m || !confirm(`លុប «${m.label || monthLabel(m.id)}» ព្រមទាំងពិន្ទុទាំងអស់ក្នុងខែនេះ? មិនអាចយកមកវិញបានទេ។`)) return;
      try { await api().deleteMonth(S.cls.id, S.mid); await load(); }
      catch (e) { toast(e.message, 'error'); }
    }

    async function saveCfg() {
      const t = Number(host.querySelector('#sc-total').value);
      const p = Number(host.querySelector('#sc-pct').value);
      const k = Math.round(Number(host.querySelector('#sc-keep').value));
      const ta = Number(host.querySelector('#sc-ta').value);
      const tb = Number(host.querySelector('#sc-tb').value);
      if (!(t > 0) || !(p > 0 && p <= 100) || !(k >= 0 && k <= 120) || !(ta > 0 && ta <= 100) || !(tb > 0 && tb < ta)) { toast('តម្លៃមិនត្រឹមត្រូវ (B ត្រូវតូចជាង A)', 'warning'); return; }
      try {
        await api().setClassScoreConfig(S.cls.id, t, p, k, ta, tb);
        const keepChanged = k !== keepOf(S.cls);
        S.cls.scoreTotal = t; S.cls.scorePct = p; S.cls.scoreKeep = k; S.cls.scoreA = ta; S.cls.scoreB = tb;
        if (keepChanged && S.months.length) await api().restampExpiry(S.cls.id, S.months, (id) => expiryFor(S.cls, id));
        toast('✅ បានរក្សាទុក', 'success');
        paint();
      } catch (e) { toast(e.message, 'error'); }
    }

    function editorDialog(uid) {
      const st = S.students.find((x) => x.uid === uid);
      if (!st) return;
      const on = st.editorOn === true;
      const m = modal(`
        <h3>🔑 ពាក្យសម្ងាត់កែពិន្ទុ</h3>
        <p class="acc-muted"><b>${esc(st.name)}</b> ${on ? '— មានសិទ្ធិកែពិន្ទុរួចហើយ' : '— មិនទាន់មានសិទ្ធិកែពិន្ទុ'}</p>
        <p class="acc-muted">ពាក្យសម្ងាត់នេះ<b>ខុសពី ID/លេខសម្ងាត់ចូលប្រើ</b> មិនមានលើសន្លឹក ID ទេ។ ប្រធាន/អនុប្រធានវាយវារាល់ពេលចង់កែពិន្ទុ ហើយអាចកែបានតែក្នុងថ្នាក់នេះ។ សូមប្រាប់គាត់ដោយផ្ទាល់។</p>
        <label class="acc-field"><span>${on ? 'ពាក្យសម្ងាត់ថ្មី (ជំនួសរបស់ចាស់)' : 'កំណត់ពាក្យសម្ងាត់ (យ៉ាងតិច ៦ តួ)'}</span><input id="sc-ep" type="text" autocomplete="off" maxlength="30"></label>
        <p class="acc-err"></p>
        <div class="acc-modal-actions">
          <button class="acc-btn ghost" data-x>បិទ</button>
          ${on ? '<button class="acc-btn ghost" data-rm>ដកសិទ្ធិ</button>' : ''}
          <button class="acc-btn" data-ok>${on ? 'ប្តូរពាក្យសម្ងាត់' : 'បើកសិទ្ធិ'}</button>
        </div>`);
      const err = m.querySelector('.acc-err');
      const busy = (v) => { if (v) m.dataset.busy = '1'; else delete m.dataset.busy; m.querySelectorAll('button').forEach((x) => { x.disabled = v; }); };
      m.querySelector('#sc-ep').focus();
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      m.querySelector('[data-ok]').addEventListener('click', async () => {
        const pw = m.querySelector('#sc-ep').value.trim();
        if (pw.length < 6) { err.textContent = 'យ៉ាងតិច ៦ តួ'; return; }
        busy(true);
        try {
          Object.assign(st, await api().setEditorPassword(st, pw));
          m.remove();
          toast(`✅ បានកំណត់ពាក្យសម្ងាត់កែពិន្ទុឱ្យ ${st.name}`, 'success');
          paint();
        } catch (e) { busy(false); err.textContent = e.message; }
      });
      const rm = m.querySelector('[data-rm]');
      if (rm) rm.addEventListener('click', async () => {
        if (!confirm(`ដកសិទ្ធិកែពិន្ទុរបស់ ${st.name}?`)) return;
        busy(true);
        try { await api().removeEditor(st); st.editorOn = false; m.remove(); paint(); }
        catch (e) { busy(false); err.textContent = e.message; }
      });
    }

    function fillDialog(colId) {
      const c = cols().find((x) => x.id === colId);
      if (!c || !editableNow()) return;
      const m = modal(`
        <h3>⚡ ដាក់ពិន្ទុដូចគ្នាឱ្យទាំងថ្នាក់</h3>
        <p class="acc-muted">សកម្មភាព ៖ <b>${esc(colName(c, cols().indexOf(c)))}</b> (អតិបរមា ${fmt(c.max)}) — ${kh(S.rows.length)} នាក់។ ពិន្ទុដែលមានរួចក្នុងជួរនេះនឹងត្រូវជំនួស។</p>
        <label class="acc-field"><span>ពិន្ទុ (ទុកទទេ = សម្អាតទាំងជួរ)</span><input id="sc-fv" type="number" min="0" max="${c.max}" step="0.25" value="${c.max}"></label>
        <p class="acc-err"></p>
        <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>អនុវត្ត</button></div>`);
      const inp = m.querySelector('#sc-fv');
      inp.focus(); inp.select();
      const err = m.querySelector('.acc-err');
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      m.querySelector('[data-ok]').addEventListener('click', async () => {
        const raw = inp.value.trim();
        const v = raw === '' ? null : r2(Number(raw));
        if (v !== null && (!isFinite(v) || v < 0 || v > Number(c.max))) { err.textContent = `ពិន្ទុត្រូវនៅចន្លោះ ០ ដល់ ${fmt(c.max)}`; return; }
        if (!confirm(v === null ? 'សម្អាតពិន្ទុទាំងជួរនេះ?' : `ដាក់ ${fmt(v)} ឱ្យសិស្ស ${kh(S.rows.length)} នាក់?`)) return;
        m.dataset.busy = '1';
        m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        try {
          if (S.onActivity) S.onActivity();
          await api().setColumnAll(S.cls.id, S.mid, c.id, v, S.rows.map((r) => r.uid), c.label, expiryFor(S.cls, S.mid));
          S.rows.forEach((r) => { r.s = r.s || {}; if (v === null) delete r.s[c.id]; else r.s[c.id] = v; });
          m.remove();
          paint();
        } catch (e) {
          delete m.dataset.busy;
          err.textContent = e.code === 'permission-denied' ? 'គ្មានសិទ្ធិកែ (ខែអាចត្រូវបានបិទ)' : (e.message || 'រក្សាទុកមិនបាន');
          m.querySelectorAll('button').forEach((b) => { b.disabled = false; });
        }
      });
    }

    /* ---------- print (A5 / A4 from the app's paper setting) ---------- */
    function printSheet() {
      const paper = (window.App && App.getPaperSize && App.getPaperSize()) || 'A5';
      let head, rowsHtml, title;
      if (S.view === 'summary') {
        const data = summaryData();
        head = `<th>ល.រ</th><th class="nm">ឈ្មោះ</th>${S.months.map((m) => `<th>${esc(m.label || monthLabel(m.id))}<br><small>/${fmt(colMaxSum(m.cols || []))}</small></th>`).join('')}<th>សរុប</th><th>គិតយក</th>`;
        rowsHtml = data.map((d, i) => `<tr><td>${kh(i + 1)}</td><td class="nm">${esc(d.e.name)}</td>${S.months.map((m) => `<td>${d.e.t[m.id] == null ? '' : fmt(d.e.t[m.id])}</td>`).join('')}<td><b>${fmt(d.sum)}</b></td><td><b>${fmt(d.used)}</b></td></tr>`).join('');
        title = `សរុបពិន្ទុសកម្មភាពគ្រប់ខែ · ថ្នាក់ ${esc(S.cls.name)}`;
      } else {
        const cs = cols();
        head = `<th>ល.រ</th><th class="nm">ឈ្មោះ</th>${cs.map((c, i) => `<th>${esc(colName(c, i))}<br><small>${c.day ? esc(c.day) + ' · ' : ''}/${fmt(c.max)}</small></th>`).join('')}<th>សរុប</th>`;
        rowsHtml = viewRows().map((r) => `<tr><td>${kh(S.rows.indexOf(r) + 1)}</td><td class="nm">${esc(r.name)}</td>${cs.map((c) => `<td>${r.s && r.s[c.id] != null ? fmt(r.s[c.id]) : ''}</td>`).join('')}<td><b>${fmt(rowTotal(r, cs))}</b></td></tr>`).join('');
        const mm = month();
        title = `ពិន្ទុសកម្មភាព · ថ្នាក់ ${esc(S.cls.name)} · ${esc((mm && mm.label) || monthLabel(S.mid))}`;
      }
      const wide = (S.view === 'summary' ? S.months.length + 4 : cols().length + 3) > 6;
      let box = document.getElementById('sc-print');
      if (!box) { box = document.createElement('div'); box.id = 'sc-print'; document.body.appendChild(box); }
      let st = document.getElementById('sc-print-style');
      if (!st) { st = document.createElement('style'); st.id = 'sc-print-style'; document.head.appendChild(st); }
      st.textContent = `
        #sc-print { display: none; }
        @media print {
          @page { size: ${paper} ${wide ? 'landscape' : 'portrait'}; margin: 8mm; }
          body.printing-scores > *:not(#sc-print) { display: none !important; }
          body.printing-scores { background: #fff !important; padding: 0 !important; zoom: 1 !important; }
          body.printing-scores #sc-print { display: block !important; color: #000; font-family: var(--font-khmer, 'Khmer OS', sans-serif); }
          #sc-print h2 { margin: 0 0 4mm; font-size: 12pt; }
          #sc-print table { width: 100%; border-collapse: collapse; table-layout: auto; font-size: ${paper === 'A5' ? '8.5' : '10'}pt; }
          #sc-print th, #sc-print td { border: 0.4mm solid #000; padding: 1mm 1.5mm; text-align: center; overflow-wrap: anywhere; }
          #sc-print th.nm, #sc-print td.nm { text-align: left; }
          #sc-print thead { display: table-header-group; }
          #sc-print tr { break-inside: avoid; }
          #sc-print small { font-weight: 400; font-size: 0.85em; }
        }`;
      box.innerHTML = `<h2>${title}</h2><table><thead><tr>${head}</tr></thead><tbody>${rowsHtml}</tbody></table>`;
      document.body.classList.add('printing-scores');
      const done = () => { document.body.classList.remove('printing-scores'); window.removeEventListener('afterprint', done); };
      window.addEventListener('afterprint', done);
      setTimeout(() => { window.print(); setTimeout(done, 60000); }, 60);
    }

    function renameDialog() {
      const list = S.students.slice().sort((a, b) => (a.seq || 0) - (b.seq || 0));
      const m = modal(`
        <h3>✏️ កែឈ្មោះសិស្សទាំងថ្នាក់</h3>
        <p class="acc-muted">បិទភ្ជាប់ឈ្មោះពី Excel <b>តាមលំដាប់ដូចក្នុងតារាង</b> (ជួរលេខរៀង និងឈ្មោះក៏បាន ប្រព័ន្ធលុបលេខរៀងចេញ)។ ID និងលេខសម្ងាត់មិនប្តូរទេ។ ចំនួនឈ្មោះត្រូវស្មើចំនួនសិស្ស <b>${kh(list.length)}</b> នាក់។</p>
        <textarea id="sc-rn" rows="9" placeholder="កែវ មុនីសត្រា&#10;ជា ប្រសិទ្ធិ"></textarea>
        <p class="sc-rn-count acc-muted">០ ឈ្មោះ</p>
        <p class="acc-err"></p>
        <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>កែឈ្មោះ</button></div>`);
      const ta = m.querySelector('#sc-rn');
      const err = m.querySelector('.acc-err');
      ta.focus();
      ta.addEventListener('input', () => { m.querySelector('.sc-rn-count').textContent = `${kh(parseNames(ta.value).length)} ឈ្មោះ`; });
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      m.querySelector('[data-ok]').addEventListener('click', async () => {
        const names = parseNames(ta.value);
        if (names.length !== list.length) { err.textContent = `ចំនួនមិនស្មើ ៖ មាន ${kh(names.length)} ឈ្មោះ ប៉ុន្តែមានសិស្ស ${kh(list.length)} នាក់`; return; }
        if (!confirm(`ប្តូរឈ្មោះសិស្ស ${kh(list.length)} នាក់ តាមលំដាប់ក្នុងបញ្ជី? (សិស្សទី ១ = «${names[0]}»)`)) return;
        const pairs = list.map((s, i) => ({ uid: s.uid, name: names[i] }));
        m.dataset.busy = '1';
        m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        try {
          await api().renameStudents(S.cls.id, S.months.map((x) => x.id), pairs);
          pairs.forEach((p) => { const st = S.students.find((x) => x.uid === p.uid); if (st) st.name = p.name; });
          S.rows.forEach((r) => { const p = pairs.find((x) => x.uid === r.uid); if (p) r.name = p.name; });
          m.remove();
          toast('✅ បានកែឈ្មោះរួចរាល់', 'success');
          paint();
        } catch (e) { delete m.dataset.busy; err.textContent = e.message || e.code; m.querySelectorAll('button').forEach((b) => { b.disabled = false; }); }
      });
    }

    async function showLog() {
      const m = modal('<h3>🕘 ប្រវត្តិកែពិន្ទុ</h3><div class="sc-log"><div class="acc-spin"></div></div><div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បិទ</button></div>');
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      try {
        const list = await api().listLog(S.cls.id, S.mid, 100);
        const d = (ms) => { if (!ms) return ''; const t = new Date(ms); return `${kh(t.getDate())}/${kh(t.getMonth() + 1)} ${kh(String(t.getHours()).padStart(2, '0'))}:${kh(String(t.getMinutes()).padStart(2, '0'))}`; };
        m.querySelector('.sc-log').innerHTML = list.length ? `<table class="acc-table"><thead><tr><th>ពេល</th><th>អ្នកកែ</th><th>សិស្ស</th><th>សកម្មភាព</th><th>ពី → ទៅ</th></tr></thead><tbody>${list.map((x) => `<tr><td>${d(x.at)}</td><td>${esc(x.byName)}</td><td>${esc(x.rowName)}</td><td>${esc(x.colLabel)}</td><td>${x.from == null ? '—' : fmt(x.from)} → ${x.to == null ? '—' : fmt(x.to)}</td></tr>`).join('')}</tbody></table>` : '<p class="acc-muted">មិនទាន់មានការកែ</p>';
      } catch (e) { m.querySelector('.sc-log').innerHTML = `<p class="acc-err">${esc(e.message)}</p>`; }
    }

    /* ---------- member (own scores) ---------- */
    async function paintMember() {
      host.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
      try {
        const rows = await Promise.all(S.months.map((m) => api().myRow(S.cls.id, m.id)));
        const cap = capOf(S.cls);
        let grand = 0;
        let den = 0;
        const cards = S.months.map((m, i) => {
          const r = rows[i];
          const cs = (m.cols || []).filter((c) => (c.label && c.label.trim()) || (r && r.s && r.s[c.id] != null));
          const tot = rowTotal(r, m.cols || []);
          grand += tot;
          den += colMaxSum(cs);
          return `<section class="sc-card">
            <h4>${esc(m.label || monthLabel(m.id))}</h4>
            ${cs.length ? `<ul>${cs.map((c) => { const v = r && r.s ? r.s[c.id] : null; return `<li><span>${esc(colName(c, 0))}${c.day ? ` <small>${esc(c.day)}</small>` : ''}</span><b>${v == null ? '—' : fmt(v)} <small>/ ${fmt(c.max)}</small></b></li>`; }).join('')}</ul>` : '<p class="acc-muted">មិនទាន់មានសកម្មភាព</p>'}
            <div class="sc-card-tot"><span>សរុបខែនេះ</span><b>${fmt(tot)} <small>/ ${fmt(colMaxSum(cs))}</small></b></div>
          </section>`;
        }).join('');
        const lv = levelOf(S.cls, grand, den);
        const me = (window.Cloud && Cloud.profile && Cloud.profile()) || {};
        host.innerHTML = `<div class="sc sc-member">
          <div class="sc-me">
            <div><b>${esc(me.name || '')}</b><small>ថ្នាក់ ${esc(me.className || S.cls.name || '')}</small></div>
            ${lv ? `<button class="sc-msg-btn lv-${lv}" data-a="msg">${LEVELS[lv].icon} សារសម្រាប់អ្នក</button>` : ''}
          </div>
          <div class="sc-grand"><span>ពិន្ទុសកម្មភាពសរុប</span><b>${fmt(Math.min(grand, cap))}</b><small>អតិបរមា ${fmt(cap)} (${kh(pctOf(S.cls))}% នៃ ${fmt(totalOf(S.cls))})</small></div>
          ${cards || '<div class="acc-center small"><p class="acc-muted">មិនទាន់មានពិន្ទុ</p></div>'}
        </div>`;
        const mb = host.querySelector('[data-a="msg"]');
        if (mb) mb.addEventListener('click', () => {
          const L = LEVELS[lv];
          const pct = Math.round((grand / den) * 100);
          const m = modal(`
            <div class="sc-msg lv-${lv}">
              <div class="sc-msg-ico">${L.icon}</div>
              <h3>${L.title}</h3>
              <p>${L.msg}</p>
              <small>ពិន្ទុរបស់អ្នក ${fmt(grand)} / ${fmt(den)} (${kh(pct)}%)</small>
            </div>
            <div class="acc-modal-actions"><button class="acc-btn" data-x>យល់ហើយ</button></div>`);
          m.querySelector('[data-x]').addEventListener('click', () => m.remove());
        });
      } catch (e) { host.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p>`; }
    }

    /* ---------- summary over all months ---------- */
    async function openSummary() {
      S.view = 'summary';
      host.innerHTML = '<div class="acc-center small"><div class="acc-spin"></div></div>';
      try {
        const per = [];
        for (const m of S.months) per.push(S.mode === 'member' ? [await api().myRow(S.cls.id, m.id)].filter(Boolean) : await api().listRows(S.cls.id, m.id));
        const by = new Map();
        S.months.forEach((m, mi) => per[mi].forEach((r) => {
          const e = by.get(r.uid) || { uid: r.uid, name: r.name, seq: r.seq || 0, t: {} };
          e.t[m.id] = rowTotal(r, m.cols || []);
          by.set(r.uid, e);
        }));
        S.summary = Array.from(by.values()).sort((a, b) => a.seq - b.seq || String(a.name).localeCompare(String(b.name), 'km'));
        paintSummary();
      } catch (e) { S.view = 'month'; host.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p>`; }
    }

    function summaryData() {
      const cap = capOf(S.cls);
      return S.summary.map((e) => {
        const sum = r2(S.months.reduce((a, m) => a + (e.t[m.id] || 0), 0));
        return { e, sum, used: Math.min(sum, cap) };
      });
    }

    function paintSummary() {
      const cap = capOf(S.cls);
      const data = summaryData();
      host.innerHTML = `<div class="sc">
        <div class="sc-bar"><button class="acc-btn ghost sm" data-a="back">← ត្រឡប់</button><button class="acc-btn ghost sm" data-a="print">🖨️ បោះពុម្ព</button><button class="acc-btn ghost sm" data-a="csv">⬇️ Excel</button></div>
        <p class="sc-hint">ពិន្ទុសកម្មភាពអតិបរមា <b>${fmt(cap)}</b> (${kh(pctOf(S.cls))}% នៃ ${fmt(totalOf(S.cls))})។ «គិតយក» មិនលើសកម្រិតនេះទេ។</p>
        <div class="acc-table-wrap sc-wrap"><table class="acc-table sc-table">
          <thead><tr><th class="sc-n">ល.រ</th><th class="sc-nm">ឈ្មោះ</th>${S.months.map((m) => `<th>${esc(m.label || monthLabel(m.id))}<small>/${fmt(colMaxSum(m.cols || []))}</small></th>`).join('')}<th class="sc-tot">សរុប</th><th class="sc-tot">គិតយក</th></tr></thead>
          <tbody>${data.map((d, i) => `<tr><td class="sc-n">${kh(i + 1)}</td><td class="sc-nm">${esc(d.e.name)}</td>${S.months.map((m) => `<td>${d.e.t[m.id] == null ? '—' : fmt(d.e.t[m.id])}</td>`).join('')}<td class="sc-tot">${fmt(d.sum)}</td><td class="sc-tot">${fmt(d.used)}</td></tr>`).join('')}</tbody>
        </table></div></div>`;
      host.querySelector('[data-a="back"]').addEventListener('click', () => { S.view = 'month'; paint(); });
      host.querySelector('[data-a="csv"]').addEventListener('click', exportCsv);
      host.querySelector('[data-a="print"]').addEventListener('click', printSheet);
    }

    /* ---------- CSV (opens in Excel, Khmer-safe with BOM) ---------- */
    function exportCsv() {
      const q = (v) => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
      const lines = [];
      let name;
      if (S.view === 'summary') {
        lines.push(['ល.រ', 'ឈ្មោះ'].concat(S.months.map((m) => m.label || monthLabel(m.id)), ['សរុប', 'គិតយក']).map(q).join(','));
        summaryData().forEach((d, i) => lines.push([i + 1, d.e.name].concat(S.months.map((m) => d.e.t[m.id] == null ? '' : d.e.t[m.id]), [d.sum, d.used]).map(q).join(',')));
        name = `${S.cls.name}_សរុបគ្រប់ខែ`;
      } else {
        const cs = cols();
        lines.push(['ល.រ', 'ឈ្មោះ'].concat(cs.map((c, i) => `${colName(c, i)} (/${c.max})`), ['សរុប']).map(q).join(','));
        viewRows().forEach((r, i) => lines.push([i + 1, r.name].concat(cs.map((c) => r.s && r.s[c.id] != null ? r.s[c.id] : ''), [rowTotal(r, cs)]).map(q).join(',')));
        name = `${S.cls.name}_${S.mid}`;
      }
      const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `ពិន្ទុសកម្មភាព_${name}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    }

    load();
    return { reload: load };
  }

  /* ----- teacher: mounted in the dashboard tab ----- */
  function mountTeacher(host, cls, students) {
    return Sheet(host, { cls, mode: 'teacher', students });
  }

  /* ----- student / class leader: full-screen page ----- */
  let overlay = null;
  let idleTimer = null;
  const IDLE_MS = 20 * 60 * 1000;

  function lockEditing() {
    clearTimeout(idleTimer);
    if (window.Cloud && Cloud.scoresApi) Cloud.scoresApi().editorSignOut();
  }

  async function openStudent() {
    const p = Cloud.profile();
    if (!p || p.role !== 'student') return;
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'acc sc-overlay';
      overlay.id = 'scores-overlay';
      document.body.appendChild(overlay);
    }
    overlay.classList.add('open');
    lockEditing(); // always start read-only: the edit password is asked every time
    let cls = null;

    const close = () => { lockEditing(); overlay.classList.remove('open'); };

    function paintShell(editing) {
      overlay.innerHTML = `
        <header class="acc-top">
          <button class="acc-icon" data-a="close" title="ត្រឡប់"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
          <div class="acc-title"><b>📊 ពិន្ទុសកម្មភាព${editing ? ' · កំពុងកែ' : ''}</b><small>${esc(p.name)} · ថ្នាក់ ${esc(p.className || '')}</small></div>
          ${p.editorOn ? (editing ? '<button class="acc-btn ghost sm" data-a="lock">🔒 ចាក់សោ</button>' : '<button class="acc-btn sm" data-a="edit">🔑 កែពិន្ទុថ្នាក់</button>') : ''}
        </header>
        <main class="acc-main sc-body"><div class="acc-center small"><div class="acc-spin"></div></div></main>`;
      overlay.querySelector('[data-a="close"]').addEventListener('click', close);
      const lk = overlay.querySelector('[data-a="lock"]');
      if (lk) lk.addEventListener('click', () => { lockEditing(); show(false); });
      const ed = overlay.querySelector('[data-a="edit"]');
      if (ed) ed.addEventListener('click', askPassword);
      return overlay.querySelector('.sc-body');
    }

    function show(editing) {
      const body = paintShell(editing);
      if (editing) {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => { lockEditing(); toast('🔒 ចាក់សោការកែដោយស្វ័យប្រវត្តិ (អស់ ២០ នាទី)', 'info'); show(false); }, IDLE_MS);
      }
      Sheet(body, { cls, mode: editing ? 'leader' : 'member', students: [], modal: () => overlay, onActivity: editing ? () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => { lockEditing(); show(false); }, IDLE_MS); } : null });
    }

    function askPassword() {
      const m = document.createElement('div');
      m.className = 'acc-modal';
      m.innerHTML = `<div class="acc-modal-card">
        <h3>🔑 ពាក្យសម្ងាត់កែពិន្ទុ</h3>
        <p class="acc-muted">វាយពាក្យសម្ងាត់ដែលលោកគ្រូបានផ្តល់ឱ្យ (មិនមែនលេខសម្ងាត់ចូលប្រើទេ)</p>
        <label class="acc-field"><span>ពាក្យសម្ងាត់កែពិន្ទុ</span><input id="sc-pw" type="password" autocomplete="off"></label>
        <p class="acc-err"></p>
        <div class="acc-modal-actions"><button class="acc-btn ghost" data-x>បោះបង់</button><button class="acc-btn" data-ok>បើកការកែ</button></div></div>`;
      overlay.appendChild(m);
      const inp = m.querySelector('#sc-pw');
      inp.focus();
      m.querySelector('[data-x]').addEventListener('click', () => m.remove());
      const go = async () => {
        const err = m.querySelector('.acc-err');
        err.textContent = '';
        m.querySelectorAll('button').forEach((b) => { b.disabled = true; });
        try {
          await api().editorSignIn(inp.value);
          m.remove();
          show(true);
        } catch (e) {
          err.textContent = e.message;
          m.querySelectorAll('button').forEach((b) => { b.disabled = false; });
        }
      };
      m.querySelector('[data-ok]').addEventListener('click', go);
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    }

    const body = paintShell(false);
    try {
      cls = await api().myClass();
      if (!cls) throw new Error('រកមិនឃើញថ្នាក់');
      Sheet(body, { cls, mode: 'member', students: [], modal: () => overlay });
    } catch (e) {
      body.innerHTML = `<p class="acc-err">⚠️ ${esc(e.message || e.code)}</p>`;
    }
  }

  window.Scores = { mountTeacher, openStudent, parseNames };
})();
