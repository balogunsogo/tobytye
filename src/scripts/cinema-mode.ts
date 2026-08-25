import gsap from 'gsap';
import type { YouTubeController } from './youtube-player';
import { lockScroll, setPageInert, trapFocus } from './accessibility';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  return `${mins}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

export function initCinemaMode(player: YouTubeController, menuIsOpen: () => boolean) {
  const media = document.querySelector<HTMLElement>('#hero-media')!;
  const trigger = document.querySelector<HTMLButtonElement>('#watch-button')!;
  const controls = document.querySelector<HTMLElement>('#cinema-controls')!;
  const closeButton = document.querySelector<HTMLButtonElement>('#cinema-close')!;
  const playButton = document.querySelector<HTMLButtonElement>('#cinema-play')!;
  const muteButton = document.querySelector<HTMLButtonElement>('#cinema-mute')!;
  const fullscreenButton = document.querySelector<HTMLButtonElement>('#cinema-fullscreen')!;
  const progress = document.querySelector<HTMLInputElement>('#cinema-progress')!;
  const time = document.querySelector<HTMLElement>('#cinema-time')!;
  let open = false;
  let restoreScroll: (() => void) | null = null;
  let controlsTimer = 0;
  let progressTimer = 0;
  let placeholder: Comment | null = null;

  const syncControls = () => {
    const playing = player.isPlaying();
    playButton.textContent = playing ? 'Ⅱ' : '▶';
    playButton.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    muteButton.textContent = player.isMuted() ? 'SOUND OFF' : 'SOUND ON';
    muteButton.setAttribute('aria-label', player.isMuted() ? 'Unmute video' : 'Mute video');
  };

  const updateProgress = () => {
    if (!open) return;
    const current = player.currentTime();
    const duration = player.duration();
    progress.value = duration ? String(Math.round(current / duration * 1000)) : '0';
    time.textContent = `${formatTime(current)} / ${formatTime(duration)}`;
  };

  const showControls = () => {
    if (!open) return;
    media.classList.add('controls-visible');
    window.clearTimeout(controlsTimer);
    controlsTimer = window.setTimeout(() => {
      if (!controls.matches(':focus-within')) media.classList.remove('controls-visible');
    }, 2300);
  };

  const openCinema = () => {
    if (open || menuIsOpen()) return;
    open = true;
    placeholder = document.createComment('hero-media-home');
    media.parentNode?.insertBefore(placeholder, media);
    document.body.append(media);
    document.body.classList.add('is-cinema');
    media.classList.add('is-cinema', 'controls-visible');
    media.setAttribute('role', 'dialog');
    media.setAttribute('aria-modal', 'true');
    media.setAttribute('aria-label', 'Toby&Tye cinema player');
    controls.setAttribute('aria-hidden', 'false');
    restoreScroll = lockScroll();
    setPageInert(true);
    player.enterCinema();
    syncControls();
    progressTimer = window.setInterval(updateProgress, 250);
    requestAnimationFrame(() => closeButton.focus());
  };

  const closeCinema = () => {
    if (!open) return;
    open = false;
    window.clearInterval(progressTimer);
    window.clearTimeout(controlsTimer);
    player.leaveCinema();
    media.classList.remove('is-cinema', 'controls-visible');
    document.body.classList.remove('is-cinema');
    media.removeAttribute('role');
    media.removeAttribute('aria-modal');
    media.removeAttribute('aria-label');
    controls.setAttribute('aria-hidden', 'true');
    if (placeholder?.parentNode) placeholder.parentNode.insertBefore(media, placeholder);
    placeholder?.remove();
    placeholder = null;
    setPageInert(false);
    restoreScroll?.();
    restoreScroll = null;
    trigger.focus();
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!open) return;
    showControls();
    if (event.key === 'Escape') {
      event.preventDefault();
      closeCinema();
    } else {
      trapFocus(media, event);
    }
  };

  const togglePlay = () => {
    if (player.isPlaying()) player.pause(); else player.play();
    syncControls();
    showControls();
  };
  const toggleMute = () => {
    if (player.isMuted()) player.unmute(); else player.mute();
    syncControls();
    showControls();
  };

  trigger.addEventListener('click', openCinema);
  closeButton.addEventListener('click', closeCinema);
  playButton.addEventListener('click', togglePlay);
  muteButton.addEventListener('click', toggleMute);
  progress.addEventListener('input', () => player.seek(Number(progress.value) / 1000 * player.duration()));
  fullscreenButton.addEventListener('click', () => void media.requestFullscreen?.());
  media.addEventListener('pointermove', showControls);
  media.addEventListener('pointerdown', showControls);
  document.addEventListener('keydown', onKeydown);
  const offState = player.onStateChange(syncControls);

  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const moveX = gsap.quickTo(trigger, 'x', { duration: 0.35, ease: 'power3.out' });
    const moveY = gsap.quickTo(trigger, 'y', { duration: 0.35, ease: 'power3.out' });
    media.addEventListener('pointermove', (event) => {
      if (open) return;
      const bounds = media.getBoundingClientRect();
      moveX((event.clientX - bounds.left - bounds.width / 2) * 0.08);
      moveY((event.clientY - bounds.top - bounds.height / 2) * 0.08);
    });
    media.addEventListener('pointerleave', () => gsap.to(trigger, { x: 0, y: 0, duration: 0.45, ease: 'power3.out' }));
  }

  return {
    isOpen: () => open,
    close: closeCinema,
    destroy: () => {
      closeCinema();
      offState();
      trigger.removeEventListener('click', openCinema);
      closeButton.removeEventListener('click', closeCinema);
      playButton.removeEventListener('click', togglePlay);
      muteButton.removeEventListener('click', toggleMute);
      document.removeEventListener('keydown', onKeydown);
    },
  };
}
