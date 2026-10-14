/**
 * NGS Education LMS - Custom Video Player Controller
 */

class VideoPlayerController {
  constructor(videoElement, containerElement) {
    this.video = videoElement;
    this.container = containerElement;
    this.progressBar = this.container.querySelector('.progress-bar');
    this.progressWrap = this.container.querySelector('.progress-bar-wrap');
    this.timeDisplay = this.container.querySelector('.time-display');
    this.playBtn = this.container.querySelector('#btn-play-pause');
    this.speedSelect = this.container.querySelector('#player-speed');
    this.volumeBtn = this.container.querySelector('#btn-volume');
    this.fullscreenBtn = this.container.querySelector('#btn-fullscreen');
    this.controlsOverlay = this.container.querySelector('.video-controls');

    this.currentLessonId = null;
    this.initEvents();
  }

  initEvents() {
    if (!this.video) return;

    // Play / Pause toggle
    if (this.playBtn) {
      this.playBtn.addEventListener('click', () => this.togglePlay());
    }
    this.video.addEventListener('click', () => this.togglePlay());

    // Playback state updates
    this.video.addEventListener('play', () => {
      if (this.playBtn) this.playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
      if (this.controlsOverlay) this.controlsOverlay.classList.remove('paused');
    });

    this.video.addEventListener('pause', () => {
      if (this.playBtn) this.playBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
      if (this.controlsOverlay) this.controlsOverlay.classList.add('paused');
    });

    // Time update & scrubber progress
    this.video.addEventListener('timeupdate', () => {
      this.updateProgress();
      if (this.currentLessonId && this.video.currentTime > 5) {
        StorageService.setLessonProgress(this.currentLessonId, this.video.currentTime);
      }
      // Check if 90% watched to mark complete
      if (this.video.duration && (this.video.currentTime / this.video.duration >= 0.9)) {
        if (this.currentLessonId && !StorageService.isCompleted(this.currentLessonId)) {
          StorageService.setCompleted(this.currentLessonId, true);
          if (window.App) window.App.updateSidebarStatus();
        }
      }
    });

    // Click on progress bar to seek
    if (this.progressWrap) {
      this.progressWrap.addEventListener('click', (e) => {
        const rect = this.progressWrap.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        if (this.video.duration) {
          this.video.currentTime = pos * this.video.duration;
        }
      });
    }

    // Speed Selector
    if (this.speedSelect) {
      this.speedSelect.addEventListener('change', (e) => {
        this.video.playbackRate = parseFloat(e.target.value);
      });
    }

    // Skip Buttons
    const skipBackBtn = this.container.querySelector('#btn-skip-back');
    if (skipBackBtn) {
      skipBackBtn.addEventListener('click', () => {
        this.video.currentTime = Math.max(0, this.video.currentTime - 10);
      });
    }

    const skipFwdBtn = this.container.querySelector('#btn-skip-forward');
    if (skipFwdBtn) {
      skipFwdBtn.addEventListener('click', () => {
        if (this.video.duration) {
          this.video.currentTime = Math.min(this.video.duration, this.video.currentTime + 10);
        }
      });
    }

    // Volume Toggle
    if (this.volumeBtn) {
      this.volumeBtn.addEventListener('click', () => {
        this.video.muted = !this.video.muted;
        this.volumeBtn.innerHTML = this.video.muted
          ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"></path><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>'
          : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>';
      });
    }

    // Fullscreen Toggle
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
          if (this.container.requestFullscreen) {
            this.container.requestFullscreen();
          }
        } else {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          }
        }
      });
    }
  }

  togglePlay() {
    if (this.video.paused || this.video.ended) {
      this.video.play().catch(e => console.log('Autoplay prevented', e));
    } else {
      this.video.pause();
    }
  }

  updateProgress() {
    if (!this.video.duration) return;
    const current = this.video.currentTime;
    const duration = this.video.duration;
    const percent = (current / duration) * 100;

    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`;
    }

    if (this.timeDisplay) {
      this.timeDisplay.textContent = `${this.formatTime(current)} / ${this.formatTime(duration)}`;
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  loadLessonVideo(lesson) {
    this.currentLessonId = lesson.id;
    this.video.pause();

    // Check if it's local or web URL
    this.video.src = encodeURI(lesson.videoUrl);
    this.video.load();

    // Restore last position
    const savedTime = StorageService.getLessonProgress(lesson.id);
    if (savedTime && savedTime > 5) {
      this.video.addEventListener('loadedmetadata', () => {
        if (savedTime < this.video.duration - 10) {
          this.video.currentTime = savedTime;
        }
      }, { once: true });
    }

    if (this.speedSelect) {
      this.speedSelect.value = '1';
      this.video.playbackRate = 1;
    }
  }

  seekTo(seconds) {
    if (this.video) {
      this.video.currentTime = seconds;
      this.video.play().catch(() => {});
    }
  }
}
