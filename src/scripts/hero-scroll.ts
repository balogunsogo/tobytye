import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import type { YouTubeController } from './youtube-player';

export function initHeroScroll(player: YouTubeController) {
  const hero = document.querySelector<HTMLElement>('.hero')!;
  const media = document.querySelector<HTMLElement>('#hero-media')!;
  const title = document.querySelector<HTMLElement>('#hero-title')!;
  const header = document.querySelector<HTMLElement>('#site-header')!;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let trigger: ScrollTrigger | null = null;
  let headerTrigger: ScrollTrigger | null = null;
  let resizeTimer = 0;
  let lastWidth = window.innerWidth;
  let lastHeight = window.innerHeight;

  const targetScale = () => {
    const rect = media.getBoundingClientRect();
    const currentScale = Number(gsap.getProperty(media, 'scale')) || 1;
    const baseWidth = rect.width / currentScale;
    const baseHeight = rect.height / currentScale;
    return Math.max(window.innerWidth / baseWidth, window.innerHeight / baseHeight) * 1.015;
  };

  const build = () => {
    trigger?.kill();
    headerTrigger?.kill();
    trigger = null;
    gsap.set([media, title], { clearProps: 'transform' });
    header.classList.remove('is-over-video');
    if (reduced.matches) return;

    const mobile = matchMedia('(max-width: 700px)').matches;
    const timeline = gsap.timeline()
      .to({}, { duration: 0.1 })
      .to(media, { scale: targetScale, duration: 0.65, ease: 'none' })
      .to(title, { yPercent: mobile ? -5 : -10, letterSpacing: '-0.075em', duration: 0.55, ease: 'none' }, 0.18)
      .to({}, { duration: 0.25 });

    trigger = ScrollTrigger.create({
      trigger: hero,
      start: 'top top',
      end: () => `+=${window.innerHeight * (mobile ? 1.15 : 1.8)}`,
      pin: true,
      scrub: 0.6,
      animation: timeline,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: ({ progress }) => header.classList.toggle('is-over-video', progress > 0.48),
      onLeave: () => header.classList.add('is-over-video'),
      onEnterBack: () => header.classList.add('is-over-video'),
      onLeaveBack: () => header.classList.remove('is-over-video'),
    });
    headerTrigger = ScrollTrigger.create({
      trigger: '.creative',
      start: 'top 18%',
      onEnter: () => header.classList.remove('is-over-video'),
      onLeaveBack: () => header.classList.add('is-over-video'),
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
      headerTrigger?.kill();
      visibility.disconnect();
      reduced.removeEventListener('change', refresh);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', refresh);
    },
  };
}
