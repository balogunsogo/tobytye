import gsap from 'gsap';

const loaderImages = Array.from({ length: 6 }, (_, index) => `/assets/${encodeURIComponent(`Preloader ${index + 1}.png`)}`);
const sceneImages = Array.from({ length: 3 }, (_, index) => `/assets/${encodeURIComponent(`Animated ${index + 1}.png`)}`);
const menuImages = Array.from({ length: 4 }, (_, index) => `/assets/${encodeURIComponent(`Menu ${index + 1}.png`)}`);

const loadImage = (src: string) => new Promise<void>((resolve) => {
  const image = new Image();
  const done = () => resolve();
  image.onload = async () => {
    try { await image.decode(); } catch { /* Decode support/failure is non-blocking. */ }
    done();
  };
  image.onerror = done;
  image.src = src;
});

const waitForFonts = async () => {
  if (!document.fonts) return;
  await Promise.allSettled([
    document.fonts.load('500 1rem "Instrument Sans"'),
    document.fonts.load('italic 500 1rem "Instrument Sans"'),
    document.fonts.ready,
  ]);
};

export async function startLoader(playerReady: Promise<boolean>): Promise<void> {
  const loader = document.querySelector<HTMLElement>('#loader');
  const counter = document.querySelector<HTMLOutputElement>('#loader-counter');
  const layers = Array.from(document.querySelectorAll<HTMLElement>('[data-loader-image]'));
  if (!loader || !counter) return;
  document.documentElement.classList.add('is-loading');
  document.body.classList.add('is-loading');

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const milestones = [
    ...loaderImages.map(loadImage),
    ...sceneImages.map(loadImage),
    ...menuImages.map(loadImage),
    waitForFonts(),
    playerReady,
  ];
  let settled = 0;
  milestones.forEach((milestone) => void Promise.resolve(milestone).finally(() => { settled += 1; }));

  const start = performance.now();
  const minDuration = 2900;
  const maxDuration = 6000;
  let displayed = 0;
  let frame = 0;

  await new Promise<void>((resolve) => {
    const update = (now: number) => {
      const elapsed = now - start;
      const readiness = settled / milestones.length;
      const timeFloor = Math.min(0.93, elapsed / minDuration * 0.93);
      const canFinish = (settled === milestones.length && elapsed >= minDuration) || elapsed >= maxDuration;
      const target = canFinish ? 1 : Math.min(0.97, Math.max(readiness * 0.94, timeFloor));
      displayed += (target - displayed) * (reduced ? 0.42 : 0.075);
      if (target === 1 && displayed > 0.998) displayed = 1;

      const percent = Math.round(displayed * 100);
      counter.value = `${percent}%`;
      counter.textContent = `${percent}%`;

      if (!reduced) {
        layers.slice(1).forEach((layer, index) => {
          const threshold = [0.18, 0.36, 0.54, 0.72, 0.88][index];
          const reveal = Math.min(1, Math.max(0, (displayed - threshold) / 0.15));
          layer.style.clipPath = `inset(${(1 - reveal) * 100}% 0 0 0)`;
        });
      }

      if (displayed === 1) resolve();
      else frame = requestAnimationFrame(update);
    };
    frame = requestAnimationFrame(update);
  });

  cancelAnimationFrame(frame);
  await new Promise((resolve) => setTimeout(resolve, reduced ? 100 : 320));
  await gsap.to(loader, { yPercent: -100, duration: reduced ? 0.18 : 0.75, ease: 'power3.inOut' });
  loader.setAttribute('aria-hidden', 'true');
  loader.style.display = 'none';
  document.documentElement.classList.remove('is-loading');
  document.body.classList.remove('is-loading');
}
