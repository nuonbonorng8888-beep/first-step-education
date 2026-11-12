/**
 * NGS Unified Question Bank & Multi-Lesson Exam Generator
 * (ធនាគារសំណួរ ៥,៤៧០+ សំណួរ & ប្រព័ន្ធបង្កើតវិញ្ញាសាចម្រុះ ១០ MCQ + ៥ សរសេរ ជាមួយអត្រាកំណែ)
 * Strictly organizes questions by Lesson with ZERO cross-lesson leakage!
 */

class QuestionBankController {
  constructor() {
    this.database = null;
    this.customQuestions = this.loadCustomQuestions();
    this.selectedGrade = 'all';
    this.selectedLessonId = 'all';
    this.selectedLevel = 'all';
    this.searchQuery = '';
    this.selectedIds = new Set();
    this.currentPage = 1;
    this.pageSize = 12;
    this.isLoading = false;
    this.isInitialized = false;

    // Active generated exam state
    this.currentGeneratedExam = null;
  }

  loadCustomQuestions() {
    try {
      return JSON.parse(localStorage.getItem('ngs_custom_questions') || '[]');
    } catch (e) {
      return [];
    }
  }

  saveCustomQuestions() {
    try {
      localStorage.setItem('ngs_custom_questions', JSON.stringify(this.customQuestions));
    } catch (e) {}
  }

