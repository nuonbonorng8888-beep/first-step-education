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

  let app = null, auth = null, db = null, secondary = null;
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
    normalizeId
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
      profile = p;
      cacheProfile(p);
      emit();
      return p;
    } catch (e) {
      throw new Error(friendlyError(e));
    }
  }

  async function signOut() {
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

  window.Cloud = Cloud;
})();
