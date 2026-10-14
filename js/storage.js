/**
 * NGS Education LMS - Storage & API Service
 */

const StorageService = {
  async getCourses() {
    try {
      const response = await fetch('/api/courses');
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('ngs_courses_cache', JSON.stringify(data));
        return data;
      }
    } catch (err) {
      console.warn('API fetch failed, reading from cache or fallback', err);
    }

    // Fallback to cache or data/courses.json directly
    const cached = localStorage.getItem('ngs_courses_cache');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }

    try {
      const response = await fetch('data/courses.json');
      if (response.ok) return await response.json();
    } catch (e) {
      console.error('All course fetch methods failed', e);
    }
    return [];
  },

  async login(pin) {
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
    const pin = localStorage.getItem('admin_pin') || '';

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
    const pin = localStorage.getItem('admin_pin') || '';
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
    const pin = localStorage.getItem('admin_pin') || '';
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
