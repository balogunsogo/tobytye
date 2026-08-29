import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { maskedHeadingRevealVars, setMaskedHeadingInitialState } from './masked-heading-reveal';
import { createSettledViewportTask } from './viewport-stability';

type OrbitPoint = { x: number; y: number; z: number; scale: number; opacity: number };

export function initCreativeScene() {
  const section = document.querySelector<HTMLElement>('.creative')!;
  const composition = section.querySelector<HTMLElement>('.card-composition')!;
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-orbit-card]'));
  const headingLines = Array.from(section.querySelectorAll<HTMLElement>('h2 .line-mask > span'));
  const copy = section.querySelector<HTMLElement>('.creative-copy')!;
  const copyText = copy.textContent?.replace(/\s+/g, ' ').trim() ?? '';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let entered = false;
  let assembled = false;
  let visible = false;
  let overlayOpen = false;
  let orbitProgress = 0;
  let tickerActive = false;
  let lastTick = 0;
  let lastViewportWidth = window.innerWidth;
  let intro: gsap.core.Timeline | null = null;
  let copyTween: gsap.core.Tween | null = null;
  let copyTrigger: ScrollTrigger | null = null;
  let copyRevealed = false;
  let layoutReady = false;
  let copyLines: HTMLElement[] = [];
  let lastCopyWidth = 0;
  let destroyed = false;

  const metrics = () => {
    const mobile = matchMedia('(max-width: 700px)').matches;
    const width = composition.getBoundingClientRect().width;
    return {
      radiusX: mobile ? Math.min(window.innerWidth * 0.24, 95) : Math.min(205, width * 0.31),
      radiusY: mobile ? 8 : 16,
      radiusZ: mobile ? 110 : 145,
      minScale: mobile ? 0.72 : 0.88,
      maxScale: mobile ? 1 : 1.03,
      duration: 10,
    };
  };

  const pointAt = (progress: number, index: number): OrbitPoint => {
    const { radiusX, radiusY, radiusZ, minScale, maxScale } = metrics();
    const phase = index * ((Math.PI * 2) / cards.length);
    const angle = progress * Math.PI * 2 + phase;
    const z = Math.sin(angle) * radiusZ;
    const depth = (z + radiusZ) / (radiusZ * 2);
    return {
      x: Math.cos(angle) * radiusX,
      y: Math.sin(angle * 2) * radiusY,
      z,
      scale: minScale + depth * (maxScale - minScale),
      opacity: 0.86 + depth * 0.14,
    };
  };

  const renderOrbit = (progress: number) => {
    cards.forEach((card, index) => {
      const point = pointAt(progress, index);
      card.style.transform = `translate3d(calc(-50% + ${point.x.toFixed(2)}px), calc(-50% + ${point.y.toFixed(2)}px), ${point.z.toFixed(2)}px) scale(${point.scale.toFixed(4)})`;
      card.style.opacity = point.opacity.toFixed(3);
      card.style.zIndex = String(1000 + Math.round(point.z));
    });
  };

  const tick = () => {
    const now = performance.now();
    if (!lastTick) lastTick = now;
    const elapsed = Math.min(64, now - lastTick);
    lastTick = now;
    orbitProgress = (orbitProgress + elapsed / (metrics().duration * 1000)) % 1;
    renderOrbit(orbitProgress);
  };

  const stopOrbit = () => {
    if (!tickerActive) return;
    tickerActive = false;
    gsap.ticker.remove(tick);
    cards.forEach((card) => { card.style.willChange = 'auto'; });
    lastTick = 0;
  };

  const syncOrbitState = () => {
    const shouldPlay = visible && !overlayOpen && entered && assembled && !document.hidden && !reduced.matches;
    if (shouldPlay && !tickerActive) {
      tickerActive = true;
      cards.forEach((card) => { card.style.willChange = 'transform, opacity'; });
      lastTick = performance.now();
      gsap.ticker.add(tick);
    } else if (!shouldPlay) {
      stopOrbit();
    }
  };

  const splitCopyIntoRenderedLines = () => {
    const measurement = document.createElement('span');
    measurement.className = 'creative-copy__measure';
    measurement.setAttribute('aria-hidden', 'true');

    const words = copyText.split(' ');
    const wordElements = words.map((word, index) => {
      const wordElement = document.createElement('span');
      wordElement.className = 'creative-copy__word';
      wordElement.textContent = word;
      measurement.append(wordElement);
      if (index < words.length - 1) measurement.append(document.createTextNode(' '));
      return wordElement;
    });

    copy.replaceChildren(measurement);

    const renderedLines: string[][] = [];
    const lineTops: number[] = [];
    wordElements.forEach((wordElement, index) => {
      const top = wordElement.getBoundingClientRect().top;
      let lineIndex = lineTops.findIndex((lineTop) => Math.abs(lineTop - top) <= 1);
      if (lineIndex === -1) {
        lineIndex = renderedLines.length;
        renderedLines.push([]);
        lineTops.push(top);
      }
      renderedLines[lineIndex].push(words[index]);
    });

    const accessibleText = document.createElement('span');
    accessibleText.className = 'creative-copy__sr';
    accessibleText.textContent = copyText;

    const visualLines = document.createElement('span');
    visualLines.className = 'creative-copy__visual';
    visualLines.setAttribute('aria-hidden', 'true');
    copyLines = renderedLines.map((lineWords) => {
      const mask = document.createElement('span');
      mask.className = 'line-mask creative-copy__line-mask';
      const line = document.createElement('span');
      line.className = 'creative-copy__line';
      line.textContent = lineWords.join(' ');
      mask.append(line);
      visualLines.append(mask);
      return line;
    });

    copy.replaceChildren(accessibleText, visualLines);
    lastCopyWidth = copy.getBoundingClientRect().width;
  };

  const setupCopyReveal = () => {
    copyTrigger?.kill();
    copyTrigger = null;
    copyTween?.kill();
    copyTween = null;
    gsap.killTweensOf(copyLines);

    if (!copyLines.length) splitCopyIntoRenderedLines();

    if (reduced.matches || copyRevealed) {
      copyRevealed = true;
      gsap.set(copyLines, { clearProps: 'transform,opacity' });
      return;
    }

    if (!layoutReady) return;

    copyTween = gsap.fromTo(copyLines,
      { yPercent: 110, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.85,
        stagger: 0.12,
        ease: 'power3.out',
        paused: true,
        onStart: () => { copyRevealed = true; },
        onComplete: () => gsap.set(copyLines, { clearProps: 'transform,opacity' }),
      });
    copyTrigger = ScrollTrigger.create({
      trigger: copy,
      start: 'top 90%',
      animation: copyTween,
      toggleActions: 'play none none none',
      once: true,
    });
    copyTrigger.refresh();
  };

  const rebuildCopyReveal = () => {
    copyTrigger?.kill();
    copyTween?.kill();
    gsap.killTweensOf(copyLines);
    splitCopyIntoRenderedLines();
    setupCopyReveal();
  };

  const settledCopyRebuild = createSettledViewportTask(() => {
    if (!destroyed) rebuildCopyReveal();
  });

  const copyResizeObserver = new ResizeObserver(([entry]) => {
    if (!layoutReady || !entry) return;
    const nextWidth = entry.contentRect.width;
    if (Math.abs(nextWidth - lastCopyWidth) < 8) return;
    lastCopyWidth = nextWidth;
    settledCopyRebuild.schedule();
  });

  const prepare = () => {
    intro?.kill();
    stopOrbit();
    assembled = false;
    gsap.set(cards, {
      xPercent: -50,
      yPercent: -50,
      x: 0,
      y: 0,
      z: 0,
      scale: 0.84,
      opacity: 1,
      rotationX: 0,
      rotationY: 0,
      rotationZ: 0,
      transformOrigin: '50% 50%',
      force3D: true,
    });
    setMaskedHeadingInitialState(headingLines, reduced.matches);

    if (reduced.matches) {
      orbitProgress = 0;
      renderOrbit(orbitProgress);
      entered = true;
      assembled = true;
      return;
    }

    const assembledPoints = cards.map((_, index) => pointAt(0, index));
    intro = gsap.timeline({
      paused: true,
      onComplete: () => {
        orbitProgress = 0;
        renderOrbit(orbitProgress);
        assembled = true;
        syncOrbitState();
      },
    })
      .to(headingLines, maskedHeadingRevealVars())
      .to(cards, {
        x: (index: number) => assembledPoints[index].x,
        y: (index: number) => assembledPoints[index].y,
        z: (index: number) => assembledPoints[index].z,
        scale: (index: number) => assembledPoints[index].scale,
        opacity: (index: number) => assembledPoints[index].opacity,
        duration: 1.05,
        stagger: 0.07,
        ease: 'power3.inOut',
      }, 0.18);
  };

  const observer = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !entered) {
      entered = true;
      intro?.play();
    }
    syncOrbitState();
  }, { threshold: 0.1, rootMargin: '15% 0px 15% 0px' });

  const onOverlay = (event: Event) => {
    overlayOpen = Boolean((event as CustomEvent<{ open: boolean }>).detail.open);
    syncOrbitState();
  };
  const onVisibility = () => syncOrbitState();
  const onResize = () => {
    const nextWidth = window.innerWidth;
    if (Math.abs(nextWidth - lastViewportWidth) < 8) return;
    lastViewportWidth = nextWidth;
    renderOrbit(orbitProgress);
  };
  const onReduced = () => {
    entered = reduced.matches;
    prepare();
    if (layoutReady || reduced.matches) setupCopyReveal();
    if (visible && !reduced.matches) {
      entered = true;
      intro?.play();
    }
  };

  prepare();
  observer.observe(composition);
  window.addEventListener('site-overlay', onOverlay);
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);
  reduced.addEventListener('change', onReduced);

  return {
    refresh: async () => {
      layoutReady = true;
      await document.fonts.ready;
      if (destroyed) return;
      rebuildCopyReveal();
      copyResizeObserver.observe(copy);
    },
    destroy: () => {
      destroyed = true;
      observer.disconnect();
      copyResizeObserver.disconnect();
      settledCopyRebuild.cancel();
      intro?.kill();
      copyTrigger?.kill();
      copyTween?.kill();
      gsap.killTweensOf(copyLines);
      stopOrbit();
      window.removeEventListener('site-overlay', onOverlay);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      reduced.removeEventListener('change', onReduced);
    },
  };
}
