import gsap from 'gsap';

export const setMaskedHeadingInitialState = (
  lines: gsap.TweenTarget,
  reducedMotion: boolean,
) => gsap.set(lines, { yPercent: reducedMotion ? 0 : 110 });

export const maskedHeadingRevealVars = (): gsap.TweenVars => ({
  yPercent: 0,
  duration: 1.08,
  stagger: 0.09,
  ease: 'power3.out',
});
