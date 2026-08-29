const touchPointer = matchMedia('(hover: none), (pointer: coarse)');

export const usesNativeTouchScrolling = () => (
  touchPointer.matches || navigator.maxTouchPoints > 0
);

let touchActive = false;
let lastTouchScrollAt = Number.NEGATIVE_INFINITY;

if (usesNativeTouchScrolling()) {
  document.addEventListener('touchstart', () => {
    touchActive = true;
  }, { passive: true, capture: true });
  document.addEventListener('touchend', () => {
    touchActive = false;
  }, { passive: true, capture: true });
  document.addEventListener('touchcancel', () => {
    touchActive = false;
  }, { passive: true, capture: true });
  window.addEventListener('scroll', () => {
    lastTouchScrollAt = performance.now();
  }, { passive: true });
}

export const isTouchScrollActive = () => (
  usesNativeTouchScrolling()
  && (touchActive || performance.now() - lastTouchScrollAt < 180)
);

export function createSettledViewportTask(task: () => void, delay = 220) {
  let timer = 0;

  const run = () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (isTouchScrollActive()) {
        run();
        return;
      }
      task();
    }, delay);
  };

  return {
    schedule: run,
    cancel: () => window.clearTimeout(timer),
  };
}
