export type HeroMediaState = 'loading' | 'ready' | 'autoplaying' | 'autoplay-blocked' | 'cinema' | 'failed';

export class VideoController {
  readonly ready: Promise<boolean>;
  private readonly video: HTMLVideoElement;
  private resolveReady!: (ready: boolean) => void;
  private readySettled = false;
  private cinema = false;
  private state: HeroMediaState = 'loading';
  private loaderRetryUsed = false;
  private listeners = new Set<() => void>();
  private readonly handleReady = () => {
    if (this.readySettled) return;
    this.setState('ready');
    this.finishReady(true);
    this.attemptMutedPlayback();
  };
  private readonly handlePlaying = () => {
    this.setState(this.cinema ? 'cinema' : 'autoplaying');
  };
  private readonly handlePause = () => this.emit();
  private readonly handleVolumeChange = () => this.emit();
  private readonly handleTimeUpdate = () => this.emit();
  private readonly handleError = () => {
    this.setState('failed');
    this.finishReady(false);
  };

  constructor(elementId: string) {
    this.video = document.querySelector<HTMLVideoElement>(`#${elementId}`)!;
    this.ready = new Promise<boolean>((resolve) => { this.resolveReady = resolve; });
    this.prepareAmbientPlayback();
    this.bindEvents();
    this.video.dataset.mediaState = this.state;
    this.selectInitialSource();

    if (this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      this.handleReady();
    } else {
      this.video.load();
    }

    window.setTimeout(() => this.finishReady(false), 5500);
  }

  private selectInitialSource(): void {
    const useMobileSource = matchMedia('(max-width: 700px)').matches;
    const source = useMobileSource ? this.video.dataset.mobileSrc : this.video.dataset.desktopSrc;
    if (!source) return;
    this.video.src = source;
    this.video.dataset.selectedSource = useMobileSource ? 'mobile' : 'desktop';
  }

  private bindEvents(): void {
    this.video.addEventListener('loadeddata', this.handleReady, { once: true });
    this.video.addEventListener('canplay', this.handleReady, { once: true });
    this.video.addEventListener('playing', this.handlePlaying);
    this.video.addEventListener('pause', this.handlePause);
    this.video.addEventListener('volumechange', this.handleVolumeChange);
    this.video.addEventListener('timeupdate', this.handleTimeUpdate);
    this.video.addEventListener('error', this.handleError);
  }

  private prepareAmbientPlayback(): void {
    this.video.defaultMuted = true;
    this.video.muted = true;
    this.video.volume = 1;
    this.video.loop = true;
    this.video.playsInline = true;
  }

  private setState(state: HeroMediaState): void {
    this.state = state;
    this.video.dataset.mediaState = state;
    this.emit();
  }

  private finishReady(value: boolean): void {
    if (this.readySettled) return;
    this.readySettled = true;
    this.resolveReady(value);
  }

  private emit(): void {
    this.listeners.forEach((listener) => listener());
  }

  private attemptMutedPlayback(): void {
    if (this.state === 'failed' || this.cinema) return;
    this.video.muted = true;
    void this.video.play().catch(() => {
      if (!this.cinema) this.setState('autoplay-blocked');
    });
  }

  onStateChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  retryMutedAutoplay(): void {
    if (this.loaderRetryUsed || this.state === 'failed') return;
    this.loaderRetryUsed = true;
    this.attemptMutedPlayback();
  }

  play(): void {
    if (!this.cinema) this.video.muted = true;
    void this.video.play().catch(() => {
      if (!this.cinema) this.setState('autoplay-blocked');
    });
  }

  playWithSound(): void {
    this.video.muted = false;
    this.video.volume = 1;
    void this.video.play().catch(() => this.emit());
    this.emit();
  }

  pause(): void {
    this.video.pause();
  }

  mute(): void {
    this.video.muted = true;
    this.emit();
  }

  unmute(): void {
    this.video.muted = false;
    this.video.volume = 1;
    this.emit();
  }

  isMuted(): boolean {
    return this.video.muted;
  }

  isPlaying(): boolean {
    return !this.video.paused && !this.video.ended;
  }

  currentTime(): number {
    return Number.isFinite(this.video.currentTime) ? this.video.currentTime : 0;
  }

  duration(): number {
    return Number.isFinite(this.video.duration) ? this.video.duration : 0;
  }

  seek(seconds: number): void {
    if (!Number.isFinite(seconds)) return;
    this.video.currentTime = Math.min(Math.max(seconds, 0), this.duration() || seconds);
  }

  enterCinema(): void {
    this.cinema = true;
    this.video.currentTime = 0;
    this.video.muted = false;
    this.video.volume = 1;
    this.setState('cinema');
    void this.video.play().catch(() => this.emit());
  }

  leaveCinema(): void {
    this.cinema = false;
    this.video.currentTime = 0;
    this.video.muted = true;
    this.setState('ready');
    this.attemptMutedPlayback();
  }

  destroy(): void {
    this.video.removeEventListener('loadeddata', this.handleReady);
    this.video.removeEventListener('canplay', this.handleReady);
    this.video.removeEventListener('playing', this.handlePlaying);
    this.video.removeEventListener('pause', this.handlePause);
    this.video.removeEventListener('volumechange', this.handleVolumeChange);
    this.video.removeEventListener('timeupdate', this.handleTimeUpdate);
    this.video.removeEventListener('error', this.handleError);
    this.listeners.clear();
    this.video.pause();
  }
}
