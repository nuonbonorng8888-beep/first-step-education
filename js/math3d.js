/**
 * NGS Education Hub - Interactive 3D Math Explainer Engine
 * Powered by Three.js & WebGL for Flipped Classroom Visual Learning
 * Features:
 * - 12 Procedural 3D Math Visualization Laboratories
 * - Authentic Point-by-Point Synchronized 3D Simulations
 * - Gauss's Visual Proof 3D Dual-Staircase for Arithmetic Sequences
 * - Exponential Towers & Bounded Sequences 3D Laboratories
 * - Interactive Mouse/Touch Orbit & Zoom Controls
 * - Step-by-Step Educational Narration & Khmer Subtitles
 * - Web Speech API Voiceover & Synchronized KaTeX Formula Overlays
 */

class Math3DExplainer {
  constructor() {
    this.container = null;
    this.canvas = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.animId = null;
    this.clock = null;
    
    // State
    this.currentLesson = null;
    this.currentCourse = null;
    this.activePointIndex = 0;
    this.activeStepIndex = 0;
    this.isPlaying = true;
    this.isVoiceEnabled = false; // Voice disabled per user request
    this.is3DMode = true;

    // Orbit control state (touch/mouse orbit & pinch-to-zoom)
    this.isDragging = false;
    this.dragDistance = 0;
    this.touchStartTime = 0;
    this.prevMousePos = { x: 0, y: 0 };
    this.initialPinchDist = null;
    this.initialRadius = null;
    this.cameraRotation = { theta: 0.8, phi: 0.6, radius: 14 };
    this.targetLookAt = null;
    this.resizeObserver = null;
    this.raycaster = null;
    this.mouseVec = null;
    this.clickableObjects = [];

    // Probability & Interactive Experiment State
    this.probState = null;
    this.workbenchState = {};

    // Animated objects container in scene
    this.animGroup = null;
    this.activeSimType = null;
    this.simParams = {};

    // Steps for current point
    this.currentSteps = [];
  }

  init(containerEl) {
    if (!containerEl) return;
    this.container = containerEl;

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded yet');
      return;
    }

    this.setupDOM();
    this.setupThree();
    this.setupEvents();
  }

  setupDOM() {
    let stage = document.getElementById('math-3d-stage');
    if (!stage && this.container) {
      stage = document.createElement('div');
      stage.id = 'math-3d-stage';
      stage.className = 'math-3d-stage';
      stage.innerHTML = `
        <!-- 3D Canvas Viewport (Unobstructed, pure 3D canvas with sleek top HUD) -->
        <div class="math-3d-viewport" id="math-3d-viewport">
          <canvas id="math-3d-canvas"></canvas>
          
          <!-- Minimal Floating Top HUD -->
          <div class="math-3d-floating-hud">
            <div class="math-3d-topbar">
              <div class="math-3d-header-left">
                <span class="math-3d-badge">
                  <span class="pulse-dot"></span>
                  <span>🔬 បន្ទប់ពិសោធន៍ 3D អន្តរកម្ម</span>
                </span>
                <span class="math-3d-point-title" id="math-3d-point-title">ចំណុចទី ១</span>
              </div>

              <div class="math-3d-header-right">
                <button class="m3d-btn-pill" id="btn-3d-play-pause" onclick="Math3D.togglePlay()" title="បិទ/បើក ការបង្វិល 3D">
                  <span id="m3d-play-icon">🔄</span>
                  <span id="m3d-play-text">បង្វិល 3D</span>
                </button>
                <button class="m3d-btn-pill" onclick="Math3D.resetCamera()" title="តម្រង់មុំកាមេរ៉ាដើម">
                  🎯 តម្រង់មុំដើម
                </button>
                <button class="m3d-btn-pill" onclick="Math3D.toggleFullscreen()" title="ពង្រីកពេញអេក្រង់">
                  ⛶ ពេញអេក្រង់
                </button>
              </div>
            </div>

            <!-- Points Selector Track (Sleek Horizontal Pill Bar) -->
            <div class="math-3d-points-bar" id="math-3d-points-bar"></div>

            <!-- Subtle Gesture Tip -->
            <div class="math-3d-tip">
              <span>🖐️ អូសដើម្បីបង្វិល 3D • Pinch/Scroll ដើម្បី Zoom</span>
            </div>
          </div>
        </div>

        <!-- Dedicated Laboratory Control & Narration Deck (Docked cleanly below canvas!) -->
        <div class="math-3d-laboratory-deck" id="math-3d-laboratory-deck">
          <!-- Interactive Laboratory Workbench (Sliders, simulation buttons, stats) -->
          <div class="math-3d-workbench" id="math-3d-workbench"></div>

          <!-- Pedagogical Narration & Formula Console -->
          <div class="math-3d-narration-card" id="math-3d-narration-card">
            <div class="math-3d-step-header">
              <div class="math-3d-step-badges">
                <span class="math-3d-step-badge" id="math-3d-step-badge">ជំហាន ១/៣</span>
                <span class="math-3d-concept-tag" id="math-3d-concept-tag">មូលដ្ឋានគ្រឹះ</span>
              </div>
              <!-- Step Navigation Buttons -->
              <div class="math-3d-step-nav">
                <button class="m3d-btn" onclick="Math3D.prevStep()" title="ជំហានមុន">
                  ⏮️ ជំហានមុន
                </button>
                <button class="m3d-btn primary" onclick="Math3D.nextStep()" title="ជំហានបន្ទាប់">
                  ជំហានបន្ទាប់ ⏭️
                </button>
              </div>
            </div>

            <!-- Khmer Pedagogical Explanation Text -->
            <div class="math-3d-caption-text" id="math-3d-caption-text">
              កំពុងរៀបចំការពិសោធន៍ 3D ពន្យល់ខ្លឹមសារមេរៀន...
            </div>

            <!-- KaTeX Math Formula Box -->
            <div class="math-3d-formula-box" id="math-3d-formula-box"></div>
          </div>
        </div>
      `;

      this.container.appendChild(stage);
    }

    this.canvas = document.getElementById('math-3d-canvas');
  }

  setupThree() {
    if (!this.canvas) return;

    const viewport = document.getElementById('math-3d-viewport') || this.container;
    const width = viewport.clientWidth || this.container.clientWidth || window.innerWidth || 800;
    const height = viewport.clientHeight || 490;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;

    // Auto-resize on container dimensions change (mobile orientation & view switch)
    if (window.ResizeObserver && this.container) {
      if (this.resizeObserver) this.resizeObserver.disconnect();
      this.resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      this.resizeObserver.observe(this.container);
    }

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0f1d);

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.targetLookAt = new THREE.Vector3(0, 0, 0);
    this.updateCameraPosition();

    this.raycaster = new THREE.Raycaster();
    this.mouseVec = new THREE.Vector2();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    this.scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(15, 25, 20);
    this.scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xa855f7, 0.8);
    dirLight2.position.set(-15, -10, -15);
    this.scene.add(dirLight2);

    // Animated group container
    this.animGroup = new THREE.Group();
    this.scene.add(this.animGroup);

    this.clock = new THREE.Clock();

    // Start animation loop
    this.animate = this.animate.bind(this);
    this.animId = requestAnimationFrame(this.animate);
  }

  setupEvents() {
    const viewport = document.getElementById('math-3d-viewport') || document.getElementById('math-3d-stage');
    if (!viewport) return;

    // Mouse drag orbit & click interaction on 3D viewport
    viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.math-3d-laboratory-deck') || e.target.closest('.math-3d-topbar') || e.target.closest('.math-3d-points-bar') || e.target.closest('.math-3d-workbench') || e.target.closest('.m3d-btn-pill')) return;
      this.isDragging = true;
      this.dragDistance = 0;
      this.touchStartTime = Date.now();
      this.prevMousePos = { x: e.clientX, y: e.clientY };
    });

    viewport.addEventListener('click', (e) => {
      if (e.target.closest('.math-3d-laboratory-deck') || e.target.closest('.math-3d-topbar') || e.target.closest('.math-3d-points-bar') || e.target.closest('.math-3d-workbench') || e.target.closest('.m3d-btn-pill')) return;
      if (this.dragDistance < 10) {
        this.handleCanvasRaycast(e.clientX, e.clientY);
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const dx = e.clientX - this.prevMousePos.x;
      const dy = e.clientY - this.prevMousePos.y;
      this.prevMousePos = { x: e.clientX, y: e.clientY };

      this.cameraRotation.theta -= dx * 0.008;
      this.cameraRotation.phi = Math.max(0.1, Math.min(Math.PI / 2 - 0.05, this.cameraRotation.phi + dy * 0.008));
      this.updateCameraPosition();
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    // Touch orbit & pinch-to-zoom for mobile
    viewport.addEventListener('touchstart', (e) => {
      if (e.target.closest('.math-3d-laboratory-deck') || e.target.closest('.math-3d-topbar') || e.target.closest('.math-3d-points-bar') || e.target.closest('.math-3d-workbench') || e.target.closest('.m3d-btn-pill')) return;
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.dragDistance = 0;
        this.touchStartTime = Date.now();
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        this.initialPinchDist = Math.hypot(dx, dy);
        this.initialRadius = this.cameraRotation.radius;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.prevMousePos.x;
        const dy = e.touches[0].clientY - this.prevMousePos.y;
        this.dragDistance += Math.hypot(dx, dy);
        this.prevMousePos = { x: e.touches[0].clientX, y: e.touches[0].clientY };

        this.cameraRotation.theta -= dx * 0.008;
        this.cameraRotation.phi = Math.max(0.05, Math.min(Math.PI / 2 - 0.05, this.cameraRotation.phi + dy * 0.008));
        this.updateCameraPosition();
      } else if (e.touches.length === 2 && this.initialPinchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const factor = this.initialPinchDist / Math.max(dist, 10);
        this.cameraRotation.radius = Math.max(5, Math.min(35, this.initialRadius * factor));
        this.updateCameraPosition();
      }
    }, { passive: true });

    window.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) {
        this.initialPinchDist = null;
      }
      if (e.touches.length === 0) {
        if (this.isDragging && this.dragDistance < 12 && Date.now() - this.touchStartTime < 350) {
          if (this.prevMousePos) {
            this.handleCanvasRaycast(this.prevMousePos.x, this.prevMousePos.y);
          }
        }
        this.isDragging = false;
      }
    });

    // Mouse Wheel zoom
    viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cameraRotation.radius = Math.max(5, Math.min(35, this.cameraRotation.radius + e.deltaY * 0.02));
      this.updateCameraPosition();
    }, { passive: false });

    // Window resize
    window.addEventListener('resize', () => {
      this.resize();
    });
  }

  handleCanvasRaycast(clientX, clientY) {
    if (!this.canvas || !this.camera || !this.raycaster) return;
    const rect = this.canvas.getBoundingClientRect();
    this.mouseVec.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    this.mouseVec.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouseVec, this.camera);
    if (this.clickableObjects && this.clickableObjects.length > 0) {
      const intersects = this.raycaster.intersectObjects(this.clickableObjects, true);
      if (intersects.length > 0) {
        let hit = intersects[0].object;
        while (hit && !hit.userData?.action && hit.parent && hit.parent !== this.scene) {
          hit = hit.parent;
        }
        if (hit?.userData?.action) {
          hit.userData.action();
          return;
        }
      }
    }
    
    // Direct action based on current simulation
    if (this.activeSimType === 'probability_experiment' && this.probState) {
      if (this.probState.mode === 'dice') this.rollDice(1);
      else if (this.probState.mode === 'urn') this.drawBall();
      else if (this.probState.mode === 'coin') this.flipCoin();
    }
  }

  resize() {
    if (!this.container || !this.renderer || !this.camera) return;
    const viewport = document.getElementById('math-3d-viewport') || this.canvas?.parentElement || this.container;
    const w = viewport.clientWidth || this.container.clientWidth || window.innerWidth;
    const h = viewport.clientHeight || 490;
    if (w > 0 && h > 0) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(w, h);
    }
  }

  updateCameraPosition() {
    if (!this.camera) return;
    const r = this.cameraRotation.radius;
    const t = this.cameraRotation.theta;
    const p = this.cameraRotation.phi;

    this.camera.position.x = r * Math.cos(p) * Math.sin(t);
    this.camera.position.y = r * Math.sin(p);
    this.camera.position.z = r * Math.cos(p) * Math.cos(t);
    this.camera.lookAt(this.targetLookAt || new THREE.Vector3(0, 0, 0));
  }

  resetCamera() {
    this.cameraRotation = { theta: 0.8, phi: 0.6, radius: 14 };
    this.updateCameraPosition();
  }

  setMode(mode) {
    this.is3DMode = true;
    const stage = document.getElementById('math-3d-stage');
    if (stage) stage.style.display = 'block';
    setTimeout(() => this.resize(), 40);
  }

  // --------------------------------------------------------------------------
  // Core: Load Lesson & Build Point-by-Point 3D Simulation
  // --------------------------------------------------------------------------
  loadLesson(lesson, course) {
    this.currentLesson = lesson;
    this.currentCourse = course;
    this.activePointIndex = 0;
    this.activeStepIndex = 0;

    // Auto-initialize if container ready but Three scene not yet created
    if (!this.scene && typeof THREE !== 'undefined') {
      const container = this.container || document.getElementById('experiment-stage-container') || document.getElementById('video-container');
      if (container) {
        this.container = container;
        this.setupDOM();
        this.setupThree();
        this.setupEvents();
      }
    }

    this.is3DMode = true;
    const stage = document.getElementById('math-3d-stage');
    if (stage) stage.style.display = 'block';

    this.renderPointPills();
    this.loadActivePointScene();
    setTimeout(() => this.resize(), 50);
    setTimeout(() => this.resize(), 150);
  }

  renderPointPills() {
    const bar = document.getElementById('math-3d-points-bar');
    if (!bar || !this.currentLesson) return;

    let points = this.currentLesson.points;
    if (!points || points.length === 0) {
      const ws = window.App?.worksheets?.[this.currentLesson.id];
      if (ws?.points) points = ws.points;
    }

    if (!points || points.length === 0) {
      points = [{ pointNumber: 1, title: this.currentLesson.title }];
    }

    bar.innerHTML = points.map((p, idx) => `
      <button class="m3d-point-pill ${idx === this.activePointIndex ? 'active' : ''}" 
              onclick="Math3D.selectPoint(${idx})"
              title="${p.pointTitle || p.title || `ចំណុចទី ${idx + 1}`}">
        <span>📍 ចំណុច ${p.pointNumber || (idx + 1)}</span>
        <span class="m3d-pill-label">${(p.pointTitle || p.title || '').replace(/^ចំណុចទី\s*[\d១២៣៤៥៦៧៨៩០]+\s*[៖:]?\s*/, '')}</span>
      </button>
    `).join('');
  }

  selectPoint(index) {
    this.activePointIndex = index;
    this.activeStepIndex = 0;
    this.renderPointPills();
    this.loadActivePointScene();
  }

  clearAnimGroup() {
    if (!this.animGroup) return;
    while (this.animGroup.children.length > 0) {
      const obj = this.animGroup.children[0];
      this.animGroup.remove(obj);
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach(m => m.dispose());
        else obj.material.dispose();
      }
    }
  }

  // --------------------------------------------------------------------------
  // Scene Dispatcher: Chooses specialized 3D math laboratory based on lesson
  // --------------------------------------------------------------------------
  loadActivePointScene() {
    if (!this.scene || !this.animGroup) return;

    this.clearAnimGroup();

    const lessonId = this.currentLesson?.id || '';
    const title = (this.currentLesson?.title || '').toLowerCase();

    // Determine simulation type with strict curriculum-based matching (Grade 7 to 12)
    let simType = 'generic_curve';

    // Exact Lesson ID matches for guaranteed curriculum uniqueness
    // Grade 7 Unique Laboratories
    if (lessonId === 'les-g7-01') {
      simType = 'whole_numbers';
    } else if (lessonId === 'les-g7-02') {
      simType = 'divisors_multiples';
    } else if (lessonId === 'les-g7-03') {
      simType = 'integers_number_line';
    } else if (lessonId === 'les-g7-04') {
      simType = 'fractions_decimals';
    } else if (lessonId === 'les-g7-05') {
      simType = 'decimals_grid';
    } else if (lessonId === 'les-g7-06') {
      simType = 'percentage_cube';
    } else if (lessonId === 'les-g7-07') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g7-08') {
      simType = 'polynomial_factoring';
    } else if (lessonId === 'les-g7-09') {
      simType = 'linear_equation_balance';
    } else if (lessonId === 'les-g7-10') {
      simType = 'inequality_ray';
    } else if (lessonId === 'les-g7-11') {
      simType = 'percentage_cube';
    } else if (lessonId === 'les-g7-12') {
      simType = 'space_geometry';
    } else if (lessonId === 'les-g7-13') {
      simType = 'angles_protractor';
    } else if (lessonId === 'les-g7-14') {
      simType = 'parallel_transversal';
    } else if (lessonId === 'les-g7-15') {
      simType = 'polygon_areas';
    } else if (lessonId === 'les-g7-16') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g7-17') {
      simType = 'circle_inscribed_angle';
    } else if (lessonId === 'les-g7-18') {
      simType = 'space_geometry';
    } else if (lessonId === 'les-g7-19') {
      simType = 'coordinate_plane_graph';
    } else if (lessonId === 'les-g7-20') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g7-21') {
      simType = 'bar_chart_3d';
    } else if (lessonId === 'les-g7-22') {
      simType = 'pie_chart_3d';
    }
    // Grade 8 Unique Laboratories
    else if (lessonId === 'les-g8-01') {
      simType = 'rational_numbers';
    } else if (lessonId === 'les-g8-02') {
      simType = 'powers_exponents';
    } else if (lessonId === 'les-g8-03') {
      simType = 'percentage_cube';
    } else if (lessonId === 'les-g8-04') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g8-05') {
      simType = 'polynomial_factoring';
    } else if (lessonId === 'les-g8-06') {
      simType = 'rational_numbers';
    } else if (lessonId === 'les-g8-07') {
      simType = 'linear_equation_balance';
    } else if (lessonId === 'les-g8-08') {
      simType = 'inequality_ray';
    } else if (lessonId === 'les-g8-09') {
      simType = 'coordinate_plane_graph';
    } else if (lessonId === 'les-g8-10') {
      simType = 'statistics_probability';
    } else if (lessonId === 'les-g8-11') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g8-12') {
      simType = 'parallel_transversal';
    } else if (lessonId === 'les-g8-13') {
      simType = 'polygon_areas';
    } else if (lessonId === 'les-g8-14') {
      simType = 'pythagoras_theorem';
    } else if (lessonId === 'les-g8-15') {
      simType = 'circle_inscribed_angle';
    } else if (lessonId === 'les-g8-16') {
      simType = 'angles_protractor';
    } else if (lessonId === 'les-g8-17') {
      simType = 'space_geometry';
    } else if (lessonId === 'les-g8-18') {
      simType = 'line_slope_intercept';
    }
    // Grade 9 Unique Laboratories
    else if (lessonId === 'les-g9-01') {
      simType = 'irrational_numbers';
    } else if (lessonId === 'les-g9-02') {
      simType = 'linear_equation_balance';
    } else if (lessonId === 'les-g9-03') {
      simType = 'polynomial_factoring';
    } else if (lessonId === 'les-g9-04') {
      simType = 'linear_system_2vars';
    } else if (lessonId === 'les-g9-05') {
      simType = 'inequality_ray';
    } else if (lessonId === 'les-g9-06') {
      simType = 'bar_chart_3d';
    } else if (lessonId === 'les-g9-07') {
      simType = 'statistics_probability';
    } else if (lessonId === 'les-g9-08') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g9-09') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g9-10') {
      simType = 'line_slope_intercept';
    } else if (lessonId === 'les-g9-11') {
      simType = 'linear_system_2vars';
    } else if (lessonId === 'les-g9-12') {
      simType = 'pythagoras_theorem';
    } else if (lessonId === 'les-g9-13') {
      simType = 'circle_inscribed_angle';
    } else if (lessonId === 'les-g9-14') {
      simType = 'angles_protractor';
    } else if (lessonId === 'les-g9-15') {
      simType = 'parallel_transversal';
    } else if (lessonId === 'les-g9-16') {
      simType = 'coordinate_plane_graph';
    } else if (lessonId === 'les-g9-17') {
      simType = 'polygon_areas';
    } else if (lessonId === 'les-g9-18') {
      simType = 'space_geometry';
    }
    // Grade 10 Unique Laboratories
    else if (lessonId === 'les-g10-01') {
      simType = 'parabola_study';
    } else if (lessonId === 'les-g10-02') {
      simType = 'space_geometry';
    } else if (lessonId === 'les-g10-03') {
      simType = 'trigonometry';
    }
    // Grade 11 Basic
    else if (lessonId === 'les-g11b-1-1') {
      simType = 'sequences_series';
    } else if (lessonId === 'les-g11b-1-2') {
      simType = 'arithmetic_sequence';
    } else if (lessonId === 'les-g11b-1-3') {
      simType = 'geometric_sequence';
    } else if (lessonId === 'les-g11b-2-1') {
      simType = 'exponential_log';
    } else if (lessonId === 'les-g11b-2-2') {
      simType = 'powers_exponents';
    } else if (lessonId === 'les-g11b-3-1') {
      simType = 'trigonometry';
    } else if (lessonId === 'les-g11b-3-2') {
      simType = 'circle_inscribed_angle';
    } else if (lessonId === 'les-g11b-3-3') {
      simType = 'angles_protractor';
    } else if (lessonId === 'les-g11b-4-1') {
      simType = 'matrices_determinants';
    } else if (lessonId === 'les-g11b-4-2') {
      simType = 'coordinate_plane_graph';
    } else if (lessonId === 'les-g11b-5-1') {
      simType = 'limits_continuity';
    } else if (lessonId === 'les-g11b-5-2') {
      simType = 'derivatives_tangent';
    } else if (lessonId === 'les-g11b-5-3') {
      simType = 'parabola_study';
    } else if (lessonId === 'les-g11b-5-4') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g11b-6-1') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g11b-7-1') {
      simType = 'bar_chart_3d';
    } else if (lessonId === 'les-g11b-7-2') {
      simType = 'statistics_probability';
    } else if (lessonId === 'les-g11b-7-3') {
      simType = 'pie_chart_3d';
    }
    // Grade 11 Advanced
    else if (lessonId === 'les-g11a-1-1') {
      simType = 'sequences_series';
    } else if (lessonId === 'les-g11a-1-2') {
      simType = 'arithmetic_sequence';
    } else if (lessonId === 'les-g11a-1-3') {
      simType = 'mathematical_induction';
    } else if (lessonId === 'les-g11a-2-1') {
      simType = 'exponential_log';
    } else if (lessonId === 'les-g11a-2-2') {
      simType = 'powers_exponents';
    } else if (lessonId === 'les-g11a-3-1') {
      simType = 'trigonometry';
    } else if (lessonId === 'les-g11a-4-1') {
      simType = 'matrices_determinants';
    } else if (lessonId === 'les-g11a-5-1') {
      simType = 'derivatives_tangent';
    } else if (lessonId === 'les-g11a-6-1') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g11a-7-1') {
      simType = 'complex_numbers';
    } else if (lessonId === 'les-g11a-7-2') {
      simType = 'trigonometry';
    } else if (lessonId === 'les-g11a-7-3') {
      simType = 'complex_roots';
    } else if (lessonId === 'les-g11a-7-4') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g11a-8-1') {
      simType = 'space_geometry';
    } else if (lessonId === 'les-g11a-8-2') {
      simType = 'parallel_transversal';
    }
    // Grade 12 Basic
    else if (lessonId === 'les-g12b-1-1') {
      simType = 'limits_continuity';
    } else if (lessonId === 'les-g12b-1-2') {
      simType = 'continuity_ivt';
    } else if (lessonId === 'les-g12b-2-1') {
      simType = 'derivatives_tangent';
    } else if (lessonId === 'les-g12b-2-2') {
      simType = 'parabola_study';
    } else if (lessonId === 'les-g12b-3-1') {
      simType = 'exponential_log';
    } else if (lessonId === 'les-g12b-3-2') {
      simType = 'powers_exponents';
    } else if (lessonId === 'les-g12b-4-1') {
      simType = 'integrals_volume';
    } else if (lessonId === 'les-g12b-4-2') {
      simType = 'riemann_integral';
    } else if (lessonId === 'les-stat-01') {
      simType = 'bar_chart_3d';
    } else if (lessonId === 'les-stat-02') {
      simType = 'statistics_probability';
    } else if (lessonId === 'les-g12b-6-1') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g12b-6-2') {
      simType = 'pie_chart_3d';
    }
    // Grade 12 Advanced
    else if (lessonId === 'les-g12a-1-1') {
      simType = 'complex_numbers';
    } else if (lessonId === 'les-g12a-1-2') {
      simType = 'complex_roots';
    } else if (lessonId === 'les-g12a-2-1') {
      simType = 'limits_continuity';
    } else if (lessonId === 'les-g12a-2-2') {
      simType = 'continuity_ivt';
    } else if (lessonId === 'les-g12a-3-1') {
      simType = 'derivatives_tangent';
    } else if (lessonId === 'les-g12a-3-2') {
      simType = 'parabola_study';
    } else if (lessonId === 'les-g12a-3-3') {
      simType = 'distance_formula_3d';
    } else if (lessonId === 'les-g12a-4-1') {
      simType = 'integrals_volume';
    } else if (lessonId === 'les-g12a-4-2') {
      simType = 'revolution_solid';
    } else if (lessonId === 'les-g12a-4-3') {
      simType = 'differential_equations';
    } else if (lessonId === 'les-g12a-5-1') {
      simType = 'space_geometry';
    } else if (lessonId === 'les-g12a-5-2') {
      simType = 'parallel_transversal';
    } else if (lessonId === 'les-g12a-6-1') {
      simType = 'parabola_study';
    } else if (lessonId === 'les-g12a-6-2') {
      simType = 'conic_ellipse';
    } else if (lessonId === 'les-g12a-6-3') {
      simType = 'conic_hyperbola';
    } else if (lessonId === 'les-g12a-7-1') {
      simType = 'probability_experiment';
    } else if (lessonId === 'les-g12a-7-2') {
      simType = 'bar_chart_3d';
    }
    // General Fallbacks
    else if (title.includes('កុំផ្លិច')) simType = 'complex_numbers';
    else if (title.includes('លីមីត') || title.includes('ភាពជាប់')) simType = 'limits_continuity';
    else if (title.includes('ត្រីកោណមាត្រ')) simType = 'trigonometry';
    else if (title.includes('ពីតាករ') || title.includes('ពីតាក័រ')) simType = 'pythagoras_theorem';
    else if (title.includes('ប្រព័ន្ធសមីការ')) simType = 'linear_system_2vars';
    else if (title.includes('រង្វង់')) simType = 'circle_inscribed_angle';
    else if (title.includes('ប៉ារ៉ាបូល') || title.includes('delta')) simType = 'parabola_study';
    else if (title.includes('ដេរីវេ')) simType = 'derivatives_tangent';
    else if (title.includes('អាំងតេក្រាល')) simType = 'integrals_volume';
    else if (title.includes('ប្រូបាប')) simType = 'probability_experiment';
    else if (title.includes('ស្ថិតិ')) simType = 'statistics_probability';
    else if (title.includes('អិចស្ប៉ូណង់ស្យែល') || title.includes('លោការីត')) simType = 'exponential_log';
    else if (title.includes('ម៉ាទ្រីស')) simType = 'matrices_determinants';
    else if (title.includes('ស្វ៊ីត')) simType = 'sequences_series';
    else if (title.includes('ទសភាគ')) simType = 'decimals_grid';
    else if (title.includes('ភាគរយ')) simType = 'percentage_cube';
    else if (title.includes('ប្រភាគ')) simType = 'fractions_decimals';

        this.activeSimType = simType;

    // Build the authentic 3D laboratory scene
    switch (simType) {
      case 'rational_numbers':
        this.buildRationalNumbersScene();
        break;
      case 'divisors_multiples':
        this.buildDivisorsMultiplesScene();
        break;
      case 'whole_numbers':
        this.buildWholeNumbersScene();
        break;
      case 'powers_exponents':
        this.buildPowersExponentsScene();
        break;
      case 'inequality_ray':
        this.buildInequalityRayScene();
        break;
      case 'irrational_numbers':
        this.buildIrrationalNumbersScene();
        break;
      case 'line_slope_intercept':
        this.buildLineSlopeInterceptScene();
        break;
      case 'coordinate_plane_graph':
        this.buildCoordinatePlaneGraphScene();
        break;
      case 'distance_formula_3d':
        this.buildDistanceFormulaScene();
        break;
      case 'angles_protractor':
        this.buildAnglesProtractorScene();
        break;
      case 'parallel_transversal':
        this.buildParallelTransversalScene();
        break;
      case 'bar_chart_3d':
        this.buildBarChartScene();
        break;
      case 'pie_chart_3d':
        this.buildPieChartScene();
        break;
      case 'polygon_areas':
        this.buildPolygonAreasScene();
        break;
      case 'integers_number_line':
        this.buildNumberLineScene();
        break;
      case 'fractions_decimals':
        this.buildFractionsScene();
        break;
      case 'decimals_grid':
        this.buildDecimalsGridScene();
        break;
      case 'percentage_cube':
        this.buildPercentageCubeScene();
        break;
      case 'linear_equation_balance':
        this.buildBalanceScaleScene();
        break;
      case 'polynomial_factoring':
        this.buildPolynomialVolumeScene();
        break;
      case 'pythagoras_theorem':
        this.buildPythagorasScene();
        break;
      case 'quadratic_delta':
        this.buildQuadraticDeltaScene();
        break;
      case 'linear_system_2vars':
        this.buildLinearSystemScene();
        break;
      case 'circle_inscribed_angle':
        this.buildCircleAngleScene();
        break;
      case 'parabola_study':
        this.buildParabolaStudyScene();
        break;
      case 'mathematical_induction':
        this.buildInductionScene();
        break;
      case 'arithmetic_sequence':
      case 'sequences_series':
        this.buildArithmeticSequenceScene();
        break;
      case 'geometric_sequence':
        this.buildGeometricSequenceScene();
        break;
      case 'exponential_log':
        this.buildExponentialLogScene();
        break;
      case 'trigonometry':
        this.buildTrigonometryScene();
        break;
      case 'matrices_determinants':
        this.buildMatricesScene();
        break;
      case 'limits_continuity':
      case 'continuity_ivt':
        this.buildLimitsContinuityScene();
        break;
      case 'derivatives_tangent':
        this.buildDerivativesScene();
        break;
      case 'integrals_volume':
      case 'revolution_solid':
      case 'riemann_integral':
        this.buildIntegralsVolumeScene();
        break;
      case 'space_geometry':
        this.buildSpaceGeometryScene();
        break;
      case 'conic_sections':
      case 'conic_ellipse':
      case 'conic_hyperbola':
        this.buildConicSectionsScene();
        break;
      case 'complex_numbers':
      case 'complex_roots':
      case 'complex_polar':
        this.buildComplexNumbersScene();
        break;
      case 'probability_experiment':
        this.buildProbabilityExperimentScene();
        break;
      case 'statistics_probability':
        this.buildStatisticsScene();
        break;
      case 'differential_equations':
        this.buildDifferentialScene();
        break;
      default:
        this.buildGenericFunctionScene();
        break;
    }

    // Load explanation steps for this point
    this.generatePointSteps(simType);
    this.renderCurrentStep();
    this.renderWorkbench();
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 1: Arithmetic Sequences (Gauss's Stepped Pillars & Dual Staircase)
  // --------------------------------------------------------------------------
  buildArithmeticSequenceScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();

    const pIdx = this.activePointIndex; // 0: definition & d, 1: u_n, 2: sum S_n
    const nTerms = 6;
    const u1 = 1.6;
    const d = 0.8;
    const pillars = [];
    const colors = [0x38bdf8, 0x6366f1, 0xa855f7, 0xec4899, 0xf59e0b, 0x10b981];

    // Stepped 3D pillars representing sequence u_n
    for (let i = 0; i < nTerms; i++) {
      const h = u1 + i * d;
      const geo = new THREE.BoxGeometry(0.85, h, 0.85);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i % colors.length],
        metalness: 0.2,
        roughness: 0.3
      });
      const box = new THREE.Mesh(geo, mat);
      const x = (i - (nTerms - 1) / 2) * 1.35;
      box.position.set(x, h / 2, 0);
      this.animGroup.add(box);
      pillars.push(box);

      // Glowing cap on top
      const capGeo = new THREE.BoxGeometry(0.87, 0.1, 0.87);
      const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(x, h + 0.05, 0);
      this.animGroup.add(cap);
    }

    // If Point 3 (Sum S_n): Add complementary inverted staircase to show Gauss's visual proof!
    let dualPillars = [];
    if (pIdx >= 2) {
      for (let i = 0; i < nTerms; i++) {
        const h = u1 + (nTerms - 1 - i) * d; // Inverted height
        const geo = new THREE.BoxGeometry(0.85, h, 0.85);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          transparent: true,
          opacity: 0.7,
          wireframe: false
        });
        const box = new THREE.Mesh(geo, mat);
        const x = (i - (nTerms - 1) / 2) * 1.35;
        const baseY = (u1 + i * d);
        box.position.set(x, baseY + h / 2 + 0.08, 0);
        this.animGroup.add(box);
        dualPillars.push(box);
      }
    }

    // Jumping tracer particle from pillar to pillar
    const ballGeo = new THREE.SphereGeometry(0.25, 16, 16);
    const ballMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8 });
    const tracerBall = new THREE.Mesh(ballGeo, ballMat);
    this.animGroup.add(tracerBall);

    // Delta difference connectors (+d)
    const connectors = [];
    for (let i = 0; i < nTerms - 1; i++) {
      const x1 = (i - (nTerms - 1) / 2) * 1.35;
      const x2 = ((i + 1) - (nTerms - 1) / 2) * 1.35;
      const y1 = u1 + i * d;
      const y2 = u1 + (i + 1) * d;

      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x1 + 0.42, y1, 0),
        new THREE.Vector3(x2 - 0.42, y1, 0),
        new THREE.Vector3(x2 - 0.42, y2, 0)
      ]);
      const lineMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 2 });
      const conn = new THREE.Line(lineGeo, lineMat);
      this.animGroup.add(conn);
      connectors.push(conn);
    }

    this.simParams = {
      mode: 'arithmetic_sequence',
      pillars,
      dualPillars,
      tracerBall,
      nTerms,
      u1,
      d,
      time: 0
    };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 2: Geometric Sequences (Exponential Towers & Ratio Multiplier)
  // --------------------------------------------------------------------------
  buildGeometricSequenceScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();

    const pIdx = this.activePointIndex;
    const nTerms = 5;
    const u1 = 0.8;
    const q = 1.6;
    const pillars = [];
    const colors = [0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xd946ef, 0xf43f5e];

    for (let i = 0; i < nTerms; i++) {
      const h = u1 * Math.pow(q, i);
      const geo = new THREE.CylinderGeometry(0.5, 0.5, h, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: colors[i],
        metalness: 0.3,
        roughness: 0.2
      });
      const cyl = new THREE.Mesh(geo, mat);
      const x = (i - (nTerms - 1) / 2) * 1.6;
      cyl.position.set(x, h / 2, 0);
      this.animGroup.add(cyl);
      pillars.push(cyl);
    }

    // Connecting exponential curved ribbon
    const curvePoints = [];
    for (let i = 0; i < nTerms; i++) {
      const x = (i - (nTerms - 1) / 2) * 1.6;
      const h = u1 * Math.pow(q, i);
      curvePoints.push(new THREE.Vector3(x, h + 0.1, 0));
    }
    const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const curveMat = new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 3 });
    this.animGroup.add(new THREE.Line(curveGeo, curveMat));

    this.simParams = { mode: 'geometric_sequence', pillars, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 3: Exponential & Logarithmic Functions (Inverse Reflection)
  // --------------------------------------------------------------------------
  buildExponentialLogScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;

    // Diagonal mirror line y = x
    const diagGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-4, -4, 0),
      new THREE.Vector3(4, 4, 0)
    ]);
    const diagMat = new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.2, gapSize: 0.1 });
    const diagLine = new THREE.Line(diagGeo, diagMat);
    diagLine.computeLineDistances();
    this.animGroup.add(diagLine);

    // Exponential Curve: y = e^(0.6x)
    if (pIdx === 0 || pIdx >= 2) {
      const expPoints = [];
      for (let x = -3.5; x <= 2.5; x += 0.1) {
        const y = Math.exp(0.6 * x);
        expPoints.push(new THREE.Vector3(x, y, 0));
      }
      const expGeo = new THREE.BufferGeometry().setFromPoints(expPoints);
      const expMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 });
      this.animGroup.add(new THREE.Line(expGeo, expMat));
    }

    // Logarithmic Curve: x = e^(0.6y) => y = ln(x)/0.6
    if (pIdx === 1 || pIdx >= 2) {
      const logPoints = [];
      for (let y = -3.5; y <= 2.5; y += 0.1) {
        const x = Math.exp(0.6 * y);
        logPoints.push(new THREE.Vector3(x, y, 0));
      }
      const logGeo = new THREE.BufferGeometry().setFromPoints(logPoints);
      const logMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3.5 });
      this.animGroup.add(new THREE.Line(logGeo, logMat));
    }

    // Sliding reflection pair points
    const ptGeo = new THREE.SphereGeometry(0.2, 16, 16);
    const ptExp = new THREE.Mesh(ptGeo, new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 }));
    const ptLog = new THREE.Mesh(ptGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706 }));
    this.animGroup.add(ptExp);
    this.animGroup.add(ptLog);

    this.simParams = { mode: 'exponential_log', ptExp, ptLog, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 4: Trigonometry (3D Unit Circle, Helix & Projections)
  // --------------------------------------------------------------------------
  buildTrigonometryScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;

    // 3D Unit Circle
    const circlePoints = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      circlePoints.push(new THREE.Vector3(Math.cos(th) * 3, Math.sin(th) * 3, 0));
    }
    const circleGeo = new THREE.BufferGeometry().setFromPoints(circlePoints);
    const circleMat = new THREE.LineBasicMaterial({ color: 0x64748b, linewidth: 2 });
    this.animGroup.add(new THREE.Line(circleGeo, circleMat));

    // Rotating Radius Arrow
    const radiusArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 3, 0xf43f5e, 0.6, 0.3);
    this.animGroup.add(radiusArrow);

    // Sine line (vertical, green) & Cosine line (horizontal, blue)
    const sinGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(3, 0, 0), new THREE.Vector3(3, 0, 0)]);
    const sinLine = new THREE.Line(sinGeo, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 }));
    this.animGroup.add(sinLine);

    const cosGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(3, 0, 0)]);
    const cosLine = new THREE.Line(cosGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 }));
    this.animGroup.add(cosLine);

    // If Point 2: Add 3D Sine Helix extending into the Z axis!
    if (pIdx === 1) {
      const helixPoints = [];
      for (let t = 0; t <= 12.5; t += 0.1) {
        helixPoints.push(new THREE.Vector3(Math.cos(t) * 3, Math.sin(t) * 3, t * 0.5));
      }
      const helixGeo = new THREE.BufferGeometry().setFromPoints(helixPoints);
      this.animGroup.add(new THREE.Line(helixGeo, new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 3 })));
    }

    this.simParams = { mode: 'trigonometry', radiusArrow, sinLine, cosLine, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 5: Matrices & Determinants (3D Volume Transformation)
  // --------------------------------------------------------------------------
  buildMatricesScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();

    // Original Unit Cube (wireframe)
    const origBoxGeo = new THREE.BoxGeometry(2, 2, 2);
    const origBoxMat = new THREE.MeshBasicMaterial({ color: 0x475569, wireframe: true });
    const origBox = new THREE.Mesh(origBoxGeo, origBoxMat);
    origBox.position.set(1, 1, 1);
    this.animGroup.add(origBox);

    // Transformed Parallelotope
    const transBoxMat = new THREE.MeshStandardMaterial({
      color: 0x6366f1,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide
    });
    const transBox = new THREE.Mesh(origBoxGeo, transBoxMat);
    transBox.position.set(1, 1, 1);
    this.animGroup.add(transBox);

    this.simParams = { mode: 'matrices', transBox, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 6: Space Geometry, Vectors, Planes & Spheres
  // --------------------------------------------------------------------------
  buildSpaceGeometryScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const origin = new THREE.Vector3(0, 0, 0);

    if (pIdx === 0) {
      // Point 1: Vector Cross Product u x v & Parallelogram Area
      const dirU = new THREE.Vector3(3.2, 0.5, 1.2).normalize();
      const dirV = new THREE.Vector3(0.8, 3.0, -1.0).normalize();
      const arrowU = new THREE.ArrowHelper(dirU, origin, 3.8, 0x38bdf8, 0.7, 0.35);
      const arrowV = new THREE.ArrowHelper(dirV, origin, 3.5, 0x10b981, 0.7, 0.35);
      this.animGroup.add(arrowU);
      this.animGroup.add(arrowV);

      const dirW = new THREE.Vector3().crossVectors(dirU, dirV).normalize();
      const arrowW = new THREE.ArrowHelper(dirW, origin, 4.6, 0xf59e0b, 0.9, 0.45);
      this.animGroup.add(arrowW);

      // Shaded parallelogram face spanned by u and v
      const vU = dirU.clone().multiplyScalar(3.8);
      const vV = dirV.clone().multiplyScalar(3.5);
      const vUV = new THREE.Vector3().addVectors(vU, vV);

      const paraGeo = new THREE.BufferGeometry();
      const paraVerts = [
        0, 0, 0,
        vU.x, vU.y, vU.z,
        vUV.x, vUV.y, vUV.z,
        0, 0, 0,
        vUV.x, vUV.y, vUV.z,
        vV.x, vV.y, vV.z
      ];
      paraGeo.setAttribute('position', new THREE.Float32BufferAttribute(paraVerts, 3));
      paraGeo.computeVertexNormals();
      const paraMesh = new THREE.Mesh(paraGeo, new THREE.MeshStandardMaterial({
        color: 0x6366f1,
        transparent: true,
        opacity: 0.4,
        side: THREE.DoubleSide
      }));
      this.animGroup.add(paraMesh);

      this.simParams = { mode: 'space_vectors', arrowW, paraMesh, time: 0 };
    } else if (pIdx === 1) {
      // Point 2: Plane in Space Ax + By + Cz + D = 0
      const normDir = new THREE.Vector3(1, 2, 1.5).normalize();
      const arrowNorm = new THREE.ArrowHelper(normDir, origin, 4, 0xf43f5e, 0.8, 0.4);
      this.animGroup.add(arrowNorm);

      const planeGeo = new THREE.PlaneGeometry(8, 8, 8, 8);
      const planeMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.35,
        wireframe: false,
        side: THREE.DoubleSide
      });
      const plane = new THREE.Mesh(planeGeo, planeMat);
      plane.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normDir);
      this.animGroup.add(plane);

      // Wireframe overlay on plane
      const planeWire = new THREE.Mesh(planeGeo, new THREE.MeshBasicMaterial({ color: 0x93c5fd, wireframe: true }));
      planeWire.quaternion.copy(plane.quaternion);
      this.animGroup.add(planeWire);

      this.simParams = { mode: 'space_plane', plane, arrowNorm, time: 0 };
    } else {
      // Point 3: Sphere in Space (x-a)^2 + (y-b)^2 + (z-c)^2 = R^2
      const center = new THREE.Vector3(0, 2.2, 0);
      const R = 2.4;

      const sphereGeo = new THREE.SphereGeometry(R, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: 0xec4899,
        transparent: true,
        opacity: 0.35,
        roughness: 0.2
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      sphere.position.copy(center);
      this.animGroup.add(sphere);

      const sphereWire = new THREE.Mesh(sphereGeo, new THREE.MeshBasicMaterial({ color: 0xf472b6, wireframe: true }));
      sphereWire.position.copy(center);
      this.animGroup.add(sphereWire);

      // Center point I
      const ptI = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308 }));
      ptI.position.copy(center);
      this.animGroup.add(ptI);

      // Radius vector to surface
      const radiusArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0.5, 0.8).normalize(), center, R, 0xfacc15, 0.5, 0.25);
      this.animGroup.add(radiusArrow);

      this.simParams = { mode: 'space_sphere', sphere, radiusArrow, time: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 7: Conic Sections (Double Cone & Slicing Planes)
  // --------------------------------------------------------------------------
  buildConicSectionsScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;

    // Double Cone
    const coneGeo = new THREE.ConeGeometry(3.5, 5, 32, 1, true);
    const coneMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    const upperCone = new THREE.Mesh(coneGeo, coneMat);
    upperCone.position.y = 2.5;
    this.animGroup.add(upperCone);

    const lowerCone = new THREE.Mesh(coneGeo, coneMat);
    lowerCone.position.y = -2.5;
    lowerCone.rotation.x = Math.PI;
    this.animGroup.add(lowerCone);

    const title = (this.currentLesson?.title || '').toLowerCase();
    const isHyperbola = this.activeSimType === 'conic_hyperbola' || title.includes('អ៊ីពែបូល') || this.currentLesson?.id === 'les-g12a-6-3';
    const isEllipse = this.activeSimType === 'conic_ellipse' || title.includes('អេលីប') || this.currentLesson?.id === 'les-g12a-6-2';

    if (isHyperbola || (!isEllipse && pIdx >= 2)) {
      // Point 3: Hyperbola (Vertical slice cutting both cones)
      const sliceGeo = new THREE.PlaneGeometry(7, 9);
      const sliceMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
      const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
      slicePlane.position.set(0, 0, 1.2);
      this.animGroup.add(slicePlane);

      // Upper branch
      const upPts = [];
      for (let y = 1.3; y <= 4.5; y += 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        upPts.push(new THREE.Vector3(-x, y, 1.2));
      }
      for (let y = 4.5; y >= 1.3; y -= 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        upPts.push(new THREE.Vector3(x, y, 1.2));
      }
      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(upPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 })
      ));

      // Lower branch
      const lowPts = [];
      for (let y = -1.3; y >= -4.5; y -= 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        lowPts.push(new THREE.Vector3(-x, y, 1.2));
      }
      for (let y = -4.5; y <= -1.3; y += 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        lowPts.push(new THREE.Vector3(x, y, 1.2));
      }
      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(lowPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 })
      ));

      this.simParams = { mode: 'conic_hyperbola', slicePlane, time: 0 };
    } else if (isEllipse || pIdx === 1) {
      // Point 2: Ellipse (Oblique slice cutting one cone completely)
      const sliceGeo = new THREE.PlaneGeometry(7.5, 7.5);
      const sliceMat = new THREE.MeshStandardMaterial({ color: 0x10b981, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
      const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
      slicePlane.position.y = 2.2;
      slicePlane.rotation.x = 0.35;
      this.animGroup.add(slicePlane);

      const ellipsePts = [];
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        const x = Math.cos(th) * 2.2;
        const z = Math.sin(th) * 1.5;
        const y = 2.2 - z * Math.sin(0.35);
        ellipsePts.push(new THREE.Vector3(x, y, z));
      }
      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ellipsePts),
        new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 3.5 })
      ));

      // Two foci F1 and F2
      const fGeo = new THREE.SphereGeometry(0.16, 16, 16);
      const fMat = new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xd97706 });
      const f1 = new THREE.Mesh(fGeo, fMat);
      f1.position.set(-1.2, 2.2, 0);
      const f2 = new THREE.Mesh(fGeo, fMat);
      f2.position.set(1.2, 2.2, 0);
      this.animGroup.add(f1);
      this.animGroup.add(f2);

      this.simParams = { mode: 'conic_ellipse', slicePlane, time: 0 };
    } else {
      // Point 3: Hyperbola (Vertical slice cutting both cones)
      const sliceGeo = new THREE.PlaneGeometry(7, 9);
      const sliceMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
      const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
      slicePlane.position.set(0, 0, 1.2);
      this.animGroup.add(slicePlane);

      // Upper branch
      const upPts = [];
      for (let y = 1.3; y <= 4.5; y += 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        upPts.push(new THREE.Vector3(-x, y, 1.2));
      }
      for (let y = 4.5; y >= 1.3; y -= 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        upPts.push(new THREE.Vector3(x, y, 1.2));
      }
      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(upPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 })
      ));

      // Lower branch
      const lowPts = [];
      for (let y = -1.3; y >= -4.5; y -= 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        lowPts.push(new THREE.Vector3(-x, y, 1.2));
      }
      for (let y = -4.5; y <= -1.3; y += 0.15) {
        const x = Math.sqrt(Math.max(0, Math.pow(y * 0.7, 2) - 1.2));
        lowPts.push(new THREE.Vector3(x, y, 1.2));
      }
      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(lowPts),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 })
      ));

      this.simParams = { mode: 'conic_hyperbola', slicePlane, time: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 8: Limits & Continuity (Synchronized to Points)
  // --------------------------------------------------------------------------
  buildLimitsContinuityScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const isContinuity = this.activeSimType === 'continuity_ivt' ||
                         (this.currentLesson?.title || '').includes('ភាពជាប់') || 
                         (this.currentLesson?.id || '').includes('1-2') || 
                         (this.currentLesson?.id || '').includes('2-2');

    if (isContinuity) {
      if (pIdx === 0) {
        // Point 1: Continuity at a Point x0
        const points = [];
        for (let x = -3.5; x <= 3.5; x += 0.08) {
          const y = 0.15 * Math.pow(x, 3) - 0.6 * x + 1.2;
          points.push(new THREE.Vector3(x, y, 0));
        }
        const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
        const curve = new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 }));
        this.animGroup.add(curve);

        const targetX = 1.0;
        const targetY = 0.15 * Math.pow(targetX, 3) - 0.6 * targetX + 1.2;

        // Glowing target sphere at (x0, f(x0))
        const sphereGeo = new THREE.SphereGeometry(0.22, 24, 24);
        const sphereMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, roughness: 0.2 });
        const targetPoint = new THREE.Mesh(sphereGeo, sphereMat);
        targetPoint.position.set(targetX, targetY, 0);
        this.animGroup.add(targetPoint);

        // Dashed lines down to x-axis and across to y-axis
        const dropLineX = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(targetX, 0, 0), new THREE.Vector3(targetX, targetY, 0)]),
          new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 })
        );
        dropLineX.computeLineDistances();
        this.animGroup.add(dropLineX);

        const dropLineY = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, targetY, 0), new THREE.Vector3(targetX, targetY, 0)]),
          new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 })
        );
        dropLineY.computeLineDistances();
        this.animGroup.add(dropLineY);

        // Converging Left & Right Tracer Balls
        const ballGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const leftBall = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x2563eb }));
        const rightBall = new THREE.Mesh(ballGeo, new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669 }));
        this.animGroup.add(leftBall);
        this.animGroup.add(rightBall);

        this.simParams = { mode: 'continuity_point', targetX, targetY, targetPoint, leftBall, rightBall, time: 0 };
      } else if (pIdx === 1) {
        // Point 2: Continuity on Interval [a, b] & Removable Discontinuity
        const a = -2.5, b = 2.5;
        const curvePoints = [];
        const ribbonVertices = [];
        for (let x = a; x <= b; x += 0.1) {
          const y = Math.sin(x * 1.1) * 1.5 + 2.0;
          curvePoints.push(new THREE.Vector3(x, y, 0));
          ribbonVertices.push(x, 0, 0);
          ribbonVertices.push(x, y, 0);
        }

        // Beautiful shaded translucent ribbon under curve over [a, b]
        const ribbonGeo = new THREE.BufferGeometry();
        const indices = [];
        const nSteps = curvePoints.length;
        for (let i = 0; i < nSteps - 1; i++) {
          const i1 = i * 2, i2 = i * 2 + 1, i3 = (i + 1) * 2, i4 = (i + 1) * 2 + 1;
          indices.push(i1, i2, i3);
          indices.push(i2, i4, i3);
        }
        ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(ribbonVertices, 3));
        ribbonGeo.setIndex(indices);
        ribbonGeo.computeVertexNormals();

        const ribbonMat = new THREE.MeshStandardMaterial({
          color: 0x6366f1,
          transparent: true,
          opacity: 0.35,
          side: THREE.DoubleSide
        });
        this.animGroup.add(new THREE.Mesh(ribbonGeo, ribbonMat));

        // Outline curve
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        this.animGroup.add(new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ color: 0x818cf8, linewidth: 3 })));

        // Boundary planes at x = a and x = b
        const wallMat = new THREE.MeshStandardMaterial({ color: 0xec4899, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        const wallA = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 3.5), wallMat);
        wallA.position.set(a, 1.75, 0);
        this.animGroup.add(wallA);

        const wallB = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 3.5), wallMat);
        wallB.position.set(b, 1.75, 0);
        this.animGroup.add(wallB);

        // Smooth sweeping inspector ball along [a, b]
        const inspectorBall = new THREE.Mesh(
          new THREE.SphereGeometry(0.2, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0xeab308 })
        );
        this.animGroup.add(inspectorBall);

        this.simParams = { mode: 'continuity_interval', a, b, inspectorBall, time: 0 };
      } else {
        // Point 3: Intermediate Value Theorem (IVT)
        // Curve crossing y = 0 between a and b: f(a) < 0 and f(b) > 0
        const a = -2.5, b = 2.5;
        const curvePoints = [];
        for (let x = -3.2; x <= 3.2; x += 0.08) {
          const y = 0.3 * Math.pow(x, 3) - 0.4 * x - 0.3;
          curvePoints.push(new THREE.Vector3(x, y, 0));
        }
        const curveGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
        this.animGroup.add(new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })));

        // Translucent Horizontal Intersecting Plane at y = 0
        const sliceGeo = new THREE.PlaneGeometry(7.5, 4.5);
        const sliceMat = new THREE.MeshStandardMaterial({
          color: 0x10b981,
          transparent: true,
          opacity: 0.28,
          side: THREE.DoubleSide
        });
        const slicePlane = new THREE.Mesh(sliceGeo, sliceMat);
        slicePlane.rotation.x = Math.PI / 2;
        this.animGroup.add(slicePlane);

        // Endpoints A(a, f(a)) and B(b, f(b))
        const yA = 0.3 * Math.pow(a, 3) - 0.4 * a - 0.3;
        const yB = 0.3 * Math.pow(b, 3) - 0.4 * b - 0.3;

        const ptGeo = new THREE.SphereGeometry(0.18, 16, 16);
        const ptA = new THREE.Mesh(ptGeo, new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c }));
        ptA.position.set(a, yA, 0);
        this.animGroup.add(ptA);

        const ptB = new THREE.Mesh(ptGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x1d4ed8 }));
        ptB.position.set(b, yB, 0);
        this.animGroup.add(ptB);

        // Root Point C(c, 0) where curve pierces plane y = 0
        const c = 1.35;
        const rootJewel = new THREE.Mesh(
          new THREE.OctahedronGeometry(0.3, 0),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706, roughness: 0.1 })
        );
        rootJewel.position.set(c, 0, 0);
        this.animGroup.add(rootJewel);

        // Vertical glowing ray piercing the root
        const rayGeo = new THREE.CylinderGeometry(0.04, 0.04, 3, 16);
        const rayMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.8 });
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.position.set(c, 0, 0);
        this.animGroup.add(ray);

        this.simParams = { mode: 'continuity_ivt', rootJewel, ray, time: 0 };
      }
    } else {
      // Limits lessons (e.g. les-g12b-1-1 or les-g12a-2-1)
      if (pIdx === 0) {
        // Point 1: Definition of Limit
        const points = [];
        for (let x = -4; x <= 4; x += 0.1) {
          const y = Math.sin(x * 1.2) * 1.8 + Math.cos(x * 0.5) * 0.8;
          points.push(new THREE.Vector3(x, y, 0));
        }
        this.animGroup.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })
        ));

        const targetX = 1.0;
        const targetY = Math.sin(targetX * 1.2) * 1.8 + Math.cos(targetX * 0.5) * 0.8;
        const targetMarker = new THREE.Mesh(
          new THREE.SphereGeometry(0.18, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 })
        );
        targetMarker.position.set(targetX, targetY, 0);
        this.animGroup.add(targetMarker);

        const leftBall = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 0x3b82f6 }));
        const rightBall = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        this.animGroup.add(leftBall);
        this.animGroup.add(rightBall);

        this.simParams = { mode: 'limit_converge', leftBall, rightBall, targetX, targetY, time: 0 };
      } else if (pIdx === 1) {
        // Point 2: Indeterminate Form 0/0 & Factorization
        const linePts = [new THREE.Vector3(-3, -2, 0), new THREE.Vector3(3, 4, 0)];
        this.animGroup.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(linePts),
          new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })
        ));

        // Removable hole ring at (1, 2)
        const holeRing = new THREE.Mesh(
          new THREE.RingGeometry(0.15, 0.28, 24),
          new THREE.MeshBasicMaterial({ color: 0xef4444, side: THREE.DoubleSide })
        );
        holeRing.position.set(1, 2, 0);
        this.animGroup.add(holeRing);

        const plug = new THREE.Mesh(
          new THREE.CircleGeometry(0.15, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide })
        );
        plug.position.set(1, 2, 0);
        this.animGroup.add(plug);

        this.simParams = { mode: 'limit_zero_over_zero', holeRing, plug, time: 0 };
      } else if (pIdx === 2) {
        // Point 3: Radical Conjugates
        const points = [];
        for (let x = -2.9; x <= 4; x += 0.1) {
          points.push(new THREE.Vector3(x, Math.sqrt(x + 3) * 1.2 - 1, 0));
        }
        this.animGroup.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(points),
          new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 3 })
        ));
        const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
        this.animGroup.add(tracer);
        this.simParams = { mode: 'limit_radical', tracer, time: 0 };
      } else {
        // Point 4: Limits at Infinity & Asymptotes
        const asymPlane = new THREE.Mesh(
          new THREE.PlaneGeometry(8, 0.04),
          new THREE.MeshBasicMaterial({ color: 0xf43f5e })
        );
        asymPlane.position.set(0, 2, 0);
        this.animGroup.add(asymPlane);

        const curvePts = [];
        for (let x = 0.3; x <= 4.5; x += 0.1) {
          curvePts.push(new THREE.Vector3(x, 2 - 1.5 / x, 0));
        }
        this.animGroup.add(new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curvePts),
          new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })
        ));
        const asymTracer = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
        this.animGroup.add(asymTracer);
        this.simParams = { mode: 'limit_infinity', asymTracer, time: 0 };
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 9: Derivatives & Moving Tangent Vector
  // --------------------------------------------------------------------------
  buildDerivativesScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;

    const points = [];
    for (let x = -3.5; x <= 3.5; x += 0.08) {
      const y = 0.12 * x * (x * x - 6.25);
      points.push(new THREE.Vector3(x, y, 0));
    }
    const curveGeo = new THREE.BufferGeometry().setFromPoints(points);
    this.animGroup.add(new THREE.Line(curveGeo, new THREE.LineBasicMaterial({ color: 0xa855f7, linewidth: 3 })));

    if (pIdx === 0) {
      // Point 1: Moving tangent line and derivative at point
      const tanLineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-1.8, 0, 0),
        new THREE.Vector3(1.8, 0, 0)
      ]);
      const tangentLine = new THREE.Line(tanLineGeo, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 }));
      this.animGroup.add(tangentLine);

      const contactPoint = new THREE.Mesh(
        new THREE.SphereGeometry(0.2, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 })
      );
      this.animGroup.add(contactPoint);

      const tanArrow = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 1.8, 0x10b981, 0.4, 0.2);
      this.animGroup.add(tanArrow);

      this.simParams = { mode: 'deriv_tangent', tangentLine, contactPoint, tanArrow, time: 0 };
    } else if (pIdx === 1) {
      // Point 2: Extrema & Critical Points (f'(x) = 0)
      const xMax = -1.443;
      const yMax = 0.12 * xMax * (xMax * xMax - 6.25);
      const xMin = 1.443;
      const yMin = 0.12 * xMin * (xMin * xMin - 6.25);

      const maxTan = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xMax - 1.5, yMax, 0), new THREE.Vector3(xMax + 1.5, yMax, 0)]),
        new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })
      );
      this.animGroup.add(maxTan);

      const minTan = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(xMin - 1.5, yMin, 0), new THREE.Vector3(xMin + 1.5, yMin, 0)]),
        new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 3 })
      );
      this.animGroup.add(minTan);

      const maxMarker = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x059669 }));
      maxMarker.position.set(xMax, yMax, 0);
      this.animGroup.add(maxMarker);

      const minMarker = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c }));
      minMarker.position.set(xMin, yMin, 0);
      this.animGroup.add(minMarker);

      this.simParams = { mode: 'deriv_extrema', maxMarker, minMarker, time: 0 };
    } else {
      // Point 3: Inflection Point (f''(x) = 0) & Concavity
      const inflectMarker = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.26, 0),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706 })
      );
      inflectMarker.position.set(0, 0, 0);
      this.animGroup.add(inflectMarker);

      const infTan = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-2, 1.5, 0), new THREE.Vector3(2, -1.5, 0)]),
        new THREE.LineDashedMaterial({ color: 0xfacc15, dashSize: 0.2, gapSize: 0.1 })
      );
      infTan.computeLineDistances();
      this.animGroup.add(infTan);

      this.simParams = { mode: 'deriv_inflection', inflectMarker, time: 0 };
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 10: Integrals & Solid of Revolution
  // --------------------------------------------------------------------------
  buildIntegralsVolumeScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();
    let pIdx = this.activePointIndex;
    if (this.activeSimType === 'revolution_solid') {
      pIdx = 2;
    } else if (this.activeSimType === 'riemann_integral') {
      pIdx = 1;
    }

    if (pIdx === 0) {
      // Point 1: Family of Antiderivatives F(x) + C
      const colors = [0x38bdf8, 0x10b981, 0xf59e0b];
      const offsets = [-1.4, 0, 1.4];
      const curves = [];
      offsets.forEach((cVal, idx) => {
        const pts = [];
        for (let x = -3; x <= 3; x += 0.1) {
          const y = 0.2 * Math.pow(x, 3) / 3 + 0.3 * x + cVal;
          pts.push(new THREE.Vector3(x, y, 0));
        }
        const line = new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pts),
          new THREE.LineBasicMaterial({ color: colors[idx], linewidth: 2.5 })
        );
        this.animGroup.add(line);
        curves.push(line);
      });
      this.simParams = { mode: 'integral_family', curves, time: 0 };
    } else if (pIdx === 1) {
      // Point 2: Definite Integral & Area under Curve (Riemann Prisms)
      const a = -2.0, b = 2.0;
      const nBars = 8;
      const dx = (b - a) / nBars;
      const prisms = [];
      for (let i = 0; i < nBars; i++) {
        const xMid = a + (i + 0.5) * dx;
        const h = Math.sin(xMid * 0.8) * 0.8 + 1.8;
        const geo = new THREE.BoxGeometry(dx * 0.9, h, 0.6);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.6,
          metalness: 0.2
        });
        const box = new THREE.Mesh(geo, mat);
        box.position.set(xMid, h / 2, 0);
        this.animGroup.add(box);
        prisms.push(box);
      }

      const pts = [];
      for (let x = -3; x <= 3; x += 0.08) {
        pts.push(new THREE.Vector3(x, Math.sin(x * 0.8) * 0.8 + 1.8, 0));
      }
      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts),
        new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 })
      ));

      this.simParams = { mode: 'integral_riemann', prisms, time: 0 };
    } else {
      // Point 3: Solid of Revolution 3D (Lathe Geometry + Slicing Disk)
      const points = [];
      for (let i = 0; i <= 20; i++) {
        const x = (i / 20) * 3.5;
        const y = Math.sqrt(x + 0.5) * 0.9;
        points.push(new THREE.Vector2(y, x));
      }

      const latheGeo = new THREE.LatheGeometry(points, 32);
      const latheMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.45,
        side: THREE.DoubleSide
      });
      const solid = new THREE.Mesh(latheGeo, latheMat);
      solid.rotation.z = -Math.PI / 2;
      this.animGroup.add(solid);

      const discGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.25, 24);
      const disc = new THREE.Mesh(discGeo, new THREE.MeshStandardMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.7 }));
      disc.rotation.z = Math.PI / 2;
      disc.position.x = 1.2;
      this.animGroup.add(disc);

      this.simParams = { mode: 'integral_revolution', solid, disc, discX: 0.5 };
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory 11: Complex Numbers (Argand Plane, Polar & Roots of Unity)
  // --------------------------------------------------------------------------
  buildComplexNumbersScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();
    let pIdx = this.activePointIndex;
    if (this.activeSimType === 'complex_roots') {
      pIdx = 2;
    } else if (this.activeSimType === 'complex_polar') {
      pIdx = 1;
    }
    const origin = new THREE.Vector3(0, 0, 0);

    if (pIdx === 0) {
      // Point 1: Cartesian Form z = a + bi
      const a = 2.8, b = 2.1;
      const zPt = new THREE.Vector3(a, b, 0);

      const arrowZ = new THREE.ArrowHelper(zPt.clone().normalize(), origin, zPt.length(), 0x38bdf8, 0.7, 0.35);
      this.animGroup.add(arrowZ);

      const dropA = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(a, 0, 0), zPt]),
        new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 })
      );
      dropA.computeLineDistances();
      this.animGroup.add(dropA);

      const dropB = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, b, 0), zPt]),
        new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 })
      );
      dropB.computeLineDistances();
      this.animGroup.add(dropB);

      const ptMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xd97706 }));
      ptMesh.position.copy(zPt);
      this.animGroup.add(ptMesh);

      this.simParams = { mode: 'complex_cartesian', ptMesh, arrowZ, time: 0 };
    } else if (pIdx === 1) {
      // Point 2: Trigonometric / Polar Form r(cosθ + i sinθ)
      const R = 3.0;
      const circlePts = [];
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(Math.cos(th) * R, Math.sin(th) * R, 0));
      }
      this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), new THREE.LineBasicMaterial({ color: 0x475569 })));

      const arrowZ = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), origin, R, 0x10b981, 0.6, 0.3);
      this.animGroup.add(arrowZ);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 }));
      this.animGroup.add(head);

      this.simParams = { mode: 'complex_polar', arrowZ, head, R, time: 0 };
    } else {
      // Point 3: n-th Roots of Unity & De Moivre's Theorem (Regular Polygon)
      const n = 5;
      const R = 3.0;
      const polyPts = [];
      const rootSpheres = [];

      for (let k = 0; k < n; k++) {
        const th = (2 * Math.PI * k) / n;
        const x = Math.cos(th) * R;
        const y = Math.sin(th) * R;
        polyPts.push(new THREE.Vector3(x, y, 0));

        const sphere = new THREE.Mesh(
          new THREE.SphereGeometry(0.22, 16, 16),
          new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0xb45309 })
        );
        sphere.position.set(x, y, 0);
        this.animGroup.add(sphere);
        rootSpheres.push(sphere);
      }
      polyPts.push(polyPts[0]);

      this.animGroup.add(new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(polyPts),
        new THREE.LineBasicMaterial({ color: 0x818cf8, linewidth: 3 })
      ));

      const circlePts = [];
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        circlePts.push(new THREE.Vector3(Math.cos(th) * R, Math.sin(th) * R, 0));
      }
      this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circlePts), new THREE.LineBasicMaterial({ color: 0x334155 })));

      this.simParams = { mode: 'complex_roots', rootSpheres, R, n, time: 0 };
    }
  }

  // ==========================================================================
  // 3D Laboratory: Interactive Probability & Random Experiments (ប្រូបាបជាក់ស្តែង)
  // Real-time 3D Physics Rolling Dice, Urn Ball Draw, and Coin Toss Laboratories
  // ==========================================================================
  createDiceTexture(pipCount) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Ivory finish with rounded corners
    ctx.fillStyle = '#faf7f2';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle shaded inner border
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, 242, 242);

    function drawDot(x, y, r = 24, isRed = false) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = isRed ? '#ef4444' : '#1e293b';
      ctx.shadowColor = isRed ? 'rgba(239, 68, 68, 0.45)' : 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 3;
      ctx.fill();
      ctx.restore();
    }

    if (pipCount === 1) {
      drawDot(128, 128, 38, true); // Red centerpiece pip
    } else if (pipCount === 2) {
      drawDot(72, 72);
      drawDot(184, 184);
    } else if (pipCount === 3) {
      drawDot(68, 68);
      drawDot(128, 128);
      drawDot(188, 188);
    } else if (pipCount === 4) {
      drawDot(72, 72);
      drawDot(184, 72);
      drawDot(72, 184);
      drawDot(184, 184);
    } else if (pipCount === 5) {
      drawDot(72, 72);
      drawDot(184, 72);
      drawDot(128, 128);
      drawDot(72, 184);
      drawDot(184, 184);
    } else if (pipCount === 6) {
      drawDot(72, 60);
      drawDot(184, 60);
      drawDot(72, 128);
      drawDot(184, 128);
      drawDot(72, 196);
      drawDot(184, 196);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
  }

  buildProbabilityExperimentScene() {


    this.clearAnimGroup();
    this.clickableObjects = [];

    // 1. Casino / Lab Emerald Table
    const tableGeo = new THREE.CylinderGeometry(9.2, 9.5, 0.5, 48);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x064e3b, // Rich Emerald felt
      roughness: 0.85,
      metalness: 0.1
    });
    const table = new THREE.Mesh(tableGeo, tableMat);
    table.position.y = -0.25;
    this.animGroup.add(table);

    // Mahogany polished rim
    const rimGeo = new THREE.TorusGeometry(9.3, 0.45, 16, 48);
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x581c1c,
      roughness: 0.3,
      metalness: 0.4
    });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.05;
    this.animGroup.add(rim);

    // Probability circular grid lines on table
    for (let r = 2.5; r <= 7.5; r += 2.5) {
      const ringPts = [];
      for (let i = 0; i <= 64; i++) {
        const th = (i / 64) * Math.PI * 2;
        ringPts.push(new THREE.Vector3(Math.cos(th) * r, 0.02, Math.sin(th) * r));
      }
      const ring = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(ringPts),
        new THREE.LineBasicMaterial({ color: 0x059669, transparent: true, opacity: 0.45 })
      );
      this.animGroup.add(ring);
    }

    // 2. 3D Dice Mesh (BoxGeometry 1.8 x 1.8 x 1.8 with 6 Canvas textures)
    const diceGeo = new THREE.BoxGeometry(1.8, 1.8, 1.8);
    const diceMats = [
      new THREE.MeshStandardMaterial({ map: this.createDiceTexture(3), roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceTexture(4), roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceTexture(2), roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceTexture(5), roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceTexture(1), roughness: 0.2 }),
      new THREE.MeshStandardMaterial({ map: this.createDiceTexture(6), roughness: 0.2 })
    ];
    this.diceMesh = new THREE.Mesh(diceGeo, diceMats);
    this.diceMesh.position.set(0, 0.9, 0.5);
    this.diceMesh.castShadow = true;
    this.diceMesh.userData = { action: () => this.rollDice(1) };
    this.animGroup.add(this.diceMesh);
    this.clickableObjects.push(this.diceMesh);

    // 3. 6 Live 3D Histogram Pillars on Table (representing outcomes 1 to 6)
    const pillarColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0x8b5cf6, 0x06b6d4];
    this.dicePillars = [];
    this.targetPillarHeights = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15];

    const startX = -4.2;
    const spacing = 1.7;
    for (let i = 0; i < 6; i++) {
      const pGroup = new THREE.Group();
      const pGeo = new THREE.BoxGeometry(0.85, 1, 0.85);
      const pMat = new THREE.MeshStandardMaterial({
        color: pillarColors[i],
        transparent: true,
        opacity: 0.85,
        roughness: 0.2,
        metalness: 0.3
      });
      const pBox = new THREE.Mesh(pGeo, pMat);
      pBox.position.set(0, 0.5, 0);
      pGroup.add(pBox);

      // Top glowing indicator
      const capGeo = new THREE.BoxGeometry(0.9, 0.08, 0.9);
      const capMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(0, 1.04, 0);
      pGroup.add(cap);

      pGroup.position.set(startX + i * spacing, 0, -4.2);
      pGroup.scale.set(1, 0.15, 1);
      this.animGroup.add(pGroup);
      this.dicePillars.push(pGroup);
    }

    // Theoretical benchmark line beam at expected 1/6 height
    const benchGeo = new THREE.CylinderGeometry(0.04, 0.04, 10.5, 16);
    const benchMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
    this.benchLine = new THREE.Mesh(benchGeo, benchMat);
    this.benchLine.rotation.z = Math.PI / 2;
    this.benchLine.position.set(0, 0.8, -4.2);
    this.animGroup.add(this.benchLine);

    // 4. 3D Transparent Urn Group (for Urn mode)
    this.urnGroup = new THREE.Group();
    this.urnGroup.position.set(0, 0, 0);
    this.urnGroup.visible = false;

    // Glass Jar
    const jarGeo = new THREE.CylinderGeometry(2.3, 2.1, 3.2, 32, 1, true);
    const jarMat = new THREE.MeshStandardMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const jar = new THREE.Mesh(jarGeo, jarMat);
    jar.position.y = 1.6;
    this.urnGroup.add(jar);

    // Jar Base
    const baseGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.2, 32);
    const jarBase = new THREE.Mesh(baseGeo, jarMat);
    jarBase.position.y = 0.1;
    this.urnGroup.add(jarBase);

    // 12 Colored Balls (5 Red, 4 Blue, 3 Green) inside urn
    this.urnBallMeshes = [];
    const ballColors = [
      ...Array(5).fill({ color: 0xef4444, type: 'red' }),
      ...Array(4).fill({ color: 0x3b82f6, type: 'blue' }),
      ...Array(3).fill({ color: 0x10b981, type: 'green' })
    ];

    ballColors.forEach((bInfo, idx) => {
      const bGeo = new THREE.SphereGeometry(0.38, 20, 20);
      const bMat = new THREE.MeshStandardMaterial({
        color: bInfo.color,
        roughness: 0.25,
        metalness: 0.35,
        emissive: bInfo.color,
        emissiveIntensity: 0.15
      });
      const bMesh = new THREE.Mesh(bGeo, bMat);

      // Layered layout inside jar
      const layer = Math.floor(idx / 4);
      const posInLayer = idx % 4;
      const angle = (posInLayer / 4) * Math.PI * 2 + layer * 0.5;
      const r = 1.1;
      bMesh.position.set(Math.cos(angle) * r, 0.5 + layer * 0.75, Math.sin(angle) * r);
      bMesh.userData = { type: bInfo.type, origPos: bMesh.position.clone() };
      this.urnGroup.add(bMesh);
      this.urnBallMeshes.push(bMesh);
    });

    this.urnGroup.userData = { action: () => this.drawBall() };
    this.animGroup.add(this.urnGroup);
    this.clickableObjects.push(this.urnGroup);

    // 5. 3D Gold Coin (for Coin mode)
    this.coinMesh = new THREE.Group();
    const coinBodyGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.18, 36);
    const coinMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.2
    });
    const coinBody = new THREE.Mesh(coinBodyGeo, coinMat);
    this.coinMesh.add(coinBody);

    const coinRingGeo = new THREE.TorusGeometry(1.4, 0.08, 12, 36);
    const coinRingMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.2 });
    const coinRing = new THREE.Mesh(coinRingGeo, coinRingMat);
    coinRing.rotation.x = Math.PI / 2;
    this.coinMesh.add(coinRing);

    this.coinMesh.position.set(0, 0.1, 0.5);
    this.coinMesh.visible = false;
    this.coinMesh.userData = { action: () => this.flipCoin() };
    this.animGroup.add(this.coinMesh);
    this.clickableObjects.push(this.coinMesh);

    // State initialization
    this.probState = {
      mode: 'dice', // 'dice' | 'urn' | 'coin'
      totalRolls: 0,
      counts: [0, 0, 0, 0, 0, 0],
      lastOutcome: null,
      isRolling: false,
      rollProgress: 1,
      targetFace: 1,
      startRot: new THREE.Euler(0, 0, 0),
      targetRot: new THREE.Euler(0, 0, 0),
      // Urn
      urnRemaining: [...this.urnBallMeshes],
      drawnHistory: [],
      drawnBall: null,
      isDrawing: false,
      drawProgress: 1,
      withReplacement: true,
      // Coin
      totalFlips: 0,
      headsCount: 0,
      tailsCount: 0,
      lastFlip: null,
      isFlipping: false,
      flipProgress: 1,
      coinTargetRotX: 0
    };

    this.simParams = { mode: 'probability_experiment' };
  }

  setProbMode(mode) {
    if (!this.probState) return;
    this.probState.mode = mode;

    if (this.diceMesh) this.diceMesh.visible = (mode === 'dice');
    if (this.dicePillars) this.dicePillars.forEach(p => p.visible = (mode === 'dice'));
    if (this.benchLine) this.benchLine.visible = (mode === 'dice');
    if (this.urnGroup) this.urnGroup.visible = (mode === 'urn');
    if (this.coinMesh) this.coinMesh.visible = (mode === 'coin');

    this.renderWorkbench();
  }

  rollDice(count = 1) {
    if (!this.probState || this.probState.isRolling) return;

    if (count === 1) {
      const targetFace = Math.floor(Math.random() * 6) + 1;
      this.probState.targetFace = targetFace;
      this.probState.isRolling = true;
      this.probState.rollProgress = 0;

      // Base target orientation: make target face point up (+Y)
      let baseRotX = 0, baseRotZ = 0;
      if (targetFace === 1) { baseRotX = -Math.PI / 2; baseRotZ = 0; }
      else if (targetFace === 2) { baseRotX = 0; baseRotZ = 0; }
      else if (targetFace === 3) { baseRotX = 0; baseRotZ = Math.PI / 2; }
      else if (targetFace === 4) { baseRotX = 0; baseRotZ = -Math.PI / 2; }
      else if (targetFace === 5) { baseRotX = Math.PI; baseRotZ = 0; }
      else if (targetFace === 6) { baseRotX = Math.PI / 2; baseRotZ = 0; }

      const extraSpinX = (Math.floor(Math.random() * 2) + 2) * Math.PI * 2;
      const extraSpinZ = (Math.floor(Math.random() * 2) + 2) * Math.PI * 2;
      const extraSpinY = Math.floor(Math.random() * 4) * Math.PI / 2;

      this.probState.startRot = this.diceMesh.rotation.clone();
      this.probState.targetRot = new THREE.Euler(
        baseRotX + extraSpinX,
        extraSpinY,
        baseRotZ + extraSpinZ
      );
    } else {
      // Fast multi-roll simulation (10x or 50x)
      for (let i = 0; i < count; i++) {
        const f = Math.floor(Math.random() * 6) + 1;
        this.probState.counts[f - 1]++;
        this.probState.totalRolls++;
        this.probState.lastOutcome = f;
      }
      this.updateDicePillars();
      this.updateProbHUD();
    }
  }

  updateDicePillars() {
    if (!this.probState || !this.dicePillars) return;
    const total = Math.max(this.probState.totalRolls, 1);
    const maxCount = Math.max(...this.probState.counts, 1);

    for (let i = 0; i < 6; i++) {
      const freq = this.probState.counts[i] / total;
      // Target height scaled appropriately
      const targetH = Math.max(0.15, (this.probState.counts[i] / maxCount) * 3.8);
      this.targetPillarHeights[i] = targetH;
    }

    // Benchmark line at theoretical height (1/6 of total)
    if (this.benchLine) {
      const avgH = (1 / 6) * 3.8;
      this.benchLine.position.y = Math.max(0.8, (total > 5 ? ( (1/6) / (maxCount / total) ) * 3.8 : 1.2));
    }
  }

  drawBall() {
    if (!this.probState || this.probState.isDrawing) return;
    const remaining = this.probState.urnRemaining;
    if (remaining.length === 0) {
      this.resetUrn();
      return;
    }

    const chosenIdx = Math.floor(Math.random() * remaining.length);
    const ball = remaining[chosenIdx];
    this.probState.isDrawing = true;
    this.probState.drawProgress = 0;
    this.probState.drawnBall = ball;

    if (!this.probState.withReplacement) {
      remaining.splice(chosenIdx, 1);
    }
    this.probState.drawnHistory.push(ball.userData.type);
    this.updateProbHUD();
  }

  resetUrn() {
    if (!this.probState) return;
    this.probState.urnRemaining = [...this.urnBallMeshes];
    this.probState.drawnHistory = [];
    this.urnBallMeshes.forEach(b => {
      b.position.copy(b.userData.origPos);
      b.visible = true;
    });
    this.updateProbHUD();
  }

  flipCoin() {
    if (!this.probState || this.probState.isFlipping) return;
    const isHeads = Math.random() < 0.5;
    this.probState.isFlipping = true;
    this.probState.flipProgress = 0;
    this.probState.lastFlip = isHeads ? 'H' : 'T';
    this.probState.coinTargetRotX = isHeads ? Math.PI * 6 : Math.PI * 7;
  }

  resetProbExperiment() {
    if (!this.probState) return;
    this.probState.totalRolls = 0;
    this.probState.counts = [0, 0, 0, 0, 0, 0];
    this.probState.lastOutcome = null;
    this.probState.totalFlips = 0;
    this.probState.headsCount = 0;
    this.probState.tailsCount = 0;
    this.probState.lastFlip = null;
    this.targetPillarHeights = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15];
    if (this.diceMesh) {
      this.diceMesh.position.set(0, 0.9, 0.5);
      this.diceMesh.rotation.set(0, 0, 0);
    }
    if (this.coinMesh) {
      this.coinMesh.position.set(0, 0.1, 0.5);
      this.coinMesh.rotation.set(0, 0, 0);
    }
    this.resetUrn();
    this.updateDicePillars();
    this.renderWorkbench();
  }

  updateProbHUD() {
    const s = this.probState;
    if (!s) return;

    if (s.mode === 'dice') {
      const totEl = document.getElementById('m3d-stat-total');
      const lastEl = document.getElementById('m3d-stat-last');
      const freqEl = document.getElementById('m3d-stat-freq');
      const theorEl = document.getElementById('m3d-stat-theor');

      const icons = ['', '⚀ លេខ ១', '⚁ លេខ ២', '⚂ លេខ ៣', '⚃ លេខ ៤', '⚄ លេខ ៥', '⚅ លេខ ៦'];
      if (totEl) totEl.textContent = s.totalRolls;
      if (lastEl) lastEl.textContent = s.lastOutcome ? icons[s.lastOutcome] : '-';
      if (freqEl) {
        if (s.totalRolls > 0 && s.lastOutcome) {
          const f = ((s.counts[s.lastOutcome - 1] / s.totalRolls) * 100).toFixed(1);
          freqEl.textContent = `${f}%`;
        } else {
          freqEl.textContent = '0%';
        }
      }
      if (theorEl) theorEl.textContent = '16.7%';
    } else if (s.mode === 'urn') {
      const urnTotEl = document.getElementById('m3d-stat-urn-rem');
      const urnLastEl = document.getElementById('m3d-stat-urn-last');
      const urnProbEl = document.getElementById('m3d-stat-urn-prob');

      const labelMap = { red: '🔴 ក្រហម', blue: '🔵 ខៀវ', green: '🟢 បៃតង' };
      if (urnTotEl) urnTotEl.textContent = `${s.urnRemaining.length} គ្រាប់`;
      if (urnLastEl) {
        const last = s.drawnHistory[s.drawnHistory.length - 1];
        urnLastEl.textContent = last ? labelMap[last] : '-';
      }
      if (urnProbEl) {
        const nR = s.urnRemaining.filter(b => b.userData.type === 'red').length;
        const total = Math.max(s.urnRemaining.length, 1);
        urnProbEl.textContent = `P(ក្រហម) = ${(nR / total * 100).toFixed(1)}%`;
      }
    } else if (s.mode === 'coin') {
      const cTot = document.getElementById('m3d-stat-coin-tot');
      const cLast = document.getElementById('m3d-stat-coin-last');
      const cHeads = document.getElementById('m3d-stat-coin-heads');

      if (cTot) cTot.textContent = s.totalFlips;
      if (cLast) cLast.textContent = s.lastFlip === 'H' ? '👑 ក្បាល (H)' : s.lastFlip === 'T' ? '🪙 កន្ទុយ (T)' : '-';
      if (cHeads) {
        const f = s.totalFlips > 0 ? ((s.headsCount / s.totalFlips) * 100).toFixed(1) : 0;
        cHeads.textContent = `${f}% (ទ្រឹស្តី 50%)`;
      }
    }
  }

  // --------------------------------------------------------------------------
  // Interactive Laboratory Controls for Other Curriculum Subjects
  // --------------------------------------------------------------------------
  setDerivX(val) {
    const x = parseFloat(val);
    const p = this.simParams;
    if (!p) return;
    const xEl = document.getElementById('m3d-deriv-x');
    const slopeEl = document.getElementById('m3d-deriv-slope');
    const trendEl = document.getElementById('m3d-deriv-trend');

    const y = 0.12 * x * (x * x - 6.25);
    const slope = 0.12 * (3 * x * x - 6.25);

    if (p.contactPoint) p.contactPoint.position.set(x, y, 0);
    if (p.tangentLine) {
      p.tangentLine.position.set(x, y, 0);
      p.tangentLine.rotation.z = Math.atan(slope);
    }
    if (p.tanArrow) {
      p.tanArrow.position.set(x, y, 0);
      const dir = new THREE.Vector3(1, slope, 0).normalize();
      p.tanArrow.setDirection(dir);
    }

    if (xEl) xEl.textContent = x.toFixed(1);
    if (slopeEl) slopeEl.textContent = slope.toFixed(2);
    if (trendEl) {
      if (Math.abs(slope) < 0.15) {
        trendEl.className = 'm3d-badge-status extremum';
        trendEl.textContent = "⭐ បរមា (f'=0)";
      } else if (slope > 0) {
        trendEl.className = 'm3d-badge-status inc';
        trendEl.textContent = "កើន ↗ (f'>0)";
      } else {
        trendEl.className = 'm3d-badge-status dec';
        trendEl.textContent = "ចុះ ↘ (f'<0)";
      }
    }
  }

  setRiemannN(val) {
    const n = parseInt(val);
    const nEl = document.getElementById('m3d-riemann-n');
    const areaEl = document.getElementById('m3d-riemann-area');
    if (nEl) nEl.textContent = n;

    const p = this.simParams;
    if (!p || !p.prisms) return;

    p.prisms.forEach(mesh => {
      this.animGroup.remove(mesh);
      if (mesh.geometry) mesh.geometry.dispose();
    });
    p.prisms = [];

    const a = -2.0, b = 2.0;
    const dx = (b - a) / n;
    let sumArea = 0;

    for (let i = 0; i < n; i++) {
      const xMid = a + (i + 0.5) * dx;
      const h = Math.sin(xMid * 0.8) * 0.8 + 1.8;
      sumArea += h * dx;
      const geo = new THREE.BoxGeometry(dx * 0.92, h, 0.6);
      const mat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        transparent: true,
        opacity: 0.65,
        metalness: 0.2
      });
      const box = new THREE.Mesh(geo, mat);
      box.position.set(xMid, h / 2, 0);
      this.animGroup.add(box);
      p.prisms.push(box);
    }

    if (areaEl) areaEl.textContent = sumArea.toFixed(2);
  }

  setTrigAngle(deg) {
    const angleDeg = parseFloat(deg);
    const th = (angleDeg * Math.PI) / 180;
    const dEl = document.getElementById('m3d-trig-deg');
    const sinEl = document.getElementById('m3d-trig-sin');
    const cosEl = document.getElementById('m3d-trig-cos');
    const tanEl = document.getElementById('m3d-trig-tan');

    const cosVal = Math.cos(th) * 3;
    const sinVal = Math.sin(th) * 3;

    const p = this.simParams;
    if (p && p.radiusArrow) {
      p.radiusArrow.setDirection(new THREE.Vector3(cosVal, sinVal, 0).normalize());
    }
    if (p && p.sinLine) {
      const pos = p.sinLine.geometry.attributes.position.array;
      pos[0] = cosVal; pos[1] = 0; pos[2] = 0;
      pos[3] = cosVal; pos[4] = sinVal; pos[5] = 0;
      p.sinLine.geometry.attributes.position.needsUpdate = true;
    }
    if (p && p.cosLine) {
      const pos = p.cosLine.geometry.attributes.position.array;
      pos[0] = 0; pos[1] = 0; pos[2] = 0;
      pos[3] = cosVal; pos[4] = 0; pos[5] = 0;
      p.cosLine.geometry.attributes.position.needsUpdate = true;
    }

    if (dEl) dEl.textContent = `${angleDeg}°`;
    if (sinEl) sinEl.textContent = Math.sin(th).toFixed(3);
    if (cosEl) cosEl.textContent = Math.cos(th).toFixed(3);
    if (tanEl) {
      const tanVal = Math.tan(th);
      tanEl.textContent = Math.abs(tanVal) > 50 ? '±∞' : tanVal.toFixed(3);
    }
  }

  setConicAngle(deg) {
    const angleDeg = parseFloat(deg);
    const th = (angleDeg * Math.PI) / 180;
    const dEl = document.getElementById('m3d-conic-deg');
    const typeEl = document.getElementById('m3d-conic-type');

    const p = this.simParams;
    if (p && p.slicePlane) {
      p.slicePlane.rotation.x = th;
    }

    if (dEl) dEl.textContent = `${angleDeg}°`;
    if (typeEl) {
      if (angleDeg < 5) {
        typeEl.textContent = 'រង្វង់ (Circle)';
        typeEl.style.color = '#38bdf8';
      } else if (angleDeg < 45) {
        typeEl.textContent = 'អេលីប (Ellipse)';
        typeEl.style.color = '#a855f7';
      } else if (angleDeg === 45) {
        typeEl.textContent = 'ប៉ារ៉ាបូល (Parabola)';
        typeEl.style.color = '#f59e0b';
      } else {
        typeEl.textContent = 'អ៊ីពែបូល (Hyperbola)';
        typeEl.style.color = '#ef4444';
      }
    }
  }

  setVectorAngle(deg) {
    const angleDeg = parseFloat(deg);
    const th = (angleDeg * Math.PI) / 180;
    const dEl = document.getElementById('m3d-vec-deg');
    const dotEl = document.getElementById('m3d-vec-dot');
    const crossEl = document.getElementById('m3d-vec-cross');

    const p = this.simParams;
    if (p && p.arrowV) {
      const vx = Math.cos(th) * 2.5;
      const vz = Math.sin(th) * 2.5;
      p.arrowV.setDirection(new THREE.Vector3(vx, 0, vz).normalize());

      if (p.crossArrow) {
        // Cross product of u=(2.5, 0, 0) and v=(vx, 0, vz) is along Y
        const crossY = 2.5 * vz;
        p.crossArrow.setLength(Math.max(0.2, crossY));
      }
    }

    if (dEl) dEl.textContent = `${angleDeg}°`;
    if (dotEl) dotEl.textContent = (2.5 * 2.5 * Math.cos(th)).toFixed(2);
    if (crossEl) crossEl.textContent = Math.abs(2.5 * 2.5 * Math.sin(th)).toFixed(2);
  }

  setComplexAngle(deg) {
    const angleDeg = parseFloat(deg);
    const th = (angleDeg * Math.PI) / 180;
    const dEl = document.getElementById('m3d-cpx-deg');
    const valEl = document.getElementById('m3d-cpx-val');

    const R = 3.0;
    const x = Math.cos(th) * R;
    const y = Math.sin(th) * R;

    const p = this.simParams;
    if (p && p.arrowZ) {
      p.arrowZ.setDirection(new THREE.Vector3(x, y, 0).normalize());
    }
    if (p && p.head) {
      p.head.position.set(x, y, 0);
    }

    if (dEl) dEl.textContent = `${angleDeg}°`;
    if (valEl) valEl.textContent = `${x.toFixed(2)} + ${y.toFixed(2)}i`;
  }

  setSeqD(val) {
    const d = parseFloat(val);
    const dEl = document.getElementById('m3d-seq-d');
    const sumEl = document.getElementById('m3d-seq-sum');
    if (dEl) dEl.textContent = d.toFixed(1);

    const n = 6;
    const u1 = 1.6;
    const sum = (n * (2 * u1 + (n - 1) * d)) / 2;
    if (sumEl) sumEl.textContent = sum.toFixed(1);
  }

  setSeqQ(val) {
    const q = parseFloat(val);
    const qEl = document.getElementById('m3d-seq-q');
    const u5El = document.getElementById('m3d-seq-u5');
    if (qEl) qEl.textContent = q.toFixed(1);
    const u1 = 0.8;
    const u5 = u1 * Math.pow(q, 4);
    if (u5El) u5El.textContent = u5.toFixed(2);
  }

  setBaseA(val) {
    const a = parseFloat(val);
    const aEl = document.getElementById('m3d-exp-a');
    const typeEl = document.getElementById('m3d-exp-type');
    if (aEl) aEl.textContent = a.toFixed(1);
    if (typeEl) {
      typeEl.textContent = a > 1 ? 'កើនជានិច្ច ↗ (a > 1)' : 'ចុះជានិច្ច ↘ (0 < a < 1)';
      typeEl.style.color = a > 1 ? '#10b981' : '#f59e0b';
    }
  }

  setStatN(val) {
    const n = parseInt(val);
    const nEl = document.getElementById('m3d-stat-n-val');
    const seEl = document.getElementById('m3d-stat-se-val');
    if (nEl) nEl.textContent = n;
    if (seEl) seEl.textContent = (1.5 / Math.sqrt(n)).toFixed(3);
  }

  // --------------------------------------------------------------------------
  // Interactive Workbench UI Generator (HTML Overlay Deck)
  // --------------------------------------------------------------------------
  renderWorkbench() {
    const wb = document.getElementById('math-3d-workbench');
    if (!wb) return;

    const simType = this.activeSimType;

    // Case 1: Probability Experiment Laboratory
    if (simType === 'probability_experiment' && this.probState) {
      const mode = this.probState.mode;
      wb.style.display = 'block';

      if (mode === 'dice') {
        wb.innerHTML = `
          <div class="m3d-wb-container">
            <div class="m3d-wb-modes">
              <button class="m3d-wb-tab active" onclick="Math3D.setProbMode('dice')">🎲 គ្រាប់ឡុកឡាក់ 3D</button>
              <button class="m3d-wb-tab" onclick="Math3D.setProbMode('urn')">🎱 ចាប់បាល់ពីថង់</button>
              <button class="m3d-wb-tab" onclick="Math3D.setProbMode('coin')">🪙 បោះកាក់ 3D</button>
            </div>
            <div class="m3d-wb-actions">
              <button class="m3d-wb-btn primary" onclick="Math3D.rollDice(1)">🎲 ក្រឡុកម្តង</button>
              <button class="m3d-wb-btn" onclick="Math3D.rollDice(10)">⚡ ក្រឡុក 10 ដង</button>
              <button class="m3d-wb-btn" onclick="Math3D.rollDice(50)">🚀 ក្រឡុក 50 ដង</button>
              <button class="m3d-wb-btn danger" onclick="Math3D.resetProbExperiment()">🔄 កំណត់ឡើងវិញ</button>
            </div>
            <div class="m3d-wb-stats">
              <span class="m3d-stat-pill">សរុប ៖ <strong id="m3d-stat-total">0</strong> ដង</span>
              <span class="m3d-stat-pill highlight">លទ្ធផល ៖ <strong id="m3d-stat-last">-</strong></span>
              <span class="m3d-stat-pill">ប្រូបាបជាក់ស្តែង f ៖ <strong id="m3d-stat-freq">0%</strong></span>
              <span class="m3d-stat-pill info">ប្រូបាបទ្រឹស្តី P ៖ <strong id="m3d-stat-theor">16.7%</strong></span>
            </div>
          </div>
        `;
      } else if (mode === 'urn') {
        wb.innerHTML = `
          <div class="m3d-wb-container">
            <div class="m3d-wb-modes">
              <button class="m3d-wb-tab" onclick="Math3D.setProbMode('dice')">🎲 គ្រាប់ឡុកឡាក់ 3D</button>
              <button class="m3d-wb-tab active" onclick="Math3D.setProbMode('urn')">🎱 ចាប់បាល់ពីថង់</button>
              <button class="m3d-wb-tab" onclick="Math3D.setProbMode('coin')">🪙 បោះកាក់ 3D</button>
            </div>
            <div class="m3d-wb-actions">
              <button class="m3d-wb-btn primary" onclick="Math3D.drawBall()">🎯 ចាប់បាល់ ១ គ្រាប់</button>
              <button class="m3d-wb-btn" onclick="Math3D.probState.withReplacement = !Math3D.probState.withReplacement; Math3D.renderWorkbench();">
                ${this.probState.withReplacement ? '🔄 មានដាក់ចូលវិញ' : '⛔ គ្មានដាក់ចូលវិញ'}
              </button>
              <button class="m3d-wb-btn danger" onclick="Math3D.resetUrn()">🔄 ដាក់បាល់ពេញវិញ</button>
            </div>
            <div class="m3d-wb-stats">
              <span class="m3d-stat-pill">បាល់ក្នុងថង់ ៖ <strong id="m3d-stat-urn-rem">12 គ្រាប់</strong></span>
              <span class="m3d-stat-pill highlight">ចាប់បាន ៖ <strong id="m3d-stat-urn-last">-</strong></span>
              <span class="m3d-stat-pill info"><strong id="m3d-stat-urn-prob">P(ក្រហម) = 41.7%</strong></span>
            </div>
          </div>
        `;
      } else if (mode === 'coin') {
        wb.innerHTML = `
          <div class="m3d-wb-container">
            <div class="m3d-wb-modes">
              <button class="m3d-wb-tab" onclick="Math3D.setProbMode('dice')">🎲 គ្រាប់ឡុកឡាក់ 3D</button>
              <button class="m3d-wb-tab" onclick="Math3D.setProbMode('urn')">🎱 ចាប់បាល់ពីថង់</button>
              <button class="m3d-wb-tab active" onclick="Math3D.setProbMode('coin')">🪙 បោះកាក់ 3D</button>
            </div>
            <div class="m3d-wb-actions">
              <button class="m3d-wb-btn primary" onclick="Math3D.flipCoin()">🪙 បោះកាក់ម្តង</button>
              <button class="m3d-wb-btn danger" onclick="Math3D.resetProbExperiment()">🔄 កំណត់ឡើងវិញ</button>
            </div>
            <div class="m3d-wb-stats">
              <span class="m3d-stat-pill">សរុប ៖ <strong id="m3d-stat-coin-tot">0</strong> ដង</span>
              <span class="m3d-stat-pill highlight">លទ្ធផល ៖ <strong id="m3d-stat-coin-last">-</strong></span>
              <span class="m3d-stat-pill info">ប្រេកង់ក្បាល ៖ <strong id="m3d-stat-coin-heads">0%</strong></span>
            </div>
          </div>
        `;
      }
      this.updateProbHUD();
    }
    // Case 2: Derivatives & Tangents
    else if (simType === 'derivatives_tangent') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📍 អូសចំណុច $x_0$ ៖</span>
            <input type="range" class="m3d-range-slider" min="-25" max="25" value="10" oninput="Math3D.setDerivX(this.value/10)">
            <span class="m3d-slider-val" id="m3d-deriv-x">1.0</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill">មេគុណប្រាប់ទិសបន្ទាត់ប៉ះ $m = f'(x_0)$ ៖ <strong id="m3d-deriv-slope">-0.39</strong></span>
            <span class="m3d-badge-status dec" id="m3d-deriv-trend">ចុះ ↘ (f'<0)</span>
          </div>
        </div>
      `;
    }
    // Case 3: Integrals & Riemann Sums
    else if (simType === 'integrals_volume') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📊 ចំនួនចតុកោណកែង Riemann $n$ ៖</span>
            <input type="range" class="m3d-range-slider" min="4" max="40" value="8" oninput="Math3D.setRiemannN(this.value)">
            <span class="m3d-slider-val" id="m3d-riemann-n">8</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill">ផ្ទៃក្រឡា Riemann $S_n \approx$ <strong id="m3d-riemann-area">7.20</strong></span>
            <span class="m3d-stat-pill info">អាំងតេក្រាលពិត $I = \int_{-2}^2 f(x)dx = 7.20$</span>
          </div>
        </div>
      `;
    }
    // Case 4: Trigonometry
    else if (simType === 'trigonometry') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📐 មុំ $\theta$ ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="360" value="45" oninput="Math3D.setTrigAngle(this.value)">
            <span class="m3d-slider-val" id="m3d-trig-deg">45°</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">$\sin\theta$ ៖ <strong id="m3d-trig-sin">0.707</strong></span>
            <span class="m3d-stat-pill">$\cos\theta$ ៖ <strong id="m3d-trig-cos">0.707</strong></span>
            <span class="m3d-stat-pill info">$\tan\theta$ ៖ <strong id="m3d-trig-tan">1.000</strong></span>
          </div>
        </div>
      `;
    }
    // Case 5: Conic Sections
    else if (simType === 'conic_sections') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔪 មុំប្លង់កាត់ $\alpha$ ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="75" value="25" oninput="Math3D.setConicAngle(this.value)">
            <span class="m3d-slider-val" id="m3d-conic-deg">25°</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">ទម្រង់កាត់ ៖ <strong id="m3d-conic-type" style="color:#a855f7;">អេលីប (Ellipse)</strong></span>
          </div>
        </div>
      `;
    }
    // Case 6: Space Geometry
    else if (simType === 'space_geometry') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📐 មុំវ៉ិចទ័រ $\theta$ ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="180" value="60" oninput="Math3D.setVectorAngle(this.value)">
            <span class="m3d-slider-val" id="m3d-vec-deg">60°</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill">$\vec{u} \cdot \vec{v} =$ <strong id="m3d-vec-dot">3.12</strong></span>
            <span class="m3d-stat-pill highlight">$\|\vec{u} \times \vec{v}\| =$ <strong id="m3d-vec-cross">5.41</strong></span>
          </div>
        </div>
      `;
    }
    // Case 7: Complex Numbers
    else if (simType === 'complex_numbers') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">✨ អាគុយម៉ង់ $\varphi$ ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="360" value="45" oninput="Math3D.setComplexAngle(this.value)">
            <span class="m3d-slider-val" id="m3d-cpx-deg">45°</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">$z = $ <strong id="m3d-cpx-val">2.12 + 2.12i</strong></span>
            <span class="m3d-stat-pill info">$|z| = 3.0$</span>
          </div>
        </div>
      `;
    }
    // Case 8: Arithmetic Sequence
    else if (simType === 'arithmetic_sequence' || simType === 'sequences_series') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📏 ផលសងរួម $d$ ៖</span>
            <input type="range" class="m3d-range-slider" min="2" max="20" value="8" oninput="Math3D.setSeqD(this.value/10)">
            <span class="m3d-slider-val" id="m3d-seq-d">0.8</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill">ផលបូក ៦ តួដំបូង $S_6 = $ <strong id="m3d-seq-sum">21.6</strong></span>
            <span class="m3d-stat-pill info">តួទូទៅ ៖ $u_n = u_1 + (n-1)d$</span>
          </div>
        </div>
      `;
    }
    // Case 9: Geometric Sequence
    else if (simType === 'geometric_sequence') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📈 ផលធៀបរួម $q$ ៖</span>
            <input type="range" class="m3d-range-slider" min="5" max="25" value="16" oninput="Math3D.setSeqQ(this.value/10)">
            <span class="m3d-slider-val" id="m3d-seq-q">1.6</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">តួទី ៥ $u_5 = $ <strong id="m3d-seq-u5">5.24</strong></span>
            <span class="m3d-stat-pill info">តួទូទៅ ៖ $u_n = u_1 \cdot q^{n-1}$</span>
          </div>
        </div>
      `;
    }
    // Case 10: Exponential & Logarithmic Functions
    else if (simType === 'exponential_log') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">⚡ គោល $a$ ៖</span>
            <input type="range" class="m3d-range-slider" min="5" max="35" value="20" oninput="Math3D.setBaseA(this.value/10)">
            <span class="m3d-slider-val" id="m3d-exp-a">2.0</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">អថិរភាព ៖ <strong id="m3d-exp-type" style="color:#10b981;">កើនជានិច្ច ↗ (a > 1)</strong></span>
            <span class="m3d-stat-pill info">ឆ្លុះធៀបនឹងបន្ទាត់ពុះ $y = x$</span>
          </div>
        </div>
      `;
    }
    // Case 11: Statistics
    else if (simType === 'statistics_probability') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📊 ទំហំគំរូ $N$ ៖</span>
            <input type="range" class="m3d-range-slider" min="10" max="200" value="50" oninput="Math3D.setStatN(this.value)">
            <span class="m3d-slider-val" id="m3d-stat-n-val">50</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">កំហុសគំរូស្តង់ដា $SE = $ <strong id="m3d-stat-se-val">0.212</strong></span>
            <span class="m3d-stat-pill info">ទ្រឹស្តីបទលីមីតកណ្តាល CLT</span>
          </div>
        </div>
      `;
    }
    // Case: Divisors & Multiples (Grade 7 - les-g7-02)
    else if (simType === 'divisors_multiples') {
      const N = this.workbenchState.divN !== undefined ? this.workbenchState.divN : 12;
      const d = this.workbenchState.divD !== undefined ? this.workbenchState.divD : 3;
      const r = N % d;
      const q = Math.floor(N / d);
      const isDivisible = (r === 0);

      // Find all divisors of N
      const divisors = [];
      for (let i = 1; i <= N; i++) {
        if (N % i === 0) divisors.push(i);
      }

      const statusText = isDivisible
        ? `✅ ${N} ចែកដាច់នឹង ${d} (${N} = ${d} × ${q})`
        : `❌ ${N} ចែកមិនដាច់នឹង ${d} (សំណល់ r = ${r})`;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔢 ចំនួន N = <strong id="m3d-div-n-val">${N}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="2" max="24" value="${N}" oninput="Math3D.setDivisorN(this.value)">
            <span class="m3d-slider-label" style="margin-left:14px;">➗ តួចែក d = <strong id="m3d-div-d-val">${d}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="1" max="12" value="${d}" oninput="Math3D.setDivisorD(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill ${isDivisible ? 'highlight' : ''}" id="m3d-div-status-pill">${statusText}</span>
            <span class="m3d-stat-pill info" id="m3d-div-rem-pill">សំណល់ ៖ <strong>r = ${r}</strong></span>
            <span class="m3d-stat-pill">តួចែកនៃ ${N} ៖ <strong>{ ${divisors.join(', ')} }</strong></span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <button class="m3d-wb-btn" onclick="Math3D.setDivisorPreset(12, 3)">12 ÷ 3 (ចែកដាច់ ✅)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDivisorPreset(12, 5)">12 ÷ 5 (សំណល់ ២ ❌)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDivisorPreset(7, 2)">7 (ចំនួនបឋម ⭐)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDivisorPreset(18, 6)">18 ÷ 6 (ចែកដាច់ ✅)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDivisorPreset(24, 4)">24 ÷ 4 (ចែកដាច់ ✅)</button>
          </div>
        </div>
      `;
    }
    // Case: Whole Numbers & Place Value (Grade 7 - les-g7-01)
    else if (simType === 'whole_numbers') {
      const N = this.workbenchState.wholeN !== undefined ? this.workbenchState.wholeN : 342;
      const h = Math.floor((N % 1000) / 100);
      const t = Math.floor((N % 100) / 10);
      const u = N % 10;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔢 ចំនួនគត់ N = <strong id="m3d-whole-n-val">${N}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="1" max="999" value="${N}" oninput="Math3D.setWholeN(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">រយ (Hundreds) ៖ <strong>${h} (${h * 100})</strong></span>
            <span class="m3d-stat-pill info">ដប់ (Tens) ៖ <strong>${t} (${t * 10})</strong></span>
            <span class="m3d-stat-pill">រាយ (Units) ៖ <strong>${u} (${u})</strong></span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <button class="m3d-wb-btn" onclick="Math3D.setWholePreset(342)">N = 342</button>
            <button class="m3d-wb-btn" onclick="Math3D.setWholePreset(125)">N = 125</button>
            <button class="m3d-wb-btn" onclick="Math3D.setWholePreset(500)">N = 500</button>
            <button class="m3d-wb-btn" onclick="Math3D.setWholePreset(999)">N = 999</button>
          </div>
        </div>
      `;
    }
    // Case: Powers & Exponents (Grade 8 - les-g8-02)
    else if (simType === 'powers_exponents') {
      const a = this.workbenchState.powA !== undefined ? this.workbenchState.powA : 2;
      const n = this.workbenchState.powN !== undefined ? this.workbenchState.powN : 3;
      const val = Math.pow(a, n);

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">⚡ គោល a = <strong id="m3d-pow-a-val">${a}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="2" max="5" value="${a}" oninput="Math3D.setPowerA(this.value)">
            <span class="m3d-slider-label" style="margin-left:14px;">📈 និទស្សន្ត n = <strong id="m3d-pow-n-val">${n}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="4" value="${n}" oninput="Math3D.setPowerN(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">តម្លៃស្វ័យគុណ ៖ <strong>${a}^${n} = ${val}</strong></span>
            <span class="m3d-stat-pill info">គុណនឹងគោល ${a} គ្រប់ជំហាន</span>
          </div>
        </div>
      `;
    }
    // Case: Inequality Solution Ray (Grade 7 - les-g7-10, Grade 8 - les-g8-08, Grade 9 - les-g9-05)
    else if (simType === 'inequality_ray') {
      const x0 = this.workbenchState.ineqX !== undefined ? this.workbenchState.ineqX : 2;
      const rel = this.workbenchState.ineqRel || '>=';
      const isGreater = rel.includes('>');
      const isInclusive = rel.includes('=');
      const intervalStr = isGreater
        ? (isInclusive ? `[${x0}, +∞)` : `(${x0}, +∞)`)
        : (isInclusive ? `(-∞, ${x0}]` : `(-∞, ${x0})`);

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-wb-modes">
            <button class="m3d-wb-tab ${rel === '>=' ? 'active' : ''}" onclick="Math3D.setIneqRel('>=')">x ≥ x₀ (បិទ ●)</button>
            <button class="m3d-wb-tab ${rel === '>' ? 'active' : ''}" onclick="Math3D.setIneqRel('>')">x > x₀ (បើក ○)</button>
            <button class="m3d-wb-tab ${rel === '<=' ? 'active' : ''}" onclick="Math3D.setIneqRel('<=')">x ≤ x₀ (បិទ ●)</button>
            <button class="m3d-wb-tab ${rel === '<' ? 'active' : ''}" onclick="Math3D.setIneqRel('<')">x < x₀ (បើក ○)</button>
          </div>
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📍 ចំណុចព្រំដែន x₀ = <strong id="m3d-ineq-x-val">${x0}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-5" max="5" value="${x0}" oninput="Math3D.setIneqX(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">វិសមភាព ៖ <strong>x ${rel} ${x0}</strong></span>
            <span class="m3d-stat-pill info">សំណុំចម្លើយ ៖ <strong>${intervalStr}</strong></span>
          </div>
        </div>
      `;
    }
    // Case: Equation of a Line (Grade 9 - les-g9-10)
    else if (simType === 'line_slope_intercept') {
      const m = this.workbenchState.lineM !== undefined ? this.workbenchState.lineM : 1.5;
      const b = this.workbenchState.lineB !== undefined ? this.workbenchState.lineB : 1.0;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📐 មេគុណប្រាប់ទិស m = <strong id="m3d-line-m-val">${m}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-30" max="30" value="${m * 10}" oninput="Math3D.setLineM(this.value/10)">
            <span class="m3d-slider-label" style="margin-left:14px;">📍 ប្រសព្វ y (b) = <strong id="m3d-line-b-val">${b}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-40" max="40" value="${b * 10}" oninput="Math3D.setLineB(this.value/10)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">សមីការបន្ទាត់ ៖ <strong>y = ${m}x + ${b}</strong></span>
            <span class="m3d-stat-pill info">ទិសដៅ ៖ <strong>${m > 0 ? 'កើនឡើង ↗' : m < 0 ? 'ថយចុះ ↘' : 'ដេកស្មើ →'}</strong></span>
          </div>
        </div>
      `;
    }
    // Case: Coordinate Plane Graph (Grade 8 - les-g8-09)
    else if (simType === 'coordinate_plane_graph') {
      const x = this.workbenchState.coordX !== undefined ? this.workbenchState.coordX : 3;
      const y = this.workbenchState.coordY !== undefined ? this.workbenchState.coordY : 2;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📍 អាប់ស៊ីស x = <strong id="m3d-coord-x-val">${x}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-5" max="5" value="${x}" oninput="Math3D.setCoordX(this.value)">
            <span class="m3d-slider-label" style="margin-left:14px;">📍 អ័រដោនេ y = <strong id="m3d-coord-y-val">${y}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-4" max="4" value="${y}" oninput="Math3D.setCoordY(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">កូអរដោនេ ៖ <strong>P(${x}, ${y})</strong></span>
          </div>
        </div>
      `;
    }
    // Case: Angles Protractor (Grade 7 - les-g7-13)
    else if (simType === 'angles_protractor') {
      const deg = this.workbenchState.angDeg !== undefined ? this.workbenchState.angDeg : 60;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📐 រង្វាស់មុំ θ = <strong id="m3d-ang-deg-val">${deg}°</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="180" value="${deg}" oninput="Math3D.setAngDeg(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">មុំ ៖ <strong>${deg}°</strong></span>
          </div>
        </div>
      `;
    }

    // Case: Rational Numbers (Grade 8 - les-g8-01)
    // ========================================================================
    // Case: Divisors & Multiples (Grade 7 - les-g7-02: តួចែក និងពហុគុណ)
    // ========================================================================
    else if (simType === 'divisors_multiples') {
      if (pIdx === 0) {
        // Point 1: តួចែក និងលក្ខណៈចែកដាច់
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ និយមន័យតួចែក និងពហុគុណ',
            tag: 'លក្ខណៈចែកដាច់ a = b × q',
            caption: `ចំនួនគត់ធម្មជាតិ $a$ ចែកដាច់នឹង $b$ ($b \ne 0$) កាលណាមានចំនួនគត់ធម្មជាតិ $q$ មួយដែល $a = b \times q$។ ពេលនោះ គេថា $b$ ជា <strong>តួចែក</strong> នៃ $a$ ហើយ $a$ ជា <strong>ពហុគុណ</strong> នៃ $b$។ បើមានសំណល់ $r \ne 0$ នោះចែកមិនដាច់ទេ។`,
            formula: 'a = b \times q + r \quad (0 \le r < b)',
            speak: `ចំនួនគត់ a ចែកដាច់នឹង b កាលណាគ្មានសំណល់ ពេលនោះ b ជាតួចែកនៃ a`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ សញ្ញាណចែកដាច់នឹង ២, ៣, ៥, ៩',
            tag: 'វិធានចែកដាច់រហ័ស',
            caption: `• ចែកដាច់នឹង ២ ៖ លេខខាងចុងជាលេខគូ (០, ២, ៤, ៦, ៨)។<br>• ចែកដាច់នឹង ៥ ៖ លេខខាងចុងជា ០ ឬ ៥។<br>• ចែកដាច់នឹង ៣ ឬ ៩ ៖ ផលបូកលេខគ្រប់ខ្ទង់ចែកដាច់នឹង ៣ ឬ ៩។`,
            formula: '\text{ចែកដាច់នឹង 2/5 ៖ មើលខ្ទង់រាយ}, \quad \text{ចែកដាច់នឹង 3/9 ៖ ផលបូកគ្រប់ខ្ទង់}',
            speak: `សញ្ញាណចែកដាច់នឹងពីរ ប្រាំ បី និងប្រាំបួន`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ចំនួនបឋម និងការបំបែកជាកត្តាបឋម
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ និយមន័យចំនួនបឋម (Prime Number)',
            tag: 'មានតែតួចែក ២ គត់ គឺ ១ និងខ្លួនឯង',
            caption: `ចំនួនបឋម គឺជាចំនួនគត់ធម្មជាតិធំជាង ១ ដែលមានតួចែកតែ ២ គត់ គឺ ១ និងខ្លួនវាផ្ទាល់ (ដូចជា ២, ៣, ៥, ៧, ១១, ១៣, ១៧, ១៩, ... )។ ចំណាំ ៖ ២ ជាចំនួនបឋមគូតែមួយគត់! ចំនួនដែលមានតួចែកលើសពី ២ ហៅថា <strong>ចំនួនសហព័ទ្ធ</strong>។`,
            formula: '\mathbb{P} = \{2, 3, 5, 7, 11, 13, 17, 19, 23, 29, \dots \}',
            speak: `ចំនួនបឋមជាចំនួនដែលមានតួចែកតែពីរគត់ គឺមួយនិងខ្លួនឯង`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ការបំបែកចំនួនជាផលគុណកត្តាបឋម',
            tag: 'ដើមកត្តា & សសរឈរ',
            caption: `គ្រប់ចំនួនសហព័ទ្ធ អាចសរសេរជាផលគុណកត្តាបឋមបានតែមួយបែបគត់ ៖ $N = p_1^{\alpha_1} \times p_2^{\alpha_2} \times \dots \times p_k^{\alpha_k}$។ ឧទាហរណ៍ ៖ $12 = 2^2 \times 3$, $60 = 2^2 \times 3 \times 5$។`,
            formula: '12 = 2^2 \times 3, \quad 60 = 2^2 \times 3 \times 5',
            speak: `ការបំបែកចំនួនជាផលគុណកត្តាបឋមតាមវិធីសសរឈរ`
          }
        ];
      } else {
        // Point 3: GCD & LCM
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ តួចែករួមធំបំផុត (GCD / GCF)',
            tag: 'ផលគុណកត្តារួមមានស្វ័យគុណតូចជាងគេ',
            caption: `ដើម្បីរក GCD នៃពីរចំនួន គេបំបែកចំនួនទាំងពីរជាកត្តាបឋម រួចយក <strong>កត្តារួមដែលមានស្វ័យគុណតូចជាងគេ</strong> មកគុណបញ្ចូលគ្នា។ ឧទាហរណ៍ ៖ $\text{GCD}(12, 18) = 2 \times 3 = 6$។`,
            formula: '\text{GCD}(12, 18) = \text{GCD}(2^2 \times 3, \, 2 \times 3^2) = 2^1 \times 3^1 = 6',
            speak: `តួចែករួមធំបំផុតស្មើនឹងផលគុណកត្តារួមដែលមានស្វ័យគុណតូចជាងគេ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ពហុគុណរួមតូចបំផុត (LCM) & ទំនាក់ទំនង',
            tag: 'GCD(a, b) × LCM(a, b) = a × b',
            caption: `ដើម្បីរក LCM គេយក <strong>គ្រប់កត្តាទាំងអស់ (រួមនិងមិនរួម) ដែលមានស្វ័យគុណធំជាងគេ</strong> មកគុណបញ្ចូលគ្នា ៖ $\text{LCM}(12, 18) = 2^2 \times 3^2 = 36$។ ទំនាក់ទំនង ៖ $\text{GCD}(a, b) \times \text{LCM}(a, b) = a \times b$។`,
            formula: '\text{LCM}(12, 18) = 2^2 \times 3^2 = 36, \quad 6 \times 36 = 216 = 12 \times 18',
            speak: `ពហុគុណរួមតូចបំផុត និងទំនាក់ទំនងរវាងតួចែករួមធំបំផុតនិងពហុគុណរួមតូចបំផុត`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Whole Numbers (Grade 7 - les-g7-01: ចំនួនគត់)
    // ========================================================================
    else if (simType === 'whole_numbers') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ សញ្ញាណចំនួនគត់ធម្មជាតិ',
            tag: 'សំណុំ N = {0, 1, 2, 3, ...}',
            caption: `ចំនួនគត់ធម្មជាតិប្រើសម្រាប់រាប់ និងកំណត់ចំនួនវត្ថុ។ សំណុំចំនួនគត់ធម្មជាតិតាងដោយ $\mathbb{N} = \{0, 1, 2, 3, \dots \}$។`,
            formula: '\mathbb{N} = \{0, 1, 2, 3, 4, 5, \dots \}',
            speak: `សញ្ញាណចំនួនគត់ធម្មជាតិ និងសំណុំអិន`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ តម្លៃតាមខ្ទង់ (Place Value)',
            tag: 'រាយ ដប់ រយ ពាន់',
            caption: `ក្នុងប្រព័ន្ធគោលដប់ តម្លៃនៃលេខនីមួយៗអាស្រ័យលើខ្ទង់របស់វា ៖ ខ្ទង់រាយ ($1$), ខ្ទង់ដប់ ($10$), ខ្ទង់រយ ($100$), ខ្ទង់ពាន់ ($1000$)។ $342 = 3 \times 100 + 4 \times 10 + 2 \times 1$។`,
            formula: '342 = 3 \times 100 + 4 \times 10 + 2 \times 1 = 300 + 40 + 2',
            speak: `តម្លៃតាមខ្ទង់នៃប្រព័ន្ធគោលដប់ រាយ ដប់ រយ ពាន់`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ លំដាប់ និងការប្រៀបធៀប',
            tag: 'a < b, a > b, a = b',
            caption: `ដើម្បីប្រៀបធៀបពីរចំនួនគត់ គេរាប់ចំនួនខ្ទង់ ៖ ចំនួនណាមានខ្ទង់ច្រើនជាង ចំនួននោះធំជាង។ បើចំនួនខ្ទង់ស្មើគ្នា គេប្រៀបធៀបលេខពីឆ្វេងទៅស្តាំ។`,
            formula: 'x_1 < x_2 \iff x_1 \text{ នៅខាងឆ្វេង } x_2 \text{ លើបន្ទាត់ចំនួន}',
            speak: `លំដាប់និងការប្រៀបធៀបចំនួនគត់ធម្មជាតិ`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ប្រមាណវិធីបូក ដក គុណ ចែក',
            tag: 'លក្ខណៈផ្តុំ & បំបែក',
            caption: `ប្រមាណវិធីបូក និងគុណ មានលក្ខណៈត្រឡប់ ($a+b = b+a$) និងលក្ខណៈផ្តុំ ($(a+b)+c = a+(b+c)$)។ គុណបំបែកលើបូក ៖ $a(b+c) = ab + ac$។`,
            formula: 'a + b = b + a, \quad a \times (b + c) = a \times b + a \times c',
            speak: `ប្រមាណវិធីលើចំនួនគត់ និងលក្ខណៈបំបែក`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ការេនៃចំនួនគត់',
            tag: 'ផ្ទៃការេ n²',
            caption: `ការេនៃចំនួន $n$ គឺជាផលគុណនៃចំនួននោះនឹងខ្លួនវាផ្ទាល់ ៖ $n^2 = n \times n$។ ធរណីមាត្រតំណាងដោយផ្ទៃការេមានជ្រុងប្រវែង $n$ ឯកតា។`,
            formula: 'n^2 = n \times n, \quad 3^2 = 9, \quad 4^2 = 16, \quad 5^2 = 25',
            speak: `ការេនៃចំនួនគត់ស្មើនឹងចំនួននោះគុណនឹងខ្លួនឯង`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ គូបនៃចំនួនគត់',
            tag: 'មាឌគូប n³',
            caption: `គូបនៃចំនួន $n$ គឺជាផលគុណ ៣ កត្តាស្មើគ្នា ៖ $n^3 = n \times n \times n$។ ធរណីមាត្រតំណាងដោយមាឌនៃដុំគូប 3D មានទ្រនុងប្រវែង $n$ ឯកតា។`,
            formula: 'n^3 = n \times n \times n, \quad 2^3 = 8, \quad 3^3 = 27',
            speak: `គូបនៃចំនួនគត់តំណាងដោយមាឌនៃដុំគូបបីវិមាត្រ`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Powers & Exponents (Grade 8 - les-g8-02: ស្វ័យគុណ)
    // ========================================================================
    else if (simType === 'powers_exponents') {
      this.currentSteps = [
        {
          badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ និយមន័យស្វ័យគុណ',
          caption: `ស្វ័យគុណទី $n$ នៃចំនួន $a$ គឺជាផលគុណ $n$ កត្តាស្មើនឹង $a$ ៖ $a^n = \\underbrace{a \\times a \\times \\dots \\times a}_{n \\text{ កត្តា}}$ ($a$ ជាគោល, $n$ ជានិទស្សន្ត)។ និយមន័យពិសេស ៖ $a^1 = a$, $a^0 = 1$ ($a \\ne 0$)។`,
          formula: 'a^n = \\prod_{i=1}^n a, \\quad a^0 = 1 \\quad (a \\ne 0)',
          speak: `ស្វ័យគុណទីអិននៃអា ជាផលគុណអិនកត្តាស្មើនឹងអា`
        },
        {
          badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ រូបមន្តប្រមាណវិធីលើស្វ័យគុណ',
          tag: 'រូបមន្តគ្រឹះ ៥ យ៉ាង',
          caption: `(១) $a^m \times a^n = a^{m+n}$<br>(២) $\frac{a^m}{a^n} = a^{m-n}$ ($a \ne 0$)<br>(៣) $(a^m)^n = a^{mn}$<br>(៤) $(ab)^n = a^n b^n$<br>(៥) $(\frac{a}{b})^n = \frac{a^n}{b^n}$ ($b \ne 0$)។`,
          formula: 'a^m \times a^n = a^{m+n}, \quad (a^m)^n = a^{mn}, \quad a^{-n} = \dfrac{1}{a^n}',
          speak: `រូបមន្តប្រមាណវិធីលើស្វ័យគុណ`
        }
      ];
    }

    else if (simType === 'rational_numbers') {
      const a = this.workbenchState.ratA !== undefined ? this.workbenchState.ratA : 3;
      const b = this.workbenchState.ratB !== undefined ? this.workbenchState.ratB : 4;
      const val = b !== 0 ? a / b : 0;
      const decStr = Math.abs(val % 1) === 0 ? `${val}` : val.toFixed(3);
      const isPos = a > 0;
      const isZero = a === 0;
      const statusText = isZero ? '⚪ ចំនួនសូន្យ (0)' : isPos ? '🟢 ចំនួនសនិទានវិជ្ជមាន (> 0)' : '🔴 ចំនួនសនិទានអវិជ្ជមាន (< 0)';

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔢 ភាគយក a = <strong id="m3d-rat-a-val">${a}</strong> ៖</span>
            <input type="range" id="m3d-rat-a-slider" class="m3d-range-slider" min="-8" max="8" step="1" value="${a}" oninput="Math3D.setRationalA(this.value)">
            <span class="m3d-slider-label" style="margin-left:14px;">🍰 ភាគបែង b = <strong id="m3d-rat-b-val">${b}</strong> ៖</span>
            <input type="range" id="m3d-rat-b-slider" class="m3d-range-slider" min="1" max="8" step="1" value="${b}" oninput="Math3D.setRationalB(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight" id="m3d-rat-frac-pill">ទម្រង់ប្រភាគ ៖ <strong>${a} / ${b}</strong></span>
            <span class="m3d-stat-pill info" id="m3d-rat-dec-pill">ទសភាគ ៖ <strong>≈ ${decStr}</strong></span>
            <span class="m3d-stat-pill" id="m3d-rat-status-pill">${statusText}</span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <button class="m3d-wb-btn" onclick="Math3D.setRationalPreset(1, 2)">½ (កន្លះ)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setRationalPreset(3, 4)">¾ (០.៧៥)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setRationalPreset(-3, 2)">-1.5 (-3/2)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setRationalPreset(1, 3)">⅓ (ទសភាគខួប ០.(៣))</button>
            <button class="m3d-wb-btn" onclick="Math3D.setRationalPreset(-5, 4)">-5/4 (-1.25)</button>
          </div>
        </div>
      `;
    }
    // Case 12: Integers Number Line (Grade 7 - les-g7-01)
    else if (simType === 'integers_number_line') {
      const a = this.workbenchState.numA !== undefined ? this.workbenchState.numA : 2;
      const b = this.workbenchState.numB !== undefined ? this.workbenchState.numB : 3;
      const op = this.workbenchState.numOp || '+';
      let res = a + b;
      if (op === '-') res = a - b;
      else if (op === '*') res = a * b;
      else if (op === '/') res = b !== 0 ? (a / b).toFixed(1) : '∞';

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-wb-modes">
            <button class="m3d-wb-tab ${op === '+' ? 'active' : ''}" onclick="Math3D.setIntegerOp('+')">➕ ផលបូក (+)</button>
            <button class="m3d-wb-tab ${op === '-' ? 'active' : ''}" onclick="Math3D.setIntegerOp('-')">➖ ផលដក (-)</button>
            <button class="m3d-wb-tab ${op === '*' ? 'active' : ''}" onclick="Math3D.setIntegerOp('*')">✖️ ផលគុណ (×)</button>
            <button class="m3d-wb-tab ${op === '/' ? 'active' : ''}" onclick="Math3D.setIntegerOp('/')">➗ ផលចែក (÷)</button>
          </div>
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔢 ចំនួនទីមួយ a = <strong id="m3d-num-a-val">${a}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-5" max="5" value="${a}" oninput="Math3D.setIntegerA(this.value)">
            <span class="m3d-slider-label" style="margin-left:12px;">🔢 ចំនួនទីពីរ b = <strong id="m3d-num-b-val">${b}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="-5" max="5" value="${b}" oninput="Math3D.setIntegerB(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">ប្រមាណវិធី ៖ <strong>(${a}) ${op === '*' ? '×' : op === '/' ? '÷' : op} (${b}) = ${res}</strong></span>
            <span class="m3d-stat-pill info">ទិសដៅលើបន្ទាត់ចំនួន ៖ ${res >= 0 ? '↗ ផ្នែកវិជ្ជមាន' : '↙ ផ្នែកអវិជ្ជមាន'}</span>
          </div>
        </div>
      `;
    }
    // Case 13: Fractions & Decimals (Grade 7 - les-g7-02)
    else if (simType === 'fractions_decimals') {
      const N = this.workbenchState.fracN !== undefined ? this.workbenchState.fracN : 3;
      const D = this.workbenchState.fracD !== undefined ? this.workbenchState.fracD : 4;
      const dec = (N / D).toFixed(3);
      const pct = ((N / D) * 100).toFixed(1);

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🍰 ភាគយក N = <strong id="m3d-frac-n-val">${N}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="1" max="${D}" value="${N}" oninput="Math3D.setFractionN(this.value)">
            <span class="m3d-slider-label" style="margin-left:12px;">🥧 ភាគបែង D = <strong id="m3d-frac-d-val">${D}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="2" max="8" value="${D}" oninput="Math3D.setFractionD(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">ប្រភាគ ៖ <strong>${N} / ${D}</strong></span>
            <span class="m3d-stat-pill">ទសភាគ ៖ <strong>${dec}</strong></span>
            <span class="m3d-stat-pill info">ភាគរយ ៖ <strong>${pct}%</strong></span>
          </div>
        </div>
      `;
    }
    // Case 13b: Decimals Grid Laboratory (Grade 7 - les-g7-05)
    else if (simType === 'decimals_grid') {
      const decVal = this.workbenchState.decVal !== undefined ? this.workbenchState.decVal : 0.35;
      const tenths = Math.floor(Math.round(decVal * 100) / 10);
      const hundredths = Math.round(decVal * 100) % 10;
      const totalH = Math.round(decVal * 100);
      const fracStr = this.simplifyFraction ? this.simplifyFraction(totalH, 100) : `${totalH}/100`;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔢 តម្លៃទសភាគ = <strong id="m3d-dec-val">${decVal.toFixed(2)}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="0.01" max="0.99" step="0.01" value="${decVal}" oninput="Math3D.setDecimalVal(this.value)">
            <button class="m3d-wb-btn primary" onclick="Math3D.multiplyDecimalBy10()">⚡ គុណនឹង ១០ (×10)</button>
            <button class="m3d-wb-btn" onclick="Math3D.divideDecimalBy10()">➗ ចែកនឹង ១០ (÷10)</button>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">ទសភាគ ៖ <strong>${decVal.toFixed(2)}</strong></span>
            <span class="m3d-stat-pill info">ខ្ទង់ភាគដប់ ៖ <strong>${tenths} (0.${tenths})</strong></span>
            <span class="m3d-stat-pill" style="border-color:#f59e0b; color:#fbbf24;">ខ្ទង់ភាគរយ ៖ <strong>${hundredths} (0.0${hundredths})</strong></span>
            <span class="m3d-stat-pill">ប្រភាគ ៖ <strong>${fracStr}</strong></span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <button class="m3d-wb-btn" onclick="Math3D.setDecimalPreset(0.25)">0.25 (1/4)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDecimalPreset(0.50)">0.50 (1/2)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDecimalPreset(0.75)">0.75 (3/4)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDecimalPreset(0.35)">0.35 (35/100)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDecimalPreset(0.80)">0.80 (4/5)</button>
          </div>
        </div>
      `;
    }
    // Case 13c: Percentage & Discount Laboratory (Grade 7 - les-g7-06)
    else if (simType === 'percentage_cube') {
      const pctVal = this.workbenchState.pctVal !== undefined ? this.workbenchState.pctVal : 35;
      const origPrice = this.workbenchState.origPrice !== undefined ? this.workbenchState.origPrice : 40000;
      const discountAmt = (origPrice * pctVal) / 100;
      const finalPrice = origPrice - discountAmt;
      const fracStr = this.simplifyFraction ? this.simplifyFraction(pctVal, 100) : `${pctVal}/100`;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📊 ភាគរយ P = <strong id="m3d-pct-val">${pctVal}%</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="100" step="1" value="${pctVal}" oninput="Math3D.setPercentVal(this.value)">
            <span class="m3d-slider-label" style="margin-left:12px;">🏷️ តម្លៃទំនិញដើម ៖</span>
            <button class="m3d-wb-btn" onclick="Math3D.setDiscountPrice(40000)">៤០,០០០ ៛</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDiscountPrice(60000)">៦០,០០០ ៛</button>
            <button class="m3d-wb-btn" onclick="Math3D.setDiscountPrice(100000)">១០០,០០០ ៛</button>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">ភាគរយ ៖ <strong>${pctVal}% = ${fracStr}</strong></span>
            <span class="m3d-stat-pill">តម្លៃដើម ៖ <strong>${origPrice.toLocaleString()} ៛</strong></span>
            <span class="m3d-stat-pill" style="border-color:#f43f5e; color:#fb7185;">បញ្ចុះតម្លៃ (-${pctVal}%) ៖ <strong>-${discountAmt.toLocaleString()} ៛</strong></span>
            <span class="m3d-stat-pill info">ប្រាក់ត្រូវបង់ ៖ <strong>${finalPrice.toLocaleString()} ៛</strong></span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <button class="m3d-wb-btn" onclick="Math3D.setPercentPreset(10)">10% (1/10)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setPercentPreset(20)">20% (1/5)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setPercentPreset(25)">25% (1/4)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setPercentPreset(50)">50% (កន្លះតម្លៃ)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setPercentPreset(75)">75% (3/4)</button>
          </div>
        </div>
      `;
    }
    // Case 14: Linear Equation Balance Scale (Grade 7 - les-g7-09, Grade 8 - les-g8-07, Grade 9 - les-g9-04)
    else if (simType === 'linear_equation_balance') {
      const a = this.workbenchState.balA !== undefined ? this.workbenchState.balA : 2;
      const b = this.workbenchState.balB !== undefined ? this.workbenchState.balB : 3;
      const c = this.workbenchState.balC !== undefined ? this.workbenchState.balC : 7;
      const x = this.workbenchState.balX !== undefined ? this.workbenchState.balX : 2;
      const leftW = a * x + b;
      const isEq = Math.abs(leftW - c) < 0.01;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">⚖️ សាកល្បងទម្ងន់ x = <strong id="m3d-bal-x-val">${x}</strong> ៖</span>
            <input type="range" id="m3d-bal-slider" class="m3d-range-slider" min="0" max="8" step="0.5" value="${x}" oninput="Math3D.setBalanceX(this.value)">
            <button class="m3d-wb-btn primary" onclick="Math3D.autoSolveBalance()">⚡ រកសមភាពស្វ័យប្រវត្តិ (Solve)</button>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">សមីការ ៖ <strong>${a}x + ${b} = ${c}</strong></span>
            <span class="m3d-stat-pill ${isEq ? 'info' : ''}" id="m3d-bal-status">ស្ថានភាព ៖ <strong>${isEq ? '✅ តុល្យភាពស្មើគ្នា!' : (leftW > c ? '❌ ឆ្វេងធ្ងន់ជាង (ផ្អៀង)' : '❌ ស្តាំធ្ងន់ជាង (ផ្អៀង)')}</strong></span>
            <span class="m3d-stat-pill">ឫសពិត ៖ <strong>x = ${(c - b) / a}</strong></span>
          </div>
          <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
            <button class="m3d-wb-btn" onclick="Math3D.setBalancePreset(2)">x = 2 (ឫសពិត ✅)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setBalancePreset(1)">x = 1 (ផ្អៀងស្តាំ)</button>
            <button class="m3d-wb-btn" onclick="Math3D.setBalancePreset(3)">x = 3 (ផ្អៀងឆ្វេង)</button>
          </div>
        </div>
      `;
    }
    // Case 15: Polynomials & Factoring (Grade 8 - les-g8-01, les-g8-02)
    else if (simType === 'polynomial_factoring') {
      const a = this.workbenchState.polyA !== undefined ? this.workbenchState.polyA : 2.0;
      const b = this.workbenchState.polyB !== undefined ? this.workbenchState.polyB : 1.0;
      const exp = this.workbenchState.polyExplode !== undefined ? this.workbenchState.polyExplode : 0.8;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">💥 បំបែកប្លុក 3D (Explode) ៖</span>
            <input type="range" class="m3d-range-slider" min="0" max="25" value="${exp * 10}" oninput="Math3D.setPolyExplode(this.value/10)">
            <span class="m3d-slider-val" id="m3d-poly-exp">${exp}</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">រូបមន្តគូប ៖ <strong>(a+b)³ = a³ + 3a²b + 3ab² + b³</strong></span>
            <span class="m3d-stat-pill info">ចំនួន ៨ ប្លុកផ្គុំចូលគ្នា</span>
          </div>
        </div>
      `;
    }
    // Case 16: Pythagorean Theorem (Grade 8 - les-g8-03)
    else if (simType === 'pythagoras_theorem') {
      const a = this.workbenchState.pythA !== undefined ? this.workbenchState.pythA : 3;
      const b = this.workbenchState.pythB !== undefined ? this.workbenchState.pythB : 4;
      const c = Math.sqrt(a * a + b * b);

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">📐 ជ្រុង a = <strong id="m3d-pyth-a">${a}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="2" max="5" value="${a}" oninput="Math3D.setPythagorasA(this.value)">
            <span class="m3d-slider-label" style="margin-left:12px;">📐 ជ្រុង b = <strong id="m3d-pyth-b">${b}</strong> ៖</span>
            <input type="range" class="m3d-range-slider" min="2" max="5" value="${b}" oninput="Math3D.setPythagorasB(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">a² = <strong>${a * a}</strong></span>
            <span class="m3d-stat-pill highlight">b² = <strong>${b * b}</strong></span>
            <span class="m3d-stat-pill info">c² = a² + b² = <strong>${a * a + b * b}</strong></span>
            <span class="m3d-stat-pill">អ៊ីប៉ូតេនុស c = <strong>${c.toFixed(2)}</strong></span>
          </div>
        </div>
      `;
    }
    // Case 17: Quadratic Delta (Grade 9 - les-g9-01)
    else if (simType === 'quadratic_delta') {
      const a = this.workbenchState.quadA !== undefined ? this.workbenchState.quadA : 1.0;
      const b = this.workbenchState.quadB !== undefined ? this.workbenchState.quadB : -2.0;
      const c = this.workbenchState.quadC !== undefined ? this.workbenchState.quadC : -3.0;
      const delta = b * b - 4 * a * c;

      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-wb-modes">
            <button class="m3d-wb-tab ${delta > 0 ? 'active' : ''}" onclick="Math3D.setDeltaPreset('two')">🟢 Δ > 0 (ឫស ២)</button>
            <button class="m3d-wb-tab ${delta === 0 ? 'active' : ''}" onclick="Math3D.setDeltaPreset('one')">🟡 Δ = 0 (ឫសឌុប)</button>
            <button class="m3d-wb-tab ${delta < 0 ? 'active' : ''}" onclick="Math3D.setDeltaPreset('none')">🔴 Δ < 0 (គ្មានឫសពិត)</button>
          </div>
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">កត្តា c ៖</span>
            <input type="range" class="m3d-range-slider" min="-5" max="5" step="0.5" value="${c}" oninput="Math3D.setQuadraticC(this.value)">
            <span class="m3d-slider-val" id="m3d-quad-c">${c}</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">សមីការ ៖ <strong>${a}x² + (${b})x + (${c}) = 0</strong></span>
            <span class="m3d-stat-pill info">ដីសគ្រីមីណង់ Δ = <strong>${delta.toFixed(1)}</strong></span>
          </div>
        </div>
      `;
    }
    // Case 18: System of 2 Equations (Grade 9 - les-g9-02)
    else if (simType === 'linear_system_2vars') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-wb-modes">
            <button class="m3d-wb-tab active" onclick="Math3D.setLinearPreset('intersect')">📍 កាត់គ្នា (១ ចំណុច)</button>
            <button class="m3d-wb-tab" onclick="Math3D.setLinearPreset('parallel')">⏸️ ស្របគ្នា (គ្មានចម្លើយ)</button>
            <button class="m3d-wb-tab" onclick="Math3D.setLinearPreset('coincident')">🔄 ត្រួតស៊ីគ្នា (រាប់មិនអស់)</button>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">បន្ទាត់ L₁ ៖ y = x + 1</span>
            <span class="m3d-stat-pill highlight">បន្ទាត់ L₂ ៖ y = -0.5x + 4</span>
            <span class="m3d-stat-pill info">ចម្លើយប្រព័ន្ធ (x, y) ៖ <strong>(2.0, 3.0)</strong></span>
          </div>
        </div>
      `;
    }
    // Case 19: Circle Inscribed & Central Angles (Grade 9 - les-g9-03)
    else if (simType === 'circle_inscribed_angle') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">🔄 អូសចំណុច M ជុំវិញរង្វង់ ៖</span>
            <input type="range" class="m3d-range-slider" min="15" max="340" value="135" oninput="Math3D.setCircleAngleM(this.value)">
            <span class="m3d-slider-val" id="m3d-circle-m">135°</span>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">មុំផ្ចិត AOB ៖ <strong>117°</strong></span>
            <span class="m3d-stat-pill info">មុំចារឹកក្នុង AMB ៖ <strong>58.5°</strong></span>
            <span class="m3d-stat-pill">លក្ខណៈ ៖ <strong>AMB = ½ AOB ជានិច្ច!</strong></span>
          </div>
        </div>
      `;
    }
    // Case 20: Parabola Study (Grade 10 - les-g10-01)
    else if (simType === 'parabola_study') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-slider-wrap">
            <span class="m3d-slider-label">កំពូល h ៖</span>
            <input type="range" class="m3d-range-slider" min="-3" max="3" step="0.5" value="1" oninput="Math3D.setParabolaH(this.value)">
            <span class="m3d-slider-label" style="margin-left:8px;">កំពូល k ៖</span>
            <input type="range" class="m3d-range-slider" min="-3" max="3" step="0.5" value="-1.5" oninput="Math3D.setParabolaK(this.value)">
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">រាងស្តង់ដា ៖ <strong>y = a(x - h)² + k</strong></span>
            <span class="m3d-stat-pill info">អ័ក្សឆ្លុះ ៖ <strong>x = h</strong></span>
          </div>
        </div>
      `;
    }
    // Case 21: Mathematical Induction (Grade 11 - les-g11a-1-3)
    else if (simType === 'mathematical_induction') {
      wb.style.display = 'block';
      wb.innerHTML = `
        <div class="m3d-wb-container">
          <div class="m3d-wb-actions">
            <button class="m3d-wb-btn primary" onclick="Math3D.triggerDominoFall()">💥 ទម្លាក់ដូមីណូពិសោធន៍ (Trigger Cascade)</button>
            <button class="m3d-wb-btn danger" onclick="Math3D.resetDominoes()">🔄 រៀបដូមីណូឡើងវិញ (Reset)</button>
          </div>
          <div class="m3d-wb-stats">
            <span class="m3d-stat-pill highlight">ជំហានទី ១ ៖ <strong>P(1) ពិត</strong> (ដូមីណូ ១ ដួល)</span>
            <span class="m3d-stat-pill info">ជំហានទី ២ ៖ <strong>P(k) ⇒ P(k+1)</strong> (បន្តដួលទៅមុខ)</span>
            <span class="m3d-stat-pill">សន្និដ្ឋាន ៖ <strong>∀n P(n) ពិត</strong></span>
          </div>
        </div>
      `;
    } else {
      wb.style.display = 'none';
      wb.innerHTML = '';
    }

    if (window.renderMathInElement) {
      window.renderMathInElement(wb, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false
      });
    }
  }

  // --------------------------------------------------------------------------
  // Interactive Handlers for New Specialized Laboratories (G7 - G11)
  // --------------------------------------------------------------------------
  setIntegerA(val) {
    this.workbenchState.numA = parseInt(val, 10);
    const el = document.getElementById('m3d-num-a-val');
    if (el) el.textContent = val;
    this.buildNumberLineScene();
    this.renderWorkbench();
  }

  setIntegerB(val) {
    this.workbenchState.numB = parseInt(val, 10);
    const el = document.getElementById('m3d-num-b-val');
    if (el) el.textContent = val;
    this.buildNumberLineScene();
    this.renderWorkbench();
  }

  setIntegerOp(op) {
    this.workbenchState.numOp = op;
    this.buildNumberLineScene();
    this.renderWorkbench();
  }

  setFractionN(val) {
    this.workbenchState.fracN = parseInt(val, 10);
    this.buildFractionsScene();
    this.renderWorkbench();
  }

  setFractionD(val) {
    this.workbenchState.fracD = parseInt(val, 10);
    if (this.workbenchState.fracN > this.workbenchState.fracD) {
      this.workbenchState.fracN = this.workbenchState.fracD;
    }
    this.buildFractionsScene();
    this.renderWorkbench();
  }

  // --- Decimals Grid Handlers (Grade 7 - les-g7-05) ---
  setDecimalVal(val) {
    this.workbenchState.decVal = parseFloat(val);
    const numEl = document.getElementById('m3d-dec-val');
    if (numEl) numEl.textContent = parseFloat(val).toFixed(2);
    this.buildDecimalsGridScene();
    this.renderWorkbench();
  }

  setDecimalPreset(val) {
    this.workbenchState.decVal = val;
    this.renderWorkbench();
    this.buildDecimalsGridScene();
  }

  multiplyDecimalBy10() {
    let cur = this.workbenchState.decVal !== undefined ? this.workbenchState.decVal : 0.35;
    cur = Math.min(0.99, cur * 10);
    this.setDecimalPreset(Math.round(cur * 100) / 100);
  }

  divideDecimalBy10() {
    let cur = this.workbenchState.decVal !== undefined ? this.workbenchState.decVal : 0.35;
    cur = Math.max(0.01, cur / 10);
    this.setDecimalPreset(Math.round(cur * 100) / 100);
  }

  // --- Percentage & Discount Handlers (Grade 7 - les-g7-06) ---
  setPercentVal(val) {
    this.workbenchState.pctVal = parseInt(val, 10);
    const numEl = document.getElementById('m3d-pct-val');
    if (numEl) numEl.textContent = `${val}%`;
    this.buildPercentageCubeScene();
    this.renderWorkbench();
  }

  setPercentPreset(val) {
    this.workbenchState.pctVal = val;
    this.renderWorkbench();
    this.buildPercentageCubeScene();
  }

  setDiscountPrice(price) {
    this.workbenchState.origPrice = price;
    this.renderWorkbench();
    this.buildPercentageCubeScene();
  }

  // --- Divisors & Multiples Handlers (Grade 7 - les-g7-02) ---
  setDivisorN(val) {
    this.workbenchState.divN = parseInt(val, 10);
    const numEl = document.getElementById('m3d-div-n-val');
    if (numEl) numEl.textContent = val;
    this.updateDivisorHUD();
    this.buildDivisorsMultiplesScene();
  }

  setDivisorD(val) {
    this.workbenchState.divD = parseInt(val, 10);
    const divEl = document.getElementById('m3d-div-d-val');
    if (divEl) divEl.textContent = val;
    this.updateDivisorHUD();
    this.buildDivisorsMultiplesScene();
  }

  setDivisorPreset(n, d) {
    this.workbenchState.divN = n;
    this.workbenchState.divD = d;
    this.renderWorkbench();
    this.buildDivisorsMultiplesScene();
  }

  updateDivisorHUD() {
    const N = this.workbenchState.divN !== undefined ? this.workbenchState.divN : 12;
    const d = this.workbenchState.divD !== undefined ? this.workbenchState.divD : 3;
    const r = N % d;
    const q = Math.floor(N / d);
    const isDivisible = (r === 0);

    const statusPill = document.getElementById('m3d-div-status-pill');
    if (statusPill) {
      statusPill.textContent = isDivisible
        ? `✅ ${N} ចែកដាច់នឹង ${d} (${N} = ${d} × ${q})`
        : `❌ ${N} ចែកមិនដាច់នឹង ${d} (សំណល់ r = ${r})`;
      if (isDivisible) statusPill.classList.add('highlight');
      else statusPill.classList.remove('highlight');
    }

    const remPill = document.getElementById('m3d-div-rem-pill');
    if (remPill) remPill.innerHTML = `សំណល់ ៖ <strong>r = ${r}</strong>`;
  }

  // --- Whole Numbers Handlers (Grade 7 - les-g7-01) ---
  setWholeN(val) {
    this.workbenchState.wholeN = parseInt(val, 10);
    const el = document.getElementById('m3d-whole-n-val');
    if (el) el.textContent = val;
    this.renderWorkbench();
    this.buildWholeNumbersScene();
  }

  setWholePreset(n) {
    this.workbenchState.wholeN = n;
    this.renderWorkbench();
    this.buildWholeNumbersScene();
  }

  // --- Powers & Exponents Handlers (Grade 8 - les-g8-02) ---
  setPowerA(val) {
    this.workbenchState.powA = parseInt(val, 10);
    const el = document.getElementById('m3d-pow-a-val');
    if (el) el.textContent = val;
    this.renderWorkbench();
    this.buildPowersExponentsScene();
  }

  setPowerN(val) {
    this.workbenchState.powN = parseInt(val, 10);
    const el = document.getElementById('m3d-pow-n-val');
    if (el) el.textContent = val;
    this.renderWorkbench();
    this.buildPowersExponentsScene();
  }

  // --- Inequality Solution Ray Handlers ---
  setIneqX(val) {
    this.workbenchState.ineqX = parseFloat(val);
    const el = document.getElementById('m3d-ineq-x-val');
    if (el) el.textContent = val;
    this.buildInequalityRayScene();
  }

  setIneqRel(rel) {
    this.workbenchState.ineqRel = rel;
    this.renderWorkbench();
    this.buildInequalityRayScene();
  }

  // --- Equation of a Line Handlers ---
  setLineM(val) {
    this.workbenchState.lineM = parseFloat(val);
    const el = document.getElementById('m3d-line-m-val');
    if (el) el.textContent = val;
    this.buildLineSlopeInterceptScene();
  }

  setLineB(val) {
    this.workbenchState.lineB = parseFloat(val);
    const el = document.getElementById('m3d-line-b-val');
    if (el) el.textContent = val;
    this.buildLineSlopeInterceptScene();
  }

  // --- Coordinate Plane Handlers ---
  setCoordX(val) {
    this.workbenchState.coordX = parseFloat(val);
    const el = document.getElementById('m3d-coord-x-val');
    if (el) el.textContent = val;
    this.buildCoordinatePlaneGraphScene();
  }

  setCoordY(val) {
    this.workbenchState.coordY = parseFloat(val);
    const el = document.getElementById('m3d-coord-y-val');
    if (el) el.textContent = val;
    this.buildCoordinatePlaneGraphScene();
  }

  // --- Angles Protractor Handlers ---
  setAngDeg(val) {
    this.workbenchState.angDeg = parseInt(val, 10);
    const el = document.getElementById('m3d-ang-deg-val');
    if (el) el.textContent = val + '°';
    this.buildAnglesProtractorScene();
  }

  // --- Rational Numbers Handlers ---
  setRationalA(val) {
    this.workbenchState.ratA = parseInt(val, 10);
    const el = document.getElementById('m3d-rat-a-val');
    if (el) el.textContent = val;
    this.updateRationalWorkbenchStats();
    this.buildRationalNumbersScene();
  }

  setRationalB(val) {
    let b = parseInt(val, 10);
    if (b === 0) b = 1;
    this.workbenchState.ratB = b;
    const el = document.getElementById('m3d-rat-b-val');
    if (el) el.textContent = b;
    this.updateRationalWorkbenchStats();
    this.buildRationalNumbersScene();
  }

  setRationalPreset(a, b) {
    this.workbenchState.ratA = a;
    this.workbenchState.ratB = b;
    const sliderA = document.getElementById('m3d-rat-a-slider');
    const sliderB = document.getElementById('m3d-rat-b-slider');
    if (sliderA) sliderA.value = a;
    if (sliderB) sliderB.value = b;
    const elA = document.getElementById('m3d-rat-a-val');
    const elB = document.getElementById('m3d-rat-b-val');
    if (elA) elA.textContent = a;
    if (elB) elB.textContent = b;
    this.updateRationalWorkbenchStats();
    this.buildRationalNumbersScene();
  }

  updateRationalWorkbenchStats() {
    const a = this.workbenchState.ratA !== undefined ? this.workbenchState.ratA : 3;
    const b = this.workbenchState.ratB !== undefined ? this.workbenchState.ratB : 4;
    const val = b !== 0 ? a / b : 0;
    const decStr = Math.abs(val % 1) === 0 ? `${val}` : val.toFixed(3);
    const isPos = a > 0;
    const isZero = a === 0;
    const statusText = isZero ? '⚪ ចំនួនសូន្យ (0)' : isPos ? '🟢 ចំនួនសនិទានវិជ្ជមាន (> 0)' : '🔴 ចំនួនសនិទានអវិជ្ជមាន (< 0)';

    const fracPill = document.getElementById('m3d-rat-frac-pill');
    if (fracPill) fracPill.innerHTML = `ទម្រង់ប្រភាគ ៖ <strong>${a} / ${b}</strong>`;

    const decPill = document.getElementById('m3d-rat-dec-pill');
    if (decPill) decPill.innerHTML = `ទសភាគ ៖ <strong>≈ ${decStr}</strong>`;

    const statusPill = document.getElementById('m3d-rat-status-pill');
    if (statusPill) statusPill.textContent = statusText;
  }

  // --- Balance Scale Handlers ---
  setBalanceX(val) {
    this.workbenchState.balX = parseFloat(val);
    const el = document.getElementById('m3d-bal-x-val');
    if (el) el.textContent = val;

    const a = this.workbenchState.balA !== undefined ? this.workbenchState.balA : 2;
    const b = this.workbenchState.balB !== undefined ? this.workbenchState.balB : 3;
    const c = this.workbenchState.balC !== undefined ? this.workbenchState.balC : 7;
    const leftW = a * this.workbenchState.balX + b;
    const isEq = Math.abs(leftW - c) < 0.01;

    const statEl = document.getElementById('m3d-bal-status');
    if (statEl) {
      statEl.className = `m3d-stat-pill ${isEq ? 'info' : ''}`;
      statEl.innerHTML = `ស្ថានភាព ៖ <strong>${isEq ? '✅ តុល្យភាពស្មើគ្នា!' : (leftW > c ? '❌ ឆ្វេងធ្ងន់ជាង (ផ្អៀង)' : '❌ ស្តាំធ្ងន់ជាង (ផ្អៀង)')}</strong>`;
    }

    this.buildBalanceScaleScene();
  }

  setBalancePreset(xVal) {
    this.workbenchState.balX = xVal;
    const slider = document.getElementById('m3d-bal-slider');
    if (slider) slider.value = xVal;
    this.setBalanceX(xVal);
  }

  autoSolveBalance() {
    const a = this.workbenchState.balA !== undefined ? this.workbenchState.balA : 2;
    const b = this.workbenchState.balB !== undefined ? this.workbenchState.balB : 3;
    const c = this.workbenchState.balC !== undefined ? this.workbenchState.balC : 7;
    const root = (c - b) / a;
    this.setBalancePreset(root);
  }

  setPolyExplode(val) {
    this.workbenchState.polyExplode = parseFloat(val);
    const el = document.getElementById('m3d-poly-exp');
    if (el) el.textContent = val;
    this.buildPolynomialVolumeScene();
  }

  setPythagorasA(val) {
    this.workbenchState.pythA = parseInt(val, 10);
    this.buildPythagorasScene();
    this.renderWorkbench();
  }

  setPythagorasB(val) {
    this.workbenchState.pythB = parseInt(val, 10);
    this.buildPythagorasScene();
    this.renderWorkbench();
  }

  setQuadraticC(val) {
    this.workbenchState.quadC = parseFloat(val);
    this.buildQuadraticDeltaScene();
    this.renderWorkbench();
  }

  setDeltaPreset(mode) {
    if (mode === 'two') {
      this.workbenchState.quadA = 1.0;
      this.workbenchState.quadB = -2.0;
      this.workbenchState.quadC = -3.0; // Delta = 4 - 4(1)(-3) = 16 > 0
    } else if (mode === 'one') {
      this.workbenchState.quadA = 1.0;
      this.workbenchState.quadB = -4.0;
      this.workbenchState.quadC = 4.0; // Delta = 16 - 16 = 0
    } else {
      this.workbenchState.quadA = 1.0;
      this.workbenchState.quadB = 2.0;
      this.workbenchState.quadC = 4.0; // Delta = 4 - 16 = -12 < 0
    }
    this.buildQuadraticDeltaScene();
    this.renderWorkbench();
  }

  setLinearPreset(mode) {
    if (mode === 'intersect') {
      this.workbenchState.lsM1 = 1.0;
      this.workbenchState.lsC1 = 1.0;
      this.workbenchState.lsM2 = -0.5;
      this.workbenchState.lsC2 = 4.0;
    } else if (mode === 'parallel') {
      this.workbenchState.lsM1 = 1.2;
      this.workbenchState.lsC1 = 1.0;
      this.workbenchState.lsM2 = 1.2;
      this.workbenchState.lsC2 = -2.0;
    } else {
      this.workbenchState.lsM1 = 0.8;
      this.workbenchState.lsC1 = 2.0;
      this.workbenchState.lsM2 = 0.8;
      this.workbenchState.lsC2 = 2.0;
    }
    this.buildLinearSystemScene();
    this.renderWorkbench();
  }

  setCircleAngleM(val) {
    const deg = parseFloat(val);
    this.workbenchState.circleM = (deg * Math.PI) / 180;
    const el = document.getElementById('m3d-circle-m');
    if (el) el.textContent = `${deg}°`;
    this.buildCircleAngleScene();
  }

  setParabolaH(val) {
    this.workbenchState.parabH = parseFloat(val);
    this.buildParabolaStudyScene();
    this.renderWorkbench();
  }

  setParabolaK(val) {
    this.workbenchState.parabK = parseFloat(val);
    this.buildParabolaStudyScene();
    this.renderWorkbench();
  }

  triggerDominoFall() {
    if (this.simParams && this.simParams.mode === 'induction') {
      this.simParams.isFalling = true;
      this.simParams.time = 0;
    }
  }

  resetDominoes() {
    if (this.simParams && this.simParams.mode === 'induction') {
      this.simParams.isFalling = false;
      this.simParams.time = 0;
      if (this.simParams.dominoes) {
        this.simParams.dominoes.forEach(d => {
          d.currentAngle = 0;
          d.targetAngle = 0;
          d.group.rotation.z = 0;
        });
      }
    }
  }


  // --------------------------------------------------------------------------
  // 3D Laboratory 12: Statistics & 3D Normal Distribution
  // --------------------------------------------------------------------------
  buildStatisticsScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;

    if (pIdx === 0) {
      // Point 1: 3D Histogram Bar Chart (Class intervals and frequencies)
      const freqs = [1.2, 2.6, 4.2, 3.5, 2.0, 0.8];
      const colors = [0x38bdf8, 0x6366f1, 0xa855f7, 0xec4899, 0xf59e0b, 0x10b981];
      const bars = [];
      freqs.forEach((h, i) => {
        const x = (i - (freqs.length - 1) / 2) * 1.1;
        const geo = new THREE.BoxGeometry(0.9, h, 0.9);
        const mat = new THREE.MeshStandardMaterial({ color: colors[i], metalness: 0.2, roughness: 0.3 });
        const box = new THREE.Mesh(geo, mat);
        box.position.set(x, h / 2, 0);
        this.animGroup.add(box);
        bars.push(box);
      });
      this.simParams = { mode: 'stat_histogram', bars, time: 0 };
    } else {
      // Point 2 & 3: 3D Gaussian Normal Distribution Surface
      const size = 32;
      const gridGeo = new THREE.PlaneGeometry(7, 7, size, size);
      const pos = gridGeo.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        const z = Math.exp(-(x * x + y * y) / 3.0) * 3.2;
        pos.setZ(i, z);
      }
      gridGeo.computeVertexNormals();

      const bellMat = new THREE.MeshStandardMaterial({
        color: 0x3b82f6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.65
      });
      const bellMesh = new THREE.Mesh(gridGeo, bellMat);
      bellMesh.rotation.x = -Math.PI / 2;
      this.animGroup.add(bellMesh);

      const meanPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(0.04, 3.5),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      meanPlane.position.set(0, 1.75, 0);
      this.animGroup.add(meanPlane);

      this.simParams = { mode: 'stat_bell', bellMesh, time: 0 };
    }
  }

  buildDifferentialScene() {


    this.clearAnimGroup();
    this.addCoordinateGrid();
    const particleCount = 200;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 6;
      positions[i + 1] = (Math.random() - 0.5) * 6;
      positions[i + 2] = (Math.random() - 0.5) * 4;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particles = new THREE.Points(geo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.15 }));
    this.animGroup.add(particles);

    this.simParams = { mode: 'differential', particles, count: particleCount };
  }


  // --------------------------------------------------------------------------
  // Utility: 3D High-Contrast Billboard Label Sprite
  // --------------------------------------------------------------------------
  createLabelSprite(text, color = '#38bdf8', bgColor = 'rgba(15, 23, 42, 0.88)') {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    // Rounded background container
    ctx.fillStyle = bgColor;
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    const r = 18;
    ctx.beginPath();
    ctx.moveTo(r, 6);
    ctx.lineTo(320 - r, 6);
    ctx.quadraticCurveTo(320 - 6, 6, 320 - 6, r);
    ctx.lineTo(320 - 6, 96 - r);
    ctx.quadraticCurveTo(320 - 6, 96 - 6, 320 - r, 96 - 6);
    ctx.lineTo(r, 96 - 6);
    ctx.quadraticCurveTo(6, 96 - 6, 6, 96 - r);
    ctx.lineTo(6, r);
    ctx.quadraticCurveTo(6, 6, r, 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // High clarity text
    ctx.fillStyle = color;
    ctx.font = 'bold 30px "Kantumruy Pro", "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 160, 48);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.72, 1);
    return sprite;
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Integers on 3D Number Line (Grade 7 - les-g7-01)
  // --------------------------------------------------------------------------
  buildNumberLineScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const a = this.workbenchState.numA !== undefined ? this.workbenchState.numA : 2;
    const b = this.workbenchState.numB !== undefined ? this.workbenchState.numB : 3;
    const op = this.workbenchState.numOp || (pIdx === 1 ? '-' : pIdx === 2 ? '*' : pIdx === 3 ? '/' : '+');

    // Central 3D number line rod
    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 14, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.3 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 0, 0);
    this.animGroup.add(rod);

    // End arrows
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 16);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const lMesh = new THREE.Mesh(arrowGeo, arrowMat);
    lMesh.rotation.z = Math.PI / 2;
    lMesh.position.set(-7.2, 0, 0);
    this.animGroup.add(lMesh);

    const rMesh = new THREE.Mesh(arrowGeo, arrowMat);
    rMesh.rotation.z = -Math.PI / 2;
    rMesh.position.set(7.2, 0, 0);
    this.animGroup.add(rMesh);

    // Integer tick pillars & labels
    for (let i = -6; i <= 6; i++) {
      const x = i * 1.1;
      const isZero = i === 0;
      const isPos = i > 0;
      const col = isZero ? 0xfacc15 : isPos ? 0x10b981 : 0xef4444;

      const tickGeo = new THREE.BoxGeometry(0.12, isZero ? 0.9 : 0.5, 0.12);
      const tickMat = new THREE.MeshStandardMaterial({ color: col, emissive: isZero ? 0x713f12 : 0x000000 });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(x, 0.25, 0);
      this.animGroup.add(tick);

      const lbl = this.createLabelSprite(i > 0 ? `+${i}` : `${i}`, isZero ? '#facc15' : isPos ? '#34d399' : '#f87171', 'rgba(15,23,42,0.8)');
      lbl.scale.set(0.9, 0.35, 1);
      lbl.position.set(x, -0.6, 0);
      this.animGroup.add(lbl);
    }

    let result = a + b;
    if (op === '-') result = a - b;
    else if (op === '*') result = a * b;
    else if (op === '/') result = b !== 0 ? Math.round((a / b) * 10) / 10 : 0;

    const startX = 0;
    const midX = a * 1.1;
    const endX = Math.max(-6.5, Math.min(6.5, result)) * 1.1;

    // Vector 1 (Arrow from 0 to a)
    if (a !== 0) {
      const dir1 = a > 0 ? 1 : -1;
      const arr1 = new THREE.ArrowHelper(
        new THREE.Vector3(dir1, 0, 0),
        new THREE.Vector3(0, 0.7, 0),
        Math.abs(a * 1.1),
        0x38bdf8,
        0.35,
        0.2
      );
      this.animGroup.add(arr1);
    }

    // Vector 2 (Arrow from a to result)
    if (result !== a) {
      const diff = result - a;
      const dir2 = diff > 0 ? 1 : -1;
      const arr2 = new THREE.ArrowHelper(
        new THREE.Vector3(dir2, 0, 0),
        new THREE.Vector3(midX, 1.2, 0),
        Math.abs(diff * 1.1),
        0xf59e0b,
        0.35,
        0.2
      );
      this.animGroup.add(arr2);
    }

    // Jumping traveler sphere
    const traveler = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x38bdf8, metalness: 0.1, roughness: 0.2 })
    );
    traveler.position.set(endX, 0.4, 0);
    this.animGroup.add(traveler);

    // Result marker ring
    const ringGeo = new THREE.RingGeometry(0.35, 0.45, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(endX, 0.05, 0);
    this.animGroup.add(ring);

    this.simParams = { mode: 'number_line', traveler, startX, midX, endX, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Fractions & Decimals (Grade 7 - les-g7-02)
  // --------------------------------------------------------------------------
  buildFractionsScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const N = this.workbenchState.fracN !== undefined ? this.workbenchState.fracN : 3;
    const D = this.workbenchState.fracD !== undefined ? this.workbenchState.fracD : 4;
    const R = 3.2;

    const wedges = [];
    const angleStep = (Math.PI * 2) / D;

    for (let i = 0; i < D; i++) {
      const isSelected = i < N;
      const startAngle = i * angleStep;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.arc(0, 0, R, startAngle, startAngle + angleStep - 0.02, false);
      shape.lineTo(0, 0);

      const extrudeSettings = {
        depth: isSelected ? 0.8 : 0.4,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.05,
        bevelThickness: 0.05
      };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const col = isSelected ? (i % 2 === 0 ? 0x38bdf8 : 0x06b6d4) : 0x1e293b;
      const mat = new THREE.MeshStandardMaterial({
        color: col,
        metalness: isSelected ? 0.3 : 0.1,
        roughness: isSelected ? 0.2 : 0.6,
        transparent: !isSelected,
        opacity: isSelected ? 1.0 : 0.45
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = isSelected ? 0.35 : 0;
      this.animGroup.add(mesh);
      wedges.push(mesh);
    }

    const fracLbl = this.createLabelSprite(`${N} / ${D} = ${(N / D).toFixed(2)} (${((N / D) * 100).toFixed(0)}%)`, '#38bdf8', 'rgba(15,23,42,0.9)');
    fracLbl.position.set(0, 2.2, 0);
    this.animGroup.add(fracLbl);

    const barWidth = 6.0;
    const segWidth = barWidth / D;
    for (let i = 0; i < D; i++) {
      const isSel = i < N;
      const x = -barWidth / 2 + (i + 0.5) * segWidth;
      const bGeo = new THREE.BoxGeometry(segWidth - 0.08, 0.4, 0.6);
      const bMat = new THREE.MeshStandardMaterial({
        color: isSel ? 0x10b981 : 0x334155,
        metalness: 0.2,
        roughness: 0.4
      });
      const bar = new THREE.Mesh(bGeo, bMat);
      bar.position.set(x, -1.8, 0);
      this.animGroup.add(bar);
    }

    this.simParams = { mode: 'fractions', wedges, N, D, time: 0 };
  }

  simplifyFraction(n, d) {
    if (!d || d === 0) return `${n}`;
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const g = Math.abs(gcd(Math.round(n), Math.round(d))) || 1;
    const sn = Math.round(n) / g;
    const sd = Math.round(d) / g;
    return sd === 1 ? `${sn}` : `${sn}/${sd}`;
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Decimals Grid & Place Value (Grade 7 - les-g7-05)
  // --------------------------------------------------------------------------
  buildDecimalsGridScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const pIdx = this.activePointIndex;
    let decVal = this.workbenchState.decVal !== undefined ? this.workbenchState.decVal : 0.35;
    decVal = Math.max(0.01, Math.min(0.99, parseFloat(decVal)));

    const tenths = Math.floor(Math.round(decVal * 100) / 10);
    const hundredths = Math.round(decVal * 100) % 10;
    const totalHundredths = Math.round(decVal * 100);

    // 1. Sleek metallic pedestal for the Base-10 10x10 Flat
    const basePlateGeo = new THREE.BoxGeometry(6.6, 0.25, 6.6);
    const basePlateMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.6,
      roughness: 0.3
    });
    const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
    basePlate.position.set(0, -0.15, 0);
    this.animGroup.add(basePlate);

    // Glowing border frame
    const frameGeo = new THREE.BoxGeometry(6.75, 0.1, 6.75);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
      wireframe: true
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.05, 0);
    this.animGroup.add(frame);

    // 2. 10 Columns representing Tenths (0.1 each)
    const colWidth = 0.52;
    const rowDepth = 0.52;
    const gridSpacing = 0.58;
    const startX = - (9 * gridSpacing) / 2;
    const startZ = - (9 * gridSpacing) / 2;

    const tiles = [];
    const pulsingHundredths = [];

    for (let c = 0; c < 10; c++) {
      const colX = startX + c * gridSpacing;
      const isFullTenth = c < tenths;
      const isPartialCol = c === tenths;

      for (let r = 0; r < 10; r++) {
        const rowZ = startZ + r * gridSpacing;
        const cellIdx = c * 10 + r;
        const isFilled = cellIdx < totalHundredths;
        const isHundredthUnit = isPartialCol && (r < hundredths);

        let cellH = 0.22;
        let cellCol = 0x1e293b;
        let cellOp = 0.35;
        let emissiveCol = 0x000000;
        let emissiveInt = 0;

        if (isFullTenth) {
          // Whole Tenths: Cyan-Emerald metallic glow
          cellH = 0.45;
          cellCol = (c % 2 === 0) ? 0x06b6d4 : 0x0ea5e9;
          cellOp = 0.95;
          emissiveCol = 0x0284c7;
          emissiveInt = 0.2;
        } else if (isHundredthUnit) {
          // Individual Hundredths: Amber-Gold radiant glow!
          cellH = 0.65;
          cellCol = 0xf59e0b;
          cellOp = 1.0;
          emissiveCol = 0xd97706;
          emissiveInt = 0.5;
        }

        const tileGeo = new THREE.BoxGeometry(colWidth, cellH, rowDepth);
        const tileMat = new THREE.MeshStandardMaterial({
          color: cellCol,
          metalness: isFilled ? 0.4 : 0.1,
          roughness: isFilled ? 0.2 : 0.7,
          transparent: !isFilled,
          opacity: cellOp,
          emissive: emissiveCol,
          emissiveIntensity: emissiveInt
        });
        const tile = new THREE.Mesh(tileGeo, tileMat);
        tile.position.set(colX, cellH / 2, rowZ);
        this.animGroup.add(tile);
        tiles.push(tile);

        if (isHundredthUnit) {
          pulsingHundredths.push(tile);
        }
      }

      // Column Header Label (0.1, 0.2, ... 1.0)
      if (c === 0 || c === 4 || c === 9 || c === tenths) {
        const colLbl = this.createLabelSprite(`${((c + 1) * 0.1).toFixed(1)}`, '#94a3b8', 'rgba(15,23,42,0.85)');
        colLbl.scale.set(1.1, 0.55, 1);
        colLbl.position.set(colX, 0.15, -3.8);
        this.animGroup.add(colLbl);
      }
    }

    // 3. Futuristic Floating Place-Value Digital Display
    const plaqueGroup = new THREE.Group();
    plaqueGroup.position.set(0, 3.2, 0);

    const panelGeo = new THREE.BoxGeometry(7.2, 1.4, 0.15);
    const panelMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.2,
      transparent: true,
      opacity: 0.88
    });
    const panel = new THREE.Mesh(panelGeo, panelMat);
    plaqueGroup.add(panel);

    const borderGeo = new THREE.BoxGeometry(7.3, 1.5, 0.05);
    const borderMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, wireframe: true });
    const border = new THREE.Mesh(borderGeo, borderMat);
    plaqueGroup.add(border);

    const decText = `${decVal.toFixed(2)}`;
    const fracSimplified = this.simplifyFraction(totalHundredths, 100);
    const placeBanner = this.createLabelSprite(
      `ចំនួនទសភាគ ៖ ${decText}  |  ${tenths} ភាគដប់ (0.${tenths}) + ${hundredths} ភាគរយ (0.0${hundredths}) = ${fracSimplified}`,
      '#38bdf8',
      'rgba(15,23,42,0.92)'
    );
    placeBanner.scale.set(4.8, 1.1, 1);
    placeBanner.position.set(0, 0, 0.12);
    plaqueGroup.add(placeBanner);

    this.animGroup.add(plaqueGroup);

    // Floating animated Decimal Point marker
    const dotGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xeab308,
      emissiveIntensity: 0.8
    });
    const dotMesh = new THREE.Mesh(dotGeo, dotMat);
    dotMesh.position.set(0, 1.8, 0);
    this.animGroup.add(dotMesh);

    this.simParams = {
      mode: 'decimals_grid',
      tiles,
      pulsingHundredths,
      dotMesh,
      decVal,
      tenths,
      hundredths,
      totalHundredths,
      time: 0
    };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Percentage Cube Tower & Discount Simulator (Grade 7 - les-g7-06)
  // --------------------------------------------------------------------------
  buildPercentageCubeScene() {
    if (!this.animGroup) return;
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const pIdx = this.activePointIndex;
    let pctVal = this.workbenchState.pctVal !== undefined ? this.workbenchState.pctVal : 35;
    pctVal = Math.max(0, Math.min(100, parseInt(pctVal, 10)));
    const origPrice = this.workbenchState.origPrice !== undefined ? this.workbenchState.origPrice : 40000;
    const discountAmt = (origPrice * pctVal) / 100;
    const finalPrice = origPrice - discountAmt;

    // 1. Sleek Laboratory Platform
    const platformGeo = new THREE.CylinderGeometry(5.2, 5.5, 0.35, 36);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.7,
      roughness: 0.25
    });
    const platform = new THREE.Mesh(platformGeo, platformMat);
    platform.position.set(0, -0.2, 0);
    this.animGroup.add(platform);

    const rimGeo = new THREE.TorusGeometry(5.2, 0.06, 16, 64);
    const rimMat = new THREE.MeshBasicMaterial({ color: 0x8b5cf6 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    rim.rotation.x = Math.PI / 2;
    rim.position.set(0, -0.02, 0);
    this.animGroup.add(rim);

    // 2. 100-Cube Percentage Monolith Matrix (Left side: x = -2.5)
    const matrixGroup = new THREE.Group();
    matrixGroup.position.set(-2.5, 0.2, 0);

    const cubeSize = 0.32;
    const cubeGap = 0.38;
    const startX = - (9 * cubeGap) / 2;
    const startY = 0.25;

    const percentCubes = [];
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const idx = row * 10 + col;
        const isFilled = idx < pctVal;

        const cX = startX + col * cubeGap;
        const cY = startY + row * cubeGap;

        const cGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const hue = 0.55 + (idx / 100) * 0.35;
        const colVal = new THREE.Color().setHSL(hue, 0.9, isFilled ? 0.55 : 0.15);

        const cMat = new THREE.MeshStandardMaterial({
          color: colVal,
          metalness: isFilled ? 0.4 : 0.1,
          roughness: isFilled ? 0.2 : 0.8,
          transparent: !isFilled,
          opacity: isFilled ? 0.95 : 0.25,
          emissive: isFilled ? colVal : 0x000000,
          emissiveIntensity: isFilled ? 0.35 : 0
        });
        const cubeMesh = new THREE.Mesh(cGeo, cMat);
        cubeMesh.position.set(cX, cY, 0);
        matrixGroup.add(cubeMesh);

        if (isFilled) percentCubes.push(cubeMesh);
      }
    }
    this.animGroup.add(matrixGroup);

    // Label for 100-Cube Tower
    const towerLbl = this.createLabelSprite(`ប្លុក ១០០ គ្រាប់ ៖ ${pctVal}/100 (${pctVal}%)`, '#c084fc', 'rgba(15,23,42,0.85)');
    towerLbl.scale.set(2.4, 0.7, 1);
    towerLbl.position.set(-2.5, 4.3, 0);
    this.animGroup.add(towerLbl);

    // 3. Center/Right: 3D Radial Percent Gauge & Discount Shopping Box (x = +2.4)
    const gaugeGroup = new THREE.Group();
    gaugeGroup.position.set(2.4, 3.2, 0);

    const gaugeR = 1.4;
    const gaugeTrackGeo = new THREE.TorusGeometry(gaugeR, 0.1, 16, 64, Math.PI * 1.5);
    const gaugeTrackMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.5 });
    const gaugeTrack = new THREE.Mesh(gaugeTrackGeo, gaugeTrackMat);
    gaugeTrack.rotation.z = -Math.PI * 0.75;
    gaugeGroup.add(gaugeTrack);

    const fillAngle = (pctVal / 100) * Math.PI * 1.5;
    if (fillAngle > 0.02) {
      const activeArcGeo = new THREE.TorusGeometry(gaugeR, 0.14, 16, 64, fillAngle);
      const activeArcMat = new THREE.MeshStandardMaterial({
        color: 0xa855f7,
        emissive: 0x9333ea,
        emissiveIntensity: 0.6
      });
      const activeArc = new THREE.Mesh(activeArcGeo, activeArcMat);
      activeArc.rotation.z = -Math.PI * 0.75;
      gaugeGroup.add(activeArc);
    }

    // Dial Needle
    const needleGeo = new THREE.CylinderGeometry(0.04, 0.08, gaugeR * 0.9, 8);
    const needleMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, emissive: 0xe11d48, emissiveIntensity: 0.5 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.y = (gaugeR * 0.9) / 2;
    const needlePivot = new THREE.Group();
    needlePivot.add(needle);
    needlePivot.rotation.z = -Math.PI * 0.75 - fillAngle + Math.PI / 2;
    gaugeGroup.add(needlePivot);

    const pctLbl = this.createLabelSprite(`${pctVal}%`, '#f43f5e', 'rgba(15,23,42,0.9)');
    pctLbl.scale.set(1.5, 0.8, 1);
    pctLbl.position.set(0, 0, 0.1);
    gaugeGroup.add(pctLbl);

    this.animGroup.add(gaugeGroup);

    // 4. Stylized 3D Commercial Product / Gift Box with Discount Badge
    const productGroup = new THREE.Group();
    productGroup.position.set(2.4, 0.8, 0);

    const boxGeo = new THREE.BoxGeometry(1.6, 1.4, 1.4);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0x3b82f6,
      metalness: 0.3,
      roughness: 0.3
    });
    const prodBox = new THREE.Mesh(boxGeo, boxMat);
    productGroup.add(prodBox);

    const ribbonV = new THREE.Mesh(new THREE.BoxGeometry(0.24, 1.44, 1.44), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.5 }));
    const ribbonH = new THREE.Mesh(new THREE.BoxGeometry(1.64, 0.24, 1.44), new THREE.MeshStandardMaterial({ color: 0xfbbf24, metalness: 0.5 }));
    productGroup.add(ribbonV);
    productGroup.add(ribbonH);

    const discBadge = this.createLabelSprite(
      `🏷️ បញ្ចុះ -${pctVal}%\nដើម ៖ ${origPrice.toLocaleString()} ៛\nនៅសល់ ៖ ${finalPrice.toLocaleString()} ៛`,
      '#10b981',
      'rgba(15,23,42,0.92)'
    );
    discBadge.scale.set(2.4, 1.0, 1);
    discBadge.position.set(0, 1.4, 0);
    productGroup.add(discBadge);

    this.animGroup.add(productGroup);

    this.simParams = {
      mode: 'percentage_cube',
      percentCubes,
      needlePivot,
      productGroup,
      pctVal,
      origPrice,
      discountAmt,
      finalPrice,
      time: 0
    };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Rational Numbers (Grade 8 - les-g8-01)
  // --------------------------------------------------------------------------
  buildRationalNumbersScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const pIdx = this.activePointIndex;
    const a = this.workbenchState.ratA !== undefined ? this.workbenchState.ratA : 3;
    const b = this.workbenchState.ratB !== undefined ? this.workbenchState.ratB : 4;
    const val = b !== 0 ? a / b : 0;

    // 1. Sleek Central 3D Number Line Rod
    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 14, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.3 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.z = Math.PI / 2;
    rod.position.set(0, 0, 0);
    this.animGroup.add(rod);

    // End Arrow heads
    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 16);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const lMesh = new THREE.Mesh(arrowGeo, arrowMat);
    lMesh.rotation.z = Math.PI / 2;
    lMesh.position.set(-7.2, 0, 0);
    this.animGroup.add(lMesh);

    const rMesh = new THREE.Mesh(arrowGeo, arrowMat);
    rMesh.rotation.z = -Math.PI / 2;
    rMesh.position.set(7.2, 0, 0);
    this.animGroup.add(rMesh);

    // Integer tick pillars & sub-ticks
    const unitScale = 2.2;
    for (let i = -3; i <= 3; i++) {
      const posX = i * unitScale;
      const isZero = i === 0;
      const tickGeo = new THREE.BoxGeometry(0.12, isZero ? 1.0 : 0.6, 0.12);
      const tickMat = new THREE.MeshStandardMaterial({
        color: isZero ? 0xfacc15 : (i > 0 ? 0x10b981 : 0xef4444),
        emissive: isZero ? 0x713f12 : 0x000000
      });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(posX, isZero ? 0.5 : 0.3, 0);
      this.animGroup.add(tick);

      const lbl = this.createLabelSprite(
        i > 0 ? `+${i}` : `${i}`,
        isZero ? '#facc15' : (i > 0 ? '#34d399' : '#f87171'),
        'rgba(15,23,42,0.85)'
      );
      lbl.scale.set(0.9, 0.35, 1);
      lbl.position.set(posX, -0.6, 0);
      this.animGroup.add(lbl);

      // Sub-ticks for denominator b
      if (i < 3 && b > 1) {
        for (let s = 1; s < b; s++) {
          const subX = posX + (s / b) * unitScale;
          const subGeo = new THREE.BoxGeometry(0.04, 0.25, 0.04);
          const subMat = new THREE.MeshBasicMaterial({ color: 0x64748b });
          const subTick = new THREE.Mesh(subGeo, subMat);
          subTick.position.set(subX, 0.125, 0);
          this.animGroup.add(subTick);
        }
      }
    }

    // 2. Rational Position Marker & Vector Arrow from 0
    const markerX = Math.max(-6.8, Math.min(6.8, val * unitScale));
    const isPos = val >= 0;
    const colHex = isPos ? 0x38bdf8 : 0xf43f5e;
    const colStr = isPos ? '#38bdf8' : '#f43f5e';

    if (Math.abs(val) > 0.001) {
      const dirX = val > 0 ? 1 : -1;
      const arr = new THREE.ArrowHelper(
        new THREE.Vector3(dirX, 0, 0),
        new THREE.Vector3(0, 0.8, 0),
        Math.abs(markerX),
        colHex,
        0.35,
        0.22
      );
      this.animGroup.add(arr);
    }

    // Glowing pointer pin at the rational coordinate
    const pinGroup = new THREE.Group();
    pinGroup.position.set(markerX, 0, 0);

    const pinConeGeo = new THREE.ConeGeometry(0.2, 0.5, 16);
    const pinConeMat = new THREE.MeshStandardMaterial({
      color: colHex,
      emissive: colHex,
      emissiveIntensity: 0.4
    });
    const pinCone = new THREE.Mesh(pinConeGeo, pinConeMat);
    pinCone.rotation.z = Math.PI;
    pinCone.position.set(0, 0.55, 0);
    pinGroup.add(pinCone);

    const ringGeo = new THREE.RingGeometry(0.25, 0.38, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: colHex, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.05, 0);
    pinGroup.add(ring);

    // Floating Fraction badge above marker
    const fracText = a < 0 ? `-${Math.abs(a)}/${b}` : `${a}/${b}`;
    const decText = Math.abs(val % 1) === 0 ? `${val}` : val.toFixed(2);
    const ratLbl = this.createLabelSprite(`q = ${fracText} ≈ ${decText}`, colStr, 'rgba(15,23,42,0.92)');
    ratLbl.scale.set(1.5, 0.5, 1);
    ratLbl.position.set(0, 1.4, 0);
    pinGroup.add(ratLbl);
    this.animGroup.add(pinGroup);

    // 3. 3D Segmented Fraction Bar Visualizer (Floating above at Y = 2.7)
    const barWidth = 5.6;
    const segWidth = barWidth / b;
    const barGroup = new THREE.Group();
    barGroup.position.set(0, 2.7, 0);

    const absA = Math.abs(a);
    for (let i = 0; i < b; i++) {
      const isFilled = i < absA;
      const segGeo = new THREE.BoxGeometry(segWidth - 0.08, 0.45, 0.6);
      const segMat = new THREE.MeshStandardMaterial({
        color: isFilled ? colHex : 0x1e293b,
        metalness: isFilled ? 0.4 : 0.1,
        roughness: isFilled ? 0.3 : 0.7,
        transparent: !isFilled,
        opacity: isFilled ? 0.95 : 0.45
      });
      const segMesh = new THREE.Mesh(segGeo, segMat);
      segMesh.position.set(-barWidth / 2 + (i + 0.5) * segWidth, 0, 0);
      barGroup.add(segMesh);
    }

    const barTitle = this.createLabelSprite(
      `បំណែងចែក ៖ |a| = ${absA} លើ b = ${b} ភាគ`,
      '#94a3b8',
      'rgba(15,23,42,0.8)'
    );
    barTitle.scale.set(1.8, 0.45, 1);
    barTitle.position.set(0, 0.65, 0);
    barGroup.add(barTitle);

    this.animGroup.add(barGroup);

    this.simParams = {
      mode: 'rational_numbers',
      pinGroup,
      barGroup,
      time: 0
    };
  }


  // --------------------------------------------------------------------------
  // 3D Laboratory: Divisors & Multiples (Grade 7 - les-g7-02: តួចែក និងពហុគុណ)
  // --------------------------------------------------------------------------
  buildDivisorsMultiplesScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const N = this.workbenchState.divN !== undefined ? this.workbenchState.divN : 12;
    const d = this.workbenchState.divD !== undefined ? this.workbenchState.divD : 3;
    const pIdx = this.activePointIndex; // 0: Divisors & Divisibility, 1: Primes & Prime Factorization, 2: GCD & LCM
    const B = this.workbenchState.divB !== undefined ? this.workbenchState.divB : 18;

    if (pIdx === 0) {
      // Point 1: តួចែក និងលក្ខណៈចែកដាច់ (Rectangular Factor Array N = d * q + r)
      const q = Math.floor(N / d);
      const r = N % d;
      const isDivisible = (r === 0);

      // Base plate for perfect array
      const plateGeo = new THREE.BoxGeometry(d * 0.9 + 0.2, 0.08, q * 0.9 + 0.2);
      const plateMat = new THREE.MeshStandardMaterial({
        color: isDivisible ? 0x064e3b : 0x451a03,
        transparent: true,
        opacity: 0.6,
        roughness: 0.5
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, 0.04, 0);
      this.animGroup.add(plate);

      // Cubes for full rows (q rows of d cubes)
      for (let row = 0; row < q; row++) {
        for (let col = 0; col < d; col++) {
          const x = (col - (d - 1) / 2) * 0.9;
          const z = (row - (q - 1) / 2) * 0.9;
          const cubeGeo = new THREE.BoxGeometry(0.75, 0.55, 0.75);
          const cubeMat = new THREE.MeshStandardMaterial({
            color: isDivisible ? 0x10b981 : 0x0ea5e9,
            metalness: 0.4,
            roughness: 0.25,
            emissive: isDivisible ? 0x065f46 : 0x0369a1
          });
          const cube = new THREE.Mesh(cubeGeo, cubeMat);
          cube.position.set(x, 0.35, z);
          this.animGroup.add(cube);

          const edgeGeo = new THREE.EdgesGeometry(cubeGeo);
          const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 });
          cube.add(new THREE.LineSegments(edgeGeo, edgeMat));
        }
      }

      // If remainder r > 0, place leftover cubes separated in the "Remainder Tray"
      if (r > 0) {
        const trayX = (d * 0.9) / 2 + 1.2;
        const trayPlateGeo = new THREE.BoxGeometry(0.9 * r + 0.3, 0.08, 1.1);
        const trayPlateMat = new THREE.MeshStandardMaterial({ color: 0x7f1d1d, transparent: true, opacity: 0.7 });
        const trayPlate = new THREE.Mesh(trayPlateGeo, trayPlateMat);
        trayPlate.position.set(trayX + (r - 1) * 0.45, 0.04, 0);
        this.animGroup.add(trayPlate);

        for (let i = 0; i < r; i++) {
          const rx = trayX + i * 0.9;
          const rGeo = new THREE.BoxGeometry(0.75, 0.55, 0.75);
          const rMat = new THREE.MeshStandardMaterial({
            color: 0xef4444,
            metalness: 0.4,
            roughness: 0.2,
            emissive: 0x991b1b
          });
          const rCube = new THREE.Mesh(rGeo, rMat);
          rCube.position.set(rx, 0.35, 0);
          this.animGroup.add(rCube);

          const edgeGeo = new THREE.EdgesGeometry(rGeo);
          const edgeMat = new THREE.LineBasicMaterial({ color: 0xfff1f2, transparent: true, opacity: 0.6 });
          rCube.add(new THREE.LineSegments(edgeGeo, edgeMat));
        }

        const rLbl = this.createLabelSprite(`សំណល់ r = ${r} (សល់)`, '#fca5a5', 'rgba(127,29,29,0.85)');
        rLbl.scale.set(1.4, 0.45, 1);
        rLbl.position.set(trayX + (r - 1) * 0.45, 1.1, 0);
        this.animGroup.add(rLbl);
      }

      // Title & Formula 3D Banner above array
      const bannerText = isDivisible
        ? `${N} = ${d} × ${q} (ចែកដាច់! ${d} ជាតួចែកនៃ ${N})`
        : `${N} = ${d} × ${q} + ${r} (មិនដាច់! សំណល់ r=${r} ≠ 0)`;
      const bannerCol = isDivisible ? '#34d399' : '#f87171';
      const bannerBg = isDivisible ? 'rgba(6,78,59,0.9)' : 'rgba(127,29,29,0.9)';
      const banner = this.createLabelSprite(bannerText, bannerCol, bannerBg);
      banner.scale.set(3.8, 0.65, 1);
      banner.position.set(0, 2.2, 0);
      this.animGroup.add(banner);

      const dLbl = this.createLabelSprite(`ទទឹង d = ${d}`, '#38bdf8', 'rgba(15,23,42,0.85)');
      dLbl.scale.set(1.3, 0.4, 1);
      dLbl.position.set(0, 0.3, -(q * 0.9) / 2 - 0.7);
      this.animGroup.add(dLbl);

      const qLbl = this.createLabelSprite(`ផលចែក q = ${q}`, '#f59e0b', 'rgba(15,23,42,0.85)');
      qLbl.scale.set(1.3, 0.4, 1);
      qLbl.position.set(-(d * 0.9) / 2 - 0.9, 0.3, 0);
      this.animGroup.add(qLbl);

    } else if (pIdx === 1) {
      // Point 2: ចំនួនបឋម និងការបំបែកជាកត្តាបឋម (Prime Factorization)
      const isPrime = (num) => {
        if (num < 2) return false;
        for (let i = 2; i <= Math.sqrt(num); i++) {
          if (num % i === 0) return false;
        }
        return true;
      };

      const prime = isPrime(N);

      if (prime) {
        // Prime number: Single row 1 x N
        for (let i = 0; i < N; i++) {
          const x = (i - (N - 1) / 2) * 0.75;
          const geo = new THREE.BoxGeometry(0.65, 0.65, 0.65);
          const mat = new THREE.MeshStandardMaterial({
            color: 0xfacc15,
            metalness: 0.6,
            roughness: 0.2,
            emissive: 0x854d0e
          });
          const mesh = new THREE.Mesh(geo, mat);
          mesh.position.set(x, 0.4, 0);
          this.animGroup.add(mesh);
        }

        const banner = this.createLabelSprite(`⭐ ${N} ជាចំនួនបឋម (Prime Number) - មានតែតួចែក ២ គត់ គឺ ១ និង ${N}`, '#fef08a', 'rgba(113,63,18,0.9)');
        banner.scale.set(4.2, 0.65, 1);
        banner.position.set(0, 2.2, 0);
        this.animGroup.add(banner);

      } else {
        // Composite number: Stacked prime factor towers
        let temp = N;
        const primeFactors = [];
        let divisor = 2;
        while (temp >= 2) {
          while (temp % divisor === 0) {
            primeFactors.push(divisor);
            temp /= divisor;
          }
          divisor++;
          if (divisor * divisor > temp && temp > 1) {
            primeFactors.push(temp);
            break;
          }
        }

        const counts = {};
        primeFactors.forEach(f => counts[f] = (counts[f] || 0) + 1);
        const uniquePrimes = Object.keys(counts).map(Number);

        const factorColors = {
          2: 0x38bdf8,
          3: 0x10b981,
          5: 0xa855f7,
          7: 0xf59e0b,
          11: 0xec4899,
          13: 0x06b6d4
        };

        let xOffset = -(uniquePrimes.length - 1) * 1.3;
        uniquePrimes.forEach((p, pIndex) => {
          const count = counts[p];
          const px = xOffset + pIndex * 2.6;
          const col = factorColors[p] || 0x64748b;

          for (let h = 0; h < count; h++) {
            const geo = new THREE.BoxGeometry(1.1, 0.75, 1.1);
            const mat = new THREE.MeshStandardMaterial({
              color: col,
              metalness: 0.5,
              roughness: 0.25,
              emissive: 0x1e293b
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(px, 0.45 + h * 0.82, 0);
            this.animGroup.add(mesh);

            const numLbl = this.createLabelSprite(`${p}`, '#ffffff', 'transparent');
            numLbl.scale.set(0.6, 0.6, 1);
            numLbl.position.set(px, 0.45 + h * 0.82, 0.6);
            this.animGroup.add(numLbl);
          }

          const towLbl = this.createLabelSprite(`${p}^${count} = ${Math.pow(p, count)}`, '#f1f5f9', 'rgba(15,23,42,0.85)');
          towLbl.scale.set(1.4, 0.4, 1);
          towLbl.position.set(px, 0.45 + count * 0.82 + 0.4, 0);
          this.animGroup.add(towLbl);
        });

        const decompStr = Object.entries(counts).map(([p, c]) => c > 1 ? `${p}^${c}` : `${p}`).join(' × ');
        const banner = this.createLabelSprite(`${N} = ${decompStr} (ការបំបែកជាកត្តាបឋម)`, '#38bdf8', 'rgba(15,23,42,0.9)');
        banner.scale.set(3.8, 0.65, 1);
        banner.position.set(0, 3.2, 0);
        this.animGroup.add(banner);
      }

    } else {
      // Point 3: GCD & LCM
      const gcd = (x, y) => (!y ? x : gcd(y, x % y));
      const g = gcd(N, B);
      const l = (N * B) / g;

      // Track A (Multiples of N)
      const nSteps = Math.min(6, Math.floor(l / N) + 1);
      for (let i = 1; i <= nSteps; i++) {
        const mult = N * i;
        const x = (i - 1) * 1.5 - 3.5;
        const isCommon = (mult === l);
        const geo = new THREE.BoxGeometry(1.2, isCommon ? 1.6 : 0.8, 0.8);
        const mat = new THREE.MeshStandardMaterial({
          color: isCommon ? 0xfacc15 : 0x0284c7,
          emissive: isCommon ? 0x854d0e : 0x0369a1,
          metalness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, isCommon ? 0.8 : 0.4, -1.6);
        this.animGroup.add(mesh);

        const lbl = this.createLabelSprite(`${mult}`, isCommon ? '#fef08a' : '#e0f2fe', 'rgba(15,23,42,0.8)');
        lbl.scale.set(0.9, 0.35, 1);
        lbl.position.set(x, isCommon ? 1.8 : 1.0, -1.6);
        this.animGroup.add(lbl);
      }

      // Track B (Multiples of B)
      const bSteps = Math.min(6, Math.floor(l / B) + 1);
      for (let i = 1; i <= bSteps; i++) {
        const mult = B * i;
        const x = (i - 1) * 1.5 - 3.5;
        const isCommon = (mult === l);
        const geo = new THREE.BoxGeometry(1.2, isCommon ? 1.6 : 0.8, 0.8);
        const mat = new THREE.MeshStandardMaterial({
          color: isCommon ? 0xfacc15 : 0x7c3aed,
          emissive: isCommon ? 0x854d0e : 0x4c1d95,
          metalness: 0.4
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, isCommon ? 0.8 : 0.4, 1.6);
        this.animGroup.add(mesh);

        const lbl = this.createLabelSprite(`${mult}`, isCommon ? '#fef08a' : '#f3e8ff', 'rgba(15,23,42,0.8)');
        lbl.scale.set(0.9, 0.35, 1);
        lbl.position.set(x, isCommon ? 1.8 : 1.0, 1.6);
        this.animGroup.add(lbl);
      }

      const lblA = this.createLabelSprite(`ពហុគុណនៃ ${N}`, '#38bdf8', 'rgba(15,23,42,0.85)');
      lblA.scale.set(1.5, 0.4, 1);
      lblA.position.set(-4.5, 0.4, -1.6);
      this.animGroup.add(lblA);

      const lblB = this.createLabelSprite(`ពហុគុណនៃ ${B}`, '#c084fc', 'rgba(15,23,42,0.85)');
      lblB.scale.set(1.5, 0.4, 1);
      lblB.position.set(-4.5, 0.4, 1.6);
      this.animGroup.add(lblB);

      const banner = this.createLabelSprite(`GCD(${N}, ${B}) = ${g}  |  LCM(${N}, ${B}) = ${l}`, '#34d399', 'rgba(6,78,59,0.9)');
      banner.scale.set(4.2, 0.7, 1);
      banner.position.set(0, 2.8, 0);
      this.animGroup.add(banner);

      const relationLbl = this.createLabelSprite(`ទំនាក់ទំនង ៖ GCD × LCM = ${g} × ${l} = ${g * l} = ${N} × ${B}`, '#fef08a', 'rgba(15,23,42,0.85)');
      relationLbl.scale.set(4.5, 0.45, 1);
      relationLbl.position.set(0, 2.2, 0);
      this.animGroup.add(relationLbl);
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Whole Numbers & Place Value (Grade 7 - les-g7-01: ចំនួនគត់)
  // --------------------------------------------------------------------------
  buildWholeNumbersScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const N = this.workbenchState.wholeN !== undefined ? this.workbenchState.wholeN : 342;
    const pIdx = this.activePointIndex; // 0: Place value blocks, 1: Order, 2: Squares & Cubes

    if (pIdx === 2) {
      const n = Math.min(5, Math.max(1, this.workbenchState.powA || 3));

      // Left: 2D Square n x n
      const sqPlateGeo = new THREE.BoxGeometry(n * 0.7 + 0.1, 0.08, n * 0.7 + 0.1);
      const sqPlateMat = new THREE.MeshStandardMaterial({ color: 0x0369a1, transparent: true, opacity: 0.6 });
      const sqPlate = new THREE.Mesh(sqPlateGeo, sqPlateMat);
      sqPlate.position.set(-3.0, 0.04, 0);
      this.animGroup.add(sqPlate);

      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          const x = -3.0 + (c - (n - 1) / 2) * 0.7;
          const z = (r - (n - 1) / 2) * 0.7;
          const cubeGeo = new THREE.BoxGeometry(0.6, 0.25, 0.6);
          const cubeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.4, roughness: 0.3 });
          const cube = new THREE.Mesh(cubeGeo, cubeMat);
          cube.position.set(x, 0.2, z);
          this.animGroup.add(cube);
        }
      }

      const sqLbl = this.createLabelSprite(`ការេ ៖ ${n}² = ${n * n} ឯកតា`, '#38bdf8', 'rgba(15,23,42,0.85)');
      sqLbl.scale.set(2.2, 0.45, 1);
      sqLbl.position.set(-3.0, 1.8, 0);
      this.animGroup.add(sqLbl);

      // Right: 3D Cube n x n x n
      for (let y = 0; y < n; y++) {
        for (let r = 0; r < n; r++) {
          for (let c = 0; c < n; c++) {
            const x = 3.0 + (c - (n - 1) / 2) * 0.65;
            const z = (r - (n - 1) / 2) * 0.65;
            const cy = 0.35 + y * 0.65;
            const cubeGeo = new THREE.BoxGeometry(0.55, 0.55, 0.55);
            const cubeMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.4, roughness: 0.3 });
            const cube = new THREE.Mesh(cubeGeo, cubeMat);
            cube.position.set(x, cy, z);
            this.animGroup.add(cube);
          }
        }
      }

      const cubeLbl = this.createLabelSprite(`គូប ៖ ${n}³ = ${n * n * n} ឯកតា`, '#34d399', 'rgba(15,23,42,0.85)');
      cubeLbl.scale.set(2.2, 0.45, 1);
      cubeLbl.position.set(3.0, n * 0.65 + 0.9, 0);
      this.animGroup.add(cubeLbl);

      const topBanner = this.createLabelSprite(`ប្រៀបធៀបការេ (២ វិមាត្រ) និង គូប (៣ វិមាត្រ) សម្រាប់ n = ${n}`, '#fef08a', 'rgba(15,23,42,0.9)');
      topBanner.scale.set(4.4, 0.65, 1);
      topBanner.position.set(0, 3.2, 0);
      this.animGroup.add(topBanner);

    } else {
      const h = Math.floor((N % 1000) / 100);
      const t = Math.floor((N % 100) / 10);
      const u = N % 10;

      // Hundreds (Flats)
      for (let i = 0; i < Math.min(6, h); i++) {
        const slabGeo = new THREE.BoxGeometry(1.8, 0.15, 1.8);
        const slabMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.25 });
        const slab = new THREE.Mesh(slabGeo, slabMat);
        slab.position.set(-3.5, 0.12 + i * 0.22, 0);
        this.animGroup.add(slab);
      }
      const hLbl = this.createLabelSprite(`រយ (Hundreds) ៖ ${h} (${h * 100})`, '#38bdf8', 'rgba(15,23,42,0.85)');
      hLbl.scale.set(2.3, 0.42, 1);
      hLbl.position.set(-3.5, Math.max(1.5, h * 0.25 + 0.6), 0);
      this.animGroup.add(hLbl);

      // Tens (Rods)
      for (let i = 0; i < Math.min(9, t); i++) {
        const rodGeo = new THREE.BoxGeometry(0.25, 1.8, 0.25);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.4, roughness: 0.3 });
        const rod = new THREE.Mesh(rodGeo, rodMat);
        rod.position.set((i - (t - 1) / 2) * 0.38, 0.95, 0);
        this.animGroup.add(rod);
      }
      const tLbl = this.createLabelSprite(`ដប់ (Tens) ៖ ${t} (${t * 10})`, '#34d399', 'rgba(15,23,42,0.85)');
      tLbl.scale.set(2.0, 0.42, 1);
      tLbl.position.set(0, 2.3, 0);
      this.animGroup.add(tLbl);

      // Units (Cubes)
      for (let i = 0; i < Math.min(9, u); i++) {
        const cubeGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
        const cubeMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.4, roughness: 0.3 });
        const cube = new THREE.Mesh(cubeGeo, cubeMat);
        const row = Math.floor(i / 3);
        const col = i % 3;
        cube.position.set(3.5 + (col - 1) * 0.48, 0.25 + row * 0.48, 0);
        this.animGroup.add(cube);
      }
      const uLbl = this.createLabelSprite(`រាយ (Units) ៖ ${u} (${u})`, '#fbbf24', 'rgba(15,23,42,0.85)');
      uLbl.scale.set(2.0, 0.42, 1);
      uLbl.position.set(3.5, 2.1, 0);
      this.animGroup.add(uLbl);

      const banner = this.createLabelSprite(`${N} = ${h} × 100 + ${t} × 10 + ${u} × 1 (តម្លៃតាមខ្ទង់)`, '#fef08a', 'rgba(15,23,42,0.9)');
      banner.scale.set(4.2, 0.65, 1);
      banner.position.set(0, 3.2, 0);
      this.animGroup.add(banner);
    }
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Powers & Exponents (Grade 8 - les-g8-02: ស្វ័យគុណ)
  // --------------------------------------------------------------------------
  buildPowersExponentsScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const a = this.workbenchState.powA !== undefined ? this.workbenchState.powA : 2;
    const n = this.workbenchState.powN !== undefined ? this.workbenchState.powN : 3;

    const maxExp = 4;
    for (let exp = 0; exp <= maxExp; exp++) {
      const val = Math.pow(a, exp);
      const h = Math.min(3.5, 0.4 + exp * 0.7);
      const x = (exp - 2) * 1.8;
      const isActive = (exp === n);

      const geo = new THREE.BoxGeometry(1.2, h, 1.2);
      const mat = new THREE.MeshStandardMaterial({
        color: isActive ? 0xf59e0b : 0x0ea5e9,
        metalness: 0.5,
        roughness: 0.25,
        emissive: isActive ? 0x78350f : 0x0369a1
      });
      const tower = new THREE.Mesh(geo, mat);
      tower.position.set(x, h / 2, 0);
      this.animGroup.add(tower);

      const lbl = this.createLabelSprite(`${a}^${exp} = ${val}`, isActive ? '#fef08a' : '#e0f2fe', 'rgba(15,23,42,0.85)');
      lbl.scale.set(1.4, 0.42, 1);
      lbl.position.set(x, h + 0.4, 0);
      this.animGroup.add(lbl);
    }

    const banner = this.createLabelSprite(`ស្វ័យគុណ ៖ ${a}^${n} = ${Math.pow(a, n)} (គោល a = ${a}, និទស្សន្ត n = ${n})`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.5, 0.65, 1);
    banner.position.set(0, 3.2, 0);
    this.animGroup.add(banner);

    const rules = this.createLabelSprite(`រូបមន្ត ៖ aᵐ × aⁿ = aᵐ⁺ⁿ  |  (aᵐ)ⁿ = aᵐⁿ  |  a⁰ = 1`, '#a7f3d0', 'rgba(6,78,59,0.85)');
    rules.scale.set(4.4, 0.42, 1);
    rules.position.set(0, 2.5, 0);
    this.animGroup.add(rules);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Inequality Solution Ray (Grade 7 - les-g7-10, Grade 8 - les-g8-08, Grade 9 - les-g9-05)
  // --------------------------------------------------------------------------
  buildInequalityRayScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const x0 = this.workbenchState.ineqX !== undefined ? this.workbenchState.ineqX : 2;
    const rel = this.workbenchState.ineqRel || '>=';
    const isGreater = rel.includes('>');
    const isInclusive = rel.includes('=');

    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 14, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.5, roughness: 0.3 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.z = Math.PI / 2;
    this.animGroup.add(rod);

    const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 16);
    const arrowMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const lMesh = new THREE.Mesh(arrowGeo, arrowMat);
    lMesh.rotation.z = Math.PI / 2;
    lMesh.position.set(-7.2, 0, 0);
    this.animGroup.add(lMesh);

    const rMesh = new THREE.Mesh(arrowGeo, arrowMat);
    rMesh.rotation.z = -Math.PI / 2;
    rMesh.position.set(7.2, 0, 0);
    this.animGroup.add(rMesh);

    for (let i = -6; i <= 6; i++) {
      const tx = i * 1.1;
      const tickGeo = new THREE.BoxGeometry(0.08, i === 0 ? 0.7 : 0.4, 0.08);
      const tickMat = new THREE.MeshStandardMaterial({ color: i === 0 ? 0xfacc15 : 0x94a3b8 });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      tick.position.set(tx, 0.2, 0);
      this.animGroup.add(tick);

      const lbl = this.createLabelSprite(`${i}`, i === 0 ? '#facc15' : '#cbd5e1', 'rgba(15,23,42,0.8)');
      lbl.scale.set(0.8, 0.35, 1);
      lbl.position.set(tx, -0.55, 0);
      this.animGroup.add(lbl);
    }

    const bX = x0 * 1.1;
    const rayLen = isGreater ? (7.0 - bX) : (bX - (-7.0));
    const rayMidX = isGreater ? (bX + 7.0) / 2 : (bX + -7.0) / 2;

    const rayGeo = new THREE.CylinderGeometry(0.18, 0.18, rayLen, 16);
    const rayMat = new THREE.MeshStandardMaterial({
      color: isGreater ? 0x06b6d4 : 0xec4899,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2,
      emissive: isGreater ? 0x083344 : 0x500724
    });
    const ray = new THREE.Mesh(rayGeo, rayMat);
    ray.rotation.z = Math.PI / 2;
    ray.position.set(rayMidX, 0.35, 0);
    this.animGroup.add(ray);

    const dir = isGreater ? 1 : -1;
    for (let c = 1; c <= 3; c++) {
      const cx = bX + dir * c * (rayLen / 4);
      const coneGeo = new THREE.ConeGeometry(0.28, 0.45, 16);
      const coneMat = new THREE.MeshStandardMaterial({ color: isGreater ? 0x38bdf8 : 0xf472b6, emissive: 0x0f172a });
      const cone = new THREE.Mesh(coneGeo, coneMat);
      cone.rotation.z = isGreater ? -Math.PI / 2 : Math.PI / 2;
      cone.position.set(cx, 0.35, 0);
      this.animGroup.add(cone);
    }

    if (isInclusive) {
      const ballGeo = new THREE.SphereGeometry(0.32, 24, 24);
      const ballMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.5, roughness: 0.2, emissive: 0x064e3b });
      const ball = new THREE.Mesh(ballGeo, ballMat);
      ball.position.set(bX, 0.35, 0);
      this.animGroup.add(ball);
    } else {
      const ringGeo = new THREE.TorusGeometry(0.28, 0.08, 16, 24);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.2 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(bX, 0.35, 0);
      this.animGroup.add(ring);
    }

    const intervalStr = isGreater
      ? (isInclusive ? `x ∈ [${x0}, +∞)` : `x ∈ (${x0}, +∞)`)
      : (isInclusive ? `x ∈ (-∞, ${x0}]` : `x ∈ (-∞, ${x0})`);

    const banner = this.createLabelSprite(`វិសមភាព ៖ x ${rel} ${x0}  ⟹  ${intervalStr}`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.2, 0.65, 1);
    banner.position.set(0, 2.6, 0);
    this.animGroup.add(banner);

    const bTypeLbl = this.createLabelSprite(
      isInclusive ? `ចំណុចព្រំដែន ${x0} ៖ រាប់បញ្ចូល (ចន្លោះបិទ ●)` : `ចំណុចព្រំដែន ${x0} ៖ មិនរាប់បញ្ចូល (ចន្លោះបើក ○)`,
      isInclusive ? '#34d399' : '#38bdf8',
      'rgba(15,23,42,0.85)'
    );
    bTypeLbl.scale.set(4.0, 0.42, 1);
    bTypeLbl.position.set(0, 1.9, 0);
    this.animGroup.add(bTypeLbl);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Irrational Numbers (Grade 9 - les-g9-01: ចំនួនអសនិទាន)
  // --------------------------------------------------------------------------
  buildIrrationalNumbersScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const rodGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x64748b });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.rotation.z = Math.PI / 2;
    this.animGroup.add(rod);

    for (let i = 0; i <= 4; i++) {
      const x = i * 2.0;
      const tick = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.08), new THREE.MeshStandardMaterial({ color: 0x94a3b8 }));
      tick.position.set(x, 0.2, 0);
      this.animGroup.add(tick);

      const lbl = this.createLabelSprite(`${i}`, '#cbd5e1', 'rgba(15,23,42,0.8)');
      lbl.scale.set(0.8, 0.35, 1);
      lbl.position.set(x, -0.5, 0);
      this.animGroup.add(lbl);
    }

    const scale = 2.0;
    const basePts = [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(scale, 0.1, 0)];
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(basePts), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })));

    const altPts = [new THREE.Vector3(scale, 0.1, 0), new THREE.Vector3(scale, 0.1 + scale, 0)];
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(altPts), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })));

    const hypPts = [new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(scale, 0.1 + scale, 0)];
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(hypPts), new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 4 })));

    const r2 = Math.sqrt(2);
    const arcRadius = r2 * scale;
    const arcPts = [];
    for (let a = Math.PI / 4; a >= 0; a -= 0.04) {
      arcPts.push(new THREE.Vector3(arcRadius * Math.cos(a), 0.1 + arcRadius * Math.sin(a), 0));
    }
    const arcGeo = new THREE.BufferGeometry().setFromPoints(arcPts);
    const arcMat = new THREE.LineDashedMaterial({ color: 0x10b981, dashSize: 0.15, gapSize: 0.1 });
    const arc = new THREE.Line(arcGeo, arcMat);
    arc.computeLineDistances();
    this.animGroup.add(arc);

    const b2X = r2 * scale;
    const beacon = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x064e3b })
    );
    beacon.position.set(b2X, 0.2, 0);
    this.animGroup.add(beacon);

    const b2Lbl = this.createLabelSprite(`√2 ≈ 1.414`, '#34d399', 'rgba(6,78,59,0.9)');
    b2Lbl.scale.set(1.4, 0.42, 1);
    b2Lbl.position.set(b2X, -0.9, 0);
    this.animGroup.add(b2Lbl);

    const hypLbl = this.createLabelSprite(`c = √(1² + 1²) = √2`, '#fef08a', 'rgba(113,63,18,0.85)');
    hypLbl.scale.set(2.0, 0.42, 1);
    hypLbl.position.set(scale * 0.45, scale * 0.7, 0);
    this.animGroup.add(hypLbl);

    const banner = this.createLabelSprite(`សង់ចំនួនអសនិទាន √2 តាមធរណីមាត្រ (វង់ត្រីវិស័យទម្លាក់លើបន្ទាត់ចំនួន)`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.6, 0.65, 1);
    banner.position.set(0, 3.2, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Equation of a Line (Grade 9 - les-g9-10: សមីការនៃបន្ទាត់)
  // --------------------------------------------------------------------------
  buildLineSlopeInterceptScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const m = this.workbenchState.lineM !== undefined ? this.workbenchState.lineM : 1.5;
    const b = this.workbenchState.lineB !== undefined ? this.workbenchState.lineB : 1.0;

    const pts = [];
    for (let x = -4; x <= 4; x += 0.5) {
      const y = m * x + b;
      if (y >= -5 && y <= 6) {
        pts.push(new THREE.Vector3(x, y, 0));
      }
    }

    if (pts.length >= 2) {
      const curve = new THREE.CatmullRomCurve3(pts);
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.08, 12, false);
      const tubeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.5, roughness: 0.2 });
      this.animGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
    }

    const bMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.18, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x854d0e })
    );
    bMesh.position.set(0, b, 0);
    this.animGroup.add(bMesh);

    const bLbl = this.createLabelSprite(`(0, ${b}) ចំណុចប្រសព្វ y`, '#fef08a', 'rgba(113,63,18,0.85)');
    bLbl.scale.set(1.8, 0.4, 1);
    bLbl.position.set(1.2, b, 0);
    this.animGroup.add(bLbl);

    const x1 = 1.0;
    const y1 = m * x1 + b;
    const x2 = 2.0;
    const y2 = m * x2 + b;

    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y1, 0)]), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })));
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x2, y1, 0), new THREE.Vector3(x2, y2, 0)]), new THREE.LineBasicMaterial({ color: 0xec4899, linewidth: 3 })));

    const slopeLbl = this.createLabelSprite(`មេគុណប្រាប់ទិស m = Δy/Δx = ${m}`, '#34d399', 'rgba(6,78,59,0.85)');
    slopeLbl.scale.set(2.2, 0.42, 1);
    slopeLbl.position.set(x2 + 1.2, (y1 + y2) / 2, 0);
    this.animGroup.add(slopeLbl);

    const banner = this.createLabelSprite(`សមីការបន្ទាត់ ៖ y = ${m}x + ${b}`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(3.6, 0.65, 1);
    banner.position.set(0, 4.0, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Coordinate Plane & Graphs (Grade 8 - les-g8-09: ប្លង់កូអរដោនេនិងក្រាប)
  // --------------------------------------------------------------------------
  buildCoordinatePlaneGraphScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const x = this.workbenchState.coordX !== undefined ? this.workbenchState.coordX : 3;
    const y = this.workbenchState.coordY !== undefined ? this.workbenchState.coordY : 2;

    const ptGeo = new THREE.SphereGeometry(0.22, 24, 24);
    const ptMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x854d0e });
    const pt = new THREE.Mesh(ptGeo, ptMat);
    pt.position.set(x, y, 0);
    this.animGroup.add(pt);

    const xLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, 0), new THREE.Vector3(x, 0, 0)]), new THREE.LineDashedMaterial({ color: 0x38bdf8, dashSize: 0.15, gapSize: 0.1 }));
    xLine.computeLineDistances();
    this.animGroup.add(xLine);

    const yLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y, 0), new THREE.Vector3(0, y, 0)]), new THREE.LineDashedMaterial({ color: 0xec4899, dashSize: 0.15, gapSize: 0.1 }));
    yLine.computeLineDistances();
    this.animGroup.add(yLine);

    const pLbl = this.createLabelSprite(`P(${x}, ${y})`, '#fef08a', 'rgba(113,63,18,0.85)');
    pLbl.scale.set(1.4, 0.42, 1);
    pLbl.position.set(x + 0.6, y + 0.4, 0);
    this.animGroup.add(pLbl);

    let quad = 'I';
    if (x < 0 && y > 0) quad = 'II';
    else if (x < 0 && y < 0) quad = 'III';
    else if (x > 0 && y < 0) quad = 'IV';

    const banner = this.createLabelSprite(`ប្លង់កូអរដោនេដេកាត ៖ ចំណុច P(${x}, ${y}) ស្ថិតក្នុងកាដ្រង់ទី ${quad}`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.2, 0.65, 1);
    banner.position.set(0, 3.5, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Distance Formula (Grade 9 - les-g9-09: ចម្ងាយរវាងពីរចំណុច)
  // --------------------------------------------------------------------------
  buildDistanceFormulaScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const x1 = -2, y1 = -1;
    const x2 = 2, y2 = 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);

    const aMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8 }));
    aMesh.position.set(x1, y1, 0);
    this.animGroup.add(aMesh);
    const aLbl = this.createLabelSprite(`A(${x1}, ${y1})`, '#38bdf8', 'rgba(15,23,42,0.8)');
    aLbl.scale.set(1.2, 0.35, 1);
    aLbl.position.set(x1 - 0.5, y1 - 0.4, 0);
    this.animGroup.add(aLbl);

    const bMesh = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0x10b981 }));
    bMesh.position.set(x2, y2, 0);
    this.animGroup.add(bMesh);
    const bLbl = this.createLabelSprite(`B(${x2}, ${y2})`, '#34d399', 'rgba(15,23,42,0.8)');
    bLbl.scale.set(1.2, 0.35, 1);
    bLbl.position.set(x2 + 0.5, y2 + 0.4, 0);
    this.animGroup.add(bLbl);

    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y2, 0)]), new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 4 })));
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x1, y1, 0), new THREE.Vector3(x2, y1, 0)]), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })));
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x2, y1, 0), new THREE.Vector3(x2, y2, 0)]), new THREE.LineBasicMaterial({ color: 0xec4899, linewidth: 2 })));

    const dLbl = this.createLabelSprite(`d = √(${dx}² + ${dy}²) = ${d}`, '#fef08a', 'rgba(113,63,18,0.85)');
    dLbl.scale.set(2.0, 0.42, 1);
    dLbl.position.set((x1 + x2) / 2, (y1 + y2) / 2 + 0.4, 0);
    this.animGroup.add(dLbl);

    const banner = this.createLabelSprite(`រូបមន្តចម្ងាយ ៖ d = √[(x₂ - x₁)² + (y₂ - y₁)²] = ${d}`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.4, 0.65, 1);
    banner.position.set(0, 3.2, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Angles & Protractor (Grade 7 - les-g7-13: មុំ)
  // --------------------------------------------------------------------------
  buildAnglesProtractorScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const deg = this.workbenchState.angDeg !== undefined ? this.workbenchState.angDeg : 60;
    const rad = (deg * Math.PI) / 180;
    const r = 3.2;

    const protractorGeo = new THREE.RingGeometry(0.6, r, 32, 1, 0, Math.PI);
    const protractorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const protractor = new THREE.Mesh(protractorGeo, protractorMat);
    protractor.position.set(0, 0.05, 0);
    this.animGroup.add(protractor);

    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(r + 0.6, 0.1, 0)]), new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 3 })));

    const bx = Math.cos(rad) * (r + 0.6);
    const by = Math.sin(rad) * (r + 0.6);
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0.1, 0), new THREE.Vector3(bx, by, 0)]), new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 4 })));

    let angType = 'មុំស្រួច (Acute Angle < 90°)';
    if (deg === 90) angType = 'មុំកែង (Right Angle = 90°)';
    else if (deg > 90 && deg < 180) angType = 'មុំទាល (Obtuse Angle > 90°)';
    else if (deg === 180) angType = 'មុំរាប (Straight Angle = 180°)';

    const banner = this.createLabelSprite(`រង្វាស់មុំ θ = ${deg}°  ⟹  ${angType}`, '#fef08a', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.2, 0.65, 1);
    banner.position.set(0, 3.5, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Parallel & Perpendicular Lines (Grade 7 - les-g7-14: បន្ទាត់ស្រប បន្ទាត់កែង)
  // --------------------------------------------------------------------------
  buildParallelTransversalScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const l1Pts = [new THREE.Vector3(-5, 1.2, 0), new THREE.Vector3(5, 1.2, 0)];
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(l1Pts), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })));
    const l1Lbl = this.createLabelSprite(`បន្ទាត់ d₁`, '#38bdf8', 'rgba(15,23,42,0.8)');
    l1Lbl.scale.set(1.0, 0.35, 1);
    l1Lbl.position.set(5.5, 1.2, 0);
    this.animGroup.add(l1Lbl);

    const l2Pts = [new THREE.Vector3(-5, -1.2, 0), new THREE.Vector3(5, -1.2, 0)];
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(l2Pts), new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })));
    const l2Lbl = this.createLabelSprite(`បន្ទាត់ d₂ (d₁ ∥ d₂)`, '#38bdf8', 'rgba(15,23,42,0.8)');
    l2Lbl.scale.set(1.5, 0.35, 1);
    l2Lbl.position.set(5.5, -1.2, 0);
    this.animGroup.add(l2Lbl);

    const transPts = [new THREE.Vector3(-2.2, -2.8, 0), new THREE.Vector3(2.2, 2.8, 0)];
    this.animGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(transPts), new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 4 })));

    const banner = this.createLabelSprite(`បន្ទាត់ស្របកាត់ដោយខ្នាត់ ៖ មុំឆ្លាស់ក្នុងស្មើគ្នា (∠1 = ∠2)`, '#34d399', 'rgba(6,78,59,0.9)');
    banner.scale.set(4.4, 0.65, 1);
    banner.position.set(0, 3.2, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: 3D Bar Chart (Grade 7 - les-g7-21: ក្រាបសសរ)
  // --------------------------------------------------------------------------
  buildBarChartScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const data = [
      { label: 'ចន្ទ', val: 4, col: 0x38bdf8 },
      { label: 'អង្គារ', val: 7, col: 0x10b981 },
      { label: 'ពុធ', val: 5, col: 0xf59e0b },
      { label: 'ព្រហស្បតិ៍', val: 8, col: 0x8b5cf6 },
      { label: 'សុក្រ', val: 6, col: 0xec4899 }
    ];

    data.forEach((item, idx) => {
      const x = (idx - 2) * 1.6;
      const h = item.val * 0.35;
      const geo = new THREE.BoxGeometry(1.0, h, 1.0);
      const mat = new THREE.MeshStandardMaterial({ color: item.col, metalness: 0.4, roughness: 0.25 });
      const bar = new THREE.Mesh(geo, mat);
      bar.position.set(x, h / 2, 0);
      this.animGroup.add(bar);

      const valLbl = this.createLabelSprite(`${item.val}`, '#ffffff', 'transparent');
      valLbl.scale.set(0.7, 0.4, 1);
      valLbl.position.set(x, h + 0.3, 0);
      this.animGroup.add(valLbl);

      const catLbl = this.createLabelSprite(item.label, '#cbd5e1', 'rgba(15,23,42,0.8)');
      catLbl.scale.set(1.0, 0.35, 1);
      catLbl.position.set(x, -0.4, 0.7);
      this.animGroup.add(catLbl);
    });

    const banner = this.createLabelSprite(`ក្រាបសសរ 3D ៖ តំណាងទិន្នន័យតាមថ្ងៃក្នុងសប្តាហ៍`, '#38bdf8', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.2, 0.65, 1);
    banner.position.set(0, 3.5, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: 3D Pie Chart (Grade 7 - les-g7-22: ក្រាបផ្លិត)
  // --------------------------------------------------------------------------
  buildPieChartScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const slices = [
      { pct: 0.40, col: 0x38bdf8, label: '៤០% (១៤៤°)' },
      { pct: 0.25, col: 0x10b981, label: '២៥% (៩០°)' },
      { pct: 0.20, col: 0xf59e0b, label: '២០% (៧២°)' },
      { pct: 0.15, col: 0x8b5cf6, label: '១៥% (៥៤°)' }
    ];

    let currentAngle = 0;
    slices.forEach((slice) => {
      const angle = slice.pct * Math.PI * 2;
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.arc(0, 0, 2.2, currentAngle, currentAngle + angle, false);
      shape.lineTo(0, 0);

      const extrudeSettings = { depth: 0.45, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.04, bevelThickness: 0.04 };
      const geo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      const mat = new THREE.MeshStandardMaterial({ color: slice.col, metalness: 0.4, roughness: 0.25 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(0, 0.25, 0);
      this.animGroup.add(mesh);

      const midAngle = currentAngle + angle / 2;
      const lx = Math.cos(midAngle) * 2.8;
      const lz = -Math.sin(midAngle) * 2.8;
      const lbl = this.createLabelSprite(slice.label, '#ffffff', 'rgba(15,23,42,0.85)');
      lbl.scale.set(1.4, 0.4, 1);
      lbl.position.set(lx, 0.5, lz);
      this.animGroup.add(lbl);

      currentAngle += angle;
    });

    const banner = this.createLabelSprite(`ក្រាបផ្លិត 3D ៖ បែងចែកភាគរយ និងមុំផ្ចិត (សរុប = ៣៦០°)`, '#fef08a', 'rgba(15,23,42,0.9)');
    banner.scale.set(4.5, 0.65, 1);
    banner.position.set(0, 2.8, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Polygon Areas & Perimeters (Grade 7 - les-g7-16: បរិមាត្រនិងផ្ទៃក្រឡាពហុកោណ)
  // --------------------------------------------------------------------------
  buildPolygonAreasScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const b = 4, h = 2.5;
    const rectGeo = new THREE.BoxGeometry(b, h, 0.15);
    const rectMat = new THREE.MeshStandardMaterial({ color: 0x10b981, transparent: true, opacity: 0.7 });
    const rect = new THREE.Mesh(rectGeo, rectMat);
    rect.position.set(0, h / 2, 0);
    this.animGroup.add(rect);

    const edgeGeo = new THREE.EdgesGeometry(rectGeo);
    rect.add(new THREE.LineSegments(edgeGeo, new THREE.LineBasicMaterial({ color: 0xffffff })));

    const area = b * h;
    const perim = 2 * (b + h);

    const banner = this.createLabelSprite(`ចតុកោណកែង ៖ ផ្ទៃក្រឡា S = b × h = ${b} × ${h} = ${area}  |  បរិមាត្រ P = 2(b+h) = ${perim}`, '#34d399', 'rgba(6,78,59,0.9)');
    banner.scale.set(4.6, 0.65, 1);
    banner.position.set(0, 3.2, 0);
    this.animGroup.add(banner);
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Linear Equation Balance Scale (Grade 7 - les-g7-09, Grade 8 - les-g8-07, Grade 9 - les-g9-04)
  // --------------------------------------------------------------------------
  buildBalanceScaleScene() {
    this.clearAnimGroup();
    this.addCoordinateGrid();

    const pIdx = this.activePointIndex;
    const a = this.workbenchState.balA !== undefined ? this.workbenchState.balA : 2;
    const b = this.workbenchState.balB !== undefined ? this.workbenchState.balB : 3;
    const c = this.workbenchState.balC !== undefined ? this.workbenchState.balC : 7;
    const x = this.workbenchState.balX !== undefined ? this.workbenchState.balX : 2;

    // 1. Fulcrum Stand (Solid metallic triangular pedestal & dial gauge)
    const basePlateGeo = new THREE.CylinderGeometry(2.0, 2.2, 0.25, 24);
    const basePlateMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 });
    const basePlate = new THREE.Mesh(basePlateGeo, basePlateMat);
    basePlate.position.set(0, 0.125, 0);
    this.animGroup.add(basePlate);

    const pillarGeo = new THREE.ConeGeometry(0.85, 2.3, 4);
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.6, roughness: 0.3 });
    const pillar = new THREE.Mesh(pillarGeo, pillarMat);
    pillar.rotation.y = Math.PI / 4;
    pillar.position.set(0, 1.25, 0);
    this.animGroup.add(pillar);

    // Pivot bearing at (0, 2.4, 0)
    const pivotGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.7, 24);
    const pivotMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.2 });
    const pivot = new THREE.Mesh(pivotGeo, pivotMat);
    pivot.rotation.x = Math.PI / 2;
    pivot.position.set(0, 2.4, 0);
    this.animGroup.add(pivot);

    // Center Angle Dial Gauge behind pivot
    const dialPlateGeo = new THREE.CircleGeometry(0.9, 32, 0, Math.PI);
    const dialPlateMat = new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide });
    const dialPlate = new THREE.Mesh(dialPlateGeo, dialPlateMat);
    dialPlate.position.set(0, 2.4, -0.2);
    this.animGroup.add(dialPlate);

    // Dial tick at center 0
    const centerTick = new THREE.Mesh(
      new THREE.BoxGeometry(0.04, 0.3, 0.02),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    centerTick.position.set(0, 2.85, -0.19);
    this.animGroup.add(centerTick);

    // 2. Main Balance Beam Group (Pivoting around 0, 2.4, 0)
    const beamGroup = new THREE.Group();
    beamGroup.position.set(0, 2.4, 0);

    const beamLength = 8.6;
    const beamGeo = new THREE.BoxGeometry(beamLength, 0.28, 0.36);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.2 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beamGroup.add(beam);

    // Pointer needle attached to beam pointing up to the dial
    const needleGeo = new THREE.ConeGeometry(0.06, 0.7, 12);
    const needleMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needle.position.set(0, 0.45, 0);
    beamGroup.add(needle);

    // 3. Left and Right Hanging Pans with Clean Open Suspension
    const armDist = 3.9;
    const panY = -1.9;
    const panR = 1.35;
    const panH = 0.12;

    const createSuspension = () => {
      const cablesGroup = new THREE.Group();
      const cableMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
      const cableR = 0.025;
      const len = Math.hypot(panR * 0.85, panY);
      const angle = Math.atan2(panR * 0.85, -panY);

      const c1Geo = new THREE.CylinderGeometry(cableR, cableR, len, 8);
      const c1 = new THREE.Mesh(c1Geo, cableMat);
      c1.position.set(-panR * 0.425, panY / 2, 0);
      c1.rotation.z = angle;
      cablesGroup.add(c1);

      const c2 = new THREE.Mesh(c1Geo, cableMat);
      c2.position.set(panR * 0.425, panY / 2, 0);
      c2.rotation.z = -angle;
      cablesGroup.add(c2);

      return cablesGroup;
    };

    // --- Left Pan Group ---
    const leftPanGroup = new THREE.Group();
    leftPanGroup.position.set(-armDist, 0, 0);
    leftPanGroup.add(createSuspension());

    const panGeo = new THREE.CylinderGeometry(panR, panR * 0.88, panH, 32);
    const leftPanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.25
    });
    const leftPan = new THREE.Mesh(panGeo, leftPanMat);
    leftPan.position.set(0, panY, 0);
    leftPanGroup.add(leftPan);

    const surfaceY = panY + panH / 2;

    // (a) Mystery Blocks [x] cleanly placed
    const boxSize = 0.52;
    for (let i = 0; i < a; i++) {
      const bGeo = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
      const bMat = new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x083344,
        metalness: 0.3,
        roughness: 0.3
      });
      const box = new THREE.Mesh(bGeo, bMat);
      const bx = -0.55 + (i % 2) * 0.58;
      const bz = -0.35 + Math.floor(i / 2) * 0.58;
      box.position.set(bx, surfaceY + boxSize / 2, bz);
      leftPanGroup.add(box);

      const boxLbl = this.createLabelSprite('x', '#38bdf8', 'rgba(15,23,42,0.85)');
      boxLbl.scale.set(0.35, 0.35, 1);
      boxLbl.position.set(bx, surfaceY + boxSize + 0.15, bz);
      leftPanGroup.add(boxLbl);
    }

    // (b) Constant weights [unit spheres] with no collision
    const sphereR = 0.16;
    for (let i = 0; i < b; i++) {
      const sGeo = new THREE.SphereGeometry(sphereR, 16, 16);
      const sMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0x78350f,
        metalness: 0.6,
        roughness: 0.3
      });
      const sphere = new THREE.Mesh(sGeo, sMat);
      const col = i % 2;
      const row = Math.floor(i / 2);
      sphere.position.set(0.45 + col * 0.38, surfaceY + sphereR, -0.4 + row * 0.38);
      leftPanGroup.add(sphere);
    }

    beamGroup.add(leftPanGroup);

    // --- Right Pan Group ---
    const rightPanGroup = new THREE.Group();
    rightPanGroup.position.set(armDist, 0, 0);
    rightPanGroup.add(createSuspension());

    const rightPanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.6,
      roughness: 0.25
    });
    const rightPan = new THREE.Mesh(panGeo, rightPanMat);
    rightPan.position.set(0, panY, 0);
    rightPanGroup.add(rightPan);

    // (c) Right Constant weights in neat grid
    for (let i = 0; i < c; i++) {
      const sGeo = new THREE.SphereGeometry(sphereR, 16, 16);
      const sMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        emissive: 0x78350f,
        metalness: 0.6,
        roughness: 0.3
      });
      const sphere = new THREE.Mesh(sGeo, sMat);
      const col = i % 3;
      const row = Math.floor(i / 3);
      sphere.position.set(-0.42 + col * 0.42, surfaceY + sphereR, -0.42 + row * 0.42);
      rightPanGroup.add(sphere);
    }

    beamGroup.add(rightPanGroup);
    this.animGroup.add(beamGroup);

    // 4. Physics-Accurate Tilt Calculation
    const leftWeight = a * x + b;
    const rightWeight = c;
    const diff = leftWeight - rightWeight;
    const targetTilt = Math.max(-0.24, Math.min(0.24, diff * 0.05));

    beamGroup.rotation.z = targetTilt;
    leftPanGroup.rotation.z = -targetTilt;
    rightPanGroup.rotation.z = -targetTilt;

    const isBalanced = Math.abs(diff) < 0.01;
    const statusText = isBalanced
      ? `⚖️ តុល្យភាពស្មើគ្នា! (${a}(${x}) + ${b} = ${c})`
      : diff > 0
      ? `👈 ខាងឆ្វេងធ្ងន់ជាង (${leftWeight.toFixed(1)} > ${rightWeight})`
      : `👉 ខាងស្តាំធ្ងន់ជាង (${leftWeight.toFixed(1)} < ${rightWeight})`;

    const statusLbl = this.createLabelSprite(
      statusText,
      isBalanced ? '#10b981' : '#f59e0b',
      'rgba(15,23,42,0.92)'
    );
    statusLbl.scale.set(2.4, 0.55, 1);
    statusLbl.position.set(0, 3.8, 0);
    this.animGroup.add(statusLbl);

    this.simParams = {
      mode: 'balance_scale',
      beamGroup,
      leftPanGroup,
      rightPanGroup,
      targetTilt,
      isBalanced,
      time: 0
    };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Polynomials & Factoring (Grade 8 - les-g8-01, les-g8-02)
  // --------------------------------------------------------------------------
  buildPolynomialVolumeScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const a = this.workbenchState.polyA !== undefined ? this.workbenchState.polyA : 2.0;
    const b = this.workbenchState.polyB !== undefined ? this.workbenchState.polyB : 1.0;
    const explode = this.workbenchState.polyExplode !== undefined ? this.workbenchState.polyExplode : 0.8;

    const blocks = [];
    const blockDefs = [
      { size: [a, a, a], pos: [0, 0, 0], col: 0x38bdf8, name: 'a³' },
      { size: [a, a, b], pos: [0, 0, a], col: 0xa855f7, name: 'a²b' },
      { size: [a, b, a], pos: [0, a, 0], col: 0xa855f7, name: 'a²b' },
      { size: [b, a, a], pos: [a, 0, 0], col: 0xa855f7, name: 'a²b' },
      { size: [a, b, b], pos: [0, a, a], col: 0xf59e0b, name: 'ab²' },
      { size: [b, a, b], pos: [a, 0, a], col: 0xf59e0b, name: 'ab²' },
      { size: [b, b, a], pos: [a, a, 0], col: 0xf59e0b, name: 'ab²' },
      { size: [b, b, b], pos: [a, a, a], col: 0x10b981, name: 'b³' }
    ];

    const centerOffset = [-(a + b) / 2, 0.2, -(a + b) / 2];

    blockDefs.forEach((def) => {
      const geo = new THREE.BoxGeometry(def.size[0] - 0.04, def.size[1] - 0.04, def.size[2] - 0.04);
      const mat = new THREE.MeshStandardMaterial({
        color: def.col,
        metalness: 0.25,
        roughness: 0.35,
        transparent: true,
        opacity: 0.92
      });
      const mesh = new THREE.Mesh(geo, mat);

      const dirX = def.pos[0] === 0 ? -1 : 1;
      const dirY = def.pos[1] === 0 ? -0.5 : 1;
      const dirZ = def.pos[2] === 0 ? -1 : 1;

      const px = def.pos[0] + def.size[0] / 2 + centerOffset[0] + dirX * explode;
      const py = def.pos[1] + def.size[1] / 2 + centerOffset[1] + (dirY > 0 ? dirY * explode : 0);
      const pz = def.pos[2] + def.size[2] / 2 + centerOffset[2] + dirZ * explode;

      mesh.position.set(px, py, pz);
      this.animGroup.add(mesh);
      blocks.push({ mesh, basePos: [px, py, pz], dir: [dirX, dirY, dirZ] });
    });

    const formulaLbl = this.createLabelSprite('(a + b)³ = a³ + 3a²b + 3ab² + b³', '#38bdf8', 'rgba(15,23,42,0.9)');
    formulaLbl.position.set(0, a + b + 1.8, 0);
    this.animGroup.add(formulaLbl);

    this.simParams = { mode: 'polynomial_volume', blocks, explode, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Pythagorean Theorem (Grade 8 - les-g8-03)
  // --------------------------------------------------------------------------
  buildPythagorasScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const a = this.workbenchState.pythA !== undefined ? this.workbenchState.pythA : 3;
    const b = this.workbenchState.pythB !== undefined ? this.workbenchState.pythB : 4;
    const c = Math.sqrt(a * a + b * b);

    const offsetX = -a / 2;
    const offsetY = -b / 4;

    const triShape = new THREE.Shape();
    triShape.moveTo(0 + offsetX, 0 + offsetY);
    triShape.lineTo(a + offsetX, 0 + offsetY);
    triShape.lineTo(0 + offsetX, b + offsetY);
    triShape.closePath();

    const triGeo = new THREE.ShapeGeometry(triShape);
    const triMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, side: THREE.DoubleSide });
    const triMesh = new THREE.Mesh(triGeo, triMat);
    this.animGroup.add(triMesh);

    const edgePts = [
      new THREE.Vector3(0 + offsetX, 0 + offsetY, 0.05),
      new THREE.Vector3(a + offsetX, 0 + offsetY, 0.05),
      new THREE.Vector3(0 + offsetX, b + offsetY, 0.05),
      new THREE.Vector3(0 + offsetX, 0 + offsetY, 0.05)
    ];
    const edgeLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(edgePts),
      new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 })
    );
    this.animGroup.add(edgeLine);

    for (let i = 0; i < a; i++) {
      for (let j = 0; j < a; j++) {
        const uGeo = new THREE.BoxGeometry(0.85, 0.85, 0.3);
        const uMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.3, roughness: 0.3 });
        const uMesh = new THREE.Mesh(uGeo, uMat);
        uMesh.position.set(offsetX + i * 1.0 + 0.5, offsetY - j * 1.0 - 0.5, 0);
        this.animGroup.add(uMesh);
      }
    }

    for (let i = 0; i < b; i++) {
      for (let j = 0; j < b; j++) {
        const uGeo = new THREE.BoxGeometry(0.85, 0.85, 0.3);
        const uMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.3 });
        const uMesh = new THREE.Mesh(uGeo, uMat);
        uMesh.position.set(offsetX - i * 1.0 - 0.5, offsetY + j * 1.0 + 0.5, 0);
        this.animGroup.add(uMesh);
      }
    }

    const angle = Math.atan2(b, a);
    const hypGroup = new THREE.Group();
    hypGroup.position.set(0 + offsetX, b + offsetY, 0);
    hypGroup.rotation.z = -angle;

    const unitC = c / 5;
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 5; j++) {
        const uGeo = new THREE.BoxGeometry(unitC * 0.88, unitC * 0.88, 0.3);
        const uMat = new THREE.MeshStandardMaterial({ color: 0x10b981, metalness: 0.3, roughness: 0.3 });
        const uMesh = new THREE.Mesh(uGeo, uMat);
        uMesh.position.set((i + 0.5) * unitC, (j + 0.5) * unitC, 0);
        hypGroup.add(uMesh);
      }
    }
    this.animGroup.add(hypGroup);

    const lblA = this.createLabelSprite(`a² = ${a * a}`, '#38bdf8', 'rgba(15,23,42,0.85)');
    lblA.position.set(offsetX + a / 2, offsetY - a - 0.5, 0);
    this.animGroup.add(lblA);

    const lblB = this.createLabelSprite(`b² = ${b * b}`, '#f59e0b', 'rgba(15,23,42,0.85)');
    lblB.position.set(offsetX - b - 0.6, offsetY + b / 2, 0);
    this.animGroup.add(lblB);

    const lblC = this.createLabelSprite(`c² = a² + b² = ${a * a + b * b}`, '#10b981', 'rgba(15,23,42,0.9)');
    lblC.position.set(offsetX + a / 2 + 1.2, offsetY + b / 2 + 2.0, 0);
    this.animGroup.add(lblC);

    this.simParams = { mode: 'pythagoras', a, b, c, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Quadratic Equation Delta Discriminant (Grade 9 - les-g9-01)
  // --------------------------------------------------------------------------
  buildQuadraticDeltaScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const a = this.workbenchState.quadA !== undefined ? this.workbenchState.quadA : 1.0;
    const b = this.workbenchState.quadB !== undefined ? this.workbenchState.quadB : -2.0;
    const c = this.workbenchState.quadC !== undefined ? this.workbenchState.quadC : -3.0;

    const delta = b * b - 4 * a * c;

    const pts = [];
    for (let x = -5; x <= 5; x += 0.1) {
      const y = a * x * x + b * x + c;
      if (y >= -6 && y <= 8) {
        pts.push(new THREE.Vector3(x, y, 0));
      }
    }
    const paraGeo = new THREE.BufferGeometry().setFromPoints(pts);
    const paraLine = new THREE.Line(
      paraGeo,
      new THREE.LineBasicMaterial({ color: delta > 0 ? 0x10b981 : delta === 0 ? 0xf59e0b : 0xef4444, linewidth: 3.5 })
    );
    this.animGroup.add(paraLine);

    const vx = -b / (2 * a);
    const vy = -delta / (4 * a);
    const vertSphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 })
    );
    vertSphere.position.set(vx, vy, 0);
    this.animGroup.add(vertSphere);

    const axisPts = [new THREE.Vector3(vx, -5, 0), new THREE.Vector3(vx, 7, 0)];
    const axisLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(axisPts),
      new THREE.LineDashedMaterial({ color: 0x64748b, dashSize: 0.2, gapSize: 0.15 })
    );
    axisLine.computeLineDistances();
    this.animGroup.add(axisLine);

    if (delta > 0) {
      const r1 = (-b - Math.sqrt(delta)) / (2 * a);
      const r2 = (-b + Math.sqrt(delta)) / (2 * a);

      const rootMesh1 = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46 })
      );
      rootMesh1.position.set(r1, 0, 0);
      this.animGroup.add(rootMesh1);

      const rootMesh2 = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0x10b981, emissive: 0x065f46 })
      );
      rootMesh2.position.set(r2, 0, 0);
      this.animGroup.add(rootMesh2);

      const rootLbl = this.createLabelSprite(`x₁ = ${r1.toFixed(2)}, x₂ = ${r2.toFixed(2)} (Δ = ${delta.toFixed(1)} > 0)`, '#10b981', 'rgba(15,23,42,0.9)');
      rootLbl.position.set(vx, 3.8, 0);
      this.animGroup.add(rootLbl);
    } else if (Math.abs(delta) < 0.01) {
      const r0 = -b / (2 * a);
      const rootMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f })
      );
      rootMesh.position.set(r0, 0, 0);
      this.animGroup.add(rootMesh);

      const rootLbl = this.createLabelSprite(`ឫសឌុប x₀ = ${r0.toFixed(2)} (Δ = 0)`, '#f59e0b', 'rgba(15,23,42,0.9)');
      rootLbl.position.set(vx, 3.8, 0);
      this.animGroup.add(rootLbl);
    } else {
      const rootLbl = this.createLabelSprite(`គ្មានឫសពិត (Δ = ${delta.toFixed(1)} < 0) - ឫសកុំផ្លិចក្នុងប្លង់កុំផ្លិច`, '#ef4444', 'rgba(15,23,42,0.9)');
      rootLbl.position.set(vx, 3.8, 0);
      this.animGroup.add(rootLbl);
    }

    this.simParams = { mode: 'quadratic_delta', a, b, c, delta, vx, vy, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: System of 2 Linear Equations (Grade 9 - les-g9-02)
  // --------------------------------------------------------------------------
  buildLinearSystemScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const m1 = this.workbenchState.lsM1 !== undefined ? this.workbenchState.lsM1 : 1.0;
    const c1 = this.workbenchState.lsC1 !== undefined ? this.workbenchState.lsC1 : 1.0;
    const m2 = this.workbenchState.lsM2 !== undefined ? this.workbenchState.lsM2 : -0.5;
    const c2 = this.workbenchState.lsC2 !== undefined ? this.workbenchState.lsC2 : 4.0;

    const pts1 = [new THREE.Vector3(-6, m1 * -6 + c1, 0), new THREE.Vector3(6, m1 * 6 + c1, 0)];
    const line1 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts1),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 })
    );
    this.animGroup.add(line1);

    const pts2 = [new THREE.Vector3(-6, m2 * -6 + c2, 0), new THREE.Vector3(6, m2 * 6 + c2, 0)];
    const line2 = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts2),
      new THREE.LineBasicMaterial({ color: 0xec4899, linewidth: 3.5 })
    );
    this.animGroup.add(line2);

    const isParallel = Math.abs(m1 - m2) < 0.05;
    if (!isParallel) {
      const ix = (c2 - c1) / (m1 - m2);
      const iy = m1 * ix + c1;

      const interMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 16, 16),
        new THREE.MeshStandardMaterial({ color: 0xfacc15, emissive: 0x854d0e })
      );
      interMesh.position.set(ix, iy, 0);
      this.animGroup.add(interMesh);

      const dropX = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ix, 0, 0), new THREE.Vector3(ix, iy, 0)]),
        new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 })
      );
      dropX.computeLineDistances();
      this.animGroup.add(dropX);

      const dropY = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, iy, 0), new THREE.Vector3(ix, iy, 0)]),
        new THREE.LineDashedMaterial({ color: 0x94a3b8, dashSize: 0.15, gapSize: 0.1 })
      );
      dropY.computeLineDistances();
      this.animGroup.add(dropY);

      const solLbl = this.createLabelSprite(`ចំណុចប្រសព្វ (${ix.toFixed(1)}, ${iy.toFixed(1)})`, '#facc15', 'rgba(15,23,42,0.9)');
      solLbl.position.set(ix, iy + 0.8, 0);
      this.animGroup.add(solLbl);
    }

    this.simParams = { mode: 'linear_system', m1, c1, m2, c2, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Inscribed & Central Angles in Circle (Grade 9 - les-g9-03)
  // --------------------------------------------------------------------------
  buildCircleAngleScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const R = 3.6;
    const angleM = this.workbenchState.circleM !== undefined ? this.workbenchState.circleM : Math.PI * 0.75;

    const angleA = -Math.PI * 0.2;
    const angleB = Math.PI * 0.45;
    const ax = R * Math.cos(angleA), ay = R * Math.sin(angleA);
    const bx = R * Math.cos(angleB), by = R * Math.sin(angleB);
    const mx = R * Math.cos(angleM), my = R * Math.sin(angleM);

    const circlePts = [];
    for (let i = 0; i <= 64; i++) {
      const th = (i / 64) * Math.PI * 2;
      circlePts.push(new THREE.Vector3(R * Math.cos(th), R * Math.sin(th), 0));
    }
    const circle = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(circlePts),
      new THREE.LineBasicMaterial({ color: 0x475569, linewidth: 2 })
    );
    this.animGroup.add(circle);

    const ptO = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc }));
    ptO.position.set(0, 0, 0);
    this.animGroup.add(ptO);

    const ptA = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    ptA.position.set(ax, ay, 0);
    this.animGroup.add(ptA);

    const ptB = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    ptB.position.set(bx, by, 0);
    this.animGroup.add(ptB);

    const ptM = new THREE.Mesh(new THREE.SphereGeometry(0.26, 16, 16), new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x0284c7 }));
    ptM.position.set(mx, my, 0);
    this.animGroup.add(ptM);

    const centralLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ax, ay, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(bx, by, 0)]),
      new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 3 })
    );
    this.animGroup.add(centralLine);

    const inscribedLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(ax, ay, 0), new THREE.Vector3(mx, my, 0), new THREE.Vector3(bx, by, 0)]),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3 })
    );
    this.animGroup.add(inscribedLine);

    const arcPts = [];
    const span = angleB - angleA;
    for (let i = 0; i <= 32; i++) {
      const th = angleA + (i / 32) * span;
      arcPts.push(new THREE.Vector3(R * Math.cos(th), R * Math.sin(th), 0.02));
    }
    const arcLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(arcPts),
      new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 4.5 })
    );
    this.animGroup.add(arcLine);

    const centralDeg = Math.round((span * 180) / Math.PI);
    const inscribedDeg = Math.round(centralDeg / 2);

    const lbl = this.createLabelSprite(`មុំផ្ចិត AOB = ${centralDeg}° | មុំចារឹកក្នុង AMB = ${inscribedDeg}°`, '#38bdf8', 'rgba(15,23,42,0.9)');
    lbl.position.set(0, -R - 0.7, 0);
    this.animGroup.add(lbl);

    this.simParams = { mode: 'circle_angles', ptM, R, angleM, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Parabola Study & Vertex (Grade 10 - les-g10-01)
  // --------------------------------------------------------------------------
  buildParabolaStudyScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const a = this.workbenchState.parabA !== undefined ? this.workbenchState.parabA : 0.6;
    const h = this.workbenchState.parabH !== undefined ? this.workbenchState.parabH : 1.0;
    const k = this.workbenchState.parabK !== undefined ? this.workbenchState.parabK : -1.5;

    const pts = [];
    for (let x = -5; x <= 5; x += 0.1) {
      const y = a * Math.pow(x - h, 2) + k;
      if (y >= -6 && y <= 7) {
        pts.push(new THREE.Vector3(x, y, 0));
      }
    }
    const line = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(pts),
      new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 3.5 })
    );
    this.animGroup.add(line);

    const vert = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x78350f })
    );
    vert.position.set(h, k, 0);
    this.animGroup.add(vert);

    const axisPts = [new THREE.Vector3(h, -5, 0), new THREE.Vector3(h, 7, 0)];
    const axisLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(axisPts),
      new THREE.LineDashedMaterial({ color: 0xa855f7, dashSize: 0.2, gapSize: 0.15 })
    );
    axisLine.computeLineDistances();
    this.animGroup.add(axisLine);

    const lbl = this.createLabelSprite(`កំពូល V(${h.toFixed(1)}, ${k.toFixed(1)}) | អ័ក្សឆ្លុះ x = ${h.toFixed(1)}`, '#f59e0b', 'rgba(15,23,42,0.9)');
    lbl.position.set(h, k - 0.8, 0);
    this.animGroup.add(lbl);

    this.simParams = { mode: 'parabola_study', a, h, k, time: 0 };
  }

  // --------------------------------------------------------------------------
  // 3D Laboratory: Mathematical Induction Domino Cascade (Grade 11 - les-g11a-1-3)
  // --------------------------------------------------------------------------
  buildInductionScene() {

    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const dominoCount = 9;
    const dominoes = [];

    const platGeo = new THREE.BoxGeometry(11, 0.2, 2.5);
    const platMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.5, roughness: 0.4 });
    const platform = new THREE.Mesh(platGeo, platMat);
    platform.position.set(0, -0.1, 0);
    this.animGroup.add(platform);

    for (let i = 0; i < dominoCount; i++) {
      const n = i + 1;
      const isBase = n === 1;
      const isHypo = n === 4;
      const isStep = n === 5;

      const col = isBase ? 0x38bdf8 : isHypo ? 0xf59e0b : isStep ? 0x10b981 : 0x64748b;
      const dGeo = new THREE.BoxGeometry(0.35, 1.8, 0.9);
      const dMat = new THREE.MeshStandardMaterial({
        color: col,
        metalness: 0.3,
        roughness: 0.3,
        emissive: isBase ? 0x0c4a6e : isHypo ? 0x78350f : isStep ? 0x064e3b : 0x000000
      });

      const dGroup = new THREE.Group();
      const x = -4.5 + i * 1.1;
      dGroup.position.set(x, 0, 0);

      const dMesh = new THREE.Mesh(dGeo, dMat);
      dMesh.position.set(0, 0.9, 0);
      dGroup.add(dMesh);

      const labelText = isBase ? 'n=1' : isHypo ? 'P(k)' : isStep ? 'P(k+1)' : `${n}`;
      const lbl = this.createLabelSprite(labelText, isBase ? '#38bdf8' : isHypo ? '#f59e0b' : isStep ? '#10b981' : '#94a3b8', 'rgba(15,23,42,0.8)');
      lbl.scale.set(0.9, 0.32, 1);
      lbl.position.set(0, 2.2, 0);
      dGroup.add(lbl);

      this.animGroup.add(dGroup);
      dominoes.push({ group: dGroup, mesh: dMesh, n, currentAngle: 0, targetAngle: 0 });
    }

    const titleLbl = this.createLabelSprite('វិធានអនុមានរួមគណិតវិទ្យា ៖ P(1) ពិត & P(k) ⇒ P(k+1) ពិត ⇒ ∀n P(n) ពិត', '#38bdf8', 'rgba(15,23,42,0.92)');
    titleLbl.position.set(0, 3.8, 0);
    this.animGroup.add(titleLbl);

    this.simParams = { mode: 'induction', dominoes, isFalling: false, time: 0 };
  }

  buildGenericFunctionScene() {


    this.clearAnimGroup();
    this.addCoordinateGrid();
    const pIdx = this.activePointIndex;
    const points = [];
    for (let x = -4; x <= 4; x += 0.1) {
      const y = (pIdx === 1) ? Math.cos(x) * 1.5 : (pIdx >= 2) ? 0.08 * Math.pow(x, 3) : Math.sin(x) * 1.5;
      points.push(new THREE.Vector3(x, y, 0));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    this.animGroup.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })));

    const tracer = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 16), new THREE.MeshStandardMaterial({ color: 0xf59e0b }));
    this.animGroup.add(tracer);
    this.simParams = { mode: 'generic', tracer, pIdx, time: 0 };
  }

  addCoordinateGrid() {
    const grid = new THREE.GridHelper(10, 10, 0x1e293b, 0x0f172a);
    grid.position.y = -0.01;
    this.animGroup.add(grid);

    const axes = new THREE.AxesHelper(5);
    this.animGroup.add(axes);
  }

  // --------------------------------------------------------------------------
  // Educational Narration, Step Progression & KaTeX Formulas
  // --------------------------------------------------------------------------
  generatePointSteps(simType) {
    const pIdx = this.activePointIndex;
    const title = (this.currentLesson?.title || '').toLowerCase();
    const lessonId = this.currentLesson?.id || '';

    // Fetch point info from worksheet or lesson
    let points = this.currentLesson?.points;
    if (!points || points.length === 0) {
      const ws = window.App?.worksheets?.[this.currentLesson?.id];
      if (ws?.points) points = ws.points;
    }
    const currentPoint = points?.[pIdx] || {};
    const pointTitle = currentPoint.pointTitle || currentPoint.title || `ចំណុចទី ${pIdx + 1}`;

    // ========================================================================
    // Case 0: Probability Interactive Laboratory (ប្រូបាប និងការពិសោធចៃដន្យ)
    // ========================================================================
    if (simType === 'probability_experiment') {
      if (pIdx === 0) {
        // Point 1: និយមន័យប្រូបាប និងការពិសោធចៃដន្យ
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ការពិសោធចៃដន្យ & លំហសំណាក S',
            tag: 'ការក្រឡុកគ្រាប់ឡុកឡាក់ 3D',
            caption: `ការពិសោធចៃដន្យ ជាការពិសោធដែលគេមិនអាចដឹងមុននូវលទ្ធផលពិតប្រាកដ ប៉ុន្តែស្គាល់គ្រប់លទ្ធផលដែលអាចកើតមានទាំងអស់ ហៅថា <strong>លំហសំណាក $S$</strong>។ ចំពោះគ្រាប់ឡុកឡាក់ ៖ $S = \{1, 2, 3, 4, 5, 6\}$ ($n(S) = 6$)។`,
            formula: 'S = \{1, 2, 3, 4, 5, 6\}, \\quad n(S) = 6',
            speak: `ការពិសោធចៃដន្យនៃគ្រាប់ឡុកឡាក់ លំហសំណាក S មាន ៦ ធាតុ`
          },
          {
            badge: 'ជំហាន ២/២ ៖ រូបមន្តប្រូបាប Laplace & ច្បាប់ចំនួនធំ',
            tag: 'ប្រូបាបជាក់ស្តែងធៀបទ្រឹស្តី',
            caption: `ប្រូបាបនៃព្រឹត្តិការណ៍ $A$ ស្មើនឹងផលធៀបចំនួនករណីស្រប $n(A)$ នឹងចំនួនករណីអាច $n(S)$ ៖ $P(A) = \\dfrac{n(A)}{n(S)}$។ តាមច្បាប់ចំនួនធំ កាលណាក្រឡុកកាន់តែច្រើនដង ប្រេកង់ជាក់ស្តែង $f \\to 16.7\%$។`,
            formula: 'P(A) = \\dfrac{n(A)}{n(S)} = \\dfrac{1}{6} \\approx 16.67\%',
            speak: `រូបមន្តប្រូបាបឡាផ្លាស និងច្បាប់ចំនួនធំ`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ព្រឹត្តិការណ៍ និងការចាប់បាល់ (Urn Sampling)
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ការចាប់បាល់ពីក្នុងថង់ (Urn Sampling)',
            tag: 'ការគណនាប្រូបាបបាល់ពណ៌',
            caption: `ក្នុងថង់មានបាល់សរុប ១២ គ្រាប់ (ក្រហម ៥, ខៀវ ៤, បៃតង ៣)។ ប្រូបាបចាប់បានបាល់ក្រហមមួយគ្រាប់ គឺ ៖ $P(\\text{ក្រហម}) = \\dfrac{5}{12} \\approx 41.7\%$។`,
            formula: 'P(\\text{ក្រហម}) = \\dfrac{5}{12}, \\quad P(\\text{ខៀវ}) = \\dfrac{4}{12}, \\quad P(\\text{បៃតង}) = \\dfrac{3}{12}',
            speak: `ការគណនាប្រូបាបនៃការចាប់បាល់ពណ៌ក្នុងថង់`
          },
          {
            badge: 'ជំហាន ២/២ ៖ មានដាក់ចូលវិញ vs គ្មានដាក់ចូលវិញ',
            tag: 'ព្រឹត្តិការណ៍មិនទាក់ទងគ្នា និងទាក់ទងគ្នា',
            caption: `បើចាប់ <strong>មានដាក់ចូលវិញ</strong> ចំនួនបាល់សរុបនៅថេរ (ព្រឹត្តិការណ៍មិនទាក់ទងគ្នា)។ បើ <strong>គ្មានដាក់ចូលវិញ</strong> ចំនួនបាល់ថយចុះ $12 \\to 11$ (ប្រូបាបមានលក្ខខណ្ឌ)។`,
            formula: 'P(A \\cap B) = P(A) \\times P(B|A)',
            speak: `ភាពខុសគ្នារវាងការចាប់បាល់មានដាក់ចូលវិញ និងគ្មានដាក់ចូលវិញ`
          }
        ];
      } else {
        // Point 3: ប្រូបាបមានលក្ខខណ្ឌ និងរូបមន្តបាយែស
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ប្រូបាបមានលក្ខខណ្ឌ P(B|A)',
            tag: 'លក្ខខណ្ឌកើតឡើងមុន',
            caption: `ប្រូបាបនៃព្រឹត្តិការណ៍ $B$ ដោយដឹងថា $A$ បានកើតឡើងរួចហើយ កំណត់ដោយ ៖ $P(B|A) = \\dfrac{P(A \\cap B)}{P(A)}$ ($P(A) > 0$)។`,
            formula: 'P(B|A) = \\dfrac{P(A \\cap B)}{P(A)} \\iff P(A \\cap B) = P(A) \cdot P(B|A)',
            speak: `រូបមន្តប្រូបាបមានលក្ខខណ្ឌ`
          },
          {
            badge: 'ជំហាន ២/២ ៖ រូបមន្តប្រូបាបសរុប និងបាយែស (Bayes)',
            tag: 'ទ្រឹស្តីបទបាយែស',
            caption: `រូបមន្តបាយែស ប្រើសម្រាប់គណនាប្រូបាបកែតម្រូវនៃមូលហេតុ $A_i$ ក្រោយពេលសង្កេតឃើញលទ្ធផល $B$ ជាក់ស្តែង។`,
            formula: 'P(A_i|B) = \\dfrac{P(A_i) \cdot P(B|A_i)}{\\sum_{j=1}^n P(A_j) \cdot P(B|A_j)}',
            speak: `ទ្រឹស្តីបទបាយែស និងរូបមន្តប្រូបាបសរុប`
          }
        ];
      }
    }
    else if (simType === 'limits_continuity') {
      const isContinuity = title.includes('ភាពជាប់') || lessonId.includes('1-2') || lessonId.includes('2-2');

      if (isContinuity) {
        if (pIdx === 0) {
          // Point 1: ភាពជាប់ត្រង់ចំណុច
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ និយមន័យភាពជាប់ត្រង់ចំណុច',
              tag: 'លក្ខខណ្ឌគ្រឹះទាំង ៣',
              caption: `អនុគមន៍ $f$ ជាប់ត្រង់ចំណុច $x_0$ លុះត្រាតែផ្ទៀងផ្ទាត់លក្ខខណ្ឌ ៣ ៖ (១) $f(x_0)$ មានន័យ, (២) $\\lim_{x \\to x_0} f(x)$ មានតម្លៃពិត, និង (៣) $\\lim_{x \\to x_0} f(x) = f(x_0)$។`,
              formula: 'f \\text{ ជាប់ត្រង់ } x_0 \\iff \\lim_{x \\to x_0^-} f(x) = \\lim_{x \\to x_0^+} f(x) = f(x_0)',
              speak: `និយមន័យភាពជាប់ត្រង់ចំណុចមួយ អនុគមន៍ជាប់ត្រង់ចំណុច x0 លុះត្រាតែលីមីតឆ្វេងស្មើនឹងលីមីតស្តាំ ហើយស្មើនឹង f នៃ x0`
            },
            {
              badge: 'ជំហាន ២/២ ៖ លក្ខខណ្ឌមិនជាប់ (Discontinuity)',
              tag: 'ភាពមិនជាប់ត្រង់ x0',
              caption: `បើលក្ខខណ្ឌណាមួយមិនផ្ទៀងផ្ទាត់ នោះអនុគមន៍មិនជាប់ត្រង់ $x_0$ ឡើយ (ភាពមិនជាប់អាចលុបបាន ឬភាពមិនជាប់មានលោត)។`,
              formula: '\\lim_{x \\to x_0} f(x) \\ne f(x_0) \\implies f \\text{ មិនជាប់ត្រង់ } x_0',
              speak: `ជំហានទីពីរ ប្រសិនបើតម្លៃលីមីតមិនស្មើនឹងតម្លៃអនុគមន៍ នោះអនុគមន៍មិនជាប់ត្រង់ចំណុច x0 ទេ`
            }
          ];
        } else if (pIdx === 1) {
          // Point 2: ភាពជាប់លើចន្លោះ & លុបភាពមិនជាប់
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ ភាពជាប់លើចន្លោះ [a, b]',
              tag: 'ចន្លោះបើក និងចន្លោះបិទ',
              caption: `អនុគមន៍ $f$ ជាប់លើចន្លោះបិទ $[a, b]$ កាលណាវាជាប់លើចន្លោះបើក $(a, b)$ ផង និងជាប់ខាងស្តាំត្រង់ $a$ ($\\lim_{x \\to a^+} f(x) = f(a)$) ព្រមទាំងជាប់ខាងឆ្វេងត្រង់ $b$ ($\\lim_{x \\to b^-} f(x) = f(b)$)។`,
              formula: 'f \\text{ ជាប់លើ } [a, b] \\iff \\begin{cases} f \\text{ ជាប់លើ } (a, b) \\\\ \\lim_{x \\to a^+} f(x) = f(a) \\\\ \\lim_{x \\to b^-} f(x) = f(b) \\end{cases}',
              speak: `ភាពជាប់លើចន្លោះ អនុគមន៍ជាប់លើចន្លោះបិទ a b កាលណាវាជាប់លើចន្លោះបើក និងជាប់ខាងស្តាំត្រង់ a ខាងឆ្វេងត្រង់ b`
            },
            {
              badge: 'ជំហាន ២/២ ៖ ការបន្លាយតាមភាពជាប់',
              tag: 'ការលុបភាពមិនជាប់',
              caption: `កាលណា $f$ មិនកំណត់ត្រង់ $x_0$ តែមានលីមីត $\\lim_{x \\to x_0} f(x) = L$ នោះគេអាចកំណត់អនុគមន៍បន្លាយ $g(x)$ ជាប់ត្រង់ $x_0$ ដោយឱ្យ $g(x_0) = L$។`,
              formula: 'g(x) = \\begin{cases} f(x) & \\text{បើ } x \\ne x_0 \\\\ L & \\text{បើ } x = x_0 \\end{cases}',
              speak: `ជំហានទីពីរ ការបន្លាយតាមភាពជាប់ដោយលុបភាពមិនជាប់ត្រង់ចំណុចដែលកន្សោមគ្មានន័យ`
            }
          ];
        } else {
          // Point 3: ទ្រឹស្តីបទតម្លៃកណ្តាល (IVT)
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ ទ្រឹស្តីបទតម្លៃកណ្តាល (IVT)',
              tag: 'ទ្រឹស្តីបទ Bolzano-Cauchy',
              caption: `បើអនុគមន៍ $f$ ជាប់លើចន្លោះបិទ $[a, b]$ នោះចំពោះគ្រប់តម្លៃ $u$ នៅចន្លោះ $f(a)$ និង $f(b)$ យ៉ាងហោចណាស់មានចំនួនពិត $c \\in [a, b]$ មួយដែល $f(c) = u$។`,
              formula: '\\forall u \\in [f(a), f(b)], \\quad \\exists c \\in [a, b] : f(c) = u',
              speak: `ទ្រឹស្តីបទតម្លៃកណ្តាល បើអនុគមន៍ជាប់លើចន្លោះបិទ a b នោះយ៉ាងហោចណាស់មានចំនួន c មួយដែល f នៃ c ស្មើនឹង u`
            },
            {
              badge: 'ជំហាន ២/២ ៖ វិបាកអត្ថិភាពឫសនៃសមីការ',
              tag: 'អត្ថិភាពឫស f(x) = 0',
              caption: `បើ $f$ ជាប់លើ $[a, b]$ ហើយ $f(a) \\cdot f(b) < 0$ (តម្លៃ $f(a)$ និង $f(b)$ មានសញ្ញាផ្ទុយគ្នា) នោះសមីការ $f(x) = 0$ យ៉ាងហោចណាស់មានឫសពិត $c \\in (a, b)$ មួយ។`,
              formula: 'f(a) \\cdot f(b) < 0 \\implies \\exists c \\in (a, b) : f(c) = 0',
              speak: `ជំហានទីពីរ វិបាកអត្ថិភាពឫស បើ f នៃ a គុណនឹង f នៃ b តូចជាងសូន្យ នោះសមីការមានឫសយ៉ាងហោចណាស់មួយក្នុងចន្លោះ a b`
            }
          ];
        }
      } else {
        // Limits
        if (pIdx === 0) {
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ និយមន័យលីមីតត្រង់ចំនួនកំណត់',
              tag: 'ការខិតជិតចំណុច',
              caption: `កាលណា $x$ ខិតជិត $x_0$ ពីឆ្វេង ($x \\to x_0^-$) និងស្តាំ ($x \\to x_0^+$) តម្លៃ $f(x)$ ខិតទៅរកតម្លៃថេរ $L$ តែមួយ។`,
              formula: '\\lim_{x \\to x_0^-} f(x) = \\lim_{x \\to x_0^+} f(x) = L \\implies \\lim_{x \\to x_0} f(x) = L',
              speak: `និយមន័យលីមីតត្រង់ចំនួនកំណត់ លីមីតឆ្វេងស្មើនឹងលីមីតស្តាំស្មើនឹង L`
            },
            {
              badge: 'ជំហាន ២/២ ៖ វិធីសាស្ត្រជំនួសផ្ទាល់',
              tag: 'ការគណនាតម្លៃលីមីត',
              caption: `ចំពោះអនុគមន៍ពហុធា និងអនុគមន៍សនិទានដែលភាគបែងខុសពីសូន្យ គេគណនាលីមីតដោយគ្រាន់តែជំនួស $x = x_0$ ដោយផ្ទាល់។`,
              formula: '\\lim_{x \\to x_0} P(x) = P(x_0)',
              speak: `ជំហានទីពីរ វិធីសាស្ត្រជំនួសតម្លៃផ្ទាល់`
            }
          ];
        } else if (pIdx === 1) {
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ រាងមិនកំណត់ [0/0]',
              tag: 'ការបំបែកជាផលគុណកត្តា',
              caption: `ពេលជំនួសឃើញរាង $[0/0]$ ត្រូវបំបែកជាផលគុណកត្តាដើម្បីសម្រួលកត្តាស្មើសូន្យ $(x - x_0)$ ចោល។`,
              formula: '\\lim_{x \\to x_0} \\dfrac{P(x)}{Q(x)} = \\lim_{x \\to x_0} \\dfrac{(x - x_0)P_1(x)}{(x - x_0)Q_1(x)} = \\dfrac{P_1(x_0)}{Q_1(x_0)}',
              speak: `រាងមិនកំណត់សូន្យលើសូន្យ បំបែកជាផលគុណកត្តាហើយសម្រួល`
            }
          ];
        } else if (pIdx === 2) {
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ អនុគមន៍អសនិទាន',
              tag: 'ការគុណកន្សោមឆ្លាស់',
              caption: `ចំពោះកន្សោមមានរ៉ាឌីកាល់ដែលជាប់រាង $[0/0]$ ត្រូវគុណនិងចែកនឹងកន្សោមឆ្លាស់ $(\\sqrt{A} + \\sqrt{B})$ ដើម្បីបំបាត់រ៉ាឌីកាល់។`,
              formula: '(\\sqrt{A} - \\sqrt{B})(\\sqrt{A} + \\sqrt{B}) = A - B',
              speak: `លីមីតនៃអនុគមន៍អសនិទាន គុណកន្សោមឆ្លាស់ដើម្បីបំបាត់រ៉ាឌីកាល់`
            }
          ];
        } else {
          this.currentSteps = [
            {
              badge: 'ជំហាន ១/២ ៖ លីមីតត្រង់អនន្ត [∞/∞]',
              tag: 'ទាញតួដឺក្រេធំបំផុត',
              caption: `ដើម្បីគណនាលីមីតពេល $x \\to \\pm\\infty$ នៃអនុគមន៍សនិទាន គេត្រូវទាញអថេរដែលមានស្វ័យគុណខ្ពស់ជាងគេជាកត្តា។`,
              formula: '\\lim_{x \\to \\pm\\infty} \\dfrac{a_n x^n + \\dots}{b_m x^m + \\dots} = \\lim_{x \\to \\pm\\infty} \\dfrac{a_n x^n}{b_m x^m}',
              speak: `លីមីតត្រង់អនន្ត ទាញតួដឺក្រេខ្ពស់បំផុតជាកត្តារួម`
            }
          ];
        }
      }
    }
    // ========================================================================
    // Case 2: Derivatives & Study of Functions (ដេរីវេ និងអនុវត្តន៍)
    // ========================================================================
    else if (simType === 'derivatives_tangent') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ និយមន័យដេរីវេ និងសមីការបន្ទាត់ប៉ះ',
            tag: 'អត្ថន័យធរណីមាត្រនៃដេរីវេ',
            caption: `ដេរីវេ $f'(x_0)$ តំណាងឱ្យមេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះក្រាប $(C)$ ត្រង់ចំណុច $M_0(x_0, f(x_0))$។`,
            formula: "y - f(x_0) = f'(x_0)(x - x_0)",
            speak: `និយមន័យដេរីវេ និងសមីការបន្ទាត់ប៉ះក្រាបត្រង់ចំណុច x0`
          },
          {
            badge: 'ជំហាន ២/២ ៖ មុំលំអៀងនៃបន្ទាត់ប៉ះ',
            tag: 'មេគុណប្រាប់ទិស m = tan α',
            caption: `មេគុណប្រាប់ទិស $m = f'(x_0) = \\tan\\alpha$ ដែល $\\alpha$ ជាមុំរវាងបន្ទាត់ប៉ះ និងអ័ក្សដេក $Ox$។`,
            formula: "m = f'(x_0) = \\lim_{x \\to x_0} \\dfrac{f(x) - f(x_0)}{x - x_0}",
            speak: `ជំហានទីពីរ មេគុណប្រាប់ទិសនៃបន្ទាត់ប៉ះស្មើនឹងតង់សង់នៃមុំលំអៀង`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ បរមាធៀប និងដេរីវេស្មើសូន្យ',
            tag: 'អតិបរមា និងអប្បបរមាធៀប',
            caption: `ត្រង់ចំណុចបរមាធៀប $x_0$ បន្ទាត់ប៉ះក្រាបដេកស្របនឹងអ័ក្ស $Ox$ ហើយដេរីវេទីមួយស្មើសូន្យ $f'(x_0) = 0$។`,
            formula: "f'(x_0) = 0 \\quad \\land \\quad f'(x) \\text{ ប្តូរសញ្ញាកាត់ } x_0",
            speak: `បរមាធៀបនៃអនុគមន៍ ត្រង់ចំណុចបរមា បន្ទាត់ប៉ះដេកស្របនឹងអ័ក្សដេក ហើយ f ព្រីមស្មើសូន្យ`
          },
          {
            badge: 'ជំហាន ២/២ ៖ លក្ខខណ្ឌដេរីវេទីពីរ f\'\'(x)',
            tag: 'វិធានដេរីវេទីពីរ',
            caption: `បើ $f'(x_0) = 0$ ៖ កាលណា $f''(x_0) < 0$ នោះជាអតិបរមាធៀប, កាលណា $f''(x_0) > 0$ នោះជាអប្បបរមាធៀប។`,
            formula: "f''(x_0) < 0 \\implies \\text{អតិបរមា}, \\quad f''(x_0) > 0 \\implies \\text{អប្បបរមា}",
            speak: `ជំហានទីពីរ វិធានដេរីវេទីពីរកំណត់ប្រភេទបរមា`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ចំណុចរបត់ និងភាពកោងនៃក្រាប',
            tag: 'ចំណុចរបត់ f\'\'(x) = 0',
            caption: `ចំណុចរបត់ $I(x_0, f(x_0))$ គឺជាចំណុចដែលក្រាបផ្លាស់ប្តូរភាពប៉ោងទៅផត ហើយបន្ទាត់ប៉ះកាត់ឆ្លងកាត់ក្រាបត្រង់នោះ។`,
            formula: "f''(x_0) = 0 \\quad \\land \\quad f''(x) \\text{ ប្តូរសញ្ញាកាត់ } x_0",
            speak: `ចំណុចរបត់ និងភាពកោងនៃក្រាប ត្រង់ចំណុចរបត់ f ពីរព្រីមស្មើសូន្យ ហើយប្តូរសញ្ញា`
          }
        ];
      }
    }
    // ========================================================================
    // Case 3: Integrals & Volume (អាំងតេក្រាល ផ្ទៃក្រឡា និងមាឌ)
    // ========================================================================
    else if (simType === 'integrals_volume') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ព្រីមីទីវ និងអាំងតេក្រាលមិនកំណត់',
            tag: 'ត្រកូលព្រីមីទីវ F(x) + C',
            caption: `ព្រីមីទីវនៃអនុគមន៍ $f$ គឺជាអនុគមន៍ $F$ ដែលផ្ទៀងផ្ទាត់ $F'(x) = f(x)$។ អាំងតេក្រាលមិនកំណត់តំណាងឱ្យត្រកូលខ្សែរោងកោងស្របគ្នា។`,
            formula: '\\int f(x)\\,dx = F(x) + C \\quad (C \\in \\mathbb{R})',
            speak: `ព្រីមីទីវ និងអាំងតេក្រាលមិនកំណត់ ស្មើនឹង F នៃ x បូកនឹងចំនួនថេរ C`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ អាំងតេក្រាលកំណត់ និងផ្ទៃក្រឡា',
            tag: 'រូបមន្តញូតុន-ឡែបនីស',
            caption: `ផ្ទៃក្រឡានៃដែនប្លង់ក្រោមក្រាប $y = f(x) \\ge 0$ លើចន្លោះ $[a, b]$ ស្មើនឹងអាំងតេក្រាលកំណត់ពី $a$ ទៅ $b$។`,
            formula: 'S = \\int_a^b f(x)\\,dx = [F(x)]_a^b = F(b) - F(a)',
            speak: `អាំងតេក្រាលកំណត់ និងការគណនាផ្ទៃក្រឡាតាមរូបមន្តញូតុនឡែបនីស`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ មាឌសូលីតបដិវត្តន៍ 3D',
            tag: 'ការវិលជុំវិញអ័ក្ស Ox',
            caption: `មាឌនៃសូលីតបដិវត្តន៍ដែលកើតពីការបង្វិលផ្ទៃក្រឡាក្រោមក្រាប $y = f(x)$ ជុំវិញអ័ក្ស $Ox$ បានមួយជុំ $360^\\circ$។`,
            formula: 'V = \\pi \\int_a^b [f(x)]^2\\,dx',
            speak: `មាឌសូលីតបដិវត្តន៍ 3D កើតពីការបង្វិលផ្ទៃក្រឡាជុំវិញអ័ក្សដេក Ox`
          }
        ];
      }
    }
    // ========================================================================
    // Case 4: Space Geometry, Vectors, Planes & Spheres
    // ========================================================================
    else if (simType === 'space_geometry') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ផលគុណពីរវ៉ិចទ័រ u ⨯ v',
            tag: 'វ៉ិចទ័រណរម៉ាល់កែង',
            caption: `ផលគុណពីរវ៉ិចទ័រ $\\vec{u} \\times \\vec{v}$ បង្កើតបានវ៉ិចទ័រថ្មីមួយដែលកែងនឹងវ៉ិចទ័រទាំងពីរ ហើយប្រវែងរបស់វាស្មើនឹងផ្ទៃក្រឡាប្រលេឡូក្រាម។`,
            formula: '\\vec{w} = \\vec{u} \\times \\vec{v} \\implies \\vec{w} \\perp \\vec{u} \\quad \\land \\quad \\vec{w} \\perp \\vec{v}',
            speak: `ផលគុណពីរវ៉ិចទ័រ បង្កើតបានវ៉ិចទ័រកែងនឹងវ៉ិចទ័រទាំងពីរ`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ សមីការប្លង់ក្នុងលំហ Oxyz',
            tag: 'សមីការទូទៅនៃប្លង់',
            caption: `ប្លង់កាត់តាមចំណុច $M_0(x_0, y_0, z_0)$ និងមានវ៉ិចទ័រណរម៉ាល់ $\\vec{n}(A, B, C)$ កំណត់ដោយសមីការ ៖`,
            formula: 'A(x - x_0) + B(y - y_0) + C(z - z_0) = 0 \\iff Ax + By + Cz + D = 0',
            speak: `សមីការប្លង់ក្នុងលំហបីវិមាត្រ មានវ៉ិចទ័រណរម៉ាល់ n A B C`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ សមីការស្វ៊ែរក្នុងលំហ',
            tag: 'ស្វ៊ែរផ្ចិត I និងកាំ R',
            caption: `សមីការស្តង់ដានៃស្វ៊ែរផ្ចិត $I(a, b, c)$ និងកាំ $R$ ក្នុងលំហ $Oxyz$ ៖`,
            formula: '(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2',
            speak: `សមីការស្តង់ដានៃស្វ៊ែរក្នុងលំហបីវិមាត្រ ផ្ចិត I និងកាំ R`
          }
        ];
      }
    }
    // ========================================================================
    // Case 5: Conic Sections (កោនិក - ប៉ារ៉ាបូល អេលីប អ៊ីពែបូល)
    // ========================================================================
    else if (simType === 'conic_sections') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ប៉ារ៉ាបូល (Parabola)',
            tag: 'កំណុំ និងបន្ទាត់ប្រាប់ទិស',
            caption: `ប៉ារ៉ាបូលជាសំណុំចំណុច $M$ ដែលមានចម្ងាយស្មើគ្នាពីកំណុំ $F$ និងបន្ទាត់ប្រាប់ទិស $(\\Delta)$ ៖ $MF = d(M, \\Delta)$។`,
            formula: 'y^2 = 4px \\quad (\\text{ឬ } x^2 = 4py)',
            speak: `ប៉ារ៉ាបូល កំណត់ដោយសំណុំចំណុចដែលមានចម្ងាយស្មើគ្នាពីកំណុំ និងបន្ទាត់ប្រាប់ទិស`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ អេលីប (Ellipse)',
            tag: 'ផលបូកចម្ងាយថេរ 2a',
            caption: `អេលីបជាសំណុំចំណុច $M$ ដែលផលបូកចម្ងាយពីកំណុំទាំងពីរជាចំនួនថេរ ៖ $MF_1 + MF_2 = 2a$ ($a^2 = b^2 + c^2$)។`,
            formula: '\\dfrac{x^2}{a^2} + \\dfrac{y^2}{b^2} = 1 \\quad (a > b > 0)',
            speak: `អេលីប កំណត់ដោយផលបូកចម្ងាយពីកំណុំទាំងពីរស្មើនឹងពីរ a`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ អ៊ីពែបូល (Hyperbola)',
            tag: 'ផលដកចម្ងាយថេរ 2a',
            caption: `អ៊ីពែបូលជាសំណុំចំណុច $M$ ដែលផលដកចម្ងាយពីកំណុំទាំងពីរជាចំនួនថេរ ៖ $|MF_1 - MF_2| = 2a$ ($c^2 = a^2 + b^2$)។`,
            formula: '\\dfrac{x^2}{a^2} - \\dfrac{y^2}{b^2} = 1 \\quad (\\text{អាស៊ីមតូត } y = \\pm \\dfrac{b}{a}x)',
            speak: `អ៊ីពែបូល កំណត់ដោយផលដកចម្ងាយពីកំណុំទាំងពីរស្មើនឹងពីរ a និងមានបន្ទាត់អាស៊ីមតូតពីរ`
          }
        ];
      }
    }
    // ========================================================================
    // Case 6: Complex Numbers (ចំនួនកុំផ្លិច)
    // ========================================================================
    else if (simType === 'complex_numbers') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ទម្រង់ពីជគណិតនៃចំនួនកុំផ្លិច',
            tag: 'ប្លង់កុំផ្លិច Argand',
            caption: `ចំនួនកុំផ្លិច $z = a + bi$ ដែល $a$ ជាផ្នែកពិត, $b$ ជាផ្នែកនិម្មិត និង $i^2 = -1$។ ក្នុងប្លង់កុំផ្លិច វាត្រូវបានតំណាងដោយចំណុច $M(a, b)$។`,
            formula: 'z = a + bi \\quad (a, b \\in \\mathbb{R}, \\; i^2 = -1)',
            speak: `ចំនួនកុំផ្លិចទម្រង់ពីជគណិត z ស្មើនឹង a បូក b i`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ទម្រង់ត្រីកោណមាត្រ',
            tag: 'ម៉ូឌុល និងអាគុយម៉ង់',
            caption: `ចំនួនកុំផ្លិចអាចសរសេរជាទម្រង់ត្រីកោណមាត្រ $z = r(\\cos\\theta + i\\sin\\theta)$ ដោយ $r = \\sqrt{a^2 + b^2}$ និង $\\tan\\theta = \\frac{b}{a}$។`,
            formula: 'z = r(\\cos\\theta + i\\sin\\theta) = r e^{i\\theta}',
            speak: `ទម្រង់ត្រីកោណមាត្រនៃចំនួនកុំផ្លិច តាមរយៈម៉ូឌុល r និងអាគុយម៉ង់ ធេតា`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ឫសទី n នៃចំនួនកុំផ្លិច',
            tag: 'រូបមន្តដឺម័រ (De Moivre)',
            caption: `ឫសទី $n$ នៃចំនួនកុំផ្លិច $z = r(\\cos\\theta + i\\sin\\theta)$ មាន $n$ តម្លៃផ្សេងគ្នាចែកស្មើគ្នានៅលើរង្វង់ ៖`,
            formula: 'z_k = \\sqrt[n]{r}\\left[\\cos\\left(\\dfrac{\\theta + 2k\\pi}{n}\\right) + i\\sin\\left(\\dfrac{\\theta + 2k\\pi}{n}\\right)\\right]',
            speak: `ឫសទី n នៃចំនួនកុំផ្លិច និងរូបមន្តដឺម័រ`
          }
        ];
      }
    }
    // ========================================================================
    // Case 7: Statistics & Probability (ស្ថិតិ និងប្រូបាប)
    // ========================================================================
    else if (simType === 'statistics_probability') {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ តារាងបែងចែកប្រេកង់ និងអ៊ីស្តូក្រាម',
            tag: 'ការរៀបចំទិន្នន័យស្ថិតិ',
            caption: `អ៊ីស្តូក្រាម 3D បង្ហាញពីការបែងចែកទិន្នន័យជាថ្នាក់នីមួយៗ $[x_i, x_{i+1}]$ ជាមួយនឹងកម្ពស់ប្រេកង់ $n_i$ ឬប្រេកង់ធៀប $f_i$។`,
            formula: 'N = \\sum_{i=1}^k n_i, \\quad f_i = \\dfrac{n_i}{N} \\times 100\\%',
            speak: `តារាងបែងចែកប្រេកង់ និងអ៊ីស្តូក្រាមនៃទិន្នន័យស្ថិតិ`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ រង្វាស់ទីតាំងកណ្តាល និងបំរែបំរួល',
            tag: 'មធ្យម វ៉ារ្យ៉ង់ និងគម្លាតស្តង់ដា',
            caption: `មធ្យមភាគ $\\bar{x}$, វ៉ារ្យ៉ង់ $V$ និងគម្លាតស្តង់ដា $\\sigma = \\sqrt{V}$ វាស់ស្ទង់កម្រិតបែកខ្ញែកនៃទិន្នន័យជុំវិញតម្លៃមធ្យមតាមខ្សែកោងកណ្តឹង Gauss។`,
            formula: '\\bar{x} = \\dfrac{1}{N}\\sum n_i x_i, \\quad \\sigma = \\sqrt{\\dfrac{1}{N}\\sum n_i(x_i - \\bar{x})^2}',
            speak: `រង្វាស់ទីតាំងកណ្តាល មធ្យមភាគ វ៉ារ្យ៉ង់ និងគម្លាតស្តង់ដា`
          }
        ];
      }
    }
    // ========================================================================
    // Case 8: Arithmetic Sequences (ស្វ៊ីតនព្វន្ត)
    // ========================================================================
    else if (simType === 'arithmetic_sequence' || title.includes('នព្វន្ត')) {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ និយមន័យស្វ៊ីតនព្វន្ត',
            tag: 'លក្ខខណ្ឌគ្រឹះនៃស្វ៊ីតនព្វន្ត',
            caption: `ស្វ៊ីតនព្វន្ត គឺជាស្វ៊ីតនៃចំនួនពិតដែលតួនិមួយៗ (ចាប់ពីតួទី ២ ទៅ) ស្មើនឹងតួមុនវាបូកនឹងចំនួនថេរ $d$ ហៅថា <strong>ផលសងរួម</strong>។`,
            formula: 'u_{n+1} = u_n + d \\iff u_{n+1} - u_n = d = \\text{ថេរ}',
            speak: `ចំណុចទីមួយ ស្វ៊ីតនព្វន្តគឺជាស្វ៊ីតដែលតួនីមួយៗស្មើនឹងតួមុនវាបូកនឹងផលសងរួម d`
          },
          {
            badge: 'ជំហាន ២/២ ៖ ការកំណត់ផលសងរួម d',
            tag: 'វិធីសាស្ត្រគណនា d',
            caption: `ដើម្បីកំណត់ថាតើស្វ៊ីតមួយជាស្វ៊ីតនព្វន្តឬទេ គេត្រូវពិនិត្យផលដក $u_{n+1} - u_n$ ៖ បើឃើញផលដកស្មើនឹងចំនួនថេរមិនប្រែប្រួល នោះវាជាស្វ៊ីតនព្វន្ត។`,
            formula: 'd = u_2 - u_1 = u_3 - u_2 = \\dots = u_n - u_{n-1}',
            speak: `ជំហានទីពីរ ផលសងរួម d គណនាដោយយកតួបន្ទាប់ដកនឹងតួមុន`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ រូបមន្តតួទី n ពីតួដំបូង u1',
            tag: 'តួទូទៅនៃស្វ៊ីតនព្វន្ត',
            caption: `តួទី $n$ ($u_n$) នៃស្វ៊ីតនព្វន្តដែលមានតួដំបូង $u_1$ និងផលសងរួម $d$ កំណត់ដោយរូបមន្ត ៖ $u_n = u_1 + (n - 1)d$។`,
            formula: 'u_n = u_1 + (n - 1)d',
            speak: `ចំណុចទីពីរ រូបមន្តតួទី n នៃស្វ៊ីតនព្វន្ត ស្មើនឹង u1 បូកនឹងកត្តា n ដក 1 គុណនឹង d`
          },
          {
            badge: 'ជំហាន ២/២ ៖ ទំនាក់ទំនងរវាងពីរតួបំពាន un និង up',
            tag: 'រូបមន្តទូទៅឆ្លងកាត់តួទី p',
            caption: `បើគេស្គាល់តួទី $p$ ណាមួយនៃស្វ៊ីតនព្វន្ត គេអាចទាញរកតួទី $n$ តាមរូបមន្ត ៖ $u_n = u_p + (n - p)d$។`,
            formula: 'u_n = u_p + (n - p)d \\implies d = \\dfrac{u_n - u_p}{n - p}',
            speak: `ជំហានទីពីរ រូបមន្តទំនាក់ទំនងរវាងពីរតួបំពាន un និង up`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ រូបមន្តផលបូក Gauss',
            tag: 'ទ្រឹស្តីបទផលបូក Gauss',
            caption: `ផលបូក $n$ តួដំបូងនៃស្វ៊ីតនព្វន្ត $S_n = u_1 + u_2 + \\dots + u_n$ ស្មើនឹងកន្លះផលបូកតួចុងគុណនឹងចំនួនតួ $n$។`,
            formula: 'S_n = \\dfrac{n(u_1 + u_n)}{2}',
            speak: `ចំណុចទីបី ផលបូក n តួដំបូងនៃស្វ៊ីតនព្វន្ត ស្មើនឹង n គុណនឹង u1 បូក un ចែកនឹង 2`
          },
          {
            badge: 'ជំហាន ២/២ ៖ រូបមន្តផលបូកតាម u1 និង d',
            tag: 'រូបមន្តពន្លាតពេញលេញ',
            caption: `ដោយជំនួស $u_n = u_1 + (n - 1)d$ ចូលក្នុងរូបមន្តផលបូក យើងទទួលបានទម្រង់ ៖ $S_n = \\dfrac{n[2u_1 + (n - 1)d]}{2}$។`,
            formula: 'S_n = \\dfrac{n[2u_1 + (n - 1)d]}{2}',
            speak: `ជំហានទីពីរ រូបមន្តផលបូកតាមរយៈ u1 និងផលសងរួម d`
          }
        ];
      }
    }
    // ========================================================================
    // Case 9: Geometric Sequences (ស្វ៊ីតធរណីមាត្រ)
    // ========================================================================
    else if (simType === 'geometric_sequence' || title.includes('ធរណីមាត្រ')) {
      if (pIdx === 0) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ និយមន័យស្វ៊ីតធរណីមាត្រ',
            tag: 'ផលធៀបរួម q',
            caption: `ស្វ៊ីតធរណីមាត្រ គឺជាស្វ៊ីតដែលតួនិមួយៗ (ចាប់ពីតួទី ២) ស្មើនឹងតួមុនវាគុណនឹងចំនួនថេរ $q \\ne 0$ ហៅថា <strong>ផលធៀបរួម</strong>។`,
            formula: 'u_{n+1} = u_n \\cdot q \\iff \\dfrac{u_{n+1}}{u_n} = q = \\text{ថេរ}',
            speak: `ចំណុចទីមួយ ស្វ៊ីតធរណីមាត្រគឺជាស្វ៊ីតដែលតួនីមួយៗស្មើនឹងតួមុនវាគុណនឹងផលធៀបរួម q`
          }
        ];
      } else if (pIdx === 1) {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ តួទី n នៃស្វ៊ីតធរណីមាត្រ',
            tag: 'រូបមន្តតួទូទៅ u_n',
            caption: `តួទី $n$ ($u_n$) នៃស្វ៊ីតធរណីមាត្រដែលមានតួដំបូង $u_1$ និងផលធៀបរួម $q$ កំណត់ដោយរូបមន្ត ៖ $u_n = u_1 \\cdot q^{n-1}$។`,
            formula: 'u_n = u_1 \\cdot q^{n-1} \\quad (\\text{ឬ } u_n = u_p \\cdot q^{n-p})',
            speak: `ចំណុចទីពីរ តួទី n នៃស្វ៊ីតធរណីមាត្រស្មើនឹង u1 គុណនឹង q ស្វ័យគុណ n ដក 1`
          }
        ];
      } else {
        this.currentSteps = [
          {
            badge: 'ជំហាន ១/២ ៖ ផលបូក n តួដំបូង S_n',
            tag: 'រូបមន្តផលបូកស្វ៊ីតធរណីមាត្រ',
            caption: `ផលបូក $n$ តួដំបូងនៃស្វ៊ីតធរណីមាត្រ ($q \\ne 1$) កំណត់ដោយរូបមន្ត ៖ $S_n = \\dfrac{u_1(1 - q^n)}{1 - q} = \\dfrac{u_1(q^n - 1)}{q - 1}$។`,
            formula: 'S_n = \\dfrac{u_1(1 - q^n)}{1 - q} \\quad (q \\ne 1)',
            speak: `ចំណុចទីបី ផលបូក n តួដំបូងនៃស្វ៊ីតធរណីមាត្រ`
          }
        ];
      }
    }

    // ========================================================================
    // Case: Rational Numbers (Grade 8 - les-g8-01)
    // ========================================================================
    else if (simType === 'rational_numbers') {
      if (pIdx === 0) {
        // Point 1: សញ្ញាណចំនួនសនិទាន & និយមន័យ
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ និយមន័យចំនួនសនិទាន',
            tag: 'សំណុំ Q = {a/b | a, b ∈ Z, b ≠ 0}',
            caption: `ចំនួនសនិទាន គឺជាចំនួនដែលអាចសរសេរជាទម្រង់ប្រភាគ $\\dfrac{a}{b}$ ដែល $a, b \\in \\mathbb{Z}$ និង $b \\ne 0$។ $a$ ហៅថាភាគយក និង $b$ ហៅថាភាគបែង។ សំណុំចំនួនសនិទានតាងដោយអក្សរ $\\mathbb{Q}$។`,
            formula: '\\mathbb{Q} = \\left\\{ \\dfrac{a}{b} \\;\\middle|\\; a, b \\in \\mathbb{Z}, \\, b \\ne 0 \\right\\}',
            speak: `ចំនួនសនិទានជាចំនួនដែលអាចសរសេរជាទម្រង់ប្រភាគ a លើ b ដែល a និង b ជាចំនួនគត់រ៉ឺឡាទីវ និង b ខុសពីសូន្យ`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ការបំលែងជាទសភាគ និងទសភាគខួប',
            tag: 'ទសភាគកំណត់ & ទសភាគខួប',
            caption: `គ្រប់ចំនួនសនិទានទាំងអស់ អាចបំលែងជាចំនួនទសភាគកំណត់ (ដូចជា $\\frac{3}{4} = 0.75$) ឬជាចំនួនទសភាគមិនកំណត់ខួប (ដូចជា $\\frac{1}{3} = 0.333... = 0.(3)$)។`,
            formula: '\\dfrac{3}{4} = 0.75, \\quad \\dfrac{1}{3} = 0.(3), \\quad \\dfrac{7}{6} = 1.1(6)',
            speak: `គ្រប់ចំនួនសនិទានអាចបំលែងជាទសភាគកំណត់ ឬទសភាគមិនកំណត់ខួប`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ការប្រៀបធៀប និងលំដាប់ចំនួនសនិទាន
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ ការប្រៀបធៀបលើបន្ទាត់ចំនួន 3D',
            tag: 'ទីតាំងលើបន្ទាត់ចំនួន',
            caption: `នៅលើបន្ទាត់ចំនួន ចំនួនដែលនៅខាងស្តាំតែងតែធំជាងចំនួនដែលនៅខាងឆ្វេង។ ចំនួនវិជ្ជមានតែងតែធំជាងសូន្យ និងធំជាងចំនួនអវិជ្ជមានជានិច្ច ៖ $-a < 0 < b$។`,
            formula: 'x_1 < x_2 \\iff x_1 \\text{ នៅខាងឆ្វេង } x_2',
            speak: `នៅលើបន្ទាត់ចំនួន ចំនួននៅខាងស្តាំធំជាងចំនួននៅខាងឆ្វេងជានិច្ច`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ការតម្រូវភាគបែង និងវិធានគុណខ្វែង',
            tag: 'វិធានគុណខ្វែង a·d vs b·c',
            caption: `ដើម្បីប្រៀបធៀបពីរចំនួនសនិទាន $\\frac{a}{b}$ និង $\\frac{c}{d}$ (ដោយ $b, d > 0$) ៖ បើ $a \\cdot d > b \\cdot c$ នោះ $\\frac{a}{b} > \\frac{c}{d}$។ បើ $a \\cdot d = b \\cdot c$ នោះប្រភាគទាំងពីរស្មើគ្នា។`,
            formula: '\\dfrac{a}{b} > \\dfrac{c}{d} \\iff a \\cdot d > b \\cdot c \\quad (b, d > 0)',
            speak: `ប្រៀបធៀបប្រភាគដោយតម្រូវភាគបែង ឬប្រើវិធីគុណខ្វែង`
          }
        ];
      } else {
        // Point 3: ប្រមាណវិធីទាំងបួនលើចំនួនសនិទាន
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ប្រមាណវិធីបូក និងដក',
            tag: 'ការតម្រូវភាគបែងរួម',
            caption: `ដើម្បីបូកឬដកចំនួនសនិទាន ត្រូវតម្រូវភាគបែងឱ្យដូចគ្នា រួចបូកឬដកភាគយក ៖ $\\frac{a}{m} \\pm \\frac{b}{m} = \\frac{a \\pm b}{m}$។ បើភាគបែងខុសគ្នា ត្រូវរកភាគបែងរួមតូចបំផុត (LCM)។`,
            formula: '\\dfrac{a}{m} \\pm \\dfrac{b}{m} = \\dfrac{a \\pm b}{m}, \\quad \\dfrac{a}{b} + \\dfrac{c}{d} = \\dfrac{ad + bc}{bd}',
            speak: `បូកដកចំនួនសនិទានដោយតម្រូវភាគបែងរួម រួចបូកឬដកភាគយក`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ប្រមាណវិធីគុណ និងចែក',
            tag: 'គុណភាគយក និងច្រាសភាគបែង',
            caption: `គុណ ៖ យកភាគយកគុណភាគយក ភាគបែងគុណភាគបែង $\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{ac}{bd}$។ ចែក ៖ គុណនឹងប្រភាគច្រាស $\\frac{a}{b} \\div \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c} = \\frac{ad}{bc}$ ($c \\ne 0$)។`,
            formula: '\\dfrac{a}{b} \\cdot \\dfrac{c}{d} = \\dfrac{ac}{bd}, \\quad \\dfrac{a}{b} \\div \\dfrac{c}{d} = \\dfrac{ad}{bc} \\quad (c \\ne 0)',
            speak: `គុណភាគយកនឹងភាគយក ចែកគឺគុណនឹងប្រភាគច្រាស`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Integers on 3D Number Line (Grade 7 - les-g7-01)
    // ========================================================================
    else if (simType === 'integers_number_line') {
      if (pIdx === 0) {
        // Point 1: សញ្ញាណចំនួនគត់រ៉ឺឡាទីវ & តម្លៃដាច់ខាត
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ សញ្ញាណចំនួនគត់រ៉ឺឡាទីវ & បន្ទាត់ចំនួន 3D',
            tag: 'បន្ទាត់ចំនួនពិត និងទិសដៅ',
            caption: `ចំនួនគត់រ៉ឺឡាទីវរួមមាន <strong>ចំនួនគត់វិជ្ជមាន (+)</strong>, <strong>ចំនួនសូន្យ (០)</strong>, និង <strong>ចំនួនគត់អវិជ្ជមាន (-)</strong>។ លើបន្ទាត់ចំនួន ចំនួនវិជ្ជមានស្ថិតនៅខាងស្តាំសូន្យ ហើយចំនួនអវិជ្ជមានស្ថិតនៅខាងឆ្វេងសូន្យ។`,
            formula: '\\mathbb{Z} = \{ \\dots, -3, -2, -1, 0, +1, +2, +3, \\dots \}',
            speak: `សញ្ញាណចំនួនគត់រ៉ឺឡាទីវ និងបន្ទាត់ចំនួនពិត 3D`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ តម្លៃដាច់ខាត & ចំនួនផ្ទុយ',
            tag: 'ចម្ងាយពីចំណុចសូន្យ',
            caption: `តម្លៃដាច់ខាត $|x|$ គឺជាចម្ងាយពីចំណុច $0$ ទៅចំណុចតំណាង $x$ លើបន្ទាត់ចំនួន ($|a| \\ge 0$ ជានិច្ច)។ ពីរចំនួនផ្ទុយគ្នាមានតម្លៃដាច់ខាតស្មើគ្នា ប៉ុន្តែសញ្ញាផ្ទុយគ្នា ៖ $|+5| = |-5| = 5$ និង $(+a) + (-a) = 0$។`,
            formula: '|x| = \\begin{cases} x & \\text{បើ } x \\ge 0 \\ -x & \\text{បើ } x < 0 \\end{cases}, \\quad |+a| = |-a| = a',
            speak: `តម្លៃដាច់ខាតជាចម្ងាយពីសូន្យ ហើយពីរចំនួនផ្ទុយគ្នាមានផលបូកស្មើសូន្យ`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ផលបូក & ផលដកចំនួនគត់រ៉ឺឡាទីវ
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ ផលបូកចំនួនគត់រ៉ឺឡាទីវ',
            tag: 'បូកសញ្ញាដូច & បូកសញ្ញាផ្ទុយ',
            caption: `(១) បូកពីរចំនួនសញ្ញាដូចគ្នា ៖ យកផលបូកតម្លៃដាច់ខាត រួចដាក់សញ្ញារួម។ (២) បូកពីរចំនួនសញ្ញាផ្ទុយគ្នា ៖ យកតម្លៃដាច់ខាតធំដកតម្លៃដាច់ខាតតូច រួចដាក់សញ្ញាតាមចំនួនដែលមានតម្លៃដាច់ខាតធំជាង។`,
            formula: '(-5) + (+8) = +(8 - 5) = +3, \\quad (-4) + (-3) = -(4 + 3) = -7',
            speak: `វិធានផលបូកចំនួនគត់រ៉ឺឡាទីវសញ្ញាដូចគ្នានិងសញ្ញាផ្ទុយគ្នា`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ផលដកចំនួនគត់រ៉ឺឡាទីវ',
            tag: 'ការបូកនឹងចំនួនផ្ទុយ',
            caption: `ដើម្បីដកចំនួនគត់ $a$ នឹង $b$ គេត្រូវបូក $a$ នឹងចំនួនផ្ទុយនៃ $b$ ៖ $a - b = a + (-b)$។ កាលណាសញ្ញាដកប៉ះដក ប្រែក្លាយជាបូក ៖ $a - (-b) = a + b$។`,
            formula: 'a - b = a + (-b), \\quad 4 - (-3) = 4 + 3 = 7',
            speak: `ផលដកចំនួនគត់រ៉ឺឡាទីវស្មើនឹងផលបូកនឹងចំនួនផ្ទុយ`
          }
        ];
      } else if (pIdx === 2) {
        // Point 3: ផលគុណ & ផលចែកចំនួនគត់រ៉ឺឡាទីវ
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ វិធានសញ្ញានៃផលគុណ & ផលចែក',
            tag: 'សញ្ញាដូចចេញបូក សញ្ញាផ្ទុយចេញដក',
            caption: `ផលគុណ ឬផលចែកនៃពីរចំនួនសញ្ញាដូចគ្នា ផ្តល់លទ្ធផល <strong>វិជ្ជមាន (+)</strong>។ ផលគុណ ឬផលចែកនៃពីរចំនួនសញ្ញាផ្ទុយគ្នា ផ្តល់លទ្ធផល <strong>អវិជ្ជមាន (-)</strong>។`,
            formula: '(+) \\times (+) = (+), \\quad (-) \\times (-) = (+), \\quad (+) \\times (-) = (-)',
            speak: `វិធានសញ្ញានៃផលគុណនិងផលចែកចំនួនគត់រ៉ឺឡាទីវ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ លក្ខខណ្ឌតួចែកខុសពីសូន្យ',
            tag: 'ការគណនា និងលក្ខខណ្ឌ',
            caption: `ផលចែក $\\dfrac{a}{b}$ មានន័យលុះត្រាតែ $b \\ne 0$។ ឧទាហរណ៍ ៖ $(-12) \div (+3) = -4$, $(-20) \div (-5) = +4$។`,
            formula: '\\dfrac{+a}{+b} = +, \\quad \\dfrac{-a}{-b} = +, \\quad \\dfrac{+a}{-b} = - \\quad (b \\ne 0)',
            speak: `លក្ខខណ្ឌតួចែកខុសពីសូន្យក្នុងការចែកចំនួនគត់`
          }
        ];
      } else {
        // Point 4: លំដាប់ប្រមាណវិធី & ចំណោទជាក់ស្តែង
        this.currentSteps = [
          {
            badge: 'ចំណុច ៤ • ជំហាន ១/២ ៖ លំដាប់អាទិភាពនៃប្រមាណវិធី (PEMDAS)',
            tag: 'វង់ក្រចក គុណចែក បូកដក',
            caption: `លំដាប់ប្រមាណវិធី ៖ (១) គណនាក្នុងវង់ក្រចកមុនគេ $( )$, $[ ]$, $\{ \}$ (២) ស្វ័យគុណ (៣) ផលគុណ និងផលចែកពីឆ្វេងទៅស្តាំ (៤) ផលបូក និងផលដកពីឆ្វេងទៅស្តាំ។`,
            formula: 'A = 15 - 3 \\times [(-2) + 5] = 15 - 3 \\times 3 = 15 - 9 = 6',
            speak: `លំដាប់អាទិភាពនៃប្រមាណវិធីគណនាក្នុងវង់ក្រចកមុនគេ`
          },
          {
            badge: 'ចំណុច ៤ • ជំហាន ២/២ ៖ ចំណោទអនុវត្តជាក់ស្តែង',
            tag: 'សីតុណ្ហភាព និងលុយកាក់',
            caption: `ឧទាហរណ៍ ៖ សីតុណ្ហភាពនៅពេលព្រឹកគឺ $-3^\circ\\text{C}$។ នៅពេលថ្ងៃឡើងកម្តៅ $8^\circ\\text{C}$ រួចយប់ចុះត្រជាក់ $6^\circ\\text{C}$។ សីតុណ្ហភាពនៅពេលយប់គឺ ៖ $(-3) + 8 - 6 = -1^\circ\\text{C}$។`,
            formula: 'T = (-3) + 8 - 6 = +5 - 6 = -1^\circ\\text{C}',
            speak: `ការអនុវត្តប្រមាណវិធីលើចំនួនគត់ដោះស្រាយចំណោទសីតុណ្ហភាពជាក់ស្តែង`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Fractions & Decimals (Grade 7 - les-g7-02)
    // ========================================================================
    else if (simType === 'fractions_decimals') {
      if (pIdx === 0) {
        // Point 1: សញ្ញាណប្រភាគ & ការសម្រួល
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ សញ្ញាណប្រភាគ N/D',
            tag: 'ភាគយកធៀបនឹងភាគបែង',
            caption: `ប្រភាគ $\\dfrac{N}{D}$ តំណាងឱ្យការយក $N$ ចំណែក (ភាគយក) ពីចំណែកសរុបស្មើៗគ្នា $D$ (ភាគបែង) នៃវត្ថុទាំងមូល ($D \\ne 0$)។ ក្នុងរូប 3D បង្ហាញស៊ីឡាំង និងចំណែកស្មើៗគ្នា។`,
            formula: '\\text{ប្រភាគ} = \\dfrac{\\text{ភាគយក } N}{	ext{ភាគបែង } D} \\quad (D \\ne 0)',
            speak: `សញ្ញាណប្រភាគ ភាគយកធៀបនឹងភាគបែង 3D`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ប្រភាគស្មើគ្នា & ការសម្រួល',
            tag: 'ប្រភាគសម្រួលលែងបាន',
            caption: `បើគុណ ឬចែកភាគយក និងភាគបែងនឹងចំនួនដូចគ្នាខុសពីសូន្យ តម្លៃប្រភាគមិនប្រែប្រួលឡើយ។ ដើម្បីសម្រួលប្រភាគ គេចែកភាគយកនិងភាគបែងនឹង PGCD របស់វា។`,
            formula: '\\dfrac{a \\times k}{b \\times k} = \\dfrac{a}{b}, \\quad \\dfrac{18 \div 6}{24 \div 6} = \\dfrac{3}{4}',
            speak: `លក្ខណៈប្រភាគស្មើគ្នានិងការសម្រួលជាប្រភាគសម្រួលលែងបាន`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ប្រមាណវិធីលើប្រភាគ
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ ផលបូក & ផលដកប្រភាគ',
            tag: 'ការតម្រូវភាគបែងរួម (PPCM)',
            caption: `ដើម្បីបូក ឬដកប្រភាគដែលមានភាគបែងខុសគ្នា គេត្រូវតម្រូវភាគបែងរួម (រក PPCM) រួចបូក ឬដកភាគយក និងរក្សាភាគបែងរួមនៅដដែល ៖ $\\dfrac{a}{m} \\pm \\dfrac{b}{m} = \\dfrac{a \\pm b}{m}$។`,
            formula: '\\dfrac{a}{c} + \\dfrac{b}{d} = \\dfrac{ad + bc}{cd}, \\quad \\dfrac{1}{3} + \\dfrac{1}{4} = \\dfrac{4 + 3}{12} = \\dfrac{7}{12}',
            speak: `ការបូកនិងដកប្រភាគដោយតម្រូវភាគបែងរួម`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ផលគុណ & ផលចែកប្រភាគ',
            tag: 'គុណភាគយក គុណចម្រាស',
            caption: `(១) ផលគុណ ៖ យកភាគយកគុណភាគយក ភាគបែងគុណភាគបែង ៖ $\\dfrac{a}{b} \\times \\dfrac{c}{d} = \\dfrac{ac}{bd}$។ (២) ផលចែក ៖ គុណប្រភាគទីមួយនឹងចម្រាសនៃប្រភាគទីពីរ ៖ $\\dfrac{a}{b} \div \\dfrac{c}{d} = \\dfrac{a}{b} \\times \\dfrac{d}{c}$។`,
            formula: '\\dfrac{a}{b} \\times \\dfrac{c}{d} = \\dfrac{ac}{bd}, \\quad \\dfrac{a}{b} \div \\dfrac{c}{d} = \\dfrac{a \cdot d}{b \cdot c}',
            speak: `ផលគុណប្រភាគនិងផលចែកដោយគុណនឹងប្រភាគចម្រាស`
          }
        ];
      } else if (pIdx === 2) {
        // Point 3: ចំនួនទសភាគ & ការបំប្លែង
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ទំនាក់ទំនងប្រភាគ និងទសភាគ',
            tag: 'ការបំប្លែងទៅជាទសភាគ',
            caption: `ដើម្បីប្តូរប្រភាគ $\\dfrac{N}{D}$ ទៅជាចំនួនទសភាគ គេត្រូវយកភាគយកចែកនឹងភាគបែង ៖ $\\dfrac{3}{4} = 3 \div 4 = 0.75$។ ចំនួនទសភាគអាចជាទសភាគកំណត់ ឬទសភាគខួប។`,
            formula: '\\dfrac{3}{4} = 0.75 = 75\%, \\quad \\dfrac{1}{3} = 0.333\\dots = 0.(3)',
            speak: `ទំនាក់ទំនងរវាងប្រភាគ ចំនួនទសភាគ និងភាគរយ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ទីតាំងទសភាគលើបន្ទាត់រង្វាស់',
            tag: 'បន្ទាត់បន្ទះរង្វាស់ 3D',
            caption: `ចំនួនទសភាគស្ថិតនៅចន្លោះចំនួនគត់ពីរជាប់គ្នា ឧទាហរណ៍ $0.75$ ស្ថិតនៅចន្លោះ $0$ និង $1$ (ជិត $1$ ជាង)។ ដើម្បីប្តូរទសភាគកំណត់ទៅប្រភាគ គេសរសេរភាគបែងជាស្វ័យគុណនៃ $10$។`,
            formula: '0.75 = \\dfrac{75}{100} = \\dfrac{3}{4}, \\quad 0 < 0.75 < 1',
            speak: `ទីតាំងនៃចំនួនទសភាគលើបន្ទាត់រង្វាស់និងការបំប្លែងទៅប្រភាគ`
          }
        ];
      } else {
        // Point 4: ចំណោទអនុវត្តជាក់ស្តែង
        this.currentSteps = [
          {
            badge: 'ចំណុច ៤ • ជំហាន ១/២ ៖ ចំណោទបែងចែកចំណែក និងទឹកប្រាក់',
            tag: 'ការគណនាប្រភាគនៃបរិមាណមួយ',
            caption: `ដើម្បីរកប្រភាគ $\\dfrac{a}{b}$ នៃចំនួន $K$ គេត្រូវយក $\\dfrac{a}{b} \\times K$។ ឧទាហរណ៍ ៖ កសិករម្នាក់មានដី $1200\\text{ m}^2$ គាត់ដាំស្រូវលើ $\\frac{2}{3}$ នៃផ្ទៃដី ដូច្នេះផ្ទៃដីដាំស្រូវគឺ $\\frac{2}{3} \\times 1200 = 800\\text{ m}^2$។`,
            formula: 'S = \\dfrac{2}{3} \\times 1200 = 800\\text{ m}^2',
            speak: `ការដោះស្រាយចំណោទគណនាប្រភាគនៃបរិមាណមួយជាក់ស្តែង`
          },
          {
            badge: 'ចំណុច ៤ • ជំហាន ២/២ ៖ ចំណោទភាគរយ និងចំណែកនៅសល់',
            tag: 'ផលបូកចំណែកស្មើ ១',
            caption: `ផលបូកនៃចំណែកទាំងអស់នៃវត្ថុទាំងមូលស្មើនឹង $1$។ បើប្រើប្រាស់អស់ $\\frac{1}{4} + \\frac{2}{5} = \\frac{13}{20}$ នោះចំណែកដែលនៅសល់គឺ $1 - \\frac{13}{20} = \\frac{7}{20}$ នៃបរិមាណសរុប។`,
            formula: '1 - \\left(\\dfrac{1}{4} + \\dfrac{2}{5}\\right) = 1 - \\dfrac{13}{20} = \\dfrac{7}{20}',
            speak: `ការគណនាចំណែកដែលនៅសល់ធៀបនឹងបរិមាណសរុប`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Decimals Base-10 Grid (Grade 7 - les-g7-05)
    // ========================================================================
    else if (simType === 'decimals_grid') {
      if (pIdx === 0) {
        // Point 1: សញ្ញាណចំនួនទសភាគ & តម្លៃខ្ទង់
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ តារាងតម្លៃខ្ទង់នៃចំនួនទសភាគ',
            tag: 'ខ្ទង់រាយ ខ្ទង់ភាគដប់ ខ្ទង់ភាគរយ ខ្ទង់ភាគពាន់',
            caption: `ចំនួនទសភាគចែកចេញជាពីរផ្នែកដោយសញ្ញាក្បៀស ៖ ផ្នែកគត់ (នៅខាងឆ្វេងក្បៀស) និងផ្នែកទសភាគ (នៅខាងស្តាំក្បៀស)។ ឧទាហរណ៍ ៖ $34.568$ មាន $3$ (ខ្ទង់សិប), $4$ (ខ្ទង់រាយ), $5$ (ខ្ទង់ភាគដប់ $0.5$), $6$ (ខ្ទង់ភាគរយ $0.06$), $8$ (ខ្ទង់ភាគពាន់ $0.008$)។`,
            formula: '34.568 = 30 + 4 + 0.5 + 0.06 + 0.008',
            speak: `តារាងតម្លៃខ្ទង់នៃចំនួនទសភាគ ផ្នែកគត់ និងផ្នែកទសភាគ`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ប្លុកតារាង Base-10 10x10',
            tag: '១ ឯកតាពេញ = ១០ ភាគដប់ = ១០០ ភាគរយ',
            caption: `វត្ថុ ១ ឯកតាពេញត្រូវបានបែងចែកជា ១០ ជួរឈរ (១ ជួរ = ០.១ ភាគដប់) និង ១០០ ការ៉ូតូចៗ (១ ការ៉ូ = ០.០១ ភាគរយ)។ ក្នុងរូប 3D បង្ហាញការបំភ្លឺពណ៌តាមតម្លៃទសភាគពិតប្រាកដ។`,
            formula: '1.00 = 10 \\times 0.10 = 100 \\times 0.01',
            speak: `ប្លុកតារាង 10 គុណ 10 ភាគដប់ និងភាគរយ 3D`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ប្រមាណវិធីលើចំនួនទសភាគ
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ វិធីបូក និងដកចំនួនទសភាគ',
            tag: 'ការតម្រង់សញ្ញាក្បៀសឱ្យចំគ្នា',
            caption: `ដើម្បីបូក ឬដកចំនួនទសភាគ គេត្រូវសរសេរលេខឱ្យត្រូវតាមខ្ទង់នីមួយៗ និងតម្រង់សញ្ញាក្បៀសឱ្យចំគ្នា ៖ $15.75 + 8.4 = 24.15$ រួចបន្តដក $6.825$ ឃើញ $17.325$។`,
            formula: '15.75 + 8.40 = 24.15, \\quad 24.15 - 6.825 = 17.325',
            speak: `វិធីបូកនិងដកចំនួនទសភាគដោយតម្រង់សញ្ញាក្បៀស`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ការគុណ និងចែកនឹង ១០, ១០០',
            tag: 'វិធានរំកិលសញ្ញាក្បៀសទៅឆ្វេង ឬស្តាំ',
            caption: `កាលណាគុណចំនួនទសភាគនឹង $10, 100$ គេរំកិលសញ្ញាក្បៀសទៅស្តាំ $1, 2$ ខ្ទង់។ កាលណាចែកនឹង $10, 100$ គេរំកិលសញ្ញាក្បៀសទៅឆ្វេង $1, 2$ ខ្ទង់។`,
            formula: '0.35 \\times 10 = 3.5, \\quad 0.35 \\times 100 = 35, \\quad 3.5 \\div 10 = 0.35',
            speak: `ការគុណនិងចែកចំនួនទសភាគនឹងដប់ និងមួយរយ`
          }
        ];
      } else {
        // Point 3: ការបំលែងទសភាគ និងប្រភាគ
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ បំលែងទសភាគទៅជាប្រភាគ',
            tag: 'សរសេរភាគបែងស្វ័យគុណនៃ ១០ រួចសម្រួល',
            caption: `ដើម្បីបំលែងចំនួនទសភាគទៅជាប្រភាគ គេសរសេរវាជាប្រភាគដែលមានភាគបែងជាស្វ័យគុណនៃ ១០ ($10, 100, 1000$) រួចសម្រួលជាប្រភាគសម្រួលមិនបាន ៖ $0.64 = \\dfrac{64}{100} = \\dfrac{16}{25}$។`,
            formula: '0.64 = \\dfrac{64}{100} = \\dfrac{16}{25}, \\quad 2.35 = \\dfrac{235}{100} = \\dfrac{47}{20}',
            speak: `ការបំលែងចំនួនទសភាគទៅជាប្រភាគសម្រួលមិនបាន`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ បំលែងប្រភាគទៅជាទសភាគ',
            tag: 'យកភាគយកចែកនឹងភាគបែង',
            caption: `ដើម្បីបំលែងប្រភាគទៅជាទសភាគ គេយកភាគយកចែកនឹងភាគបែង ៖ $\\dfrac{7}{8} = 7 \\div 8 = 0.875$ ឬធ្វើភាគបែងឱ្យទៅជាស្វ័យគុណនៃ ១០ ៖ $\\dfrac{9}{20} = \\dfrac{45}{100} = 0.45$។`,
            formula: '\\dfrac{7}{8} = 0.875, \\quad \\dfrac{13}{4} = 3.25, \\quad \\dfrac{9}{20} = 0.45',
            speak: `ការបំលែងប្រភាគទៅជាចំនួនទសភាគ`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Percentage & Commercial Discount (Grade 7 - les-g7-06)
    // ========================================================================
    else if (simType === 'percentage_cube') {
      if (pIdx === 0) {
        // Point 1: សញ្ញាណភាគរយ & ការបំលែង
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ សញ្ញាណភាគរយ (% = មួយភាគរយ)',
            tag: 'ចំណែកក្នុងចំណោម ១០០ ឯកតា',
            caption: `ភាគរយ គឺជានិមិត្តសញ្ញា % តំណាងឱ្យមួយចំណែកក្នុង ១០០ ចំណែក ៖ $P\\% = \\dfrac{P}{100}$។ ក្នុងរូប 3D ប្លុក ១០០ គ្រាប់ បង្ហាញយ៉ាងច្បាស់នូវ $P$ គ្រាប់ដែលបំភ្លឺពណ៌ gradient ធៀបនឹង ១០០ គ្រាប់សរុប។`,
            formula: 'P\\% = \\dfrac{P}{100} = 0.01 \\times P, \\quad 25\\% = \\dfrac{25}{100} = \\dfrac{1}{4} = 0.25',
            speak: `សញ្ញាណភាគរយ ចំណែកក្នុងមួយរយ 3D`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ការបំលែងរវាងប្រភាគ ទសភាគ និងភាគរយ',
            tag: 'ការគណនាបម្លែងសមមូល',
            caption: `ដើម្បីប្តូរប្រភាគជាភាគរយ គេគុណនឹង $100\\%$ ៖ $\\dfrac{3}{4} \\times 100\\% = 75\\%$។ ដើម្បីប្តូរទសភាគជាភាគរយ គេរំកិលក្បៀសពីរខ្ទង់ទៅស្តាំ ៖ $0.35 = 35\\%$។`,
            formula: '\\dfrac{3}{4} = 75\\%, \\quad \\dfrac{7}{20} = 35\\%, \\quad 0.35 = 35\\%, \\quad 1.45 = 145\\%',
            speak: `ការបំលែងរវាងប្រភាគ ចំនួនទសភាគ និងភាគរយ`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ការគណនាភាគរយនៃចំនួនមួយ
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ រូបមន្តគណនា P% នៃបរិមាណ A',
            tag: 'រូបមន្ត បរិមាណ = (P * A) / 100',
            caption: `ដើម្បីរក $P\\%$ នៃចំនួន $A$ គេគុណចំនួន $A$ នឹង $P$ រួចចែកនឹង $100$ ៖ $\\text{បរិមាណ} = \\dfrac{P \\times A}{100}$។ ឧទាហរណ៍ ៖ $15\\%$ នៃ $24,000\\text{ ៛} = 3,600\\text{ ៛}$។`,
            formula: '\\text{បរិមាណ} = A \\times \\dfrac{P}{100} = 24000 \\times \\dfrac{15}{100} = 3600\\text{ ៛}',
            speak: `រូបមន្តគណនាភាគរយនៃចំនួនមួយ`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ រកភាគរយធៀបនៃបរិមាណពីរ',
            tag: 'ផលធៀបគុណ ១០០ ភាគរយ',
            caption: `ដើម្បីដឹងថាតើចំនួន $a$ ស្មើប៉ុន្មានភាគរយនៃ $b$ គេយកផលធៀប $\\dfrac{a}{b} \\times 100\\%$។ ឧទាហរណ៍ ៖ $18$ ស្មើ $\\dfrac{18}{72} \\times 100\\% = 25\\%$ នៃ $72$។`,
            formula: '\\text{ភាគរយធៀប} = \\dfrac{a}{b} \\times 100\\% = \\dfrac{18}{72} \\times 100\\% = 25\\%',
            speak: `ការរកភាគរយធៀបនៃបរិមាណពីរ`
          }
        ];
      } else {
        // Point 3: ចំណោទបញ្ចុះតម្លៃ និងការប្រាក់
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ការបញ្ចុះតម្លៃទំនិញ (Discount)',
            tag: 'ការទូទាត់ជាក់ស្តែងពេលចុះថ្លៃ',
            caption: `ពេលហាងលក់បញ្ចុះតម្លៃ $P\\%$ ៖ ចំនួនប្រាក់ចុះថ្លៃ $D = \\text{តម្លៃដើម} \\times \\dfrac{P}{100}$ ហើយតម្លៃលក់ពិតគឺ $\\text{តម្លៃដើម} - D$។ ឧទាហរណ៍ ៖ កាតាប $40,000\\text{ ៛}$ ចុះ $15\\%$ ចុះអស់ $6,000\\text{ ៛}$ នៅសល់ត្រូវបង់ $34,000\\text{ ៛}$។`,
            formula: 'D = 40000 \\times 15\\% = 6000\\text{ ៛}, \\quad \\text{ត្រូវបង់} = 40000 - 6000 = 34000\\text{ ៛}',
            speak: `ការគណនាប្រាក់បញ្ចុះតម្លៃទំនិញ និងប្រាក់ត្រូវបង់ពិតប្រាកដ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ការគណនាការប្រាក់ប្រចាំឆ្នាំ (Interest)',
            tag: 'រូបមន្តការប្រាក់សាមញ្ញ I = C * r',
            caption: `ផ្ញើប្រាក់ $C$ នៅធនាគារដោយអត្រាការប្រាក់ $r\\%$ ក្នុងមួយឆ្នាំ ៖ ប្រាក់ការ $I = C \\times \\dfrac{r}{100}$។ ឧទាហរណ៍ ៖ $2,000,000\\text{ ៛}$ អត្រា $6\\%$ ក្នុង ១ ឆ្នាំទទួលបានប្រាក់ការ $120,000\\text{ ៛}$ និងប្រាក់សរុប $2,120,000\\text{ ៛}$។`,
            formula: 'I = C \\times \\dfrac{r}{100} = 2000000 \\times \\dfrac{6}{100} = 120000\\text{ ៛}',
            speak: `ការគណនាការប្រាក់ប្រចាំឆ្នាំនៅធនាគារ`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Linear Equation 1 Variable (Grade 7 - les-g7-03)
    // ========================================================================
    else if (simType === 'linear_equation_balance') {
      if (pIdx === 0) {
        // Point 1: សញ្ញាណសមីការ & សមមូលជញ្ជីងថ្លឹង
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ សញ្ញាណសមីការ និងសមមូលជញ្ជីងថ្លឹង',
            tag: 'សមភាពនៃអង្គសងខាង ax + b = c',
            caption: `សមីការដឺក្រេទី១មានមួយអញាត $ax + b = c$ ប្រៀបដូចជាជញ្ជីងថ្លឹងដែលមានតុល្យភាពស្មើគ្នា។ អង្គខាងឆ្វេងមាន $a$ ប្រអប់មិនស្គាល់ $x$ បូកនឹង $b$ គ្រាប់ ស្មើនឹងអង្គខាងស្តាំដែលមាន $c$ គ្រាប់។`,
            formula: 'ax + b = c \\quad (a \\ne 0)',
            speak: `សមីការដឺក្រេទី១មានមួយអញាតប្រៀបដូចជញ្ជីងថ្លឹងសមភាព`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ លក្ខខណ្ឌតុល្យភាពសមមូល',
            tag: 'ការថែម ឬបន្ថយអង្គសងខាង',
            caption: `ដើម្បីរក្សាតុល្យភាពជញ្ជីង បើថែម ឬបន្ថយទម្ងន់លើអង្គម្ខាង ត្រូវថែម ឬបន្ថយទម្ងន់ដូចគ្នាលើអង្គម្ខាងទៀត ៖ $A = B \\iff A \\pm k = B \\pm k$ និង $A \cdot k = B \cdot k$ ($k \\ne 0$)។`,
            formula: 'A = B \\iff A \\pm k = B \\pm k \\quad \\land \\quad A \cdot k = B \cdot k \\quad (k \\ne 0)',
            speak: `លក្ខខណ្ឌសមមូលនៃការថែមឬបន្ថយលើអង្គសងខាង`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: វិធីសាស្ត្រដោះស្រាយសមីការ
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ វិធីសាស្ត្រដោះស្រាយរកអញាត x',
            tag: 'ការបំបែករកតម្លៃ x',
            caption: `(១) ដក $b$ ពីអង្គទាំងសងខាង ៖ $ax = c - b$។ (២) ចែកអង្គទាំងសងខាងនឹង $a$ ៖ $x = \\dfrac{c - b}{a}$។ ជញ្ជីងនឹងរក្សាបានតុល្យភាពស្មើគ្នាជានិច្ច!`,
            formula: 'ax = c - b \\implies x = \\dfrac{c - b}{a}',
            speak: `វិធីដោះស្រាយសមីការដោយដក b និងចែកនឹង a`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ សមីការមានភាគបែង និងវង់ក្រចក',
            tag: 'ការតម្រូវភាគបែងរួម',
            caption: `ចំពោះសមីការមានភាគបែង ត្រូវតម្រូវភាគបែងរួមនៃតួទាំងអស់ រួចលុបភាគបែងចោល ៖ $\\dfrac{A(x)}{m} = \\dfrac{B(x)}{n} \\iff n \cdot A(x) = m \cdot B(x)$។`,
            formula: '\\dfrac{A(x)}{m} = \\dfrac{B(x)}{n} \\iff n \cdot A(x) = m \cdot B(x)',
            speak: `ជំហានដោះស្រាយសមីការមានភាគបែងដោយគុណខ្វែង`
          }
        ];
      } else {
        // Point 3: ចំណោទសមីការ
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ការដោះស្រាយចំណោទតាមវិធីសមីការ',
            tag: 'ជំហានទាំង ៤ នៃការស្រាយចំណោទ',
            caption: `(១) តាងអថេរមិនស្គាល់ $x$។ (២) បង្កើតសមីការតាមបម្រាប់ប្រធាន។ (៣) ដោះស្រាយសមីការរកតម្លៃ $x$។ (៤) ផ្ទៀងផ្ទាត់ និងសន្និដ្ឋានឆ្លើយសំណួរ។`,
            formula: '\\text{បម្រាប់ប្រធាន} \\xrightarrow{\\text{តាងអថេរ } x} ax + b = c \\xrightarrow{\\text{ដោះស្រាយ}} x = x_0',
            speak: `បួនជំហាននៃការដោះស្រាយចំណោទតាមវិធីសមីការ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ឧទាហរណ៍ចំណោទចំនួន និងអាយុ',
            tag: 'ការអនុវត្តជាក់ស្តែង',
            caption: `ឧទាហរណ៍ ៖ រកពីរចំនួនគត់ជាប់គ្នាដែលមានផលបូកស្មើ $25$។ តាងចំនួនទីមួយជា $x$ ចំនួនទីពីរគឺ $x + 1$ នាំឱ្យ $x + (x + 1) = 25 \\iff 2x = 24 \\implies x = 12$។`,
            formula: 'x + (x + 1) = 25 \\implies 2x = 24 \\implies x = 12',
            speak: `ឧទាហរណ៍ជាក់ស្តែងនៃការស្រាយចំណោទរកចំនួនជាប់គ្នា`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Polynomials & Factoring (Grade 8 - les-g8-01, les-g8-02)
    // ========================================================================
    else if (simType === 'polynomial_factoring') {
      const isLesG801 = lessonId === 'les-g8-01' || title.includes('ផលគុណពហុធា');
      if (isLesG801) {
        if (pIdx === 0) {
          // Point 1: សញ្ញាណឯកធា និងពហុធា
          this.currentSteps = [
            {
              badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ សញ្ញាណឯកធា និងពហុធា',
              tag: 'ដឺក្រេ និងការបូកដកពហុធា',
              caption: `ពហុធាគឺជាផលបូកនៃឯកធា។ ដើម្បីបូក ឬដកពហុធា គេត្រូវប្រមូលតួដែលមានអថេរ និងស្វ័យគុណដូចគ្នា (តួដូចគ្នា) រួចបូក ឬដកមេគុណ ៖ $ax^n + bx^n = (a+b)x^n$។`,
              formula: 'P(x) + Q(x) = \\sum (a_i + b_i)x^i',
              speak: `សញ្ញាណឯកធា ពហុធា និងការប្រមូលតួដូចគ្នា`
            },
            {
              badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ដឺក្រេនៃពហុធា',
              tag: 'ស្វ័យគុណខ្ពស់បំផុត',
              caption: `ដឺក្រេនៃពហុធាមួយអថេរ គឺជាស្វ័យគុណខ្ពស់បំផុតនៃអថេរដែលមានមេគុណខុសពីសូន្យ។ ឧទាហរណ៍ ៖ $P(x) = 5x^3 - 2x^2 + 7$ មានដឺក្រេ $3$។`,
              formula: '\deg(P) = \\max \{ i \mid a_i \\ne 0 \}',
              speak: `ដឺក្រេនៃពហុធាគឺជាស្វ័យគុណខ្ពស់បំផុត`
            }
          ];
        } else if (pIdx === 1) {
          // Point 2: ផលគុណពហុធា និងការលាត
          this.currentSteps = [
            {
              badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ ផលគុណពហុធានឹងពហុធា',
              tag: 'លក្ខណៈចែកចាយនៃការគុណ',
              caption: `ដើម្បីគុណពហុធានឹងពហុធា គេត្រូវយកគ្រប់តួនៃពហុធាទីមួយគុណនឹងគ្រប់តួនៃពហុធាទីពីរ រួចបង្រួមតួដូចគ្នា ៖ $(a + b)(c + d) = ac + ad + bc + bd$។`,
              formula: '(a + b)(c + d) = ac + ad + bc + bd',
              speak: `ការគុណពហុធានឹងពហុធាតាមលក្ខណៈចែកចាយ`
            },
            {
              badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ការលាតកន្សោមពិជគណិត',
              tag: 'ការបង្រួមកន្សោមលាត',
              caption: `ឧទាហរណ៍ ៖ $(2x + 3)(x - 4) = 2x^2 - 8x + 3x - 12 = 2x^2 - 5x - 12$។ ត្រូវប្រយ័ត្នសញ្ញាដកពេលគុណ!`,
              formula: '(2x + 3)(x - 4) = 2x^2 - 5x - 12',
              speak: `ជំហានបង្រួមកន្សោមលាតឱ្យសាមញ្ញបំផុត`
            }
          ];
        } else {
          // Point 3: រូបមន្តស្វ័យគុណ និងសមភាពគួរកត់សម្គាល់
          this.currentSteps = [
            {
              badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ការស្រាយបញ្ជាក់រូបមន្តគូបតាមធរណីមាត្រ 3D',
              tag: 'មាឌនៃគូបធំ (a + b)³',
              caption: `រូបមន្ត $(a+b)^3$ តំណាងឱ្យមាឌនៃគូបធំមួយដែលមានរង្វាស់ជ្រុង $(a+b)$។ គូបនេះត្រូវបានបំបែកជា ៨ ដុំតូចៗ ៖ គូបធំ $a^3$, បន្ទះក្តារ ៣ ដុំ $a^2b$, របារទ្រវែង ៣ ដុំ $ab^2$, និងគូបតូច $b^3$។`,
              formula: '(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3',
              speak: `ការស្រាយបញ្ជាក់រូបមន្តស្វ័យគុណតាមមាឌគូប 3D`
            },
            {
              badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ការេនៃទ្វេធា (a ± b)²',
              tag: 'រូបមន្តការេនៃទ្វេធា',
              caption: `ការេនៃផលបូក ៖ $(a + b)^2 = a^2 + 2ab + b^2$។ ការេនៃផលដក ៖ $(a - b)^2 = a^2 - 2ab + b^2$។ ក្នុងរូបធរណីមាត្រ តំណាងឱ្យផ្ទៃក្រឡាការេធំ។`,
              formula: '(a \\pm b)^2 = a^2 \\pm 2ab + b^2',
              speak: `រូបមន្តការេនៃផលបូកនិងការេនៃផលដកពីរតួ`
            }
          ];
        }
      } else {
        // les-g8-02: ការដាក់ជាផលគុណកត្តា
        if (pIdx === 0) {
          // Point 1: វិធីទាញកត្តារួម និងវិធីផ្តុំតួ
          this.currentSteps = [
            {
              badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ ការទាញកត្តារួម',
              tag: 'កត្តាពិជគណិតរួម',
              caption: `ការទាញកត្តារួម គឺជាការបំប្លែងផលបូកទៅជាផលគុណ ៖ $AB + AC = A(B + C)$។ កត្តារួម $A$ អាចជាចំនួនលេខ ឬអថេរ ឬកន្សោមវង់ក្រចក។`,
              formula: 'AB + AC = A(B + C), \\quad 6x^2 + 9x = 3x(2x + 3)',
              speak: `វិធីសាស្ត្រដាក់ជាផលគុណកត្តាដោយទាញកត្តារួម`
            },
            {
              badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ វិធីផ្តុំតួជាគូ',
              tag: 'ការទាញកត្តារួមពីរដំណាក់កាល',
              caption: `កាលណាពហុធាមាន ៤ តួដែលគ្មានកត្តារួមទាំងអស់ គេផ្តុំជាពីរគូ ៖ $ax + ay + bx + by = a(x + y) + b(x + y) = (x + y)(a + b)$។`,
              formula: 'ax + ay + bx + by = (x + y)(a + b)',
              speak: `វិធីផ្តុំតួជាគូដើម្បីទាញកត្តារួមពីរដំណាក់កាល`
            }
          ];
        } else if (pIdx === 1) {
          // Point 2: វិធីប្រើរូបមន្តសមភាពគួរកត់សម្គាល់
          this.currentSteps = [
            {
              badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ ផលដកពីរការេ a² - b²',
              tag: 'រូបមន្តផលគុណកត្តាសំខាន់',
              caption: `រូបមន្តផលដកពីរការេ ៖ $a^2 - b^2 = (a - b)(a + b)$។ ឧទាហរណ៍ ៖ $4x^2 - 25 = (2x)^2 - 5^2 = (2x - 5)(2x + 5)$។`,
              formula: 'a^2 - b^2 = (a - b)(a + b)',
              speak: `រូបមន្តផលដកពីរការេអាការេដកបេការេ`
            },
            {
              badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ត្រីធាការេពេញលេញ & ផលបូកដកពីរគូប',
              tag: 'រូបមន្តស្វ័យគុណទី ៣',
              caption: `ត្រីធាការេ ៖ $a^2 \\pm 2ab + b^2 = (a \\pm b)^2$។ ផលបូកនិងផលដកពីរគូប ៖ $a^3 \\pm b^3 = (a \\pm b)(a^2 \mp ab + b^2)$។`,
              formula: 'a^3 \\pm b^3 = (a \\pm b)(a^2 \mp ab + b^2)',
              speak: `រូបមន្តត្រីធាការេពេញលេញនិងផលបូកដកពីរគូប`
            }
          ];
        } else {
          // Point 3: វិធីបំបែកតួកណ្តាល និងសមីការផលគុណ
          this.currentSteps = [
            {
              badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ វិធីបំបែកតួកណ្តាលនៃត្រីធា x² + bx + c',
              tag: 'រកពីរចំនួន p និង q',
              caption: `ដើម្បីដាក់ $x^2 + bx + c$ ជាផលគុណកត្តា គេត្រូវរកពីរចំនួន $p$ និង $q$ ដែល $p + q = b$ និង $p \cdot q = c$ នាំឱ្យ $x^2 + bx + c = (x + p)(x + q)$។`,
              formula: 'x^2 + (p+q)x + pq = (x + p)(x + q)',
              speak: `វិធីបំបែកតួកណ្តាលនៃត្រីធាដឺក្រេទីពីរ`
            },
            {
              badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ការដោះស្រាយសមីការផលគុណ A × B = 0',
              tag: 'លក្ខណៈផលគុណស្មើសូន្យ',
              caption: `ផលគុណនៃពីរកត្តាស្មើ $0$ លុះត្រាតែកត្តាណាមួយស្មើ $0$ ៖ $A \cdot B = 0 \\iff A = 0 \\lor B = 0$។ នេះជាមូលដ្ឋានគ្រឹះដោះស្រាយសមីការដឺក្រេទី២។`,
              formula: 'A \cdot B = 0 \\iff A = 0 \\quad \\lor \\quad B = 0',
              speak: `ការដោះស្រាយសមីការផលគុណស្មើសូន្យ`
            }
          ];
        }
      }
    }
    // ========================================================================
    // Case: Pythagorean Theorem (Grade 8 - les-g8-03)
    // ========================================================================
    else if (simType === 'pythagoras_theorem') {
      if (pIdx === 0) {
        // Point 1: ទ្រឹស្តីបទពីតាករក្នុងត្រីកោណកែង
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ ទ្រឹស្តីបទពីតាករក្នុងត្រីកោណកែង',
            tag: 'ទំនាក់ទំនងផ្ទៃក្រឡាការេលើជ្រុងទាំង ៣',
            caption: `ក្នុងត្រីកោណកែង ការេនៃប្រវែងអ៊ីប៉ូតេនុស $c^2$ ស្មើនឹងផលបូកការេនៃប្រវែងជ្រុងជាប់មុំកែងទាំងពីរ ៖ $a^2 + b^2 = c^2$។ ក្នុងគំរូ 3D ផ្ទៃការេ $3\\times 3=9$ បូកនឹង $4\\times 4=16$ ស្មើនឹងការេអ៊ីប៉ូតេនុស $5\\times 5=25$ យ៉ាងជាក់ស្តែង!`,
            formula: 'a^2 + b^2 = c^2 \\iff c = \\sqrt{a^2 + b^2}',
            speak: `ទ្រឹស្តីបទពីតាករ ការេអ៊ីប៉ូតេនុសស្មើផលបូកការេជ្រុងជាប់មុំកែង`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ការគណនាប្រវែងជ្រុងមិនស្គាល់',
            tag: 'រូបមន្តទាញរក a, b, c',
            caption: `ទាញរកប្រវែងអ៊ីប៉ូតេនុស ៖ $c = \\sqrt{a^2 + b^2}$។ ទាញរកប្រវែងជ្រុងជាប់មុំកែង ៖ $a = \\sqrt{c^2 - b^2}$ និង $b = \\sqrt{c^2 - a^2}$។`,
            formula: 'a = \\sqrt{c^2 - b^2}, \\quad b = \\sqrt{c^2 - a^2}',
            speak: `រូបមន្តទាញរកប្រវែងជ្រុងជាប់មុំកែងនិងអ៊ីប៉ូតេនុស`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ទ្រឹស្តីបទច្រាស និងត្រីកោណពិសេស
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ ទ្រឹស្តីបទច្រាសពីតាករ',
            tag: 'ការបញ្ជាក់ប្រភេទត្រីកោណ',
            caption: `បើក្នុងត្រីកោណមួយមាន $c^2 = a^2 + b^2$ នោះត្រីកោណនោះគឺជាត្រីកោណកែងត្រង់កំពូលឈមនឹងជ្រុង $c$។ បើ $c^2 > a^2+b^2$ ជាត្រីកោណទាល; បើ $c^2 < a^2+b^2$ ជាត្រីកោណស្រួច។`,
            formula: 'c^2 = a^2 + b^2 \\implies \\Delta ABC \\text{ កែងត្រង់ } C',
            speak: `ទ្រឹស្តីបទច្រាសពីតាករដើម្បីបញ្ជាក់ត្រីកោណកែង`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ត្រីកោណកែងពិសេស 30°-60° និង 45°',
            tag: 'សមាមាត្រប្រវែងជ្រុង',
            caption: `ត្រីកោណកែងមានមុំ $30^\circ$ ៖ ជ្រុងឈមមុំ $30^\circ$ ស្មើនឹងពាក់កណ្តាលអ៊ីប៉ូតេនុស ($a = c/2$)។ ត្រីកោណកែងសមបាត ($45^\circ$) ៖ អ៊ីប៉ូតេនុស $c = a\\sqrt{2}$។`,
            formula: 'a = \\dfrac{c}{2} \\quad (\\text{មុំ } 30^\circ), \\quad c = a\\sqrt{2} \\quad (\\text{មុំ } 45^\circ)',
            speak: `លក្ខណៈជ្រុងនៃត្រីកោណកែងពិសេស ៣០ ដឺក្រេ និង ៤៥ ដឺក្រេ`
          }
        ];
      } else {
        // Point 3: ការអនុវត្ត និងចំណោទធរណីមាត្រ
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ការអនុវត្តជាក់ស្តែងនៃពីតាករ',
            tag: 'ចំណោទជណ្តើរ និងចម្ងាយធ្វើដំណើរ',
            caption: `ក្នុងការអនុវត្តជាក់ស្តែង ជញ្ជាំងនិងដីកែងគ្នា ($90^\circ$)។ ប្រវែងជណ្តើរជាអ៊ីប៉ូតេនុស $L$ ចម្ងាយជើងជណ្តើរពីជញ្ជាំងជា $d$ និងកម្ពស់ជា $h$ នាំឱ្យ $L^2 = d^2 + h^2$។`,
            formula: 'L^2 = d^2 + h^2 \\iff h = \\sqrt{L^2 - d^2}',
            speak: `ការអនុវត្តទ្រឹស្តីបទពីតាករដោះស្រាយចំណោទជណ្តើរនិងចម្ងាយ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ អង្កត់ទ្រូងចតុកោណកែង និងការេ',
            tag: 'រូបមន្តគណនាអង្កត់ទ្រូង',
            caption: `ចតុកោណកែងបណ្តោយ $L$ ទទឹង $W$ មានអង្កត់ទ្រូង $d = \\sqrt{L^2 + W^2}$។ ការេជ្រុង $a$ មានអង្កត់ទ្រូង $d = a\\sqrt{2}$។`,
            formula: 'd = \\sqrt{L^2 + W^2}, \\quad d_{\\text{ការេ}} = a\\sqrt{2}',
            speak: `រូបមន្តគណនាអង្កត់ទ្រូងចតុកោណកែងនិងការេ`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Quadratic Equation & Delta (Grade 9 - les-g9-01)
    // ========================================================================
    else if (simType === 'quadratic_delta') {
      if (pIdx === 0) {
        // Point 1: ទម្រង់ទូទៅ និងដីសគ្រីមីណង់ Delta
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ ដីសគ្រីមីណង់ Delta = b² - 4ac',
            tag: 'លក្ខខណ្ឌកំណត់ចំនួនឫសនៃសមីការ',
            caption: `ចំនួនឫសនៃសមីការដឺក្រេទី២ $ax^2 + bx + c = 0$ អាស្រ័យលើតម្លៃ $\\Delta$ ៖ បើ $\\Delta > 0$ មានឫសពីរផ្សេងគ្នា; បើ $\\Delta = 0$ មានឫសឌុប; បើ $\\Delta < 0$ គ្មានឫសពិត (ប៉ារ៉ាបូលមិនកាត់អ័ក្សដេក)។`,
            formula: '\\Delta = b^2 - 4ac, \\quad x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}',
            speak: `ការដោះស្រាយសមីការដឺក្រេទី២តាមដីសគ្រីមីណង់ដេលតា`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ទីតាំងប្រសព្វរវាងប៉ារ៉ាបូល និងអ័ក្ស x',
            tag: 'អត្ថន័យធរណីមាត្រនៃឫស',
            caption: `ឫសនៃសមីការ គឺជាអាប់ស៊ីសនៃចំណុចប្រសព្វរវាងក្រាបប៉ារ៉ាបូល $y = ax^2 + bx + c$ ជាមួយនឹងបន្ទាត់អ័ក្សដេក $y = 0$។`,
            formula: 'y = 0 \\implies ax^2 + bx + c = 0',
            speak: `ឫសនៃសមីការគឺជាចំណុចប្រសព្វរវាងក្រាបនិងអ័ក្សដេក`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: ដីសគ្រីមីណង់សម្រួល Delta' និងករណីពិសេស
        this.currentSteps = [
          {
            badge: `ចំណុច ២ • ជំហាន ១/២ ៖ ដីសគ្រីមីណង់សម្រួល Delta' = b'² - ac`,
            tag: 'ការគណនារហ័សពេល b ជាចំនួនគូ',
            caption: `កាលណា $b = 2b'$ (មេគុណ $b$ ជាចំនួនគូ) គេប្រើ $\\Delta' = b'^2 - ac$។ ឬសសមីការគឺ $x = \\dfrac{-b' \\pm \\sqrt{\\Delta'}}{a}$ ដែលជួយកាត់បន្ថយការគណនាយ៉ាងច្រើន។`,
            formula: "\\Delta' = b'^2 - ac, \\quad x_{1,2} = \\dfrac{-b' \\pm \\sqrt{\\Delta'}}{a}",
            speak: `រូបមន្តដីសគ្រីមីណង់សម្រួលដេលតាប្រ៊ីម`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ករណីពិសេស a ± b + c = 0',
            tag: 'គណនារហ័សដោយមិនបាច់ប្រើដេលតា',
            caption: `(១) បើ $a + b + c = 0$ នោះសមីការមានឬសពីរគឺ $x_1 = 1, x_2 = \\dfrac{c}{a}$។ (២) បើ $a - b + c = 0$ នោះសមីការមានឬសពីរគឺ $x_1 = -1, x_2 = -\\dfrac{c}{a}$។`,
            formula: 'a + b + c = 0 \\implies x_1 = 1, \ x_2 = \\dfrac{c}{a}; \\quad a - b + c = 0 \\implies x_1 = -1, \ x_2 = -\\dfrac{c}{a}',
            speak: `ករណីពិសេសអាបូកបេបូកសេស្មើសូន្យនិងអាដកបេបូកសេស្មើសូន្យ`
          }
        ];
      } else {
        // Point 3: ទ្រឹស្តីបទវ្យែត (Viète) និងការបង្កើតសមីការ
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ទ្រឹស្តីបទវ្យែត (Viète)',
            tag: 'ទំនាក់ទំនងផលបូក និងផលគុណឬស',
            caption: `បើ $x_1, x_2$ ជាឬសនៃសមីការ $ax^2 + bx + c = 0$ នោះ ៖ ផលបូក $S = x_1 + x_2 = -\\dfrac{b}{a}$ និងផលគុណ $P = x_1 x_2 = \\dfrac{c}{a}$។`,
            formula: 'S = x_1 + x_2 = -\\dfrac{b}{a}, \\quad P = x_1 x_2 = \\dfrac{c}{a}',
            speak: `ទ្រឹស្តីបទវ្យែត ផលបូកនិងផលគុណនៃឬស`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ការបង្កើតសមីការ និងកន្សោមឆ្លាស់',
            tag: 'សមីការទម្រង់ X² - SX + P = 0',
            caption: `បើស្គាល់ផលបូក $S$ និងផលគុណ $P$ នោះ $u, v$ ជាឬសនៃសមីការ $X^2 - SX + P = 0$។ រូបមន្តកន្សោមឆ្លាស់ ៖ $x_1^2 + x_2^2 = S^2 - 2P$។`,
            formula: 'X^2 - SX + P = 0, \\quad x_1^2 + x_2^2 = S^2 - 2P',
            speak: `ការបង្កើតសមីការដឺក្រេទីពីរពីផលបូកនិងផលគុណ`
          }
        ];
      }
    }
    // ========================================================================
    // Case: System of 2 Equations (Grade 9 - les-g9-02)
    // ========================================================================
    else if (simType === 'linear_system_2vars') {
      if (pIdx === 0) {
        // Point 1: វិធីជំនួស និងវិធីបូកបំបាត់
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ វិធីសាស្ត្រជំនួស និងវិធីបូកបំបាត់',
            tag: 'ដំណោះស្រាយពិជគណិត',
            caption: `(១) វិធីជំនួស ៖ ទាញរកអថេរមួយពីសមីការមួយ រួចជំនួសចូលសមីការមួយទៀត។ (២) វិធីបូកបំបាត់ ៖ គុណមេគុណឱ្យស្មើគ្នា ឬផ្ទុយគ្នា រួចបូក ឬដកសមីការទាំងពីរដើម្បីបំបាត់អថេរមួយ។`,
            formula: '\\begin{cases} a_1x + b_1y = c_1 \\ a_2x + b_2y = c_2 \\end{cases}',
            speak: `វិធីសាស្ត្រជំនួសនិងវិធីបូកបំបាត់ដោះស្រាយប្រព័ន្ធសមីការ`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ការផ្ទៀងផ្ទាត់គូចម្លើយ (x₀, y₀)',
            tag: 'ភាពត្រឹមត្រូវនៃចម្លើយ',
            caption: `គូចម្លើយ $(x_0, y_0)$ ត្រូវតែផ្ទៀងផ្ទាត់សមីការទាំងពីរក្នុងពេលតែមួយ។ ជំនួសតម្លៃទាំងពីរចូលសមីការនីមួយៗ បើផ្ទៀងផ្ទាត់ពិតទាំងសងខាងទើបជាចម្លើយត្រឹមត្រូវ។`,
            formula: 'a_1x_0 + b_1y_0 = c_1 \\quad \\land \\quad a_2x_0 + b_2y_0 = c_2',
            speak: `ការផ្ទៀងផ្ទាត់គូចម្លើយក្នុងសមីការទាំងពីរ`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: វិធីសាស្ត្រក្រាហ្វិក 3D & ទីតាំងបន្ទាត់
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ វិធីសាស្ត្រក្រាហ្វិក 3D',
            tag: 'ចំណុចប្រសព្វនៃបន្ទាត់ពីរក្នុងប្លង់',
            caption: `សមីការនីមួយៗតំណាងឱ្យបន្ទាត់មួយក្នុងប្លង់កូអរដោនេ។ ចម្លើយរួម $(x_0, y_0)$ នៃប្រព័ន្ធ គឺជាកូអរដោនេនៃចំណុចប្រសព្វរវាងបន្ទាត់ទាំងពីរ $L_1$ និង $L_2$។`,
            formula: 'L_1 \\cap L_2 = \{I(x_0, y_0)\}',
            speak: `ចំណុចប្រសព្វនៃបន្ទាត់ទាំងពីរជាចម្លើយនៃប្រព័ន្ធសមីការ`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ ករណីចម្លើយទាំង ៣ នៃប្រព័ន្ធ',
            tag: 'កាត់គ្នា ស្របគ្នា និងត្រួតស៊ីគ្នា',
            caption: `(១) បើបន្ទាត់កាត់គ្នា ៖ មានចម្លើយតែមួយគត់។ (២) បើបន្ទាត់ស្របគ្នា ៖ គ្មានចម្លើយ។ (៣) បើបន្ទាត់ត្រួតស៊ីគ្នា ៖ មានចម្លើយរាប់មិនអស់។`,
            formula: '\\dfrac{a_1}{a_2} \\ne \\dfrac{b_1}{b_2} \\implies \\text{ចម្លើយមួយ}; \\quad \\dfrac{a_1}{a_2} = \\dfrac{b_1}{b_2} \\ne \\dfrac{c_1}{c_2} \\implies \\text{គ្មានចម្លើយ}',
            speak: `លក្ខខណ្ឌបន្ទាត់កាត់គ្នា ស្របគ្នា និងត្រួតស៊ីគ្នា`
          }
        ];
      } else {
        // Point 3: ចំណោទប្រព័ន្ធសមីការវិញ្ញាសាឌីប្លូម
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ ការដោះស្រាយចំណោទតាមប្រព័ន្ធសមីការ',
            tag: 'វិញ្ញាសាប្រឡងឌីប្លូម',
            caption: `ជំហានដោះស្រាយ ៖ (១) តាងអថេរពីរ $x$ និង $y$ ព្រមទាំងលក្ខខណ្ឌ។ (២) បង្កើតប្រព័ន្ធសមីការពីរតាមបម្រាប់។ (៣) ដោះស្រាយប្រព័ន្ធរក $x, y$។ (៤) ផ្ទៀងផ្ទាត់ និងសន្និដ្ឋាន។`,
            formula: '\\text{បម្រាប់ទី ១} \\implies a_1x + b_1y = c_1; \\quad \\text{បម្រាប់ទី ២} \\implies a_2x + b_2y = c_2',
            speak: `ជំហានដោះស្រាយចំណោទតាមប្រព័ន្ធសមីការវិញ្ញាសាឌីប្លូម`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ ប្រភេទចំណោទញឹកញាប់',
            tag: 'ចំណោទលុយ ទំនិញ និងធរណីមាត្រ',
            caption: `ក្នុងវិញ្ញាសាឌីប្លូម ចំណោទប្រព័ន្ធសមីការច្រើនចេញទាក់ទងនឹងការទិញទំនិញពីរមុខ ចំណោទល្បឿនចរាចរណ៍ទៅមក និងចំណោទវិមាត្រចតុកោណកែង។`,
            formula: '\\begin{cases} x + y = \\text{សរុប} \\ p_1x + p_2y = \\text{ទឹកប្រាក់សរុប} \\end{cases}',
            speak: `ចំណោទញឹកញាប់ក្នុងការប្រឡងសញ្ញាបត្រឌីប្លូម`
          }
        ];
      }
    }
    // ========================================================================
    // Case: Circle Angles (Grade 9 - les-g9-03)
    // ========================================================================
    else if (simType === 'circle_inscribed_angle') {
      if (pIdx === 0) {
        // Point 1: មុំផ្ចិត និងធ្នូរង្វង់
        this.currentSteps = [
          {
            badge: 'ចំណុច ១ • ជំហាន ១/២ ៖ មុំផ្ចិត និងធ្នូរង្វង់',
            tag: 'និយមន័យ និងរង្វាស់ដឺក្រេ',
            caption: `មុំផ្ចិតគឺជាមុំដែលមានកំពូលត្រង់ផ្ចិតនៃរង្វង់។ រង្វាស់នៃមុំផ្ចិតស្មើនឹងរង្វាស់ដឺក្រេនៃធ្នូស្ទាក់ ៖ $\\angle AOB = \\text{រង្វាស់ } \\wideparen{AB}$។`,
            formula: '\\angle AOB = \\text{រង្វាស់ } \\wideparen{AB}',
            speak: `រង្វាស់មុំផ្ចិតស្មើនឹងរង្វាស់នៃធ្នូស្ទាក់`
          },
          {
            badge: 'ចំណុច ១ • ជំហាន ២/២ ៖ ប្រវែងធ្នូ និងផ្ទៃចម្រៀក',
            tag: 'រូបមន្តធរណីមាត្រ',
            caption: `ប្រវែងធ្នូ ៖ $l = \\dfrac{\\pi R n^\circ}{180^\circ}$។ ផ្ទៃចម្រៀករង្វង់ ៖ $S = \\dfrac{\\pi R^2 n^\circ}{360^\circ}$ (ដោយ $n^\circ$ ជារង្វាស់មុំផ្ចិត)។`,
            formula: 'l = \\dfrac{\\pi R n^\circ}{180^\circ}, \\quad S = \\dfrac{\\pi R^2 n^\circ}{360^\circ}',
            speak: `រូបមន្តគណនាប្រវែងធ្នូនិងផ្ទៃចម្រៀករង្វង់`
          }
        ];
      } else if (pIdx === 1) {
        // Point 2: មុំចារឹកក្នុង និងទំនាក់ទំនងមុំផ្ចិត
        this.currentSteps = [
          {
            badge: 'ចំណុច ២ • ជំហាន ១/២ ៖ មុំចារឹកក្នុងរង្វង់ និងមុំផ្ចិត',
            tag: 'ទ្រឹស្តីបទមុំកាត់ធ្នូតែមួយ',
            caption: `ក្នុងរង្វង់មួយ រង្វាស់នៃ <strong>មុំចារឹកក្នុង</strong> ស្មើនឹងពាក់កណ្តាលនៃរង្វាស់ <strong>មុំផ្ចិត</strong> ដែលកាត់ធ្នូតែមួយ ៖ $\\angle AMB = \\dfrac{1}{2} \\angle AOB$។`,
            formula: '\\angle AMB = \\dfrac{1}{2} \\angle AOB = \\dfrac{1}{2} \\text{រង្វាស់ធ្នូ } \\widehat{AB}',
            speak: `មុំចារឹកក្នុងរង្វង់ស្មើនឹងកន្លះមុំផ្ចិតដែលកាត់ធ្នូជាមួយគ្នា`
          },
          {
            badge: 'ចំណុច ២ • ជំហាន ២/២ ៖ មុំចារឹកក្នុងស្ទាក់ធ្នូដូចគ្នា',
            tag: 'ភាពស្មើគ្នានៃមុំចារឹកក្នុង',
            caption: `គ្រប់មុំចារឹកក្នុងរង្វង់ទាំងអស់ដែលស្ទាក់ធ្នូតែមួយ ឬស្ទាក់ធ្នូស្មើគ្នា គឺមានរង្វាស់ស្មើគ្នាជានិច្ច ៖ $\\angle AMB = \\angle ANB$។`,
            formula: '\\angle AMB = \\angle ANB = \\dfrac{1}{2} \\text{រង្វាស់ } \\wideparen{AB}',
            speak: `គ្រប់មុំចារឹកក្នុងស្ទាក់ធ្នូតែមួយមានរង្វាស់ស្មើគ្នា`
          }
        ];
      } else {
        // Point 3: មុំចារឹកក្នុងកាត់កន្លះរង្វង់ និងអង្កត់ធ្នូ
        this.currentSteps = [
          {
            badge: 'ចំណុច ៣ • ជំហាន ១/២ ៖ មុំចារឹកក្នុងកាត់កន្លះរង្វង់',
            tag: 'លក្ខណៈមុំកែង 90°',
            caption: `មុំចារឹកក្នុងរង្វង់ណាដែលស្ទាក់អង្កត់ផ្ចិត (ស្ទាក់កន្លះរង្វង់) គឺជាមុំកែង ($90^\circ$) ជានិច្ច! ដូច្នេះ ត្រីកោណចារឹកក្នុងកន្លះរង្វង់គឺជាត្រីកោណកែង។`,
            formula: '\\angle AMB = 90^\circ \\quad (\\text{បើ } AB \\text{ ជាអង្កត់ផ្ចិត})',
            speak: `មុំចារឹកក្នុងកាត់កន្លះរង្វង់គឺជាមុំកែងកៅសិបដឺក្រេ`
          },
          {
            badge: 'ចំណុច ៣ • ជំហាន ២/២ ៖ មុំបង្កើតដោយបន្ទាត់ប៉ះ និងអង្កត់ធ្នូ',
            tag: 'លក្ខណៈបន្ទាត់ប៉ះ',
            caption: `រង្វាស់នៃមុំបង្កើតដោយបន្ទាត់ប៉ះ និងអង្កត់ធ្នូ ស្មើនឹងពាក់កណ្តាលរង្វាស់នៃធ្នូស្ទាក់ ៖ $\\angle TAB = \\dfrac{1}{2} \\text{រង្វាស់ } \\wideparen{AB} = \\angle AMB$។`,
            formula: '\\angle TAB = \\dfrac{1}{2} \\text{រង្វាស់ } \\wideparen{AB} = \\angle AMB',
            speak: `មុំបង្កើតដោយបន្ទាត់ប៉ះនិងអង្កត់ធ្នូស្មើនឹងមុំចារឹកក្នុងស្ទាក់ធ្នូនោះ`
          }
        ];
      }
    }
    else if (simType === 'parabola_study') {
      this.currentSteps = [
        {
          badge: 'ជំហាន ១/២ ៖ សិក្សាអថេរភាព និងទម្រង់កំពូល',
          tag: 'ទម្រង់ស្តង់ដា y = a(x - h)² + k',
          caption: `ប៉ារ៉ាបូលមានកំពូលត្រង់ $V(h, k)$ និងអ័ក្សឆ្លុះ $x = h$។ បើ $a > 0$ ប៉ារ៉ាបូលផ្ងារឡើងលើ (មានអប្បបរមា $k$); បើ $a < 0$ ប៉ារ៉ាបូលកោបចុះក្រោម (មានអតិបរមា $k$)។`,
          formula: 'y = a(x - h)^2 + k, \\quad V(h, k), \\quad \\text{អ័ក្សឆ្លុះ } x = h',
          speak: `សិក្សាអថេរភាព និងទម្រង់កំពូលនៃប៉ារ៉ាបូល`
        },
        {
          badge: 'ជំហាន ២/២ ៖ ការសង់ក្រាបប៉ារ៉ាបូល',
          tag: 'តារាងតម្លៃលេខ និងចំណុចសំខាន់ៗ',
          caption: `ដើម្បីសង់ក្រាប គេកំណត់ ៖ កំពូល $V$, ចំណុចប្រសព្វនឹងអ័ក្សឈរ $(0, c)$, ចំណុចប្រសព្វនឹងអ័ក្សដេក (បើមាន), និងចំណុចស៊ីមេទ្រីធៀបនឹងអ័ក្សឆ្លុះ។`,
          formula: 'x = h \\pm 1 \\implies y = a + k',
          speak: `ជំហានទីពីរ ជំហាននៃការសង់ក្រាបប៉ារ៉ាបូល`
        }
      ];
    }
    // ========================================================================
    // Case: Mathematical Induction (Grade 11 - les-g11a-1-3)
    // ========================================================================
    else if (simType === 'mathematical_induction') {
      this.currentSteps = [
        {
          badge: 'ជំហាន ១/២ ៖ គោលការណ៍គ្រឹះនៃវិធានអនុមានរួម (Domino Effect)',
          tag: 'ជំហានមូលដ្ឋាន & ជំហានអនុមានរួម',
          caption: `វិធានអនុមានរួមគណិតវិទ្យាប្រៀបដូចជាដូមីណូដែលដួលបន្តបន្ទាប់គ្នា ៖ (១) <strong>ជំហានមូលដ្ឋាន</strong> ៖ ផ្ទៀងផ្ទាត់ថា $P(1)$ ពិត (ដូមីណូទី ១ ដួល)។ (២) <strong>ជំហានអនុមានរួម</strong> ៖ ឧបមាថា $P(k)$ ពិត រួចស្រាយបញ្ជាក់ថា $P(k+1)$ ក៏ពិត (ដូមីណូទី $k$ ដួលរុញឱ្យដូមីណូ $k+1$ ដួលតាម)។`,
          formula: 'P(1) \\text{ ពិត } \\land [P(k) \\implies P(k+1)] \\implies \\forall n \\in \\mathbb{N}, P(n) \\text{ ពិត}',
          speak: `គោលការណ៍គ្រឹះនៃវិធានអនុមានរួមគណិតវិទ្យា ដូចដូមីណូដួលបន្តគ្នា`
        },
        {
          badge: 'ជំហាន ២/២ ៖ ការអនុវត្តក្នុងការស្រាយបញ្ជាក់សមភាព',
          tag: 'ផលបូកចំនួនគត់ធម្មជាតិ',
          caption: `ឧទាហរណ៍ ស្រាយបញ្ជាក់ថា $1 + 2 + 3 + \\dots + n = \\dfrac{n(n+1)}{2}$។ ពេលផ្ទៀងផ្ទាត់ $n=1$ ត្រឹមត្រូវ និង $n=k \\to k+1$ ត្រឹមត្រូវ នោះរូបមន្តពិតចំពោះគ្រប់ $n$ ទាំងអស់ដោយឥតសង្ស័យ។`,
          formula: '\\sum_{i=1}^n i = \\dfrac{n(n+1)}{2}',
          speak: `ជំហានទីពីរ ការអនុវត្តវិធានអនុមានរួមក្នុងការស្រាយបញ្ជាក់សមភាព`
        }
      ];
    }

    // ========================================================================
    // Default Fallback
    // ========================================================================
    else {
      const topicText = currentPoint.topic || currentPoint.objective || pointTitle;
      this.currentSteps = [
        {
          badge: `ជំហាន ១/២ ៖ ${pointTitle}`,
          tag: 'ខ្លឹមសារគោលនៃចំណុចមេរៀន',
          caption: `ស្វែងយល់ពីនិយមន័យ និងទ្រឹស្តីបទគ្រឹះនៃ <strong>${pointTitle}</strong> (${topicText}) តាមគំរូ 3D Interactive Simulation។`,
          formula: '\\forall x \\in D, \\quad y = f(x)',
          speak: `សូមស្វាគមន៍មកកាន់ចលនា 3D ពន្យល់ចំណុច ${pointTitle}`
        },
        {
          badge: `ជំហាន ២/២ ៖ វិធីសាស្ត្រដោះស្រាយ`,
          tag: 'ការអនុវត្តរូបមន្ត',
          caption: `អនុវត្តវិធីសាស្ត្រ និងរូបមន្តគណិតវិទ្យាជាក់ស្តែង ដើម្បីដោះស្រាយលំហាត់កម្រិត ១ និងកម្រិត ២ ក្នុងសន្លឹកកិច្ចការ។`,
          formula: '\\Delta y = f(x + \\Delta x) - f(x)',
          speak: `ជំហានទីពីរ អនុវត្តរូបមន្ត និងវិធីសាស្ត្រគន្លឹះដើម្បីដោះស្រាយលំហាត់`
        }
      ];
    }

    const titleEl = document.getElementById('math-3d-point-title');
    if (titleEl) titleEl.textContent = pointTitle;
  }

  renderCurrentStep() {
    if (!this.currentSteps || this.currentSteps.length === 0) return;
    const step = this.currentSteps[this.activeStepIndex] || this.currentSteps[0];

    const badgeEl = document.getElementById('math-3d-step-badge');
    const tagEl = document.getElementById('math-3d-concept-tag');
    const captionEl = document.getElementById('math-3d-caption-text');
    const formulaEl = document.getElementById('math-3d-formula-box');

    if (badgeEl) badgeEl.textContent = step.badge;
    if (tagEl) tagEl.textContent = step.tag;
    if (captionEl) {
      captionEl.innerHTML = step.caption || '';
      if (window.renderMathInElement) {
        try {
          window.renderMathInElement(captionEl, {
            delimiters: [
              { left: '$$', right: '$$', display: true },
              { left: '$', right: '$', display: false }
            ],
            throwOnError: false
          });
        } catch (e) {}
      }
    }
    if (formulaEl) {
      if (step.formula) {
        if (window.katex) {
          try {
            window.katex.render(step.formula, formulaEl, {
              displayMode: true,
              throwOnError: false
            });
          } catch (e) {
            formulaEl.textContent = step.formula;
          }
        } else {
          formulaEl.textContent = step.formula;
        }
      } else {
        formulaEl.innerHTML = '';
      }
    }

    // Voice narration
    if (this.isVoiceEnabled && step.speak) {
      this.speakKhmer(step.speak);
    }
  }

  nextStep() {
    if (this.activeStepIndex < this.currentSteps.length - 1) {
      this.activeStepIndex++;
      this.renderCurrentStep();
    } else {
      this.activeStepIndex = 0;
      this.renderCurrentStep();
    }
  }

  prevStep() {
    if (this.activeStepIndex > 0) {
      this.activeStepIndex--;
      this.renderCurrentStep();
    }
  }

  togglePlay() {
    this.isPlaying = !this.isPlaying;
    const icon = document.getElementById('m3d-play-icon');
    const text = document.getElementById('m3d-play-text');
    if (icon) icon.textContent = this.isPlaying ? '🔄' : '⏸️';
    if (text) text.textContent = this.isPlaying ? 'បង្វិល 3D' : 'ផ្អាក';
  }

  toggleVoice() {
    // Disabled voice per user request
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  speakKhmer(text) {
    // Disabled voice per user request (រូប 3D មិនបាច់មានសំឡេងនិយាយទេ)
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  toggleFullscreen() {
    const stage = document.getElementById('math-3d-stage');
    if (!stage) return;
    if (!document.fullscreenElement) {
      if (stage.requestFullscreen) stage.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  }

  // --------------------------------------------------------------------------
  // Real-Time 3D Animation Render Loop
  // --------------------------------------------------------------------------
  animate() {
    this.animId = requestAnimationFrame(this.animate);

    if (this.isPlaying && this.animGroup) {
      const time = this.clock ? this.clock.getElapsedTime() : Date.now() * 0.001;

      // Auto-rotation when play is active (user requested: នៅពេល play គឺវាគ្រាន់តែវិល ឬបង្វិលដោយដៃ)
      if (this.isPlaying && !this.isDragging) {
        this.cameraRotation.theta += 0.0055;
        this.updateCameraPosition();
      }

      const p = this.simParams;

      // 0. Probability Experiment Live Physics & Animation
      if (p.mode === 'probability_experiment') {
        this.animateProbabilityLab(time);
      }
      // New Lab: Number Line Traveler Hop
      else if (p.mode === 'number_line' && p.traveler) {
        const cycle = (time * 1.5) % 2;
        const progress = Math.min(1, cycle);
        const curX = p.startX + (p.endX - p.startX) * progress;
        const hopY = Math.sin(progress * Math.PI) * 1.2 + 0.4;
        p.traveler.position.set(curX, hopY, 0);
      }
      // New Lab: Fractions Gentle Slice Breathing
      else if (p.mode === 'fractions' && p.wedges) {
        const floatY = 0.35 + Math.sin(time * 2) * 0.08;
        p.wedges.forEach((w, idx) => {
          if (idx < p.N) w.position.y = floatY;
        });
      }
      // New Lab: Decimals Grid Hundredths Pulse & Dot Float
      else if (p.mode === 'decimals_grid') {
        if (p.dotMesh) {
          p.dotMesh.position.y = 1.8 + Math.sin(time * 3) * 0.12;
        }
        if (p.pulsingHundredths && p.pulsingHundredths.length > 0) {
          const glow = 0.5 + Math.sin(time * 4) * 0.25;
          p.pulsingHundredths.forEach(tile => {
            if (tile.material) tile.material.emissiveIntensity = glow;
          });
        }
      }
      // New Lab: Percentage Radial Needle Wobble & Product Hover
      else if (p.mode === 'percentage_cube') {
        if (p.productGroup) {
          p.productGroup.position.y = 0.8 + Math.sin(time * 2) * 0.08;
        }
      }
      // New Lab: Balance Scale Equilibrium Wobble & Physics Lerp
      else if (p.mode === 'balance_scale' && p.beamGroup) {
        const wobble = p.isBalanced ? Math.sin(time * 3) * 0.012 : 0;
        const targetRot = p.targetTilt + wobble;
        p.beamGroup.rotation.z = THREE.MathUtils.lerp(p.beamGroup.rotation.z, targetRot, 0.12);
        if (p.leftPanGroup) p.leftPanGroup.rotation.z = -p.beamGroup.rotation.z;
        if (p.rightPanGroup) p.rightPanGroup.rotation.z = -p.beamGroup.rotation.z;
      }
      // New Lab: Rational Numbers Beacon Float
      else if (p.mode === 'rational_numbers' && p.pinGroup) {
        const floatY = Math.sin(time * 2.5) * 0.05;
        p.pinGroup.position.y = floatY;
      }
      // New Lab: Polynomial Volume Expansion
      else if (p.mode === 'polynomial_volume' && p.blocks) {
        const pulse = 1.0 + Math.sin(time * 1.5) * 0.05;
        p.blocks.forEach(b => {
          b.mesh.position.set(
            b.basePos[0] * pulse,
            b.basePos[1],
            b.basePos[2] * pulse
          );
        });
      }
      // New Lab: Mathematical Induction Domino Cascade
      else if (p.mode === 'induction' && p.dominoes) {
        if (p.isFalling) {
          p.time += 0.04;
          const activeDomino = Math.floor(p.time * 6.5);
          p.dominoes.forEach((d, idx) => {
            if (idx <= activeDomino) {
              d.targetAngle = Math.PI * 0.38;
            }
            if (d.currentAngle < d.targetAngle) {
              d.currentAngle += (d.targetAngle - d.currentAngle) * 0.28;
              d.group.rotation.z = -d.currentAngle;
            }
          });
        }
      }
      // 1. Arithmetic sequence animation
      else if (p.mode === 'arithmetic_sequence' && p.tracerBall) {
        const n = p.nTerms || 6;
        const u1 = p.u1 || 1.6;
        const d = p.d || 0.8;
        const cycle = (time * 1.2) % n;
        const idx = Math.floor(cycle);
        const frac = cycle - idx;
        const nextIdx = (idx + 1) % n;

        const x1 = (idx - (n - 1) / 2) * 1.35;
        const x2 = (nextIdx - (n - 1) / 2) * 1.35;
        const y1 = u1 + idx * d + 0.3;
        const y2 = u1 + nextIdx * d + 0.3;

        const curX = x1 + (x2 - x1) * frac;
        const curY = y1 + (y2 - y1) * frac + Math.sin(frac * Math.PI) * 0.8;
        p.tracerBall.position.set(curX, curY, 0);

        if (p.dualPillars) {
          const glow = 0.6 + Math.sin(time * 2) * 0.15;
          p.dualPillars.forEach(pill => {
            if (pill.material) pill.material.opacity = glow;
          });
        }
      }
      // 2. Geometric sequence animation
      else if (p.mode === 'geometric_sequence' && p.pillars) {
        const pulse = 1.0 + Math.sin(time * 2) * 0.04;
        p.pillars.forEach((pill) => {
          pill.scale.set(pulse, 1, pulse);
        });
      }
      // 3. Exponential / Log reflection animation
      else if (p.mode === 'exponential_log' && p.ptExp && p.ptLog) {
        const x = Math.sin(time * 0.8) * 2.0;
        const y = Math.exp(0.6 * x);
        p.ptExp.position.set(x, y, 0);
        p.ptLog.position.set(y, x, 0);
      }
      // 4. Trigonometry unit circle animation
      else if (p.mode === 'trigonometry' && p.radiusArrow) {
        const th = time * 0.9;
        const cosVal = Math.cos(th) * 3;
        const sinVal = Math.sin(th) * 3;
        p.radiusArrow.setDirection(new THREE.Vector3(cosVal, sinVal, 0).normalize());
        
        if (p.sinLine) {
          const pos = p.sinLine.geometry.attributes.position.array;
          pos[0] = cosVal; pos[1] = 0; pos[2] = 0;
          pos[3] = cosVal; pos[4] = sinVal; pos[5] = 0;
          p.sinLine.geometry.attributes.position.needsUpdate = true;
        }
        if (p.cosLine) {
          const pos = p.cosLine.geometry.attributes.position.array;
          pos[0] = 0; pos[1] = 0; pos[2] = 0;
          pos[3] = cosVal; pos[4] = 0; pos[5] = 0;
          p.cosLine.geometry.attributes.position.needsUpdate = true;
        }
      }
      // 5. Matrices deformation animation
      else if (p.mode === 'matrices' && p.transBox) {
        const shear = Math.sin(time * 0.8) * 0.5;
        p.transBox.rotation.y = shear * 0.5;
        p.transBox.scale.set(1 + shear * 0.3, 1, 1 - shear * 0.2);
      }
      // 6. Limits & Continuity animations
      else if (p.mode === 'continuity_point' && p.leftBall && p.rightBall) {
        const osc = (Math.sin(time * 1.5) + 1) / 2;
        const lx = -2.5 + osc * (p.targetX - -2.5);
        const ly = 0.15 * Math.pow(lx, 3) - 0.6 * lx + 1.2;
        p.leftBall.position.set(lx, ly, 0);

        const rx = 3.0 - osc * (3.0 - p.targetX);
        const ry = 0.15 * Math.pow(rx, 3) - 0.6 * rx + 1.2;
        p.rightBall.position.set(rx, ry, 0);

        if (p.targetPoint) {
          const scale = 1.0 + Math.sin(time * 3) * 0.12;
          p.targetPoint.scale.set(scale, scale, scale);
        }
      }
      else if (p.mode === 'continuity_interval' && p.inspectorBall) {
        const span = p.b - p.a;
        const norm = (Math.sin(time * 1.2) + 1) / 2;
        const x = p.a + norm * span;
        const y = Math.sin(x * 1.1) * 1.5 + 2.0;
        p.inspectorBall.position.set(x, y, 0);
      }
      else if (p.mode === 'continuity_ivt' && p.rootJewel) {
        p.rootJewel.rotation.y += 0.02;
        p.rootJewel.rotation.x += 0.01;
        if (p.ray && p.ray.material) {
          p.ray.material.opacity = 0.5 + Math.sin(time * 3) * 0.3;
        }
      }
      else if (p.mode === 'limit_converge' && p.leftBall && p.rightBall) {
        const osc = (Math.sin(time * 1.5) + 1) / 2;
        const lx = -2.5 + osc * (p.targetX - -2.5);
        const ly = Math.sin(lx * 1.2) * 1.8 + Math.cos(lx * 0.5) * 0.8;
        p.leftBall.position.set(lx, ly, 0);

        const rx = 3.5 - osc * (3.5 - p.targetX);
        const ry = Math.sin(rx * 1.2) * 1.8 + Math.cos(rx * 0.5) * 0.8;
        p.rightBall.position.set(rx, ry, 0);
      }
      else if (p.mode === 'limit_zero_over_zero' && p.plug) {
        const scale = 0.8 + Math.sin(time * 2) * 0.2;
        p.plug.scale.set(scale, scale, scale);
      }
      // 7. Derivatives tangent animations
      else if (p.mode === 'deriv_tangent' && p.tangentLine && p.contactPoint) {
        const x = Math.sin(time * 0.8) * 2.6;
        const y = 0.12 * x * (x * x - 6.25);
        const slope = 0.12 * (3 * x * x - 6.25);
        p.contactPoint.position.set(x, y, 0);
        p.tangentLine.position.set(x, y, 0);
        p.tangentLine.rotation.z = Math.atan(slope);
        if (p.tanArrow) {
          p.tanArrow.position.set(x, y, 0);
          const dir = new THREE.Vector3(1, slope, 0).normalize();
          p.tanArrow.setDirection(dir);
        }
      }
      else if (p.mode === 'deriv_extrema') {
        const pulse = 1.0 + Math.sin(time * 2.5) * 0.15;
        if (p.maxMarker) p.maxMarker.scale.set(pulse, pulse, pulse);
        if (p.minMarker) p.minMarker.scale.set(pulse, pulse, pulse);
      }
      else if (p.mode === 'deriv_inflection' && p.inflectMarker) {
        p.inflectMarker.rotation.y += 0.02;
        p.inflectMarker.rotation.z += 0.015;
      }
      // 8. Conic sections animation
      else if (p.mode === 'conic_parabola' && p.slicePlane) {
        p.slicePlane.position.y = 1.2 + Math.sin(time * 0.8) * 0.15;
      }
      else if (p.mode === 'conic_ellipse' && p.slicePlane) {
        const tilt = 0.35 + Math.sin(time * 0.7) * 0.1;
        p.slicePlane.rotation.x = tilt;
      }
      else if (p.mode === 'conic_hyperbola' && p.slicePlane) {
        p.slicePlane.position.z = 1.2 + Math.sin(time * 0.6) * 0.2;
      }
      // 9. Integrals animation
      else if (p.mode === 'integral_revolution' && p.disc) {
        const dx = 0.5 + ((Math.sin(time) + 1) / 2) * 2.2;
        p.disc.position.x = dx;
        const r = Math.sqrt(dx + 0.5) * 0.9;
        p.disc.scale.set(r / 1.4, 1, r / 1.4);
      }
      else if (p.mode === 'integral_riemann' && p.prisms) {
        const pulse = 1.0 + Math.sin(time * 2) * 0.05;
        p.prisms.forEach(box => {
          box.scale.set(1, pulse, 1);
        });
      }
      // 10. Complex numbers animation
      else if (p.mode === 'complex_polar' && p.arrowZ && p.head) {
        const theta = time * 0.9;
        const x = Math.cos(theta) * p.R;
        const y = Math.sin(theta) * p.R;
        p.head.position.set(x, y, 0);
        p.arrowZ.setDirection(new THREE.Vector3(x, y, 0).normalize());
      }
      else if (p.mode === 'complex_roots' && p.rootSpheres) {
        const rot = time * 0.5;
        p.rootSpheres.forEach((sph, k) => {
          const th = (2 * Math.PI * k) / p.n + rot;
          sph.position.set(Math.cos(th) * p.R, Math.sin(th) * p.R, 0);
        });
      }
      // 11. Differential vector flow animation
      else if (p.mode === 'differential' && p.particles) {
        const pos = p.particles.geometry.attributes.position.array;
        for (let i = 0; i < pos.length; i += 3) {
          pos[i] += Math.sin(pos[i + 1]) * 0.02;
          pos[i + 1] += Math.cos(pos[i]) * 0.02;
          if (pos[i] > 3) pos[i] = -3;
          if (pos[i + 1] > 3) pos[i + 1] = -3;
        }
        p.particles.geometry.attributes.position.needsUpdate = true;
      }
      // 12. Generic curve animation
      else if (p.mode === 'generic' && p.tracer) {
        const x = Math.sin(time * 0.8) * 3.5;
        const y = (p.pIdx === 1) ? Math.cos(x) * 1.5 : (p.pIdx >= 2) ? 0.08 * Math.pow(x, 3) : Math.sin(x) * 1.5;
        p.tracer.position.set(x, y, 0);
      }
    }

    if (this.renderer && this.scene && this.camera && this.is3DMode) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  animateProbabilityLab(time) {
    const s = this.probState;
    if (!s) return;

    // 1. Rolling Dice Physics & Tumbling
    if (s.isRolling && this.diceMesh) {
      s.rollProgress += 0.024;
      const t = Math.min(1.0, s.rollProgress);

      // Parabolic jump arc with bounce
      let y = 0.9;
      if (t < 0.75) {
        // High jump and tumble
        const jumpT = t / 0.75;
        y = 0.9 + Math.sin(jumpT * Math.PI) * 3.8;
      } else {
        // Bounce and settle
        const bounceT = (t - 0.75) / 0.25;
        y = 0.9 + Math.sin(bounceT * Math.PI) * 0.75;
      }
      this.diceMesh.position.y = y;

      // Rotation interpolation
      const rx = s.startRot.x + (s.targetRot.x - s.startRot.x) * t;
      const ry = s.startRot.y + (s.targetRot.y - s.startRot.y) * t;
      const rz = s.startRot.z + (s.targetRot.z - s.startRot.z) * t;
      this.diceMesh.rotation.set(rx, ry, rz);

      if (s.rollProgress >= 1.0) {
        s.isRolling = false;
        s.counts[s.targetFace - 1]++;
        s.totalRolls++;
        s.lastOutcome = s.targetFace;
        this.updateDicePillars();
        this.updateProbHUD();
      }
    }

    // 2. Smoothly scale 3D pillars toward target heights
    if (this.dicePillars && this.targetPillarHeights) {
      for (let i = 0; i < 6; i++) {
        const curScale = this.dicePillars[i].scale.y;
        const targetScale = this.targetPillarHeights[i];
        this.dicePillars[i].scale.y += (targetScale - curScale) * 0.12;
      }
    }

    // 3. Drawing Ball physics animation
    if (s.isDrawing && s.drawnBall) {
      s.drawProgress += 0.025;
      const t = Math.min(1.0, s.drawProgress);
      const b = s.drawnBall;

      // Float upward out of jar to spotlight
      b.position.y = b.userData.origPos.y + (3.6 - b.userData.origPos.y) * t;
      b.position.z = b.userData.origPos.z + (2.2 - b.userData.origPos.z) * t;
      b.position.x = b.userData.origPos.x * (1 - t);
      b.rotation.y += 0.08;

      if (s.drawProgress >= 1.0) {
        s.isDrawing = false;
        if (s.withReplacement) {
          // Return ball back to jar after brief display
          setTimeout(() => {
            if (b && b.userData.origPos) {
              b.position.copy(b.userData.origPos);
            }
          }, 1800);
        }
      }
    }

    // 4. Flipping Coin animation
    if (s.isFlipping && this.coinMesh) {
      s.flipProgress += 0.025;
      const t = Math.min(1.0, s.flipProgress);

      // Jump in air
      const jumpH = Math.sin(t * Math.PI) * 4.2;
      this.coinMesh.position.y = 0.1 + jumpH;
      this.coinMesh.rotation.x = t * s.coinTargetRotX;

      if (s.flipProgress >= 1.0) {
        s.isFlipping = false;
        this.coinMesh.position.y = 0.1;
        this.coinMesh.rotation.x = s.coinTargetRotX;
        s.totalFlips++;
        if (s.lastFlip === 'H') s.headsCount++;
        else s.tailsCount++;
        this.updateProbHUD();
      }
    }
  }
}

// Global Singleton
window.Math3D = new Math3DExplainer();