  /* ================== ROBUST LATEX CLEANSER ================== */
  cleanLatexFormula(formula) {
    if (!formula || typeof formula !== 'string') return '';
    let f = formula.replace(/^\$+|\$+$/g, '').trim();

    // 1. Control chars
    f = f.replace(/[\x08]ar/g, '\\bar');
    f = f.replace(/[\x08]egin/g, '\\begin');
    f = f.replace(/[\t]ext/g, '\\text');
    f = f.replace(/[\t]heta/g, '\\theta');
    f = f.replace(/[\t]imes/g, '\\times');
    f = f.replace(/[\t]an/g, '\\tan');
    f = f.replace(/[\t]o([\s\$]|$)/g, '\\to$1');
    f = f.replace(/[\t]riangle/g, '\\triangle');

    // 2. Forward slash typos (/dfrac, /frac, /text, /tx, /d, /sqrt, etc.)
    f = f.replace(/\/(?:dfrac|frac)\b/g, '\\dfrac');
    f = f.replace(/\/(?:text|tx)\b/g, '\\text');
    f = f.replace(/\/(?:d)\{/g, '\\dfrac{');
    f = f.replace(/\/(?:sqrt)\b/g, '\\sqrt');
    f = f.replace(/\\tx\b/g, '\\text');
    f = f.replace(/\/(pm|times|div|le|ge|ne|approx|sim|alpha|beta|theta|pi|Delta|lim|sum|int|infty|dots)\b/g, '\\$1');

    // 3. Standalone keywords without backslash
    f = f.replace(/(?:^|[^\\])\bdfrac(?=\{|\b)/g, '\\dfrac');
    f = f.replace(/(?:^|[^\\a-zA-Z])\bfrac(?=\{|\b)/g, '$1\\frac');

    const commonMacros = [
      'sqrt', 'text', 'overline', 'begin', 'end', 'pmatrix',
      'cdot', 'times', 'div', 'infty', 'lim', 'sum', 'int', 'vec', 'hat',
      'theta', 'cos', 'sin', 'tan', 'cot', 'log', 'ln', 'Delta', 'det', 'pm', 'le', 'ge', 'ne'
    ];
    commonMacros.forEach(macro => {
      const reg = new RegExp('(^|[^\\\\a-zA-Z])' + macro + '(?=[^a-zA-Z]|$)', 'g');
      f = f.replace(reg, '$1\\' + macro);
    });

    // 4. Clean up corrupted combinations and multiple backslashes
    f = f.replace(/\\?d\\frac/g, '\\dfrac');
    f = f.replace(/\\{2,}/g, '\\');

    return f;
  }

  formatMath(text) {
    if (!text || typeof text !== 'string') return '';
    if (typeof katex === 'undefined') return text;

    return text.replace(/\$([^\$]+)\$/g, (match, formula) => {
      try {
        const clean = this.cleanLatexFormula(formula);
        return katex.renderToString(clean, { throwOnError: false, displayMode: false });
      } catch (e) {
        return formula;
      }
    });
  }

  /* ================== DATABASE INITIALIZATION ================== */
  async init() {
    if (this.isInitialized && this.database && this.database.questions) return;
    this.isLoading = true;

    try {
      const res = await fetch('data/question_bank.json');
      if (res.ok) {
        this.database = await res.json();
      }
    } catch (err) {
      console.warn('Could not load question_bank.json:', err);
    }

    this.isLoading = false;
    this.isInitialized = true;
  }

  getAllQuestions() {
    const base = (this.database && this.database.questions) || [];
    const custom = this.customQuestions || [];
    return [...custom, ...base];
  }

  getGradeCounts() {
    const all = this.getAllQuestions();
    const counts = {
      all: all.length,
      'ថ្នាក់ទី ៧': 0,
      'ថ្នាក់ទី ៨': 0,
      'ថ្នាក់ទី ៩': 0,
      'ថ្នាក់ទី ១០': 0,
      'ថ្នាក់ទី ១១': 0,
      'ថ្នាក់ទី ១២': 0
    };

    all.forEach(q => {
      const g = q.g;
      if (counts[g] !== undefined) counts[g]++;
      else {
        // match ថ្នាក់ទី X
        for (const k of Object.keys(counts)) {
          if (g && g.includes(k)) counts[k]++;
        }
      }
    });

    return counts;
  }

  /**
   * Returns list of lessons for a given course or grade, strictly preserving IDs
   */
  getLessonsForGrade(grade) {
    const all = this.getAllQuestions();
    const lessonMap = new Map();

    all.forEach(q => {
      let matches = false;
      const ct = q.courseTitle || '';
      if (!grade || grade === 'all') {
        matches = true;
      } else if (grade.includes('មូលដ្ឋាន')) {
        matches = ct.includes('មូលដ្ឋាន') && (
          (grade.includes('១១') && ct.includes('១១')) ||
          (grade.includes('១២') && ct.includes('១២'))
        );
      } else if (grade.includes('កម្រិតខ្ពស់')) {
        matches = ct.includes('កម្រិតខ្ពស់') && (
          (grade.includes('១១') && ct.includes('១១')) ||
          (grade.includes('១២') && ct.includes('១២'))
        );
      } else {
        matches = q.g === grade || ct.includes(grade);
      }

      if (matches && q.lesId) {
        if (!lessonMap.has(q.lesId)) {
          lessonMap.set(q.lesId, {
            id: q.lesId,
            title: q.l || q.lesId,
            chapterTitle: q.ch || 'ជំពូកទូទៅ',
            grade: q.g,
            courseTitle: ct,
            questionCount: 0
          });
        }
        lessonMap.get(q.lesId).questionCount++;
      }
    });

    return Array.from(lessonMap.values());
  }

  /* ================== PERMISSION GATE ================== */
  isTeacherAdmin() {
    return window.App && window.App.isAdmin;
  }

  checkBankAccess() {
    if (this.isTeacherAdmin()) return true;

    // Show friendly permission locked modal
    this.showLockedNotice();
    return false;
  }

  showLockedNotice() {
    const activeTeacherName = window.App?.currentTeacher?.name || 'លោកគ្រូ-អ្នកគ្រូ';
    const modalHtml = `
      <div class="modal-overlay active" id="bank-locked-modal" onclick="if(event.target===this) this.remove()">
        <div class="modal-card" style="max-width: 520px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.4); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
          <div style="font-size: 3.2rem; margin-bottom: 6px;">🔒</div>
          <h3 style="color: #f87171; font-size: 1.25rem; font-weight: 800; margin-bottom: 6px;">
            ធនាគារសំណួរត្រូវបានចាក់សោ (Admin Only)
          </h3>
          <div style="background: rgba(239, 68, 68, 0.1); border-radius: 12px; padding: 12px 16px; margin: 10px 0 14px 0; text-align: left; font-size: 0.85rem; line-height: 1.6; color: var(--text-secondary);">
            <div style="font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">
              សួស្តី ${activeTeacherName}!
            </div>
            មុខងារគ្រប់គ្រង & កែសម្រួលធនាគារសំណួរដើម (៥,៤៧០ សំណួរ) ត្រូវបានកំណត់សម្រាប់តែ <strong>Admin (លោកគ្រូ នួន បូណង)</strong> ប៉ុណ្ណោះ ដើម្បីធានាសុវត្ថិភាពទិន្នន័យ។
          </div>

          <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 12px 16px; text-align: left; font-size: 0.84rem; line-height: 1.6; margin-bottom: 16px;">
            <div style="color: #10b981; font-weight: 700; margin-bottom: 6px;">✨ សិទ្ធិពេញលេញរបស់លោកគ្រូ-អ្នកគ្រូជាសមាជិក ៖</div>
            <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 6px;">
              <li style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #10b981;">✔</span>
                <strong>បង្កើតវិញ្ញាសា ៖</strong> បង្កើតវិញ្ញាសាប្រឡង (១០ MCQ + ៥ សរសេរ) ជាមួយអត្រាកំណែ
              </li>
              <li style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #10b981;">✔</span>
                <strong>ប្រឡងសិស្ស ៖</strong> បង្កើត Link ប្រឡង Online និងកត់ត្រាពិន្ទុចូល Google Sheets
              </li>
              <li style="display: flex; align-items: center; gap: 8px;">
                <span style="color: #10b981;">✔</span>
                <strong>ស្រង់សន្លឹកកិច្ចការ ៖</strong> ទាញយក & បោះពុម្ពសន្លឹកកិច្ចការគ្រប់កម្រិតថ្នាក់
              </li>
            </ul>
          </div>

          <div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary" onclick="document.getElementById('bank-locked-modal').remove(); window.questionBank.openMultiLessonExamModal();" style="font-size: 0.82rem; padding: 7px 14px;">
              🎲 បង្កើតវិញ្ញាសាប្រឡង
            </button>
            <button class="btn btn-outline" onclick="document.getElementById('bank-locked-modal').remove(); window.App?.openLoginModal();" style="font-size: 0.82rem; padding: 7px 14px; border-color: #38bdf8; color: #38bdf8;">
              🔐 ចូលគណនី Admin
            </button>
            <button class="btn btn-secondary" onclick="document.getElementById('bank-locked-modal').remove();" style="font-size: 0.82rem; padding: 7px 14px;">
              បិទ
            </button>
          </div>
        </div>
      </div>
    `;

    const existing = document.getElementById('bank-locked-modal');
    if (existing) existing.remove();

    document.body.insertAdjacentHTML('beforeend', modalHtml);
  }

  /* ================== MULTI-LESSON EXAM BUILDER (STRICT MATCHING) ================== */
  async openMultiLessonExamModal(defaultGrade = 'ថ្នាក់ទី ១១') {
    await this.init();

    const currentTeacher = window.App?.currentTeacher;
    const teacherName = currentTeacher ? currentTeacher.name : 'លោកគ្រូ នួន បូណង';
    const schoolName = (currentTeacher && currentTeacher.school) ? currentTeacher.school : 'វិទ្យាល័យព្រះស៊ីសុវត្ថិ (NGS)';

    const modalBack = document.createElement('div');
    modalBack.id = 'multiLessonExamModal';
    modalBack.className = 'modal-overlay active';
    modalBack.onclick = (e) => {
      if (e.target === modalBack) modalBack.remove();
    };

    modalBack.innerHTML = `
      <div class="modal-card" style="max-width: 880px; width: 95%; max-height: 90vh; overflow-y: auto;">
        <!-- Header -->
        <div class="modal-header" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              <span>🎲 បង្កើតវិញ្ញាសាបញ្ចប់មេរៀន / វិញ្ញាសាចម្រុះ</span>
              <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; background: rgba(168, 85, 247, 0.2); color: #c084fc; font-weight: 700;">
                ១០ MCQ + ៥ សរសេរ
              </span>
            </h3>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              ជ្រើសរើសមេរៀនចំនួន ១, ២ ឬ ៣ — សំណួរនឹងចេញពីមេរៀនដែលបានជ្រើស <strong>១០០% ដោយគ្មានមេរៀនផ្សេងលាយឡំ</strong>!
            </p>
          </div>
          <button class="btn-icon" onclick="document.getElementById('multiLessonExamModal').remove()">✕</button>
        </div>

        <!-- Grade & Stream Selector Row -->
        <div style="display: flex; flex-wrap: wrap; gap: 8px; align-items: center; margin-bottom: 16px;">
          <span style="font-size: 0.82rem; font-weight: 700; color: var(--text-secondary);">កម្រិតថ្នាក់ & កម្រិត ៖</span>
          <div style="display: flex; flex-wrap: wrap; gap: 6px;" id="examGradePills">
            ${[
              { id: 'ថ្នាក់ទី ៧', label: 'ថ្នាក់ទី ៧' },
              { id: 'ថ្នាក់ទី ៨', label: 'ថ្នាក់ទី ៨' },
              { id: 'ថ្នាក់ទី ៩', label: 'ថ្នាក់ទី ៩' },
              { id: 'ថ្នាក់ទី ១០', label: 'ថ្នាក់ទី ១០' },
              { id: 'ថ្នាក់ទី ១១ (មូលដ្ឋាន)', label: 'ថ្នាក់ទី ១១ [មូលដ្ឋាន]' },
              { id: 'ថ្នាក់ទី ១១ (កម្រិតខ្ពស់)', label: 'ថ្នាក់ទី ១១ [កម្រិតខ្ពស់]' },
              { id: 'ថ្នាក់ទី ១២ (មូលដ្ឋាន)', label: 'ថ្នាក់ទី ១២ [មូលដ្ឋាន]' },
              { id: 'ថ្នាក់ទី ១២ (កម្រិតខ្ពស់)', label: 'ថ្នាក់ទី ១២ [កម្រិតខ្ពស់]' }
            ].map(g => `
              <button type="button" data-grade="${g.id}" class="btn btn-sm ${g.id === defaultGrade ? 'btn-primary' : 'btn-outline'}" 
                style="padding: 4px 10px; font-size: 0.78rem; border-radius: 8px;"
                onclick="window.questionBank.switchExamGrade('${g.id}')">
                ${g.label}
              </button>
            `).join('')}
          </div>
        </div>

        <!-- Mode Selector (1 Lesson vs 2 Lessons vs 3 Lessons) -->
        <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px; margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; flex-wrap: wrap; gap: 8px;">
            <label style="font-size: 0.82rem; font-weight: 700; color: var(--text-primary);">
              ទម្រង់វិញ្ញាសា (Exam Structure) ៖
            </label>
            <div style="display: flex; gap: 6px;">
              <button type="button" id="btnMode1Les" class="btn btn-sm btn-outline" style="font-size: 0.76rem; padding: 4px 10px;" onclick="window.questionBank.setLessonCountMode(1)">
                ១ មេរៀន
              </button>
              <button type="button" id="btnMode2Les" class="btn btn-sm btn-primary" style="font-size: 0.76rem; padding: 4px 10px;" onclick="window.questionBank.setLessonCountMode(2)">
                ២ មេរៀនចម្រុះ
              </button>
              <button type="button" id="btnMode3Les" class="btn btn-sm btn-outline" style="font-size: 0.76rem; padding: 4px 10px;" onclick="window.questionBank.setLessonCountMode(3)">
                ៣ មេរៀនចម្រុះ
              </button>
            </div>
          </div>

          <!-- Total Counter & Balance Helper Banner -->
          <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(168, 85, 247, 0.1); border: 1px dashed rgba(168, 85, 247, 0.3); border-radius: 8px; padding: 8px 12px; flex-wrap: wrap; gap: 8px;">
            <div id="examQuestionCounterBadge" style="font-size: 0.82rem; font-weight: 700; color: #c084fc;">
              📊 បែងចែក ៖ MCQ: 10 / 10 | សរសេរ: 5 / 5 | សរុប: 15 សំណួរ (២០ ពិន្ទុ)
            </div>
            <button type="button" class="btn btn-sm btn-secondary" onclick="window.questionBank.autoBalanceQuestions()" style="font-size: 0.74rem; padding: 3px 8px;">
              ⚡ ចែកស្វ័យប្រវត្ត (Auto Balance)
            </button>
          </div>
        </div>

        <!-- Lessons Selection Slots Container -->
        <div id="examLessonSlotsContainer" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
          <!-- Dynamically populated lesson slot rows -->
        </div>

        <!-- Exam Meta Configurations -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; margin-bottom: 16px; background: rgba(15, 23, 42, 0.4); border-radius: 12px; padding: 12px; border: 1px solid var(--border-glass);">
          <div>
            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              ចំណងជើងវិញ្ញាសា
            </label>
            <input type="text" id="examMetaTitle" class="form-input" style="font-size: 0.82rem;" value="វិញ្ញាសាប្រឡងគណិតវិទ្យាបញ្ចប់មេរៀន (${defaultGrade})">
          </div>
          <div>
            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              រយៈពេលប្រឡង
            </label>
            <select id="examMetaDuration" class="form-input" style="font-size: 0.82rem;">
              <option value="៤៥ នាទី">៤៥ នាទី</option>
              <option value="៦០ នាទី" selected>៦០ នាទី (ស្តង់ដា)</option>
              <option value="៩០ នាទី">៩០ នាទី (ទូទៅ)</option>
              <option value="១២០ នាទី">១២០ នាទី (ឆមាស)</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.76rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              គ្រូបង្រៀន & កាលបរិច្ឆេទ
            </label>
            <input type="text" id="examMetaTeacher" class="form-input" style="font-size: 0.82rem;" value="${teacherName} (${schoolName})">
          </div>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-glass); padding-top: 14px;">
          <button type="button" class="btn btn-secondary" onclick="document.getElementById('multiLessonExamModal').remove()">
            បោះបង់
          </button>
          <button type="button" class="btn btn-primary" onclick="window.questionBank.executeGenerateExam()" style="padding: 8px 20px; font-weight: 700; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
            <span>✨ បង្កើតវិញ្ញាសា & អត្រាកំណែ</span>
            <span>➔</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalBack);

    // Initial state
    this.examConfig = {
      grade: defaultGrade,
      lessonMode: 2,
      lessons: [
        { lesId: '', mcqCount: 5, writtenCount: 3, level: 'all' },
        { lesId: '', mcqCount: 5, writtenCount: 2, level: 'all' }
      ]
    };

    this.renderExamSlots();
  }

  switchExamGrade(grade) {
    if (!this.examConfig) return;
    this.examConfig.grade = grade;

    const pillsContainer = document.getElementById('examGradePills');
    if (pillsContainer) {
      pillsContainer.querySelectorAll('button').forEach(btn => {
        const bg = btn.getAttribute('data-grade') || btn.textContent.trim();
        if (bg === grade) btn.className = 'btn btn-sm btn-primary';
        else btn.className = 'btn btn-sm btn-outline';
      });
    }

    const titleInput = document.getElementById('examMetaTitle');
    if (titleInput) {
      titleInput.value = `វិញ្ញាសាប្រឡងគណិតវិទ្យាបញ្ចប់មេរៀន (${grade})`;
    }

    // Reset lesson slots for the new grade
    const lessonsList = this.getLessonsForGrade(grade);
    this.examConfig.lessons.forEach((slot, idx) => {
      if (lessonsList[idx]) {
        slot.lesId = lessonsList[idx].id;
      } else if (lessonsList[0]) {
        slot.lesId = lessonsList[0].id;
      }
    });

    this.renderExamSlots();
  }

  setLessonCountMode(count) {
    if (!this.examConfig) return;
    this.examConfig.lessonMode = count;

    ['1Les', '2Les', '3Les'].forEach((m, idx) => {
      const btn = document.getElementById(`btnMode${m}`);
      if (btn) {
        btn.className = (idx + 1 === count) ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-outline';
      }
    });

    if (count === 1) {
      this.examConfig.lessons = [
        { lesId: '', mcqCount: 10, writtenCount: 5, level: 'all' }
      ];
    } else if (count === 2) {
      this.examConfig.lessons = [
        { lesId: '', mcqCount: 5, writtenCount: 3, level: 'all' },
        { lesId: '', mcqCount: 5, writtenCount: 2, level: 'all' }
      ];
    } else if (count === 3) {
      this.examConfig.lessons = [
        { lesId: '', mcqCount: 4, writtenCount: 2, level: 'all' },
        { lesId: '', mcqCount: 3, writtenCount: 2, level: 'all' },
        { lesId: '', mcqCount: 3, writtenCount: 1, level: 'all' }
      ];
    }

    this.renderExamSlots();
  }

  autoBalanceQuestions() {
    if (!this.examConfig) return;
    const mode = this.examConfig.lessonMode;

    if (mode === 1) {
      this.examConfig.lessons[0].mcqCount = 10;
      this.examConfig.lessons[0].writtenCount = 5;
    } else if (mode === 2) {
      this.examConfig.lessons[0].mcqCount = 5;
      this.examConfig.lessons[0].writtenCount = 3;
      this.examConfig.lessons[1].mcqCount = 5;
      this.examConfig.lessons[1].writtenCount = 2;
    } else if (mode === 3) {
      this.examConfig.lessons[0].mcqCount = 4;
      this.examConfig.lessons[0].writtenCount = 2;
      this.examConfig.lessons[1].mcqCount = 3;
      this.examConfig.lessons[1].writtenCount = 2;
      this.examConfig.lessons[2].mcqCount = 3;
      this.examConfig.lessons[2].writtenCount = 1;
    }

    this.renderExamSlots();
  }

  renderExamSlots() {
    const container = document.getElementById('examLessonSlotsContainer');
    if (!container || !this.examConfig) return;

    const lessonsList = this.getLessonsForGrade(this.examConfig.grade);

    container.innerHTML = this.examConfig.lessons.map((slot, idx) => {
      // Pick initial lesId if empty
      if (!slot.lesId && lessonsList.length > idx) {
        slot.lesId = lessonsList[idx].id;
      }

      return `
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid var(--border-glass); border-radius: 12px; padding: 12px 14px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="width: 24px; height: 24px; border-radius: 50%; background: #9333ea; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.74rem; font-weight: 800;">
                ${idx + 1}
              </span>
              <strong style="font-size: 0.86rem; color: var(--text-primary);">
                ជ្រើសរើសមេរៀនទី ${idx + 1}
              </strong>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.74rem; color: var(--text-muted);">កម្រិត ៖</span>
              <select class="form-input" style="padding: 2px 8px; font-size: 0.75rem; width: auto;"
                onchange="window.questionBank.updateExamSlotLevel(${idx}, this.value)">
                <option value="all" ${slot.level === 'all' ? 'selected' : ''}>ចម្រុះ (ងាយ+មធ្យម+ពិបាក)</option>
                <option value="ងាយ" ${slot.level === 'ងាយ' ? 'selected' : ''}>ងាយ</option>
                <option value="មធ្យម" ${slot.level === 'មធ្យម' ? 'selected' : ''}>មធ្យម</option>
                <option value="ពិបាក" ${slot.level === 'ពិបាក' ? 'selected' : ''}>ពិបាក</option>
              </select>
            </div>
          </div>

          <!-- Lesson dropdown -->
          <div style="margin-bottom: 10px;">
            <select class="form-input" style="font-size: 0.84rem; font-weight: 600;"
              onchange="window.questionBank.updateExamSlotLesson(${idx}, this.value)">
              ${lessonsList.map(les => `
                <option value="${les.id}" ${slot.lesId === les.id ? 'selected' : ''}>
                  [${les.chapterTitle}] ➔ ${les.title} (${les.questionCount} សំណួរ)
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Allocation Inputs -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(15, 23, 42, 0.3); border-radius: 8px; padding: 8px 12px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <label style="font-size: 0.78rem; font-weight: 600; color: #38bdf8;">
                📝 ចំនួន MCQ ៖
              </label>
              <input type="number" min="0" max="10" value="${slot.mcqCount}" 
                class="form-input" style="width: 70px; text-align: center; font-weight: 700; padding: 4px;"
                onchange="window.questionBank.updateExamSlotCount(${idx}, 'mcqCount', this.value)">
            </div>
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
              <label style="font-size: 0.78rem; font-weight: 600; color: #f59e0b;">
                ✍️ ចំនួន សរសេរ ៖
              </label>
              <input type="number" min="0" max="5" value="${slot.writtenCount}" 
                class="form-input" style="width: 70px; text-align: center; font-weight: 700; padding: 4px;"
                onchange="window.questionBank.updateExamSlotCount(${idx}, 'writtenCount', this.value)">
            </div>
          </div>
        </div>
      `;
    }).join('');

    this.updateExamCounterBadge();
  }

  updateExamSlotLesson(idx, lesId) {
    if (this.examConfig && this.examConfig.lessons[idx]) {
      this.examConfig.lessons[idx].lesId = lesId;
    }
  }

  updateExamSlotLevel(idx, val) {
    if (this.examConfig && this.examConfig.lessons[idx]) {
      this.examConfig.lessons[idx].level = val;
    }
  }

  updateExamSlotCount(idx, field, val) {
    if (this.examConfig && this.examConfig.lessons[idx]) {
      this.examConfig.lessons[idx][field] = Math.max(0, parseInt(val, 10) || 0);
      this.updateExamCounterBadge();
    }
  }

  updateExamCounterBadge() {
    const badge = document.getElementById('examQuestionCounterBadge');
    if (!badge || !this.examConfig) return;

    let totMcq = 0;
    let totWritten = 0;
    this.examConfig.lessons.forEach(l => {
      totMcq += l.mcqCount;
      totWritten += l.writtenCount;
    });

    const isMcqOk = totMcq === 10;
    const isWrittenOk = totWritten === 5;
    const isAllOk = isMcqOk && isWrittenOk;

    badge.innerHTML = `
      <span style="color: ${isAllOk ? '#10b981' : '#f59e0b'};">
        ${isAllOk ? '✅' : '⚠️'} បែងចែក ៖ 
        MCQ: <strong>${totMcq}</strong>/10 ${isMcqOk ? '✔' : ''} | 
        សរសេរ: <strong>${totWritten}</strong>/5 ${isWrittenOk ? '✔' : ''} | 
        សរុប: <strong>${totMcq + totWritten}</strong>/15 (២០ ពិន្ទុ)
      </span>
    `;
  }

  /* ================== EXAM GENERATION (STRICT ZERO-LEAKAGE) ================== */
  executeGenerateExam() {
    if (!this.examConfig) return;

    const allQuestions = this.getAllQuestions();
    const selectedMCQs = [];
    const selectedWritten = [];
    const usedIds = new Set();
    const chosenLessonTitles = [];

    for (let sIdx = 0; sIdx < this.examConfig.lessons.length; sIdx++) {
      const slot = this.examConfig.lessons[sIdx];
      
      // STRICT FILTER BY EXACT LESSON ID:
      let pool = allQuestions.filter(q => q.lesId === slot.lesId);

      // If slot.lesId wasn't set, try matching by title
      if (pool.length === 0 && slot.lessonTitle) {
        pool = allQuestions.filter(q => q.l === slot.lessonTitle);
      }

      // If still 0, find first lesson matching this grade
      if (pool.length === 0) {
        const gradeLessons = this.getLessonsForGrade(this.examConfig.grade);
        if (gradeLessons.length > sIdx) {
          slot.lesId = gradeLessons[sIdx].id;
          pool = allQuestions.filter(q => q.lesId === slot.lesId);
        }
      }

      const lessonTitle = pool[0]?.l || `មេរៀនទី ${sIdx + 1}`;
      chosenLessonTitles.push(lessonTitle);

      // Filter by level with smart prioritization strictly within this lesson
      let combinedPool = [];
      if (slot.level && slot.level !== 'all') {
        const matchingLevel = pool.filter(q => q.level === slot.level || (slot.level === 'ងាយ' && q.level === 'ស្រួល') || (slot.level === 'ស្រួល' && q.level === 'ងាយ'));
        const otherLevel = pool.filter(q => !matchingLevel.includes(q));
        const shuffledMatches = [...matchingLevel].sort(() => Math.random() - 0.5);
        const shuffledOthers = [...otherLevel].sort(() => Math.random() - 0.5);
        combinedPool = [...shuffledMatches, ...shuffledOthers];
      } else {
        combinedPool = [...pool].sort(() => Math.random() - 0.5);
      }

      // 1. Pick MCQs for this lesson strictly from this lesson
      let mcqAdded = 0;
      for (const q of combinedPool) {
        if (mcqAdded >= slot.mcqCount) break;
        if (!usedIds.has(q.id)) {
          selectedMCQs.push({ ...q, originLesson: lessonTitle });
          usedIds.add(q.id);
          mcqAdded++;
        }
      }

      // 2. Pick Written Problems for this lesson strictly from remaining questions of this lesson
      let writtenAdded = 0;
      for (const q of combinedPool) {
        if (writtenAdded >= slot.writtenCount) break;
        if (!usedIds.has(q.id)) {
          selectedWritten.push({ ...q, originLesson: lessonTitle });
          usedIds.add(q.id);
          writtenAdded++;
        }
      }
    }

    // Close config modal
    const configModal = document.getElementById('multiLessonExamModal');
    if (configModal) configModal.remove();

    // Prepare complete Exam Data
    const examData = {
      title: document.getElementById('examMetaTitle')?.value || `វិញ្ញាសាប្រឡងគណិតវិទ្យាបញ្ចប់មេរៀន (${this.examConfig.grade})`,
      grade: this.examConfig.grade,
      duration: document.getElementById('examMetaDuration')?.value || '៦០ នាទី',
      teacher: document.getElementById('examMetaTeacher')?.value || 'លោកគ្រូ នួន បូណង (វិទ្យាល័យព្រះស៊ីសុវត្ថិ NGS)',
      mcqs: selectedMCQs,
      written: selectedWritten,
      lessons: chosenLessonTitles,
      date: new Date().toLocaleDateString('km-KH', { year: 'numeric', month: 'long', day: 'numeric' })
    };

    this.currentGeneratedExam = examData;
    this.openExamPreviewModal(examData);
  }

  /* ================== EXAM PREVIEW & PRINT MODAL ================== */
  openExamPreviewModal(exam) {
    const modalBack = document.createElement('div');
    modalBack.id = 'examPreviewModalBack';
    modalBack.className = 'fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-3 md:p-6 bg-slate-900/80 backdrop-blur-sm';

    modalBack.innerHTML = `
      <div class="w-full max-w-5xl bg-white text-slate-900 rounded-2xl shadow-2xl overflow-hidden my-4">
        <!-- Top Toolbar -->
        <div class="no-print p-4 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">📑</span>
            <div>
              <h4 class="font-bold text-sm text-slate-800">${exam.title}</h4>
              <span class="text-xs text-slate-500">${exam.grade} • ${exam.mcqs.length} MCQ + ${exam.written.length} សរសេរ (ពិន្ទុសរុប ២០)</span>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap items-center gap-2">
            <button onclick="window.questionBank.printStudentExam()" class="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition">
              <span>📄 បោះពុម្ពវិញ្ញាសា</span>
            </button>
            <button onclick="window.questionBank.printTeacherKey()" class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-1.5 transition">
              <span>📑 បោះពុម្ពអត្រាកំណែ</span>
            </button>
            <button onclick="window.questionBank.copyExamText()" class="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs flex items-center gap-1 transition">
              <span>📋 ចម្លង</span>
            </button>
            <button onclick="window.questionBank.createOnlineExamLink()" class="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 transition">
              <span>🔗 Link ប្រឡង Online</span>
            </button>
            <button onclick="document.getElementById('examPreviewModalBack').remove()" class="px-3 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs">
              ✕ បិទ
            </button>
          </div>
        </div>

        <!-- Tab Controls -->
        <div class="no-print flex border-b border-slate-200 bg-slate-50 text-xs font-bold px-6 pt-2 gap-4">
          <button id="tabBtnPreviewExam" onclick="window.questionBank.switchPreviewTab('exam')" class="py-2.5 border-b-2 border-purple-600 text-purple-700 flex items-center gap-1.5">
            <span>📄 សន្លឹកវិញ្ញាសាប្រឡង (Student Sheet)</span>
          </button>
          <button id="tabBtnPreviewKey" onclick="window.questionBank.switchPreviewTab('key')" class="py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-1.5">
            <span>📑 អត្រាកំណែ & ដំណោះស្រាយ (Teacher Key)</span>
          </button>
        </div>

        <!-- Printable Document Body -->
        <div id="printableExamDoc" class="p-8 md:p-12 space-y-6 font-battambang bg-white text-slate-900">
          <!-- View 1: Student Exam Sheet -->
          <div id="viewStudentExam" class="space-y-6">
            <!-- MoEYS / School Header -->
            <div class="flex justify-between items-start border-b-2 border-slate-900 pb-4 text-center">
              <div class="text-left space-y-1">
                <p class="font-moul text-xs">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                <p class="font-bold text-xs text-purple-900">សាលារៀនជំនាន់ថ្មី (New Generation School)</p>
                <p class="text-xs">វិទ្យាល័យព្រះស៊ីសុវត្ថិ / វិទ្យាល័យព្រះយុគន្ធរ</p>
                <p class="text-xs text-slate-600">គ្រូបង្រៀន ៖ <strong>${exam.teacher}</strong></p>
              </div>
              <div class="text-center space-y-0.5">
                <p class="font-moul text-xs">ព្រះរាជាណាចក្រកម្ពុជា</p>
                <p class="font-moul text-xs">ជាតិ សាសនា ព្រះមហាក្សត្រ</p>
                <div class="text-sm">☸ ☸ ☸</div>
              </div>
            </div>

            <!-- Exam Title & Info -->
            <div class="text-center space-y-2 py-1">
              <h2 class="font-moul text-base md:text-lg text-slate-900">${exam.title}</h2>
              <p class="text-xs text-slate-500 font-bold">
                មេរៀនប្រឡង ៖ ${exam.lessons.join(' • ')}
              </p>
              <div class="flex justify-between items-center text-xs pt-3">
                <div>ឈ្មោះសិស្ស ៖ ................................................................</div>
                <div>ថ្នាក់ទី ៖ .............</div>
                <div>កាលបរិច្ឆេទ ៖ ..... / ..... / ២០២៦</div>
              </div>
              <div class="flex justify-between items-center text-xs text-slate-600 border-t border-dashed border-slate-300 pt-2">
                <div>មុខវិជ្ជា ៖ <strong>គណិតវិទ្យា</strong></div>
                <div>រយៈពេល ៖ <strong>${exam.duration}</strong></div>
                <div>ពិន្ទុសរុប ៖ <strong>២០ ពិន្ទុ</strong></div>
              </div>
            </div>

            <!-- PART 1: MCQ QUESTIONS (10 QUESTIONS - 10 POINTS) -->
            <div class="space-y-4 pt-2">
              <div class="p-2.5 bg-purple-50 rounded-lg border border-purple-200 flex items-center justify-between">
                <span class="font-bold text-xs text-purple-900 font-moul">
                  ផ្នែកទី ១ ៖ សំណួរពហុជ្រើសរើស (MCQ) — ចំនួន ១០ សំណួរ (១០ ពិន្ទុ)
                </span>
                <span class="text-[11px] text-purple-700 italic">ជ្រើសរើសចម្លើយត្រឹមត្រូវតែមួយគត់</span>
              </div>

              <div class="space-y-5">
                ${exam.mcqs.map((q, idx) => `
                  <div class="space-y-2 break-inside-avoid">
                    <div class="font-bold text-sm leading-relaxed flex items-start gap-2">
                      <span class="font-mono text-purple-700 shrink-0">សំណួរទី ${idx + 1} ៖</span>
                      <span class="flex-1">${this.formatMath(q.q)}</span>
                      <span class="text-[10px] text-slate-400 font-normal px-2 py-0.5 rounded bg-slate-100">${q.originLesson || ''}</span>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pl-6 text-xs">
                      ${q.o.map((opt, oIdx) => `
                        <div class="flex items-center gap-1.5 p-1.5 rounded border border-slate-200">
                          <span class="font-bold text-slate-700">(${String.fromCharCode(65 + oIdx)})</span>
                          <span>${this.formatMath(opt)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- PART 2: WRITTEN PROBLEMS (5 QUESTIONS - 10 POINTS) -->
            <div class="space-y-4 pt-4 border-t-2 border-slate-900 break-before-page">
              <div class="p-2.5 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
                <span class="font-bold text-xs text-amber-900 font-moul">
                  ផ្នែកទី ២ ៖ លំហាត់សរសេរដោះស្រាយ — ចំនួន ៥ សំណួរ (១០ ពិន្ទុ - ១ លំហាត់ = ២ ពិន្ទុ)
                </span>
                <span class="text-[11px] text-amber-800 italic">ចូរគណនា និងបង្ហាញជំហានដោះស្រាយឱ្យបានក្បោះក្បាយ</span>
              </div>

              <div class="space-y-8">
                ${exam.written.map((q, idx) => `
                  <div class="space-y-2 break-inside-avoid">
                    <div class="font-bold text-sm leading-relaxed flex items-start gap-2">
                      <span class="font-mono text-amber-800 shrink-0">លំហាត់ទី ${idx + 1} (សំណួរទី ${idx + 11}) ៖</span>
                      <span class="flex-1">${this.formatMath(q.q)}</span>
                      <span class="text-[10px] font-bold text-amber-700 px-2 py-0.5 rounded bg-amber-100">[២ ពិន្ទុ]</span>
                    </div>
                    <!-- Student Calculation Box -->
                    <div style="min-height: 100px; border: 1px dashed #cbd5e1; border-radius: 8px; background: #fafafa; padding: 8px; margin-top: 6px;">
                      <span style="font-size: 10px; color: #94a3b8; font-style: italic;">(កន្លែងសម្រាប់សិស្សគណនា និងសរសេរដំណោះស្រាយ)</span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- View 2: Official Teacher's Answer Key (អត្រាកំណែ) -->
          <div id="viewTeacherKey" class="space-y-6 hidden break-before-page">
            <div class="text-center space-y-1 pb-4 border-b-2 border-slate-900">
              <h2 class="font-moul text-base text-purple-900">អត្រាកំណែផ្លូវការ និងតារាងពិន្ទុ (Official Answer Key & Rubric)</h2>
              <p class="text-xs text-slate-600 font-bold">${exam.title} • គណិតវិទ្យា ${exam.grade}</p>
              <p class="text-xs text-slate-500">គ្រូបង្រៀន ៖ ${exam.teacher}</p>
            </div>

            <!-- MCQ Answers Summary Table -->
            <div class="space-y-2">
              <h4 class="font-bold text-xs uppercase tracking-wider text-purple-800">
                តារាងចម្លើយផ្នែកទី ១ (សំណួរពហុជ្រើសរើស - ១ សំណួរ = ១ ពិន្ទុ) ៖
              </h4>
              <div class="grid grid-cols-5 sm:grid-cols-10 gap-2 text-xs">
                ${exam.mcqs.map((q, idx) => `
                  <div class="p-2 border-2 border-purple-200 rounded-lg text-center bg-purple-50">
                    <span class="text-slate-500 font-bold block text-[10px]">សំណួរ ${idx + 1}</span>
                    <strong class="text-purple-700 text-sm font-black">(${String.fromCharCode(65 + q.a)})</strong>
                    <span class="text-[9px] text-emerald-600 block font-bold">+១ ពិន្ទុ</span>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Detailed Written Solutions (កំណែខ្លីៗ & ដំណោះស្រាយ) -->
            <div class="space-y-4 pt-4 border-t border-slate-200">
              <h4 class="font-bold text-xs uppercase tracking-wider text-amber-800">
                ដំណោះស្រាយលម្អិត & កំណែខ្លីៗផ្នែកទី ២ (លំហាត់សរសេរ ៥ សំណួរ - ១ លំហាត់ = ២ ពិន្ទុ) ៖
              </h4>
              <div class="space-y-4">
                ${exam.written.map((q, idx) => `
                  <div class="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div class="flex justify-between items-center font-bold text-slate-800">
                      <span>លំហាត់ទី ${idx + 1} (សំណួរទី ${idx + 11}) ៖ ${this.formatMath(q.q)}</span>
                      <span class="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[11px]">២.០ ពិន្ទុ</span>
                    </div>
                    <div class="p-3 bg-white rounded-lg border border-slate-200 text-slate-700 leading-relaxed font-mono">
                      <strong>កំណែខ្លីៗ & ដំណោះស្រាយ ៖</strong><br>
                      ${this.formatMath(q.short_solution || q.e || 'ជំនួសតម្លៃ និងគណនាតាមរូបមន្តស្តង់ដា។')}
                    </div>
                    <div class="flex flex-wrap gap-4 text-[11px] text-slate-500 pt-1">
                      <span>• សរសេររូបមន្ត / កំណត់លក្ខខណ្ឌ ៖ <strong>០.៥ ពិន្ទុ</strong></span>
                      <span>• ជំហានជំនួសលេខ & គណនា ៖ <strong>១.០ ពិន្ទុ</strong></span>
                      <span>• ចម្លើយត្រឹមត្រូវចុងក្រោយ ៖ <strong>០.៥ ពិន្ទុ</strong></span>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBack);
  }

  switchPreviewTab(tab) {
    const studentView = document.getElementById('viewStudentExam');
    const teacherView = document.getElementById('viewTeacherKey');
    const btnExam = document.getElementById('tabBtnPreviewExam');
    const btnKey = document.getElementById('tabBtnPreviewKey');

    if (tab === 'exam') {
      if (studentView) studentView.classList.remove('hidden');
      if (teacherView) teacherView.classList.add('hidden');
      if (btnExam) btnExam.className = 'py-2.5 border-b-2 border-purple-600 text-purple-700 flex items-center gap-1.5';
      if (btnKey) btnKey.className = 'py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-1.5';
    } else {
      if (studentView) studentView.classList.add('hidden');
      if (teacherView) teacherView.classList.remove('hidden');
      if (btnExam) btnExam.className = 'py-2.5 border-b-2 border-transparent text-slate-500 hover:text-slate-800 flex items-center gap-1.5';
      if (btnKey) btnKey.className = 'py-2.5 border-b-2 border-emerald-600 text-emerald-700 flex items-center gap-1.5';
    }
  }

  printStudentExam() {
    this.switchPreviewTab('exam');
    setTimeout(() => window.print(), 150);
  }

  printTeacherKey() {
    this.switchPreviewTab('key');
    setTimeout(() => window.print(), 150);
  }

  copyExamText() {
    if (!this.currentGeneratedExam) return;
    const ex = this.currentGeneratedExam;

    let text = `${ex.title}\nកម្រិត៖ ${ex.grade} | រយៈពេល៖ ${ex.duration} | ពិន្ទុ៖ ២០\nគ្រូបង្រៀន៖ ${ex.teacher}\n\n`;
    text += `=== ផ្នែកទី ១ ៖ សំណួរពហុជ្រើសរើស (MCQ) ===\n`;
    ex.mcqs.forEach((q, i) => {
      text += `${i + 1}. ${q.q}\n`;
      q.o.forEach((opt, oI) => {
        text += `   (${String.fromCharCode(65 + oI)}) ${opt}\n`;
      });
      text += '\n';
    });

    text += `=== ផ្នែកទី ២ ៖ លំហាត់សរសេរដោះស្រាយ ===\n`;
    ex.written.forEach((q, i) => {
      text += `លំហាត់ ${i + 1}. ${q.q}\n\n`;
    });

    text += `=== អត្រាកំណែ (Answer Key) ===\n`;
    ex.mcqs.forEach((q, i) => {
      text += `សំណួរ ${i + 1}: (${String.fromCharCode(65 + q.a)})\n`;
    });
    ex.written.forEach((q, i) => {
      text += `លំហាត់ ${i + 1}: ${q.short_solution || q.e}\n`;
    });

    navigator.clipboard.writeText(text).then(() => {
      if (window.App && window.App.showNotification) {
        window.App.showNotification('✅ បានចម្លងវិញ្ញាសា និងអត្រាកំណែរួចរាល់!');
      } else {
        alert('✅ បានចម្លងវិញ្ញាសារួចរាល់!');
      }
    });
  }

  createOnlineExamLink() {
    if (!this.currentGeneratedExam) return;
    const gradeNum = this.currentGeneratedExam.grade.replace(/[^0-9]/g, '') || '8';
    const link = `https://worksheet-kh.vercel.app/?exam=1&grade=${gradeNum}&customExam=1`;

    navigator.clipboard.writeText(link).then(() => {
      if (window.App && window.App.showNotification) {
        window.App.showNotification('🔗 បានបង្កើត & ចម្លង Link ប្រឡង Online សម្រាប់សិស្សរួចរាល់!');
      } else {
        alert('🔗 បានចម្លង Link ប្រឡង Online៖ ' + link);
      }
    });
  }

  /* ================== FULL QUESTION BANK VIEW (PROMINENT & POWERFUL) ================== */
  async openQuestionBankModal() {
    // If not Admin, show locked notice explaining permissions
    if (!this.checkBankAccess()) return;

    await this.init();

    const modalBack = document.createElement('div');
    modalBack.id = 'fullQuestionBankModal';
    modalBack.className = 'modal-overlay active';
    modalBack.onclick = (e) => {
      if (e.target === modalBack) modalBack.remove();
    };

    modalBack.innerHTML = `
      <div class="modal-card" style="max-width: 1050px; width: 96%; max-height: 90vh; overflow-y: auto;">
        <!-- Header -->
        <div class="modal-header" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              <span>📚 ធនាគារសំណួរគណិតវិទ្យា (Question Bank)</span>
              <span id="bankTotalCountBadge" style="font-size: 0.76rem; padding: 2px 8px; border-radius: 999px; background: rgba(56, 189, 248, 0.2); color: #38bdf8; font-weight: 700;">
                (៥,៤៧០ សំណួរ)
              </span>
            </h3>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              ប្រព័ន្ធធនាគារសំណួរផ្លូវការ NGS ថ្នាក់ទី ៧ ដល់ ទី ១២ (ស្របតាមកម្មវិធីសិក្សាជាតិ និង PISA)
            </p>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <button class="btn btn-sm btn-primary" onclick="window.questionBank.openMultiLessonExamModal()">
              🎲 បង្កើតវិញ្ញាសា ២-៣ មេរៀន
            </button>
            <button class="btn-icon" onclick="document.getElementById('fullQuestionBankModal').remove()">✕</button>
          </div>
        </div>

        <!-- Grade Filter Chips -->
        <div style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 14px;" id="bankGradeChips">
          <!-- Populated dynamically -->
        </div>

        <!-- Search & Filter Controls -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 14px; background: rgba(15, 23, 42, 0.4); border-radius: 12px; padding: 12px; border: 1px solid var(--border-glass);">
          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              មេរៀន / ជំពូក
            </label>
            <select id="bankSelectLesson" class="form-input" style="font-size: 0.78rem;" onchange="window.questionBank.onLessonFilterChange(this.value)">
              <option value="all">📚 គ្រប់មេរៀនទាំងអស់</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              កម្រិតពិបាក
            </label>
            <select id="bankSelectLevel" class="form-input" style="font-size: 0.78rem;" onchange="window.questionBank.onLevelFilterChange(this.value)">
              <option value="all">គ្រប់កម្រិតពិបាក</option>
              <option value="ងាយ">ងាយ (Easy)</option>
              <option value="មធ្យម">មធ្យម (Medium)</option>
              <option value="ពិបាក">ពិបាក (Hard)</option>
            </select>
          </div>

          <div>
            <label style="display: block; font-size: 0.72rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              ស្វែងរកសំណួរ
            </label>
            <input type="text" id="bankSearchInput" class="form-input" placeholder="វាយពាក្យគន្លឹះ ឬរូបមន្ត..." style="font-size: 0.78rem;" oninput="window.questionBank.onSearchInput(this.value)">
          </div>
        </div>

        <!-- Questions Count & Batch Actions -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; font-size: 0.8rem; color: var(--text-muted);">
          <div id="bankFilterCountLabel">
            កំពុងបង្ហាញ ... សំណួរ
          </div>
          <div style="display: flex; gap: 8px;">
            <button id="btnBankExportSelected" class="btn btn-sm btn-secondary" onclick="window.questionBank.exportSelectedQuestions()" disabled style="font-size: 0.76rem; padding: 4px 10px;">
              📄 បោះពុម្ពសំណួរដែលបានជ្រើស (<span id="bankSelectedBtnCount">0</span>)
            </button>
            <button id="btnBankClearSelected" class="btn btn-sm btn-outline" onclick="window.questionBank.clearSelection()" style="display: none; font-size: 0.76rem; padding: 4px 10px;">
              សម្អាត
            </button>
          </div>
        </div>

        <!-- Questions List Container -->
        <div id="bankQuestionsContainer" style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;">
          <!-- Question cards -->
        </div>

        <!-- Pagination -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--border-glass); padding-top: 12px; flex-wrap: wrap; gap: 8px;">
          <div id="bankPaginationInfo" style="font-size: 0.76rem; color: var(--text-muted);">
            ទំព័រ 1
          </div>
          <div id="bankPaginationControls" style="display: flex; gap: 4px;">
            <!-- Prev, Numbers, Next -->
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modalBack);

    this.renderBankGradeChips();
    this.renderBankLessonDropdown();
    this.renderBankQuestions();
  }

  renderBankGradeChips() {
    const container = document.getElementById('bankGradeChips');
    if (!container) return;

    const counts = this.getGradeCounts();
    const chips = [
      { id: 'all', label: 'ទាំងអស់', count: counts.all },
      { id: 'ថ្នាក់ទី ៧', label: 'ថ្នាក់ទី ៧', count: counts['ថ្នាក់ទី ៧'] },
      { id: 'ថ្នាក់ទី ៨', label: 'ថ្នាក់ទី ៨', count: counts['ថ្នាក់ទី ៨'] },
      { id: 'ថ្នាក់ទី ៩', label: 'ថ្នាក់ទី ៩', count: counts['ថ្នាក់ទី ៩'] },
      { id: 'ថ្នាក់ទី ១០', label: 'ថ្នាក់ទី ១០', count: counts['ថ្នាក់ទី ១០'] },
      { id: 'ថ្នាក់ទី ១១', label: 'ថ្នាក់ទី ១១', count: counts['ថ្នាក់ទី ១១'] },
      { id: 'ថ្នាក់ទី ១២', label: 'ថ្នាក់ទី ១២', count: counts['ថ្នាក់ទី ១២'] }
    ];

    container.innerHTML = chips.map(chip => `
      <button type="button" onclick="window.questionBank.selectBankGrade('${chip.id}')"
        class="btn btn-sm ${this.selectedGrade === chip.id ? 'btn-primary' : 'btn-outline'}"
        style="padding: 4px 10px; font-size: 0.76rem; border-radius: 999px; display: inline-flex; align-items: center; gap: 4px;">
        <span>${chip.label}</span>
        <span style="opacity: 0.7; font-size: 0.68rem; font-family: monospace;">(${chip.count})</span>
      </button>
    `).join('');
  }

  selectBankGrade(grade) {
    this.selectedGrade = grade;
    this.selectedLessonId = 'all';
    this.currentPage = 1;
    this.renderBankGradeChips();
    this.renderBankLessonDropdown();
    this.renderBankQuestions();
  }

  renderBankLessonDropdown() {
    const select = document.getElementById('bankSelectLesson');
    if (!select) return;

    const lessons = this.getLessonsForGrade(this.selectedGrade === 'all' ? '' : this.selectedGrade);

    select.innerHTML = `<option value="all">📚 គ្រប់មេរៀនទាំងអស់</option>` + lessons.map(les => `
      <option value="${les.id}" ${this.selectedLessonId === les.id ? 'selected' : ''}>
        [${les.chapterTitle}] ➔ ${les.title} (${les.questionCount} សំណួរ)
      </option>
    `).join('');
  }

  onLessonFilterChange(val) {
    this.selectedLessonId = val;
    this.currentPage = 1;
    this.renderBankQuestions();
  }

  onLevelFilterChange(val) {
    this.selectedLevel = val;
    this.currentPage = 1;
    this.renderBankQuestions();
  }

  onSearchInput(val) {
    this.searchQuery = val.trim().toLowerCase();
    this.currentPage = 1;
    clearTimeout(this._searchTimer);
    this._searchTimer = setTimeout(() => this.renderBankQuestions(), 200);
  }

  getFilteredQuestions() {
    let list = this.getAllQuestions();

    if (this.selectedGrade !== 'all') {
      list = list.filter(q => q.g === this.selectedGrade || (q.courseTitle && q.courseTitle.includes(this.selectedGrade)));
    }

    if (this.selectedLessonId !== 'all') {
      list = list.filter(q => q.lesId === this.selectedLessonId);
    }

    if (this.selectedLevel !== 'all') {
      list = list.filter(q => q.level === this.selectedLevel);
    }

    if (this.searchQuery) {
      list = list.filter(q => 
        (q.q && q.q.toLowerCase().includes(this.searchQuery)) ||
        (q.l && q.l.toLowerCase().includes(this.searchQuery)) ||
        (q.e && q.e.toLowerCase().includes(this.searchQuery)) ||
        (q.short_solution && q.short_solution.toLowerCase().includes(this.searchQuery)) ||
        (q.o && q.o.some(opt => opt && opt.toLowerCase().includes(this.searchQuery)))
      );
    }

    return list;
  }

  renderBankQuestions() {
    const container = document.getElementById('bankQuestionsContainer');
    const countLabel = document.getElementById('bankFilterCountLabel');
    if (!container) return;

    const filtered = this.getFilteredQuestions();
    const totalFiltered = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalFiltered / this.pageSize));

    if (this.currentPage > totalPages) this.currentPage = totalPages;

    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = Math.min(startIdx + this.pageSize, totalFiltered);
    const pageQuestions = filtered.slice(startIdx, endIdx);

    if (countLabel) {
      countLabel.textContent = `បង្ហាញ ${pageQuestions.length} នៃ ${totalFiltered.toLocaleString()} សំណួរ`;
    }

    if (pageQuestions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px 20px; color: var(--text-muted); background: rgba(15, 23, 42, 0.3); border-radius: 12px;">
          <div style="font-size: 2.5rem; margin-bottom: 8px;">🔍</div>
          <h4>មិនមានសំណួរត្រូវនឹងលក្ខខណ្ឌនេះទេ</h4>
          <p style="font-size: 0.78rem;">សូមផ្លាស់ប្តូរកម្រិតថ្នាក់ មេរៀន ឬពាក្យស្វែងរក</p>
        </div>
      `;
      this.renderBankPagination(0, 0);
      return;
    }

    container.innerHTML = pageQuestions.map((q, idx) => {
      const globalIdx = startIdx + idx;
      const isSelected = this.selectedIds.has(q.id);

      return `
        <div style="background: rgba(30, 41, 59, 0.4); border: 1px solid ${isSelected ? '#a855f7' : 'var(--border-glass)'}; border-radius: 12px; padding: 14px; transition: all 0.2s ease;">
          <!-- Top Row -->
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="window.questionBank.toggleQuestionSelect('${q.id}', this.checked)" style="cursor: pointer;">
              <span style="font-family: monospace; font-weight: 700; font-size: 0.78rem; color: #c084fc;">#${globalIdx + 1}</span>
              <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: rgba(168, 85, 247, 0.15); color: #c084fc; font-weight: 700;">${q.g}</span>
              <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8;">${q.l}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 6px;">
              <span style="font-size: 0.7rem; font-weight: 700; padding: 2px 8px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #34d399;">
                ${q.level || 'មធ្យម'}
              </span>
              <button class="btn-icon" style="padding: 4px;" title="ចម្លងសំណួរ" onclick="window.questionBank.copySingleQuestion('${q.id}')">📋</button>
            </div>
          </div>

          <!-- Question Text -->
          <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary); margin-bottom: 10px; line-height: 1.6;">
            ${this.formatMath(q.q)}
          </div>

          <!-- Choices Grid (For MCQ) -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; margin-bottom: 8px;">
            ${q.o.map((opt, oIdx) => `
              <div style="padding: 6px 10px; border-radius: 8px; font-size: 0.78rem; display: flex; align-items: center; gap: 8px; background: ${oIdx === q.a ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.3)'}; border: 1px solid ${oIdx === q.a ? 'rgba(16, 185, 129, 0.4)' : 'transparent'};">
                <span style="width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 0.72rem; font-weight: 800; background: ${oIdx === q.a ? '#10b981' : 'rgba(255,255,255,0.1)'}; color: white;">
                  ${String.fromCharCode(65 + oIdx)}
                </span>
                <span style="flex: 1;">${this.formatMath(opt)}</span>
                ${oIdx === q.a ? '<span style="color: #10b981; font-weight: 800;">✓</span>' : ''}
              </div>
            `).join('')}
          </div>

          <!-- Concise Answer / Solution Toggle (កំណែខ្លីៗ & គន្លឹះ) -->
          <details style="margin-top: 6px; font-size: 0.76rem; color: var(--text-muted);">
            <summary style="cursor: pointer; font-weight: 700; color: #f59e0b;">
              💡 បង្ហាញកំណែខ្លីៗ & ដំណោះស្រាយ (Short Solution)
            </summary>
            <div style="margin-top: 6px; padding: 8px 12px; border-radius: 8px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2); color: var(--text-secondary); line-height: 1.6; font-mono;">
              ${this.formatMath(q.short_solution || q.e || 'ជំនួសតម្លៃ និងគណនាតាមរូបមន្តស្តង់ដា។')}
            </div>
          </details>
        </div>
      `;
    }).join('');

    this.renderBankPagination(this.currentPage, totalPages);
  }

  renderBankPagination(page, totalPages) {
    const info = document.getElementById('bankPaginationInfo');
    const controls = document.getElementById('bankPaginationControls');
    if (!controls) return;

    if (info) info.textContent = totalPages > 0 ? `ទំព័រ ${page} នៃ ${totalPages}` : '';

    if (totalPages <= 1) {
      controls.innerHTML = '';
      return;
    }

    controls.innerHTML = `
      <button class="btn btn-sm btn-outline" ${page <= 1 ? 'disabled style="opacity:0.3;"' : ''} onclick="window.questionBank.goToBankPage(${page - 1})">
        ◀ ថយ
      </button>
      <button class="btn btn-sm btn-primary" style="padding: 2px 10px;">
        ${page}
      </button>
      <button class="btn btn-sm btn-outline" ${page >= totalPages ? 'disabled style="opacity:0.3;"' : ''} onclick="window.questionBank.goToBankPage(${page + 1})">
        បន្ទាប់ ▶
      </button>
    `;
  }

  goToBankPage(p) {
    this.currentPage = p;
    this.renderBankQuestions();
  }

  toggleQuestionSelect(id, checked) {
    if (checked) this.selectedIds.add(id);
    else this.selectedIds.delete(id);

    const btnExport = document.getElementById('btnBankExportSelected');
    const btnCount = document.getElementById('bankSelectedBtnCount');
    const btnClear = document.getElementById('btnBankClearSelected');

    if (btnCount) btnCount.textContent = this.selectedIds.size;
    if (btnExport) btnExport.disabled = this.selectedIds.size === 0;
    if (btnClear) btnClear.style.display = this.selectedIds.size > 0 ? 'inline-flex' : 'none';
  }

  clearSelection() {
    this.selectedIds.clear();
    this.renderBankQuestions();
    const btnExport = document.getElementById('btnBankExportSelected');
    const btnCount = document.getElementById('bankSelectedBtnCount');
    const btnClear = document.getElementById('btnBankClearSelected');
    if (btnCount) btnCount.textContent = 0;
    if (btnExport) btnExport.disabled = true;
    if (btnClear) btnClear.style.display = 'none';
  }

  exportSelectedQuestions() {
    const all = this.getAllQuestions();
    const selected = all.filter(q => this.selectedIds.has(q.id));
    if (selected.length === 0) return;

    const examData = {
      title: 'កិច្ចការតេស្តគណិតវិទ្យា (សំណួរដែលបានជ្រើសរើស)',
      grade: selected[0]?.g || 'ថ្នាក់ទូទៅ',
      duration: '៦០ នាទី',
      teacher: window.App?.currentTeacher?.name || 'លោកគ្រូ នួន បូណង',
      mcqs: selected,
      written: [],
      lessons: Array.from(new Set(selected.map(q => q.l))),
      date: new Date().toLocaleDateString('km-KH')
    };

    this.openExamPreviewModal(examData);
  }

  copySingleQuestion(id) {
    const q = this.getAllQuestions().find(item => item.id === id);
    if (!q) return;

    let text = `${q.q}\n`;
    q.o.forEach((opt, idx) => {
      text += `${String.fromCharCode(65 + idx)}. ${opt}\n`;
    });
    text += `ចម្លើយ៖ (${String.fromCharCode(65 + q.a)})\n`;
    if (q.short_solution || q.e) text += `កំណែខ្លីៗ៖ ${q.short_solution || q.e}\n`;

    navigator.clipboard.writeText(text).then(() => {
      if (window.App && window.App.showNotification) {
        window.App.showNotification('✅ បានចម្លងសំណួរ!');
      } else {
        alert('✅ បានចម្លងសំណួរ!');
      }
    });
  }

  /* ================== WORKSHEET EXTRACTOR (ACCESSIBLE TO MEMBERS & ADMIN) ================== */
  async openWorksheetExtractorModal() {
    await this.init();

    const defaultGrade = 'ថ្នាក់ទី ៨';

    const modalBack = document.createElement('div');
    modalBack.id = 'worksheetExtractorModal';
    modalBack.className = 'modal-overlay active';
    modalBack.onclick = (e) => {
      if (e.target === modalBack) modalBack.remove();
    };

    modalBack.innerHTML = `
      <div class="modal-card" style="max-width: 800px; width: 95%; max-height: 90vh; overflow-y: auto;">
        <div class="modal-header" style="border-bottom: 1px solid var(--border-glass); padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 class="modal-title" style="display: flex; align-items: center; gap: 8px;">
              <span>📑 ស្រង់សន្លឹកកិច្ចការគណិតវិទ្យា (Worksheets)</span>
              <span style="font-size: 0.72rem; padding: 2px 8px; border-radius: 999px; background: rgba(16, 185, 129, 0.2); color: #34d399; font-weight: 700;">
                ថ្នាក់ទី ៧ ដល់ ទី ១២
              </span>
            </h3>
            <p style="font-size: 0.78rem; color: var(--text-muted); margin-top: 4px;">
              ទាញយក និងបោះពុម្ពសន្លឹកកិច្ចការស្វ័យប្រវត្តតាមមេរៀន សម្រាប់ចែកសិស្សអនុវត្តក្នុងថ្នាក់រៀន
            </p>
          </div>
          <button class="btn-icon" onclick="document.getElementById('worksheetExtractorModal').remove()">✕</button>
        </div>

        <!-- Grade & Lesson Picker -->
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 12px; margin-bottom: 16px;">
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              កម្រិតថ្នាក់
            </label>
            <select id="wsGradeSelect" class="form-input" style="font-size: 0.82rem;" onchange="window.questionBank.onWsGradeChange(this.value)">
              <option value="ថ្នាក់ទី ៧">ថ្នាក់ទី ៧</option>
              <option value="ថ្នាក់ទី ៨" selected>ថ្នាក់ទី ៨</option>
              <option value="ថ្នាក់ទី ៩">ថ្នាក់ទី ៩</option>
              <option value="ថ្នាក់ទី ១០">ថ្នាក់ទី ១០</option>
              <option value="ថ្នាក់ទី ១១ (មូលដ្ឋាន)">ថ្នាក់ទី ១១ [មូលដ្ឋាន]</option>
              <option value="ថ្នាក់ទី ១១ (កម្រិតខ្ពស់)">ថ្នាក់ទី ១១ [កម្រិតខ្ពស់]</option>
              <option value="ថ្នាក់ទី ១២ (មូលដ្ឋាន)">ថ្នាក់ទី ១២ [មូលដ្ឋាន]</option>
              <option value="ថ្នាក់ទី ១២ (កម្រិតខ្ពស់)">ថ្នាក់ទី ១២ [កម្រិតខ្ពស់]</option>
            </select>
          </div>
          <div>
            <label style="display: block; font-size: 0.75rem; font-weight: 700; color: var(--text-muted); margin-bottom: 4px;">
              មេរៀនដែលត្រូវស្រង់សន្លឹកកិច្ចការ
            </label>
            <select id="wsLessonSelect" class="form-input" style="font-size: 0.82rem;" onchange="window.questionBank.onWsLessonChange(this.value)">
              <!-- Populated dynamically -->
            </select>
          </div>
        </div>

        <!-- Preview Container -->
        <div id="wsPreviewContainer" style="background: rgba(15, 23, 42, 0.4); border: 1px solid var(--border-glass); border-radius: 12px; padding: 16px; min-height: 200px; margin-bottom: 16px;">
          <!-- Worksheet content -->
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-glass); padding-top: 12px;">
          <button class="btn btn-secondary" onclick="document.getElementById('worksheetExtractorModal').remove()">
            បិទ
          </button>
          <button class="btn btn-primary" onclick="window.questionBank.printCurrentWorksheet()" style="display: flex; align-items: center; gap: 6px;">
            <span>🖨️ បោះពុម្ពសន្លឹកកិច្ចការ</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modalBack);
    this.onWsGradeChange(defaultGrade);
  }

  onWsGradeChange(grade) {
    const lesSelect = document.getElementById('wsLessonSelect');
    if (!lesSelect) return;

    const lessons = this.getLessonsForGrade(grade);
    lesSelect.innerHTML = lessons.map(l => `
      <option value="${l.id}">[${l.chapterTitle}] ${l.title}</option>
    `).join('');

    if (lessons.length > 0) {
      this.onWsLessonChange(lessons[0].id);
    }
  }

  onWsLessonChange(lesId) {
    const container = document.getElementById('wsPreviewContainer');
    if (!container) return;

    const all = this.getAllQuestions();
    const questions = all.filter(q => q.lesId === lesId);

    if (questions.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 30px; color: var(--text-muted);">
          <p>មិនទាន់មានទិន្នន័យសន្លឹកកិច្ចការសម្រាប់មេរៀននេះ</p>
        </div>
      `;
      return;
    }

    const lessonTitle = questions[0]?.l || 'មេរៀន';

    container.innerHTML = `
      <div style="space-y: 12px;">
        <div style="border-bottom: 1px dashed var(--border-glass); padding-bottom: 8px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
          <h4 style="font-weight: 700; color: #34d399; font-size: 0.95rem;">${lessonTitle}</h4>
          <span style="font-size: 0.75rem; color: var(--text-muted);">${questions.length} លំហាត់សន្លឹកកិច្ចការ</span>
        </div>
        <div style="display: flex; flex-direction: column; gap: 10px;">
          ${questions.slice(0, 10).map((q, idx) => `
            <div style="background: rgba(30, 41, 59, 0.4); border-radius: 8px; padding: 10px; border-left: 3px solid #10b981;">
              <div style="font-size: 0.84rem; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">
                លំហាត់ទី ${idx + 1} ៖ ${this.formatMath(q.q)}
              </div>
              <div style="font-size: 0.74rem; color: var(--text-secondary);">
                ${(q.short_solution || q.e) ? `<strong>គន្លឹះ & កំណែ ៖</strong> ${this.formatMath(q.short_solution || q.e)}` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  printCurrentWorksheet() {
    window.print();
  }
}

// Global instance
window.questionBank = new QuestionBankController();

document.addEventListener('DOMContentLoaded', () => {
  if (window.questionBank) {
    window.questionBank.init();
  }
});
