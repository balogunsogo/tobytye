import gsap from 'gsap';
import Flip from 'gsap/Flip';
import type { YouTubeController } from './youtube-player';
import { lockScroll, setPageInert, trapFocus } from './accessibility';

export function initMenu(player: YouTubeController) {
  const panel = document.querySelector<HTMLElement>('#site-menu')!;
  const background = panel.querySelector<HTMLElement>('.site-menu__background')!;
  const trigger = document.querySelector<HTMLButtonElement>('#menu-trigger')!;
  const closeButton = document.querySelector<HTMLButtonElement>('#menu-close')!;
  const rule = panel.querySelector<HTMLElement>('.site-menu__rule')!;
  const header = panel.querySelector<HTMLElement>('.site-menu__header')!;
  const row = panel.querySelector<HTMLElement>('#menu-cards')!;
  const cards = Array.from(panel.querySelectorAll<HTMLAnchorElement>('[data-menu-card]'));
  const isDesktop = matchMedia('(hover: hover) and (pointer: fine)');
  let open = false;
  let animating = false;
  let restoreScroll: (() => void) | null = null;
  let cinemaIsOpen = () => false;
  let activeIndex = -1;
  let mobileObserver: IntersectionObserver | null = null;

  const setActiveCard = (index: number) => {
    if (index === activeIndex || !isDesktop.matches) return;
    const state = Flip.getState(cards);
    activeIndex = index;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-active', index === cardIndex);
      card.classList.toggle('is-muted', index >= 0 && index !== cardIndex);
    });
    Flip.from(state, { duration: 0.48, ease: 'power3.out', absolute: false });
    cards.forEach((card, cardIndex) => {
      gsap.to(card.querySelector('img'), { scale: cardIndex === index ? 1.045 : 1, opacity: index >= 0 && cardIndex !== index ? 0.72 : 1, duration: 0.4, ease: 'power2.out' });
      gsap.to(card.querySelector('.menu-card__label'), { yPercent: cardIndex === index ? 0 : 110, opacity: cardIndex === index ? 1 : 0, duration: 0.35, ease: 'power3.out' });
    });
  };

  const openMenu = () => {
    if (open || animating || cinemaIsOpen()) return;
    open = true;
    animating = true;
    restoreScroll = lockScroll();
    setPageInert(true);
    player.pause();
    window.dispatchEvent(new CustomEvent('site-overlay', { detail: { open: true } }));
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-open');
    gsap.timeline({ onComplete: () => { animating = false; closeButton.focus(); } })
      .set(panel, { visibility: 'visible' })
      .set(background, { scaleX: 0, transformOrigin: 'left center' })
      .set([header, cards], { opacity: 0 })
      .set(rule, { scaleX: 0, transformOrigin: 'left center' })
      .to(background, { scaleX: 1, duration: 0.62, ease: 'power4.inOut' })
      .to(header, { opacity: 1, duration: 0.24, ease: 'power2.out' }, 0.16)
      .to(rule, { scaleX: 1, duration: 0.45, ease: 'power3.out' }, 0.3)
      .fromTo(cards, { y: '18vh', opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.055, ease: 'power3.out' }, 0.38);
  };

  const closeMenu = (destination?: string) => {
    if (!open || animating) return;
    animating = true;
    gsap.timeline({
      onComplete: () => {
        open = false;
        animating = false;
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
        gsap.set(panel, { visibility: 'hidden' });
        trigger.setAttribute('aria-expanded', 'false');
        setPageInert(false);
        restoreScroll?.();
        restoreScroll = null;
        window.dispatchEvent(new CustomEvent('site-overlay', { detail: { open: false } }));
        player.mute();
        player.play();
        setActiveCard(-1);
        if (destination) {
          const target = document.querySelector<HTMLElement>(destination);
          if (target) {
            history.pushState(null, '', destination);
            requestAnimationFrame(() => target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }));
          }
        } else {
          trigger.focus();
        }
      },
    })
      .to(cards, { y: '7vh', opacity: 0, duration: 0.24, stagger: 0.025, ease: 'power2.in' })
      .to(rule, { scaleX: 0, duration: 0.2, ease: 'power2.in' }, 0.04)
      .to(header, { opacity: 0, duration: 0.16 }, 0.08)
      .to(background, { scaleX: 0, transformOrigin: 'left center', duration: 0.42, ease: 'power4.inOut' }, 0.16);
  };

  const onKeydown = (event: KeyboardEvent) => {
    if (!open) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    } else {
      trapFocus(panel, event);
    }
  };

  const setupMobileEmphasis = () => {
    mobileObserver?.disconnect();
    cards.forEach((card) => card.classList.remove('is-near-center'));
    if (isDesktop.matches) return;
    activeIndex = -1;
    cards.forEach((card) => card.classList.remove('is-active', 'is-muted'));
    gsap.set(cards.map((card) => card.querySelector('img')), { clearProps: 'transform,opacity' });
    gsap.set(cards.map((card) => card.querySelector('.menu-card__label')), { clearProps: 'transform,opacity' });
    mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-near-center', entry.isIntersecting));
    }, { root: row, rootMargin: '-36% 0px -36% 0px', threshold: 0.01 });
    cards.forEach((card) => mobileObserver?.observe(card));
  };

  trigger.addEventListener('click', openMenu);
  closeButton.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', onKeydown);
  row.addEventListener('pointerleave', () => setActiveCard(-1));
  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', () => setActiveCard(index));
    card.addEventListener('click', (event) => {
      event.preventDefault();
      closeMenu(card.hash);
    });
  });
  isDesktop.addEventListener('change', setupMobileEmphasis);
  setupMobileEmphasis();

  return {
    isOpen: () => open,
    setCinemaOpen: (getter: () => boolean) => { cinemaIsOpen = getter; },
    close: () => closeMenu(),
    destroy: () => {
      mobileObserver?.disconnect();
      isDesktop.removeEventListener('change', setupMobileEmphasis);
      document.removeEventListener('keydown', onKeydown);
      trigger.removeEventListener('click', openMenu);
    },
  };
}
