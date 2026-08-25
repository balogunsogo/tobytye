interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  setVolume(volume: number): void;
  isMuted(): boolean;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getIframe(): HTMLIFrameElement;
  destroy(): void;
}

interface YTPlayerEvent { target: YTPlayer }
interface YTErrorEvent { data: number }
interface YTNamespace {
  Player: new (elementId: string, options: Record<string, unknown>) => YTPlayer;
  PlayerState: {
    ENDED: number;
    PLAYING: number;
    PAUSED: number;
    BUFFERING: number;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type HeroMediaState = 'loading' | 'ready' | 'autoplaying' | 'autoplay-blocked' | 'cinema' | 'failed';

const VIDEO_ID = 'SaOwutdzd24';

const loadYouTubeAPI = (): Promise<YTNamespace> => new Promise((resolve, reject) => {
  if (window.YT?.Player) {
    resolve(window.YT);
    return;
  }

  const previous = window.onYouTubeIframeAPIReady;
  window.onYouTubeIframeAPIReady = () => {
    previous?.();
    if (window.YT) resolve(window.YT);
    else reject(new Error('YouTube API unavailable'));
  };

  if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => reject(new Error('YouTube API failed to load'));
    document.head.append(script);
  }
});

export class YouTubeController {
  readonly ready: Promise<boolean>;
  private player: YTPlayer | null = null;
  private resolveReady!: (ready: boolean) => void;
  private readySettled = false;
  private cinema = false;
  private state: HeroMediaState = 'loading';
  private autoplayCheck = 0;
  private firstFrameTimer = 0;
  private loaderRetryUsed = false;
  private ambientRecoveryUsed = false;
  private intentionalPause = false;
  private wrapper: HTMLElement;
  private listeners = new Set<() => void>();

  constructor({ mountId, wrapperId }: { mountId: string; wrapperId: string }) {
    this.wrapper = document.querySelector<HTMLElement>(`#${wrapperId}`)!;
    this.ready = new Promise<boolean>((resolve) => { this.resolveReady = resolve; });
    this.setState('loading');
    window.setTimeout(() => this.finishReady(false), 5500);
    void this.create(mountId);
  }

  private setState(state: HeroMediaState): void {
    this.state = state;
    this.wrapper.dataset.mediaState = state;
    this.emit();
  }

  private attemptMutedPlayback(): void {
    if (!this.player || this.state === 'failed') return;
    window.clearTimeout(this.autoplayCheck);
    this.intentionalPause = false;
    this.player.mute();
    this.player.setVolume(0);
    this.player.playVideo();
    this.autoplayCheck = window.setTimeout(() => {
      if (!this.cinema && !this.isPlaying()) this.setState('autoplay-blocked');
    }, 1800);
  }

  private async create(mountId: string): Promise<void> {
    try {
      const YT = await loadYouTubeAPI();
      this.player = new YT.Player(mountId, {
        videoId: VIDEO_ID,
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          loop: 1,
          playlist: VIDEO_ID,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: YTPlayerEvent) => {
            event.target.getIframe().allow = 'autoplay; encrypted-media; fullscreen; picture-in-picture';
            this.setState('ready');
            this.attemptMutedPlayback();
          },
          onStateChange: (event: YTPlayerEvent & { data: number }) => {
            if (event.data === YT.PlayerState.PLAYING) {
              window.clearTimeout(this.autoplayCheck);
              if (!this.cinema) {
                event.target.mute();
                event.target.setVolume(0);
              }
              this.setState(this.cinema ? 'cinema' : 'autoplaying');
              if (!this.readySettled && !this.firstFrameTimer) {
                this.firstFrameTimer = window.setTimeout(() => this.finishReady(true), 250);
              }
            } else if (event.data === YT.PlayerState.ENDED && !this.cinema) {
              event.target.seekTo(0, true);
              event.target.mute();
              event.target.playVideo();
            } else if (event.data === YT.PlayerState.PAUSED && !this.cinema && !this.intentionalPause && !this.ambientRecoveryUsed) {
              this.ambientRecoveryUsed = true;
              event.target.mute();
              event.target.setVolume(0);
              event.target.playVideo();
            }
            // BUFFERING deliberately preserves the last visible layer.
            this.emit();
          },
          onError: (_event: YTErrorEvent) => {
            this.setState('failed');
            this.finishReady(false);
          },
        },
      });
    } catch {
      this.setState('failed');
      this.finishReady(false);
    }
  }

  private finishReady(value: boolean): void {
    if (this.readySettled) return;
    this.readySettled = true;
    this.resolveReady(value);
  }

  private emit(): void { this.listeners.forEach((listener) => listener()); }
  onStateChange(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  retryMutedAutoplay(): void {
    if (this.loaderRetryUsed || !this.player || this.state === 'failed') return;
    this.loaderRetryUsed = true;
    this.attemptMutedPlayback();
  }

  play(): void { this.intentionalPause = false; this.player?.playVideo(); }
  pause(): void { this.intentionalPause = true; this.player?.pauseVideo(); }
  mute(): void { this.player?.mute(); this.emit(); }
  unmute(): void { this.player?.unMute(); this.emit(); }
  isMuted(): boolean { return this.player?.isMuted() ?? true; }
  isPlaying(): boolean { return this.player?.getPlayerState() === window.YT?.PlayerState.PLAYING; }
  currentTime(): number { return this.player?.getCurrentTime() ?? 0; }
  duration(): number { return this.player?.getDuration() ?? 0; }
  seek(seconds: number): void { this.player?.seekTo(seconds, true); }

  enterCinema(): void {
    this.cinema = true;
    this.intentionalPause = false;
    this.setState('cinema');
    this.player?.unMute();
    this.player?.setVolume(100);
    this.player?.seekTo(0, true);
    this.player?.playVideo();
  }

  leaveCinema(): void {
    this.cinema = false;
    this.intentionalPause = false;
    this.setState('ready');
    this.player?.mute();
    this.player?.setVolume(0);
    this.player?.seekTo(0, true);
    this.player?.playVideo();
    window.clearTimeout(this.autoplayCheck);
    window.clearTimeout(this.firstFrameTimer);
    this.autoplayCheck = window.setTimeout(() => {
      if (!this.isPlaying()) this.setState('autoplay-blocked');
    }, 1800);
  }

  destroy(): void {
    window.clearTimeout(this.autoplayCheck);
    this.listeners.clear();
    this.player?.destroy();
    this.player = null;
  }
}
