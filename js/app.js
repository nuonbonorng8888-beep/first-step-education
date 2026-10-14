/**
 * NGS Education LMS - Main Application Controller
 */

window.App = {
  courses: [],
  currentCourse: null,
  currentLesson: null,
  currentCategory: 'all',
  currentGrade: 'all',
  currentLanguage: 'km',
  isAdmin: false,
  searchQuery: '',
  player: null,

  async init() {
    this.initTheme();
    this.checkAdminAuth();
    this.initPlayer();
    this.bindGlobalEvents();
    await this.loadCourses();
  },

  checkAdminAuth() {
    const pin = localStorage.getItem('admin_pin');
    if (pin === '95511') {
      this.isAdmin = true;
    } else {
      this.isAdmin = false;
    }
    this.updateAdminUI();
  },

  updateAdminUI() {
    const adminEls = document.querySelectorAll('.admin-only');
    adminEls.forEach(el => {
      el.style.display = this.isAdmin ? (el.tagName === 'BUTTON' ? 'inline-flex' : 'block') : 'none';
    });

    const authBtn = document.getElementById('btn-admin-auth');
    if (authBtn) {
      if (this.isAdmin) {
        authBtn.className = 'btn btn-secondary';
        authBtn.innerHTML = `
          <span style="color:var(--accent-emerald); font-weight:700;">👨‍🏫 គ្រូ (Admin)</span>
          <span onclick="event.stopPropagation(); App.logoutAdmin()" style="margin-left:8px; opacity:0.7; cursor:pointer;" title="ចាកចេញ (Logout)">✕</span>
        `;
      } else {
        authBtn.className = 'btn btn-outline';
        authBtn.innerHTML = '🔐 គ្រូបង្រៀន (Teacher)';
      }
    }

    // Refresh playlist sidebar if in classroom
    if (this.currentCourse) {
      this.renderSidebarPlaylist();
    }
  },

  openLoginModal() {
    if (this.isAdmin) {
      if (confirm('តើលោកអ្នកចង់ចាកចេញពីគណនីគ្រូ (Switch to Student Mode) ដែរឬទេ?')) {
        this.logoutAdmin();
      }
      return;
    }
    const modal = document.getElementById('login-modal');
    const input = document.getElementById('admin-pin-input');
    const err = document.getElementById('login-error-msg');
    if (err) err.style.display = 'none';
    if (input) input.value = '';
    if (modal) modal.classList.add('active');
    setTimeout(() => input?.focus(), 200);
  },

  closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) modal.classList.remove('active');
  },

  async submitLogin(e) {
    e.preventDefault();
    const input = document.getElementById('admin-pin-input');
    const err = document.getElementById('login-error-msg');
    const pin = input ? input.value.trim() : '';

    if (pin === '95511') {
      localStorage.setItem('admin_pin', '95511');
      this.isAdmin = true;
      this.updateAdminUI();
      this.closeLoginModal();
      this.showToast('បានផ្ទៀងផ្ទាត់លេខសម្ងាត់ជោគជ័យ! បើកសិទ្ធិគ្រប់គ្រងរួចរាល់ 🎉', 'success');
    } else {
      if (err) {
        err.textContent = 'លេខកូដសម្ងាត់មិនត្រឹមត្រូវទេ! សូមព្យាយាមម្តងទៀត';
        err.style.display = 'block';
      }
      this.showToast('លេខកូដសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
      input?.select();
    }
  },

  logoutAdmin() {
    localStorage.removeItem('admin_pin');
    this.isAdmin = false;
    this.updateAdminUI();
    this.showToast('បានចាកចេញពីគណនីគ្រូ (បានត្រឡប់ទៅ Student Mode)', 'info');
  },

  setLanguage(lang) {
    this.currentLanguage = lang;
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`btn-lang-${lang}`);
    if (btn) btn.classList.add('active');

    const isEn = lang === 'en';
    const tagline = document.getElementById('hero-tagline');
    const slogan = document.getElementById('hero-slogan');
    const navHome = document.getElementById('nav-link-home');
    const navLessons = document.getElementById('nav-link-lessons');
    const navTest = document.getElementById('nav-link-test');

    if (tagline) tagline.textContent = isEn ? "Empowering Students of All Levels" : "កម្មវិធីពង្រឹងសមត្ថភាពសិស្សគ្រប់កម្រិត";
    if (slogan) slogan.textContent = isEn ? "✨ You Can Learn Anything! • Every Step Towards Success!" : "✨ អ្វីក៏យើងអាចរៀនបានដែរ! • You Can Learn Anything!";
    if (navHome) navHome.textContent = isEn ? "Home" : "ទំព័រដើម";
    if (navLessons) navLessons.textContent = isEn ? "Lessons" : "មេរៀន";
    if (navTest) navTest.textContent = isEn ? "Diagnostic Test" : "តេស្តសមត្ថភាព";

    this.renderCourses();
  },

  filterByGrade(grade, element) {
    this.currentGrade = grade;
    document.querySelectorAll('.grade-pill').forEach(p => p.classList.remove('active'));
    if (element) element.classList.add('active');
    this.renderCourses();
  },

  scrollToLessons() {
    const grid = document.getElementById('courses-grid');
    if (grid) {
      grid.scrollIntoView({ behavior: 'smooth' });
    }
  },

  openStoreInfoModal(store) {
    const modal = document.getElementById('store-modal');
    if (modal) modal.classList.add('active');
  },

  closeStoreInfoModal() {
    const modal = document.getElementById('store-modal');
    if (modal) modal.classList.remove('active');
  },

  openDiagnosticModal() {
    const modal = document.getElementById('diagnostic-modal');
    if (modal) modal.classList.add('active');
  },

  closeDiagnosticModal() {
    const modal = document.getElementById('diagnostic-modal');
    if (modal) modal.classList.remove('active');
  },

  checkDiagnostic(index, element, isCorrect) {
    const card = element.closest('.quiz-card');
    const allOptions = card.querySelectorAll('.quiz-opt');
    const expBox = document.getElementById(`diag-exp-${index}`);
    allOptions.forEach(opt => opt.style.pointerEvents = 'none');

    if (isCorrect) {
      element.classList.add('correct');
      if (expBox) expBox.style.display = 'block';
      this.showToast('ចម្លើយត្រឹមត្រូវ! ល្អណាស់ 🎉', 'success');
    } else {
      element.classList.add('wrong');
      allOptions[0].classList.add('correct');
      if (expBox) expBox.style.display = 'block';
      this.showToast('មិនទាន់ត្រឹមត្រូវទេ! សូមមើលការពន្យល់', 'error');
    }
  },

  initTheme() {
    const savedTheme = localStorage.getItem('ngs_theme') || 'dark';
    if (savedTheme === 'light') {
      document.body.classList.add('light-theme');
      const themeBtn = document.getElementById('theme-toggle-btn');
      if (themeBtn) themeBtn.innerHTML = '🌙';
    }
  },

  toggleTheme() {
    const isLight = document.body.classList.toggle('light-theme');
    localStorage.setItem('ngs_theme', isLight ? 'light' : 'dark');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) themeBtn.innerHTML = isLight ? '🌙' : '☀️';
  },

  initPlayer() {
    const video = document.getElementById('main-video');
    const container = document.getElementById('video-container');
    if (video && container) {
      this.player = new VideoPlayerController(video, container);
    }
  },

  async loadCourses() {
    this.courses = await StorageService.getCourses();
    this.updateStats();
    this.renderCourses();
    this.populateCourseSelect();
  },

  updateStats() {
    let totalLessons = 0;
    let totalFiles = 0;
    let completedCount = 0;

    this.courses.forEach(c => {
      c.chapters?.forEach(ch => {
        ch.lessons?.forEach(l => {
          totalLessons++;
          if (l.files) totalFiles += l.files.length;
          if (StorageService.isCompleted(l.id)) completedCount++;
        });
      });
    });

    const statCourses = document.getElementById('stat-total-courses');
    const statLessons = document.getElementById('stat-total-lessons');
    const statFiles = document.getElementById('stat-total-files');
    const statProgress = document.getElementById('stat-total-progress');

    if (statCourses) statCourses.textContent = this.courses.length;
    if (statLessons) statLessons.textContent = totalLessons;
    if (statFiles) statFiles.textContent = totalFiles;
    if (statProgress) {
      const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
      statProgress.textContent = `${pct}%`;
    }
  },

  renderCourses() {
    const grid = document.getElementById('courses-grid');
    if (!grid) return;

    let filtered = this.courses;

    if (this.currentCategory !== 'all') {
      filtered = filtered.filter(c => c.category === this.currentCategory);
    }

    if (this.currentGrade !== 'all') {
      const khmerMap = { '7': '៧', '8': '៨', '9': '៩', '10': '១០', '11': '១១', '12': '១២' };
      const khmerDigit = khmerMap[this.currentGrade] || this.currentGrade;
      filtered = filtered.filter(c => c.grade && (c.grade.includes(this.currentGrade) || c.grade.includes(khmerDigit)));
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.title.toLowerCase().includes(q) ||
        (c.titleEn && c.titleEn.toLowerCase().includes(q)) ||
        (c.description && c.description.toLowerCase().includes(q))
      );
    }

    const countBadge = document.getElementById('course-count-badge');
    if (countBadge) countBadge.textContent = `${filtered.length} វគ្គសិក្សា`;

    if (filtered.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🔍</div>
          <h3>រកមិនឃើញវគ្គសិក្សាដែលត្រូវនឹងពាក្យស្វែងរកឡើយ</h3>
          <p style="font-size: 0.9rem; margin-top: 6px;">សូមសាកល្បងជ្រើសរើសកម្រិតថ្នាក់ ឬមុខវិជ្ជាផ្សេងទៀត</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtered.map(course => {
      const totalLessons = course.chapters?.reduce((sum, ch) => sum + (ch.lessons?.length || 0), 0) || 0;
      const totalFiles = course.chapters?.reduce((sum, ch) =>
        sum + ch.lessons?.reduce((fSum, l) => fSum + (l.files?.length || 0), 0)
      , 0) || 0;

      return `
        <div class="course-card" data-course-id="${course.id}">
          <div class="card-thumb-wrap">
            <img src="${course.coverImage}" alt="${course.title}" class="card-thumb" onerror="this.src='assets/moeys_grade12.jpg'">
            <div class="card-thumb-overlay"></div>
            <span class="card-grade-badge">${course.grade || 'NGS'}</span>
            <span class="card-category-badge">${course.categoryLabel || 'ទូទៅ'}</span>
            <span class="card-moeys-badge">🇰🇭 សៀវភៅគោល MoEYS</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${course.title}</h3>
            <p class="card-desc">${course.description || 'គ្មានសេចក្តីពិពណ៌នា'}</p>
            <div class="card-meta">
              <div class="meta-group">
                <span class="meta-tag">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
                  ${totalLessons} មេរៀន
                </span>
                <span class="meta-tag files">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  ${totalFiles} ឯកសារ (PDF)
                </span>
              </div>
            </div>
            <div class="card-footer">
              <button class="btn btn-primary card-btn" onclick="App.openCourse('${course.id}')">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                ចូលរៀនមេរៀន
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  },

  openCourse(courseId) {
    const course = this.courses.find(c => c.id === courseId);
    if (!course) return;

    this.currentCourse = course;

    // Switch views
    document.getElementById('catalog-view').style.display = 'none';
    const playerView = document.getElementById('player-view');
    playerView.classList.add('active');
    playerView.style.display = 'block';

    // Update breadcrumbs
    const bcCourse = document.getElementById('bc-course');
    if (bcCourse) bcCourse.textContent = course.title;

    // Select first lesson available
    let firstLesson = null;
    if (course.chapters && course.chapters.length > 0) {
      for (const ch of course.chapters) {
        if (ch.lessons && ch.lessons.length > 0) {
          firstLesson = ch.lessons[0];
          break;
        }
      }
    }

    this.renderSidebarPlaylist();

    if (firstLesson) {
      this.selectLesson(firstLesson.id);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  backToCatalog() {
    if (this.player && this.player.video) {
      this.player.video.pause();
    }
    document.getElementById('player-view').classList.remove('active');
    document.getElementById('player-view').style.display = 'none';
    document.getElementById('catalog-view').style.display = 'block';
    this.updateStats();
    this.renderCourses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  selectLesson(lessonId) {
    if (!this.currentCourse) return;

    let targetLesson = null;
    let targetChapter = null;

    for (const ch of this.currentCourse.chapters || []) {
      const l = ch.lessons?.find(item => item.id === lessonId);
      if (l) {
        targetLesson = l;
        targetChapter = ch;
        break;
      }
    }

    if (!targetLesson) return;
    this.currentLesson = targetLesson;

    // Update breadcrumbs & Header
    const bcLesson = document.getElementById('bc-lesson');
    if (bcLesson) bcLesson.textContent = targetLesson.title;

    const titleEl = document.getElementById('current-lesson-title');
    const chEl = document.getElementById('current-lesson-chapter');
    if (titleEl) titleEl.textContent = targetLesson.title;
    if (chEl) chEl.textContent = targetChapter?.title || 'ជំពូកទូទៅ';

    // Load video
    if (this.player) {
      this.player.loadLessonVideo(targetLesson);
    }

    // Update Tabs
    this.renderMaterialsTab();
    this.renderNotesTab();
    this.renderQuizTab();
    this.renderOverviewTab();

    // Update Sidebar Active state
    this.updateSidebarStatus();
  },

  renderSidebarPlaylist() {
    const listEl = document.getElementById('playlist-chapters-list');
    if (!listEl || !this.currentCourse) return;

    listEl.innerHTML = (this.currentCourse.chapters || []).map(ch => {
      const lessonsHtml = (ch.lessons || []).map(lesson => {
        const isActive = this.currentLesson && this.currentLesson.id === lesson.id;
        const isDone = StorageService.isCompleted(lesson.id);
        const fileCount = lesson.files ? lesson.files.length : 0;

        return `
          <div class="lesson-item ${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}"
               onclick="App.selectLesson('${lesson.id}')">
            <div class="lesson-status">
              ${isDone
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>'
                : '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>'
              }
            </div>
            <div class="lesson-item-info">
              <span class="lesson-item-title">${lesson.title}</span>
              <div class="lesson-item-meta">
                <span>⏱️ ${lesson.duration || '10:00'}</span>
                ${fileCount > 0 ? `<span>📄 ${fileCount} PDF</span>` : ''}
              </div>
            </div>
            ${this.isAdmin ? `
              <button class="btn-icon" style="width:28px; height:28px; color:var(--accent-rose); border:none; background:transparent;" onclick="event.stopPropagation(); App.confirmDeleteLesson('${lesson.id}', '${lesson.title}')" title="លុបមេរៀននេះ">
                🗑️
              </button>
            ` : ''}
          </div>
        `;
      }).join('');

      return `
        <div class="chapter-group">
          <div class="chapter-title">${ch.title}</div>
          <div class="lesson-items">${lessonsHtml}</div>
        </div>
      `;
    }).join('');
  },

  updateSidebarStatus() {
    const items = document.querySelectorAll('.lesson-item');
    items.forEach(el => el.classList.remove('active'));

    if (this.currentLesson) {
      this.renderSidebarPlaylist();
    }
  },

  // Tabs Management
  switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

    const activeBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const activeContent = document.getElementById(`tab-content-${tabName}`);

    if (activeBtn) activeBtn.classList.add('active');
    if (activeContent) activeContent.classList.add('active');
  },

  renderMaterialsTab() {
    const container = document.getElementById('materials-list');
    if (!container) return;

    const files = this.currentLesson?.files || [];
    const countBadge = document.getElementById('materials-tab-count');
    if (countBadge) countBadge.textContent = files.length;

    if (files.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <div style="font-size: 2.2rem; margin-bottom: 8px;">📑</div>
          <p>មិនទាន់មានឯកសារភ្ជាប់សម្រាប់មេរៀននេះនៅឡើយទេ</p>
          <button class="btn btn-outline" style="margin-top: 12px;" onclick="App.openUploadModal()">+ បញ្ចូលឯកសារឥឡូវនេះ</button>
        </div>
      `;
      return;
    }

    container.innerHTML = files.map(f => {
      const isPdf = f.fileType === 'pdf' || f.fileName.toLowerCase().endsWith('.pdf');
      const safeUrl = encodeURI(f.fileUrl);

      return `
        <div class="file-card">
          <div class="file-info">
            <div class="file-icon-box ${isPdf ? 'pdf' : 'doc'}">
              ${isPdf ? 'PDF' : 'DOC'}
            </div>
            <div class="file-text">
              <span class="file-name">${f.name || f.fileName}</span>
              <div class="file-sub">
                <span>ទំហំ៖ ${f.fileSize || '300 KB'}</span>
                <span>•</span>
                <span>កាលបរិច្ឆេទ៖ ${f.uploadedAt || '2026-10-14'}</span>
              </div>
            </div>
          </div>
          <div class="file-actions">
            ${isPdf ? `
              <button class="btn btn-secondary" onclick="App.openPdfModal('${safeUrl}', '${f.name}')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                បើកមើលក្នុង App
              </button>
            ` : ''}
            <a href="${safeUrl}" download class="btn btn-primary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              ទាញយក
            </a>
          </div>
        </div>
      `;
    }).join('');
  },

  renderNotesTab() {
    const listEl = document.getElementById('notes-list');
    if (!listEl || !this.currentLesson) return;

    const notes = StorageService.getNotes(this.currentLesson.id);
    if (notes.length === 0) {
      listEl.innerHTML = `
        <div style="text-align: center; padding: 24px; color: var(--text-muted); font-size: 0.88rem;">
          មិនទាន់មានកំណត់ត្រាផ្ទាល់ខ្លួននៅឡើយទេ។ អ្នកអាចកត់ចំណាំពេលកំពុងមើលវីដេអូបាន។
        </div>
      `;
      return;
    }

    listEl.innerHTML = notes.map(n => `
      <div class="note-item">
        <div class="note-header">
          <span class="note-time-badge" onclick="App.player.seekTo(${n.timestamp})">
            ⏱️ ${App.player.formatTime(n.timestamp)}
          </span>
          <button style="background:none; border:none; color:var(--text-muted); cursor:pointer;" onclick="App.deleteNote('${n.id}')">✕</button>
        </div>
        <p class="note-text">${n.text}</p>
      </div>
    `).join('');
  },

  addNote() {
    const textarea = document.getElementById('note-input-text');
    if (!textarea || !textarea.value.trim() || !this.currentLesson) return;

    const currentTime = this.player?.video?.currentTime || 0;
    const newNote = {
      id: 'note_' + Date.now(),
      text: textarea.value.trim(),
      timestamp: Math.floor(currentTime),
      createdAt: new Date().toLocaleDateString()
    };

    StorageService.saveNote(this.currentLesson.id, newNote);
    textarea.value = '';
    this.renderNotesTab();
    this.showToast('បានរក្សាទុកកំណត់ត្រាដោយជោគជ័យ!', 'success');
  },

  deleteNote(noteId) {
    if (!this.currentLesson) return;
    StorageService.deleteNote(this.currentLesson.id, noteId);
    this.renderNotesTab();
  },

  renderQuizTab() {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer || !this.currentLesson) return;

    const quiz = this.currentLesson.quiz || [];
    if (quiz.length === 0) {
      quizContainer.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🎯</div>
          <p>មិនទាន់មានលំហាត់តេស្តសម្រាប់មេរៀននេះនៅឡើយទេ</p>
        </div>
      `;
      return;
    }

    quizContainer.innerHTML = quiz.map((q, qIndex) => `
      <div class="quiz-card" data-q-index="${qIndex}">
        <h4 class="quiz-question">${qIndex + 1}. ${q.question}</h4>
        <div class="quiz-options">
          ${q.options.map((opt, optIndex) => `
            <div class="quiz-opt" onclick="App.checkQuizAnswer(${qIndex}, ${optIndex}, this)">
              <span style="font-weight:700; width:24px;">${String.fromCharCode(65 + optIndex)}.</span>
              <span>${opt}</span>
            </div>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="quiz-exp-${qIndex}">
          💡 <strong>ការពន្យល់៖</strong> ${q.explanation || 'ចម្លើយត្រឹមត្រូវ!'}
        </div>
      </div>
    `).join('');
  },

  checkQuizAnswer(qIndex, selectedOptIndex, element) {
    const quiz = this.currentLesson?.quiz?.[qIndex];
    if (!quiz) return;

    const card = element.closest('.quiz-card');
    const allOptions = card.querySelectorAll('.quiz-opt');
    const expBox = document.getElementById(`quiz-exp-${qIndex}`);

    allOptions.forEach(opt => opt.style.pointerEvents = 'none');

    if (selectedOptIndex === quiz.correct) {
      element.classList.add('correct');
      if (expBox) expBox.style.display = 'block';
      this.showToast('ចម្លើយត្រឹមត្រូវ! ពូកែណាស់ 🎉', 'success');
    } else {
      element.classList.add('wrong');
      allOptions[quiz.correct].classList.add('correct');
      if (expBox) expBox.style.display = 'block';
      this.showToast('មិនទាន់ត្រឹមត្រូវទេ! សូមមើលការពន្យល់បន្ថែម', 'error');
    }
  },

  renderOverviewTab() {
    const descEl = document.getElementById('lesson-overview-text');
    const teacherEl = document.getElementById('lesson-teacher-name');
    if (descEl) descEl.textContent = this.currentLesson?.description || this.currentCourse?.description || '';
    if (teacherEl) teacherEl.textContent = this.currentCourse?.teacher || 'សាស្រ្តាចារ្យ NGS';
  },

  // PDF Preview Modal
  openPdfModal(pdfUrl, pdfTitle) {
    const modal = document.getElementById('pdf-modal');
    const frame = document.getElementById('pdf-frame');
    const titleEl = document.getElementById('pdf-modal-title');
    const dlBtn = document.getElementById('pdf-modal-download');

    if (frame) frame.src = pdfUrl;
    if (titleEl) titleEl.textContent = pdfTitle || 'ឯកសារមេរៀន (PDF Preview)';
    if (dlBtn) dlBtn.href = pdfUrl;
    if (modal) modal.classList.add('active');
  },

  closePdfModal() {
    const modal = document.getElementById('pdf-modal');
    const frame = document.getElementById('pdf-frame');
    if (frame) frame.src = 'about:blank';
    if (modal) modal.classList.remove('active');
  },

  // Mobile Access Modal
  openMobileModal() {
    const modal = document.getElementById('mobile-modal');
    if (modal) modal.classList.add('active');
  },

  closeMobileModal() {
    const modal = document.getElementById('mobile-modal');
    if (modal) modal.classList.remove('active');
  },

  // Upload Modal
  openUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.add('active');
  },

  closeUploadModal() {
    const modal = document.getElementById('upload-modal');
    if (modal) modal.classList.remove('active');
    // Reset inputs
    document.getElementById('upload-form')?.reset();
    document.getElementById('video-file-preview').textContent = '';
    document.getElementById('pdf-file-preview').textContent = '';
    document.getElementById('upload-progress-bar').style.width = '0%';
    document.getElementById('upload-progress-container').style.display = 'none';
  },

  populateCourseSelect() {
    const select = document.getElementById('upload-course-select');
    if (!select) return;

    select.innerHTML = this.courses.map(c => `
      <option value="${c.id}">${c.title} (${c.grade})</option>
    `).join('');
  },

  async handleFormUpload(e) {
    e.preventDefault();
    const courseId = document.getElementById('upload-course-select').value;
    const lessonTitle = document.getElementById('upload-lesson-title').value.trim();
    const lessonCh = document.getElementById('upload-chapter-title').value.trim() || 'ជំពូកទូទៅ';
    const videoUrlInput = document.getElementById('upload-video-url').value.trim();
    const lessonDesc = document.getElementById('upload-lesson-desc').value.trim();

    const videoFileInput = document.getElementById('upload-video-file');
    const pdfFileInput = document.getElementById('upload-pdf-file');

    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const saveBtn = document.getElementById('btn-save-lesson');

    if (!lessonTitle) {
      alert('សូមបញ្ចូលចំណងជើងមេរៀនជាមុនសិន!');
      return;
    }

    let finalVideoUrl = videoUrlInput;
    let finalFiles = [];

    progressContainer.style.display = 'block';
    saveBtn.disabled = true;

    try {
      // 1. Upload Video if selected
      if (videoFileInput.files.length > 0) {
        progressBar.style.width = '20%';
        const res = await StorageService.uploadFile(videoFileInput.files[0], (pct) => {
          progressBar.style.width = `${Math.round(pct * 0.6)}%`;
        });
        if (res.files && res.files.length > 0) {
          finalVideoUrl = res.files[0].url;
        }
      }

      // 2. Upload PDF/Material if selected
      if (pdfFileInput.files.length > 0) {
        const file = pdfFileInput.files[0];
        const res = await StorageService.uploadFile(file, (pct) => {
          progressBar.style.width = `${60 + Math.round(pct * 0.35)}%`;
        });
        if (res.files && res.files.length > 0) {
          const uploaded = res.files[0];
          finalFiles.push({
            id: 'file_' + Date.now(),
            name: file.name.replace(/\.[^/.]+$/, ""),
            fileName: uploaded.fileName,
            fileUrl: uploaded.url,
            fileType: uploaded.type || 'pdf',
            fileSize: uploaded.size,
            uploadedAt: new Date().toISOString().split('T')[0]
          });
        }
      }

      progressBar.style.width = '100%';

      // 3. Construct Lesson object
      const newLesson = {
        id: 'les_' + Date.now(),
        title: lessonTitle,
        duration: '15:00',
        videoUrl: finalVideoUrl || 'Statistic.mp4',
        videoType: finalVideoUrl ? 'uploaded' : 'local',
        description: lessonDesc || 'មេរៀនដែលបានបន្ថែមថ្មី',
        files: finalFiles,
        quiz: []
      };

      // 4. Send to Server API
      await StorageService.addLesson(courseId, newLesson);

      this.showToast('បានបញ្ចូលមេរៀន និងឯកសារដោយជោគជ័យ! 🎉', 'success');
      this.closeUploadModal();

      // Reload courses
      await this.loadCourses();

      // If we are currently inside this course, refresh sidebar
      if (this.currentCourse && this.currentCourse.id === courseId) {
        this.currentCourse = this.courses.find(c => c.id === courseId);
        this.renderSidebarPlaylist();
        this.selectLesson(newLesson.id);
      }

    } catch (err) {
      console.error('Upload failed:', err);
      this.showToast('មានបញ្ហាក្នុងការ Upload! ' + err.message, 'error');
    } finally {
      saveBtn.disabled = false;
    }
  },

  showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span>${type === 'success' ? '✅' : '⚠️'}</span>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  bindGlobalEvents() {
    // Search Input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value;
        this.renderCourses();
      });
    }

    // Category Filter Pills
    document.querySelectorAll('.cat-pill').forEach(pill => {
      pill.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
        e.target.classList.add('active');
        this.currentCategory = e.target.getAttribute('data-cat');
        this.renderCourses();
      });
    });

    // File Preview Labels in Upload Modal
    const videoInput = document.getElementById('upload-video-file');
    if (videoInput) {
      videoInput.addEventListener('change', (e) => {
        const preview = document.getElementById('video-file-preview');
        if (e.target.files.length > 0) {
          preview.textContent = `🎬 ជ្រើសរើស៖ ${e.target.files[0].name} (${(e.target.files[0].size / 1024 / 1024).toFixed(1)} MB)`;
        } else {
          preview.textContent = '';
        }
      });
    }

    const pdfInput = document.getElementById('upload-pdf-file');
    if (pdfInput) {
      pdfInput.addEventListener('change', (e) => {
        const preview = document.getElementById('pdf-file-preview');
        if (e.target.files.length > 0) {
          preview.textContent = `📄 ជ្រើសរើស៖ ${e.target.files[0].name} (${(e.target.files[0].size / 1024).toFixed(0)} KB)`;
        } else {
          preview.textContent = '';
        }
      });
    }

    // Keyboard Shortcuts (Ctrl + K to search)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput?.focus();
      }
      if (e.key === 'Escape') {
        this.closePdfModal();
        this.closeUploadModal();
        this.closeMobileModal();
        this.closeStoreInfoModal();
        this.closeDiagnosticModal();
        this.closeLoginModal();
      }
    });
  },

  async confirmDeleteLesson(lessonId, lessonTitle) {
    if (!this.isAdmin) {
      alert('ទាមទារសិទ្ធិគ្រូបង្រៀន!');
      return;
    }
    if (!confirm(`តើលោកអ្នកពិតជាចង់លុប "${lessonTitle}" នេះមែនទេ?`)) {
      return;
    }
    try {
      await StorageService.deleteLesson(lessonId);
      this.showToast('បានលុបមេរៀនដោយជោគជ័យ!', 'success');
      await this.loadCourses();
      if (this.currentCourse) {
        this.currentCourse = this.courses.find(c => c.id === this.currentCourse.id);
        this.renderSidebarPlaylist();
        // If current lesson was deleted, select next lesson
        if (this.currentLesson?.id === lessonId) {
          const firstLesson = this.currentCourse?.chapters?.[0]?.lessons?.[0];
          if (firstLesson) {
            this.selectLesson(firstLesson.id);
          } else {
            this.backToCatalog();
          }
        }
      }
    } catch (err) {
      this.showToast('មានបញ្ហាក្នុងការលុប៖ ' + err.message, 'error');
    }
  }
};

// Initialize App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.App.init();
});
