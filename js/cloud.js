/* ==========================================================================
   Cloud — thin wrapper around Firebase Auth + Firestore
   All Firebase-specific code lives here; the rest of the app only calls
   window.Cloud.*. Inactive (Cloud.enabled === false) until
   window.FIREBASE_CONFIG is filled in js/firebase-config.js.

   Data model
     users/{uid}                 { role: 'admin'|'teacher'|'student', name, loginId,
                                   classId?, className?, grade?, teacherUid?, pw?, active }
     users/{uid}/results/{rid}   student's own copy of each result
     classes/{cid}               { name, grade, teacherUid, teacherName, createdAt }
     classes/{cid}/results/{rid} copy read by the class teacher
   ========================================================================== */
(function () {
  'use strict';

  const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const cfg = window.FIREBASE_CONFIG;
  const DOMAIN = window.WS_ID_DOMAIN || {};
  const PROFILE_CACHE = 'ws_cloud_profile';

  let app = null, auth = null, db = null, secondary = null, editorDb = null;
  let profile = null;
  let readyPromise = null;
  const listeners = [];

  const Cloud = {
    enabled: !!(cfg && cfg.apiKey && cfg.projectId),
    profile: () => profile,
    cachedProfile() {
      try { return JSON.parse(localStorage.getItem(PROFILE_CACHE) || 'null'); } catch (e) { return null; }
    },
    isStudent: () => !!(profile && profile.role === 'student'),
    isTeacher: () => !!(profile && (profile.role === 'teacher' || profile.role === 'admin')),
    isAdmin: () => !!(profile && profile.role === 'admin'),
    onChange(cb) { listeners.push(cb); },
    ready,
    signIn,
    signOut,
    listClasses,
    createClass,
    deleteClass,
    listStudents,
    createStudents,
    setStudentActive,
    listTeachers,
    createTeacher,
    saveResult,
    myResults,
    classResults,
    pendingCount,
    flushOutbox,
    recordTeacherUsage,
    flushTeacherUsage,
    listTeacherUsage,
    getMySummary,
    saveMySummary,
    listRoster,
    saveRosterTeacher,
    deleteRosterTeacher,
    hashPin,
    normalizeId,
    scoresApi: () => scoresApi
  };

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error('មិនអាចទាញយក Firebase បានទេ (ពិនិត្យអ៊ីនធឺណិត)'));
      document.head.appendChild(s);
    });
  }

  function emit() {
    listeners.forEach((cb) => { try { cb(profile); } catch (e) { console.warn(e); } });
  }

  function cacheProfile(p) {
    try {
      if (p) localStorage.setItem(PROFILE_CACHE, JSON.stringify(p));
      else localStorage.removeItem(PROFILE_CACHE);
    } catch (e) {}
  }

  /* Load SDK, init, and resolve once the first auth state is known. */
  function ready() {
    if (!Cloud.enabled) return Promise.resolve(null);
    if (readyPromise) return readyPromise;
    readyPromise = (async () => {
      if (!window.firebase || !window.firebase.firestore) {
        await loadScript(SDK + 'firebase-app-compat.js');
        await loadScript(SDK + 'firebase-auth-compat.js');
        await loadScript(SDK + 'firebase-firestore-compat.js');
      }
      app = firebase.initializeApp(cfg);
      auth = firebase.auth();
      db = firebase.firestore();
      await new Promise((resolve) => {
        let first = true;
        auth.onAuthStateChanged(async (user) => {
          if (!user) {
            profile = null;
          } else {
            try {
              const p = await loadProfile(user.uid);
              if (!p || p.active === false) {
                // Account really removed or disabled by the teacher
                profile = null;
                await auth.signOut();
              } else {
                profile = p;
              }
            } catch (e) {
              // Firebase unreachable (no internet / daily limit): keep the
              // student signed in with the last known profile
              console.warn('Cloud: profile unavailable, using cached copy', e);
              const cached = Cloud.cachedProfile();
              profile = cached && cached.uid === user.uid ? cached : null;
            }
          }
          cacheProfile(profile);
          emit();
          if (profile) flushOutbox();
          if (first) { first = false; resolve(); }
        });
      });
      window.addEventListener('online', () => flushOutbox());
      setInterval(() => flushOutbox(), 5 * 60 * 1000);
      return profile;
    })().catch((e) => {
      // SDK could not load (offline): work from the cached profile and
      // try again on the next call
      console.warn('Cloud: offline mode', e);
      readyPromise = null;
      profile = Cloud.cachedProfile();
      emit();
      return profile;
    });
    return readyPromise;
  }

  /* Returns the profile, null if the account has no profile document,
     or throws if Firebase could not be reached (offline / daily quota). */
  async function loadProfile(uid) {
    const snap = await db.collection('users').doc(uid).get();
    if (!snap.exists) return null;
    const d = snap.data();
    return {
      uid,
      role: d.role,
      name: d.name || '',
      loginId: d.loginId || '',
      classId: d.classId || '',
      className: d.className || '',
      grade: d.grade || '',
      editorOn: d.editorOn === true,
      editorVer: d.editorVer || 0,
      active: d.active !== false
    };
  }

  /* Errors worth retrying later (offline, over the daily free quota...) */
  function isTransient(e) {
    const code = String((e && e.code) || '');
    if (!code) return true;
    return /unavailable|resource-exhausted|deadline-exceeded|network|internal|aborted|cancelled/.test(code);
  }

  /* Student IDs are digits; teacher IDs contain letters. */
  function normalizeId(id) {
    return String(id || '').trim().toLowerCase().replace(/\s+/g, '');
  }
  function idToEmail(id) {
    const n = normalizeId(id);
    if (n.includes('@')) return n;
    return /^[0-9]+$/.test(n) ? `s${n}@${DOMAIN.student}` : `${n}@${DOMAIN.teacher}`;
  }

  function friendlyError(e) {
    const code = (e && e.code) || '';
    if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found') || code.includes('invalid-login'))
      return 'ID ឬលេខសម្ងាត់មិនត្រឹមត្រូវ';
    if (code.includes('too-many-requests')) return 'ព្យាយាមច្រើនដងពេក។ សូមរង់ចាំបន្តិច រួចសាកម្តងទៀត';
    if (code.includes('network')) return 'គ្មានអ៊ីនធឺណិត។ សូមពិនិត្យការតភ្ជាប់';
    if (code.includes('permission-denied')) return 'គ្មានសិទ្ធិ (ពិនិត្យ firestore.rules)';
    if (code.includes('resource-exhausted')) return 'ប្រព័ន្ធប្រើលើសកម្រិតឥតគិតថ្លៃសម្រាប់ថ្ងៃនេះ។ សូមសាកម្តងទៀតក្រោយម៉ោង ៣ រសៀល';
    if (code.includes('unavailable')) return 'មិនអាចភ្ជាប់ទៅប្រព័ន្ធបាន។ សូមពិនិត្យអ៊ីនធឺណិត';
    if (code.includes('email-already-in-use')) return 'ID នេះមានរួចហើយ';
    if (code.includes('weak-password')) return 'លេខសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ';
    return (e && e.message) || 'មានបញ្ហា សូមសាកម្តងទៀត';
  }

  async function signIn(id, password) {
    await ready();
    try {
      if (!auth) throw Object.assign(new Error('offline'), { code: 'network' });
      const cred = await auth.signInWithEmailAndPassword(idToEmail(id), String(password || ''));
      let p;
      try { p = await loadProfile(cred.user.uid); }
      catch (e) { await auth.signOut(); throw e; }
      if (!p) { await auth.signOut(); throw new Error('គណនីនេះមិនទាន់មានព័ត៌មានក្នុងប្រព័ន្ធ'); }
      if (p.active === false) { await auth.signOut(); throw new Error('គណនីនេះត្រូវបានផ្អាក។ សូមទាក់ទងលោកគ្រូ'); }
      if (p.role === 'scoreeditor') { await auth.signOut(); throw new Error('ID ឬលេខសម្ងាត់មិនត្រឹមត្រូវ'); }
      profile = p;
      cacheProfile(p);
      emit();
      return p;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }

  async function signOut() {
    editorDb = null;
    try { if (secondary) await secondary.auth().signOut(); } catch (e) {}
    cacheProfile(null);
    profile = null;
    if (auth) await auth.signOut();
    emit();
  }

  /* Second app instance so creating an account does not sign the teacher out. */
  function secondaryAuth() {
    if (!secondary) secondary = firebase.initializeApp(cfg, 'ws-secondary');
    return secondary.auth();
  }
  async function createAuthUser(email, password) {
    const a = secondaryAuth();
    const cred = await a.createUserWithEmailAndPassword(email, password);
    const uid = cred.user.uid;
    await a.signOut();
    return uid;
  }

  const ts = () => firebase.firestore.FieldValue.serverTimestamp();
  const toMillis = (v) => (v && typeof v.toMillis === 'function' ? v.toMillis() : (typeof v === 'number' ? v : 0));

  /* ---------- classes ---------- */
  async function listClasses() {
    await ready();
    let q = db.collection('classes');
    if (!Cloud.isAdmin()) q = q.where('teacherUid', '==', profile.uid);
    const snap = await q.get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data()))
      .sort((a, b) => String(a.name).localeCompare(String(b.name), 'km'));
  }

  async function createClass(name, grade) {
    await ready();
    const ref = await db.collection('classes').add({
      name: String(name).trim().toUpperCase(),
      grade: String(grade || ''),
      teacherUid: profile.uid,
      teacherName: profile.name,
      createdAt: ts()
    });
    return ref.id;
  }

  async function deleteClass(cid) {
    await ready();
    await db.collection('classes').doc(cid).delete();
  }

  /* ---------- students ---------- */
  async function listStudents(cls) {
    await ready();
    let q = db.collection('users').where('classId', '==', cls.id);
    if (!Cloud.isAdmin()) q = q.where('teacherUid', '==', profile.uid);
    const snap = await q.get();
    return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()))
      .sort((a, b) => (a.seq || 0) - (b.seq || 0) || String(a.name).localeCompare(String(b.name), 'km'));
  }

  const rand = (len) => { let s = ''; for (let i = 0; i < len; i++) s += Math.floor(Math.random() * 10); return s; };

  /* names: array of strings. onProgress(done, total). Returns created rows. */
  async function createStudents(cls, names, startSeq, onProgress) {
    await ready();
    const grade = String(cls.grade || '').replace(/\D/g, '') || '0';
    const prefix = grade.padStart(2, '0');
    const out = [];
    for (let i = 0; i < names.length; i++) {
      const name = names[i];
      let loginId = '', uid = '', pw = rand(6);
      for (let attempt = 0; attempt < 6 && !uid; attempt++) {
        loginId = prefix + rand(4);
        try {
          uid = await createAuthUser(idToEmail(loginId), pw);
        } catch (e) {
          if (!String(e.code || '').includes('email-already-in-use')) throw new Error(friendlyError(e));
        }
      }
      if (!uid) throw new Error('បង្កើត ID មិនបាន សូមសាកម្តងទៀត');
      const row = {
        role: 'student',
        name,
        loginId,
        pw,
        classId: cls.id,
        className: cls.name,
        grade: String(cls.grade || ''),
        teacherUid: cls.teacherUid || profile.uid,
        seq: startSeq + i,
        active: true,
        createdAt: ts()
      };
      await db.collection('users').doc(uid).set(row);
      out.push(Object.assign({ uid }, row));
      if (onProgress) onProgress(i + 1, names.length);
    }
    return out;
  }

  async function setStudentActive(uid, active) {
    await ready();
    await db.collection('users').doc(uid).update({ active: !!active });
  }

  /* ---------- teachers (admin) ---------- */
  async function listTeachers() {
    await ready();
    const snap = await db.collection('users').where('role', '==', 'teacher').get();
    return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()));
  }

  async function createTeacher(name, loginId, password) {
    await ready();
    const id = normalizeId(loginId);
    if (!/^[a-z][a-z0-9._-]{2,}$/.test(id)) throw new Error('ID គ្រូត្រូវចាប់ផ្តើមដោយអក្សរ (a-z) យ៉ាងតិច ៣ តួ');
    let uid;
    try { uid = await createAuthUser(idToEmail(id), password); }
    catch (e) { throw new Error(friendlyError(e)); }
    await db.collection('users').doc(uid).set({ role: 'teacher', name, loginId: id, active: true, createdAt: ts() });
    return uid;
  }

  /* ---------- results ---------- */
  /* ---------- outbox: results waiting to be sent ---------- */
  const OUTBOX = 'ws_cloud_outbox';
  function readOutbox() {
    try { return JSON.parse(localStorage.getItem(OUTBOX) || '[]'); } catch (e) { return []; }
  }
  function writeOutbox(list) {
    try { localStorage.setItem(OUTBOX, JSON.stringify(list.slice(-500))); } catch (e) {}
  }
  function newId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  }
  function withTimeout(promise, ms) {
    const timer = new Promise((resolve, reject) => {
      setTimeout(() => reject(Object.assign(new Error('timeout'), { code: 'deadline-exceeded' })), ms);
    });
    return Promise.race([promise, timer]);
  }

  function pendingCount() {
    const uid = profile && profile.uid;
    return readOutbox().filter((x) => x.row.uid === uid).length;
  }

  /* Same document id in both places, so a resend never creates duplicates.
     createdAt is the server arrival time (used by the teacher's date filter
     and incremental download); playedAt is when the student played. */
  function commitRow(item) {
    const row = Object.assign({}, item.row, { createdAt: ts() });
    const batch = db.batch();
    batch.set(db.collection('users').doc(row.uid).collection('results').doc(item.rid), row);
    batch.set(db.collection('classes').doc(row.classId).collection('results').doc(item.rid), row);
    return withTimeout(batch.commit(), 12000);
  }

  let flushing = false;
  async function flushOutbox() {
    if (flushing || !db || !profile || profile.role !== 'student') return 0;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return 0;
    flushing = true;
    let sent = 0;
    try {
      const mine = readOutbox().filter((x) => x.row.uid === profile.uid);
      for (const item of mine) {
        try {
          await commitRow(item);
          writeOutbox(readOutbox().filter((x) => x.rid !== item.rid));
          sent++;
        } catch (e) {
          if (isTransient(e)) break; // still offline / over quota: later
          // Rejected for good (e.g. account disabled): drop it
          writeOutbox(readOutbox().filter((x) => x.rid !== item.rid));
        }
      }
    } finally {
      flushing = false;
    }
    if (sent) emit();
    return sent;
  }

  /* Resolves { sent: true } or { queued: true }; a result is never lost. */
  async function saveResult(type, data) {
    if (!profile) await ready();
    if (!Cloud.isStudent()) throw new Error('not-student');
    const item = {
      rid: newId(),
      row: Object.assign({}, data, {
        type,
        uid: profile.uid,
        name: profile.name,
        loginId: profile.loginId,
        classId: profile.classId,
        className: profile.className,
        playedAt: Date.now()
      })
    };
    if (db) {
      try {
        await commitRow(item);
        flushOutbox();
        return { sent: true };
      } catch (e) {
        if (!isTransient(e)) throw new Error(friendlyError(e));
      }
    }
    writeOutbox(readOutbox().concat([item]));
    return { queued: true };
  }

  async function myResults(limit) {
    await ready();
    const snap = await db.collection('users').doc(profile.uid).collection('results')
      .orderBy('createdAt', 'desc').limit(limit || 50).get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data(), { createdAt: toMillis(d.data().createdAt) }));
  }

  /* ---------- student's own Box Calculation summary ----------
     users/{uid}/meta/boxcalc: one small doc (totals, medals, best per level,
     last games) so a student sees their record on any device for 1 read.
     Returns { doc, exists } or null when offline; a summary that could not
     be saved is kept locally (dirty) and sent first next time. */
  const sumKey = () => 'ws_sum_' + (profile && profile.uid);
  function readLocalSum() { try { return JSON.parse(localStorage.getItem(sumKey()) || 'null'); } catch (e) { return null; } }
  function writeLocalSum(s, dirty) { try { localStorage.setItem(sumKey(), JSON.stringify({ data: s, dirty: !!dirty })); } catch (e) {} }

  async function getMySummary() {
    await ready();
    if (!Cloud.isStudent()) return null;
    const local = readLocalSum();
    if (local && local.dirty && local.data) {
      try { await saveMySummary(local.data); } catch (e) { return { doc: local.data, exists: true, offline: true }; }
    }
    try {
      if (!db) throw new Error('offline');
      const snap = await withTimeout(db.collection('users').doc(profile.uid).collection('meta').doc('boxcalc').get(), 10000);
      if (snap.exists) { writeLocalSum(snap.data(), false); return { doc: snap.data(), exists: true }; }
      return { doc: null, exists: false };
    } catch (e) {
      return local && local.data ? { doc: local.data, exists: true, offline: true } : null;
    }
  }

  async function saveMySummary(s) {
    if (!Cloud.isStudent()) return;
    writeLocalSum(s, true);
    await ready();
    if (!db) throw new Error('offline');
    await withTimeout(db.collection('users').doc(profile.uid).collection('meta').doc('boxcalc').set(s), 12000);
    writeLocalSum(s, false);
  }

  /* ---------- class results with a local cache ----------
     Results never change once written, so each document is downloaded
     only once per device. We remember which time span is already cached
     and fetch only what is missing (older days, or new arrivals). */
  const RC_PREFIX = 'ws_rc_';
  const memCache = {};
  const OVERLAP = 10 * 60 * 1000; // re-check the last 10 minutes for late arrivals
  const MAX_CACHED = 4000;

  function rcKey(cid) { return RC_PREFIX + profile.uid + '_' + cid; }
  function loadRc(cid) {
    if (memCache[cid]) return memCache[cid];
    let c = null;
    try { c = JSON.parse(localStorage.getItem(rcKey(cid)) || 'null'); } catch (e) {}
    memCache[cid] = c && c.docs ? c : { docs: {}, from: 0, to: 0 };
    return memCache[cid];
  }
  function saveRc(cid) {
    const c = memCache[cid];
    const ids = Object.keys(c.docs);
    if (ids.length > MAX_CACHED) {
      ids.sort((a, b) => c.docs[b].createdAt - c.docs[a].createdAt)
        .slice(MAX_CACHED)
        .forEach((id) => { delete c.docs[id]; });
      let oldest = Infinity;
      Object.keys(c.docs).forEach((id) => { oldest = Math.min(oldest, c.docs[id].createdAt); });
      c.from = oldest;
    }
    try { localStorage.setItem(rcKey(cid), JSON.stringify(c)); } catch (e) {}
  }

  async function fetchSpan(cid, fromMs, toMs) {
    const T = firebase.firestore.Timestamp;
    const snap = await db.collection('classes').doc(cid).collection('results')
      .where('createdAt', '>=', T.fromMillis(fromMs))
      .where('createdAt', '<', T.fromMillis(toMs))
      .get();
    return snap.docs.map((d) => Object.assign({ id: d.id }, d.data(), { createdAt: toMillis(d.data().createdAt) }));
  }

  /* from/to: Date objects (to is exclusive). Served from the cache; new
     arrivals are pulled at most once a minute, or now with opts.refresh. */
  async function classResults(cid, from, to, opts) {
    await ready();
    const c = loadRc(cid);
    const now = Date.now();
    const f = from.getTime();
    const t = Math.min(to.getTime(), now + 60000);
    const add = (rows) => rows.forEach((r) => { c.docs[r.id] = r; });

    if (!c.to) {
      add(await fetchSpan(cid, f, t));
      c.from = f;
      c.to = t;
    } else {
      if (f < c.from) {
        add(await fetchSpan(cid, f, c.from));
        c.from = f;
      }
      const stale = (opts && opts.refresh) || now - c.to > 60 * 1000;
      if (t > c.to - OVERLAP && stale) {
        add(await fetchSpan(cid, c.to - OVERLAP, t));
        c.to = Math.max(c.to, t);
      }
    }
    saveRc(cid);
    return Object.keys(c.docs).map((id) => c.docs[id])
      .filter((r) => r.createdAt >= f && r.createdAt < to.getTime())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  /* ---------- teacher usage (PIN teachers, no Firebase login) ----------
     One document per teacher per day: teacherUsage/{key}_{YYYY-MM-DD}
     { teacherId, teacherName, date, uses, minutes, exams, lastAt }.
     Counts are queued on the device and written in small increments
     (firestore.rules only allows +5 uses / +10 minutes / +5 exams per write). */
  const USAGE_Q = 'ws_usage_pending';
  const LIMIT = { uses: 5, minutes: 10, exams: 5 };
  let usageTimer = null;

  function nameKey(name) {
    let h = 0x811c9dc5;
    const s = String(name || '');
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
    return 'n' + h.toString(16);
  }
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function readUsageQ() { try { return JSON.parse(localStorage.getItem(USAGE_Q) || '{}'); } catch (e) { return {}; } }
  function writeUsageQ(q) { try { localStorage.setItem(USAGE_Q, JSON.stringify(q)); } catch (e) {} }

  function scheduleUsageFlush(ms) {
    clearTimeout(usageTimer);
    usageTimer = setTimeout(() => { flushTeacherUsage(); }, ms);
  }

  /* add = { uses, minutes, exams } */
  function recordTeacherUsage(teacherName, add) {
    if (!Cloud.enabled || !teacherName) return;
    const q = readUsageQ();
    const k = `${teacherName}|${today()}`;
    const row = q[k] || { uses: 0, minutes: 0, exams: 0 };
    row.uses += add.uses || 0;
    row.minutes += add.minutes || 0;
    row.exams += add.exams || 0;
    q[k] = row;
    writeUsageQ(q);
    // activities go out within seconds; minutes are sent every 5 minutes
    if (row.uses || row.exams || row.minutes >= 5) scheduleUsageFlush(4000);
  }

  let usageFlushing = false;
  let usageRetryMs = 60000;
  async function flushTeacherUsage() {
    if (usageFlushing || !Cloud.enabled) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;
    const q = readUsageQ();
    const keys = Object.keys(q);
    if (!keys.length) return;
    usageFlushing = true;
    let more = false;
    try {
      await ready();
      if (!db) return;
      for (const k of keys) {
        const [name, date] = k.split('|');
        const row = q[k];
        const send = {
          uses: Math.min(row.uses, LIMIT.uses),
          minutes: Math.min(row.minutes, LIMIT.minutes),
          exams: Math.min(row.exams, LIMIT.exams)
        };
        if (!send.uses && !send.minutes && !send.exams) { delete q[k]; continue; }
        const id = nameKey(name);
        const inc = firebase.firestore.FieldValue.increment;
        try {
          await withTimeout(db.collection('teacherUsage').doc(`${id}_${date}`).set({
            teacherId: id,
            teacherName: name,
            date,
            uses: inc(send.uses),
            minutes: inc(send.minutes),
            exams: inc(send.exams),
            lastAt: ts()
          }, { merge: true }), 12000);
          const cur = readUsageQ();
          const r = cur[k];
          if (r) {
            r.uses -= send.uses; r.minutes -= send.minutes; r.exams -= send.exams;
            if (r.uses <= 0 && r.minutes <= 0 && r.exams <= 0) delete cur[k];
            else more = true;
            writeUsageQ(cur);
          }
        } catch (e) {
          // Keep the counts on any error. A rules refusal (e.g. the new
          // firestore.rules not published yet) is retried every 10 minutes.
          usageRetryMs = String((e && e.code) || '').includes('permission-denied') ? 600000 : 60000;
          more = true;
          break;
        }
      }
    } catch (e) {
      more = true;
    } finally {
      usageFlushing = false;
    }
    if (more) scheduleUsageFlush(usageRetryMs);
  }

  if (typeof window !== 'undefined') {
    // Send leftover minutes when the teacher leaves or switches tab
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flushTeacherUsage(); });
    window.addEventListener('online', () => flushTeacherUsage());
    if (Cloud.enabled) setTimeout(() => { if (Object.keys(readUsageQ()).length) flushTeacherUsage(); }, 8000);
  }

  /* ---------- teacher roster (PIN teachers) ----------
     roster/{id}      public: name, role, school, subject, status, sheetUrl, pinHash
     rosterPins/{id}  admin only: pin (so the Admin panel can show it)
     The login screen checks a typed PIN against pinHash, so new teachers'
     PINs are never published as readable text. */
  async function hashPin(id, pin) {
    const data = new TextEncoder().encode(`ws|${id}|${String(pin).trim()}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  const ROSTER_FIELDS = ['name', 'role', 'school', 'subject', 'status', 'sheetUrl', 'pinHash', 'createdAt'];

  async function listRoster() {
    await ready();
    if (!db) throw new Error('offline');
    const snap = await withTimeout(db.collection('roster').get(), 8000);
    const list = snap.docs.map((d) => Object.assign({ id: d.id }, d.data()));
    if (Cloud.isAdmin()) {
      try {
        const pins = await db.collection('rosterPins').get();
        const map = {};
        pins.docs.forEach((d) => { map[d.id] = d.data().pin; });
        list.forEach((t) => { if (map[t.id]) t.pin = map[t.id]; });
      } catch (e) { console.warn('rosterPins', e); }
    }
    return list;
  }

  /* Admin only. t = app teacher object (with plain pin). */
  async function saveRosterTeacher(t) {
    await ready();
    if (!Cloud.isAdmin()) throw Object.assign(new Error('not-admin'), { code: 'not-admin' });
    const doc = {};
    ROSTER_FIELDS.forEach((k) => { if (t[k] !== undefined && k !== 'pinHash') doc[k] = t[k]; });
    doc.status = t.status || 'active';
    if (t.pin) doc.pinHash = await hashPin(t.id, t.pin);
    doc.updatedAt = ts();
    const batch = db.batch();
    batch.set(db.collection('roster').doc(t.id), doc, { merge: true });
    if (t.pin) batch.set(db.collection('rosterPins').doc(t.id), { pin: String(t.pin) });
    await withTimeout(batch.commit(), 12000);
    return doc.pinHash;
  }

  async function deleteRosterTeacher(id) {
    await ready();
    if (!Cloud.isAdmin()) throw Object.assign(new Error('not-admin'), { code: 'not-admin' });
    const batch = db.batch();
    batch.delete(db.collection('roster').doc(id));
    batch.delete(db.collection('rosterPins').doc(id));
    await withTimeout(batch.commit(), 12000);
  }

  /* Admin only: totals per teacher name across all devices. */
  async function listTeacherUsage() {
    await ready();
    if (!Cloud.isAdmin()) throw Object.assign(new Error('not-admin'), { code: 'not-admin' });
    const snap = await db.collection('teacherUsage').get();
    const by = {};
    snap.docs.forEach((d) => {
      const x = d.data();
      const name = x.teacherName || '?';
      const t = by[name] || (by[name] = { uses: 0, minutes: 0, exams: 0, lastAt: 0, days: 0 });
      t.uses += x.uses || 0;
      t.minutes += x.minutes || 0;
      t.exams += x.exams || 0;
      t.days += 1;
      t.lastAt = Math.max(t.lastAt, toMillis(x.lastAt));
    });
    return by;
  }

  /* ---------- activity scores (ពិន្ទុសកម្មភាព) ----------
     classes/{cid}                      scoreTotal, scorePct, scoreKeep (months kept)
     classes/{cid}/months/{mid}         { label, cols:[{id,label,max,day}], locked, expireAt }
     classes/{cid}/months/{mid}/rows/{uid}  { uid, name, seq, s:{colId:number}, byName, at, expireAt }
     classes/{cid}/months/{mid}/log/{id}    audit trail (teacher/admin read only)
     The total is always computed from cells, never stored.

     Class leaders edit through a SEPARATE login ("editor account", role
     'scoreeditor') whose password only the teacher sets. It lives on the
     secondary Firebase app, so the student stays signed in as themself and
     the editor session ends when the page is closed. */
  const dbx = () => (editorDb && profile && profile.role === 'student' ? editorDb : db);
  const mref = (cid, mid) => dbx().collection('classes').doc(cid).collection('months').doc(mid);
  const editorEmail = (p) => `ed${normalizeId(p.loginId)}v${p.editorVer || 1}@${DOMAIN.teacher}`;

  const scoresApi = {
    /* ----- editor session (student/leader side) ----- */
    editorActive: () => !!editorDb,
    async editorSignIn(password) {
      await ready();
      if (!profile || profile.role !== 'student' || !profile.editorOn) throw new Error('គណនីនេះមិនទាន់មានសិទ្ធិកែពិន្ទុទេ');
      const a = secondaryAuth();
      let cred;
      try { cred = await a.signInWithEmailAndPassword(editorEmail(profile), String(password || '')); }
      catch (e) {
        const c = String((e && e.code) || '');
        if (/invalid|wrong|not-found|credential/.test(c)) throw new Error('ពាក្យសម្ងាត់កែពិន្ទុមិនត្រឹមត្រូវ');
        throw new Error(friendlyError(e));
      }
      const edb = secondary.firestore();
      let d;
      try { d = await edb.collection('users').doc(cred.user.uid).get(); }
      catch (e) { await a.signOut(); throw new Error(friendlyError(e)); }
      const x = d.exists ? d.data() : null;
      if (!x || x.role !== 'scoreeditor' || x.active === false || x.studentUid !== profile.uid || x.editClassId !== profile.classId) {
        await a.signOut();
        throw new Error('ពាក្យសម្ងាត់កែពិន្ទុនេះលែងប្រើបានហើយ។ សូមសួរលោកគ្រូ');
      }
      editorDb = edb;
    },
    async editorSignOut() {
      editorDb = null;
      try { if (secondary) await secondary.auth().signOut(); } catch (e) {}
    },

    /* ----- teacher: set / replace / remove the leader's edit password ----- */
    async setEditorPassword(st, password) {
      await ready();
      if (!Cloud.isTeacher()) throw new Error('សម្រាប់គ្រូប៉ុណ្ណោះ');
      if (String(password || '').length < 6) throw new Error('ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច ៦ តួ');
      const ver = (st.editorVer || 0) + 1;
      let euid;
      try { euid = await createAuthUser(editorEmail({ loginId: st.loginId, editorVer: ver }), password); }
      catch (e) { throw new Error(friendlyError(e)); }
      await db.collection('users').doc(euid).set({
        role: 'scoreeditor', name: st.name, studentUid: st.uid, editClassId: st.classId,
        teacherUid: st.teacherUid || profile.uid, active: true, createdAt: ts()
      });
      const prev = st.editorUid;
      await db.collection('users').doc(st.uid).update({ editorOn: true, editorVer: ver, editorUid: euid });
      if (prev) { try { await db.collection('users').doc(prev).update({ active: false }); } catch (e) {} }
      return { editorOn: true, editorVer: ver, editorUid: euid };
    },
    async removeEditor(st) {
      await ready();
      if (st.editorUid) { try { await db.collection('users').doc(st.editorUid).update({ active: false }); } catch (e) {} }
      await db.collection('users').doc(st.uid).update({ editorOn: false });
    },

    /* ----- teacher: rename students (keeps ID and password) ----- */
    async renameStudents(cid, mids, pairs) {
      await ready();
      for (let i = 0; i < pairs.length; i += 200) {
        const b = db.batch();
        pairs.slice(i, i + 200).forEach((x) => b.update(db.collection('users').doc(x.uid), { name: x.name }));
        await b.commit();
      }
      for (const mid of mids) {
        const snap = await mref(cid, mid).collection('rows').get();
        const nm = new Map(pairs.map((x) => [x.uid, x.name]));
        const docs = snap.docs.filter((d) => nm.has(d.id));
        for (let i = 0; i < docs.length; i += 200) {
          const b = db.batch();
          docs.slice(i, i + 200).forEach((d) => b.update(d.ref, { name: nm.get(d.id) }));
          await b.commit();
        }
      }
    },

    /* ----- months / rows ----- */
    async listMonths(cid) {
      await ready();
      const snap = await dbx().collection('classes').doc(cid).collection('months').get();
      return snap.docs.map((d) => Object.assign({ id: d.id }, d.data())).sort((a, b) => String(a.id).localeCompare(String(b.id)));
    },
    async saveMonth(cid, mid, data) {
      await ready();
      await mref(cid, mid).set(data, { merge: true });
    },
    async deleteMonth(cid, mid) {
      await ready();
      for (const sub of ['rows', 'log']) {
        const snap = await mref(cid, mid).collection(sub).get();
        for (let i = 0; i < snap.docs.length; i += 400) {
          const b = db.batch();
          snap.docs.slice(i, i + 400).forEach((d) => b.delete(d.ref));
          await b.commit();
        }
      }
      await mref(cid, mid).delete();
    },
    async setClassScoreConfig(cid, total, pct, keep, levelA, levelB) {
      await ready();
      await db.collection('classes').doc(cid).update({ scoreTotal: Number(total), scorePct: Number(pct), scoreKeep: Number(keep), scoreA: Number(levelA), scoreB: Number(levelB) });
    },
    /* re-stamp expireAt on every month and row when the retention changes */
    async restampExpiry(cid, months, expiryFn) {
      await ready();
      for (const m of months) {
        const exp = expiryFn(m.id);
        await mref(cid, m.id).set({ expireAt: exp }, { merge: true });
        const rows = await mref(cid, m.id).collection('rows').get();
        for (let i = 0; i < rows.docs.length; i += 400) {
          const b = db.batch();
          rows.docs.slice(i, i + 400).forEach((d) => b.update(d.ref, { expireAt: exp }));
          await b.commit();
        }
      }
    },
    async listRows(cid, mid) {
      await ready();
      const snap = await mref(cid, mid).collection('rows').get();
      return snap.docs.map((d) => Object.assign({ uid: d.id }, d.data()))
        .sort((a, b) => (a.seq || 0) - (b.seq || 0) || String(a.name).localeCompare(String(b.name), 'km'));
    },
    async myRow(cid, mid) {
      await ready();
      const d = await db.collection('classes').doc(cid).collection('months').doc(mid).collection('rows').doc(profile.uid).get();
      return d.exists ? Object.assign({ uid: d.id }, d.data()) : null;
    },
    /* create blank rows for these students (teacher/admin only) */
    async createRows(cid, mid, students, expireAt) {
      await ready();
      const out = [];
      for (let i = 0; i < students.length; i += 400) {
        const b = db.batch();
        students.slice(i, i + 400).forEach((s) => {
          const row = { uid: s.uid, name: s.name, seq: s.seq || 0, s: {} };
          b.set(mref(cid, mid).collection('rows').doc(s.uid), expireAt ? Object.assign({ expireAt }, row) : row);
          out.push(row);
        });
        await b.commit();
      }
      return out;
    },
    /* one cell; value null clears it. Uses a field path so two editors never overwrite each other. */
    async setCell(cid, mid, uid, colId, value, oldValue, colLabel, rowName, expireAt) {
      await ready();
      const FV = firebase.firestore.FieldValue;
      const who = profile.name + (editorDb ? ' (ប្រធានថ្នាក់)' : '');
      const upd = { byName: who, at: ts() };
      upd['s.' + colId] = value == null ? FV.delete() : Number(value);
      await mref(cid, mid).collection('rows').doc(uid).update(upd);
      const log = {
        by: profile.uid, byName: who, row: uid, rowName: rowName || '', col: colId, colLabel: colLabel || '',
        from: oldValue == null ? null : Number(oldValue), to: value == null ? null : Number(value), at: ts()
      };
      if (expireAt) log.expireAt = expireAt;
      mref(cid, mid).collection('log').add(log).catch(() => {});
    },
    /* same value in one column for many students (value null clears the column) */
    async setColumnAll(cid, mid, colId, value, uids, colLabel, expireAt) {
      await ready();
      const FV = firebase.firestore.FieldValue;
      const who = profile.name + (editorDb ? ' (ប្រធានថ្នាក់)' : '');
      for (let i = 0; i < uids.length; i += 200) {
        const b = dbx().batch();
        uids.slice(i, i + 200).forEach((uid) => {
          const upd = { byName: who, at: ts() };
          upd['s.' + colId] = value == null ? FV.delete() : Number(value);
          b.update(mref(cid, mid).collection('rows').doc(uid), upd);
        });
        await b.commit();
      }
      const log = {
        by: profile.uid, byName: who, row: '*', rowName: `ទាំងថ្នាក់ (${uids.length} នាក់)`, col: colId, colLabel: colLabel || '',
        from: null, to: value == null ? null : Number(value), at: ts()
      };
      if (expireAt) log.expireAt = expireAt;
      mref(cid, mid).collection('log').add(log).catch(() => {});
    },
    async listLog(cid, mid, limit) {
      await ready();
      const snap = await mref(cid, mid).collection('log').orderBy('at', 'desc').limit(limit || 100).get();
      return snap.docs.map((d) => Object.assign({ id: d.id }, d.data(), { at: toMillis(d.data().at) }));
    },
    /* student: the class settings */
    async myClass() {
      await ready();
      const d = await db.collection('classes').doc(profile.classId).get();
      return d.exists ? Object.assign({ id: d.id }, d.data()) : null;
    }
  };

  window.Cloud = Cloud;
})();
