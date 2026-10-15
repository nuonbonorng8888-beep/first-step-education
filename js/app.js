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
  quizScore: 0,
  answeredQuiz: {},
  worksheetsG11: {},
  teacherUnlocked: false,

  dailyQuotes: [
    { quote: "គណិតវិទ្យាគឺជាសិល្បៈនៃការផ្តល់ឈ្មោះដូចគ្នាដល់រឿងខុសៗគ្នា។", author: "Henri Poincaré" },
    { quote: "ធម្មជាតិគឺជាសៀវភៅធំមួយដែលសរសេរឡើងដោយភាសាគណិតវិទ្យា។", author: "Galileo Galilei" },
    { quote: "ការសិក្សាប្រៀបដូចជាការចែវទូកបញ្ច្រាសទឹក បើមិនខំទៅមុខ មុខជានឹងថយក្រោយ។", author: "សុភាសិតខ្មែរ" },
    { quote: "ភាពបរិសុទ្ធនៃគណិតវិទ្យា គឺស្ថិតនៅលើភាពសាមញ្ញ និងភាពស្រស់ស្អាតនៃតក្កវិជ្ជា។", author: "Albert Einstein" },
    { quote: "រៀនមួយជំហានម្តងៗ ដោយការយល់ច្បាស់ ប្រសើរជាងប្រញាប់តែមិនចាំ។", author: "1ˢᵗ Step Education" },
    { quote: "គ្មានផ្លូវកាត់ឆ្ពោះទៅរកធរណីមាត្រនោះទេ (No royal road to geometry)។", author: "Euclid" }
  ],
  quoteIndex: 0,

  mascotMessages: [
    "សួស្តី! ខ្ញុំជា 1ˢᵗ Step Mascot 🐾 រៀនមួយជំហានម្តងៗ ជោគជ័យនឹងនៅខាងមុខ ✨",
    "ថ្ងៃនេះតើប្អូនបានសាកល្បងលំហាត់ MCQ កម្រិតណាដែរ? ចុចជ្រើសរើសបានណា៎! 🎯",
    "កុំភ្លេចធ្វើតេស្តសមត្ថភាព ដើម្បីដឹងពីចំណុចខ្លាំង និងចំណុចត្រូវពង្រឹងបន្ថែម 💡",
    "គណិតវិទ្យាមិនពិបាកទេ ឱ្យតែយើងយល់ពីមូលដ្ឋានគ្រឹះច្បាស់លាស់ 🌟"
  ],
  mascotMsgIndex: 0,

  async init() {
    this.initTheme();
    this.checkAdminAuth();
    this.initPlayer();
    this.initGreetingAndWisdom();
    this.updateResumeBanner();
    this.bindGlobalEvents();
    await this.loadCourses();
    await this.loadWorksheets();
  },

  initGreetingAndWisdom() {
    const now = new Date();
    const hours = now.getHours();
    let greeting = "🌅 អរុណសួស្តីប្អូនៗ!";
    if (hours >= 12 && hours < 17) {
      greeting = "☀️ ទិវាសួស្តីប្អូនៗ!";
    } else if (hours >= 17 || hours < 5) {
      greeting = "🌙 សាយណ្ហសួស្តីប្អូនៗ!";
    }
    const greetEl = document.getElementById('mascot-greeting-text');
    if (greetEl) greetEl.textContent = greeting;

    this.renderDailyQuote();
  },

  renderDailyQuote() {
    const item = this.dailyQuotes[this.quoteIndex % this.dailyQuotes.length];
    const qEl = document.getElementById('daily-quote-text');
    const aEl = document.getElementById('daily-quote-author');
    if (qEl) qEl.textContent = `« ${item.quote} »`;
    if (aEl) aEl.textContent = `— ${item.author}`;
  },

  cycleDailyQuote() {
    this.quoteIndex++;
    this.renderDailyQuote();
  },

  cycleMascotMessage() {
    this.mascotMsgIndex = (this.mascotMsgIndex + 1) % this.mascotMessages.length;
    const qEl = document.getElementById('mascot-quote-text');
    if (qEl) qEl.textContent = this.mascotMessages[this.mascotMsgIndex];
  },

  updateResumeBanner() {
    const courseId = localStorage.getItem('ngs_last_course_id');
    const lessonId = localStorage.getItem('ngs_last_lesson_id');
    const lessonTitle = localStorage.getItem('ngs_last_lesson_title');
    const resumeCard = document.getElementById('hero-resume-card');
    const titleEl = document.getElementById('resume-lesson-title');
    if (courseId && lessonId && lessonTitle && resumeCard && titleEl) {
      titleEl.textContent = lessonTitle;
      resumeCard.style.display = 'flex';
    }
  },

  resumeLastLesson() {
    const courseId = localStorage.getItem('ngs_last_course_id');
    const lessonId = localStorage.getItem('ngs_last_lesson_id');
    if (courseId && lessonId) {
      this.openCourse(courseId);
      this.selectLesson(lessonId);
    }
  },

  setDockActive(buttonEl) {
    document.querySelectorAll('.dock-btn').forEach(btn => btn.classList.remove('active'));
    if (buttonEl) buttonEl.classList.add('active');
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
      const totalQuiz = course.chapters?.reduce((sum, ch) =>
        sum + ch.lessons?.reduce((qSum, l) => qSum + (l.quiz?.length || 0), 0)
      , 0) || 0;

      let gradeLabel = course.grade || 'NGS';
      let specialBadge = '🇰🇭 កម្មវិធីសិក្សាជាតិ MoEYS';
      if (course.id.includes('g12-advanced')) {
        specialBadge = '⭐ ត្រៀមបាក់ឌុប • វិទ្យាសាស្ត្រពិត';
      } else if (course.id.includes('g12-basic')) {
        specialBadge = '🌟 ត្រៀមបាក់ឌុប • វិទ្យាសាស្ត្រសង្គម';
      } else if (course.id.includes('g9')) {
        specialBadge = '🎯 ថ្នាក់ត្រៀមប្រឡងឌីប្លូម';
      }

      return `
        <div class="course-card ${course.id}" data-course-id="${course.id}">
          <div class="card-thumb-wrap">
            <img src="${course.coverImage}" alt="${course.title}" class="card-thumb" onerror="this.src='assets/moeys_grade12.jpg'">
            <div class="card-thumb-overlay"></div>
            <span class="card-grade-badge">${gradeLabel}</span>
            <span class="card-category-badge">${course.categoryLabel || 'គណិតវិទ្យា'}</span>
            <span class="card-moeys-badge">${specialBadge}</span>
          </div>
          <div class="card-body">
            <h3 class="card-title">${course.title}</h3>
            <p class="card-desc">${course.description || 'គ្មានសេចក្តីពិពណ៌នា'}</p>
            
            <div class="card-chips">
              <span class="card-chip lessons">🎬 ${totalLessons} មេរៀន</span>
              <span class="card-chip quiz">📝 ${totalQuiz} MCQ</span>
              <span class="card-chip pdf">📑 ${totalFiles} PDF</span>
            </div>

            <div class="card-teacher-line">
              <span>👨‍🏫 ដឹកនាំដោយលោកគ្រូជំនាញ NGS</span>
            </div>

            <div class="card-footer" style="margin-top: 14px;">
              <button class="btn btn-primary card-btn" onclick="App.openCourse('${course.id}')" style="width: 100%;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                ចូលរៀនមេរៀនឥឡូវនេះ
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

    try {
      localStorage.setItem('ngs_last_course_id', this.currentCourse?.id || '');
      localStorage.setItem('ngs_last_lesson_id', targetLesson.id);
      localStorage.setItem('ngs_last_lesson_title', targetLesson.title);
      localStorage.setItem('ngs_last_course_title', this.currentCourse?.title || '');
    } catch(e) {}
    this.updateResumeBanner();

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
    this.renderWorksheetTab();
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

    if (tabName === 'worksheet') {
      this.renderWorksheetTab();
    }
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

  // =========================================================================
  // Flipped Classroom Worksheets (សន្លឹកកិច្ចការតាមចំណុចនៃមេរៀន)
  // =========================================================================
  async loadWorksheets() {
    try {
      const res = await fetch('data/worksheets_g11.json');
      if (res.ok) {
        this.worksheetsG11 = await res.json();
      }
    } catch (e) {
      console.warn('Worksheets load warning:', e);
    }
  },

  renderWorksheetTab() {
    const container = document.getElementById('worksheet-container');
    if (!container) return;

    if (!this.currentLesson) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 2.5rem; margin-bottom: 12px;">📝</div>
          <h3>សូមជ្រើសរើសមេរៀនដើម្បីមើលសន្លឹកកិច្ចការ</h3>
        </div>
      `;
      return;
    }

    const ws = this.worksheetsG11?.[this.currentLesson.id];

    if (!ws) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-glass);">
          <div style="font-size: 3rem; margin-bottom: 14px;">📝</div>
          <h3 style="color: var(--text-primary); margin-bottom: 8px;">សន្លឹកកិច្ចការកំពុងត្រូវបានរៀបចំ</h3>
          <p style="font-size: 0.95rem; line-height: 1.6; max-width: 520px; margin: 0 auto 16px;">
            សន្លឹកកិច្ចការសម្រាប់មេរៀននេះ នឹងត្រូវដាក់ឱ្យអនុវត្តក្នុងពេលឆាប់ៗ។ បច្ចុប្បន្ន ប្រព័ន្ធគាំទ្រសន្លឹកកិច្ចការពេញលេញសម្រាប់គ្រប់មេរៀនថ្នាក់ទី ១១ ទាំងកម្រិតមូលដ្ឋាន និងកម្រិតខ្ពស់។
          </p>
          <button class="btn btn-primary" onclick="App.switchTab('materials')">
            📑 មើលឯកសារមេរៀនជំនួសវិញ
          </button>
        </div>
      `;
      return;
    }

    const isUnlocked = this.isAdmin || this.teacherUnlocked;

    container.innerHTML = `
      <div class="ws-container">
        <!-- Worksheet Screen Toolbar -->
        <div class="ws-toolbar">
          <div class="ws-toolbar-left">
            <span class="ws-badge-tag">
              <span>🏫</span>
              <span>វិទ្យាល័យព្រះស៊ីសុវត្ថិ • សាលារៀនជំនាន់ថ្មី (NGS)</span>
            </span>
            <span class="ws-badge-tag" style="background: rgba(16, 185, 129, 0.12); color: #059669; border-color: rgba(16, 185, 129, 0.3);">
              <span>🎯</span>
              <span>Flipped Classroom Model</span>
            </span>
          </div>

          <div class="ws-toolbar-actions">
            <button class="btn btn-primary" onclick="App.printWorksheet(false)" title="បោះពុម្ព ឬទាញយកជា PDF">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              🖨️ ទាញយកជា PDF / បោះពុម្ព
            </button>

            ${isUnlocked ? `
              <button class="btn btn-outline" style="border-color: #10b981; color: #10b981;" onclick="App.printWorksheet(true)" title="បោះពុម្ពរួមទាំងដំណោះស្រាយគ្រូ">
                🖨️ បោះពុម្ពដំណោះស្រាយ
              </button>
              <button class="btn btn-secondary" onclick="App.lockTeacherKey()" title="ចាក់សោដំណោះស្រាយឡើងវិញ">
                🔒 ចាក់សោដំណោះស្រាយ
              </button>
            ` : `
              <button class="btn btn-outline" onclick="App.openWorksheetUnlockModal()" title="សម្រាប់លោកគ្រូ-អ្នកគ្រូ">
                🔐 ដំណោះស្រាយគ្រូ (ជាប់សោ)
              </button>
            `}
          </div>
        </div>

        <!-- The Official Printable Paper Sheet -->
        <div class="worksheet-paper" id="printable-worksheet-paper">
          <!-- Header Banner (Strictly matching user uploaded screenshot) -->
          <div class="ws-header-banner">
            <div class="ws-school-logo-box">
              <img src="assets/school_logo.png" class="ws-school-logo" alt="Preah Sisowath NGS Logo">
            </div>
            <div class="ws-header-center">
              <h1 class="ws-header-title">${ws.sheetNumber}</h1>
            </div>
            <div class="ws-header-right">
              <h2 class="ws-header-lesson">${ws.lessonTitle}</h2>
            </div>
          </div>

          <!-- Student Information Fields -->
          <div class="ws-student-info">
            <div class="ws-info-row">
              <div class="ws-info-item" style="flex: 2;">
                <span class="ws-info-label">ឈ្មោះសិស្ស ៖</span>
                <span class="ws-info-dots"></span>
              </div>
              <div class="ws-info-item" style="flex: 1;">
                <span class="ws-info-label">ថ្នាក់ទី ៖</span>
                <span class="ws-info-dots"></span>
              </div>
            </div>
            <div class="ws-info-row">
              <div class="ws-info-item" style="flex: 2;">
                <span class="ws-info-label">កាលបរិច្ឆេទ ៖</span>
                <span class="ws-info-dots"></span>
              </div>
              <div class="ws-info-item" style="flex: 1;">
                <span class="ws-info-label">ពិន្ទុសរុប ៖</span>
                <span style="font-weight: 700; color: #dc2626;">........ / ១០</span>
              </div>
            </div>
          </div>

          <!-- Flipped Classroom Objective -->
          <div class="ws-objective-card">
            <div class="ws-objective-title">
              <span>🎯 គោលបំណងរង្វាយតម្លៃ (Flipped Classroom) ៖</span>
            </div>
            <div>${ws.objective}</div>
          </div>

          <!-- Exercises List -->
          <div class="ws-exercises-container">
            ${ws.exercises.map((ex, exIdx) => `
              <div class="ws-exercise-block">
                <div class="ws-ex-header">
                  <span class="ws-ex-num">លំហាត់ទី ${exIdx + 1}</span>
                  <span class="ws-ex-points">${ex.points} ពិន្ទុ</span>
                </div>

                <div class="ws-ex-instruction">${ex.instruction}</div>
                <div class="ws-ex-question">${ex.question}</div>

                <!-- Ruled Lined Space for Student Working -->
                <div class="ws-handwriting-space">
                  <span class="ws-handwriting-hint">(ទីកន្លែងសម្រាប់សិស្សគិតលេខ និងសរសេរដំណោះស្រាយ)</span>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Footer Banner (Strictly matching user uploaded screenshot) -->
          <div class="ws-footer-banner">
            <div class="ws-footer-label">ចំណាំ៖</div>
            <div class="ws-footer-points">
              <p>១. រាល់ការងារទាំងអស់សូមធ្វើដោយយកចិត្តទុកដាក់បំផុត ករណីមិនយល់សូមស្រាវជ្រាវ សួរគ្រូ ឬ មិត្ត ( ចម្លងក៏ដោយឲ្យតែយល់)</p>
              <p>២. សន្លឹកកិច្ចការខ្លះ ត្រូវនឹងសួរបញ្ជាក់ពេលដល់ម៉ោងជួបគ្នា បើឆ្លើយមិនចេញ នោះនឹងទទួលបានពិន្ទុ ០ លើការងារនេះ</p>
              <p>៣. សូមបញ្ជាក់សន្លឹកកិច្ចការទី.....( ទី២០ឬ ទី ២១,...)ដើម្បីស្រង់ពិន្ទុសកម្មភាព</p>
            </div>
          </div>
        </div>

        <!-- Teacher Solution Card (Protected by Passcode) -->
        <div id="ws-teacher-section">
          ${isUnlocked ? `
            <div class="ws-teacher-card unlocked">
              <div class="ws-unlocked-header">
                <div class="ws-unlocked-title">
                  <span>🔓</span>
                  <span>ដំណោះស្រាយលម្អិត & បន្ទាត់ពិន្ទុសម្រាប់គ្រូបង្រៀន (Teacher's Key)</span>
                </div>
                <div style="display:flex; gap:8px;">
                  <button class="btn btn-sm btn-outline" onclick="App.printWorksheet(true)">
                    🖨️ បោះពុម្ពដំណោះស្រាយ
                  </button>
                  <button class="btn btn-sm btn-secondary" onclick="App.lockTeacherKey()">
                    🔒 ចាក់សោឡើងវិញ
                  </button>
                </div>
              </div>

              <div class="ws-solutions-list">
                ${ws.exercises.map((ex, exIdx) => `
                  <div class="ws-solution-item">
                    <div class="ws-sol-item-header">
                      <span>ដំណោះស្រាយលំហាត់ទី ${exIdx + 1}</span>
                      <span style="color:#d97706; font-size:0.85rem;">[ពិន្ទុសរុប ៖ ${ex.points} ពិន្ទុ]</span>
                    </div>
                    <div class="ws-sol-body">${ex.solution}</div>
                    <div class="ws-sol-rubric">
                      <strong>បន្ទាត់ពិន្ទុ (Rubric) ៖</strong> ${ex.rubric}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : `
            <div class="ws-teacher-card locked">
              <div class="ws-lock-icon">🔒</div>
              <h3 class="ws-lock-title">ដំណោះស្រាយលម្អិត និងបន្ទាត់ពិន្ទុ (ជាប់សោ)</h3>
              <p class="ws-lock-desc">
                ដំណោះស្រាយលម្អិត និងបន្ទាត់ពិន្ទុសម្រាប់សន្លឹកកិច្ចការនេះ គឺរក្សាទុកជាការសម្ងាត់សម្រាប់តែលោកគ្រូ-អ្នកគ្រូប៉ុណ្ណោះ ដើម្បីវាស់ស្ទង់សមត្ថភាពសិស្សពិតប្រាកដ។
              </p>
              <button class="btn btn-primary" onclick="App.openWorksheetUnlockModal()">
                🔑 ដោះសោដំណោះស្រាយ (សម្រាប់គ្រូបង្រៀន)
              </button>
            </div>
          `}
        </div>
      </div>
    `;

    // Render mathematical formulas via KaTeX
    this.renderMath(container);
  },

  openWorksheetUnlockModal() {
    const modal = document.getElementById('worksheet-unlock-modal');
    const input = document.getElementById('worksheet-pin-input');
    const err = document.getElementById('worksheet-pin-error');
    if (err) err.style.display = 'none';
    if (input) input.value = '';
    if (modal) modal.classList.add('active');
    setTimeout(() => input?.focus(), 200);
  },

  closeWorksheetUnlockModal() {
    const modal = document.getElementById('worksheet-unlock-modal');
    if (modal) modal.classList.remove('active');
  },

  submitWorksheetPin() {
    const input = document.getElementById('worksheet-pin-input');
    const err = document.getElementById('worksheet-pin-error');
    const pin = input ? input.value.trim() : '';

    if (pin === '1234' || pin === '95511') {
      this.teacherUnlocked = true;
      this.closeWorksheetUnlockModal();
      this.renderWorksheetTab();
      this.showToast('បានដោះសោដំណោះស្រាយគ្រូបង្រៀនជោគជ័យ! 🔓', 'success');
    } else {
      if (err) {
        err.textContent = 'លេខកូដមិនត្រឹមត្រូវទេ! (សាកល្បងលេខ 1234)';
        err.style.display = 'block';
      }
      this.showToast('លេខកូដសម្ងាត់មិនត្រឹមត្រូវ!', 'error');
      input?.select();
    }
  },

  lockTeacherKey() {
    this.teacherUnlocked = false;
    this.renderWorksheetTab();
    this.showToast('បានចាក់សោដំណោះស្រាយឡើងវិញរួចរាល់ 🔒', 'info');
  },

  printWorksheet(includeSolutions = false) {
    const teacherSec = document.getElementById('ws-teacher-section');
    if (teacherSec) {
      if (includeSolutions && (this.isAdmin || this.teacherUnlocked)) {
        teacherSec.style.display = 'block';
      } else {
        teacherSec.style.display = 'none';
      }
    }
    window.print();
    // Restore display after print dialog closes
    setTimeout(() => {
      if (teacherSec) teacherSec.style.display = '';
    }, 1000);
  },

  renderQuizTab() {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer || !this.currentLesson) return;

    const quiz = this.currentLesson.quiz || [];
    if (quiz.length === 0) {
      quizContainer.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted);">
          <div style="font-size: 3rem; margin-bottom: 12px;">🎯</div>
          <h3>មិនទាន់មានលំហាត់តេស្តសម្រាប់មេរៀននេះនៅឡើយទេ</h3>
          <p style="font-size: 0.9rem; margin-top: 6px;">សូមជ្រើសរើសមេរៀនផ្សេងទៀត</p>
        </div>
      `;
      return;
    }

    this.quizScore = 0;
    this.answeredQuiz = {};
    const totalQ = quiz.length;

    quizContainer.innerHTML = `
      <div class="quiz-arena-header">
        <div class="arena-title-col">
          <div class="arena-kicker">
            <span class="arena-icon-badge">🎯</span>
            <span class="arena-kicker-text">លំហាត់អនុវត្តស្តង់ដារ PISA • ${this.currentLesson.title}</span>
          </div>
          <div class="arena-hint">សូមជ្រើសរើសចម្លើយដែលត្រឹមត្រូវ រួចផ្ទៀងផ្ទាត់ការពន្យល់លម្អិត</div>
        </div>
        <div class="arena-score-box">
          <div class="arena-score-val" id="quiz-live-score">0 / ${totalQ}</div>
          <div class="arena-score-lbl">ពិន្ទុរបស់អ្នក</div>
        </div>
      </div>

      <div class="quiz-questions-list">
        ${quiz.map((q, qIndex) => `
          <div class="quiz-card" data-q-index="${qIndex}">
            <div class="quiz-card-header">
              <div class="quiz-q-pill">
                <span class="q-pill-dot"></span>
                <span class="q-pill-text">សំណួរទី ${qIndex + 1} នៃ ${totalQ}</span>
              </div>
              <span class="quiz-status-pill" id="quiz-status-${qIndex}">មិនទាន់ឆ្លើយ</span>
            </div>

            <div class="quiz-question-box">
              <h4 class="quiz-question">${q.question}</h4>
            </div>

            <div class="quiz-options">
              ${q.options.map((opt, optIndex) => `
                <div class="quiz-opt" onclick="App.checkQuizAnswer(${qIndex}, ${optIndex}, this)" role="button" tabindex="0">
                  <div class="opt-badge">${String.fromCharCode(65 + optIndex)}</div>
                  <div class="opt-content">${opt}</div>
                </div>
              `).join('')}
            </div>

            <div class="quiz-explanation" id="quiz-exp-${qIndex}">
              <div class="exp-header">
                <span class="exp-icon">👨‍🏫</span>
                <span class="exp-title">ការពន្យល់លម្អិតពីលោកគ្រូ ៖</span>
              </div>
              <div class="exp-body">
                ${q.explanation || 'ចម្លើយត្រឹមត្រូវ!'}
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    this.renderMath(quizContainer);
  },

  renderMath(element) {
    const target = element || document.body;
    if (typeof renderMathInElement === 'function') {
      try {
        renderMathInElement(target, {
          delimiters: [
            { left: '$$', right: '$$', display: true },
            { left: '$', right: '$', display: false },
            { left: '\\(', right: '\\)', display: false },
            { left: '\\[', right: '\\]', display: true }
          ],
          macros: {
            "\\lim": "\\mathop{\\mathrm{lim}}\\limits",
            "\\sum": "\\mathop{\\mathrm{sum}}\\limits"
          },
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render warning:', err);
      }
    }
  },

  checkQuizAnswer(qIndex, selectedOptIndex, element) {
    const quiz = this.currentLesson?.quiz?.[qIndex];
    if (!quiz || this.answeredQuiz[qIndex]) return;

    this.answeredQuiz[qIndex] = true;
    const card = element.closest('.quiz-card');
    const allOptions = card.querySelectorAll('.quiz-opt');
    const expBox = document.getElementById(`quiz-exp-${qIndex}`);
    const statusPill = document.getElementById(`quiz-status-${qIndex}`);

    allOptions.forEach(opt => opt.style.pointerEvents = 'none');

    const totalQ = this.currentLesson.quiz.length;

    if (selectedOptIndex === quiz.correct) {
      element.classList.add('correct');
      this.quizScore++;
      if (statusPill) {
        statusPill.textContent = '✓ ត្រឹមត្រូវ';
        statusPill.className = 'quiz-status-pill correct';
      }
      if (expBox) {
        expBox.style.display = 'block';
        this.renderMath(expBox);
      }
      this.showToast('អស្ចារ្យណាស់! ចម្លើយត្រឹមត្រូវ 🎉', 'success');
    } else {
      element.classList.add('wrong');
      allOptions[quiz.correct].classList.add('correct');
      if (statusPill) {
        statusPill.textContent = '✕ មិនត្រឹមត្រូវ';
        statusPill.className = 'quiz-status-pill wrong';
      }
      if (expBox) {
        expBox.style.display = 'block';
        this.renderMath(expBox);
      }
      this.showToast('មិនទាន់ត្រឹមត្រូវទេ! សូមមើលការពន្យល់លម្អិតពីគ្រូ 👇', 'error');
    }

    const scoreEl = document.getElementById('quiz-live-score');
    if (scoreEl) {
      scoreEl.textContent = `${this.quizScore} / ${totalQ}`;
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
    const linkEl = document.getElementById('mobile-ip-link');
    if (linkEl && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      linkEl.textContent = window.location.origin;
    }
    if (modal) modal.classList.add('active');
  },

  closeMobileModal() {
    const modal = document.getElementById('mobile-modal');
    if (modal) modal.classList.remove('active');
  },

  copyMobileLink() {
    const linkEl = document.getElementById('mobile-ip-link');
    const link = (linkEl && linkEl.textContent.trim()) || window.location.origin;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        this.showToast('បានចម្លង Link រួចរាល់: ' + link, 'success');
      }).catch(() => {
        this.showToast('Link: ' + link, 'info');
      });
    } else {
      this.showToast('Link: ' + link, 'info');
    }
  },

  // Mobile Install Modal
  openMobileInstallModal() {
    const modal = document.getElementById('mobile-install-modal');
    if (modal) modal.classList.add('active');
  },

  closeMobileInstallModal() {
    const modal = document.getElementById('mobile-install-modal');
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
