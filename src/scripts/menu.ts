import gsap from 'gsap';
import type { VideoController } from './video-player';
import { lockScroll, setPageInert, trapFocus } from './accessibility';

type MenuState = 'closed' | 'opening' | 'open' | 'closing';
type CardGeometry = { left: number; bottom: number; width: number; height: number };

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
  let activeIndex: number | null = null;
  let cardLayoutTween: gsap.core.Tween | null = null;
  let lockedCardGeometry: CardGeometry[] | null = null;
  let mobileObserver: IntersectionObserver | null = null;
  let hitArea: DOMRect | null = null;

  const setMenuState = (state: MenuState) => { panel.dataset.menuState = state; };
  panel.inert = true;
  gsap.set(panel, { autoAlpha: 0, pointerEvents: 'none' });

  const unlockDesktopCardLayout = () => {
    cardLayoutTween?.kill();
    cardLayoutTween = null;
    lockedCardGeometry = null;
    row.classList.remove('has-locked-card-layout');
    gsap.set(cards, { clearProps: 'position,left,bottom,width,height,flex,transform,transformOrigin' });
  };

  const lockDesktopCardLayout = () => {
    if (!isDesktop.matches || lockedCardGeometry) return;
    const rowBounds = row.getBoundingClientRect();
    lockedCardGeometry = cards.map((card) => {
      const bounds = card.getBoundingClientRect();
      return {
        left: bounds.left - rowBounds.left,
        bottom: rowBounds.bottom - bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      };
    });
    row.classList.add('has-locked-card-layout');
    gsap.set(cards, {
      position: 'absolute',
      left: (cardIndex) => lockedCardGeometry![cardIndex].left,
      bottom: (cardIndex) => lockedCardGeometry![cardIndex].bottom,
      width: (cardIndex) => lockedCardGeometry![cardIndex].width,
      height: (cardIndex) => lockedCardGeometry![cardIndex].height,
      flex: 'none',
      x: 0,
      y: 0,
    });
  };

  const targetCardGeometry = (nextIndex: number | null) => {
    if (!lockedCardGeometry) return [];
    const firstLeft = lockedCardGeometry[0].left;
    const gap = lockedCardGeometry.length > 1
      ? lockedCardGeometry[1].left - lockedCardGeometry[0].left - lockedCardGeometry[0].width
      : 0;
    const availableWidth = lockedCardGeometry.reduce((total, geometry) => total + geometry.width, 0);
    const totalWeight = nextIndex === null ? cards.length : cards.length + 0.5;
    const unitWidth = availableWidth / totalWeight;
    let left = firstLeft;

    return cards.map((_, cardIndex) => {
      const active = cardIndex === nextIndex;
      const width = unitWidth * (active ? 1.5 : 1);
      const height = nextIndex === null
        ? Math.min(window.innerHeight * 0.44, 430)
        : active
          ? Math.min(window.innerHeight * 0.58, 560)
          : Math.min(window.innerHeight * 0.42, 410);
      const geometry = { left, bottom: lockedCardGeometry![cardIndex].bottom, width, height };
      left += width + gap;
      return geometry;
    });
  };

  const setActiveCard = (nextIndex: number | null, animate = true) => {
    if (nextIndex === activeIndex || !isDesktop.matches) return;

    if (open) lockDesktopCardLayout();
    activeIndex = nextIndex;
    cards.forEach((card, cardIndex) => {
      card.classList.toggle('is-active', nextIndex === cardIndex);
      card.classList.toggle('is-muted', nextIndex !== null && nextIndex !== cardIndex);
    });

    const targetGeometry = targetCardGeometry(nextIndex);
    cardLayoutTween?.kill();
    cardLayoutTween = null;
    if (targetGeometry.length) {
      const layoutVars = {
        left: (cardIndex: number) => targetGeometry[cardIndex].left,
        bottom: (cardIndex: number) => targetGeometry[cardIndex].bottom,
        width: (cardIndex: number) => targetGeometry[cardIndex].width,
        height: (cardIndex: number) => targetGeometry[cardIndex].height,
      };
      if (animate) {
        const nextTween = gsap.to(cards, {
          ...layoutVars,
          duration: 0.6,
          ease: 'power3.inOut',
          overwrite: true,
          onComplete: () => {
            if (cardLayoutTween === nextTween) cardLayoutTween = null;
          },
        });
        cardLayoutTween = nextTween;
      } else {
        gsap.set(cards, layoutVars);
      }
    }

    gsap.to(images, {
      scale: (cardIndex) => cardIndex === nextIndex ? 1.045 : 1,
      opacity: (cardIndex) => nextIndex !== null && cardIndex !== nextIndex ? 0.72 : 1,
      duration: animate ? 0.36 : 0,
      ease: 'power2.inOut',
      overwrite: true,
    });
  };

  const measureHitArea = () => {
    hitArea = row.getBoundingClientRect();
  };

  const onRowPointerMove = (event: PointerEvent) => {
    if (!isDesktop.matches) return;
    if (!hitArea) measureHitArea();
    if (!hitArea) return;

    const activeHeight = Math.min(window.innerHeight * 0.58, 560);
    const insideCardBand = event.clientX >= hitArea.left
      && event.clientX <= hitArea.right
      && event.clientY >= hitArea.bottom - activeHeight
      && event.clientY <= hitArea.bottom;

    if (!insideCardBand) {
      setActiveCard(null);
      return;
    }

    // Stable equal-width lanes include the CSS gaps and never resize with the
    // visual cards, preventing hover-boundary feedback during the tween.
    const progress = (event.clientX - hitArea.left) / hitArea.width;
    const nextIndex = Math.min(cards.length - 1, Math.max(0, Math.floor(progress * cards.length)));
    setActiveCard(nextIndex);
  };

  const onRowPointerLeave = () => {
    if (!isDesktop.matches) return;
    setActiveCard(null);
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
      lockDesktopCardLayout();
      gsap.set(panel, { pointerEvents: 'auto' });
      measureHitArea();
      closeButton.focus();
    } })
      .set(panel, { autoAlpha: 1, pointerEvents: 'none' })
      .set(background, { scaleX: 0, transformOrigin: 'right center' })
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
        setActiveCard(null, false);
        unlockDesktopCardLayout();
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
      .to(background, { scaleX: 0, transformOrigin: 'right center', duration: 0.42, ease: 'power4.inOut' }, 0.16);
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
    unlockDesktopCardLayout();
    cards.forEach((card) => card.classList.remove('is-near-center'));
    activeIndex = null;
    cards.forEach((card) => card.classList.remove('is-active', 'is-muted'));
    gsap.killTweensOf(images);
    gsap.set(images, { clearProps: 'transform,opacity' });
    if (isDesktop.matches) return;
    hitArea = null;
    mobileObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => entry.target.classList.toggle('is-near-center', entry.isIntersecting));
    }, { root: row, rootMargin: '-36% 0px -36% 0px', threshold: 0.01 });
    cards.forEach((card) => mobileObserver?.observe(card));
  };

  trigger.addEventListener('click', openMenu);
  closeButton.addEventListener('click', () => closeMenu());
  document.addEventListener('keydown', onKeydown);
  row.addEventListener('pointermove', onRowPointerMove);
  row.addEventListener('pointerleave', onRowPointerLeave);
  const onResize = () => {
    hitArea = null;
    if (!open || !isDesktop.matches) return;
    const currentIndex = activeIndex;
    unlockDesktopCardLayout();
    lockDesktopCardLayout();
    activeIndex = currentIndex === null ? 0 : null;
    setActiveCard(currentIndex, false);
    measureHitArea();
  };
  window.addEventListener('resize', onResize);
  cards.forEach((card) => {
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
      row.removeEventListener('pointermove', onRowPointerMove);
      row.removeEventListener('pointerleave', onRowPointerLeave);
      window.removeEventListener('resize', onResize);
      unlockDesktopCardLayout();
    },
  };
}
