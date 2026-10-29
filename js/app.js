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
  worksheets: {},
  worksheetsG11: {},
  pointQuizzes: {},
  activeQuizPoint: 0,
  currentActiveQuizList: [],
  teacherUnlocked: false,
  activeWorksheetPoint: 0,
  examTimeLimit: 0,
  examTimerInterval: null,
  examSecondsRemaining: 0,
  examStarted: false,
  examFinishedByTimeout: false,
  isExamMode: false,
  examDate: null,
  examStartTime: null,
  examEndTime: null,
  examUpcomingInterval: null,

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

  appsScriptSourceCode: `/**
 * WORKSHEET.KH - GOOGLE SHEETS LIVE SCORING ENGINE (HIGH CONCURRENCY PRO VERSION)
 * រៀបចំដោយ៖ លោកគ្រូ នួន បូណង (Nuon Bonorng) - វិទ្យាល័យព្រះយុគន្ធរ សាលារៀនជំនាន់ថ្មី
 * មុខងារ៖ 
 *  1. ទទួលពិន្ទុតេស្តស្វ័យប្រវត្ត (Ultra-fast concurrent lock - មិនកកស្ទះពេលសិស្សផ្ញើព្រមគ្នា)
 *  2. កត់ត្រាចូលតារាងសរុប និងបំបែកតាមបន្ទប់ថ្នាក់ស្វ័យប្រវត្ត
 *  3. រៀបចំក្បាលតារាង Column Styling ជាមុន មិនប្រើ format ម្ដងមួយជួរដែលធ្វើឱ្យយឺតឡើយ
 */

// បង្កើត Menu ពិសេសក្នុង Google Sheets ពេលបើកឯកសារ
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('📊 ប្រព័ន្ធ Worksheet.Kh')
    .addItem('⭐ ១. បង្កើត Tab តាមកម្រិតថ្នាក់ (៧ ដល់ ១២ + តារាងសរុប)', 'setupGradeTabs')
    .addItem('🏫 ២. បង្កើត Tab តាមបន្ទប់ថ្នាក់ស្តង់ដា (7A..12E)', 'setupClassTabs')
    .addSeparator()
    .addItem('🎨 ៣. រៀបចំក្បាលតារាង & ដាក់ពណ៌ស្អាត', 'formatAllWorksheetSheets')
    .addToUi();
}

// ក្បាលតារាងស្តង់ដា
var HEADERS = [
  "កាលបរិច្ឆេទ & ម៉ោង",
  "លេខរៀង/អត្តលេខ",
  "ឈ្មោះសិស្ស",
  "កម្រិតថ្នាក់",
  "បន្ទប់/ថ្នាក់",
  "មេរៀន",
  "ចំណុចតេស្ត",
  "ពិន្ទុទទួលបាន",
  "ពិន្ទុសរុប",
  "ភាគរយ (%)",
  "និទ្ទេស/ការវាយតម្លៃ"
];

// ពណ៌សម្គាល់តាមកម្រិតថ្នាក់ (Tab Colors)
var TAB_COLORS = {
  "🌟 តារាងសរុប": "#f59e0b",
  "ថ្នាក់ទី ៧": "#3b82f6",
  "ថ្នាក់ទី ៨": "#06b6d4",
  "ថ្នាក់ទី ៩": "#10b981",
  "ថ្នាក់ទី ១០": "#6366f1",
  "ថ្នាក់ទី ១១": "#8b5cf6",
  "ថ្នាក់ទី ១២": "#f43f5e"
};

// ជម្រើសទី ១៖ បង្កើត Tab តាមកម្រិតថ្នាក់ (កាត់បន្ថយ Tab ខាងក្រោមឲ្យនៅត្រឹម ៧ Tab ប៉ុណ្ណោះ មិនរញ៉េរញ៉ៃ)
function setupGradeTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tabs = ["🌟 តារាងសរុប", "ថ្នាក់ទី ៧", "ថ្នាក់ទី ៨", "ថ្នាក់ទី ៩", "ថ្នាក់ទី ១០", "ថ្នាក់ទី ១១", "ថ្នាក់ទី ១២"];
  
  for (var i = 0; i < tabs.length; i++) {
    var name = tabs[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    formatSheetHeader(sheet, name);
  }
  
  SpreadsheetApp.getUi().alert('✅ បានបង្កើត Tab តាមកម្រិតថ្នាក់ (៧ ដល់ ១២ + តារាងសរុប) រួចរាល់ដោយជោគជ័យ!');
}

// ជម្រើសទី ២៖ បង្កើត Tab តាមបន្ទប់ថ្នាក់លម្អិត
function setupClassTabs() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var classes = [
    "🌟 តារាងសរុប",
    "7A", "7B", "7C",
    "8A", "8B", "8C",
    "9A", "9B", "9C",
    "10A1", "10A2", "10A3", "10A4",
    "11A", "11B", "11C", "11NGS-P1", "11NGS-P2", "11NGS-P3",
    "12A", "12B", "12C"
  ];
  
  for (var i = 0; i < classes.length; i++) {
    var name = classes[i];
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    formatSheetHeader(sheet, name);
  }
  
  SpreadsheetApp.getUi().alert('✅ បានបង្កើត Tab តាមបន្ទប់ថ្នាក់រួចរាល់!');
}

// រៀបចំក្បាលតារាង និងកំណត់ទ្រង់ទ្រាយ Column ទាំងមូលជាមុនតែម្តង (លឿនបំផុត និងស្អាត)
function formatSheetHeader(sheet, name) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
  }
  var headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setBackground("#1e293b");
  headerRange.setFontColor("#ffffff");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
  
  // Set tab color
  if (TAB_COLORS[name]) {
    sheet.setTabColor(TAB_COLORS[name]);
  } else if (name.startsWith("7")) sheet.setTabColor("#3b82f6");
  else if (name.startsWith("8")) sheet.setTabColor("#06b6d4");
  else if (name.startsWith("9")) sheet.setTabColor("#10b981");
  else if (name.startsWith("10")) sheet.setTabColor("#6366f1");
  else if (name.startsWith("11")) sheet.setTabColor("#8b5cf6");
  else if (name.startsWith("12")) sheet.setTabColor("#f43f5e");
  
  // Format column alignment globally (so rows do not need slow per-row formatting)
  try {
    sheet.getRange("A:K").setVerticalAlignment("middle");
    sheet.getRange("A:B").setHorizontalAlignment("center");
    sheet.getRange("D:E").setHorizontalAlignment("center");
    sheet.getRange("H:K").setHorizontalAlignment("center");
  } catch(e) {}
}

function formatAllWorksheetSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();
  for (var i = 0; i < sheets.length; i++) {
    formatSheetHeader(sheets[i], sheets[i].getName());
  }
  SpreadsheetApp.getUi().alert('✅ បានរៀបចំក្បាលតារាងគ្រប់សន្លឹកទាំងអស់ស្អាតរួចរាល់!');
}

// ទទួលពិន្ទុពីប្រព័ន្ធ Worksheet.Kh (High Concurrency - រង់ចាំរហូតដល់ 30s មិនបាត់សិស្សឡើយ)
function doPost(e) {
  var lock = LockService.getScriptLock();
  var hasLock = false;
  
  try {
    // រង់ចាំរហូតដល់ 30 វិនាទី ដើម្បីការពារការបាត់សំណើសិស្សពេលផ្ញើព្រមគ្នា
    lock.waitLock(30000);
    hasLock = true;
  } catch (lockErr) {
    // បើលើស 30s ក៏នៅតែព្យាយាមអនុវត្តកត់ត្រា
  }
  
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var data = {};
    
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (err) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    var rawClass = (data.studentClass || "ទូទៅ").trim().toUpperCase();
    if (!rawClass) rawClass = "ទូទៅ";
    var gradeStr = data.grade ? ("ថ្នាក់ទី " + data.grade) : "";
    
    // គណនានិទ្ទេស (Grade evaluation)
    var pct = parseFloat(data.percentage) || 0;
    var gradeLevel = "ល្អប្រសើរ";
    if (pct < 50) gradeLevel = "ខ្សោយ (ត្រូវពង្រឹង)";
    else if (pct < 65) gradeLevel = "មធ្យម";
    else if (pct < 80) gradeLevel = "ល្អបង្គួរ";
    else if (pct < 90) gradeLevel = "ល្អ";
    else gradeLevel = "ល្អប្រសើរ (ឆ្នើម)";

    // ជួរទិន្នន័យថ្មី
    var newRow = [
      data.timestamp || Utilities.formatDate(new Date(), "Asia/Phnom_Penh", "yyyy-MM-dd HH:mm:ss"),
      data.rollNumber || "-",
      data.studentName || "",
      gradeStr,
      rawClass,
      data.lessonTitle || "",
      data.pointTitle || "",
      data.score !== undefined ? data.score : 0,
      data.total !== undefined ? data.total : 0,
      data.percentage || "0%",
      gradeLevel
    ];
    
    // ១. កត់ត្រាចូលក្នុង Tab សរុប (Master Data) ជានិច្ច
    var masterSheet = ss.getSheetByName("🌟 តារាងសរុប");
    if (!masterSheet) {
      masterSheet = ss.insertSheet("🌟 តារាងសរុប", 0);
      formatSheetHeader(masterSheet, "🌟 តារាងសរុប");
    }
    masterSheet.appendRow(newRow);
    
    // ២. ស្វែងរក Sheet តាមបន្ទប់ថ្នាក់
    var targetSheet = ss.getSheetByName(rawClass);
    if (!targetSheet) {
      var cleanClass = rawClass.replace(/\\s+/g, '');
      targetSheet = ss.getSheetByName(cleanClass);
    }
    if (!targetSheet && gradeStr) {
      targetSheet = ss.getSheetByName(gradeStr);
    }
    
    // បើគ្មាន Tab ទេ បង្កើត Tab តាមបន្ទប់ថ្នាក់នោះភ្លាម
    if (!targetSheet) {
      targetSheet = ss.insertSheet(rawClass);
      formatSheetHeader(targetSheet, rawClass);
    }
    
    // បញ្ចូលទិន្នន័យក្នុង Sheet ថ្នាក់ (បើមិនមែនជា masterSheet)
    if (targetSheet && targetSheet.getName() !== masterSheet.getName()) {
      targetSheet.appendRow(newRow);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "success", "message": "ពិន្ទុត្រូវបានកត់ត្រាក្នុងថ្នាក់ " + rawClass }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    if (hasLock) {
      try { lock.releaseLock(); } catch(e) {}
    }
  }
}

function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ "status": "online", "message": "Worksheet.Kh Scoring Webhook is running!" }))
    .setMimeType(ContentService.MimeType.JSON);
}`,

  async init() {
    try { this.initTheme(); } catch (e) { console.warn(e); }
    try { this.initUrlParams(); } catch (e) { console.warn(e); }
    try { this.checkAdminAuth(); } catch (e) { console.warn(e); }
    try { this.initPlayer(); } catch (e) { console.warn(e); }
    try { this.initGreetingAndWisdom(); } catch (e) { console.warn(e); }
    try { this.updateResumeBanner(); } catch (e) { console.warn(e); }
    try { this.bindGlobalEvents(); } catch (e) { console.warn(e); }
    try {
      await this.loadCourses();
      await Promise.all([
        this.loadWorksheets(),
        this.loadPointQuizzes()
      ]);
    } catch (e) {
      console.error('Error loading data:', e);
    }
    try {
      await this.handleUrlDirectExamRouting();
    } catch (e) {
      console.warn('URL direct exam error:', e);
    }
  },

  initUrlParams() {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const timeParam = parseInt(urlParams.get('time') || urlParams.get('duration') || '0', 10);
      if (timeParam > 0) {
        this.examTimeLimit = timeParam;
      }
      const sheetParam = urlParams.get('sheet') || urlParams.get('sheetUrl');
      if (sheetParam) {
        try {
          const decodedSheet = decodeURIComponent(sheetParam);
          if (decodedSheet.startsWith('https://script.google.com/macros/s/')) {
            this.setTeacherSheetUrl(decodedSheet);
          }
        } catch (e) {}
      }
      const classParam = (urlParams.get('class') || urlParams.get('room') || '').trim();
      if (classParam) {
        const studentInfo = this.getStudentInfo();
        studentInfo.classRoom = classParam.toUpperCase();
        this.saveStudentInfo(studentInfo);
      }
      const gradeParam = urlParams.get('grade');
      if (gradeParam) {
        this.currentGrade = gradeParam;
      }

      // Parse Exam Date & Time Window (ការពារសិស្សប្រឡងថ្ងៃក្រោយ)
      const dateParam = (urlParams.get('date') || urlParams.get('examDate') || '').trim();
      const startParam = (urlParams.get('start') || urlParams.get('startTime') || '').trim();
      const endParam = (urlParams.get('end') || urlParams.get('endTime') || '').trim();
      if (dateParam) {
        this.examDate = dateParam;
      }
      if (startParam) {
        this.examStartTime = this.normalizeTimeString(startParam) || startParam;
      }
      if (endParam) {
        this.examEndTime = this.normalizeTimeString(endParam) || endParam;
      }

      // Backward compatibility: If an old link was created with the previous 'all_day' default (06:00 - 22:00),
      // auto-extend its cutoff to 23:59 so teachers/students testing late at night aren't blocked!
      if (this.examStartTime === '06:00' && this.examEndTime === '22:00') {
        this.examEndTime = '23:59';
      }

      // Check if student exam mode is active
      const examParam = urlParams.get('exam') || urlParams.get('mode');
      const isExam = examParam === '1' || examParam === 'true' || examParam === 'exam' || !!classParam || timeParam > 0 || !!dateParam;
      if (isExam) {
        this.isExamMode = true;
        document.body.classList.add('exam-mode-active');
      }
    } catch (e) {
      console.warn('initUrlParams error:', e);
    }
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
        authBtn.className = 'btn btn-secondary nav-auth-btn';
        authBtn.innerHTML = `
          <span style="color:var(--accent-emerald); font-weight:700;">👨‍🏫 <span class="nav-auth-text">គ្រូ (Admin)</span></span>
          <span onclick="event.stopPropagation(); App.logoutAdmin()" style="margin-left:8px; opacity:0.7; cursor:pointer; font-weight:bold;" title="ចាកចេញ (Logout)">✕</span>
        `;
      } else {
        authBtn.className = 'btn btn-outline nav-auth-btn';
        authBtn.innerHTML = '🔐 <span class="nav-auth-text">គ្រូបង្រៀន</span>';
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
    // Experiments removed for ultra-smooth performance and zero CPU/GPU overhead
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
    if (this.isExamMode) {
      if (this.examStarted && !this.examFinishedByTimeout) {
        if (!confirm('⚠️ ការប្រឡងកំពុងដំណើរការ! តើប្អូនពិតជាចង់ចាកចេញពីការប្រឡងមែនទេ?')) return;
      }
      this.showToast('📝 ប្អូនកំពុងស្ថិតក្នុងទម្រង់ប្រឡង (Exam Mode)', 'info');
      return;
    }
    document.getElementById('player-view').classList.remove('active');
    document.getElementById('player-view').style.display = 'none';
    document.getElementById('catalog-view').style.display = 'block';
    this.updateStats();
    this.renderCourses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  handleBrandClick() {
    if (this.isExamMode) {
      if (this.examStarted && !this.examFinishedByTimeout) {
        if (!confirm('⚠️ ការប្រឡងកំពុងដំណើរការ! តើប្អូនពិតជាចង់ចាកចេញពីការប្រឡងមែនទេ?')) return;
      }
      this.showToast('📝 ប្អូនកំពុងស្ថិតក្នុងទម្រង់ប្រឡង (Exam Mode)', 'info');
      return;
    }
    this.backToCatalog();
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

    // Reset active points for worksheet and quiz
    this.activeWorksheetPoint = 0;
    this.activeQuizPoint = 0;

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
                <span>📝 សន្លឹកកិច្ចការ & តេស្ត</span>
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
          មិនទាន់មានកំណត់ត្រាផ្ទាល់ខ្លួននៅឡើយទេ។ អ្នកអាចកត់ចំណាំពេលកំពុងពិសោធន៍ 3D បាន។
        </div>
      `;
      return;
    }

    listEl.innerHTML = notes.map(n => `
      <div class="note-item">
        <div class="note-header">
          <span class="note-time-badge" onclick="if(window.Math3D) Math3D.selectPoint(${n.pointIndex !== undefined ? n.pointIndex : 0})">
            📍 ${n.pointLabel || 'ចំណុចទី ' + ((n.pointIndex || 0) + 1)}
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

    const ptIdx = window.Math3D?.activePointIndex || 0;
    const newNote = {
      id: 'note_' + Date.now(),
      text: textarea.value.trim(),
      pointIndex: ptIdx,
      pointLabel: `ចំណុចទី ${ptIdx + 1}`,
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
  async loadWorksheets(forceRefresh = false) {
    try {
      const cacheBust = `?v=${Date.now()}`;
      let res = await fetch(`data/worksheets.json${cacheBust}`, { cache: 'no-store' });
      if (!res.ok) {
        res = await fetch(`data/worksheets_g11.json${cacheBust}`, { cache: 'no-store' });
      }
      if (res.ok) {
        this.worksheets = await res.json();
        this.worksheetsG11 = this.worksheets; // backward compatibility
      }
    } catch (e) {
      console.warn('Worksheets load warning:', e);
    }
  },

  async forceSyncWorksheets() {
    this.showToast('កំពុងទាញយកទិន្នន័យសន្លឹកកិច្ចការថ្មីបំផុត...', 'info');
    await this.loadWorksheets(true);
    await this.loadPointQuizzes(true);
    this.renderWorksheetTab();
    this.renderQuizTab();
    this.showToast('បានធ្វើបច្ចុប្បន្នភាពសន្លឹកកិច្ចការ & តេស្តរួចរាល់!', 'success');
  },

  async loadPointQuizzes(forceRefresh = false) {
    try {
      const cacheBust = `?v=${Date.now()}`;
      const res = await fetch(`data/point_quizzes.json${cacheBust}`, { cache: 'no-store' });
      if (res.ok) {
        this.pointQuizzes = await res.json();
      }
    } catch (e) {
      console.warn('Point quizzes load warning:', e);
    }
  },

  selectQuizPoint(pointNum) {
    if (this.isExamMode) return;
    this.activeQuizPoint = pointNum;
    this.quizScore = 0;
    this.answeredQuiz = {};
    this.quizUserAnswers = {};
    this.renderQuizTab();
  },

  retakeQuiz() {
    if (this.isExamMode || this.examDate) {
      this.showToast('🔒 ការប្រឡងត្រូវបានចាក់សោ ៖ ប្អូនបានប្រឡង និងបញ្ជូនពិន្ទុរួចរាល់ហើយ មិនអនុញ្ញាតឱ្យប្រឡងឡើងវិញឡើយ!', 'warning');
      return;
    }
    this.quizScore = 0;
    this.answeredQuiz = {};
    this.quizUserAnswers = {};
    if (this.examTimerInterval) {
      clearInterval(this.examTimerInterval);
      this.examTimerInterval = null;
    }
    this.examStarted = false;
    this.examFinishedByTimeout = false;
    const sessionKey = `timed_exam_${this.currentLesson?.id || 'quiz'}`;
    sessionStorage.removeItem(sessionKey);

    const compCard = document.getElementById('quiz-completion-card');
    if (compCard) compCard.remove();
    this.renderQuizTab();
    this.showToast('បានរៀបចំសំណួរឡើងវិញរួចរាល់! សូមសាកល្បងម្តងទៀត 🎯', 'info');
  },

  cleanQuestionText(qTxt) {
    if (!qTxt) return '';
    let q = qTxt.trim();
    q = q.replace(/^[ក-ឃ]\.\s*/, '');
    q = q.replace(/^[1-9][\)\.]\s*/, '');
    q = q.replace(/នៃបណ្តាកន្សោមខាងក្រោម/g, 'នៃកន្សោម');
    q = q.replace(/នៃកន្សោមខាងក្រោម/g, 'នៃកន្សោម');
    q = q.replace(/បណ្តាសមីការខាងក្រោម/g, 'សមីការ');
    q = q.replace(/បណ្តាវិសមីការខាងក្រោម/g, 'វិសមីការ');
    q = q.replace(/ខាងក្រោម ៖ ៖/g, ' ៖');
    q = q.replace(/[:៖]\s*[:៖]/g, ' ៖');
    q = q.trim();
    if (q.includes('៖') || q.includes(':')) {
      q = q.replace(/\s*[:៖]\s*$/, '').trim();
    }
    if (!q.endsWith('?') && !q.endsWith('៖') && !q.endsWith(':') && !q.endsWith('។')) {
      if (!q.includes('៖') && !q.includes(':')) {
        q += ' ៖';
      }
    }
    return q;
  },

  formatQuestionText(text) {
    if (!text) return '';
    let q = String(text).trim();
    // Prevent duplicate trailing colons when prompt already has introducing colon
    if ((q.includes('៖') || q.includes(':')) && /[:៖]\s*$/.test(q)) {
      const firstColonIdx = q.search(/[:៖]/);
      const lastColonIdx = q.search(/[:៖]\s*$/);
      if (firstColonIdx < lastColonIdx) {
        q = q.replace(/\s*[:៖]\s*$/, '').trim();
      }
    }
    return q;
  },

  isSingleColumnOptions(options) {
    if (!Array.isArray(options) || options.length === 0) return false;
    return options.some(opt => {
      if (opt === null || opt === undefined) return false;
      const s = String(opt).trim();
      // 1. Contains Khmer words/text
      if (/[\u1780-\u17ff]/.test(s)) return true;
      // 2. Contains multiple equals signs (e.g. x = 2, y = 3)
      if ((s.match(/=/g) || []).length > 1) return true;
      // 3. Contains commas separating distinct math parts or formulas
      if (s.includes(',')) return true;
      // 4. Contains LaTeX spacing commands (\quad, \qquad) separating multiple formulas
      if (/\\(?:quad|qquad)/.test(s)) return true;
      // 5. Contains multiple fractions in one option
      if ((s.match(/\\(?:d?frac)/g) || []).length > 1) return true;
      // 6. Contains matrices, systems of equations, or multiline environments
      if (/\\begin\{(?:matrix|pmatrix|bmatrix|cases|aligned)\}/.test(s)) return true;
      // 7. Text length check: strip basic LaTeX commands and symbols
      const cleanMath = s
        .replace(/\\(?:dfrac|frac|sqrt|cdot|times|pm|approx|ne|le|ge|in|mathbb|mathbf|mathrm|text)\b/g, '')
        .replace(/[\$\{\}\s\\]/g, '');
      if (cleanMath.length > 10) return true;
      if (s.length > 20) return true;
      return false;
    });
  },

  formatExplanationText(text) {
    if (!text) return 'ចម្លើយត្រឹមត្រូវ!';
    // Replace leading dashes/hyphens on any line with clean bullet (•) to avoid confusion with minus signs
    let formatted = String(text).replace(/(?:^|\n)\s*[-–—]\s*(?=[$0-9a-zA-Z\u1780-\u17ff\(\[\{])/g, '\n• ');
    if (formatted.startsWith('\n• ')) formatted = formatted.slice(1);
    // Convert newlines to <br> for HTML rendering if not wrapped in tags
    if (!formatted.includes('<p>') && !formatted.includes('<div') && !formatted.includes('<ul>')) {
      formatted = formatted.replace(/\n/g, '<br>');
    }
    return formatted;
  },

  extractAnswerString(solText) {
    if (!solText) return '$0$';
    
    // 1. Check for paired system of equations or x and y in solution
    const casesMatch = solText.match(/\\begin\{cases\}\s*([a-zA-Z_]\s*=\s*[^\\\n]+)\\\\?\s*([a-zA-Z_]\s*=\s*[^\\\n\}]+)\s*\\end\{cases\}/);
    if (casesMatch) {
      const v1 = casesMatch[1].replace(/[\$\s]/g, '').trim();
      const v2 = casesMatch[2].replace(/[\$\s]/g, '').trim();
      return `$${v1}, ${v2}$`;
    }
    const pairedMatch = solText.match(/([a-zA-Z_]\s*=\s*[^,\s$]+)\s*,\s*([a-zA-Z_]\s*=\s*[^.\s$]+)/);
    if (pairedMatch) {
      const p1 = pairedMatch[1].replace(/[\$\s]/g, '').trim();
      const p2 = pairedMatch[2].replace(/[\$\s]/g, '').trim();
      return `$${p1}, ${p2}$`;
    }

    const lines = solText.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return solText.slice(0, 45);
    
    let lastLine = lines[lines.length - 1];
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('ដូចនេះ') || lines[i].includes('នាំឱ្យ') || lines[i].includes('ទទួលបាន') || lines[i].includes('ចម្លើយ')) {
        lastLine = lines[i];
        break;
      }
    }
    lastLine = lastLine.replace(/^(?:ដូចនេះ|នាំឱ្យ|ទទួលបាន|ចម្លើយ|សមមូល)\s*[:៖]?\s*/, '').trim();
    lastLine = lastLine.replace(/^[1-9][\)\.]\s*/, '').trim();

    const lastPaired = lastLine.match(/([a-zA-Z_]\s*=\s*[^,\s$]+)\s*,\s*([a-zA-Z_]\s*=\s*[^.\s$]+)/);
    if (lastPaired) {
      const p1 = lastPaired[1].replace(/[\$\s]/g, '').trim();
      const p2 = lastPaired[2].replace(/[\$\s]/g, '').trim();
      return `$${p1}, ${p2}$`;
    }

    const dm = lastLine.match(/\$\$([^\$]+)\$\$/);
    const target = dm ? dm[1].trim() : lastLine;

    // Safety: strip unclosed \end{cases}
    let cleanTarget = target.replace(/\\end\{cases\}/g, '').trim();

    const eqParts = cleanTarget.split(/\s*=\s*/);
    if (eqParts.length > 1) {
      const lastPart = eqParts[eqParts.length - 1].replace(/[។.]/g, '').trim();
      let ans = lastPart;
      if (eqParts.length === 2 && /^\$?[a-zA-Z_]\$?$/.test(eqParts[0].trim())) {
        const v = eqParts[0].trim().replace(/\$/g, '');
        const lp = lastPart.replace(/\$/g, '');
        ans = `$${v} = ${lp}$`;
      }
      if (!ans.startsWith('$')) ans = `$${ans}`;
      if (!ans.endsWith('$')) ans = `${ans}$`;
      return ans.replace(/\$+/g, '$');
    }

    const im = cleanTarget.match(/\$([^\$]+)\$/);
    if (im) return `$${im[1].trim()}$`;

    const res = cleanTarget.replace(/[។.]/g, '').trim();
    if (!res.startsWith('$') && (res.includes('\\') || res.includes('^') || res.includes('_'))) {
      return `$${res}$`;
    }
    return res.slice(0, 50) || '$0$';
  },

  generateDistractors(corr, topic) {
    corr = String(corr).trim();
    const clean = corr.replace(/\$/g, '').trim();

    // 1. Pure number like $4$, $-5$, $0.2$
    const numMatch = corr.match(/^\$?([+-]?\d+(?:\.\d+)?)\$?$/);
    if (numMatch) {
      const valStr = numMatch[1];
      if (valStr.includes('.')) {
        const val = parseFloat(valStr);
        return [`$${-val}$`, `$${Math.round(val * 10) / 100}$`, `$${Math.round(val * 100) / 10}$`];
      } else {
        const val = parseInt(valStr, 10);
        const d1 = val !== 0 ? `$${-val}$` : '$1$';
        const d2 = val >= 0 ? `$${val + 2}$` : `$${val - 2}$`;
        const d3 = (val !== 0 && val !== 1 && val !== -1) ? `$${val * 2}$` : `$${val + 3}$`;
        return [d1, d2 === d1 ? `$${val + 4}$` : d2, d3];
      }
    }

    // 2. Fraction \dfrac{a}{b} or -\dfrac{a}{b}
    const fracMatch = corr.match(/^\$?([+-]?)\s*\\d?frac\{([^}]+)\}\{([^}]+)\}\$?$/);
    if (fracMatch) {
      const sign = fracMatch[1];
      const num = fracMatch[2].trim();
      const den = fracMatch[3].trim();
      const oppSign = sign === '-' ? '' : '-';
      const d1 = `$${oppSign}\\dfrac{${num}}{${den}}$`;
      const d2 = `$${sign}\\dfrac{${den}}{${num}}$`;
      const d3 = `$${sign}\\dfrac{${num}}{${parseInt(den, 10) + 1 || den + '+1'}}$`;
      return [d1, d2, d3];
    }

    // 3. Variable equality x = val
    const eqMatch = corr.match(/^\$?([a-zA-Z_0-9]+)\s*=\s*([+-]?\d+(?:\.\d+)?)\$?$/);
    if (eqMatch) {
      const v = eqMatch[1];
      const val = parseInt(eqMatch[2], 10);
      return [
        val !== 0 ? `$${v} = ${-val}$` : `$${v} = 1$`,
        `$${v} = ${val + 1}$`,
        `$${v} = ${val - 1}$`
      ];
    }

    // 4. Paired variable equality x = a, y = b
    const pairMatch = corr.match(/^\$?([a-zA-Z_0-9]+)\s*=\s*([+-]?\d+(?:\.\d+)?)\s*,\s*([a-zA-Z_0-9]+)\s*=\s*([+-]?\d+(?:\.\d+)?)\$?$/);
    if (pairMatch) {
      const v1 = pairMatch[1], a = parseInt(pairMatch[2], 10);
      const v2 = pairMatch[3], b = parseInt(pairMatch[4], 10);
      return [
        `$${v1} = ${b}, ${v2} = ${a}$`,
        `$${v1} = ${-a}, ${v2} = ${b}$`,
        `$${v1} = ${a}, ${v2} = ${-b}$`
      ];
    }

    // Categorical math
    if (corr.includes('អនន្ត')) return ['ជាស្វ៊ីតរាប់អស់', 'ជាស្វ៊ីតថេរ', 'ជាស្វ៊ីតមិនកំណត់'];
    if (corr.includes('រាប់អស់')) return ['ជាស្វ៊ីតអនន្ត', 'ជាស្វ៊ីតមិនកំណត់', 'ជាស្វ៊ីតសូន្យ'];
    if (corr.includes('កើន')) return ['ជាស្វ៊ីតចុះដាច់ខាត', 'ជាស្វ៊ីតថេរ', 'ជាស្វ៊ីតមិនម៉ូណូតូន'];
    if (corr.includes('ចុះ')) return ['ជាស្វ៊ីតកើនដាច់ខាត', 'ជាស្វ៊ីតថេរ', 'ជាស្វ៊ីតមិនម៉ូណូតូន'];
    if (corr.includes('កាត់កែង')) return ['ស្របគ្នា', 'ត្រួតស៊ីគ្នា', 'កាត់គ្នាមិនកែង'];
    if (corr.includes('ស្រប')) return ['កាត់កែងគ្នា', 'កាត់គ្នាបង្កើតមុំ $45^\\circ$', 'ត្រួតស៊ីគ្នា'];

    return [
      clean.startsWith('-') ? `$${clean.slice(1)}$` : `$-${clean}$`,
      `$${clean} + 1$`,
      `$${clean} - 1$`
    ];
  },

  generatePointMCQs(lesson, pointObj, pointNum) {
    const rawTitle = pointObj?.pointTitle || pointObj?.title || `ចំណុចទី ${pointNum}`;
    const cleanTitle = rawTitle.replace(/^ចំណុចទី\s*[\d១២៣៤៥៦៧៨៩០]+\s*[៖:]?\s*/, '').trim();
    const topic = pointObj?.topic || cleanTitle;
    const lessonTitle = lesson?.title || '';
    const exs = pointObj?.exercises || [];
    
    const items = [];
    
    // 1. Convert exercises into MCQs if available
    const statementsPool = [];
    exs.forEach((ex, exIdx) => {
      const qText = ex.question || '';
      const sText = ex.solution || '';
      
      const subitems = [];
      const parts = qText.split(/(?:^|\n)\s*([ក-ឃ]\.\s*)/);
      const solParts = sText.split(/(?:^|\n)\s*([ក-ឃ]\.\s*)/);
      
      if (parts.length > 2) {
        const prefix = parts[0].trim();
        for (let i = 1; i < parts.length; i += 2) {
          const tag = parts[i].trim().replace('.', '');
          const subQ = parts[i + 1]?.trim() || '';
          let subSol = sText;
          if (solParts.length > 2) {
            const solIdx = solParts.indexOf(parts[i]);
            if (solIdx !== -1 && solParts[solIdx + 1]) {
              subSol = solParts[solIdx + 1].trim();
            }
          }
          
          const numQ = subQ.split(/(?:^|\n)\s*([0-9]+[\)\.])\s*/);
          const numS = subSol.split(/(?:^|\n)\s*([0-9]+[\)\.])\s*/);
          if (numQ.length > 2) {
            const subPre = numQ[0].trim() || prefix;
            for (let k = 1; k < numQ.length; k += 2) {
              const nTag = numQ[k].trim();
              const itemQ = numQ[k + 1]?.trim() || '';
              let itemS = subSol;
              if (numS.length > 2) {
                for (let l = 1; l < numS.length; l += 2) {
                  if (numS[l].trim().replace(/[\)\.]/g, '') === nTag.replace(/[\)\.]/g, '')) {
                    itemS = numS[l + 1].trim();
                    break;
                  }
                }
              }
              const cleanHeader = subPre.replace(/[:៖]\s*$/, '').trim();
              subitems.push({
                question: this.cleanQuestionText(cleanHeader ? `${cleanHeader} ៖ ${itemQ}` : itemQ),
                rawItem: itemQ,
                solution: itemS
              });
            }
          } else {
            const cleanHeader = prefix.replace(/[:៖]\s*$/, '').trim();
            subitems.push({
              question: this.cleanQuestionText(cleanHeader ? `${cleanHeader} ៖ ${subQ}` : subQ),
              rawItem: subQ,
              solution: subSol
            });
          }
        }
      } else {
        const numQ = qText.split(/(?:^|\n)\s*([0-9]+[\)\.])\s*/);
        const numS = sText.split(/(?:^|\n)\s*([0-9]+[\)\.])\s*/);
        if (numQ.length > 2) {
          const prefix = numQ[0].trim();
          for (let k = 1; k < numQ.length; k += 2) {
            const nTag = numQ[k].trim();
            const itemQ = numQ[k + 1]?.trim() || '';
            let itemS = sText;
            if (numS.length > 2) {
              for (let l = 1; l < numS.length; l += 2) {
                if (numS[l].trim().replace(/[\)\.]/g, '') === nTag.replace(/[\)\.]/g, '')) {
                  itemS = numS[l + 1].trim();
                  break;
                }
              }
            }
            const cleanHeader = prefix.replace(/[:៖]\s*$/, '').trim();
            subitems.push({
              question: this.cleanQuestionText(cleanHeader ? `${cleanHeader} ៖ ${itemQ}` : itemQ),
              rawItem: itemQ,
              solution: itemS
            });
          }
        } else {
          subitems.push({
            question: this.cleanQuestionText(qText),
            rawItem: qText.trim(),
            solution: sText.trim()
          });
        }
      }
      
      subitems.forEach(it => {
        const ans = this.extractAnswerString(it.solution);
        const dists = this.generateDistractors(ans, topic);
        items.push({
          question: it.question,
          correct_ans: ans,
          distractors: dists,
          explanation: it.solution,
          level: items.length < 3 ? 'កម្រិត ១ (មូលដ្ឋាន)' : 'កម្រិត ២ (អនុវត្ត)'
        });
        
        const rawClean = (it.rawItem || '').replace(/\$/g, '').trim();
        const ansClean = ans.replace(/\$/g, '').trim();
        if (rawClean && ansClean && !rawClean.includes('=') && rawClean.length < 35 && ansClean.length < 25) {
          statementsPool.push({
            trueSt: `$${rawClean} = ${ansClean}$`,
            falseSt: `$${rawClean} = ${dists[0].replace(/\$/g, '')}$`
          });
        }
      });
    });

    // Add comparative questions if we have 4+ statements
    if (statementsPool.length >= 4) {
      items.push({
        question: 'ពិនិត្យលើសមភាពខាងក្រោម ៖ តើសមភាពណាខាងក្រោមនេះ **ត្រឹមត្រូវ**?',
        correct_ans: statementsPool[0].trueSt,
        distractors: [statementsPool[1].falseSt, statementsPool[2].falseSt, statementsPool[3].falseSt],
        explanation: `សមភាពត្រឹមត្រូវគឺ ៖ ${statementsPool[0].trueSt}។ ឯជម្រើសដទៃទៀតជាការគណនាខុស។`,
        level: 'កម្រិត ២ (អនុវត្ត)'
      });
      items.push({
        question: 'ពិនិត្យលើសមភាពខាងក្រោម ៖ តើសមភាពណាខាងក្រោមនេះ **មិនត្រឹមត្រូវ (ខុស)**?',
        correct_ans: statementsPool[0].falseSt,
        distractors: [statementsPool[1].trueSt, statementsPool[2].trueSt, statementsPool[3].trueSt],
        explanation: `សមភាពមិនត្រឹមត្រូវគឺ ៖ ${statementsPool[0].falseSt} (ការគណនាត្រឹមត្រូវគឺ ${statementsPool[0].trueSt})។`,
        level: 'កម្រិត ២ (អនុវត្ត)'
      });
    }
    
    // 2. Add course lesson quiz candidates ONLY if matching point keywords or if point has few items
    if (Array.isArray(lesson?.quiz) && items.length < 5) {
      const keywords = cleanTitle.split(/\s+/).filter(w => w.length > 3);
      lesson.quiz.forEach(cq => {
        if (cq.question && cq.options && cq.options.length === 4) {
          const matchesKeyword = keywords.some(kw => cq.question.includes(kw));
          if (matchesKeyword || items.length < 2) {
            const corr = cq.options[cq.correct || 0];
            items.push({
              question: cq.question,
              correct_ans: corr,
              explanation: cq.explanation || 'ចម្លើយត្រឹមត្រូវតាមទ្រឹស្តីបទនៃមេរៀន។',
              level: 'កម្រិត ២ (អនុវត្ត)'
            });
          }
        }
      });
    }
    
    // 3. Rich pedagogical templates for the remaining questions up to 10
    const templates = [
      {
        q: `នៅក្នុង${lessonTitle} ត្រង់«${rawTitle}» ៖ តើសញ្ញាណនៃ ${topic} មានលក្ខណៈសម្គាល់ចម្បងដូចម្តេច?`,
        ans: `កំណត់បានយ៉ាងច្បាស់លាស់តាមលក្ខណៈគ្រឹះនៃ ${cleanTitle}`,
        exp: `យោងតាមនិយមន័យនៃ${cleanTitle} ៖ ${topic} ត្រូវបានកំណត់ឡើងដោយលក្ខណៈគណិតវិទ្យាជាក់លាក់ និងមានរូបមន្តច្បាស់លាស់។`,
        lvl: 'កម្រិត ១ (មូលដ្ឋាន)'
      },
      {
        q: `ចំពោះចំណុច «${cleanTitle}» តើលក្ខខណ្ឌ ឬសមភាពណាខាងក្រោមនេះជាលក្ខខណ្ឌត្រឹមត្រូវ?`,
        ans: `ត្រូវអនុវត្តតាមទ្រឹស្តីបទ និងវិធានគណិតវិទ្យានៃ ${cleanTitle}`,
        exp: `ក្នុងការដោះស្រាយលំហាត់ទាក់ទងនឹង${cleanTitle} សិស្សត្រូវតែផ្ទៀងផ្ទាត់លក្ខខណ្ឌត្រឹមត្រូវតាមទ្រឹស្តីបទ និងវិធានគ្រឹះជានិច្ច។`,
        lvl: 'កម្រិត ១ (មូលដ្ឋាន)'
      },
      {
        q: `តើការកំណត់រូបមន្ត ឬទម្រង់ទូទៅនៅក្នុងចំណុច «${cleanTitle}» ត្រូវធ្វើឡើងតាមបែបណា?`,
        ans: `ផ្អែកលើនិយមន័យ និងទំនាក់ទំនងតក្កវិជ្ជានៃ ${topic}`,
        exp: `ការអនុវត្តរូបមន្តត្រូវតែផ្អែកលើតក្កវិជ្ជា និងនិយមន័យនៃ ${topic} ដើម្បីទទួលបានចម្លើយត្រឹមត្រូវ និងសុក្រឹត។`,
        lvl: 'កម្រិត ២ (អនុវត្ត)'
      },
      {
        q: `ប្រសិនបើគេឱ្យទិន្នន័យ ឬកន្សោមមួយទាក់ទងនឹង «${cleanTitle}» តើជំហានដំបូងបំផុតដែលត្រូវអនុវត្តគឺអ្វី?`,
        ans: `កំណត់ដែនកំណត់ និងស្វែងយល់ពីលក្ខណៈនៃ ${cleanTitle}`,
        exp: `ជំហានដំបូងក្នុងការដោះស្រាយគឺការពិនិត្យដែនកំណត់ និងស្គាល់ច្បាស់ពីលក្ខណៈគ្រឹះនៃ ${cleanTitle}។`,
        lvl: 'កម្រិត ២ (អនុវត្ត)'
      },
      {
        q: `នៅពេលដោះស្រាយរកតម្លៃអថេរ ឬប៉ារ៉ាម៉ែត្រក្នុង «${cleanTitle}» តើត្រូវប្រើវិធីសាស្ត្រណា?`,
        ans: `ទាញរកតាមសមភាពគណិតវិទ្យា និងលក្ខណៈនៃ ${topic}`,
        exp: `ការទាញរកតម្លៃអថេរត្រូវធ្វើតាមវិធាននៃសមភាព និងលក្ខណៈគណិតវិទ្យាត្រឹមត្រូវនៃ ${topic}។`,
        lvl: 'កម្រិត ២ (អនុវត្ត)'
      },
      {
        q: `ក្នុងការអនុវត្តជាក់ស្តែង (PISA-Style) តើចំណេះដឹងពី «${cleanTitle}» ជួយសម្រួលដល់អ្វី?`,
        ans: `ការវិភាគទិន្នន័យ គំរូគណិតវិទ្យា និងការដោះស្រាយបញ្ហាជាក់ស្តែង`,
        exp: `ស្តង់ដារ PISA ផ្តោតលើសមត្ថភាពប្រើប្រាស់គំនិតនៃ ${cleanTitle} ដើម្បីវិភាគ គំរូ និងដោះស្រាយបញ្ហាក្នុងជីវភាពរស់នៅជាក់ស្តែង។`,
        lvl: 'កម្រិត ២ (អនុវត្ត)'
      },
      {
        q: `តើកំហុសទូទៅដែលសិស្សតែងតែជួបប្រទះពេលដោះស្រាយលំហាត់ «${cleanTitle}» គឺជាអ្វី?`,
        ans: `ការច្រឡំសញ្ញា និងការភ្លេចពិនិត្យលក្ខខណ្ឌដែនកំណត់នៃ ${topic}`,
        exp: `កំហុសញឹកញាប់បំផុតគឺការធ្វេសប្រហែសលើសញ្ញា និងការមិនបានផ្ទៀងផ្ទាត់ដែនកំណត់នៃ ${topic}។`,
        lvl: 'កម្រិត ៣ (ការគិតកម្រិតខ្ពស់)'
      },
      {
        q: `ពិនិត្យលើចំណុច «${cleanTitle}» ៖ តើសេចក្តីសន្និដ្ឋានណាខាងក្រោមនេះត្រឹមត្រូវទាំងស្រុង?`,
        ans: `លទ្ធផលដែលទទួលបានត្រូវតែផ្ទៀងផ្ទាត់ត្រូវជាមួយគ្រប់លក្ខខណ្ឌនៃ ${topic}`,
        exp: `សេចក្តីសន្និដ្ឋានត្រឹមត្រូវតម្រូវឱ្យផ្ទៀងផ្ទាត់ជាមួយគ្រប់លក្ខខណ្ឌគណិតវិទ្យាទាំងអស់ដែលបានចែងក្នុង ${topic}។`,
        lvl: 'កម្រិត ៣ (ការគិតកម្រិតខ្ពស់)'
      },
      {
        q: `តើកត្តាសំខាន់បំផុតដើម្បីសម្រេចបានពិន្ទុអតិបរមាក្នុងការដោះស្រាយលំហាត់ «${cleanTitle}» គឺជាអ្វី?`,
        ans: `ការសរសេរបកស្រាយជំហានគណនាលម្អិត មានហេតុផល និងមានចម្លើយច្បាស់លាស់`,
        exp: `ពិន្ទុអតិបរមាតម្រូវឱ្យសិស្សបង្ហាញដំណើរការដោះស្រាយជាជំហានៗច្បាស់លាស់ អមដោយការបញ្ជាក់ហេតុផលត្រឹមត្រូវ។`,
        lvl: 'កម្រិត ៣ (ការគិតកម្រិតខ្ពស់)'
      },
      {
        q: `ជាទូទៅក្នុងមេរៀននេះ តើទំនាក់ទំនងរវាង «${cleanTitle}» និងចំណុចដទៃទៀតមានលក្ខណៈដូចម្តេច?`,
        ans: `ជាមូលដ្ឋានគ្រឹះតភ្ជាប់គ្នាជាប្រព័ន្ធដើម្បីយល់ដឹងមេរៀនទាំងមូល`,
        exp: `ចំណុចនីមួយៗក្នុងមេរៀនត្រូវបានរៀបចំជាប្រព័ន្ធឡូជីខល ជួយពង្រឹងមូលដ្ឋានគ្រឹះពីសាមញ្ញទៅកម្រិតខ្ពស់។`,
        lvl: 'កម្រិត ៣ (ការគិតកម្រិតខ្ពស់)'
      }
    ];
    
    const finalItems = [];
    const used = new Set();
    
    items.forEach(it => {
      if (!used.has(it.question) && finalItems.length < 10) {
        used.add(it.question);
        finalItems.push(it);
      }
    });
    
    templates.forEach(t => {
      if (!used.has(t.q) && finalItems.length < 10) {
        used.add(t.q);
        finalItems.push({
          question: t.q,
          correct_ans: t.ans,
          explanation: t.exp,
          level: t.lvl
        });
      }
    });
    
    while (finalItems.length < 10) {
      const idxFill = finalItems.length + 1;
      finalItems.push({
        question: `សំណួរពង្រឹងសមត្ថភាពទី ${idxFill} លើចំណុច «${cleanTitle}» ៖ តើចម្លើយណាត្រឹមត្រូវបំផុត?`,
        correct_ans: `ចម្លើយផ្ទៀងផ្ទាត់ត្រឹមត្រូវតាមទ្រឹស្តីបទនៃ ${cleanTitle}`,
        explanation: `ត្រូវជ្រើសរើសចម្លើយដែលផ្ទៀងផ្ទាត់ត្រឹមត្រូវតាមនិយមន័យ និងរូបមន្តនៃ ${cleanTitle}។`,
        level: 'កម្រិត ២ (អនុវត្ត)'
      });
    }
    
    const mcqs = finalItems.slice(0, 10).map((it, idx) => {
      const corr = it.correct_ans || 'ចម្លើយត្រឹមត្រូវ';
      const dists = this.generateDistractors(corr, topic);
      const corrPos = (idx * 3 + pointNum) % 4;
      const opts = dists.slice(0, 3);
      opts.splice(corrPos, 0, corr);
      
      return {
        id: `q${idx + 1}`,
        questionNumber: idx + 1,
        pointNumber: pointNum,
        pointTitle: rawTitle,
        level: it.level || 'កម្រិត ២ (អនុវត្ត)',
        question: it.question,
        options: opts,
        correct: corrPos,
        explanation: it.explanation
      };
    });
    
    return mcqs;
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

    const ws = (this.worksheets || this.worksheetsG11)?.[this.currentLesson.id];

    if (!ws) {
      container.innerHTML = `
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted); background: var(--bg-card); border-radius: var(--radius-lg); border: 1px solid var(--border-glass);">
          <div style="font-size: 3rem; margin-bottom: 14px;">📝</div>
          <h3 style="color: var(--text-primary); margin-bottom: 8px;">សន្លឹកកិច្ចការកំពុងត្រូវបានរៀបចំ</h3>
          <p style="font-size: 0.95rem; line-height: 1.6; max-width: 520px; margin: 0 auto 16px;">
            សន្លឹកកិច្ចការសម្រាប់មេរៀននេះ នឹងត្រូវដាក់ឱ្យអនុវត្តក្នុងពេលឆាប់ៗ។ បច្ចុប្បន្ន ប្រព័ន្ធគាំទ្រសន្លឹកកិច្ចការពេញលេញសម្រាប់គ្រប់កម្រិតថ្នាក់ពីទី ៧ ដល់ទី ១២។
          </p>
          <button class="btn btn-primary" onclick="App.switchTab('materials')">
            📑 មើលឯកសារមេរៀនជំនួសវិញ
          </button>
        </div>
      `;
      return;
    }

    const hasPoints = Array.isArray(ws.points) && ws.points.length > 0;
    const pointIndex = hasPoints ? Math.min(Math.max(0, this.activeWorksheetPoint || 0), ws.points.length - 1) : 0;
    const currentPoint = hasPoints ? ws.points[pointIndex] : ws;
    const currentExercises = currentPoint.exercises || ws.exercises || [];

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
            ${hasPoints && ws.points.length > 1 ? `
              <span class="ws-badge-tag" style="background: rgba(99, 102, 241, 0.12); color: #4f46e5; border-color: rgba(99, 102, 241, 0.3);">
                <span>📍</span>
                <span>ចំណុចទី ${currentPoint.pointNumber || (pointIndex + 1)} នៃ ${ws.points.length}</span>
              </span>
            ` : ''}
          </div>

          <div class="ws-toolbar-actions">
            <button class="btn btn-primary" onclick="App.printWorksheet(false)" title="បោះពុម្ព ឬទាញយកជា PDF សន្លឹកចំណុចនេះ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              🖨️ បោះពុម្ពសន្លឹកចំណុចនេះ
            </button>

            ${hasPoints && ws.points.length > 1 ? `
              <button class="btn btn-outline" style="border-color: #2563eb; color: #2563eb;" onclick="App.printAllWorksheetPoints(false)" title="បោះពុម្ពគ្រប់សន្លឹកកិច្ចការនៃមេរៀននេះ">
                📚 បោះពុម្ពគ្រប់ចំណុច (${ws.points.length} សន្លឹក)
              </button>
            ` : ''}

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

            <button class="btn btn-outline" onclick="App.forceSyncWorksheets()" title="ធ្វើបច្ចុប្បន្នភាពទាញយកសន្លឹកកិច្ចការថ្មី">
              🔄 ធ្វើបច្ចុប្បន្នភាព
            </button>
          </div>
        </div>

        <!-- Section Points Selector Bar (Flipped Classroom Points) -->
        ${hasPoints && ws.points.length > 1 ? `
          <div class="ws-points-selector-bar">
            <div class="ws-points-label">
              <div class="ws-points-label-left">
                <span class="ws-points-icon">📌</span>
                <span class="ws-points-title">សន្លឹកកិច្ចការរៀបតាមចំណុចមេរៀន ៖</span>
              </div>
              <span class="ws-points-count-badge">សរុប ${ws.points.length} ចំណុច (${ws.points.length} សន្លឹក)</span>
            </div>
            <div class="ws-points-track">
              ${ws.points.map((p, pIdx) => `
                <button class="ws-point-pill ${pIdx === pointIndex ? 'active' : ''}" 
                        onclick="App.selectWorksheetPoint(${pIdx})"
                        title="${p.pointTitle || `ចំណុចទី ${pIdx + 1}`}">
                  <span class="ws-pill-num">ចំណុច ${p.pointNumber || (pIdx + 1)}</span>
                  <span class="ws-pill-title">${(p.pointTitle || `ចំណុចទី ${pIdx + 1}`).replace(/^ចំណុចទី\s*[\d១២៣៤៥៦៧៨៩០]+\s*[៖:]?\s*/, '')}</span>
                </button>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- The Official Printable Paper Sheet -->
        <div class="worksheet-paper" id="printable-worksheet-paper">
          <!-- Header Banner (Strictly matching user uploaded screenshot) -->
          <div class="ws-header-banner">
            <div class="ws-school-logo-box">
              <img src="assets/school_logo.png" class="ws-school-logo" alt="Preah Sisowath NGS Logo">
            </div>
            <div class="ws-header-center">
              <h1 class="ws-header-title">${currentPoint.sheetNumber || ws.sheetNumber}</h1>
              ${currentPoint.pointTitle ? `<div class="ws-header-point-subtitle">${currentPoint.pointTitle}</div>` : ''}
            </div>
            <div class="ws-header-right">
              <h2 class="ws-header-lesson">${this.formatLessonTitleHeader(ws.lessonTitle)}</h2>
            </div>
          </div>

          <!-- Student Information Fields -->
          <div class="ws-student-info">
            <div class="ws-info-row">
              <div class="ws-info-item" style="flex: 2;">
                <span class="ws-info-label">ឈ្មោះសិស្ស ៖</span>
                <span class="ws-info-line"></span>
              </div>
              <div class="ws-info-item" style="flex: 1;">
                <span class="ws-info-label">ថ្នាក់ទី ៖</span>
                <span class="ws-info-line"></span>
              </div>
            </div>
            <div class="ws-info-row">
              <div class="ws-info-item" style="flex: 2;">
                <span class="ws-info-label">កាលបរិច្ឆេទ ៖</span>
                <span class="ws-info-line"></span>
              </div>
              <div class="ws-info-item" style="flex: 1;">
                <span class="ws-info-label">ពិន្ទុទទួលបាន ៖</span>
                <span class="ws-score-box">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / ២</span>
              </div>
            </div>
          </div>

          <!-- Flipped Classroom Objective -->
          <div class="ws-objective-card">
            <div class="ws-objective-title">
              <span>🎯 គោលបំណងរង្វាយតម្លៃ (Flipped Classroom) ៖</span>
            </div>
            <div>${currentPoint.objective || ws.objective}</div>
          </div>

          <!-- Point Summary: Formulas, Theorems, Definitions & Core Concepts -->
          ${(currentPoint.summary || currentPoint.topic) ? `
            <div class="ws-summary-card">
              <div class="ws-summary-header">
                <span class="ws-summary-badge">💡 សង្ខេបចំណុចសំខាន់ ៖</span>
              </div>
              <div class="ws-summary-content">
                ${this.formatSummary(currentPoint.summary || currentPoint.topic)}
              </div>
            </div>
          ` : ''}

          <!-- Exercises List -->
          <div class="ws-exercises-container">
            ${currentExercises.map((ex, exIdx) => `
              <div class="ws-exercise-block">
                <div class="ws-ex-header">
                  <span class="ws-ex-num">លំហាត់ទី ${this.toKhmerNum(exIdx + 1)}</span>
                  <span class="ws-ex-points">${this.toKhmerNum(ex.points || 1)} ពិន្ទុ</span>
                </div>

                <div class="ws-ex-instruction">${ex.instruction}</div>
                <div class="ws-ex-question">${ex.question}</div>
              </div>
            `).join('')}
          </div>

          <!-- Footer Banner (Strictly matching user uploaded screenshot) -->
          <div class="ws-footer-banner">
            <div class="ws-footer-label">ចំណាំ៖</div>
            <div class="ws-footer-points">
              <p>១. រាល់ការងារទាំងអស់សូមធ្វើដោយយកចិត្តទុកដាក់បំផុត ករណីមិនយល់សូមស្រាវជ្រាវ សួរគ្រូ ឬ មិត្ត ( ចម្លងក៏ដោយឲ្យតែយល់)</p>
              <p>២. សន្លឹកកិច្ចការខ្លះ ត្រូវនឹងសួរបញ្ជាក់ពេលដល់ម៉ោងជួបគ្នា បើឆ្លើយមិនចេញ នោះនឹងទទួលបានពិន្ទុ ០ លើការងារនេះ</p>
              <p>៣. សូមបញ្ជាក់លេខសន្លឹកកិច្ចការ (ឧ. សន្លឹកទី២០ ឬ ទី២១) ដើម្បីស្រង់ពិន្ទុសកម្មភាព</p>
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
                ${currentExercises.map((ex, exIdx) => `
                  <div class="ws-solution-item">
                    <div class="ws-sol-item-header">
                      <span>ដំណោះស្រាយលំហាត់ទី ${exIdx + 1}</span>
                      <span style="color:#d97706; font-size:0.85rem;">[ពិន្ទុ ៖ ${ex.points || 1} ពិន្ទុ]</span>
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

  selectWorksheetPoint(index) {
    this.activeWorksheetPoint = index;
    if (window.Math3D) {
      window.Math3D.selectPoint(index);
    }
    this.renderWorksheetTab();
    const paper = document.getElementById('printable-worksheet-paper');
    if (paper && window.innerWidth <= 768) {
      paper.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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

  printAllWorksheetPoints(includeSolutions = false) {
    const ws = (this.worksheets || this.worksheetsG11)?.[this.currentLesson?.id];
    if (!ws || !ws.points || ws.points.length === 0) {
      this.printWorksheet(includeSolutions);
      return;
    }

    const printContainer = document.createElement('div');
    printContainer.id = 'ws-all-points-print-container';
    printContainer.className = 'ws-all-points-print-container';

    printContainer.innerHTML = ws.points.map((pt, ptIdx) => `
      <div class="worksheet-paper ${ptIdx < ws.points.length - 1 ? 'ws-page-break' : ''}">
        <div class="ws-header-banner">
          <div class="ws-school-logo-box">
            <img src="assets/school_logo.png" class="ws-school-logo" alt="Preah Sisowath NGS Logo">
          </div>
          <div class="ws-header-center">
            <h1 class="ws-header-title">${pt.sheetNumber || ws.sheetNumber}</h1>
            <div class="ws-header-point-subtitle">${pt.pointTitle}</div>
          </div>
          <div class="ws-header-right">
            <h2 class="ws-header-lesson">${this.formatLessonTitleHeader(ws.lessonTitle)}</h2>
          </div>
        </div>

        <div class="ws-student-info">
          <div class="ws-info-row">
            <div class="ws-info-item" style="flex: 2;">
              <span class="ws-info-label">ឈ្មោះសិស្ស ៖</span>
              <span class="ws-info-line"></span>
            </div>
            <div class="ws-info-item" style="flex: 1;">
              <span class="ws-info-label">ថ្នាក់ទី ៖</span>
              <span class="ws-info-line"></span>
            </div>
          </div>
          <div class="ws-info-row">
            <div class="ws-info-item" style="flex: 2;">
              <span class="ws-info-label">កាលបរិច្ឆេទ ៖</span>
              <span class="ws-info-line"></span>
            </div>
            <div class="ws-info-item" style="flex: 1;">
              <span class="ws-info-label">ពិន្ទុទទួលបាន ៖</span>
              <span class="ws-score-box">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; / ២</span>
            </div>
          </div>
        </div>

        <div class="ws-objective-card">
          <div class="ws-objective-title">
            <span>🎯 គោលបំណងរង្វាយតម្លៃ (Flipped Classroom) ៖</span>
          </div>
          <div>${pt.objective || ws.objective}</div>
        </div>

        <!-- Point Summary: Formulas, Theorems, Definitions & Core Concepts -->
        ${(pt.summary || pt.topic) ? `
          <div class="ws-summary-card">
            <div class="ws-summary-header">
              <span class="ws-summary-badge">💡 សង្ខេបចំណុចសំខាន់ ៖</span>
            </div>
            <div class="ws-summary-content">
              ${this.formatSummary(pt.summary || pt.topic)}
            </div>
          </div>
        ` : ''}

        <div class="ws-exercises-container">
          ${pt.exercises.map((ex, exIdx) => `
            <div class="ws-exercise-block">
              <div class="ws-ex-header">
                <span class="ws-ex-num">លំហាត់ទី ${this.toKhmerNum(exIdx + 1)}</span>
                <span class="ws-ex-points">${this.toKhmerNum(ex.points || 1)} ពិន្ទុ</span>
              </div>
              <div class="ws-ex-instruction">${ex.instruction}</div>
              <div class="ws-ex-question">${ex.question}</div>
            </div>
          `).join('')}
        </div>

        <div class="ws-footer-banner">
          <div class="ws-footer-label">ចំណាំ៖</div>
          <div class="ws-footer-points">
            <p>១. រាល់ការងារទាំងអស់សូមធ្វើដោយយកចិត្តទុកដាក់បំផុត ករណីមិនយល់សូមស្រាវជ្រាវ សួរគ្រូ ឬ មិត្ត ( ចម្លងក៏ដោយឲ្យតែយល់)</p>
            <p>២. សន្លឹកកិច្ចការខ្លះ ត្រូវនឹងសួរបញ្ជាក់ពេលដល់ម៉ោងជួបគ្នា បើឆ្លើយមិនចេញ នោះនឹងទទួលបានពិន្ទុ ០ លើការងារនេះ</p>
            <p>៣. សូមបញ្ជាក់លេខសន្លឹកកិច្ចការ (ឧ. សន្លឹកទី២០ ឬ ទី២១) ដើម្បីស្រង់ពិន្ទុសកម្មភាព</p>
          </div>
        </div>
      </div>
    `).join('');

    document.body.appendChild(printContainer);
    this.renderMath(printContainer);

    const mainWsPaper = document.getElementById('printable-worksheet-paper');
    const mainToolbar = document.querySelector('.ws-toolbar');
    const mainPointsBar = document.querySelector('.ws-points-selector-bar');
    const teacherSec = document.getElementById('ws-teacher-section');
    if (mainWsPaper) mainWsPaper.style.display = 'none';
    if (mainToolbar) mainToolbar.style.display = 'none';
    if (mainPointsBar) mainPointsBar.style.display = 'none';
    if (teacherSec) teacherSec.style.display = 'none';

    window.print();

    setTimeout(() => {
      if (printContainer && printContainer.parentNode) {
        printContainer.parentNode.removeChild(printContainer);
      }
      if (mainWsPaper) mainWsPaper.style.display = '';
      if (mainToolbar) mainToolbar.style.display = '';
      if (mainPointsBar) mainPointsBar.style.display = '';
      if (teacherSec) teacherSec.style.display = '';
    }, 1000);
  },

  renderQuizTab() {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer || !this.currentLesson) return;

    const ws = (this.worksheets || this.worksheetsG11)?.[this.currentLesson.id];
    const points = (ws && Array.isArray(ws.points) && ws.points.length > 0) 
      ? ws.points 
      : (this.currentLesson.points || []);
    
    const lessonPQuizzes = this.pointQuizzes?.[this.currentLesson.id] || {};
    
    // Determine active quiz questions
    let quiz = [];
    let currentPointTitle = '';
    
    if (this.activeQuizPoint > 0) {
      // Specific point selected: exactly 10 questions for that point!
      quiz = lessonPQuizzes[String(this.activeQuizPoint)];
      const ptObj = points.find(p => (p.pointNumber || p.number) === this.activeQuizPoint) || points[this.activeQuizPoint - 1];
      if (!quiz || quiz.length === 0) {
        quiz = this.generatePointMCQs(this.currentLesson, ptObj, this.activeQuizPoint);
      }
      currentPointTitle = ptObj ? (ptObj.pointTitle || ptObj.title || `ចំណុចទី ${this.activeQuizPoint}`) : `ចំណុចទី ${this.activeQuizPoint}`;
    } else {
      // "All points" (0) selected: take balanced set of 10 questions across points
      const ptsKeys = Object.keys(lessonPQuizzes).sort((a,b) => parseInt(a) - parseInt(b));
      if (ptsKeys.length > 0) {
        const perPt = Math.max(1, Math.floor(10 / ptsKeys.length));
        ptsKeys.forEach(k => {
          const list = lessonPQuizzes[k] || [];
          quiz.push(...list.slice(0, perPt));
        });
        if (quiz.length < 10 && lessonPQuizzes[ptsKeys[0]]) {
          for (const q of lessonPQuizzes[ptsKeys[0]]) {
            if (quiz.length >= 10) break;
            if (!quiz.some(existing => existing.id === q.id && existing.pointNumber === q.pointNumber)) {
              quiz.push(q);
            }
          }
        }
        quiz = quiz.slice(0, 10);
      } else if (points.length > 0) {
        const perPt = Math.max(1, Math.floor(10 / points.length));
        points.forEach((p, idx) => {
          const pNum = p.pointNumber || p.number || (idx + 1);
          const pQuiz = this.generatePointMCQs(this.currentLesson, p, pNum);
          quiz.push(...pQuiz.slice(0, perPt));
        });
        if (quiz.length < 10 && points[0]) {
          const p1Quiz = this.generatePointMCQs(this.currentLesson, points[0], points[0].pointNumber || 1);
          for (const q of p1Quiz) {
            if (quiz.length >= 10) break;
            if (!quiz.some(existing => existing.question === q.question)) {
              quiz.push(q);
            }
          }
        }
        quiz = quiz.slice(0, 10);
      } else {
        quiz = this.currentLesson.quiz || [];
      }
      currentPointTitle = 'គ្រប់ចំណុចចម្រុះនៃមេរៀន (All Points)';
    }

    if (!quiz || quiz.length === 0) {
      quiz = this.currentLesson.quiz || [];
    }

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

    this.currentActiveQuizList = quiz;

    // Check Exam Schedule (Date & Time Window) and Single Attempt Lock
    if (this.isExamMode || this.examDate) {
      const validity = this.checkExamScheduleValidity();
      if (validity.status === 'upcoming') {
        this.renderExamUpcomingScreen(quizContainer, validity, currentPointTitle);
        return;
      }
      if (validity.status === 'expired') {
        this.renderExamExpiredScreen(quizContainer, validity, currentPointTitle);
        return;
      }

      const previousSub = this.getPreviousExamSubmission();
      if (previousSub) {
        this.renderExamAlreadySubmittedScreen(quizContainer, previousSub, currentPointTitle);
        return;
      }
    }

    if ((this.examTimeLimit > 0 || this.isExamMode || this.examDate) && !this.examStarted) {
      const sessionKey = `timed_exam_${this.currentLesson?.id || 'quiz'}`;
      const savedStart = parseInt(sessionStorage.getItem(sessionKey) || '0', 10);
      if (savedStart > 0 && this.examTimeLimit > 0) {
        const elapsed = Math.floor((Date.now() - savedStart) / 1000);
        const totalSec = this.examTimeLimit * 60;
        if (elapsed < totalSec) {
          this.examStarted = true;
          this.examSecondsRemaining = totalSec - elapsed;
          this.startCountdownTimer();
        } else {
          this.examStarted = true;
          this.examFinishedByTimeout = true;
        }
      }
    }

    if ((this.examTimeLimit > 0 || this.isExamMode || this.examDate) && !this.examStarted) {
      this.renderExamLobby(quizContainer, quiz, points, currentPointTitle);
      return;
    }

    this.quizScore = 0;
    this.answeredQuiz = {};
    this.quizUserAnswers = {};
    const totalQ = quiz.length;
    const hasPoints = points && points.length > 0;
    const studentInfo = this.getStudentInfo();
    const hasStudent = !!(studentInfo.name && studentInfo.classRoom);

    quizContainer.innerHTML = `
      ${this.isExamMode ? `
        <!-- Isolated Official Exam Header Banner -->
        <div class="exam-mode-header-banner">
          <div class="exam-mode-badge">📝 ការប្រឡងវាស់ស្ទង់សមត្ថភាពគណិតវិទ្យា (Official Exam)</div>
          <h2 class="exam-mode-title">${this.currentLesson?.title || 'ការប្រឡងវាស់ស្ទង់សមត្ថភាព'}</h2>
          <div class="exam-mode-meta">
            <span class="exam-mode-meta-item">📌 <strong>${currentPointTitle}</strong></span>
            ${studentInfo.classRoom ? `<span class="exam-mode-meta-item">• 🏫 ថ្នាក់ <strong>${studentInfo.classRoom}</strong></span>` : ''}
            ${this.examTimeLimit > 0 ? `<span class="exam-mode-meta-item">• ⏱️ ថិរវេលា <strong>${this.examTimeLimit} នាទី</strong></span>` : ''}
            <span class="exam-mode-meta-item">• 🎯 <strong>${totalQ} សំណួរ</strong></span>
          </div>
        </div>
      ` : ''}

      ${((this.examTimeLimit > 0 || this.isExamMode || this.examDate) && this.examStarted) ? `
        <!-- Sticky Live Exam Bar -->
        <div class="exam-live-bar ${this.examTimeLimit > 0 ? (this.examSecondsRemaining <= 60 ? 'warning-red' : (this.examSecondsRemaining <= 120 ? 'warning-amber' : '')) : ''}" id="exam-live-bar">
          <div class="exam-live-bar-left">
            ${this.examTimeLimit > 0 ? `
              <div class="exam-timer-chip">
                <span class="timer-icon">⏱️</span>
                <span class="timer-label">ពេលវេលានៅសល់ ៖</span>
                <span class="exam-timer-countdown" id="exam-timer-display">${this.formatTimer(Math.max(0, this.examSecondsRemaining))}</span>
              </div>
              <div class="exam-timer-bar-track">
                <div class="exam-timer-bar-fill" id="exam-live-progress" style="width: ${Math.max(0, Math.min(100, (this.examSecondsRemaining / (this.examTimeLimit * 60)) * 100))}%;"></div>
              </div>
            ` : `
              <div class="exam-timer-chip">
                <span class="timer-icon">📝</span>
                <span class="timer-label">ការប្រឡងផ្លូវការ ៖</span>
                <span class="exam-timer-countdown" style="font-size: 0.95rem; color: #38bdf8;">${studentInfo.name || 'បេក្ខជន'} (${studentInfo.classRoom || ''})</span>
              </div>
            `}
          </div>
          <button type="button" class="btn btn-sm btn-submit-exam-early" onclick="App.confirmFinishExamEarly()">
            📤 បញ្ចប់ & ផ្ញើពិន្ទុ
          </button>
        </div>
      ` : ''}

      <!-- Student Profile & Class Bar -->
      <div class="quiz-student-bar">
        <div class="student-bar-info">
          ${hasStudent ? `
            <div class="student-bar-item">
              <span class="student-icon">👨‍🎓</span>
              <span class="student-name">សិស្ស ៖ <strong>${studentInfo.name}</strong></span>
            </div>
            <div class="student-bar-item">
              <span class="student-tag">ថ្នាក់ <strong>${studentInfo.classRoom}</strong></span>
            </div>
            ${studentInfo.rollNo ? `
              <div class="student-bar-item">
                <span class="student-tag">លេខ <strong>#${studentInfo.rollNo}</strong></span>
              </div>
            ` : ''}
          ` : `
            <div class="student-bar-item warning" onclick="App.openStudentInfoModal()" style="cursor:pointer;" title="ចុចដើម្បីបំពេញឈ្មោះ និងថ្នាក់">
              <span class="student-icon">⚠️</span>
              <span>សូមចុះឈ្មោះសិស្ស និងបន្ទប់ថ្នាក់ (ឧ. 10A1, 10A2...) ដើម្បីឱ្យពិន្ទុបញ្ជូនទៅលោកគ្រូស្វ័យប្រវត្ត</span>
            </div>
          `}
        </div>
        <div class="student-bar-actions">
          <button class="btn btn-sm btn-outline student-edit-btn" onclick="App.openStudentInfoModal()" title="កែប្រែឈ្មោះ និងថ្នាក់សិស្ស">
            ${hasStudent ? '✏️ កែប្រែ' : '📝 បំពេញឈ្មោះ & ថ្នាក់'}
          </button>
          ${!this.isExamMode ? `
            <button class="btn btn-sm btn-primary teacher-share-btn" onclick="App.openTeacherSheetModal(true)" title="ចែករំលែក Link តេស្តមេរៀននេះទៅកាន់ថ្នាក់">
              🔗 ចែករំលែក Link តេស្តនេះ
            </button>
            <button class="btn btn-sm btn-outline teacher-sheet-btn" onclick="App.openTeacherSheetModal()" title="ការកំណត់តារាងពិន្ទុ Google Sheets / Excel សម្រាប់គ្រូ">
              📊 តារាងពិន្ទុ Excel
            </button>
          ` : ''}
        </div>
      </div>
      ${(hasPoints && !this.examTimeLimit && !this.isExamMode) ? `
        <!-- Section Points Selector Bar (MCQ Points Selector) -->
        <div class="quiz-points-selector-bar">
          <div class="quiz-points-header">
            <div class="quiz-points-header-left">
              <span class="quiz-points-icon">🎯</span>
              <span class="quiz-points-label">កម្រងសំណួរតេស្ត MCQ តាមចំណុចមេរៀន (១០ លំហាត់ក្នុងមួយចំណុច) ៖</span>
            </div>
            <span class="quiz-points-badge">សរុប ${points.length} ចំណុច (${points.length * 10} សំណួរ)</span>
          </div>
          <div class="quiz-points-track">
            <button class="quiz-point-pill ${this.activeQuizPoint === 0 ? 'active' : ''}" 
                    onclick="App.selectQuizPoint(0)">
              <span class="quiz-pill-num">🌟</span>
              <span class="quiz-pill-title">គ្រប់ចំណុចចម្រុះ (${totalQ} សំណួរ)</span>
            </button>
            ${points.map((p, pIdx) => {
              const pNum = p.pointNumber || p.number || (pIdx + 1);
              const rawTitle = p.pointTitle || p.title || `ចំណុចទី ${pNum}`;
              const cleanTitle = rawTitle.replace(/^ចំណុចទី\s*[\d១២៣៤៥៦៧៨៩០]+\s*[៖:]?\s*/, '');
              const isActive = this.activeQuizPoint === pNum;
              return `
                <button class="quiz-point-pill ${isActive ? 'active' : ''}" 
                        onclick="App.selectQuizPoint(${pNum})"
                        title="${rawTitle}">
                  <span class="quiz-pill-num">ចំណុច ${pNum}</span>
                  <span class="quiz-pill-title">${cleanTitle}</span>
                  <span class="quiz-pill-badge">១០ លំហាត់</span>
                </button>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="quiz-arena-header">
        <div class="arena-title-col">
          <div class="arena-kicker">
            <span class="arena-icon-badge">🎯</span>
            <span class="arena-kicker-text">${currentPointTitle} • ស្តង់ដារ PISA</span>
          </div>
          <div class="arena-hint">សូមជ្រើសរើសចម្លើយដែលត្រឹមត្រូវ រួចផ្ទៀងផ្ទាត់ការពន្យល់លម្អិតពីលោកគ្រូ</div>
        </div>
        <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap;">
          ${!this.isExamMode ? `
            <button class="quiz-retake-btn" onclick="App.retakeQuiz()" title="កំណត់សំណួរឡើងវិញដើម្បីអនុវត្តម្តងទៀត">
              🔄 ធ្វើតេស្តឡើងវិញ
            </button>
          ` : ''}
          <div class="arena-score-box">
            <div class="arena-score-val" id="quiz-live-score">0 / ${totalQ}</div>
            <div class="arena-score-lbl">ពិន្ទុរបស់អ្នក</div>
          </div>
        </div>
      </div>

      <div class="quiz-questions-list">
        ${quiz.map((q, qIndex) => {
          let lvlClass = 'lvl-easy';
          let lvlLabel = q.level || 'កម្រិត ១ (មូលដ្ឋាន)';
          if (lvlLabel.includes('២') || lvlLabel.includes('អនុវត្ត')) lvlClass = 'lvl-med';
          else if (lvlLabel.includes('៣') || lvlLabel.includes('ខ្ពស់')) lvlClass = 'lvl-hard';

          return `
            <div class="quiz-card" data-q-index="${qIndex}">
              <div class="quiz-card-header">
                <div class="quiz-q-pill">
                  <span class="q-pill-dot"></span>
                  <span class="q-pill-text">សំណួរទី ${qIndex + 1} នៃ ${totalQ}</span>
                  <span class="quiz-level-pill ${lvlClass}">${lvlLabel}</span>
                </div>
                <span class="quiz-status-pill" id="quiz-status-${qIndex}">មិនទាន់ឆ្លើយ</span>
              </div>

              <div class="quiz-question-box">
                <h4 class="quiz-question">${this.formatQuestionText(q.question)}</h4>
              </div>

              <div class="quiz-options ${this.isSingleColumnOptions(q.options) ? 'options-stack' : 'options-grid'}">
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
                  ${this.formatExplanationText(q.explanation)}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.renderMath(quizContainer);
  },

  renderExamLobby(container, quiz, points, pointTitle) {
    this.isExamMode = true;
    document.body.classList.add('exam-mode-active');
    const studentInfo = this.getStudentInfo();
    const totalQ = quiz.length;
    const lessonTitle = this.currentLesson ? (this.currentLesson.title || this.currentLesson.name || '') : '';

    container.innerHTML = `
      <div class="exam-lobby-card">
        <div class="exam-lobby-header">
          <div class="exam-lobby-badge">📝 ការប្រឡងវាស់ស្ទង់សមត្ថភាពផ្លូវការ (Official Exam)</div>
          <h2 class="exam-lobby-title">${lessonTitle || 'ការប្រឡងវាស់ស្ទង់សមត្ថភាព'}</h2>
          <p class="exam-lobby-subtitle">${pointTitle}</p>
        </div>

        <div class="exam-lobby-meta-grid">
          <div class="exam-meta-card">
            <span class="exam-meta-icon">⏱️</span>
            <div class="exam-meta-info">
              <span class="exam-meta-label">ថិរវេលាប្រឡង</span>
              <span class="exam-meta-value">${this.examTimeLimit > 0 ? `${this.examTimeLimit} នាទី` : 'មិនកំណត់ពេល'}</span>
            </div>
          </div>
          ${this.examDate ? `
            <div class="exam-meta-card">
              <span class="exam-meta-icon">📅</span>
              <div class="exam-meta-info">
                <span class="exam-meta-label">កាលបរិច្ឆេទប្រឡង</span>
                <span class="exam-meta-value">${this.formatKhmerDate(this.examDate)}</span>
              </div>
            </div>
          ` : ''}
          <div class="exam-meta-card">
            <span class="exam-meta-icon">📝</span>
            <div class="exam-meta-info">
              <span class="exam-meta-label">ចំនួនសំណួរ</span>
              <span class="exam-meta-value">${totalQ} សំណួរ</span>
            </div>
          </div>
          <div class="exam-meta-card">
            <span class="exam-meta-icon">🏫</span>
            <div class="exam-meta-info">
              <span class="exam-meta-label">បន្ទប់ / ថ្នាក់</span>
              <span class="exam-meta-value">${studentInfo.classRoom || 'ថ្នាក់ទូទៅ'}</span>
            </div>
          </div>
        </div>

        <div class="exam-lobby-form">
          <h4 style="margin-bottom: 12px; font-size: 0.95rem; font-weight: 700; color: var(--text-primary); display: flex; align-items: center; gap: 8px;">
            <span>👨‍🎓</span>
            <span>ព័ត៌មានបេក្ខជនប្រឡង (សូមបំពេញឱ្យបានត្រឹមត្រូវ) ៖</span>
          </h4>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
            <div class="form-group">
              <label class="form-label" for="exam-student-name">គោត្តនាម & នាមសិស្ស ៖ <span style="color:#ef4444;">*</span></label>
              <input type="text" id="exam-student-name" class="form-input" placeholder="ឧ. ហេង សំស្រីពេជ្រ" value="${studentInfo.name || ''}">
            </div>
            <div class="form-group">
              <label class="form-label" for="exam-student-class">បន្ទប់ / ថ្នាក់ ៖ <span style="color:#ef4444;">*</span></label>
              <input type="text" id="exam-student-class" class="form-input" placeholder="ឧ. 11NGS-P3" value="${studentInfo.classRoom || ''}" style="text-transform: uppercase;">
            </div>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label" for="exam-student-roll">លេខរៀងក្នុងបញ្ជីវត្តមាន ៖</label>
            <input type="text" id="exam-student-roll" class="form-input" placeholder="ឧ. 15" value="${studentInfo.rollNo || ''}">
          </div>
        </div>

        <div class="exam-lobby-rules">
          <div style="font-weight: 700; color: #f59e0b; margin-bottom: 6px;">⚠️ បទបញ្ជា និងការណែនាំមុនប្រឡង ៖</div>
          <ul>
            <li>ការប្រឡងនេះអាច <strong>ប្រឡងបានតែ ១ លើកគត់ (Single Attempt Only)</strong>។ ពេលបញ្ជូនពិន្ទុរួច ប្រព័ន្ធនឹងចាក់សោស្វ័យប្រវត្ត មិនអាចចូលប្រឡងឡើងវិញបានឡើយ។</li>
            ${this.examTimeLimit > 0 ? `
              <li>ពេលចុច <strong>[ចាប់ផ្តើមធ្វើតេស្ត]</strong> នាឡិកានឹងរាប់ថយក្រោយភ្លាមៗ ដោយមិនអាចផ្អាក (Pause) បានឡើយ។</li>
              <li>នៅពេលអស់ម៉ោងកំណត់ ប្រព័ន្ធនឹង <strong>កាត់សេចក្តីស្វ័យប្រវត្ត</strong> និងបញ្ជូនពិន្ទុដែលធ្វើបានទៅកាន់លោកគ្រូភ្លាមៗ។</li>
            ` : ''}
            <li>ប្រសិនបើប្អូនធ្វើរួចរាល់ អាចចុចប៊ូតុង <strong>[បញ្ចប់ & ផ្ញើពិន្ទុ]</strong> នៅផ្នែកខាងលើ។</li>
          </ul>
        </div>

        <button type="button" class="btn btn-primary exam-start-btn" onclick="App.startTimedExam()">
          🚀 ចាប់ផ្តើមធ្វើតេស្តឥឡូវនេះ (Start Exam)
        </button>
      </div>
    `;

    this.renderMath(container);

    setTimeout(() => {
      const nameInp = document.getElementById('exam-student-name');
      if (nameInp && !nameInp.value) nameInp.focus();
    }, 200);
  },

  startTimedExam() {
    const nameInp = document.getElementById('exam-student-name');
    const classInp = document.getElementById('exam-student-class');
    const rollInp = document.getElementById('exam-student-roll');

    const name = (nameInp?.value || '').trim();
    const classRoom = (classInp?.value || '').trim().toUpperCase();
    const rollNo = (rollInp?.value || '').trim();

    if (!name) {
      this.showToast('សូមបញ្ចូលឈ្មោះប្អូនសិន មុននឹងចាប់ផ្តើមប្រឡង!', 'warning');
      nameInp?.focus();
      return;
    }
    if (!classRoom) {
      this.showToast('សូមបញ្ចូលបន្ទប់/ថ្នាក់សិន!', 'warning');
      classInp?.focus();
      return;
    }

    // Schedule Validity Check
    const validity = this.checkExamScheduleValidity();
    if (validity.status !== 'valid') {
      this.renderQuizTab();
      return;
    }

    // Anti-duplicate / Single Attempt Check
    const previousSub = this.getPreviousExamSubmission(name);
    if (previousSub) {
      this.showToast(`សិស្សឈ្មោះ "${name}" បានប្រឡង និងបញ្ជូនពិន្ទុរួចរាល់ហើយ មិនអាចប្រឡងម្តងទៀតបានទេ!`, 'warning');
      this.renderQuizTab();
      return;
    }

    const info = this.getStudentInfo();
    info.name = name;
    info.classRoom = classRoom;
    if (rollNo) info.rollNo = rollNo;
    this.saveStudentInfo(info);

    const sessionKey = `timed_exam_${this.currentLesson?.id || 'quiz'}`;
    sessionStorage.setItem(sessionKey, Date.now().toString());

    this.examStarted = true;
    this.examFinishedByTimeout = false;
    if (this.examTimeLimit > 0) {
      this.examSecondsRemaining = this.examTimeLimit * 60;
      this.startCountdownTimer();
    }

    this.renderQuizTab();
    const durationMsg = this.examTimeLimit > 0 ? ` (${this.examTimeLimit} នាទី)` : '';
    this.showToast(`⏱️ បានចាប់ផ្តើមការប្រឡង${durationMsg}! សូមជូនពរទទួលបានជោគជ័យ 🎯`, 'success');

    setTimeout(() => {
      const liveBar = document.getElementById('exam-live-bar');
      liveBar?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 200);
  },

  startCountdownTimer() {
    if (this.examTimerInterval) {
      clearInterval(this.examTimerInterval);
    }

    this.examTimerInterval = setInterval(() => {
      this.examSecondsRemaining--;

      const displayEl = document.getElementById('exam-timer-display');
      const progressEl = document.getElementById('exam-live-progress');
      const liveBar = document.getElementById('exam-live-bar');

      const totalSec = (this.examTimeLimit || 1) * 60;
      const pctLeft = Math.max(0, Math.min(100, (this.examSecondsRemaining / totalSec) * 100));

      if (displayEl) {
        displayEl.textContent = this.formatTimer(Math.max(0, this.examSecondsRemaining));
      }
      if (progressEl) {
        progressEl.style.width = `${pctLeft}%`;
      }

      if (liveBar) {
        if (this.examSecondsRemaining <= 60) {
          liveBar.className = 'exam-live-bar warning-red';
        } else if (this.examSecondsRemaining <= 120) {
          liveBar.className = 'exam-live-bar warning-amber';
        } else {
          liveBar.className = 'exam-live-bar';
        }
      }

      if (this.examSecondsRemaining <= 0) {
        clearInterval(this.examTimerInterval);
        this.examTimerInterval = null;
        this.onExamTimeUp();
      }
    }, 1000);
  },

  formatTimer(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  confirmFinishExamEarly() {
    const quizList = this.currentActiveQuizList || [];
    const totalQ = quizList.length;
    const answeredCount = Object.keys(this.answeredQuiz).length;
    const remainingCount = totalQ - answeredCount;

    let msg = 'តើប្អូនពិតជាចង់បញ្ចប់ការប្រឡង និងផ្ញើពិន្ទុឥឡូវនេះមែនទេ?';
    if (remainingCount > 0) {
      msg = `ប្អូននៅសល់ ${remainingCount} សំណួរមិនទាន់ឆ្លើយ! តើពិតជាចង់បញ្ចប់ការប្រឡងឥឡូវនេះមែនទេ?`;
    }

    if (confirm(msg)) {
      if (this.examTimerInterval) {
        clearInterval(this.examTimerInterval);
        this.examTimerInterval = null;
      }
      const sessionKey = `timed_exam_${this.currentLesson?.id || 'quiz'}`;
      sessionStorage.removeItem(sessionKey);

      document.querySelectorAll('.quiz-opt').forEach(opt => {
        opt.style.pointerEvents = 'none';
      });

      this.showQuizCompletionBanner(totalQ);
    }
  },

  onExamTimeUp() {
    this.examFinishedByTimeout = true;
    const sessionKey = `timed_exam_${this.currentLesson?.id || 'quiz'}`;
    sessionStorage.removeItem(sessionKey);

    document.querySelectorAll('.quiz-opt').forEach(opt => {
      opt.style.pointerEvents = 'none';
      opt.style.opacity = '0.7';
    });

    const displayEl = document.getElementById('exam-timer-display');
    if (displayEl) displayEl.textContent = '00:00 (អស់ម៉ោង)';

    const liveBar = document.getElementById('exam-live-bar');
    if (liveBar) {
      liveBar.className = 'exam-live-bar warning-red';
    }

    this.showToast('⏰ អស់ម៉ោងប្រឡងហើយ! ប្រព័ន្ធកំពុងកត់ត្រា និងបញ្ជូនពិន្ទុរបស់អ្នកទៅលោកគ្រូ...', 'warning');

    const quizList = this.currentActiveQuizList || this.currentLesson?.quiz || [];
    this.showQuizCompletionBanner(quizList.length);
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
            "\\sum": "\\mathop{\\mathrm{sum}}\\limits",
            "\\bar": "\\overline"
          },
          throwOnError: false
        });
      } catch (err) {
        console.warn('KaTeX render warning:', err);
      }
    }
  },

  toKhmerNum(num) {
    if (num === null || num === undefined) return '';
    const khmerDigits = ['០', '១', '២', '៣', '៤', '៥', '៦', '៧', '៨', '៩'];
    return String(num).replace(/[0-9]/g, d => khmerDigits[parseInt(d, 10)]);
  },

  normalizeTimeString(timeStr) {
    if (!timeStr) return '';
    let str = String(timeStr).trim().toUpperCase();
    const isPM = str.includes('PM');
    const isAM = str.includes('AM');
    str = str.replace(/[^\d:]/g, '');
    const parts = str.split(':');
    if (parts.length < 2) return '';
    let hours = parseInt(parts[0], 10);
    const mins = String(parseInt(parts[1], 10) || 0).padStart(2, '0');
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${mins}`;
  },

  formatKhmerTimeDisplay(timeStr) {
    if (!timeStr) return '';
    const norm = this.normalizeTimeString(timeStr) || timeStr;
    const parts = norm.split(':');
    if (parts.length < 2) return this.toKhmerNum(norm);
    const h = parseInt(parts[0], 10);
    let period = 'ព្រឹក';
    if (h >= 12 && h < 17) period = 'រសៀល';
    else if (h >= 17 && h < 21) period = 'ល្ងាច';
    else if (h >= 21 || h < 5) period = 'យប់';
    return `${this.toKhmerNum(norm)} (${period})`;
  },

  formatKhmerDate(dateStr, timeStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const yyyy = parts[0];
    const mmIndex = parseInt(parts[1], 10) - 1;
    const dd = parseInt(parts[2], 10);
    const khmerMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    const monthName = khmerMonths[mmIndex] || parts[1];
    let res = `ថ្ងៃទី ${this.toKhmerNum(dd)} ខែ ${monthName} ឆ្នាំ ${this.toKhmerNum(yyyy)}`;
    if (timeStr) {
      res += ` វេលាម៉ោង ${this.toKhmerNum(timeStr)}`;
    }
    return res;
  },

  getKhmerFormattedDateTime(dateObj) {
    const d = dateObj || new Date();
    const yyyy = d.getFullYear();
    const mmIndex = d.getMonth();
    const dd = d.getDate();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const khmerMonths = [
      'មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា',
      'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ'
    ];
    return `ថ្ងៃទី ${this.toKhmerNum(dd)} ខែ ${khmerMonths[mmIndex]} ឆ្នាំ ${this.toKhmerNum(yyyy)} វេលាម៉ោង ${this.toKhmerNum(hours)}:${this.toKhmerNum(mins)}`;
  },

  checkExamScheduleValidity() {
    if (!this.examDate) {
      return { status: 'valid' };
    }

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const curDateStr = `${yyyy}-${mm}-${dd}`;
    const curHours = String(now.getHours()).padStart(2, '0');
    const curMins = String(now.getMinutes()).padStart(2, '0');
    const curTimeStr = `${curHours}:${curMins}`;

    // 1. Date comparison
    if (curDateStr < this.examDate) {
      const targetStart = this.examStartTime ? `${this.examDate}T${this.examStartTime}:00` : `${this.examDate}T00:00:00`;
      const msUntilStart = new Date(targetStart).getTime() - now.getTime();
      return {
        status: 'upcoming',
        reason: 'future_date',
        examDate: this.examDate,
        startTime: this.examStartTime,
        endTime: this.examEndTime,
        msUntilStart: Math.max(0, msUntilStart)
      };
    } else if (curDateStr > this.examDate) {
      return {
        status: 'expired',
        reason: 'past_date',
        examDate: this.examDate,
        startTime: this.examStartTime,
        endTime: this.examEndTime
      };
    }

    // 2. Same day: check time window if specified
    if (this.examStartTime && curTimeStr < this.examStartTime) {
      const targetStart = `${this.examDate}T${this.examStartTime}:00`;
      const msUntilStart = new Date(targetStart).getTime() - now.getTime();
      return {
        status: 'upcoming',
        reason: 'before_time',
        examDate: this.examDate,
        startTime: this.examStartTime,
        endTime: this.examEndTime,
        msUntilStart: Math.max(0, msUntilStart)
      };
    }

    if (this.examEndTime && curTimeStr > this.examEndTime) {
      return {
        status: 'expired',
        reason: 'after_time',
        examDate: this.examDate,
        startTime: this.examStartTime,
        endTime: this.examEndTime
      };
    }

    return {
      status: 'valid',
      examDate: this.examDate,
      startTime: this.examStartTime,
      endTime: this.examEndTime
    };
  },

  getExamSessionKey() {
    const courseId = this.currentCourse?.id || 'g';
    const lessonId = this.currentLesson?.id || 'l';
    const point = this.activeQuizPoint || '0';
    const dateStr = this.examDate || 'open';
    const classRoom = (this.getStudentInfo().classRoom || '').trim().toUpperCase() || 'DEF';
    return `exam_sub_${courseId}_${lessonId}_p${point}_d${dateStr}_c${classRoom}`;
  },

  getStudentExamKey(studentName) {
    const baseKey = this.getExamSessionKey();
    const cleanName = (studentName || this.getStudentInfo().name || '').trim().toLowerCase();
    return `${baseKey}_s_${encodeURIComponent(cleanName)}`;
  },

  getPreviousExamSubmission() {
    if (!this.isExamMode) return null;
    const studentInfo = this.getStudentInfo();
    
    // Check by student name key
    if (studentInfo.name) {
      const studentKey = this.getStudentExamKey(studentInfo.name);
      const saved = localStorage.getItem(studentKey);
      if (saved) {
        try { return JSON.parse(saved); } catch(e) {}
      }
    }

    // Also check device-level key for this exam session
    const deviceKey = `device_${this.getExamSessionKey()}`;
    const savedDevice = localStorage.getItem(deviceKey);
    if (savedDevice) {
      try { return JSON.parse(savedDevice); } catch(e) {}
    }

    return null;
  },

  recordExamSubmission(submissionData) {
    const studentInfo = this.getStudentInfo();
    if (studentInfo.name) {
      const studentKey = this.getStudentExamKey(studentInfo.name);
      localStorage.setItem(studentKey, JSON.stringify(submissionData));
    }
    const deviceKey = `device_${this.getExamSessionKey()}`;
    localStorage.setItem(deviceKey, JSON.stringify(submissionData));
  },

  renderExamUpcomingScreen(container, validity, pointTitle) {
    if (this.examUpcomingInterval) {
      clearInterval(this.examUpcomingInterval);
      this.examUpcomingInterval = null;
    }

    const studentInfo = this.getStudentInfo();
    const lessonTitle = this.currentLesson ? (this.currentLesson.title || this.currentLesson.name || '') : '';

    container.innerHTML = `
      <div class="exam-schedule-card upcoming-card">
        <div class="schedule-icon-wrap upcoming">
          <span>⏳</span>
        </div>
        <div class="schedule-badge upcoming">⏳ ការប្រឡងមិនទាន់ចាប់ផ្តើមនៅឡើយទេ</div>
        <h2 class="schedule-title">${lessonTitle || 'ការប្រឡងវាស់ស្ទង់សមត្ថភាព'}</h2>
        <p class="schedule-subtitle">${pointTitle || 'កម្រងសំណួរវាស់ស្ទង់ស្តង់ដារ'}</p>

        <div class="schedule-meta-grid">
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">📅 កាលបរិច្ឆេទប្រឡង</span>
            <span class="schedule-meta-val">${this.formatKhmerDate(this.examDate)}</span>
          </div>
          ${this.examStartTime ? `
            <div class="schedule-meta-item">
              <span class="schedule-meta-label">⏰ ម៉ោងចាប់ផ្តើម</span>
              <span class="schedule-meta-val">${this.formatKhmerTimeDisplay(this.examStartTime)}</span>
            </div>
          ` : ''}
          ${this.examTimeLimit > 0 ? `
            <div class="schedule-meta-item">
              <span class="schedule-meta-label">⏱️ ថិរវេលាប្រឡង</span>
              <span class="schedule-meta-val">${this.examTimeLimit} នាទី</span>
            </div>
          ` : ''}
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">🏫 សម្រាប់បន្ទប់ / ថ្នាក់</span>
            <span class="schedule-meta-val">${studentInfo.classRoom || 'ថ្នាក់ទូទៅ'}</span>
          </div>
        </div>

        <div class="schedule-countdown-box">
          <div class="countdown-label">⏳ នឹងបើកឱ្យប្រឡងក្នុងរយៈពេល ៖</div>
          <div class="countdown-digits" id="upcoming-countdown-display">កំពុងគណនា...</div>
        </div>

        <div class="schedule-instruction-box">
          <div style="font-weight: 700; color: #38bdf8; margin-bottom: 6px;">💡 ការណែនាំសម្រាប់សិស្ស ៖</div>
          <div>សូមប្អូនៗរៀបចំខ្លួនឱ្យរួចរាល់! នៅពេលដល់ថ្ងៃ និងម៉ោងកំណត់ខាងលើ ប្រព័ន្ធនឹង <strong>បើកសន្លឹកប្រឡងស្វ័យប្រវត្ត</strong> ដោយមិនចាំបាច់ Refresh ទំព័រឡើយ។</div>
        </div>
      </div>
    `;

    const updateCountdown = () => {
      const displayEl = document.getElementById('upcoming-countdown-display');
      if (!displayEl) return;

      const now = new Date();
      const targetTimeStr = this.examStartTime ? `${this.examDate}T${this.examStartTime}:00` : `${this.examDate}T00:00:00`;
      const diffMs = new Date(targetTimeStr).getTime() - now.getTime();

      if (diffMs <= 0) {
        clearInterval(this.examUpcomingInterval);
        this.examUpcomingInterval = null;
        displayEl.textContent = 'ដល់ម៉ោងប្រឡងហើយ!';
        this.showToast('🔔 ដល់ម៉ោងប្រឡងហើយ! ប្រព័ន្ធកំពុងបើកសន្លឹកប្រឡងជូន...', 'success');
        setTimeout(() => {
          this.renderQuizTab();
        }, 1200);
        return;
      }

      const totalSec = Math.floor(diffMs / 1000);
      const days = Math.floor(totalSec / 86400);
      const hours = Math.floor((totalSec % 86400) / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;

      let parts = [];
      if (days > 0) parts.push(`${this.toKhmerNum(days)} ថ្ងៃ`);
      if (hours > 0 || days > 0) parts.push(`${this.toKhmerNum(hours)} ម៉ោង`);
      parts.push(`${this.toKhmerNum(mins)} នាទី`);
      parts.push(`${this.toKhmerNum(secs)} វិនាទី`);

      displayEl.textContent = parts.join(' ');
    };

    updateCountdown();
    this.examUpcomingInterval = setInterval(updateCountdown, 1000);
  },

  renderExamExpiredScreen(container, validity, pointTitle) {
    if (this.examUpcomingInterval) {
      clearInterval(this.examUpcomingInterval);
      this.examUpcomingInterval = null;
    }

    const studentInfo = this.getStudentInfo();
    const lessonTitle = this.currentLesson ? (this.currentLesson.title || this.currentLesson.name || '') : '';

    container.innerHTML = `
      <div class="exam-schedule-card expired-card">
        <div class="schedule-icon-wrap expired">
          <span>🔒</span>
        </div>
        <div class="schedule-badge expired">🔒 ការប្រឡងត្រូវបានបិទបញ្ចប់ (Exam Closed)</div>
        <h2 class="schedule-title">${lessonTitle || 'ការប្រឡងវាស់ស្ទង់សមត្ថភាព'}</h2>
        <p class="schedule-subtitle">${pointTitle || 'កម្រងសំណួរវាស់ស្ទង់ស្តង់ដារ'}</p>

        <div class="schedule-meta-grid">
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">📅 កាលបរិច្ឆេទប្រឡង</span>
            <span class="schedule-meta-val">${this.formatKhmerDate(this.examDate)}</span>
          </div>
          ${this.examEndTime ? `
            <div class="schedule-meta-item">
              <span class="schedule-meta-label">⏰ ម៉ោងបិទទទួល</span>
              <span class="schedule-meta-val">${this.formatKhmerTimeDisplay(this.examEndTime)}</span>
            </div>
          ` : ''}
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">🏫 សម្រាប់បន្ទប់ / ថ្នាក់</span>
            <span class="schedule-meta-val">${studentInfo.classRoom || 'ថ្នាក់ទូទៅ'}</span>
          </div>
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">📊 ស្ថានភាព</span>
            <span class="schedule-meta-val" style="color: #ef4444; font-weight: 700;">ផុតសុពលភាព (Closed)</span>
          </div>
        </div>

        <div class="schedule-expired-alert">
          <span style="font-size: 1.4rem;">⚠️</span>
          <div>
            <strong>ការប្រឡងនេះបានផុតកំណត់កាលបរិច្ឆេទហើយ!</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.88rem; color: var(--text-secondary); line-height: 1.6;">
              ដើម្បីធានាតម្លាភាព និងការពារសិស្សប្រឡងលើសពី ១ ដង ឬចូលប្រឡងនៅថ្ងៃក្រោយ ប្រព័ន្ធបានបិទការទទួលស្វ័យប្រវត្ត។ ប្រសិនបើប្អូនមានបញ្ហាចាំបាច់ សូមទាក់ទងលោកគ្រូបង្រៀនផ្ទាល់។
            </p>
          </div>
        </div>
      </div>
    `;
  },

  renderExamAlreadySubmittedScreen(container, record, pointTitle) {
    if (this.examUpcomingInterval) {
      clearInterval(this.examUpcomingInterval);
      this.examUpcomingInterval = null;
    }

    const studentInfo = this.getStudentInfo();
    const candidateName = record.studentName || studentInfo.name || 'បេក្ខជន';
    const candidateClass = record.classRoom || studentInfo.classRoom || 'ទូទៅ';
    const candidateRoll = record.rollNo || studentInfo.rollNo || '';
    const lessonTitle = this.currentLesson ? (this.currentLesson.title || this.currentLesson.name || '') : '';

    container.innerHTML = `
      <div class="exam-schedule-card submitted-card">
        <div class="schedule-icon-wrap submitted">
          <span>🛡️</span>
        </div>
        <div class="schedule-badge submitted">✓ បានប្រឡង និងបញ្ជូនពិន្ទុរួចរាល់ (Locked)</div>
        <h2 class="schedule-title">${lessonTitle || 'ការប្រឡងវាស់ស្ទង់សមត្ថភាព'}</h2>
        <p class="schedule-subtitle">${pointTitle || 'កម្រងសំណួរវាស់ស្ទង់ស្តង់ដារ'}</p>

        <!-- Candidate Score Box -->
        <div class="submitted-score-box">
          <div class="submitted-score-num">${record.score} / ${record.totalQ}</div>
          <div class="submitted-score-pct">${record.percentage}</div>
          <div class="submitted-score-badge">✓ ពិន្ទុត្រូវបានបញ្ជូនចូលតារាងលោកគ្រូរួចរាល់</div>
        </div>

        <div class="schedule-meta-grid">
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">👨‍🎓 បេក្ខជនប្រឡង</span>
            <span class="schedule-meta-val"><strong>${candidateName}</strong></span>
          </div>
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">🏫 បន្ទប់ / ថ្នាក់</span>
            <span class="schedule-meta-val">ថ្នាក់ <strong>${candidateClass}</strong> ${candidateRoll ? `(លេខ #${candidateRoll})` : ''}</span>
          </div>
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">⏱️ ពេលប្រឡង</span>
            <span class="schedule-meta-val">${record.submittedDateStr || ''}</span>
          </div>
          <div class="schedule-meta-item">
            <span class="schedule-meta-label">🔒 សិទ្ធិប្រឡង</span>
            <span class="schedule-meta-val" style="color: #10b981; font-weight: 700;">បានប្រើប្រាស់រួច (១ លើកគត់)</span>
          </div>
        </div>

        <div class="schedule-lock-alert">
          <span style="font-size: 1.3rem;">ℹ️</span>
          <div>
            <strong>ការប្រឡងនេះត្រូវបានកំណត់ឱ្យធ្វើបានតែ ១ លើកគត់ (Single Attempt Only)</strong>
            <p style="margin: 4px 0 0 0; font-size: 0.88rem; color: var(--text-secondary);">
              ពិន្ទុរបស់ប្អូនត្រូវបានកត់ត្រា និងបញ្ជូនទៅលោកគ្រូរួចរាល់។ ប្រព័ន្ធការពារការប្រឡងឡើងវិញ ដើម្បីធានាតម្លាភាព និងយុត្តិធម៌សម្រាប់សិស្សទាំងអស់។
            </p>
          </div>
        </div>

        <div style="margin-top: 20px; text-align: center;">
          <button class="btn btn-outline" onclick="App.toggleSubmittedAnswersReview()" id="btn-toggle-review" style="padding: 10px 22px; font-weight: 600; font-size: 0.95rem;">
            👁️ ពិនិត្យមើលចម្លើយ & ការពន្យល់របស់លោកគ្រូ (Read-Only)
          </button>
        </div>

        <div id="submitted-answers-review-box" style="display: none; margin-top: 24px;"></div>
      </div>
    `;

    this.renderMath(container);
  },

  toggleSubmittedAnswersReview() {
    const box = document.getElementById('submitted-answers-review-box');
    const btn = document.getElementById('btn-toggle-review');
    if (!box) return;

    if (box.style.display === 'block') {
      box.style.display = 'none';
      if (btn) btn.innerHTML = '👁️ ពិនិត្យមើលចម្លើយ & ការពន្យល់របស់លោកគ្រូ (Read-Only)';
      return;
    }

    const quizList = this.currentActiveQuizList || this.currentLesson?.quiz || [];
    const totalQ = quizList.length;
    const record = this.getPreviousExamSubmission();
    const answered = record?.answeredQuiz || {};

    box.style.display = 'block';
    if (btn) btn.innerHTML = '✕ បិទការផ្ទៀងផ្ទាត់ចម្លើយ';

    box.innerHTML = `
      <div style="font-weight: 700; color: #38bdf8; margin-bottom: 14px; font-size: 1rem; border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;">
        📝 ពិនិត្យផ្ទៀងផ្ទាត់ចម្លើយដែលប្អូនបានជ្រើសរើស (ទម្រង់អានប៉ុណ្ណោះ មិនអាចកែបានឡើយ) ៖
      </div>
      <div class="quiz-questions-list">
        ${quizList.map((q, qIndex) => {
          const studentAns = answered[qIndex];
          const isAnswered = studentAns !== undefined;
          const correctIdx = (q.correct !== undefined) ? q.correct : q.correctAnswer;
          const isCorrect = isAnswered && studentAns === correctIdx;
          return `
            <div class="quiz-card read-only-card" style="opacity: 0.95;">
              <div class="quiz-card-header">
                <div class="quiz-q-pill">
                  <span class="q-pill-dot"></span>
                  <span class="q-pill-text">សំណួរទី ${qIndex + 1} នៃ ${totalQ}</span>
                </div>
                <span class="quiz-status-pill ${isCorrect ? 'correct' : (isAnswered ? 'wrong' : '')}">
                  ${isCorrect ? '✓ ត្រឹមត្រូវ' : (isAnswered ? '✗ មិនត្រឹមត្រូវ' : 'មិនបានឆ្លើយ')}
                </span>
              </div>
              <div class="quiz-question-box">
                <h4 class="quiz-question">${this.formatQuestionText(q.question)}</h4>
              </div>
              <div class="quiz-options ${this.isSingleColumnOptions(q.options) ? 'options-stack' : 'options-grid'}">
                ${q.options.map((opt, optIndex) => {
                  let optClass = '';
                  if (optIndex === correctIdx) optClass = 'correct';
                  else if (studentAns === optIndex) optClass = 'wrong';
                  return `
                    <div class="quiz-opt ${optClass}" style="pointer-events: none; cursor: default;">
                      <div class="opt-badge">${String.fromCharCode(65 + optIndex)}</div>
                      <div class="opt-content">${opt}</div>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="quiz-explanation" style="display: block;">
                <div class="exp-header">
                  <span class="exp-icon">👨‍🏫</span>
                  <span class="exp-title">ការពន្យល់លម្អិតពីលោកគ្រូ ៖</span>
                </div>
                <div class="exp-body">
                  ${this.formatExplanationText(q.explanation)}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    this.renderMath(box);
  },

  formatLessonTitleHeader(title) {
    if (!title) return '';
    // Look for (ទំព័រ ...) or (ទំព័រ ... - ...)
    const match = String(title).match(/^(.*?)\s*(\(ទំព័រ\s*[^)]+\))\s*$/);
    if (match) {
      const mainTitle = match[1].trim();
      // Replace regular spaces inside (ទំព័រ ...) with non-breaking spaces so it never wraps or splits
      // and ensure clean en-dash for page range
      const pageTag = match[2].trim()
        .replace(/\s+/g, '\u00A0')
        .replace(/-(?!\u00A0)/g, '–\u00A0')
        .replace(/-/g, '–');
      return `<span class="ws-header-lesson-title">${mainTitle}</span> <span class="ws-header-page-tag">${pageTag}</span>`;
    }
    return `<span class="ws-header-lesson-title">${title}</span>`;
  },

  formatSummary(rawText) {
    if (!rawText) return '';
    let s = String(rawText).trim();

    // Step 1: Protect math blocks ($$...$$ and $...$)
    const mathBlocks = [];
    const saveMath = (match) => {
      const idx = mathBlocks.length;
      mathBlocks.push(match);
      return `___MATH_TOKEN_${idx}___`;
    };

    // Protect display math first, then inline math
    s = s.replace(/\$\$[\s\S]*?\$\$/g, saveMath);
    s = s.replace(/\$[^\$\n]+?\$/g, saveMath);

    // Normalize line endings
    s = s.replace(/\r\n/g, '\n');

    // If display math was immediately followed by a bullet without a newline, add a newline
    s = s.replace(/(___MATH_TOKEN_\d+___)\s*([•\-\*])/g, '$1\n$2');

    // Replace HTML line breaks with bullets into standard newlines with bullets
    s = s.replace(/<br\s*\/?>\s*([•\-\*])\s*/gi, '\n- ');
    s = s.replace(/<br\s*\/?>/gi, '\n');

    // Convert markdown headers: ### Title or ## Title
    s = s.replace(/^(#{2,4})\s+(.+)$/gm, (match, hashes, title) => {
      return `\n\n___SECTION_TITLE___${title.trim()}___END_SECTION___\n\n`;
    });

    // Detect numbered bold titles in HTML or markdown like:
    // <strong>១. សញ្ញាណ និងនិយមន័យ ៖</strong> or **១. ...**
    s = s.replace(/<strong>\s*([១២៣៤៥៦៧៨៩០\d]+\.\s*[^<]+?)\s*<\/strong>/gi, (m, title) => {
      return `\n\n___SECTION_TITLE___${title.trim()}___END_SECTION___\n\n`;
    });
    s = s.replace(/\*\*\s*([១២៣៤៥៦៧៨៩០\d]+\.\s*[^\*]+?)\s*\*\*/g, (m, title) => {
      return `\n\n___SECTION_TITLE___${title.trim()}___END_SECTION___\n\n`;
    });

    // Convert remaining **text** to <strong>text</strong>
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Split into lines and process blocks
    const lines = s.split('\n');
    const outputParts = [];
    let inList = false;

    const closeList = () => {
      if (inList) {
        outputParts.push('</ul>');
        inList = false;
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const stripped = rawLine.trim();
      if (!stripped) continue;

      // Check for section title marker
      const secMatch = stripped.match(/___SECTION_TITLE___([\s\S]+?)___END_SECTION___/);
      if (secMatch) {
        closeList();
        outputParts.push(`<div class="ws-sum-section-title">${secMatch[1].trim()}</div>`);
        continue;
      }

      // Check for bullet item: starting with -, *, •
      const isSubItem = /^\s{2,}[-*•]\s+/.test(rawLine);
      const bulletMatch = stripped.match(/^[-*•]\s+([\s\S]+)$/);
      if (bulletMatch) {
        const itemContent = bulletMatch[1].trim();
        if (!inList) {
          outputParts.push('<ul class="ws-sum-list">');
          inList = true;
        }
        const itemClass = isSubItem ? 'ws-sum-item ws-sum-subitem' : 'ws-sum-item';
        outputParts.push(`  <li class="${itemClass}">${itemContent}</li>`);
        continue;
      }

      // Check if line is just a display math token
      if (/^___MATH_TOKEN_\d+___$/.test(stripped)) {
        closeList();
        outputParts.push(`<div class="ws-sum-formula">${stripped}</div>`);
        continue;
      }

      // Regular text / paragraph
      closeList();
      if (stripped.startsWith('<p') || stripped.startsWith('<div')) {
        outputParts.push(stripped);
      } else {
        outputParts.push(`<div class="ws-sum-text">${stripped}</div>`);
      }
    }

    closeList();

    let html = outputParts.join('\n');

    // Restore math tokens
    for (let idx = 0; idx < mathBlocks.length; idx++) {
      html = html.split(`___MATH_TOKEN_${idx}___`).join(mathBlocks[idx]);
    }

    return html;
  },

  checkQuizAnswer(qIndex, selectedOptIndex, element) {
    const quizList = this.currentActiveQuizList || this.currentLesson?.quiz || [];
    const quiz = quizList[qIndex];
    if (!quiz || this.answeredQuiz[qIndex]) return;

    this.answeredQuiz[qIndex] = true;
    this.quizUserAnswers = this.quizUserAnswers || {};
    this.quizUserAnswers[qIndex] = selectedOptIndex;
    const card = element.closest('.quiz-card');
    const allOptions = card.querySelectorAll('.quiz-opt');
    const expBox = document.getElementById(`quiz-exp-${qIndex}`);
    const statusPill = document.getElementById(`quiz-status-${qIndex}`);

    allOptions.forEach(opt => opt.style.pointerEvents = 'none');

    const totalQ = quizList.length;

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
      if (allOptions[quiz.correct]) {
        allOptions[quiz.correct].classList.add('correct');
      }
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

    // Check if all questions are answered
    if (Object.keys(this.answeredQuiz).length === totalQ) {
      if (this.examTimerInterval) {
        clearInterval(this.examTimerInterval);
        this.examTimerInterval = null;
      }
      const sessionKey = `timed_exam_${this.currentLesson?.id || 'quiz'}`;
      sessionStorage.removeItem(sessionKey);
      this.showQuizCompletionBanner(totalQ);
    }
  },

  showQuizCompletionBanner(totalQ) {
    let completionCard = document.getElementById('quiz-completion-card');
    if (!completionCard) {
      const qContainer = document.getElementById('quiz-container');
      if (!qContainer) return;
      completionCard = document.createElement('div');
      completionCard.id = 'quiz-completion-card';
      completionCard.className = 'quiz-completion-card';
      qContainer.appendChild(completionCard);
    }

    const studentInfo = this.getStudentInfo();
    const pct = Math.round((this.quizScore / totalQ) * 100);
    let evalText = 'ល្អប្រសើរ (ឆ្នើម) 🌟';
    let evalClass = 'eval-excellent';
    if (pct < 50) {
      evalText = 'ត្រូវព្យាយាមបន្ថែមទៀត 💪';
      evalClass = 'eval-needs-work';
    } else if (pct < 65) {
      evalText = 'មធ្យម (អាចធ្វើបានល្អជាងនេះ) 👍';
      evalClass = 'eval-average';
    } else if (pct < 80) {
      evalText = 'ល្អបង្គួរ 👏';
      evalClass = 'eval-good';
    } else if (pct < 90) {
      evalText = 'ល្អណាស់ 🎉';
      evalClass = 'eval-very-good';
    }

    completionCard.innerHTML = `
      <div class="completion-inner">
        <div class="completion-header">
          <div class="completion-trophy">🏆</div>
          <div class="completion-title-col">
            <h3 class="completion-title">លទ្ធផលនៃការធ្វើតេស្តសរុប</h3>
            <p class="completion-sub">${this.examFinishedByTimeout ? '⏰ ការប្រឡងត្រូវបានបញ្ចប់ដោយសារអស់ថិរវេលាកំណត់!' : `អ្នកបានឆ្លើយចប់សព្វគ្រប់ទាំង ${totalQ} សំណួរ!`}</p>
          </div>
          <div class="completion-score-badge ${evalClass}">
            <span class="comp-score-num">${this.quizScore} / ${totalQ}</span>
            <span class="comp-score-pct">${pct}%</span>
          </div>
        </div>

        ${this.examFinishedByTimeout ? `
          <div style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.4); border-radius: 10px; padding: 10px 14px; color: #ef4444; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 8px;">
            <span>⏰</span>
            <span>អស់ថិរវេលាប្រឡង (${this.examTimeLimit} នាទី)! ប្រព័ន្ធបានកត់ត្រាពិន្ទុដែលឆ្លើយបានរួចរាល់។</span>
          </div>
        ` : ''}

        <div class="completion-eval-row">
          <div class="eval-pill ${evalClass}">
            <span>ការវាយតម្លៃ ៖ <strong>${evalText}</strong></span>
          </div>
          ${(!this.isExamMode && !this.examDate) ? `
            <button class="quiz-retake-btn" onclick="App.retakeQuiz()">
              🔄 ធ្វើតេស្តឡើងវិញ
            </button>
          ` : `
            <div style="font-size: 0.85rem; color: #10b981; font-weight: 700; display: inline-flex; align-items: center; gap: 6px; background: rgba(16, 185, 129, 0.12); padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(16, 185, 129, 0.3);">
              <span>🔒 បានប្រឡង និងចាក់សោស្វ័យប្រវត្ត (១ លើកគត់)</span>
            </div>
          `}
        </div>

        <!-- Student Identification Info -->
        <div class="completion-student-strip">
          <div class="comp-student-meta">
            ${studentInfo.name ? `
              <span>👨‍🎓 សិស្ស ៖ <strong>${studentInfo.name}</strong></span>
              <span>🏫 ថ្នាក់ ៖ <strong>${studentInfo.classRoom || ('ទី ' + studentInfo.grade)}</strong></span>
              ${studentInfo.rollNo ? `<span>🔢 លេខ ៖ <strong>#${studentInfo.rollNo}</strong></span>` : ''}
            ` : `
              <span style="color:#ef4444; font-weight:600;">⚠️ មិនទាន់មានឈ្មោះ និងថ្នាក់ទេ! សូមចុច [បំពេញឈ្មោះ]</span>
            `}
          </div>
          ${(!this.isExamMode && !this.examDate) ? `
            <button class="btn btn-sm btn-outline" onclick="App.openStudentInfoModal()" style="font-size:0.8rem;">
              ✏️ ${studentInfo.name ? 'កែប្រែឈ្មោះ/ថ្នាក់' : 'បំពេញឈ្មោះ និងថ្នាក់'}
            </button>
          ` : ''}
        </div>

        <!-- Submission Status Box -->
        <div id="quiz-submission-status" style="margin-top: 12px;"></div>
      </div>
    `;

    completionCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    this.submitCompletedQuiz();
  },

  async submitCompletedQuiz() {
    const studentInfo = this.getStudentInfo();
    const quizList = this.currentActiveQuizList || [];
    const totalQ = quizList.length;
    if (totalQ === 0) return;

    const score = this.quizScore;
    const pctNum = Math.round((score / totalQ) * 100);
    const percentage = `${pctNum}%`;

    const statusCard = document.getElementById('quiz-submission-status');

    if (!studentInfo.name || !studentInfo.classRoom) {
      if (statusCard) {
        statusCard.innerHTML = `
          <div style="background: rgba(245, 158, 11, 0.12); border: 1px solid rgba(245, 158, 11, 0.35); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 0.85rem; color: #f59e0b;">
              ⚠️ ដើម្បីឱ្យពិន្ទុនេះត្រូវបានកត់ត្រាក្នុងតារាង Excel របស់លោកគ្រូ សូមចុច [បំពេញឈ្មោះ & ថ្នាក់]
            </div>
            <button class="btn btn-primary" onclick="App.openStudentInfoModal()" style="font-size: 0.8rem; padding: 6px 14px;">
              📝 បំពេញឈ្មោះ & ថ្នាក់
            </button>
          </div>
        `;
      }
      this.showToast('សូមបំពេញឈ្មោះ និងថ្នាក់របស់អ្នក ដើម្បីបញ្ជូនពិន្ទុ!', 'warning');
      setTimeout(() => {
        this.openStudentInfoModal();
      }, 400);
      return;
    }

    if (statusCard) {
      statusCard.innerHTML = `
        <div style="display:flex; align-items:center; gap:10px; color:#38bdf8; padding: 8px 0;">
          <span style="display:inline-block; width:16px; height:16px; border:2px solid #38bdf8; border-top-color:transparent; border-radius:50%; animation:spin 0.8s linear infinite;"></span>
          <span style="font-size: 0.86rem;">កំពុងបញ្ជូនពិន្ទុទៅកាន់តារាង Excel ថ្នាក់ <strong>${studentInfo.classRoom}</strong>...</span>
        </div>
      `;
    }

    const lessonTitle = this.currentLesson ? (this.currentLesson.title || this.currentLesson.name || '') : '';
    let pointTitle = 'គ្រប់ចំណុចចម្រុះ';
    if (this.activeQuizPoint > 0) {
      pointTitle = `ចំណុចទី ${this.activeQuizPoint}`;
    }
    if (this.examFinishedByTimeout) {
      pointTitle += ` [⏰ អស់ម៉ោង ${this.examTimeLimit}mn]`;
    } else if (this.examTimeLimit > 0) {
      pointTitle += ` [⏱️ ${this.examTimeLimit}mn]`;
    }

    const now = new Date();
    const dateFormatted = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

    const payload = {
      timestamp: dateFormatted,
      studentName: studentInfo.name,
      studentClass: studentInfo.classRoom,
      rollNumber: studentInfo.rollNo || '-',
      grade: studentInfo.grade || (this.currentLesson?.grade || '10'),
      lessonTitle: lessonTitle,
      pointTitle: pointTitle,
      score: score,
      total: totalQ,
      percentage: percentage
    };

    // Save to local student history
    try {
      const history = JSON.parse(localStorage.getItem('worksheet_student_history') || '[]');
      history.unshift(payload);
      if (history.length > 50) history.pop();
      localStorage.setItem('worksheet_student_history', JSON.stringify(history));
    } catch(e) {}

    // Record Exam Submission for anti-cheating & lock
    if (this.isExamMode || this.examDate) {
      this.recordExamSubmission({
        studentName: studentInfo.name,
        classRoom: studentInfo.classRoom,
        rollNo: studentInfo.rollNo || '-',
        score: score,
        totalQ: totalQ,
        total: totalQ,
        percentage: percentage,
        submittedDateStr: payload.timestamp,
        submittedAt: payload.timestamp,
        answeredQuiz: this.quizUserAnswers || {},
        answers: this.quizUserAnswers || {}
      });
    }

    const sheetUrl = this.getTeacherSheetUrl();
    if (sheetUrl) {
      try {
        // Micro-jitter to spread concurrent requests smoothly
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 800)));
        await fetch(sheetUrl, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(payload)
        });
        if (statusCard) {
          statusCard.innerHTML = `
            <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 10px; padding: 12px 16px; color: #10b981; font-weight: 600; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span>✅</span>
                <span>បានបញ្ជូនពិន្ទុចូលក្នុងសន្លឹកថ្នាក់ <strong>«${studentInfo.classRoom}»</strong> របស់លោកគ្រូរួចរាល់!</span>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-size: 0.76rem; opacity: 0.85;">${payload.timestamp}</span>
                <button type="button" class="btn btn-sm" onclick="App.resendCompletedQuiz()" style="background: rgba(16, 185, 129, 0.25); color: #10b981; border: 1px solid rgba(16, 185, 129, 0.5); font-size: 0.76rem; padding: 4px 10px; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;" title="ចុចដើម្បីបញ្ជូនពិន្ទុទៅកាន់ Google Sheets ម្តងទៀត">
                  🔄 ផ្ញើម្តងទៀត
                </button>
              </div>
            </div>
          `;
        }
        this.showToast(`✅ ពិន្ទុរបស់អ្នក (${score}/${totalQ}) ត្រូវបានបញ្ជូនចូលក្នុងតារាងថ្នាក់ ${studentInfo.classRoom} រួចរាល់!`, 'success');
      } catch (err) {
        if (statusCard) {
          statusCard.innerHTML = `
            <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 10px; padding: 10px 14px; color: #f59e0b; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
              <div>⚠️ មិនទាន់អាចបញ្ជូនទៅកាន់ Sheets បានទេ ប៉ុន្តែបានរក្សាទុកក្នុងទូរស័ព្ទរួចរាល់!</div>
              <button type="button" class="btn btn-sm btn-primary" onclick="App.resendCompletedQuiz()" style="font-size: 0.76rem; padding: 5px 12px;">
                🔄 សាកល្បងផ្ញើម្តងទៀត
              </button>
            </div>
          `;
        }
      }
    } else {
      if (statusCard) {
        statusCard.innerHTML = `
          <div style="background: var(--bg-tertiary); border: 1px solid var(--border-glass); border-radius: 10px; padding: 12px 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div style="font-size: 0.85rem; color: var(--text-secondary);">
              💾 បានរក្សាទុកក្នុងឧបករណ៍នេះរួចរាល់ (ពិន្ទុ <strong>${score}/${totalQ}</strong>)
            </div>
            <button class="btn btn-outline" onclick="App.openTeacherSheetModal()" style="font-size: 0.78rem; padding: 5px 12px;">
              📊 ភ្ជាប់ Google Sheets សម្រាប់គ្រូ
            </button>
          </div>
        `;
      }
    }
  },

  async resendCompletedQuiz() {
    this.showToast('⏳ កំពុងព្យាយាមផ្ញើពិន្ទុទៅកាន់ Google Sheets ម្តងទៀត...', 'info');
    await this.submitCompletedQuiz();
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

  // Web LMS Access & Sharing Modal
  openWebShareModal() {
    const modal = document.getElementById('mobile-modal');
    const linkEl = document.getElementById('mobile-ip-link');
    if (linkEl && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      linkEl.textContent = window.location.origin;
    }
    if (modal) modal.classList.add('active');
  },

  closeWebShareModal() {
    const modal = document.getElementById('mobile-modal');
    if (modal) modal.classList.remove('active');
  },

  openMobileModal() {
    this.openWebShareModal();
  },

  closeMobileModal() {
    this.closeWebShareModal();
  },

  copyLink(url) {
    const link = url || window.location.origin;
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

  copyAppsScriptCode() {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(this.appsScriptSourceCode).then(() => {
        this.showToast('✅ បានចម្លងកូដ Google Apps Script រួចរាល់! អាចបិទភ្ជាប់ក្នុង Extensions > Apps Script បានភ្លាមៗ', 'success');
      }).catch(() => {
        this.copyLinkFallback(this.appsScriptSourceCode);
      });
    } else {
      this.copyLinkFallback(this.appsScriptSourceCode);
    }
  },

  copyLinkFallback(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      this.showToast('✅ បានចម្លងកូដរួចរាល់!', 'success');
    } catch(e) {
      this.showToast('សូមចម្លងកូដដោយផ្ទាល់', 'info');
    }
    ta.remove();
  },

  getStudentInfo() {
    try {
      const raw = localStorage.getItem('worksheet_student_info');
      if (raw) return JSON.parse(raw);
    } catch(e) {}
    return {
      name: '',
      grade: this.currentGrade !== 'all' ? this.currentGrade : '10',
      classRoom: '',
      rollNo: ''
    };
  },

  saveStudentInfo(info) {
    try {
      localStorage.setItem('worksheet_student_info', JSON.stringify(info));
    } catch(e) {}
  },

  defaultTeacherSheetUrl: 'https://script.google.com/macros/s/AKfycbxtsUQk52-Jh_k7VLgVFl66BvT9C2pn44--tZG6CgfRIAHN7Igw8wYrQ6uDbn-4B8uF/exec',

  getTeacherSheetUrl() {
    const stored = localStorage.getItem('worksheet_teacher_sheet_url');
    if (stored && stored.includes('AKfycbwzTi8_Z9aX1oo421kG7XLiEwxXRAk-28-uQWhSjzBgrTzSTH0PSb0qJvcEenwpUOLvKA')) {
      this.setTeacherSheetUrl(this.defaultTeacherSheetUrl);
      return this.defaultTeacherSheetUrl;
    }
    return stored || this.defaultTeacherSheetUrl || '';
  },

  setTeacherSheetUrl(url) {
    if (url) {
      localStorage.setItem('worksheet_teacher_sheet_url', url.trim());
    } else {
      localStorage.removeItem('worksheet_teacher_sheet_url');
    }
  },

  openStudentInfoModal() {
    const info = this.getStudentInfo();
    const nameInp = document.getElementById('student-name-input');
    const gradeSel = document.getElementById('student-grade-select');
    const classInp = document.getElementById('student-class-input');
    const rollInp = document.getElementById('student-roll-input');
    
    if (nameInp) nameInp.value = info.name || '';
    if (gradeSel) gradeSel.value = info.grade || (this.currentGrade !== 'all' ? this.currentGrade : '10');
    if (classInp) classInp.value = info.classRoom || '';
    if (rollInp) rollInp.value = info.rollNo || '';

    const modal = document.getElementById('student-info-modal');
    if (modal) modal.classList.add('active');
    setTimeout(() => {
      if (!info.name) nameInp?.focus();
      else if (!info.classRoom) classInp?.focus();
    }, 200);
  },

  closeStudentInfoModal() {
    const modal = document.getElementById('student-info-modal');
    if (modal) modal.classList.remove('active');
  },

  saveStudentInfoForm(e) {
    if (e) e.preventDefault();
    const name = document.getElementById('student-name-input')?.value.trim() || '';
    const grade = document.getElementById('student-grade-select')?.value || '10';
    const classRoom = (document.getElementById('student-class-input')?.value.trim() || '').toUpperCase();
    const rollNo = document.getElementById('student-roll-input')?.value.trim() || '';

    if (!name) {
      this.showToast('សូមបញ្ចូលឈ្មោះសិស្ស!', 'warning');
      return;
    }
    if (!classRoom) {
      this.showToast('សូមបញ្ចូលបន្ទប់/ថ្នាក់ជាក់លាក់ (ឧ. 10A1, 10A2...)!', 'warning');
      return;
    }

    const info = { name, grade, classRoom, rollNo };
    this.saveStudentInfo(info);
    this.closeStudentInfoModal();
    this.showToast(`បានរក្សាទុកព័ត៌មានសិស្ស ៖ ${name} (${classRoom}) រួចរាល់! 🎉`, 'success');
    
    // Re-render quiz tab if active so badge updates
    const quizContainer = document.getElementById('quiz-container');
    if (quizContainer) {
      this.renderQuizTab();
      const quizList = this.currentActiveQuizList || [];
      if (quizList.length > 0 && Object.keys(this.answeredQuiz).length === quizList.length) {
        this.submitCompletedQuiz();
      }
    }
  },

  async handleUrlDirectExamRouting() {
    const urlParams = new URLSearchParams(window.location.search);
    const classParam = (urlParams.get('class') || urlParams.get('room') || '').trim();
    let courseParam = urlParams.get('course') || urlParams.get('courseId');
    let lessonParam = urlParams.get('lesson') || urlParams.get('lessonId');
    const tabParam = urlParams.get('tab') || (classParam ? 'quiz' : '');
    const pointParam = parseInt(urlParams.get('point') || '0', 10);
    const timeParam = parseInt(urlParams.get('time') || urlParams.get('duration') || '0', 10);
    const testMode = urlParams.get('test');
    let gradeParam = urlParams.get('grade');

    const examParam = urlParams.get('exam') || urlParams.get('mode');
    const isExam = examParam === '1' || examParam === 'true' || examParam === 'exam' || !!classParam || timeParam > 0 || !!urlParams.get('date') || !!urlParams.get('examDate');
    if (isExam) {
      this.isExamMode = true;
      document.body.classList.add('exam-mode-active');
    }

    if (timeParam > 0) {
      this.examTimeLimit = timeParam;
    }

    if (testMode === 'diagnostic') {
      this.openDiagnosticModal();
      return;
    }

    // Auto-detect grade if given in class name (e.g. 12B -> 12, 10A1 -> 10, 7A -> 7)
    if (classParam) {
      const match = classParam.match(/^(12|11|10|9|8|7)/);
      if (match) {
        gradeParam = match[1];
        this.currentGrade = gradeParam;
      }
      const studentInfo = this.getStudentInfo();
      if (!studentInfo.classRoom || studentInfo.classRoom !== classParam) {
        studentInfo.classRoom = classParam;
        this.saveStudentInfo(studentInfo);
      }
    }

    // If teacher shared a link that only had class (or grade) without course/lesson:
    if ((classParam || gradeParam) && (!courseParam || !lessonParam)) {
      const targetGrade = gradeParam || '10';
      const gradeCourses = this.courses.filter(c => {
        const cGrade = String(c.grade || '');
        return cGrade.includes(targetGrade) || (c.id && c.id.includes(`g${targetGrade}`));
      });

      if (gradeCourses.length > 0) {
        const targetCourse = gradeCourses[0];
        courseParam = targetCourse.id;
        for (const ch of targetCourse.chapters || []) {
          if (ch.lessons && ch.lessons.length > 0) {
            lessonParam = ch.lessons[0].id;
            break;
          }
        }
      }
    }

    if (courseParam && lessonParam) {
      this.openCourse(courseParam);
      this.selectLesson(lessonParam);
      if (pointParam > 0) {
        this.selectQuizPoint(pointParam);
      }
      if (tabParam === 'quiz' || classParam || this.isExamMode) {
        this.switchTab('quiz');
      }

      // Smooth scroll to the quiz
      setTimeout(() => {
        const qContainer = document.getElementById('quiz-container');
        if (qContainer) {
          qContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);

      // Check student profile
      const studentInfo = this.getStudentInfo();
      if (this.examTimeLimit > 0) {
        this.showToast(`⏱️ តេស្តកំណត់ពេល ${this.examTimeLimit} នាទីសម្រាប់ថ្នាក់ ${studentInfo.classRoom || classParam || ''}! សូមពិនិត្យព័ត៌មានរួចចុច «ចាប់ផ្តើម» 🎯`, 'info');
      } else if (!studentInfo.name) {
        setTimeout(() => {
          this.openStudentInfoModal();
          this.showToast(`សួស្តីប្អូនៗ! សូមបញ្ចូលឈ្មោះដើម្បីចាប់ផ្តើមធ្វើតេស្តថ្នាក់ ${studentInfo.classRoom || classParam} 🎯`, 'info');
        }, 600);
      } else {
        this.showToast(`ស្វាគមន៍ ${studentInfo.name} មកកាន់ការធ្វើតេស្តថ្នាក់ ${studentInfo.classRoom || classParam} 🎯`, 'success');
      }
    } else if (gradeParam && gradeParam !== 'all') {
      this.currentGrade = gradeParam;
      this.filterByGrade(gradeParam);
    }
  },

  populateGeneratorLessons() {
    const gradeSelect = document.getElementById('generator-grade-select');
    const lessonSelect = document.getElementById('generator-lesson-select');
    if (!gradeSelect || !lessonSelect) return;

    const grade = gradeSelect.value;
    const courses = this.courses.filter(c => {
      const gStr = String(c.grade || '');
      return gStr.includes(grade) || (c.id && c.id.includes(`g${grade}`));
    });

    let optionsHtml = '';
    // If currently viewing a lesson from this grade, add as first option
    if (this.currentLesson && this.currentCourse) {
      const curCourseGrade = String(this.currentCourse.grade || '');
      if (curCourseGrade.includes(grade) || (this.currentCourse.id && this.currentCourse.id.includes(`g${grade}`))) {
        optionsHtml += `<option value="${this.currentCourse.id}:::${this.currentLesson.id}" selected>⭐ [មេរៀនកំពុងបើក] ${this.currentLesson.title}</option>`;
      }
    }

    courses.forEach(c => {
      (c.chapters || []).forEach(ch => {
        (ch.lessons || []).forEach(l => {
          if (this.currentLesson && this.currentLesson.id === l.id && optionsHtml.includes(l.id)) return;
          optionsHtml += `<option value="${c.id}:::${l.id}">${l.title}</option>`;
        });
      });
    });

    if (!optionsHtml) {
      optionsHtml = '<option value="">មិនទាន់មានមេរៀន</option>';
    }

    lessonSelect.innerHTML = optionsHtml;
    this.onGeneratorLessonChange();
  },

  onGeneratorClassInput() {
    const classInp = document.getElementById('generator-class-input');
    const gradeSelect = document.getElementById('generator-grade-select');
    if (!classInp || !gradeSelect) return;

    const val = classInp.value.trim();
    const match = val.match(/^(12|11|10|9|8|7)/);
    if (match) {
      gradeSelect.value = match[1];
      this.populateGeneratorLessons();
    }
    this.onGeneratorInputChange();
  },

  onGeneratorLessonChange() {
    const lessonSelect = document.getElementById('generator-lesson-select');
    const pointSelect = document.getElementById('generator-point-select');
    if (!lessonSelect || !pointSelect) return;

    const val = lessonSelect.value;
    if (!val || !val.includes(':::')) {
      pointSelect.innerHTML = '<option value="0">🌟 គ្រប់ចំណុចចម្រុះ (១០ សំណួរ)</option>';
      this.onGeneratorInputChange();
      return;
    }

    const [courseId, lessonId] = val.split(':::');
    const course = this.courses.find(c => c.id === courseId);
    let targetLesson = null;
    for (const ch of course?.chapters || []) {
      const l = ch.lessons?.find(x => x.id === lessonId);
      if (l) { targetLesson = l; break; }
    }

    const ws = (this.worksheets || this.worksheetsG11)?.[lessonId];
    const points = (ws && Array.isArray(ws.points) && ws.points.length > 0)
      ? ws.points
      : (targetLesson?.points || []);

    let ptsHtml = '<option value="0">🌟 គ្រប់ចំណុចចម្រុះ (១០ សំណួរពេញមេរៀន)</option>';
    if (points && points.length > 0) {
      points.forEach((p, idx) => {
        const pNum = p.pointNumber || p.number || (idx + 1);
        const rawTitle = p.pointTitle || p.title || `ចំណុចទី ${pNum}`;
        const cleanTitle = rawTitle.replace(/^ចំណុចទី\s*[\d១២៣៤៥៦៧៨៩០]+\s*[៖:]?\s*/, '');
        ptsHtml += `<option value="${pNum}">ចំណុចទី ${pNum} ៖ ${cleanTitle.slice(0, 32)}</option>`;
      });
    }
    pointSelect.innerHTML = ptsHtml;
    this.onGeneratorInputChange();
  },

  openTeacherSheetModal(preselectCurrent = false) {
    const urlInp = document.getElementById('teacher-sheet-url-input');
    const url = this.getTeacherSheetUrl();
    if (urlInp) urlInp.value = url;
    
    const statusBadge = document.getElementById('sheet-status-badge');
    if (statusBadge) {
      if (url) {
        statusBadge.textContent = '✓ បានកំណត់ URL រួចរាល់';
        statusBadge.style.color = '#10b981';
      } else {
        statusBadge.textContent = 'មិនទាន់កំណត់ URL';
        statusBadge.style.color = 'var(--text-muted)';
      }
    }

    const studentInfo = this.getStudentInfo();
    const genClassInp = document.getElementById('generator-class-input');
    if (genClassInp && studentInfo.classRoom) {
      genClassInp.value = studentInfo.classRoom;
    }

    const gradeSelect = document.getElementById('generator-grade-select');
    if (gradeSelect) {
      if (this.currentCourse) {
        const match = String(this.currentCourse.grade || this.currentCourse.id || '').match(/(12|11|10|9|8|7)/);
        if (match) gradeSelect.value = match[1];
      } else if (studentInfo.grade) {
        gradeSelect.value = studentInfo.grade;
      }
    }

    // Initialize exam date input to today if empty
    const dateInp = document.getElementById('generator-date-input');
    if (dateInp && !dateInp.value) {
      const now = new Date();
      const yyyy = now.getFullYear();
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      dateInp.value = `${yyyy}-${mm}-${dd}`;
    }

    this.onGeneratorWindowChange();
    this.populateGeneratorLessons();

    const modal = document.getElementById('teacher-sheet-modal');
    if (modal) modal.classList.add('active');

    if (genClassInp && genClassInp.value.trim()) {
      this.generateClassShareLink(true);
    }

    if (preselectCurrent) {
      setTimeout(() => {
        const genClassInp = document.getElementById('generator-class-input');
        genClassInp?.focus();
        genClassInp?.select();
      }, 200);
    }
  },

  onGeneratorWindowChange() {
    const winSelect = document.getElementById('generator-window-select');
    const customRow = document.getElementById('generator-custom-time-row');
    const dateInp = document.getElementById('generator-date-input');
    const dateGroup = document.getElementById('generator-date-group');
    const anytimeBadge = document.getElementById('generator-anytime-badge');
    if (!winSelect) return;

    if (winSelect.value === 'custom') {
      if (customRow) customRow.style.display = 'grid';
      if (dateInp) dateInp.disabled = false;
      if (dateGroup) dateGroup.style.opacity = '1';
      if (anytimeBadge) anytimeBadge.style.display = 'none';
    } else if (winSelect.value === 'anytime') {
      if (customRow) customRow.style.display = 'none';
      if (dateInp) dateInp.disabled = true;
      if (dateGroup) dateGroup.style.opacity = '0.5';
      if (anytimeBadge) anytimeBadge.style.display = 'block';
    } else {
      if (customRow) customRow.style.display = 'none';
      if (dateInp) dateInp.disabled = false;
      if (dateGroup) dateGroup.style.opacity = '1';
      if (anytimeBadge) anytimeBadge.style.display = 'none';
    }

    this.onGeneratorInputChange();
  },

  onGeneratorInputChange() {
    const resBox = document.getElementById('generator-result-box');
    const classInp = document.getElementById('generator-class-input');
    if (classInp && classInp.value.trim() && resBox && resBox.style.display !== 'none') {
      this.generateClassShareLink(true);
    }
  },

  closeTeacherSheetModal() {
    const modal = document.getElementById('teacher-sheet-modal');
    if (modal) modal.classList.remove('active');
  },

  saveTeacherSheetUrl() {
    const urlInp = document.getElementById('teacher-sheet-url-input');
    const url = (urlInp?.value || '').trim();
    
    if (url) {
      if (url.includes('docs.google.com/spreadsheets')) {
        this.showToast('❌ Link នេះជា Link តារាង Sheets ធម្មតា! សូមប្រើ Web App URL ដែលចេញពី Apps Script (Deploy > Web App) ដែលបញ្ចប់ដោយ /exec', 'error');
        return;
      }
      if (!url.startsWith('https://script.google.com/macros/s/')) {
        this.showToast('⚠️ Web App URL ត្រូវតែចាប់ផ្តើមដោយ https://script.google.com/macros/s/.../exec', 'warning');
      }
    }

    this.setTeacherSheetUrl(url);
    if (url) {
      this.showToast('បានរក្សាទុក Web App URL រួចរាល់! 🎉', 'success');
    } else {
      this.showToast('បានលុប Web App URL', 'info');
    }

    const statusBadge = document.getElementById('sheet-status-badge');
    if (statusBadge) {
      if (url) {
        statusBadge.textContent = '✓ បានកំណត់ URL រួចរាល់';
        statusBadge.style.color = '#10b981';
      } else {
        statusBadge.textContent = 'មិនទាន់កំណត់ URL';
        statusBadge.style.color = 'var(--text-muted)';
      }
    }
  },

  async testSheetConnection() {
    const urlInp = document.getElementById('teacher-sheet-url-input');
    let url = this.getTeacherSheetUrl();

    // Auto-save if typed into input but forgot to click save
    if (!url && urlInp && urlInp.value.trim()) {
      this.saveTeacherSheetUrl();
      url = this.getTeacherSheetUrl();
    }

    if (!url) {
      this.showToast('សូមបញ្ចូល និងរក្សាទុក Web App URL ជាមុនសិន!', 'warning');
      urlInp?.focus();
      return;
    }

    if (url.includes('docs.google.com/spreadsheets')) {
      this.showToast('❌ Link នេះជា Link Sheets ធម្មតា មិនមែន Web App URL ទេ! សូមមើលការណែនាំ Apps Script ខាងក្រោម។', 'error');
      return;
    }

    const statusBadge = document.getElementById('sheet-status-badge');
    if (statusBadge) {
      statusBadge.textContent = '⏳ កំពុងតេស្តផ្ញើទិន្នន័យ...';
      statusBadge.style.color = '#38bdf8';
    }
    this.showToast('⏳ កំពុងផ្ញើទិន្នន័យតេស្តទៅកាន់ Google Sheets...', 'info');

    const testPayload = {
      timestamp: new Date().toLocaleString('km-KH'),
      studentName: 'សិស្សតេស្តសាកល្បង',
      studentClass: 'TEST_CLASS',
      rollNumber: '00',
      grade: '10',
      lessonTitle: 'តេស្តប្រព័ន្ធស្វ័យប្រវត្ត',
      pointTitle: 'សាកល្បងការតភ្ជាប់',
      score: 10,
      total: 10,
      percentage: '100%'
    };

    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(testPayload)
      });
      if (statusBadge) {
        statusBadge.textContent = '✅ តភ្ជាប់ជោគជ័យ (សាកល្បងបានជោគជ័យ)';
        statusBadge.style.color = '#10b981';
      }
      this.showToast('✅ បានផ្ញើតេស្តជោគជ័យ! សូមពិនិត្យមើល Tab ឈ្មោះ "TEST_CLASS" ក្នុង Google Sheets របស់លោកគ្រូ 🎉', 'success');
    } catch (err) {
      if (statusBadge) {
        statusBadge.textContent = '❌ បរាជ័យក្នុងការតភ្ជាប់';
        statusBadge.style.color = '#ef4444';
      }
      this.showToast('❌ ការតភ្ជាប់បរាជ័យ៖ ' + err.message, 'error');
    }
  },

  generateClassShareLink(silent = false) {
    const classInp = document.getElementById('generator-class-input');
    const gradeSelect = document.getElementById('generator-grade-select');
    const lessonSelect = document.getElementById('generator-lesson-select');
    const pointSelect = document.getElementById('generator-point-select');
    const timeSelect = document.getElementById('generator-time-select');
    const urlInp = document.getElementById('teacher-sheet-url-input');

    // Auto-save sheet URL if teacher typed or pasted it but didn't click save
    if (urlInp && urlInp.value.trim() && !this.getTeacherSheetUrl()) {
      this.saveTeacherSheetUrl();
    }

    const cls = (classInp?.value || '').trim().toUpperCase();
    if (!cls) {
      if (!silent) {
        this.showToast('សូមបញ្ចូលឈ្មោះថ្នាក់ (ឧ. 12B, 10A1...)!', 'warning');
        classInp?.focus();
      }
      return;
    }

    const grade = gradeSelect?.value || '12';
    const lessonVal = lessonSelect?.value || '';
    const point = pointSelect?.value || '0';
    const timeVal = parseInt(timeSelect?.value || '0', 10);

    const baseUrl = window.location.origin + window.location.pathname;
    const rawSheetUrl = this.getTeacherSheetUrl();
    const sheetUrl = encodeURIComponent(rawSheetUrl);

    let shareUrl = `${baseUrl}?exam=1&class=${encodeURIComponent(cls)}&grade=${grade}`;

    if (lessonVal && lessonVal.includes(':::')) {
      const [courseId, lessonId] = lessonVal.split(':::');
      shareUrl += `&course=${encodeURIComponent(courseId)}&lesson=${encodeURIComponent(lessonId)}&tab=quiz`;
      if (point && point !== '0') {
        shareUrl += `&point=${point}`;
      }
    } else {
      shareUrl += `&tab=quiz`;
    }

    if (timeVal > 0) {
      shareUrl += `&time=${timeVal}`;
    }

    // Read Exam Date & Time Schedule
    const dateInp = document.getElementById('generator-date-input');
    const winSelect = document.getElementById('generator-window-select');
    const startTimeInp = document.getElementById('generator-start-time');
    const endTimeInp = document.getElementById('generator-end-time');

    const dateVal = (dateInp?.value || '').trim();
    const winVal = winSelect?.value || 'all_day';
    let scheduleDesc = '';
    let scheduleBadgeText = '';

    if (winVal === 'anytime') {
      // 100% open with no date or time constraints!
      scheduleDesc = ' [♾️ បើកជានិច្ច គ្មានកំណត់ថ្ងៃម៉ោង]';
      scheduleBadgeText = '🔓 <strong>កាលវិភាគ ៖</strong> បើកសេរីជានិច្ច (គ្មានកាលបរិច្ឆេទផុតកំណត់ សិស្សអាចចូលធ្វើតេស្តបានគ្រប់ពេល)';
    } else if (dateVal) {
      shareUrl += `&date=${dateVal}`;
      if (winVal === 'morning') {
        shareUrl += `&start=07:00&end=11:30`;
        scheduleDesc = ` [📅 ថ្ងៃ ${dateVal} ពេលព្រឹក 07:00-11:30]`;
        scheduleBadgeText = `⏰ <strong>កាលវិភាគ ៖</strong> ថ្ងៃទី ${dateVal} ពេលព្រឹក (ម៉ោង ០៧:០០ ដល់ ១១:៣០)`;
      } else if (winVal === 'afternoon') {
        shareUrl += `&start=13:00&end=17:30`;
        scheduleDesc = ` [📅 ថ្ងៃ ${dateVal} ពេលរសៀល 13:00-17:30]`;
        scheduleBadgeText = `⏰ <strong>កាលវិភាគ ៖</strong> ថ្ងៃទី ${dateVal} ពេលរសៀល (ម៉ោង ១៣:០០ ដល់ ១៧:៣០)`;
      } else if (winVal === 'all_day') {
        // Whole day: do NOT restrict end to 22:00! Open 24h of that date until midnight!
        scheduleDesc = ` [📅 ថ្ងៃ ${dateVal} ពេញមួយថ្ងៃ (24 ម៉ោង ដល់ 23:59)]`;
        scheduleBadgeText = `📅 <strong>កាលវិភាគ ៖</strong> ថ្ងៃទី ${dateVal} ពេញមួយថ្ងៃ (បើក ២៤ ម៉ោង ដល់ពាក់កណ្តាលអធ្រាត្រ ២៣:៥៩)`;
      } else if (winVal === 'custom') {
        const rawSTime = (startTimeInp?.value || '').trim();
        const rawETime = (endTimeInp?.value || '').trim();
        const sTime = this.normalizeTimeString(rawSTime) || rawSTime;
        const eTime = this.normalizeTimeString(rawETime) || rawETime;
        if (sTime) shareUrl += `&start=${sTime}`;
        if (eTime) shareUrl += `&end=${eTime}`;
        scheduleDesc = ` [📅 ថ្ងៃ ${dateVal} ម៉ោង ${sTime || '00:00'}-${eTime || '23:59'}]`;
        scheduleBadgeText = `⚙️ <strong>កាលវិភាគ ៖</strong> ថ្ងៃទី ${dateVal} (ចាប់ពីម៉ោង ${sTime || '00:00'} ដល់ម៉ោង ${eTime || '23:59'})`;
      }
    }

    if (sheetUrl) {
      shareUrl += `&sheet=${sheetUrl}`;
    }

    const resBox = document.getElementById('generator-result-box');
    const outInp = document.getElementById('generator-link-output');
    const scheduleBadge = document.getElementById('generator-schedule-badge');
    if (outInp) outInp.value = shareUrl;
    if (scheduleBadge && scheduleBadgeText) scheduleBadge.innerHTML = scheduleBadgeText;
    if (resBox) resBox.style.display = 'block';

    const hintSpan = document.getElementById('generator-link-hint');
    if (hintSpan) {
      const timerText = timeVal > 0 ? `⏱️ <strong>កំណត់ពេល៖ ${timeVal} នាទី</strong> | ` : '⏱️ <strong>មិនកំណត់ពេល</strong> | ';
      const dateText = (dateVal && winVal !== 'anytime') ? `📅 <strong>កាលបរិច្ឆេទ ៖ ${dateVal} (ការពារប្រឡងថ្ងៃក្រោយ)</strong> | ` : '🔓 <strong>បើកជានិច្ច</strong> | ';
      if (sheetUrl) {
        hintSpan.innerHTML = `✓ ${timerText}${dateText}<strong>បានភ្ជាប់ Google Sheets ៖</strong> ពេលសិស្សធ្វើតេស្តចប់ ពិន្ទុនឹងលោតចូល Tab <strong>"${cls}"</strong> ក្នុង Sheets ភ្លាមៗ (សិស្សប្រឡងបានតែម្តងគត់)!`;
        hintSpan.style.color = '#10b981';
      } else {
        hintSpan.innerHTML = `⚠️ ${timerText}${dateText}<strong>មិនទាន់បានភ្ជាប់ Google Sheets ទេ ៖</strong> ពិន្ទុសិស្សនឹងមិនលោតចូល Sheet ឡើយ! សូមបិទភ្ជាប់ Web App URL ខាងលើ រួចចុច «រក្សាទុក»។`;
        hintSpan.style.color = '#f59e0b';
      }
    }

    if (!silent) {
      const timeDesc = timeVal > 0 ? ` [⏱️ ${timeVal} នាទី]` : '';
      if (sheetUrl) {
        this.showToast(`បានបង្កើត Link ប្រឡងសម្រាប់ថ្នាក់ ${cls}${timeDesc}${scheduleDesc} (ភ្ជាប់ Google Sheets រួចរាល់)! 🎯`, 'success');
      } else {
        this.showToast(`⚠️ ការព្រមាន៖ លោកគ្រូមិនទាន់បានកំណត់ Web App URL ទេ! Link នេះនឹងមិនកត់ត្រាពិន្ទុចូល Sheets ឡើយ`, 'warning');
        if (urlInp) {
          urlInp.style.border = '2px solid #f59e0b';
          setTimeout(() => { urlInp.style.border = ''; }, 3000);
        }
      }
    }
  },

  copyGeneratedClassLink() {
    this.generateClassShareLink(true);
    const outInp = document.getElementById('generator-link-output');
    if (outInp && outInp.value) {
      this.copyLink(outInp.value);
      this.showToast('📋 បានចម្លង Link ថ្នាក់ថ្មីរួចរាល់! អាចផ្ញើចូល Telegram ថ្នាក់បានភ្លាមៗ', 'success');
    }
  },

  copyMobileLink() {
    const linkEl = document.getElementById('mobile-ip-link');
    const link = (linkEl && linkEl.textContent.trim()) || window.location.origin;
    this.copyLink(link);
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

      // 3. Construct Lesson object with 3D simulation
      const newLesson = {
        id: 'les_' + Date.now(),
        title: lessonTitle,
        duration: '15:00',
        videoUrl: '',
        videoType: '3d_simulation',
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
    // Search Inputs (Desktop and Mobile)
    const searchInput = document.getElementById('search-input');
    const mobileSearchInput = document.getElementById('mobile-search-input');

    const handleSearchInput = (val) => {
      this.searchQuery = val;
      if (searchInput && searchInput.value !== val) searchInput.value = val;
      if (mobileSearchInput && mobileSearchInput.value !== val) mobileSearchInput.value = val;
      this.renderCourses();
    };

    if (searchInput) {
      searchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
    }
    if (mobileSearchInput) {
      mobileSearchInput.addEventListener('input', (e) => handleSearchInput(e.target.value));
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
        this.closeFeedbackModal();
        this.closeSupportModal();
        this.closeAboutModal();
      }
    });
  },

  openFeedbackModal() {
    const m = document.getElementById('feedback-modal');
    if (m) m.classList.add('active');
  },
  closeFeedbackModal() {
    const m = document.getElementById('feedback-modal');
    if (m) m.classList.remove('active');
  },
  submitFeedback(e) {
    if (e) e.preventDefault();
    const input = document.getElementById('feedback-text');
    const msg = input ? input.value.trim() : '';
    if (!msg) {
      this.showToast('សូមបញ្ចូលមតិកែលម្អរបស់អ្នកជាមុនសិន!', 'warning');
      return;
    }
    this.showToast('សូមអរគុណចំពោះមតិកែលម្អរបស់អ្នក! យើងនឹងកែលម្អភ្លាមៗ។', 'success');
    if (input) input.value = '';
    this.closeFeedbackModal();
  },
  showSupportModal() {
    const m = document.getElementById('support-modal');
    if (m) m.classList.add('active');
  },
  closeSupportModal() {
    const m = document.getElementById('support-modal');
    if (m) m.classList.remove('active');
  },
  showAboutModal() {
    const m = document.getElementById('about-modal');
    if (m) m.classList.add('active');
  },
  closeAboutModal() {
    const m = document.getElementById('about-modal');
    if (m) m.classList.remove('active');
  },
  showLicenseModal() {
    const m = document.getElementById('license-modal');
    if (m) m.classList.add('active');
  },
  closeLicenseModal() {
    const m = document.getElementById('license-modal');
    if (m) m.classList.remove('active');
  },
  filterByGrade(grade) {
    this.backToCatalog();
    if (typeof this.filterGrade === 'function') {
      this.filterGrade(grade);
    } else {
      this.currentGrade = grade;
      this.renderCatalog();
    }
    this.scrollToLessons();
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
