import gsap from 'gsap';
import Flip from 'gsap/Flip';
import type { VideoController } from './video-player';
import { lockScroll, setPageInert, trapFocus } from './accessibility';

type MenuState = 'closed' | 'opening' | 'open' | 'closing';

export function initMenu(player: VideoController) {
  const panel = document.querySelector<HTMLElement>('#site-menu')!;
  const background = panel.querySelector<HTMLElement>('.site-menu__background')!;
  const trigger = document.querySelector<HTMLButtonElement>('#menu-trigger')!;
  const closeButton = document.querySelector<HTMLButtonElement>('#menu-close')!;
  const header = panel.querySelector<HTMLElement>('.site-menu__header')!;
  const row = panel.querySelector<HTMLElement>('#menu-cards')!;
  const cards = Array.from(panel.querySelectorAll<HTMLAnchorElement>('[data-menu-card]'));
  const images = cards.map((card) => card.querySelector<HTMLImageElement>('img')!);
  const isDesktop = matchMedia('(hover: hover) and (pointer: fine)');
  let open = false;
  let animating = false;
  let restoreScroll: (() => void) | null = null;
  let cinemaIsOpen = () => false;
  let activeIndex = -1;
  let cardFlip: gsap.core.Timeline | null = null;
  let mobileObserver: IntersectionObserver | null = null;

  const setMenuState = (state: MenuState) => { panel.dataset.menuState = state; };
  panel.inert = true;
  gsap.set(panel, { autoAlpha: 0, pointerEvents: 'none' });

  const setActiveCard = (index: number, animate = true) => {
    if (index === activeIndex || !isDesktop.matches) return;

    const state = animate ? Flip.getState(cards, { simple: true }) : null;
    cardFlip?.kill();
    cardFlip = null;
    activeIndex = index;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-active', index === cardIndex);
      card.classList.toggle('is-muted', index >= 0 && index !== cardIndex);
    });

    if (state) {
      cardFlip = Flip.from(state, {
        duration: 0.42,
        ease: 'power2.inOut',
        absolute: false,
        nested: true,
        prune: true,
        scale: true,
        simple: true,
        onComplete: () => { cardFlip = null; },
      });
    } else {
      Flip.killFlipsOf(cards);
      gsap.set(cards, { clearProps: 'transform' });
    }

    gsap.to(images, {
      scale: (cardIndex) => cardIndex === index ? 1.045 : 1,
      opacity: (cardIndex) => index >= 0 && cardIndex !== index ? 0.72 : 1,
      duration: animate ? 0.36 : 0,
      ease: 'power2.inOut',
      overwrite: true,
    });
  };

  const openMenu = () => {
    if (open || animating || cinemaIsOpen()) return;
    open = true;
    animating = true;
    document.body.classList.add('is-menu-open');
    setMenuState('opening');
    panel.inert = false;
    restoreScroll = lockScroll();
    setPageInert(true);
    player.pause();
    window.dispatchEvent(new CustomEvent('site-overlay', { detail: { open: true } }));
    trigger.setAttribute('aria-expanded', 'true');
    panel.setAttribute('aria-hidden', 'false');
    panel.classList.add('is-open');
    gsap.timeline({ onComplete: () => {
      animating = false;
      setMenuState('open');
      gsap.set(panel, { pointerEvents: 'auto' });
      closeButton.focus();
    } })
      .set(panel, { autoAlpha: 1, pointerEvents: 'none' })
      .set(background, { scaleX: 0, transformOrigin: 'left center' })
      .set([header, cards], { opacity: 0 })
      .to(background, { scaleX: 1, duration: 0.62, ease: 'power4.inOut' })
      .to(header, { opacity: 1, duration: 0.24, ease: 'power2.out' }, 0.16)
      .fromTo(cards, { y: '18vh', opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.055, ease: 'power3.out' }, 0.38);
  };

  const closeMenu = (destination?: string) => {
    if (!open || animating) return;
    animating = true;
    setMenuState('closing');
    panel.inert = true;
    gsap.set(panel, { pointerEvents: 'none' });
    gsap.timeline({
      onComplete: () => {
        open = false;
        animating = false;
        panel.classList.remove('is-open');
        document.body.classList.remove('is-menu-open');
        panel.setAttribute('aria-hidden', 'true');
        setMenuState('closed');
        gsap.set(panel, { autoAlpha: 0, pointerEvents: 'none' });
        trigger.setAttribute('aria-expanded', 'false');
        setPageInert(false);
        restoreScroll?.();
        restoreScroll = null;
        window.dispatchEvent(new CustomEvent('site-overlay', { detail: { open: false } }));
        player.mute();
        player.play();
        setActiveCard(-1, false);
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
    cardFlip?.kill();
    cardFlip = null;
    Flip.killFlipsOf(cards);
    cards.forEach((card) => card.classList.remove('is-near-center'));
    activeIndex = -1;
    cards.forEach((card) => card.classList.remove('is-active', 'is-muted'));
    gsap.killTweensOf(images);
    gsap.set(images, { clearProps: 'transform,opacity' });
    if (isDesktop.matches) return;
    mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-near-center', entry.isIntersecting));
    }, { root: row, rootMargin: '-36% 0px -36% 0px', threshold: 0.01 });
    cards.forEach((card) => mobileObserver?.observe(card));
  };

  trigger.addEventListener('click', openMenu);
  closeButton.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', onKeydown);
  const cardEnterHandlers = cards.map((_card, index) => () => setActiveCard(index));
  const cardLeaveHandlers = cards.map((_card, index) => (event: PointerEvent) => {
    if (activeIndex !== index) return;
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest('[data-menu-card]')) return;
    setActiveCard(-1);
  });
  cards.forEach((card, index) => {
    card.addEventListener('pointerenter', cardEnterHandlers[index]);
    card.addEventListener('pointerleave', cardLeaveHandlers[index]);
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
      document.body.classList.remove('is-menu-open');
      mobileObserver?.disconnect();
      isDesktop.removeEventListener('change', setupMobileEmphasis);
      document.removeEventListener('keydown', onKeydown);
      trigger.removeEventListener('click', openMenu);
      cards.forEach((card, index) => {
        card.removeEventListener('pointerenter', cardEnterHandlers[index]);
        card.removeEventListener('pointerleave', cardLeaveHandlers[index]);
      });
      cardFlip?.kill();
      Flip.killFlipsOf(cards);
    },
  };
}
