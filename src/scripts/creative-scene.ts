import gsap from 'gsap';

export function initCreativeScene() {
  const section = document.querySelector<HTMLElement>('.creative')!;
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-card]'));
  const headingLines = Array.from(section.querySelectorAll<HTMLElement>('h2 .line-mask > span'));
  const copyLines = Array.from(section.querySelectorAll<HTMLElement>('.creative-copy .line-mask > span'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let entered = false;
  let visible = false;
  let overlayOpen = false;
  let intro: gsap.core.Timeline | null = null;
  const orbits: gsap.core.Timeline[] = [];

  const layout = () => {
    const mobile = matchMedia('(max-width: 700px)').matches;
    return mobile
      ? [
          { x: -70, y: -42, z: -25, rotationY: 7, rotationZ: -5 },
          { x: 6, y: 32, z: 46, rotationY: -6, rotationZ: 3 },
          { x: 76, y: -18, z: 4, rotationY: 6, rotationZ: 5 },
        ]
      : [
          { x: -190, y: -55, z: -55, rotationY: 11, rotationZ: -6 },
          { x: 0, y: 58, z: 95, rotationY: -10, rotationZ: 3 },
          { x: 205, y: -32, z: 18, rotationY: 9, rotationZ: 6 },
        ];
  };

  const syncOrbitState = () => {
    const shouldPlay = visible && !overlayOpen && entered && !reduced.matches;
    orbits.forEach((orbit) => shouldPlay ? orbit.play() : orbit.pause());
  };

  const createOrbits = () => {
    orbits.splice(0).forEach((orbit) => orbit.kill());
    const positions = layout();
    cards.forEach((card, index) => {
      const base = positions[index];
      const directions = [-1, 1, -1];
      const orbit = gsap.timeline({ repeat: -1, yoyo: true, paused: true })
        .to(card, {
          x: base.x + directions[index] * (index === 1 ? 36 : 58),
          y: base.y + (index - 1) * 24,
          z: base.z + directions[index] * 115,
          rotationX: directions[index] * 4,
          rotationY: base.rotationY - directions[index] * 8,
          rotationZ: base.rotationZ + directions[index] * 3,
          duration: 8.5 + index * 1.1,
          ease: 'sine.inOut',
          onUpdate: () => { card.style.zIndex = String(1000 + Math.round(Number(gsap.getProperty(card, 'z')))); },
        });
      orbits.push(orbit);
    });
    syncOrbitState();
  };

  const prepare = () => {
    intro?.kill();
    orbits.splice(0).forEach((orbit) => orbit.kill());
    const positions = layout();
    gsap.set([...headingLines, ...copyLines], { yPercent: reduced.matches ? 0 : 110 });
    gsap.set(cards, { xPercent: -50, yPercent: -50, transformOrigin: '50% 50%', transformPerspective: 1100 });
    if (reduced.matches) {
      cards.forEach((card, index) => gsap.set(card, { ...positions[index], rotationX: 0 }));
      entered = true;
      return;
    }
    gsap.set(cards, { x: 0, y: 0, z: (index: number) => index * -10, rotationX: 0, rotationY: 0, rotationZ: 0, scale: 0.86 });
    intro = gsap.timeline({ paused: true, onComplete: createOrbits })
      .to(headingLines, { yPercent: 0, duration: 0.72, stagger: 0.09, ease: 'power3.out' })
      .to(cards, { scale: 1, duration: 0.35, stagger: 0.04, ease: 'power2.out' }, 0.16)
      .to(cards, {
        x: (index: number) => positions[index].x,
        y: (index: number) => positions[index].y,
        z: (index: number) => positions[index].z,
        rotationY: (index: number) => positions[index].rotationY,
        rotationZ: (index: number) => positions[index].rotationZ,
        duration: 1.2,
        stagger: 0.08,
        ease: 'power3.inOut',
      }, 0.24)
      .to(copyLines, { yPercent: 0, duration: 0.62, stagger: 0.06, ease: 'power3.out' }, 0.72);
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !entered) {
      entered = true;
      intro?.play();
    }
    syncOrbitState();
  }, { threshold: 0.18 });

  const onOverlay = (event: Event) => {
    overlayOpen = Boolean((event as CustomEvent<{ open: boolean }>).detail.open);
    syncOrbitState();
  };
  const onReduced = () => {
    entered = reduced.matches;
    prepare();
    if (visible && !reduced.matches) {
      entered = true;
      intro?.play();
    }
  };

  prepare();
  observer.observe(section);
  window.addEventListener('site-overlay', onOverlay);
  reduced.addEventListener('change', onReduced);

  return {
    destroy: () => {
      observer.disconnect();
      intro?.kill();
      orbits.forEach((orbit) => orbit.kill());
      window.removeEventListener('site-overlay', onOverlay);
      reduced.removeEventListener('change', onReduced);
    },
  };
}
