import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import type { VideoController } from './video-player';
import { createSettledViewportTask, usesNativeTouchScrolling } from './viewport-stability';

export function initHeroScroll(player: VideoController) {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const stage = hero.querySelector<HTMLElement>('.hero-stage')!;
  const media = document.querySelector<HTMLElement>('#hero-media')!;
  const headerControls = Array.from(document.querySelectorAll<HTMLElement>('#site-header .brand-link, #site-header .menu-trigger'));
  const title = document.querySelector<HTMLElement>('#hero-title');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const nativeTouchScroll = usesNativeTouchScrolling();
  let trigger: ScrollTrigger | null = null;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;
  let stableViewportHeight = nativeTouchScroll ? stage.getBoundingClientRect().height : window.innerHeight;

  const setHeroHeaderTheme = (videoBehindHeader: boolean) => {
    const theme = videoBehindHeader ? 'dark' : 'light';
    if (hero.dataset.headerTheme === theme) return;
    hero.dataset.headerTheme = theme;
    window.dispatchEvent(new CustomEvent('header-theme-change'));
  };

  const syncHeroHeaderTheme = () => {
    const mediaBounds = media.getBoundingClientRect();
    const videoBehindHeader = headerControls.length > 0 && headerControls.every((control) => {
      const bounds = control.getBoundingClientRect();
      return mediaBounds.top <= bounds.top
        && mediaBounds.right >= bounds.right
        && mediaBounds.bottom >= bounds.bottom
        && mediaBounds.left <= bounds.left;
    });
    setHeroHeaderTheme(videoBehindHeader);
  };

  const targetScale = () => {
    const rect = media.getBoundingClientRect();
    const currentScale = Number(gsap.getProperty(media, 'scale')) || 1;
    const baseWidth = rect.width / currentScale;
    const baseHeight = rect.height / currentScale;
    const viewportHeight = nativeTouchScroll ? stableViewportHeight : window.innerHeight;
    return Math.max(window.innerWidth / baseWidth, viewportHeight / baseHeight) * 1.015;
  };

  const build = () => {
    trigger?.kill();
    trigger = null;
    gsap.set(media, { clearProps: 'transform' });
    if (title) gsap.set(title, { clearProps: 'transform' });
    setHeroHeaderTheme(false);
    if (reduced.matches) return;

    const mobile = matchMedia('(max-width: 700px)').matches;
    const timeline = gsap.timeline({ onUpdate: syncHeroHeaderTheme })
      .to({}, { duration: 0.1 })
      .to(media, { scale: targetScale, duration: 0.65, ease: 'none' });
    if (title) timeline.to(title, { yPercent: mobile ? -5 : -10, letterSpacing: '-0.075em', duration: 0.55, ease: 'none' }, 0.18);
    timeline.to({}, { duration: 0.25 });

    trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: () => `+=${(nativeTouchScroll ? stableViewportHeight : window.innerHeight) * (mobile ? 1.15 : 1.8)}`,
      pin: true,
      scrub: 0.6,
      animation: timeline,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: syncHeroHeaderTheme,
    });
  };

  const refresh = () => {
    stableViewportHeight = nativeTouchScroll ? stage.getBoundingClientRect().height : window.innerHeight;
    lastWidth = window.innerWidth;
    lastHeight = window.innerHeight;
    build();
    ScrollTrigger.refresh();
  };

  const settledRefresh = createSettledViewportTask(refresh);

  const onResize = () => {
    const widthChanged = Math.abs(window.innerWidth - lastWidth) > 8;
    const desktopHeightChanged = !nativeTouchScroll && Math.abs(window.innerHeight - lastHeight) > 90;
    if (!widthChanged && !desktopHeightChanged) return;
    settledRefresh.schedule();
  };

  const onOrientationChange = () => settledRefresh.schedule();

  const visibility = new IntersectionObserver(([entry]) => {
    if (document.body.classList.contains('is-cinema') || document.querySelector('.site-menu.is-open')) return;
    if (entry.isIntersecting) {
      player.mute();
      player.play();
    } else {
      player.pause();
    }
  }, { threshold: 0.04 });
  visibility.observe(hero);

  reduced.addEventListener('change', refresh);
  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('orientationchange', onOrientationChange);
  build();

  return {
    refresh,
    destroy: () => {
      trigger?.kill();
      settledRefresh.cancel();
      setHeroHeaderTheme(false);
      visibility.disconnect();
      reduced.removeEventListener('change', refresh);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onOrientationChange);
    },
  };
}
