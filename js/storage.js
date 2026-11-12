/**
 * NGS Education LMS - Storage & API Service
 */

const StorageService = {
  async getCourses() {
    // Try fetching freshest data from data/courses.json first
    try {
      const response = await fetch(`data/courses.json?v=${Date.now()}`, { cache: 'no-store' });
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ngs_courses_cache', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('Direct courses.json fetch failed, trying API or cache', err);
    }

    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ngs_courses_cache', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('API fetch failed, reading from cache', err);
    }

    // Fallback to cache if offline
    const cached = localStorage.getItem('ngs_courses_cache');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    return [];
  },

  async getTeachers() {
    let localTeachers = [];
    try {
      const raw = localStorage.getItem('worksheet_teachers_list');
      if (raw) localTeachers = JSON.parse(raw);
    } catch (e) {}

    let jsonTeachers = [];
    try {
      const res = await fetch(`data/teachers.json?v=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        jsonTeachers = await res.json();
      }
    } catch (e) {
      console.warn('teachers.json fetch failed:', e);
    }

    if (!Array.isArray(localTeachers) || localTeachers.length === 0) {
      if (Array.isArray(jsonTeachers) && jsonTeachers.length > 0) {
        localStorage.setItem('worksheet_teachers_list', JSON.stringify(jsonTeachers));
        return jsonTeachers;
      }
      return [];
    }

    // Merge: Canonical server teachers update/insert into local teachers
    if (Array.isArray(jsonTeachers)) {
      jsonTeachers.forEach(jt => {
        const idx = localTeachers.findIndex(lt => lt.id === jt.id || lt.pin === jt.pin);
        if (idx !== -1) {
          // Keep local overrides like sheetUrl if set, but sync name, role, school, pin from canonical server
          localTeachers[idx] = {
            ...localTeachers[idx],
            ...jt,
            sheetUrl: localTeachers[idx].sheetUrl || jt.sheetUrl || ''
          };
        } else {
          localTeachers.push(jt);
        }
      });
      localStorage.setItem('worksheet_teachers_list', JSON.stringify(localTeachers));
    }
    return localTeachers;
  },

  saveTeachers(teachers) {
    try {
      localStorage.setItem('worksheet_teachers_list', JSON.stringify(teachers));
    } catch (e) {
      console.warn('Error saving teachers to localStorage:', e);
    }
  },

  getTeacherStatsMap() {
    try {
      const raw = localStorage.getItem('worksheet_teacher_stats_map');
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  saveTeacherStatsMap(statsMap) {
    try {
      localStorage.setItem('worksheet_teacher_stats_map', JSON.stringify(statsMap));
    } catch (e) {}
  },

  getTeacherStats(teacherName) {
    if (!teacherName) return { useCount: 0, loginCount: 0, examCount: 0, durationMinutes: 0, lastActive: 'មិនទាន់ប្រើ', lastAction: '-' };
    const map = this.getTeacherStatsMap();
    const stored = map[teacherName] || { useCount: 0, loginCount: 0, examCount: 0, durationMinutes: 0, lastActive: '', lastAction: '' };

    // Also scan activity logs for extra accuracy
    const logs = this.getActivityLogs().filter(l => l.teacherName === teacherName);
    const logUses = logs.length;
    const logLogins = logs.filter(l => l.action && l.action.includes('Login')).length;
    const logExams = logs.filter(l => l.action && (l.action.includes('Link') || l.action.includes('ប្រឡង'))).length;
    const latestLog = logs[0];

    const finalUses = Math.max(stored.useCount || 0, logUses);
    const finalLogins = Math.max(stored.loginCount || 0, logLogins);
    const finalExams = Math.max(stored.examCount || 0, logExams);
    const finalLastActive = stored.lastActive || (latestLog ? latestLog.timestamp : 'មិនទាន់ប្រើ');
    const finalLastAction = stored.lastAction || (latestLog ? latestLog.action : '-');

    return {
      useCount: finalUses,
      loginCount: finalLogins,
      examCount: finalExams,
      durationMinutes: stored.durationMinutes || 0,
      lastActive: finalLastActive || 'មិនទាន់ប្រើ',
      lastAction: finalLastAction || '-'
    };
  },

  recordTeacherUsage(teacherName, action = 'ប្រើប្រាស់', details = '') {
    if (!teacherName) return;
    const map = this.getTeacherStatsMap();
    if (!map[teacherName]) {
      map[teacherName] = { useCount: 0, loginCount: 0, examCount: 0, durationMinutes: 0, lastActive: '', lastAction: '' };
    }
    const t = map[teacherName];
    t.useCount = (t.useCount || 0) + 1;
    if (action.includes('Login')) t.loginCount = (t.loginCount || 0) + 1;
    if (action.includes('Link') || action.includes('ប្រឡង')) t.examCount = (t.examCount || 0) + 1;
    t.lastActive = new Date().toLocaleString('km-KH', { dateStyle: 'short', timeStyle: 'short' });
    t.lastAction = action;
    this.saveTeacherStatsMap(map);
  },

  incrementTeacherDuration(teacherName, minutes = 1) {
    if (!teacherName) return;
    const map = this.getTeacherStatsMap();
    if (!map[teacherName]) {
      map[teacherName] = { useCount: 1, loginCount: 1, examCount: 0, durationMinutes: 0, lastActive: '', lastAction: 'ចូលប្រព័ន្ធ' };
    }
    map[teacherName].durationMinutes = (map[teacherName].durationMinutes || 0) + minutes;
    map[teacherName].lastActive = new Date().toLocaleString('km-KH', { dateStyle: 'short', timeStyle: 'short' });
    this.saveTeacherStatsMap(map);
  },

  getTotalSystemUsageStats(teachersList = []) {
    const map = this.getTeacherStatsMap();
    const allLogs = this.getActivityLogs();
    let totalUses = allLogs.length;
    let totalDurationMinutes = 0;

    Object.values(map).forEach(s => {
      if (s.durationMinutes) totalDurationMinutes += s.durationMinutes;
      if (s.useCount && s.useCount > totalUses) totalUses = s.useCount;
    });

    return {
      totalUses: Math.max(totalUses, allLogs.length),
      totalDurationMinutes
    };
  },

  getActivityLogs() {
    try {
      const raw = localStorage.getItem('worksheet_activity_logs');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  },

  saveActivityLogs(logs) {
    try {
      // Keep most recent 300 logs
      localStorage.setItem('worksheet_activity_logs', JSON.stringify(logs.slice(0, 300)));
    } catch (e) {}
  },

  addActivityLog(entry) {
    const logs = this.getActivityLogs();
    logs.unshift(entry);
    this.saveActivityLogs(logs);
    if (entry.teacherName) {
      this.recordTeacherUsage(entry.teacherName, entry.action, entry.details);
    }
    return logs;
  },

  async login(pin) {
    // 1. Check local/file teachers first for multi-member support
    try {
      const teachers = await this.getTeachers();
      const matched = teachers.find(t => String(t.pin).trim() === String(pin).trim() && t.status !== 'blocked');
      if (matched) {
        return {
          success: true,
          token: matched.pin,
          role: matched.role || (matched.pin === '95511' ? 'admin' : 'member'),
          teacher: matched
        };
      }
    } catch (err) {
      console.warn('Teacher lookup error:', err);
    }

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin })
      });
      return await response.json();
    } catch (err) {
      if (pin === '95511') return { success: true, token: '95511', role: 'admin' };
      return { success: false, message: 'Server connection error' };
    }
  },

  async uploadFile(file, onProgress) {
    const formData = new FormData();
    formData.append('file', file);
    const pin = sessionStorage.getItem('admin_pin') || localStorage.getItem('admin_pin') || '';

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/upload');
      xhr.setRequestHeader('X-Admin-Pin', pin);

      if (onProgress && xhr.upload) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const res = JSON.parse(xhr.responseText);
            resolve(res);
          } catch (err) {
            reject(err);
          }
        } else {
          reject(new Error(`Upload failed (Status ${xhr.status}): សូមពិនិត្យលេខកូដសម្ងាត់គ្រូ`));
        }
      };

      xhr.onerror = () => reject(new Error('Network upload error'));
      xhr.send(formData);
    });
  },

  async addLesson(courseId, lessonData) {
    const pin = sessionStorage.getItem('admin_pin') || localStorage.getItem('admin_pin') || '';
    try {
      const response = await fetch('/api/lessons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Pin': pin
        },
        body: JSON.stringify({
          courseId: courseId,
          lesson: lessonData
        })
      });
      if (response.status === 401) {
        throw new Error('លេខកូដសម្ងាត់មិនត្រឹមត្រូវ (Unauthorized)');
      }
      return await response.json();
    } catch (err) {
      console.error('Error adding lesson via API:', err);
      throw err;
    }
  },

  async deleteLesson(lessonId) {
    const pin = sessionStorage.getItem('admin_pin') || localStorage.getItem('admin_pin') || '';
    try {
      const response = await fetch('/api/lessons/' + lessonId, {
        method: 'DELETE',
        headers: { 'X-Admin-Pin': pin }
      });
      if (response.status === 401) {
        throw new Error('គ្មានសិទ្ធិលុប (Unauthorized Admin PIN)');
      }
      return await response.json();
    } catch (err) {
      console.error('Error deleting lesson:', err);
      throw err;
    }
  },

  getNotes(lessonId) {
    try {
      return JSON.parse(localStorage.getItem(`notes_${lessonId}`)) || [];
    } catch (e) {
      return [];
    }
  },

  saveNote(lessonId, note) {
    const notes = this.getNotes(lessonId);
    notes.unshift(note);
    localStorage.setItem(`notes_${lessonId}`, JSON.stringify(notes));
    return notes;
  },

  deleteNote(lessonId, noteId) {
    let notes = this.getNotes(lessonId);
    notes = notes.filter(n => n.id !== noteId);
    localStorage.setItem(`notes_${lessonId}`, JSON.stringify(notes));
    return notes;
  },

  getLessonProgress(lessonId) {
    return parseFloat(localStorage.getItem(`progress_${lessonId}`)) || 0;
  },

  setLessonProgress(lessonId, seconds) {
    localStorage.setItem(`progress_${lessonId}`, seconds.toString());
  },

  isCompleted(lessonId) {
    return localStorage.getItem(`completed_${lessonId}`) === 'true';
  },

  setCompleted(lessonId, status = true) {
    localStorage.setItem(`completed_${lessonId}`, status ? 'true' : 'false');
  }
};

if (typeof window !== 'undefined') {
  window.StorageService = StorageService;
}
