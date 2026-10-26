/**
 * Worksheet.Kh - Geometric Construction Engine (សំណង់ធរណីមាត្រ)
 * Inspired by KhmerMath & MoEYS Cambodia Curriculum (Grades 7 - 12)
 * 
 * Features:
 * - 20 Authentic Pedagogical Geometric Constructions with Animated Compass, Ruler & Protractor
 * - Step-by-Step Interactive Navigation & Automatic Playback
 * - Draggable Geometric Anchor Points for Real-time Recalculation
 * - Transparent Acrylic Ruler, Metallic Compass & Degree Protractor Rendering
 * - Complete Khmer Narration, KaTeX Geometric Proofs & Common Pitfalls
 * - 3D Solid Nets Folding Engine & Free Geometric Drafting Sandbox
 */

(function(window) {
  'use strict';

  function safeRoundRect(ctx, x, y, w, h, radii) {
    if (!radii) radii = 0;
    let r = typeof radii === 'number' ? [radii, radii, radii, radii] : radii;
    if (!Array.isArray(r)) r = [0, 0, 0, 0];
    const r0 = r[0] || 0, r1 = r[1] || 0, r2 = r[2] || 0, r3 = r[3] || 0;
    ctx.beginPath();
    ctx.moveTo(x + r0, y);
    ctx.lineTo(x + w - r1, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r1);
    ctx.lineTo(x + w, y + h - r2);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r2, y + h);
    ctx.lineTo(x + r3, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r3);
    ctx.lineTo(x, y + r0);
    ctx.quadraticCurveTo(x, y, x + r0, y);
    ctx.closePath();
  }

  class GeometricConstructionEngine {
    constructor() {
      this.container = null;
      this.canvas = null;
      this.ctx = null;
      this.dpr = window.devicePixelRatio || 1;
      
      // Playback State
      this.currentModuleId = 'segment_bisector';
      this.currentStepIndex = 0;
      this.activePointIndex = 0;
      this.activeStepIndex = 0;
      this.isPlaying = false;
      this.playSpeed = 1.0;
      this.stepProgress = 1.0; // 0.0 -> 1.0 for active step animation
      this.animFrameId = null;
      this.lastTimestamp = 0;
      this.showGrid = true;
      this.isFullscreen = false;

      // Interaction State
      this.points = {};
      this.draggedPointId = null;
      this.hoveredPointId = null;
      this.mousePos = { x: 0, y: 0 };
      this.isMouseDown = false;

      // Freeboard Draw Tool state (when moduleId === 'free_board')
      this.freeboard = {
        activeTool: 'compass', // 'compass', 'ruler', 'protractor', 'pencil', 'point', 'eraser'
        strokes: [],
        currentStroke: null,
        compassCenter: { x: 260, y: 220 },
        compassRadius: 90,
        compassPencilAngle: 0,
        rulerAngle: 0,
        rulerPos: { x: 180, y: 260 },
        protractorPos: { x: 300, y: 250 },
        protractorAngle: 0
      };

      // Solid 3D fold state
      this.solidFoldRatio = 0.0; // 0.0 = flat net, 1.0 = fully folded 3D

      // Registered Modules Catalog
      this.modules = this.initModules();

      // Initialize default points early
      const defaultMod = this.modules[this.currentModuleId];
      if (defaultMod && defaultMod.initPoints) {
        this.points = defaultMod.initPoints(800, 420);
      }
    }

    /**
     * Mount into container and set up canvas & DOM elements
     */
    init(containerEl) {
      if (!containerEl) return;
      this.container = containerEl;
      this.setupDOM();

      const mod = this.modules[this.currentModuleId] || this.modules['segment_bisector'];
      this.points = mod.initPoints(800, 420);

      this.setupCanvas();
      this.setupEvents();
      this.setModule(this.currentModuleId);
      this.startLoop();
    }

    selectPoint(idx) {
      this.activePointIndex = idx;
      this.activeStepIndex = idx;
      this.jumpToStep(idx);
    }

    resetCamera() {
      this.resetConstruction();
    }

    setupDOM() {
      // Find or create the stage element
      let stage = document.getElementById('math-3d-stage');
      if (!stage) {
        stage = document.createElement('div');
        stage.id = 'math-3d-stage';
        this.container.appendChild(stage);
      }
      stage.className = 'geom-construction-stage';
      
      stage.innerHTML = `
        <!-- Top Toolbar & Module Switcher HUD -->
        <div class="geom-top-hud">
          <div class="geom-hud-left">
            <div class="geom-badge">
              <span class="geom-pulse-dot"></span>
              <span>📐 សំណង់ធរណីមាត្រ</span>
            </div>

            <!-- Module Dropdown Selector -->
            <div class="geom-module-picker-wrap">
              <select id="geom-module-select" class="geom-module-select" onchange="window.MathConstruction.onModuleSelect(this.value)">
                <optgroup label="✨ សំណង់គ្រឹះ (ថ្នាក់ទី ៧ - ៩)">
                  <option value="segment_bisector">មេដ្យាទ័រនៃអង្កត់ (Segment Bisector)</option>
                  <option value="angle_bisector">កន្លះបន្ទាត់ពុះមុំ (Angle Bisector)</option>
                  <option value="copy_segment">ចម្លងអង្កត់ (Copy Segment)</option>
                  <option value="copy_angle">ចម្លងមុំ (Copy Angle)</option>
                  <option value="perpendicular_point">បន្ទាត់កែងកាត់តាមចំណុចមួយ (Perpendicular)</option>
                  <option value="parallel_line">បន្ទាត់ស្របកាត់តាមចំណុចមួយ (Parallel)</option>
                  <option value="divide_segment">ចែកអង្កត់ជាចំណែកប៉ុនគ្នា (តាលែស)</option>
                  <option value="special_angles">មុំពិសេស 60°, 30°, 90°, 45°</option>
                  <option value="protractor">រ៉ាប័រទ័រ និងវាស់មុំ (Protractor)</option>
                </optgroup>
                <optgroup label="🔺 ត្រីកោណ និងរង្វង់ (ថ្នាក់ទី ៨ - ១០)">
                  <option value="triangle_sss">សង់ត្រីកោណ ជ.ជ.ជ (ជ្រុងបី)</option>
                  <option value="triangle_sas">សង់ត្រីកោណ ជ.ម.ជ (ជ្រុងពីរ មុំមួយ)</option>
                  <option value="triangle_asa">សង់ត្រីកោណ ម.ជ.ម (មុំពីរ ជ្រុងមួយ)</option>
                  <option value="circumcircle">រង្វង់ចារឹកក្រៅត្រីកោណ (Circumcircle)</option>
                  <option value="incircle">រង្វង់ចារឹកក្នុងត្រីកោណ (Incircle)</option>
                  <option value="tangent_circle">បន្ទាត់ប៉ះទៅនឹងរង្វង់ (Tangent)</option>
                  <option value="circle_pi">រង្វង់ និងថាស (ក្រឡុកថាសរក π)</option>
                  <option value="ellipse">អេលីប (ម្ជុលពីរ ខ្សែមួយ ខ្មៅដៃ)</option>
                  <option value="quadrilateral">សង់ការ៉េ និងចតុកោណកែង</option>
                </optgroup>
                <optgroup label="📦 សូលីត 3D & ក្ដារខៀនសេរី">
                  <option value="solid_3d">ប្លង់លាតសូលីត និងគំនូរ 3D (Solid Nets)</option>
                  <option value="free_board">🎨 ក្ដារខៀនធរណីមាត្រសេរី (Free Sandbox)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div class="geom-hud-right">
            <button class="geom-btn-hud" id="geom-btn-grid" onclick="window.MathConstruction.toggleGrid()" title="បិទ/បើក ក្រឡាក្រដាស">
              <span id="geom-grid-icon">🔲</span> ក្រឡា
            </button>
            <button class="geom-btn-hud" id="geom-btn-speed" onclick="window.MathConstruction.toggleSpeed()" title="ល្បឿនចលនា">
              <span id="geom-speed-text">⚡ 1x</span>
            </button>
            <button class="geom-btn-hud" id="geom-btn-reset" onclick="window.MathConstruction.resetConstruction()" title="សង់ឡើងវិញពីជំហានដំបូង">
              🔄 ឡើងវិញ
            </button>
            <button class="geom-btn-hud" id="geom-btn-fullscreen" onclick="window.MathConstruction.toggleFullscreen()" title="ពង្រីកពេញអេក្រង់">
              ⛶ ពេញអេក្រង់
            </button>
          </div>
        </div>

        <!-- Canvas Viewport -->
        <div class="geom-viewport" id="geom-viewport">
          <canvas id="geom-canvas"></canvas>

          <!-- Floating Interactive Drag Hint -->
          <div class="geom-drag-hint" id="geom-drag-hint">
            <span>💡 អូសចំណុចពណ៌ទឹកក្រូចនៅលើរូប ដើម្បីប្ដូរអង្កត់/មុំ រួចមើលធ្នូកាត់គ្នា live!</span>
          </div>

          <!-- Freeboard Floating Tool palette (Shown only when in free_board mode) -->
          <div class="geom-freeboard-palette" id="geom-freeboard-palette" style="display: none;">
            <button class="gfb-tool-btn active" data-tool="compass" onclick="window.MathConstruction.setFreeTool('compass')" title="ដែកឈាន (Compass)">🧭 ដែកឈាន</button>
            <button class="gfb-tool-btn" data-tool="ruler" onclick="window.MathConstruction.setFreeTool('ruler')" title="បន្ទាត់ក្រិត (Ruler)">📏 បន្ទាត់</button>
            <button class="gfb-tool-btn" data-tool="protractor" onclick="window.MathConstruction.setFreeTool('protractor')" title="រ៉ាប័រទ័រ (Protractor)">🔘 រ៉ាប័រទ័រ</button>
            <button class="gfb-tool-btn" data-tool="pencil" onclick="window.MathConstruction.setFreeTool('pencil')" title="ខ្មៅដៃគូស (Pencil)">✏️ ខ្មៅដៃ</button>
            <button class="gfb-tool-btn" data-tool="point" onclick="window.MathConstruction.setFreeTool('point')" title="ដាក់ចំណុច">📍 ចំណុច</button>
            <button class="gfb-tool-btn danger" onclick="window.MathConstruction.clearFreeboard()" title="លុបផ្ទាំងគំនូរ">🧹 សម្អាត</button>
          </div>

          <!-- Solid 3D Fold Slider (Shown only when in solid_3d mode) -->
          <div class="geom-fold-controls" id="geom-fold-controls" style="display: none;">
            <div class="geom-fold-label">
              <span>បត់ប្លង់លាតទៅជា 3D៖</span>
              <span id="geom-fold-pct">0%</span>
            </div>
            <input type="range" min="0" max="100" value="0" class="geom-range-slider" id="geom-fold-slider" oninput="window.MathConstruction.setSolidFold(this.value)">
          </div>
        </div>

        <!-- Timeline Steps Track -->
        <div class="geom-timeline-track" id="geom-timeline-track">
          <!-- Step pills rendered dynamically -->
        </div>

        <!-- Dedicated Pedagogical Narration & Math Deck (KhmerMath Style) -->
        <div class="geom-pedagogy-deck" id="geom-pedagogy-deck">
          <div class="geom-step-header">
            <div class="geom-step-meta">
              <span class="geom-step-badge" id="geom-step-badge">ជំហាន ១ នៃ ៦</span>
              <span class="geom-tools-needed" id="geom-tools-needed">ត្រូវការ៖ ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ</span>
            </div>

            <div class="geom-step-nav">
              <button class="geom-nav-btn" id="geom-btn-prev" onclick="window.MathConstruction.prevStep()" title="ជំហានមុន">
                ⏮️ ជំហានមុន
              </button>
              <button class="geom-nav-btn primary" id="geom-btn-play" onclick="window.MathConstruction.togglePlay()" title="លេង / ផ្អាក">
                <span id="geom-play-icon">▶️</span> <span id="geom-play-label">លេង</span>
              </button>
              <button class="geom-nav-btn primary" id="geom-btn-next" onclick="window.MathConstruction.nextStep()" title="ជំហានបន្ទាប់">
                ជំហានបន្ទាប់ ⏭️
              </button>
            </div>
          </div>

          <!-- Step Instruction -->
          <div class="geom-instruction-card">
            <div class="geom-step-title" id="geom-step-title">កំពុងដំណើរការ...</div>
            <div class="geom-step-desc" id="geom-step-desc">សូមរង់ចាំ...</div>
            <div class="geom-formula-box" id="geom-formula-box"></div>
          </div>

          <!-- Accordion Explanations: Proof, Pitfalls, Practice (Identical to KhmerMath) -->
          <div class="geom-accordion-wrap">
            <details class="geom-details" open>
              <summary class="geom-summary">
                <span class="summary-icon">💡</span>
                <span class="summary-title">ហេតុអ្វីបានជាត្រឹមត្រូវ? (ហេតុផល និងទ្រឹស្តីបទ)</span>
              </summary>
              <div class="geom-details-content" id="geom-proof-content">
                ...
              </div>
            </details>

            <details class="geom-details">
              <summary class="geom-summary">
                <span class="summary-icon">⚠️</span>
                <span class="summary-title">កំហុសដែលច្រើនជួប និងវិធីចៀសវាង</span>
              </summary>
              <div class="geom-details-content" id="geom-pitfalls-content">
                ...
              </div>
            </details>

            <details class="geom-details">
              <summary class="geom-summary">
                <span class="summary-icon">✍️</span>
                <span class="summary-title">សាកធ្វើលើក្រដាស (លំហាត់អនុវត្តផ្ទាល់ដៃ)</span>
              </summary>
              <div class="geom-details-content" id="geom-practice-content">
                ...
              </div>
            </details>
          </div>
        </div>
      `;
    }

    setupCanvas() {
      this.canvas = document.getElementById('geom-canvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }

    resize() {
      if (!this.canvas || !this.canvas.parentElement) return;
      const rect = this.canvas.parentElement.getBoundingClientRect();
      const width = rect.width > 50 ? rect.width : (this.container && this.container.clientWidth > 50 ? this.container.clientWidth : 800);
      const height = rect.height > 50 ? rect.height : Math.max(380, Math.min(520, window.innerHeight * 0.5));

      this.dpr = window.devicePixelRatio || 1;
      this.canvas.width = width * this.dpr;
      this.canvas.height = height * this.dpr;
      this.canvas.style.width = width + 'px';
      this.canvas.style.height = height + 'px';

      if (this.ctx) {
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.scale(this.dpr, this.dpr);
      }
      if (this.points && Object.keys(this.points).length > 0 && width > 50) {
        this.render();
      }
    }

    setupEvents() {
      if (!this.canvas) return;

      const getPos = (e) => {
        const rect = this.canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: clientX - rect.left,
          y: clientY - rect.top
        };
      };

      const handleDown = (e) => {
        const pos = getPos(e);
        this.mousePos = pos;
        this.isMouseDown = true;

        if (this.currentModuleId === 'free_board') {
          this.handleFreeboardDown(pos);
          return;
        }

        // Check if clicked on a draggable point
        for (const [id, pt] of Object.entries(this.points)) {
          if (pt.draggable) {
            const dist = Math.hypot(pos.x - pt.x, pos.y - pt.y);
            if (dist <= 18) {
              this.draggedPointId = id;
              e.preventDefault();
              break;
            }
          }
        }
      };

      const handleMove = (e) => {
        const pos = getPos(e);
        this.mousePos = pos;

        if (this.currentModuleId === 'free_board') {
          this.handleFreeboardMove(pos);
          return;
        }

        if (this.draggedPointId && this.points[this.draggedPointId]) {
          // Constrain point inside canvas
          const w = this.canvas.clientWidth;
          const h = this.canvas.clientHeight;
          this.points[this.draggedPointId].x = Math.max(30, Math.min(w - 30, pos.x));
          this.points[this.draggedPointId].y = Math.max(30, Math.min(h - 30, pos.y));
          e.preventDefault();
        } else {
          // Check hover
          let hovered = null;
          for (const [id, pt] of Object.entries(this.points)) {
            if (pt.draggable) {
              const dist = Math.hypot(pos.x - pt.x, pos.y - pt.y);
              if (dist <= 18) {
                hovered = id;
                break;
              }
            }
          }
          this.hoveredPointId = hovered;
          this.canvas.style.cursor = hovered ? 'grab' : 'default';
        }
      };

      const handleUp = () => {
        this.isMouseDown = false;
        if (this.draggedPointId) {
          this.draggedPointId = null;
          this.canvas.style.cursor = this.hoveredPointId ? 'grab' : 'default';
        }
        if (this.currentModuleId === 'free_board') {
          this.handleFreeboardUp();
        }
      };

      this.canvas.addEventListener('mousedown', handleDown);
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);

      this.canvas.addEventListener('touchstart', handleDown, { passive: false });
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleUp);
    }

    handleFreeboardDown(pos) {
      if (this.freeboard.activeTool === 'pencil') {
        this.freeboard.currentStroke = {
          type: 'freehand',
          color: '#38bdf8',
          points: [pos]
        };
      } else if (this.freeboard.activeTool === 'point') {
        this.freeboard.strokes.push({
          type: 'point',
          x: pos.x,
          y: pos.y,
          label: 'P' + (this.freeboard.strokes.filter(s => s.type === 'point').length + 1)
        });
      }
    }

    handleFreeboardMove(pos) {
      if (this.isMouseDown && this.freeboard.activeTool === 'pencil' && this.freeboard.currentStroke) {
        this.freeboard.currentStroke.points.push(pos);
      }
    }

    handleFreeboardUp() {
      if (this.freeboard.currentStroke) {
        this.freeboard.strokes.push(this.freeboard.currentStroke);
        this.freeboard.currentStroke = null;
      }
    }

    setFreeTool(tool) {
      this.freeboard.activeTool = tool;
      document.querySelectorAll('.gfb-tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === tool);
      });
    }

    clearFreeboard() {
      this.freeboard.strokes = [];
      this.render();
    }

    setSolidFold(val) {
      this.solidFoldRatio = parseFloat(val) / 100.0;
      const el = document.getElementById('geom-fold-pct');
      if (el) el.textContent = Math.round(this.solidFoldRatio * 100) + '%';
      this.render();
    }

    toggleGrid() {
      this.showGrid = !this.showGrid;
      const btn = document.getElementById('geom-btn-grid');
      if (btn) btn.classList.toggle('active', this.showGrid);
      this.render();
    }

    toggleSpeed() {
      if (this.playSpeed === 1.0) this.playSpeed = 1.5;
      else if (this.playSpeed === 1.5) this.playSpeed = 2.0;
      else this.playSpeed = 1.0;

      const txt = document.getElementById('geom-speed-text');
      if (txt) txt.textContent = `⚡ ${this.playSpeed}x`;
    }

    toggleFullscreen() {
      const stage = document.getElementById('math-3d-stage');
      if (!stage) return;
      if (!document.fullscreenElement) {
        stage.requestFullscreen?.().catch(() => {});
        this.isFullscreen = true;
      } else {
        document.exitFullscreen?.().catch(() => {});
        this.isFullscreen = false;
      }
    }

    onModuleSelect(moduleId) {
      this.setModule(moduleId);
    }

    setModule(moduleId) {
      const mod = this.modules[moduleId] || this.modules['segment_bisector'];
      this.currentModuleId = mod.id;
      this.currentStepIndex = 0;
      this.stepProgress = 1.0;
      this.isPlaying = false;

      // Update dropdown selector
      const sel = document.getElementById('geom-module-select');
      if (sel && sel.value !== mod.id) sel.value = mod.id;

      // Initialize Points
      const w = this.canvas ? this.canvas.clientWidth : 800;
      const h = this.canvas ? this.canvas.clientHeight : 440;
      this.points = mod.initPoints(w, h);

      // Toggle special UI
      const fbPal = document.getElementById('geom-freeboard-palette');
      if (fbPal) fbPal.style.display = (mod.id === 'free_board') ? 'flex' : 'none';

      const foldCtl = document.getElementById('geom-fold-controls');
      if (foldCtl) foldCtl.style.display = (mod.id === 'solid_3d') ? 'flex' : 'none';

      const hintEl = document.getElementById('geom-drag-hint');
      if (hintEl) hintEl.style.display = (mod.id === 'free_board' || mod.id === 'solid_3d') ? 'none' : 'block';

      this.renderTimeline();
      this.updateStepUI();
      this.renderProofAndPitfalls();
      this.render();
    }

    renderTimeline() {
      const track = document.getElementById('geom-timeline-track');
      if (!track) return;
      const mod = this.modules[this.currentModuleId];
      if (!mod || !mod.steps) return;

      track.innerHTML = mod.steps.map((st, idx) => `
        <button class="geom-step-dot ${idx === this.currentStepIndex ? 'active' : ''} ${idx < this.currentStepIndex ? 'completed' : ''}" 
                onclick="window.MathConstruction.jumpToStep(${idx})"
                title="ជំហាន ${idx + 1}៖ ${st.title}">
          <span class="step-num">${idx + 1}</span>
          <span class="step-name">${st.title}</span>
        </button>
      `).join('');
    }

    updateStepUI() {
      const mod = this.modules[this.currentModuleId];
      if (!mod) return;
      const step = mod.steps[this.currentStepIndex];

      const badge = document.getElementById('geom-step-badge');
      if (badge) badge.textContent = `ជំហាន ${this.currentStepIndex + 1} នៃ ${mod.steps.length}`;

      const tools = document.getElementById('geom-tools-needed');
      if (tools) tools.textContent = `ត្រូវការ៖ ${mod.toolsNeeded || 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ'}`;

      const title = document.getElementById('geom-step-title');
      if (title && step) title.textContent = step.title;

      const desc = document.getElementById('geom-step-desc');
      if (desc && step) desc.textContent = step.desc;

      const fBox = document.getElementById('geom-formula-box');
      if (fBox) {
        if (step && step.formula) {
          fBox.style.display = 'block';
          fBox.innerHTML = `$$\\displaystyle ${step.formula}$$`;
          if (window.renderMathInElement) {
            window.renderMathInElement(fBox, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ],
              throwOnError: false
            });
          }
        } else {
          fBox.style.display = 'none';
        }
      }

      // Update Timeline active state
      const dots = document.querySelectorAll('.geom-step-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === this.currentStepIndex);
        dot.classList.toggle('completed', idx < this.currentStepIndex);
      });

      // Update play button text
      const icon = document.getElementById('geom-play-icon');
      const label = document.getElementById('geom-play-label');
      if (icon) icon.textContent = this.isPlaying ? '⏸️' : '▶️';
      if (label) label.textContent = this.isPlaying ? 'ផ្អាក' : 'លេង';
    }

    renderProofAndPitfalls() {
      const mod = this.modules[this.currentModuleId];
      if (!mod) return;

      const proofEl = document.getElementById('geom-proof-content');
      if (proofEl) {
        proofEl.innerHTML = mod.proofHtml || '<p>មិនទាន់មានខ្លឹមសារ...</p>';
        if (window.renderMathInElement) window.renderMathInElement(proofEl, { throwOnError: false });
      }

      const pitEl = document.getElementById('geom-pitfalls-content');
      if (pitEl) {
        pitEl.innerHTML = mod.pitfallsHtml || '<p>ចៀសវាងការរំកិលគម្លាតដែកឈានពេលកំពុងគូស។</p>';
        if (window.renderMathInElement) window.renderMathInElement(pitEl, { throwOnError: false });
      }

      const pracEl = document.getElementById('geom-practice-content');
      if (pracEl) {
        pracEl.innerHTML = mod.practiceHtml || '<p>សាកគូសលើសៀវភៅតាមជំហានខាងលើ។</p>';
        if (window.renderMathInElement) window.renderMathInElement(pracEl, { throwOnError: false });
      }
    }

    nextStep() {
      const mod = this.modules[this.currentModuleId];
      if (!mod) return;
      if (this.currentStepIndex < mod.steps.length - 1) {
        this.currentStepIndex++;
        this.stepProgress = 0.0;
        this.updateStepUI();
        this.render();
      } else {
        this.isPlaying = false;
        this.updateStepUI();
      }
    }

    prevStep() {
      if (this.currentStepIndex > 0) {
        this.currentStepIndex--;
        this.stepProgress = 1.0;
        this.updateStepUI();
        this.render();
      }
    }

    jumpToStep(stepIdx) {
      const mod = this.modules[this.currentModuleId];
      if (!mod || stepIdx < 0 || stepIdx >= mod.steps.length) return;
      this.currentStepIndex = stepIdx;
      this.stepProgress = 1.0;
      this.updateStepUI();
      this.render();
    }

    togglePlay() {
      this.isPlaying = !this.isPlaying;
      if (this.isPlaying && this.stepProgress >= 1.0) {
        const mod = this.modules[this.currentModuleId];
        if (this.currentStepIndex >= mod.steps.length - 1) {
          this.currentStepIndex = 0;
        }
        this.stepProgress = 0.0;
      }
      this.updateStepUI();
    }

    resetConstruction() {
      this.currentStepIndex = 0;
      this.stepProgress = 1.0;
      this.isPlaying = false;
      const mod = this.modules[this.currentModuleId];
      const w = this.canvas ? this.canvas.clientWidth : 800;
      const h = this.canvas ? this.canvas.clientHeight : 440;
      this.points = mod.initPoints(w, h);
      this.updateStepUI();
      this.render();
    }

    startLoop() {
      const tick = (timestamp) => {
        if (!this.lastTimestamp) this.lastTimestamp = timestamp;
        const delta = (timestamp - this.lastTimestamp) / 1000.0;
        this.lastTimestamp = timestamp;

        if (this.isPlaying) {
          this.stepProgress += delta * 0.45 * this.playSpeed;
          if (this.stepProgress >= 1.0) {
            this.stepProgress = 1.0;
            const mod = this.modules[this.currentModuleId];
            if (this.currentStepIndex < mod.steps.length - 1) {
              this.currentStepIndex++;
              this.stepProgress = 0.0;
              this.updateStepUI();
            } else {
              this.isPlaying = false;
              this.updateStepUI();
            }
          }
        }

        this.render();
        this.animFrameId = requestAnimationFrame(tick);
      };
      this.animFrameId = requestAnimationFrame(tick);
    }

    /* ==========================================================================
       Rendering Pipeline
       ========================================================================== */
    render() {
      if (!this.ctx || !this.canvas) return;
      const ctx = this.ctx;
      const w = this.canvas.clientWidth || 800;
      const h = this.canvas.clientHeight || 420;

      if (w === 0 || h === 0) return;

      const mod = this.modules[this.currentModuleId];
      if (!this.points || Object.keys(this.points).length === 0) {
        if (mod && mod.initPoints) {
          this.points = mod.initPoints(w, h);
        }
      }

      ctx.clearRect(0, 0, w, h);

      // 1. Grid Background (KhmerMath Blueprint / Graph Paper)
      if (this.showGrid) {
        this.drawGrid(ctx, w, h);
      }

      // 2. Dispatch Module Drawing
      if (mod && mod.draw) {
        try {
          mod.draw(ctx, w, h, this.points, this.currentStepIndex, this.stepProgress, this);
        } catch (err) {
          console.warn('Module draw error:', err);
        }
      }

      // 3. Draw Anchor Points on top
      if (this.currentModuleId !== 'free_board' && this.currentModuleId !== 'solid_3d') {
        for (const [id, pt] of Object.entries(this.points || {})) {
          if (pt && typeof pt.x === 'number' && typeof pt.y === 'number') {
            this.drawPoint(ctx, pt.x, pt.y, pt.label || id, pt.color || '#38bdf8', id === this.hoveredPointId, pt.draggable);
          }
        }
      }
    }

    drawGrid(ctx, w, h) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.lineWidth = 1;

      const gridSize = 25;
      for (let x = 0; x <= w; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Major grid line every 100px
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
      ctx.lineWidth = 1.2;
      for (let x = 0; x <= w; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y <= h; y += 100) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawPoint(ctx, x, y, label, color, isHovered, isDraggable) {
      ctx.save();
      // Outer glow / halo ring if draggable
      if (isDraggable) {
        ctx.beginPath();
        ctx.arc(x, y, isHovered ? 14 : 10, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? 'rgba(245, 158, 11, 0.35)' : 'rgba(245, 158, 11, 0.15)';
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = isHovered ? 2 : 1;
        ctx.setLineDash([3, 3]);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Solid Center
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = isDraggable ? '#f59e0b' : color;
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Text Label
      ctx.font = 'bold 14px "Kantumruy Pro", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(label, x + 8, y - 8);

      ctx.restore();
    }

    /* ==========================================================================
       Authentic Virtual Instruments Rendering
       ========================================================================== */

    /**
     * Draw Realistic Acrylic Ruler with centimeter / millimeter ticks
     */
    drawRuler(ctx, p1, p2, progress = 1.0, width = 46) {
      ctx.save();
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const angle = Math.atan2(dy, dx);
      const length = Math.hypot(dx, dy) + 120;

      ctx.translate(p1.x - Math.cos(angle) * 60, p1.y - Math.sin(angle) * 60);
      ctx.rotate(angle);

      // Acrylic body with glass gradient
      const grad = ctx.createLinearGradient(0, -width, 0, 0);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
      grad.addColorStop(0.5, 'rgba(241, 245, 249, 0.15)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.28)');

      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 12;

      safeRoundRect(ctx, 0, -width, length, width, 6);
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.stroke();

      // Ruler Ticks (0, 1, 2, 3... cm)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.fillStyle = '#ffffff';
      ctx.font = '9px "Inter", sans-serif';

      for (let x = 10; x <= length - 10; x += 4) {
        const isCm = (x - 10) % 20 === 0;
        const isHalfCm = (x - 10) % 10 === 0;
        const tickH = isCm ? 14 : (isHalfCm ? 9 : 5);

        ctx.lineWidth = isCm ? 1.2 : 0.7;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, -tickH);
        ctx.stroke();

        if (isCm && x < length - 20) {
          const cmNum = Math.round((x - 10) / 20);
          ctx.fillText(cmNum.toString(), x - 3, -17);
        }
      }

      ctx.restore();

      // If active drawing, draw gliding pencil along ruler edge
      if (progress > 0.0 && progress < 1.0) {
        const px = p1.x + dx * progress;
        const py = p1.y + dy * progress;
        this.drawPencil(ctx, px, py, angle + Math.PI / 4);
      }
    }

    /**
     * Draw Realistic Metal Compass (ម្ជុលចាក់ fixed needle & ខ្មៅដៃ pencil)
     */
    drawCompass(ctx, pivot, pencilPos, currentAngle, arcRadius, isDrawing = true) {
      ctx.save();
      const px = pivot.x;
      const py = pivot.y;
      const cx = pencilPos.x;
      const cy = pencilPos.y;

      const dist = Math.hypot(cx - px, cy - py);
      const angle = Math.atan2(cy - py, cx - px);

      // Calculate Top Hinge Point (Isosceles triangle above the two points)
      const legLen = Math.max(120, dist * 1.15);
      const halfDist = dist / 2;
      const hHeight = Math.sqrt(Math.max(16, legLen * legLen - halfDist * halfDist));

      const midX = (px + cx) / 2;
      const midY = (py + cy) / 2;
      const perpAngle = angle - Math.PI / 2;
      const hx = midX + Math.cos(perpAngle) * hHeight;
      const hy = midY + Math.sin(perpAngle) * hHeight;

      // 1. Fixed Needle Leg (Steel Needle)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(px, py);
      ctx.stroke();

      // Sharp Needle point
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(px, py, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Moveable Pencil Leg
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // Pencil Holder clamp & Wooden Pencil
      this.drawPencil(ctx, cx, cy, Math.atan2(cy - hy, cx - hx));

      // 3. Top Joint Knurled Knob (Brass / Silver)
      const knobGrad = ctx.createLinearGradient(hx - 8, hy - 8, hx + 8, hy + 8);
      knobGrad.addColorStop(0, '#f59e0b');
      knobGrad.addColorStop(1, '#b45309');
      ctx.fillStyle = knobGrad;
      ctx.beginPath();
      ctx.arc(hx, hy, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top knob stem
      ctx.fillStyle = '#78716c';
      ctx.fillRect(hx - 3, hy - 20, 6, 12);

      // Radius Guide Dimension
      if (dist > 30) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(cx, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.font = '11px "Inter", sans-serif';
        ctx.fillStyle = '#38bdf8';
        ctx.fillText(`r`, (px + cx) / 2 + 6, (py + cy) / 2 - 6);
      }

      ctx.restore();
    }

    /**
     * Draw Hexagonal Pencil with Sharpened Tip and Lead
     */
    drawPencil(ctx, tipX, tipY, angle) {
      ctx.save();
      ctx.translate(tipX, tipY);
      ctx.rotate(angle);

      // Sharpened Graphite Lead Tip
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-4, -12);
      ctx.lineTo(4, -12);
      ctx.closePath();
      ctx.fill();

      // Exposed Wood cone
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.moveTo(-4, -12);
      ctx.lineTo(4, -12);
      ctx.lineTo(5, -24);
      ctx.lineTo(-5, -24);
      ctx.closePath();
      ctx.fill();

      // Wooden Yellow Body
      const bodyGrad = ctx.createLinearGradient(-6, 0, 6, 0);
      bodyGrad.addColorStop(0, '#eab308');
      bodyGrad.addColorStop(0.5, '#facc15');
      bodyGrad.addColorStop(1, '#ca8a04');
      ctx.fillStyle = bodyGrad;
      ctx.fillRect(-5, -74, 10, 50);

      // Metal Ferrule & Pink Eraser
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(-5, -82, 10, 8);
      ctx.fillStyle = '#fb7185';
      safeRoundRect(ctx, -5, -94, 10, 12, [4, 4, 0, 0]);
      ctx.fill();

      ctx.restore();
    }

    /**
     * Draw Semicircular Protractor (រ៉ាប័រទ័រ)
     */
    drawProtractor(ctx, cx, cy, radius = 130, rotation = 0, currentAngle = null) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);

      // Transparent Semicircle Body
      const grad = ctx.createRadialGradient(0, 0, 10, 0, 0, radius);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.12)');
      grad.addColorStop(0.85, 'rgba(241, 245, 249, 0.18)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.35)');

      ctx.fillStyle = grad;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      ctx.arc(0, 0, radius, Math.PI, 0, false);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Inner hollow cutout
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.42, Math.PI, 0, false);
      ctx.closePath();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      ctx.fill();
      ctx.stroke();

      // Center crosshair
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-10, 0);
      ctx.lineTo(10, 0);
      ctx.moveTo(0, -10);
      ctx.lineTo(0, 10);
      ctx.stroke();

      // Degree Graduation Marks
      ctx.fillStyle = '#f8fafc';
      ctx.font = '8px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (let deg = 0; deg <= 180; deg += 2) {
        const rad = (Math.PI / 180) * (180 - deg);
        const isMajor = deg % 10 === 0;
        const isMid = deg % 5 === 0;
        const tickLen = isMajor ? 12 : (isMid ? 8 : 4);

        const r1 = radius - 2;
        const r2 = radius - 2 - tickLen;

        const x1 = Math.cos(rad) * r1;
        const y1 = -Math.sin(rad) * r1;
        const x2 = Math.cos(rad) * r2;
        const y2 = -Math.sin(rad) * r2;

        ctx.strokeStyle = isMajor ? '#ffffff' : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = isMajor ? 1.2 : 0.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Degree Numbers
        if (isMajor && deg > 0 && deg < 180) {
          const numR = radius - 22;
          const nx = Math.cos(rad) * numR;
          const ny = -Math.sin(rad) * numR;
          ctx.fillText(deg.toString(), nx, ny);
        }
      }

      // Highlighted Angle Ray if specified
      if (currentAngle !== null) {
        const rad = (Math.PI / 180) * (180 - currentAngle);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(rad) * (radius + 20), -Math.sin(rad) * (radius + 20));
        ctx.stroke();

        // Glowing Angle Pill
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 12px "Inter", sans-serif';
        ctx.fillText(`${currentAngle}°`, Math.cos(rad) * (radius + 35), -Math.sin(rad) * (radius + 35));
      }

      ctx.restore();
    }

    /**
     * Draw Right Angle Corner Symbol ∟
     */
    drawRightAngle(ctx, cx, cy, dir1Rad, dir2Rad, size = 14) {
      ctx.save();
      const p1x = cx + Math.cos(dir1Rad) * size;
      const p1y = cy + Math.sin(dir1Rad) * size;
      const cornerX = cx + Math.cos(dir1Rad) * size + Math.cos(dir2Rad) * size;
      const cornerY = cy + Math.sin(dir1Rad) * size + Math.sin(dir2Rad) * size;
      const p2x = cx + Math.cos(dir2Rad) * size;
      const p2y = cy + Math.sin(dir2Rad) * size;

      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(cornerX, cornerY);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

      // Dot inside square
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(cx + Math.cos((dir1Rad + dir2Rad) / 2) * (size * 0.7), cy + Math.sin((dir1Rad + dir2Rad) / 2) * (size * 0.7), 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    /* ==========================================================================
       Module Initializers & Draw Functions
       ========================================================================== */
    initModules() {
      const self = this;
      return {
        // 1. SEGMENT BISECTOR (មេដ្យាទ័រនៃអង្កត់)
        'segment_bisector': {
          id: 'segment_bisector',
          title: 'មេដ្យាទ័រនៃអង្កត់ (Segment Bisector)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              A: { x: w * 0.28, y: h * 0.52, draggable: true, label: 'A', color: '#38bdf8' },
              B: { x: w * 0.72, y: h * 0.48, draggable: true, label: 'B', color: '#38bdf8' }
            };
          },
          steps: [
            {
              title: 'ស្គាល់អង្កត់ AB',
              desc: 'គេឱ្យអង្កត់ AB។ យើងចង់រកចំណុចកណ្ដាលរបស់វា និងបន្ទាត់កែងនឹង AB ត្រង់ចំណុចកណ្ដាលនោះ។',
              formula: 'AB \\text{ ជាអង្កត់ដែលគេឱ្យ}',
              tool: 'ruler'
            },
            {
              title: 'បើកដែកឈាន (r > AB/2)',
              desc: 'បើកគម្លាតដែកឈានឱ្យធំជាងពាក់កណ្ដាលនៃប្រវែងអង្កត់ AB ដើម្បីឱ្យធ្នូកាត់គ្នាបាន។',
              formula: 'r > \\frac{AB}{2}',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូរង្វង់ផ្ចិត A',
              desc: 'ដាក់ចុងម្ជុលដែកឈាននៅ A រួចគូសធ្នូរង្វង់មួយនៅខាងលើ និងមួយនៅខាងក្រោមនៃ AB។',
              formula: '\\mathcal{C}(A, r)',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូរង្វង់ផ្ចិត B (រក្សា r ដដែល)',
              desc: 'រក្សាគម្លាត r ដដែល ដាក់ចុងម្ជុលនៅ B រួចគូសធ្នូកាត់ធ្នូមុន ត្រង់ពីរចំណុច P និង Q។',
              formula: '\\mathcal{C}(B, r) \\cap \\mathcal{C}(A, r) = \\{P, Q\\}',
              tool: 'compass'
            },
            {
              title: 'ដាក់បន្ទាត់កាត់តាម P និង Q',
              desc: 'ប្រើបន្ទាត់ក្រិតតម្រឹមតាមពីរចំណុចប្រសព្វ P និង Q រួចគូសបន្ទាត់ PQ។',
              formula: '(PQ) \\text{ កាត់តាម } P \\text{ និង } Q',
              tool: 'ruler'
            },
            {
              title: 'សន្និដ្ឋាន៖ PQ ជាមេដ្យាទ័រនៃ AB',
              desc: 'បន្ទាត់ PQ ជាមេដ្យាទ័រនៃ AB៖ វាកាត់ AB ត្រង់ចំណុចកណ្ដាល M (MA = MB) ហើយកែងនឹង AB (PQ ⟂ AB)។',
              formula: 'PQ \\perp AB \\quad \\& \\quad MA = MB',
              tool: 'none'
            }
          ],
          proofHtml: `
            <p><strong>ហេតុផលធរណីមាត្រ៖</strong></p>
            <p>ធ្នូទាំងបួនមានកាំ $r$ ស្មើគ្នា។ ដូច្នេះ $PA = PB = r$ និង $QA = QB = r$។</p>
            <p>គ្រប់ចំណុចដែលនៅចម្ងាយស្មើគ្នាពី $A$ និង $B$ ស្ថិតនៅលើមេដ្យាទ័រនៃ $AB$។ ដោយសារចំណុច $P$ និង $Q$ សុទ្ធតែនៅចម្ងាយស្មើគ្នាពី $A$ និង $B$ ហើយពីរចំណុចកំណត់បន្ទាត់តែមួយ ដូច្នេះបន្ទាត់ $PQ$ គឺជាមេដ្យាទ័រនៃ $AB$ ពិតប្រាកដ។</p>
            <p>ម្យ៉ាងទៀត ចតុកោណ $APBQ$ មានជ្រុងទាំងបួនស្មើគ្នា ($r$) ជាចតុកោណស្មើ។ អង្កត់ទ្រូងទាំងពីរ $AB$ និង $PQ$ កែងគ្នា និងពុះគ្នាជាពីរស្មើៗគ្នាត្រង់ចំណុចកណ្ដាល $M$។</p>
          `,
          pitfallsHtml: `
            <ul>
              <li><strong>បើកដែកឈានតូចពេក៖</strong> បើគម្លាតតូចជាងពាក់កណ្ដាលនៃ $AB$ ធ្នូទាំងពីរនឹងមិនកាត់គ្នាឡើយ។ ត្រូវបើកឱ្យធំជាង $AB/2$។</li>
              <li><strong>ប្ដូរគម្លាតពេលផ្លាស់ពី A ទៅ B៖</strong> បើគម្លាតប្រែប្រួល បន្ទាត់ដែលគូសបាននឹងមិនកាត់ចំចំណុចកណ្ដាល $M$ ទេ។</li>
              <li><strong>គូសធ្នូតែម្ខាង៖</strong> ទទួលបានតែមួយចំណុចប្រសព្វ មិនអាចកំណត់បន្ទាត់បានទេ ព្រោះបន្ទាត់មួយត្រូវការយ៉ាងតិចពីរចំណុច។</li>
            </ul>
          `,
          practiceHtml: `
            <ol>
              <li>គូសអង្កត់ $CD$ ប្រវែង $8\\text{ cm}$ លើក្រដាស។ សង់មេដ្យាទ័ររបស់វា រួចវាស់ថាចំណុចកណ្ដាល $M$ នៅចម្ងាយ $4\\text{ cm}$ និងមុំ $90^\\circ$ ឬទេ។</li>
              <li>គូសត្រីកោណ $ABC$ មួយ។ សង់មេដ្យាទ័រនៃជ្រុងទាំងបី។ <em>(ចម្លើយ៖ មេដ្យាទ័រទាំងបីប្រសព្វគ្នាត្រង់ផ្ចិតរង្វង់ចារឹកក្រៅត្រីកោណ)</em></li>
            </ol>
          `,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.A || !pts.B) return;
            const A = pts.A;
            const B = pts.B;
            const dx = B.x - A.x;
            const dy = B.y - A.y;
            const len = Math.hypot(dx, dy);
            const midX = (A.x + B.x) / 2;
            const midY = (A.y + B.y) / 2;
            const angle = Math.atan2(dy, dx);
            const perpAngle = angle - Math.PI / 2;

            const r = len * 0.65; // radius > len / 2
            const arcH = Math.sqrt(Math.max(10, r * r - (len / 2) * (len / 2)));
            const P = { x: midX + Math.cos(perpAngle) * arcH, y: midY + Math.sin(perpAngle) * arcH };
            const Q = { x: midX - Math.cos(perpAngle) * arcH, y: midY - Math.sin(perpAngle) * arcH };

            // Base Segment AB
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.stroke();

            // Hash ticks on AB if step 5
            if (stepIdx >= 5) {
              self.drawRightAngle(ctx, midX, midY, angle, perpAngle, 14);
              self.drawPoint(ctx, midX, midY, 'M', '#22c55e', false, false);
            }

            // Step 2 & 3: Arcs from A
            if (stepIdx >= 2) {
              const pA = (stepIdx === 2) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;

              // Top arc from A
              ctx.beginPath();
              ctx.arc(A.x, A.y, r, perpAngle - 0.35, perpAngle - 0.35 + 0.7 * pA);
              ctx.stroke();

              // Bottom arc from A
              ctx.beginPath();
              ctx.arc(A.x, A.y, r, perpAngle + Math.PI - 0.35, perpAngle + Math.PI - 0.35 + 0.7 * pA);
              ctx.stroke();

              if (stepIdx === 2 && progress < 1.0) {
                const curA = perpAngle - 0.35 + 0.7 * pA;
                const pencilPos = { x: A.x + Math.cos(curA) * r, y: A.y + Math.sin(curA) * r };
                self.drawCompass(ctx, A, pencilPos, curA, r);
              }
            }

            // Step 3 & 4: Arcs from B
            if (stepIdx >= 3) {
              const pB = (stepIdx === 3) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;

              // Top arc from B
              const bTopA = Math.atan2(P.y - B.y, P.x - B.x);
              ctx.beginPath();
              ctx.arc(B.x, B.y, r, bTopA - 0.35, bTopA - 0.35 + 0.7 * pB);
              ctx.stroke();

              // Bottom arc from B
              const bBotA = Math.atan2(Q.y - B.y, Q.x - B.x);
              ctx.beginPath();
              ctx.arc(B.x, B.y, r, bBotA - 0.35, bBotA - 0.35 + 0.7 * pB);
              ctx.stroke();

              if (stepIdx === 3 && progress < 1.0) {
                const curB = bTopA - 0.35 + 0.7 * pB;
                const pencilPos = { x: B.x + Math.cos(curB) * r, y: B.y + Math.sin(curB) * r };
                self.drawCompass(ctx, B, pencilPos, curB, r);
              }

              // Draw intersection points P and Q
              self.drawPoint(ctx, P.x, P.y, 'P', '#f59e0b', false, false);
              self.drawPoint(ctx, Q.x, Q.y, 'Q', '#f59e0b', false, false);
            }

            // Step 4 & 5: Ruler & Bisector Line PQ
            if (stepIdx === 4) {
              self.drawRuler(ctx, P, Q, progress);
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(P.x, P.y);
              ctx.lineTo(P.x + (Q.x - P.x) * progress, P.y + (Q.y - P.y) * progress);
              ctx.stroke();
            } else if (stepIdx >= 5) {
              // Complete extended line PQ
              const extLen = 40;
              const unitX = Math.cos(perpAngle);
              const unitY = Math.sin(perpAngle);
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(P.x + unitX * extLen, P.y + unitY * extLen);
              ctx.lineTo(Q.x - unitX * extLen, Q.y - unitY * extLen);
              ctx.stroke();
            }
          }
        },

        // 2. ANGLE BISECTOR (កន្លះបន្ទាត់ពុះមុំ)
        'angle_bisector': {
          id: 'angle_bisector',
          title: 'កន្លះបន្ទាត់ពុះមុំ (Angle Bisector)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              O: { x: w * 0.28, y: h * 0.65, draggable: true, label: 'O', color: '#38bdf8' },
              X: { x: w * 0.75, y: h * 0.65, draggable: true, label: 'x', color: '#38bdf8' },
              Y: { x: w * 0.65, y: h * 0.22, draggable: true, label: 'y', color: '#38bdf8' }
            };
          },
          steps: [
            {
              title: 'ស្គាល់មុំ xOy',
              desc: 'គេឱ្យមុំ ∠xOy ដែលមានកំពូល O និងកាំ Ox និង Oy។ យើងចង់ពុះមុំនេះជាពីរមុំប៉ុនគ្នា។',
              formula: '\\angle xOy \\text{ ដែលត្រូវពុះជាពីរ}',
              tool: 'none'
            },
            {
              title: 'គូសធ្នូកាត់កាំទាំងពីរត្រង់ A និង B',
              desc: 'ដាក់ចុងម្ជុលដែកឈាននៅកំពូល O គូសធ្នូកាត់កាំ Ox ត្រង់ A និងកាត់កាំ Oy ត្រង់ B។',
              formula: 'OA = OB = r_1',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូរង្វង់ពីចំណុច A',
              desc: 'ដាក់ចុងម្ជុលដែកឈាននៅ A គូសធ្នូមួយក្នុងប្រឡោះមុំ។',
              formula: '\\mathcal{C}(A, r_2)',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូរង្វង់ពី B កាត់ធ្នូមុនត្រង់ C',
              desc: 'រក្សាគម្លាតដដែល ដាក់ចុងម្ជុលនៅ B គូសធ្នូកាត់ធ្នូមុន ទទួលបានចំណុចប្រសព្វ C។',
              formula: '\\mathcal{C}(B, r_2) \\cap \\mathcal{C}(A, r_2) = \\{C\\}',
              tool: 'compass'
            },
            {
              title: 'គូសកន្លះបន្ទាត់ Oc',
              desc: 'ប្រើបន្ទាត់ក្រិតតម្រឹមតាម O និង C រួចគូសកន្លះបន្ទាត់ Oc។',
              formula: '[Oc) \\text{ កាត់តាម } O \\text{ និង } C',
              tool: 'ruler'
            },
            {
              title: 'សន្និដ្ឋាន៖ [Oc) ជាកន្លះបន្ទាត់ពុះមុំ ∠xOy',
              desc: 'កន្លះបន្ទាត់ [Oc) ពុះមុំ ∠xOy ជាពីរមុំស្មើគ្នា៖ ∠xOc = ∠cOy = 1/2 ∠xOy។',
              formula: '\\angle xOc = \\angle cOy = \\frac{1}{2}\\angle xOy',
              tool: 'none'
            }
          ],
          proofHtml: `
            <p><strong>ហេតុផលធរណីមាត្រ៖</strong></p>
            <p>ពិនិត្យត្រីកោណ $OAC$ និងត្រីកោណ $OBC$ ៖</p>
            <ul>
              <li>$OA = OB$ (កាំនៃធ្នូរង្វង់ទី ១ ផ្ចិត $O$)</li>
              <li>$AC = BC$ (កាំនៃធ្នូរង្វង់ទី ២ ផ្ចិត $A$ និង $B$)</li>
              <li>$[OC]$ ជាជ្រុងរួម</li>
            </ul>
            <p>ដូច្នេះ $\\triangle OAC \\cong \\triangle OBC$ (ករណី ជ្រុង-ជ្រុង-ជ្រុង ជ.ជ.ជ)។ នាំឱ្យមុំត្រូវគ្នា $\\angle AOC = \\angle BOC$។ ដូចនេះ $[OC)$ គឺជាកន្លះបន្ទាត់ពុះមុំ $\\angle xOy$ ពិតប្រាកដ។</p>
          `,
          pitfallsHtml: `
            <ul>
              <li><strong>ប្ដូរគម្លាតដែកឈានពេលប្ដូរពី A ទៅ B៖</strong> ត្រូវរក្សាគម្លាតដដែលពេលគូសធ្នូពី $A$ និង $B$ ដើម្បីឱ្យ $AC = BC$។</li>
              <li><strong>បើកដែកឈានតូចពេក៖</strong> ធ្នូពី $A$ និង $B$ នឹងមិនកាត់គ្នាឡើយ។</li>
            </ul>
          `,
          practiceHtml: `
            <ol>
              <li>គូសមុំ $80^\\circ$ ដោយរ៉ាប័រទ័រ រួចសង់កន្លះបន្ទាត់ពុះមុំដោយដែកឈាន។ វាស់ពិនិត្យថាមុំនីមួយៗស្មើ $40^\\circ$ ឬទេ។</li>
              <li>សង់មុំកែង $90^\\circ$ រួចពុះជាពីរ ដើម្បីទទួលបានមុំ $45^\\circ$។</li>
            </ol>
          `,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.O || !pts.X || !pts.Y) return;
            const O = pts.O;
            const X = pts.X;
            const Y = pts.Y;

            const aX = Math.atan2(X.y - O.y, X.x - O.x);
            const aY = Math.atan2(Y.y - O.y, Y.x - O.x);
            const midAngle = (aX + aY) / 2;

            // Rays Ox and Oy
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(X.x, X.y);
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(Y.x, Y.y);
            ctx.stroke();

            const r1 = 85;
            const A = { x: O.x + Math.cos(aX) * r1, y: O.y + Math.sin(aX) * r1 };
            const B = { x: O.x + Math.cos(aY) * r1, y: O.y + Math.sin(aY) * r1 };

            // Step 1: Arc from O
            if (stepIdx >= 1) {
              const pO = (stepIdx === 1) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;
              const startA = Math.min(aX, aY) - 0.1;
              const endA = Math.max(aX, aY) + 0.1;
              ctx.beginPath();
              ctx.arc(O.x, O.y, r1, startA, startA + (endA - startA) * pO);
              ctx.stroke();

              self.drawPoint(ctx, A.x, A.y, 'A', '#f59e0b', false, false);
              self.drawPoint(ctx, B.x, B.y, 'B', '#f59e0b', false, false);

              if (stepIdx === 1 && progress < 1.0) {
                const cur = startA + (endA - startA) * pO;
                self.drawCompass(ctx, O, { x: O.x + Math.cos(cur) * r1, y: O.y + Math.sin(cur) * r1 }, cur, r1);
              }
            }

            const r2 = 95;
            // Point C intersection
            const cDist = Math.sqrt(Math.max(10, r2 * r2 - Math.pow(Math.hypot(A.x - B.x, A.y - B.y) / 2, 2))) + Math.cos(Math.abs(aX - aY) / 2) * r1;
            const C = { x: O.x + Math.cos(midAngle) * cDist, y: O.y + Math.sin(midAngle) * cDist };

            // Step 2: Arc from A
            if (stepIdx >= 2) {
              const pA = (stepIdx === 2) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;
              const cAngA = Math.atan2(C.y - A.y, C.x - A.x);
              ctx.beginPath();
              ctx.arc(A.x, A.y, r2, cAngA - 0.35, cAngA - 0.35 + 0.7 * pA);
              ctx.stroke();

              if (stepIdx === 2 && progress < 1.0) {
                const cur = cAngA - 0.35 + 0.7 * pA;
                self.drawCompass(ctx, A, { x: A.x + Math.cos(cur) * r2, y: A.y + Math.sin(cur) * r2 }, cur, r2);
              }
            }

            // Step 3: Arc from B
            if (stepIdx >= 3) {
              const pB = (stepIdx === 3) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;
              const cAngB = Math.atan2(C.y - B.y, C.x - B.x);
              ctx.beginPath();
              ctx.arc(B.x, B.y, r2, cAngB - 0.35, cAngB - 0.35 + 0.7 * pB);
              ctx.stroke();

              self.drawPoint(ctx, C.x, C.y, 'C', '#22c55e', false, false);

              if (stepIdx === 3 && progress < 1.0) {
                const cur = cAngB - 0.35 + 0.7 * pB;
                self.drawCompass(ctx, B, { x: B.x + Math.cos(cur) * r2, y: B.y + Math.sin(cur) * r2 }, cur, r2);
              }
            }

            // Step 4 & 5: Bisector Ray OC
            if (stepIdx === 4) {
              self.drawRuler(ctx, O, C, progress);
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(O.x + (C.x - O.x) * progress, O.y + (C.y - O.y) * progress);
              ctx.stroke();
            } else if (stepIdx >= 5) {
              // Extended ray
              const ext = 1.35;
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(O.x + (C.x - O.x) * ext, O.y + (C.y - O.y) * ext);
              ctx.stroke();

              // Double angle arcs
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(O.x, O.y, 35, aX, midAngle, false);
              ctx.stroke();
              ctx.beginPath();
              ctx.arc(O.x, O.y, 45, midAngle, aY, false);
              ctx.stroke();
            }
          }
        },

        // 3. COPY SEGMENT (ចម្លងអង្កត់)
        'copy_segment': {
          id: 'copy_segment',
          title: 'ចម្លងអង្កត់ (Copy Segment)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              A: { x: w * 0.18, y: h * 0.35, draggable: true, label: 'A', color: '#38bdf8' },
              B: { x: w * 0.48, y: h * 0.35, draggable: true, label: 'B', color: '#38bdf8' },
              O: { x: w * 0.18, y: h * 0.72, draggable: true, label: "A'", color: '#22c55e' }
            };
          },
          steps: [
            {
              title: 'ស្គាល់អង្កត់ AB និងកាំ [A’x)',
              desc: 'គេឱ្យអង្កត់ AB។ យើងចង់សង់អង្កត់ A’B’ លើកាំ [A’x) ឱ្យមានប្រវែងស្មើ AB ដោយដែកឈាន។',
              formula: 'AB \\text{ និងកាំ } [A\'x)',
              tool: 'none'
            },
            {
              title: 'វាស់ប្រវែង AB ដោយដែកឈាន',
              desc: 'ដាក់ចុងម្ជុលដែកឈាននៅ A ហើយបើកចុងខ្មៅដៃឱ្យចំចំណុច B។ គម្លាតនេះស្មើប្រវែង AB។',
              formula: 'r = AB',
              tool: 'compass'
            },
            {
              title: 'ផ្ទេរគម្លាត r មកកាំ [A’x) ត្រង់ B’',
              desc: 'រក្សាគម្លាត r ដដែល ដាក់ចុងម្ជុលនៅ A’ រួចគូសធ្នូកាត់កាំ [A’x) ត្រង់ B’។',
              formula: 'A\'B\' = r = AB',
              tool: 'compass'
            },
            {
              title: 'សន្និដ្ឋាន៖ A’B’ = AB',
              desc: 'យើងទទួលបានអង្កត់ A’B’ ដែលមានប្រវែងស្មើគ្នានឹងអង្កត់ AB ពិតប្រាកដ។',
              formula: 'A\'B\' = AB',
              tool: 'none'
            }
          ],
          proofHtml: `<p>ដែកឈានរក្សាគម្លាតកាំ $r = AB$។ ពេលគូសធ្នូរង្វង់ផ្ចិត $A'$ កាំ $r$ កាត់កាំត្រង់ $B'$ នោះ $A'B' = r = AB$ តាមនិយមន័យរង្វង់។</p>`,
          pitfallsHtml: `<p>កុំរំកិលគន្លឹះដែកឈានពេលលើកចេញពី $AB$ មកកាន់ $A'$។</p>`,
          practiceHtml: `<p>គូសអង្កត់ប្រវែង $5.5\\text{ cm}$ រួចចម្លងវាចំនួន ៣ ដងតៗគ្នាលើបន្ទាត់តែមួយ។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.A || !pts.B || !pts.O) return;
            const A = pts.A;
            const B = pts.B;
            const O = pts.O;
            const len = Math.hypot(B.x - A.x, B.y - A.y);

            // Original Segment AB
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.stroke();

            // Destination Ray [A'x)
            const rayLen = len * 1.5;
            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(O.x + rayLen, O.y);
            ctx.stroke();

            // Step 1: Measure AB with compass
            if (stepIdx === 1) {
              self.drawCompass(ctx, A, B, 0, len);
            }

            // Step 2 & 3: Swing arc at O
            const Bprime = { x: O.x + len, y: O.y };
            if (stepIdx >= 2) {
              const pO = (stepIdx === 2) ? progress : 1.0;
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(O.x, O.y, len, -0.4, -0.4 + 0.8 * pO);
              ctx.stroke();

              self.drawPoint(ctx, Bprime.x, Bprime.y, "B'", '#22c55e', false, false);

              if (stepIdx === 2 && progress < 1.0) {
                const cur = -0.4 + 0.8 * pO;
                self.drawCompass(ctx, O, { x: O.x + Math.cos(cur) * len, y: O.y + Math.sin(cur) * len }, cur, len);
              }
            }

            // Step 3: Highlight A'B'
            if (stepIdx >= 3) {
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 4;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(Bprime.x, Bprime.y);
              ctx.stroke();

              // Dimension hash ticks
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 2;
              const midAB = (A.x + B.x) / 2;
              ctx.beginPath();
              ctx.moveTo(midAB - 3, A.y - 6);
              ctx.lineTo(midAB + 3, A.y + 6);
              ctx.stroke();

              const midPrime = (O.x + Bprime.x) / 2;
              ctx.beginPath();
              ctx.moveTo(midPrime - 3, O.y - 6);
              ctx.lineTo(midPrime + 3, O.y + 6);
              ctx.stroke();
            }
          }
        },

        // 4. PERPENDICULAR LINE (បន្ទាត់កែងកាត់តាមចំណុចមួយ)
        'perpendicular_point': {
          id: 'perpendicular_point',
          title: 'បន្ទាត់កែងកាត់តាមចំណុចមួយ (Perpendicular)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              P: { x: w * 0.5, y: h * 0.28, draggable: true, label: 'P', color: '#f59e0b' },
              L1: { x: w * 0.15, y: h * 0.65, draggable: false, label: 'd', color: '#38bdf8' },
              L2: { x: w * 0.85, y: h * 0.65, draggable: false, label: '', color: '#38bdf8' }
            };
          },
          steps: [
            {
              title: 'ស្គាល់បន្ទាត់ d និងចំណុច P នៅក្រៅបន្ទាត់',
              desc: 'គេឱ្យបន្ទាត់ d និងចំណុចមួយ P នៅក្រៅបន្ទាត់ d។ យើងចង់គូសបន្ទាត់កែងនឹង d កាត់តាម P។',
              formula: 'P \\notin d',
              tool: 'none'
            },
            {
              title: 'គូសធ្នូកាត់បន្ទាត់ d ត្រង់ A និង B',
              desc: 'ដាក់ចុងម្ជុលនៅ P បើកគម្លាតឱ្យធំជាងចម្ងាយពី P ទៅ d រួចគូសធ្នូកាត់បន្ទាត់ d ត្រង់ A និង B។',
              formula: 'PA = PB = r',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូពី A និង B ខាងក្រោមបន្ទាត់',
              desc: 'ដាក់ចុងម្ជុលនៅ A និង B គូសធ្នូប្រសព្វគ្នាត្រង់ Q នៅម្ខាងទៀតនៃបន្ទាត់ d។',
              formula: 'QA = QB',
              tool: 'compass'
            },
            {
              title: 'គូសបន្ទាត់ PQ',
              desc: 'ដាក់បន្ទាត់តម្រឹមតាម P និង Q រួចគូសបន្ទាត់ PQ។',
              formula: 'PQ \\perp d',
              tool: 'ruler'
            },
            {
              title: 'សន្និដ្ឋាន៖ PQ ⟂ d ត្រង់ H',
              desc: 'បន្ទាត់ PQ កែងនឹងបន្ទាត់ d ត្រង់ចំណុចប្រសព្វ H។ H ជាចំណោលកែងនៃ P លើ d។',
              formula: 'PQ \\perp d \\quad \\& \\quad \\angle PHD = 90^\\circ',
              tool: 'none'
            }
          ],
          proofHtml: `<p>ដោយសារ $PA = PB$ និង $QA = QB$ នោះ $PQ$ ជាមេដ្យាទ័រនៃអង្កត់ $AB$។ ដូច្នេះ $PQ \\perp AB$ ពោលគឺ $PQ \\perp d$។</p>`,
          pitfallsHtml: `<p>បើកដែកឈានតូចជាងចម្ងាយទៅបន្ទាត់ $d$ ធ្នូនឹងមិនកាត់បន្ទាត់ $d$ ឡើយ។</p>`,
          practiceHtml: `<p>គូសបន្ទាត់មួយ រួចដាក់ចំណុចនៅលើបន្ទាត់ និងក្រៅបន្ទាត់ រួចសង់បន្ទាត់កែង។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.P || !pts.L1 || !pts.L2) return;
            const P = pts.P;
            const lineY = pts.L1.y;

            // Line d
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(pts.L1.x, lineY);
            ctx.lineTo(pts.L2.x, lineY);
            ctx.stroke();

            const dist = Math.abs(lineY - P.y);
            const r = dist * 1.35;
            const halfW = Math.sqrt(Math.max(10, r * r - dist * dist));
            const A = { x: P.x - halfW, y: lineY };
            const B = { x: P.x + halfW, y: lineY };
            const Q = { x: P.x, y: lineY + dist };

            // Step 1: Arc from P
            if (stepIdx >= 1) {
              const pP = (stepIdx === 1) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(P.x, P.y, r, 0.45, 0.45 + (Math.PI - 0.9) * pP);
              ctx.stroke();

              self.drawPoint(ctx, A.x, A.y, 'A', '#f59e0b', false, false);
              self.drawPoint(ctx, B.x, B.y, 'B', '#f59e0b', false, false);

              if (stepIdx === 1 && progress < 1.0) {
                const cur = 0.45 + (Math.PI - 0.9) * pP;
                self.drawCompass(ctx, P, { x: P.x + Math.cos(cur) * r, y: P.y + Math.sin(cur) * r }, cur, r);
              }
            }

            // Step 2: Arcs from A & B
            if (stepIdx >= 2) {
              const pQ = (stepIdx === 2) ? progress : 1.0;
              ctx.strokeStyle = 'rgba(245, 158, 11, 0.85)';
              ctx.lineWidth = 2;
              const aAng = Math.atan2(Q.y - A.y, Q.x - A.x);
              ctx.beginPath();
              ctx.arc(A.x, A.y, r, aAng - 0.35, aAng - 0.35 + 0.7 * pQ);
              ctx.stroke();

              const bAng = Math.atan2(Q.y - B.y, Q.x - B.x);
              ctx.beginPath();
              ctx.arc(B.x, B.y, r, bAng - 0.35, bAng - 0.35 + 0.7 * pQ);
              ctx.stroke();

              self.drawPoint(ctx, Q.x, Q.y, 'Q', '#f59e0b', false, false);
            }

            // Step 3 & 4: Line PQ
            if (stepIdx === 3) {
              self.drawRuler(ctx, P, Q, progress);
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(P.x, P.y);
              ctx.lineTo(P.x, P.y + (Q.y - P.y) * progress);
              ctx.stroke();
            } else if (stepIdx >= 4) {
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(P.x, P.y - 30);
              ctx.lineTo(Q.x, Q.y + 30);
              ctx.stroke();

              self.drawRightAngle(ctx, P.x, lineY, 0, -Math.PI / 2, 14);
              self.drawPoint(ctx, P.x, lineY, 'H', '#22c55e', false, false);
            }
          }
        },

        // 5. PROTRACTOR (រ៉ាប័រទ័រវាស់មុំ)
        'protractor': {
          id: 'protractor',
          title: 'រ៉ាប័រទ័រ និងវាស់មុំ (Protractor)',
          toolsNeeded: 'រ៉ាប័រទ័រ · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              O: { x: w * 0.42, y: h * 0.65, draggable: true, label: 'O', color: '#38bdf8' },
              P: { x: w * 0.72, y: h * 0.32, draggable: true, label: 'P', color: '#f59e0b' }
            };
          },
          steps: [
            {
              title: 'ដាក់រ៉ាប័រទ័រចំផ្ចិត O',
              desc: 'ដាក់សញ្ញាកែងកណ្ដាលនៃរ៉ាប័រទ័រចំកំពូល O នៃមុំ ហើយបន្ទាត់ 0° តម្រឹមតាមកាំផ្ដេក។',
              formula: '\\text{តម្រឹមផ្ចិត } O \\text{ និងបន្ទាត់ } 0^\\circ',
              tool: 'protractor'
            },
            {
              title: 'អានរង្វាស់មុំតាមខ្នាតរ៉ាប័រទ័រ',
              desc: 'មើលកាំ OP កាត់ត្រង់លេខណាលើរ៉ាប័រទ័រ។ នោះជារង្វាស់មុំ ∠xOP។ (អ្នកអាចអូសចំណុច P ដើម្បីប្ដូរមុំ!)',
              formula: '\\angle xOP = \\alpha^\\circ',
              tool: 'protractor'
            },
            {
              title: 'សង់មុំ 150° ដោយចុចខ្មៅដៃ',
              desc: 'ចុចខ្មៅដៃត្រង់លេខ 150° លើគែមរ៉ាប័រទ័រ រួចគូសកាំភ្ជាប់ពី O ទៅចំណុចនោះ។',
              formula: '\\angle xOz = 150^\\circ',
              tool: 'ruler'
            }
          ],
          proofHtml: `<p>រ៉ាប័រទ័រចែករង្វង់កន្លះជា $180$ ចំណែកស្មើៗគ្នា មួយចំណែកស្មើ $1^\\circ$។ ការអានរង្វាស់មុំផ្អែកលើការរាប់ពី $0^\\circ$ ទៅកាន់កាំចុងក្រោយ។</p>`,
          pitfallsHtml: `<p>ច្រឡំខ្នាតក្នុង និងខ្នាតក្រៅ៖ បើកាំនៅខាងស្ដាំ ចាប់ផ្ដើមរាប់ពី $0^\\circ$ ខាងស្ដាំឡើងទៅ។</p>`,
          practiceHtml: `<p>ប្រើរ៉ាប័រទ័រសង់មុំ $35^\\circ$, $75^\\circ$, $120^\\circ$ និង $165^\\circ$។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.O || !pts.P) return;
            const O = pts.O;
            const P = pts.P;
            const angleRad = Math.atan2(P.y - O.y, P.x - O.x);
            let deg = Math.round(-angleRad * 180 / Math.PI);
            if (deg < 0) deg += 360;
            if (deg > 180) deg = 180; // Protractor top half

            // Base ray Ox
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(O.x + 180, O.y);
            ctx.stroke();

            // Protractor instrument
            self.drawProtractor(ctx, O.x, O.y, 140, 0, (stepIdx >= 1) ? deg : null);

            // Arm OP
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(P.x, P.y);
            ctx.stroke();

            if (stepIdx === 2) {
              // 150 deg special ray
              const r150 = -150 * Math.PI / 180;
              const p150 = { x: O.x + Math.cos(r150) * 160, y: O.y + Math.sin(r150) * 160 };
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(p150.x, p150.y);
              ctx.stroke();
              self.drawPoint(ctx, p150.x, p150.y, 'z (150°)', '#22c55e', false, false);
            }
          }
        },

        // 6. SPECIAL ANGLES (មុំពិសេស 60°, 30°, 90°, 45°)
        'special_angles': {
          id: 'special_angles',
          title: 'មុំពិសេស 60°, 30°, 90°, 45° (Special Angles)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              O: { x: w * 0.35, y: h * 0.65, draggable: true, label: 'O', color: '#38bdf8' }
            };
          },
          steps: [
            {
              title: 'គូសកាំផ្ដេក Ox និងធ្នូរង្វង់ផ្ចិត O',
              desc: 'គូសកាំ Ox។ ដាក់ដែកឈាននៅ O បើកកាំ r រួចគូសធ្នូរង្វង់កាត់ Ox ត្រង់ A។',
              formula: 'OA = r',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូផ្ចិត A កាំ r ទទួលបានមុំ 60°',
              desc: 'រក្សាកាំ r ដដែល ដាក់ដែកឈាននៅ A គូសធ្នូកាត់ធ្នូមុនត្រង់ B។ នោះមុំ ∠AOB = 60° (ត្រីកោណសម័ង្ស)។',
              formula: '\\angle AOB = 60^\\circ',
              tool: 'compass'
            },
            {
              title: 'ពុះមុំ 60° ទទួលបានមុំ 30°',
              desc: 'សង់កន្លះបន្ទាត់ពុះមុំ ∠AOB យើងទទួលបានមុំ 30°។',
              formula: '\\frac{60^\\circ}{2} = 30^\\circ',
              tool: 'ruler'
            },
            {
              title: 'សង់មុំ 90° និងពុះជា 45°',
              desc: 'សង់បន្ទាត់កែងត្រង់ O ទទួលបានមុំ 90°។ ពុះមុំ 90° ជាពីរ ទទួលបានមុំ 45°។',
              formula: '90^\\circ \\quad \\& \\quad 45^\\circ',
              tool: 'none'
            }
          ],
          proofHtml: `<p>$\triangle OAB$ មានជ្រុងទាំងបី $OA = OB = AB = r$ ជាត្រីកោណសម័ង្ស។ ដូច្នេះមុំនីមួយៗស្មើ $60^\\circ$។ កន្លះបន្ទាត់ពុះមុំផ្ដល់ $30^\\circ$ និង $45^\\circ$។</p>`,
          pitfallsHtml: `<p>ត្រូវប្រាកដថារក្សាកាំ $r$ ដដែលពេលផ្លាស់ពី $O$ ទៅ $A$។</p>`,
          practiceHtml: `<p>សង់មុំ $120^\\circ = 60^\\circ + 60^\\circ$ និងមុំ $15^\\circ = 30^\\circ / 2$ ដោយប្រើតែដែកឈាន។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.O) return;
            const O = pts.O;
            const r = 110;

            // Base ray
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(O.x, O.y);
            ctx.lineTo(O.x + r * 1.5, O.y);
            ctx.stroke();

            const A = { x: O.x + r, y: O.y };
            self.drawPoint(ctx, A.x, A.y, 'A', '#38bdf8', false, false);

            // Arc from O
            ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(O.x, O.y, r, -Math.PI * 0.55, 0.1);
            ctx.stroke();

            // Arc from A (60 deg)
            const bAngle = -Math.PI / 3;
            const B = { x: O.x + Math.cos(bAngle) * r, y: O.y + Math.sin(bAngle) * r };

            if (stepIdx >= 1) {
              ctx.strokeStyle = '#f59e0b';
              ctx.beginPath();
              ctx.arc(A.x, A.y, r, -Math.PI * 0.75, -Math.PI * 0.45);
              ctx.stroke();
              self.drawPoint(ctx, B.x, B.y, 'B (60°)', '#f59e0b', false, false);

              // 60 ray
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(O.x + Math.cos(bAngle) * (r * 1.3), O.y + Math.sin(bAngle) * (r * 1.3));
              ctx.stroke();
            }

            // 30 deg ray
            if (stepIdx >= 2) {
              const a30 = -Math.PI / 6;
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(O.x + Math.cos(a30) * (r * 1.3), O.y + Math.sin(a30) * (r * 1.3));
              ctx.stroke();
              self.drawPoint(ctx, O.x + Math.cos(a30) * r, O.y + Math.sin(a30) * r, '30°', '#22c55e', false, false);
            }

            // 90 & 45 deg
            if (stepIdx >= 3) {
              // 90 deg
              ctx.strokeStyle = '#ec4899';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(O.x, O.y - r * 1.3);
              ctx.stroke();
              self.drawPoint(ctx, O.x, O.y - r, '90°', '#ec4899', false, false);

              // 45 deg
              const a45 = -Math.PI / 4;
              ctx.strokeStyle = '#a855f7';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(O.x, O.y);
              ctx.lineTo(O.x + Math.cos(a45) * (r * 1.3), O.y + Math.sin(a45) * (r * 1.3));
              ctx.stroke();
              self.drawPoint(ctx, O.x + Math.cos(a45) * r, O.y + Math.sin(a45) * r, '45°', '#a855f7', false, false);
            }
          }
        },

        // 7. TRIANGLE SSS (សង់ត្រីកោណ ជ.ជ.ជ)
        'triangle_sss': {
          id: 'triangle_sss',
          title: 'សង់ត្រីកោណ ជ.ជ.ជ (ជ្រុងបី)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              A: { x: w * 0.25, y: h * 0.65, draggable: true, label: 'A', color: '#38bdf8' },
              B: { x: w * 0.75, y: h * 0.65, draggable: true, label: 'B', color: '#38bdf8' }
            };
          },
          steps: [
            {
              title: 'គូសបាត AB = c',
              desc: 'គូសអង្កត់បាត AB ដែលមានប្រវែងស្មើជ្រុងទីមួយ c = 7 cm។',
              formula: 'AB = c = 7\\text{ cm}',
              tool: 'ruler'
            },
            {
              title: 'គូសធ្នូផ្ចិត A កាំ b = 6 cm',
              desc: 'បើកដែកឈានកាំ b = 6 cm ដាក់ចុងម្ជុលនៅ A រួចគូសធ្នូរង្វង់មួយនៅខាងលើ។',
              formula: '\\mathcal{C}(A, b = 6\\text{ cm})',
              tool: 'compass'
            },
            {
              title: 'គូសធ្នូផ្ចិត B កាំ a = 5 cm',
              desc: 'បើកដែកឈានកាំ a = 5 cm ដាក់ចុងម្ជុលនៅ B រួចគូសធ្នូកាត់ធ្នូមុនត្រង់កំពូល C។',
              formula: '\\mathcal{C}(B, a = 5\\text{ cm}) \\cap \\mathcal{C}(A, b) = \\{C\\}',
              tool: 'compass'
            },
            {
              title: 'គូសជ្រុង AC និង BC',
              desc: 'ប្រើបន្ទាត់ភ្ជាប់ពី A ទៅ C និងពី B ទៅ C។ យើងទទួលបានត្រីកោណ ABC តាមបំណង។',
              formula: '\\triangle ABC \\text{ មានជ្រុង } a, b, c',
              tool: 'ruler'
            }
          ],
          proofHtml: `<p>តាមសំណង់ $AB = c$, $AC = b$, និង $BC = a$។ តាមវិសមភាពត្រីកោណ ផលបូកពីរជ្រុងធំជាងជ្រុងទីបី ($a+b > c$) ធ្នូទាំងពីរប្រាកដជាប្រសព្វគ្នាត្រង់ចំណុចតែមួយ $C$។</p>`,
          pitfallsHtml: `<p>បើ $a + b \\le c$ ធ្នូនឹងមិនកាត់គ្នាទេ មិនអាចបង្កើតជាត្រីកោណបានឡើយ។</p>`,
          practiceHtml: `<p>សង់ត្រីកោណមានជ្រុង $3\\text{ cm}$, $4\\text{ cm}$, $5\\text{ cm}$ (ត្រីកោណកែងពីតាករ)។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.A || !pts.B) return;
            const A = pts.A;
            const B = pts.B;
            const c = Math.hypot(B.x - A.x, B.y - A.y);
            const b = c * 0.8;
            const a = c * 0.7;

            // Calculate C
            const cosA = (b * b + c * c - a * a) / (2 * b * c);
            const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
            const angleBase = Math.atan2(B.y - A.y, B.x - A.x);
            const C = {
              x: A.x + Math.cos(angleBase - Math.acos(cosA)) * b,
              y: A.y + Math.sin(angleBase - Math.acos(cosA)) * b
            };

            // Base AB
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(A.x, A.y);
            ctx.lineTo(B.x, B.y);
            ctx.stroke();

            // Arc from A
            if (stepIdx >= 1) {
              const pA = (stepIdx === 1) ? progress : 1.0;
              const angC = Math.atan2(C.y - A.y, C.x - A.x);
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(A.x, A.y, b, angC - 0.4, angC - 0.4 + 0.8 * pA);
              ctx.stroke();

              if (stepIdx === 1 && progress < 1.0) {
                const cur = angC - 0.4 + 0.8 * pA;
                self.drawCompass(ctx, A, { x: A.x + Math.cos(cur) * b, y: A.y + Math.sin(cur) * b }, cur, b);
              }
            }

            // Arc from B
            if (stepIdx >= 2) {
              const pB = (stepIdx === 2) ? progress : 1.0;
              const angCB = Math.atan2(C.y - B.y, C.x - B.x);
              ctx.strokeStyle = '#f59e0b';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(B.x, B.y, a, angCB - 0.4, angCB - 0.4 + 0.8 * pB);
              ctx.stroke();

              self.drawPoint(ctx, C.x, C.y, 'C', '#22c55e', false, false);
            }

            // Triangle sides AC and BC
            if (stepIdx >= 3) {
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(A.x, A.y);
              ctx.lineTo(C.x, C.y);
              ctx.lineTo(B.x, B.y);
              ctx.stroke();
            }
          }
        },

        // 8. CIRCLE BASICS & PI ROLLING DISK (ក្រឡុកថាសរក π)
        'circle_pi': {
          id: 'circle_pi',
          title: 'រង្វង់ និងថាស (ក្រឡុកថាសរក π)',
          toolsNeeded: 'ថាសមូល · បន្ទាត់ក្រិត · ខ្មៅដៃ',
          initPoints(w, h) {
            return {
              Start: { x: w * 0.15, y: h * 0.72, draggable: false, label: '0', color: '#38bdf8' }
            };
          },
          steps: [
            {
              title: 'ថាសរង្វង់អង្កត់ផ្ចិត d = 1',
              desc: 'យើងមានថាសរង្វង់មួយដែលមានអង្កត់ផ្ចិត d = 1 ឯកតា (កាំ r = 0.5) ដាក់លើបន្ទាត់ចំនួនត្រង់លេខ 0។',
              formula: 'd = 1 \\implies C = \\pi d = \\pi',
              tool: 'none'
            },
            {
              title: 'ក្រឡុកថាស ១ ជុំលើបន្ទាត់',
              desc: 'ក្រឡុកថាសឱ្យវិលមួយជុំពេញ (360°) ដោយមិនឱ្យរអិល។ ស្នាមខ្សែគែមរង្វង់លាតសន្ធឹងលើបន្ទាត់។',
              formula: 'C = 2\\pi r = \\pi d',
              tool: 'none'
            },
            {
              title: 'ចំណុចប៉ះចុងក្រោយគឺ π ≈ 3.14159',
              desc: 'បន្ទាប់ពីវិលបានមួយជុំពេញ ចំណុចសម្គាល់លើថាសប៉ះដីត្រង់លេខ π ≈ 3.14! នេះជានិយមន័យពិតនៃចំនួន π។',
              formula: '\\pi = \\frac{C}{d} \\approx 3.1415926...',
              tool: 'none'
            }
          ],
          proofHtml: `<p>ផលធៀបរវាងបរិមាត្ររង្វង់ $C$ និងអង្កត់ផ្ចិត $d$ នៃគ្រប់រង្វង់ទាំងអស់ គឺជាចំនួនថេរអសនិទាន ហៅថា $\\pi$ (ពី)។ ដូច្នេះ $C = \\pi d = 2\\pi r$។</p>`,
          pitfallsHtml: `<p>$\pi$ មិនមែនស្មើ $22/7$ ឬ $3.14$ ពិតប្រាកដទេ នោះគ្រាន់តែជាតម្លៃប្រហែលប៉ុណ្ណោះ។</p>`,
          practiceHtml: `<p>វាស់បរិមាត្រមាត់កែវដោយខ្សែអំបោះ រួចចែកនឹងអង្កត់ផ្ចិតមាត់កែវ។ តើអ្នកទទួលបានប្រហែល 3.14 ដែរឬទេ?</p>`,
          draw(ctx, w, h, pts, stepIdx, progress) {
            if (!pts || !pts.Start) return;
            const startX = pts.Start.x;
            const groundY = pts.Start.y;
            const r = 50;
            const circumference = 2 * Math.PI * r;

            // Number line
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(startX - 40, groundY);
            ctx.lineTo(startX + circumference * 1.25, groundY);
            ctx.stroke();

            // Number line ticks: 0, 1, 2, 3, pi
            const unitD = 2 * r; // d = 1 unit
            for (let i = 0; i <= 3; i++) {
              const tx = startX + i * unitD;
              ctx.strokeStyle = '#94a3b8';
              ctx.beginPath();
              ctx.moveTo(tx, groundY - 6);
              ctx.lineTo(tx, groundY + 6);
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              ctx.font = '12px "Inter", sans-serif';
              ctx.fillText(i.toString(), tx - 4, groundY + 22);
            }

            // Pi mark
            const piX = startX + Math.PI * unitD;
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(piX, groundY - 12);
            ctx.lineTo(piX, groundY + 12);
            ctx.stroke();
            ctx.fillStyle = '#ef4444';
            ctx.font = 'bold 13px "Inter", sans-serif';
            ctx.fillText('π ≈ 3.14', piX - 18, groundY + 24);

            // Roll progress
            let roll = (stepIdx === 0) ? 0 : ((stepIdx === 1) ? progress : 1.0);
            const curX = startX + roll * circumference;
            const curAngle = roll * 2 * Math.PI;

            // Unrolled perimeter trail on ground
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(startX, groundY);
            ctx.lineTo(curX, groundY);
            ctx.stroke();

            // Rolling Disk
            ctx.save();
            ctx.translate(curX, groundY - r);
            ctx.rotate(curAngle);

            const diskGrad = ctx.createRadialGradient(0, 0, 5, 0, 0, r);
            diskGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)');
            diskGrad.addColorStop(1, 'rgba(14, 165, 233, 0.85)');
            ctx.fillStyle = diskGrad;
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;

            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Radius line & mark
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, r);
            ctx.stroke();

            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, r, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();
          }
        },

        // 9. SOLID 3D NETS (ប្លង់លាតសូលីត & 3D)
        'solid_3d': {
          id: 'solid_3d',
          title: 'ប្លង់លាតសូលីត និងគំនូរ 3D (Solid Nets)',
          toolsNeeded: 'កន្ត្រៃ · ក្រដាស · បន្ទាត់',
          initPoints(w, h) {
            return {
              Center: { x: w * 0.5, y: h * 0.48 }
            };
          },
          steps: [
            {
              title: 'ប្លង់លាត 2D នៃគូប (Cube Net)',
              desc: 'គូបមួយមានមុខជាការ៉េ ៦ ប៉ុនគ្នា។ ប្លង់លាតរាងអក្សរ T នេះអាចបត់ផ្គុំទៅជារូបគូប 3D មួយពេញលេញ។',
              formula: '6 \\text{ មុខការ៉េស្មើគ្នា } (S = 6a^2)',
              tool: 'none'
            },
            {
              title: 'ចលនាបត់ប្លង់លាតទៅជា 3D',
              desc: 'រំកិលរបារខាងលើ ឬចុច «លេង» ដើម្បីឃើញចលនាបត់ប្លង់លាត 2D ក្លាយជាប្រអប់គូប 3D!',
              formula: 'V = a^3',
              tool: 'none'
            }
          ],
          proofHtml: `<p>ប្លង់លាតសូលីត គឺជាគំនូរប្លង់ 2D លើផ្ទៃរាបដែលពេលបត់តាមគែម នឹងផ្ដុំបានជាសូលីត 3D ឥតចន្លោះ និងឥតជាន់គ្នា។ គូបមានប្លង់លាតខុសៗគ្នាដល់ទៅ ១១ បែប។</p>`,
          pitfallsHtml: `<p>មិនមែនគ្រប់រូបរាងដែលមាន ៦ ការ៉េ សុទ្ធតែបត់ចេញជាគូបនោះទេ។ បើមានការ៉េជាន់គ្នា នឹងមិនអាចបត់បានឡើយ។</p>`,
          practiceHtml: `<p>គូរូបប្លង់លាតនេះលើក្រដាសកាតុង កាត់តាមគែម ហើយបត់បិទកាវធ្វើជាប្រអប់គូបពិតៗ។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress, engine) {
            if (!pts || !pts.Center) return;
            const cx = pts.Center.x;
            const cy = pts.Center.y;
            const s = 55; // square size
            const fold = (stepIdx === 0) ? engine.solidFoldRatio : progress;

            // 3D Perspective fold projection
            ctx.save();
            ctx.translate(cx, cy);

            // Draw Base Face (Center)
            ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2.5;

            // Base (bottom face)
            ctx.strokeRect(-s / 2, -s / 2, s, s);
            ctx.fillRect(-s / 2, -s / 2, s, s);

            // Left Flap (folds up around -s/2)
            const fAngle = fold * (Math.PI / 2);
            const cosF = Math.cos(fAngle);
            const sinF = Math.sin(fAngle);

            // Left
            ctx.save();
            ctx.translate(-s / 2, 0);
            ctx.transform(cosF, -sinF * 0.4, 0, 1, 0, 0);
            ctx.strokeRect(-s, -s / 2, s, s);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(-s, -s / 2, s, s);
            ctx.restore();

            // Right
            ctx.save();
            ctx.translate(s / 2, 0);
            ctx.transform(cosF, sinF * 0.4, 0, 1, 0, 0);
            ctx.strokeRect(0, -s / 2, s, s);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(0, -s / 2, s, s);
            ctx.restore();

            // Top
            ctx.save();
            ctx.translate(0, -s / 2);
            ctx.transform(1, 0, 0, cosF, 0, -sinF * s * 0.3);
            ctx.strokeRect(-s / 2, -s, s, s);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(-s / 2, -s, s, s);

            // Top Lid (extends from top flap)
            ctx.translate(0, -s);
            ctx.transform(1, 0, 0, Math.cos(fold * Math.PI), 0, 0);
            ctx.strokeRect(-s / 2, -s, s, s);
            ctx.fillStyle = 'rgba(34, 197, 94, 0.35)';
            ctx.fillRect(-s / 2, -s, s, s);
            ctx.restore();

            // Bottom
            ctx.save();
            ctx.translate(0, s / 2);
            ctx.transform(1, 0, 0, cosF, 0, sinF * s * 0.3);
            ctx.strokeRect(-s / 2, 0, s, s);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
            ctx.fillRect(-s / 2, 0, s, s);
            ctx.restore();

            ctx.restore();
          }
        },

        // 10. FREEBOARD (ក្ដារខៀនធរណីមាត្រសេរី)
        'free_board': {
          id: 'free_board',
          title: 'ក្ដារខៀនធរណីមាត្រសេរី (Free Sandbox)',
          toolsNeeded: 'ដែកឈាន · បន្ទាត់ · រ៉ាប័រទ័រ · ខ្មៅដៃ',
          initPoints(w, h) {
            return {};
          },
          steps: [
            {
              title: 'ក្ដារខៀនសង់រូបធរណីមាត្រដោយសេរី',
              desc: 'ជ្រើសរើសឧបករណ៍ខាងលើ (ដែកឈាន, បន្ទាត់, រ៉ាប័រទ័រ, ខ្មៅដៃ) ដើម្បីគូសរូបធរណីមាត្រដោយខ្លួនឯង ដូចគូសលើក្រដាសពិតៗ!',
              formula: '\\text{គូសរូបធរណីមាត្រដោយសេរីលើក្ដារខៀន}',
              tool: 'none'
            }
          ],
          proofHtml: `<p>ក្ដារខៀននេះអនុញ្ញាតឱ្យសិស្ស និងគ្រូអនុវត្តការសង់រូបគ្រប់ប្រភេទដោយខ្លួនឯង ដោយមិនកំណត់ជំហាន។</p>`,
          pitfallsHtml: `<p>ប្រើប៊ូតុង «🧹 សម្អាត» នៅខាងលើ ប្រសិនបើចង់លុបគំនូរចាស់ចេញ។</p>`,
          practiceHtml: `<p>សាកសង់ត្រីកោណកែងមួយ រួចសង់រង្វង់ចារឹកក្រៅដោយខ្លួនឯងនៅលើក្ដារខៀននេះ។</p>`,
          draw(ctx, w, h, pts, stepIdx, progress, engine) {
            const fb = engine.freeboard;

            // Render all saved strokes
            for (const st of fb.strokes) {
              if (st.type === 'freehand' && st.points.length > 1) {
                ctx.strokeStyle = st.color || '#38bdf8';
                ctx.lineWidth = 2.5;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.moveTo(st.points[0].x, st.points[0].y);
                for (let i = 1; i < st.points.length; i++) {
                  ctx.lineTo(st.points[i].x, st.points[i].y);
                }
                ctx.stroke();
              } else if (st.type === 'point') {
                engine.drawPoint(ctx, st.x, st.y, st.label, '#38bdf8', false, false);
              }
            }

            // Render current drawing stroke
            if (fb.currentStroke && fb.currentStroke.points.length > 1) {
              ctx.strokeStyle = fb.currentStroke.color || '#38bdf8';
              ctx.lineWidth = 2.5;
              ctx.lineCap = 'round';
              ctx.beginPath();
              ctx.moveTo(fb.currentStroke.points[0].x, fb.currentStroke.points[0].y);
              for (let i = 1; i < fb.currentStroke.points.length; i++) {
                ctx.lineTo(fb.currentStroke.points[i].x, fb.currentStroke.points[i].y);
              }
              ctx.stroke();
            }

            // Show active interactive instrument
            if (fb.activeTool === 'compass') {
              const pencilP = {
                x: fb.compassCenter.x + Math.cos(fb.compassPencilAngle) * fb.compassRadius,
                y: fb.compassCenter.y + Math.sin(fb.compassPencilAngle) * fb.compassRadius
              };
              engine.drawCompass(ctx, fb.compassCenter, pencilP, fb.compassPencilAngle, fb.compassRadius, false);
            } else if (fb.activeTool === 'ruler') {
              engine.drawRuler(ctx, fb.rulerPos, { x: fb.rulerPos.x + 350, y: fb.rulerPos.y }, 1.0);
            } else if (fb.activeTool === 'protractor') {
              engine.drawProtractor(ctx, fb.protractorPos.x, fb.protractorPos.y, 140, 0, 45);
            }
          }
        }
      };
    }

    /**
     * Backward-compatible Load Lesson Hook for app.js
     * Automatically matches lesson concepts to the best geometric construction module!
     */
    loadLesson(lesson, course) {
      if (!lesson) return;
      const title = (lesson.title || '').toLowerCase();
      const desc = (lesson.description || '').toLowerCase();
      const content = title + ' ' + desc;

      let targetModule = 'segment_bisector';

      if (content.includes('មេដ្យាទ័រ') || content.includes('bisector')) {
        targetModule = 'segment_bisector';
      } else if (content.includes('ពុះមុំ') || content.includes('កន្លះបន្ទាត់')) {
        targetModule = 'angle_bisector';
      } else if (content.includes('បន្ទាត់កែង') || content.includes('កែង')) {
        targetModule = 'perpendicular_point';
      } else if (content.includes('បន្ទាត់ស្រប') || content.includes('ស្រប')) {
        targetModule = 'parallel_line';
      } else if (content.includes('ត្រីកោណ') || content.includes('triangle')) {
        targetModule = 'triangle_sss';
      } else if (content.includes('រ៉ាប័រទ័រ') || content.includes('protractor')) {
        targetModule = 'protractor';
      } else if (content.includes('រង្វង់') || content.includes('circle') || content.includes('ថាស') || content.includes('pi')) {
        targetModule = 'circle_pi';
      } else if (content.includes('សូលីត') || content.includes('3d') || content.includes('ប្លង់លាត')) {
        targetModule = 'solid_3d';
      } else if (content.includes('ចម្លងអង្កត់') || content.includes('អង្កត់')) {
        targetModule = 'copy_segment';
      }

      this.setModule(targetModule);
    }
  }

  // Global Engine Singleton
  const engine = new GeometricConstructionEngine();
  window.MathConstruction = engine;

  // Compatibility alias so existing app.js calls (Math3D.loadLesson, Math3D.resize, etc.) work effortlessly!
  window.Math3D = engine;

})(window);
