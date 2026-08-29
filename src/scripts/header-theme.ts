import gsap from 'gsap';

type HeaderTheme = 'dark' | 'light';

export function initHeaderTheme() {
  const header = document.querySelector<HTMLElement>('#site-header');
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-header-theme]'));
  if (!header || !sections.length) return { destroy: () => undefined };

  const headerElements = [
    header,
    ...Array.from(header.querySelectorAll<HTMLElement>('.brand-link, .brand, .menu-trigger, .menu-trigger__lines')),
  ];
  gsap.killTweensOf(headerElements);
  gsap.set(headerElements, {
    clearProps: 'opacity,visibility,display,transform,translate,scale,pointerEvents',
  });

  let observer: IntersectionObserver | null = null;
  let frame = 0;

  const themeForHeader = (): HeaderTheme => {
    const probeY = Math.min(window.innerHeight - 1, Math.max(0, header.getBoundingClientRect().bottom));
    const current = sections.find((section) => {
      const bounds = section.getBoundingClientRect();
      return bounds.top <= probeY && bounds.bottom > probeY;
    });
    if (current?.dataset.headerTheme === 'dark') return 'dark';
    return 'light';
  };

  const update = () => {
    frame = 0;
    header.dataset.theme = themeForHeader();
  };

  const scheduleUpdate = () => {
    if (frame) return;
    frame = requestAnimationFrame(update);
  };

  const onThemeChange = () => scheduleUpdate();

  const observeSections = () => {
    observer?.disconnect();
    observer = new IntersectionObserver(scheduleUpdate, { threshold: [0, 0.01, 1] });
    sections.forEach((section) => observer?.observe(section));
    scheduleUpdate();
  };

  window.addEventListener('scroll', scheduleUpdate, { passive: true });
  window.addEventListener('resize', scheduleUpdate, { passive: true });
  window.addEventListener('orientationchange', scheduleUpdate);
  window.addEventListener('header-theme-change', onThemeChange);
  observeSections();

  return {
    destroy: () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('orientationchange', scheduleUpdate);
      window.removeEventListener('header-theme-change', onThemeChange);
    },
  };
}
