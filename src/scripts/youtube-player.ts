interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  seekTo(seconds: number, allowSeekAhead?: boolean): void;
  getPlayerState(): number;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}

interface YTPlayerEvent { target: YTPlayer }
interface YTErrorEvent { data: number }
interface YTNamespace {
  Player: new (elementId: string, options: Record<string, unknown>) => YTPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

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
  private mount: HTMLElement;
  private poster: HTMLElement;
  private listeners = new Set<() => void>();

  constructor({ mountId, posterId }: { mountId: string; posterId: string }) {
    this.mount = document.querySelector<HTMLElement>(`#${mountId}`)!;
    this.poster = document.querySelector<HTMLElement>(`#${posterId}`)!;
    this.ready = new Promise<boolean>((resolve) => { this.resolveReady = resolve; });
    window.setTimeout(() => this.finishReady(false), 5500);
    void this.create(mountId);
  }

  private async create(mountId: string): Promise<void> {
    try {
      const YT = await loadYouTubeAPI();
      this.player = new YT.Player(mountId, {
        videoId: 'SaOwutdzd24',
        width: '100%',
        height: '100%',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: (event: YTPlayerEvent) => {
            event.target.mute();
            event.target.playVideo();
            this.mount.classList.add('is-ready');
            this.finishReady(true);
          },
          onStateChange: (event: YTPlayerEvent & { data: number }) => {
            if (event.data === YT.PlayerState.PLAYING) {
              this.poster.classList.add('is-hidden');
            } else if (event.data === YT.PlayerState.ENDED && !this.cinema) {
              event.target.seekTo(0, true);
              event.target.playVideo();
            }
            this.emit();
          },
          onError: (_event: YTErrorEvent) => {
            this.mount.classList.add('has-error');
            this.finishReady(false);
          },
        },
      });
    } catch {
      this.mount.classList.add('has-error');
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

  play(): void { this.player?.playVideo(); }
  pause(): void { this.player?.pauseVideo(); }
  mute(): void { this.player?.mute(); this.emit(); }
  unmute(): void { this.player?.unMute(); this.emit(); }
  isMuted(): boolean { return this.player?.isMuted() ?? true; }
  isPlaying(): boolean { return this.player?.getPlayerState() === window.YT?.PlayerState.PLAYING; }
  currentTime(): number { return this.player?.getCurrentTime() ?? 0; }
  duration(): number { return this.player?.getDuration() ?? 0; }
  seek(seconds: number): void { this.player?.seekTo(seconds, true); }
  enterCinema(): void {
    this.cinema = true;
    this.player?.seekTo(0, true);
    this.player?.unMute();
    this.player?.playVideo();
    this.emit();
  }
  leaveCinema(): void {
    this.cinema = false;
    this.player?.mute();
    this.player?.seekTo(0, true);
    this.player?.playVideo();
    this.emit();
  }
  destroy(): void {
    this.listeners.clear();
    this.player?.destroy();
    this.player = null;
  }
}
