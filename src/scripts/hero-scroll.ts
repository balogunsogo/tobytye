import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import type { VideoController } from './video-player';

export function initHeroScroll(player: VideoController) {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const media = document.querySelector<HTMLElement>('#hero-media')!;
  const headerControls = Array.from(document.querySelectorAll<HTMLElement>('#site-header .brand-link, #site-header .menu-trigger'));
  const title = document.querySelector<HTMLElement>('#hero-title');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let trigger: ScrollTrigger | null = null;
  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

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
    return Math.max(window.innerWidth / baseWidth, window.innerHeight / baseHeight) * 1.015;
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
      end: () => `+=${window.innerHeight * (mobile ? 1.15 : 1.8)}`,
      pin: true,
      scrub: 0.6,
      animation: timeline,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onRefresh: syncHeroHeaderTheme,
    });
  };

  const refresh = () => {
    build();
    ScrollTrigger.refresh();
  };

  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      const widthChanged = Math.abs(window.innerWidth - lastWidth) > 2;
      const heightChanged = Math.abs(window.innerHeight - lastHeight) > 90;
      if (widthChanged || heightChanged) {
        lastWidth = window.innerWidth;
        lastHeight = window.innerHeight;
        refresh();
      }
    }, 180);
  };

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
  window.addEventListener('orientationchange', refresh);
  build();

  return {
    refresh,
    destroy: () => {
      trigger?.kill();
      setHeroHeaderTheme(false);
      visibility.disconnect();
      reduced.removeEventListener('change', refresh);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', refresh);
    },
  };
}
