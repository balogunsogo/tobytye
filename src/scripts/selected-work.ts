import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { maskedHeadingRevealVars, setMaskedHeadingInitialState } from './masked-heading-reveal';
import { createSettledViewportTask } from './viewport-stability';

type ArtworkShape = 'square' | 'circle';

type SelectedProject = {
  title: string;
  description: string;
  category: string;
  categoryClass: string;
  image: string;
  alt: string;
  shape: ArtworkShape;
};

type Story = {
  category: 'Thinking' | 'News';
  title: string;
  description: string;
  image: string;
  alt: string;
  shape: ArtworkShape;
};

export const selectedProjects: SelectedProject[] = [
  {
    title: 'FannDrop',
    description: 'The next big thing in music streaming.',
    category: 'Music',
    categoryClass: 'music',
    image: '/assets/fann-drop.png',
    alt: 'Colorful music genre campaign artwork',
    shape: 'square',
  },
  {
    title: 'gamp',
    description: 'Insurance cover for your beloved personal tech.',
    category: 'Personal Tech',
    categoryClass: 'personal-tech',
    image: '/assets/gamp.png',
    alt: 'Green personal technology insurance campaign artwork',
    shape: 'circle',
  },
  {
    title: 'Upace',
    description: 'The complete wellness ecosystem.',
    category: 'Wellness',
    categoryClass: 'wellness',
    image: '/assets/upace.png',
    alt: 'Blue wellness campaign portrait artwork',
    shape: 'circle',
  },
  {
    title: 'LaunchT',
    description: 'Powering the future of mobility.',
    category: 'Mobility',
    categoryClass: 'launcht',
    image: '/assets/launcht.png',
    alt: 'Green mobility campaign typography artwork',
    shape: 'square',
  },
  {
    title: 'Sarah Kassim',
    description: 'Sarah Kassim. That’s the name.',
    category: 'Celebrity',
    categoryClass: 'celebrity',
    image: '/assets/sarah-kassim.png',
    alt: 'Sarah Kassim celebrity campaign portrait',
    shape: 'square',
  },
  {
    title: 'Chaufo',
    description: 'Ride ‘n’ Vibe.',
    category: 'Mobility',
    categoryClass: 'chaufo',
    image: '/assets/chaufo.png',
    alt: 'Chaufo ride and music campaign artwork',
    shape: 'circle',
  },
];

export const stories: Story[] = [
  {
    category: 'Thinking',
    title: 'FannDrop: The next big thing in music streaming',
    description: 'FannDrop reinvents music streaming with innovative, fresh new features.',
    image: '/assets/fann-drop.png',
    alt: 'Colorful music genre campaign artwork',
    shape: 'square',
  },
  {
    category: 'News',
    title: 'gamp: Insurance cover for your beloved tech',
    description: 'gamp offers personalized insurance protecting your valuable personal tech.',
    image: '/assets/gamp.png',
    alt: 'Green personal technology insurance campaign artwork',
    shape: 'circle',
  },
  {
    category: 'Thinking',
    title: 'Upace: The complete wellness ecosystem',
    description: 'Upace combines wellness tools to nurture both mind and body.',
    image: '/assets/upace.png',
    alt: 'Blue wellness campaign portrait artwork',
    shape: 'circle',
  },
  {
    category: 'News',
    title: 'LaunchT: Powering the future of mobility',
    description: 'LaunchT leads sustainable, technology-powered solutions for future mobility.',
    image: '/assets/launcht.png',
    alt: 'Green mobility campaign typography artwork',
    shape: 'square',
  },
  {
    category: 'Thinking',
    title: 'Sarah Kassim: The name behind the spotlight',
    description: 'Sarah Kassim inspires worldwide audiences with her vibrant energy.',
    image: '/assets/sarah-kassim.png',
    alt: 'Sarah Kassim celebrity campaign portrait',
    shape: 'square',
  },
  {
    category: 'News',
    title: 'Chaufo: Ride ‘n’ Vibe experience',
    description: 'Chaufo delivers comfort and music to enhance every ride.',
    image: '/assets/chaufo.png',
    alt: 'Chaufo ride and music campaign artwork',
    shape: 'circle',
  },
  {
    category: 'Thinking',
    title: 'Sarah Kassim: The name behind the spotlight',
    description: 'Sarah Kassim captivates audiences through talent, charm, and grace.',
    image: '/assets/sarah-kassim.png',
    alt: 'Sarah Kassim celebrity campaign portrait',
    shape: 'square',
  },
  {
    category: 'News',
    title: 'Chaufo: Ride ‘n’ Vibe experience',
    description: 'Chaufo combines smooth rides with expertly curated music playlists.',
    image: '/assets/chaufo.png',
    alt: 'Chaufo ride and music campaign artwork',
    shape: 'circle',
  },
];

const secondaryTags = ['Strategy', 'Marketing', 'Visual Identity'];
const contentSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const artwork = (image: string, alt: string, shape: ArtworkShape, imageClass: string) => `
  <div class="editorial-artwork editorial-artwork--${shape}">
    <img class="${imageClass}" src="${image}" alt="${alt}" width="419" height="420" loading="lazy" decoding="async" />
  </div>
`;

export const renderSelectedWork = () => `
  <section class="selected-work" id="work" aria-labelledby="selected-work-title" data-header-theme="light">
    <h2 class="editorial-heading" id="selected-work-title"><span class="line-mask"><span>Selected <em>Work</em></span></span></h2>
    <div class="selected-work__grid" role="list">
      ${selectedProjects.map((project) => {
        const projectId = `work-${contentSlug(project.title)}`;
        return `
          <article class="work-card" id="${projectId}" role="listitem" data-editorial-card>
            <a class="work-card__link" href="#${projectId}" aria-label="View ${project.title} project">
              ${artwork(project.image, project.alt, project.shape, 'work-card__art')}
              <div class="work-card__meta">
                <h3>${project.title}</h3>
                <p>${project.description}</p>
                <ul class="work-card__tags" aria-label="${project.title} project categories">
                  <li class="work-tag work-tag--primary work-tag--${project.categoryClass}">${project.category}</li>
                  ${secondaryTags.map((tag) => `<li class="work-tag">${tag}</li>`).join('')}
                </ul>
              </div>
              <span class="work-card__view" aria-hidden="true">View</span>
            </a>
          </article>
        `;
      }).join('')}
    </div>
  </section>
`;

export const renderStories = () => `
  <section class="stories" aria-labelledby="stories-title" data-header-theme="light">
    <h2 class="editorial-heading" id="stories-title">STORIES</h2>
    <div class="stories__grid" role="list">
      ${stories.map((story, index) => {
        const storyId = `story-${index + 1}-${contentSlug(story.title)}`;
        return `
          <article class="story-card" id="${storyId}" role="listitem" data-editorial-card>
            <a class="story-card__link" href="#${storyId}" aria-label="Read ${story.title}">
              ${artwork(story.image, story.alt, story.shape, 'story-card__art')}
              <div class="story-card__meta">
                <span class="story-category">${story.category}</span>
                <h3>${story.title}</h3>
                <p>${story.description}</p>
              </div>
              <span class="story-card__read" aria-hidden="true">Read</span>
            </a>
          </article>
        `;
      }).join('')}
    </div>
    <button class="stories__more" type="button" aria-label="See more stories">
      <span class="stories__more-label" aria-hidden="true">
        ${['See', 'More'].map((word) => `<span class="stories__more-word"><span class="stories__more-word-track"><span>${word}</span><span>${word}</span></span></span>`).join('')}
      </span>
    </button>
  </section>
`;

const initEditorialReveal = (section: HTMLElement) => {
  const heading = section.querySelector<HTMLElement>('.editorial-heading');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !heading) return () => undefined;

  gsap.set(heading, { y: 22, opacity: 0 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 78%',
      once: true,
    },
  }).to(heading, { y: 0, opacity: 1, duration: 0.58, ease: 'power3.out' });

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set(heading, { clearProps: 'transform,opacity' });
  };
};

const initSelectedWorkReveal = (section: HTMLElement) => {
  const heading = section.querySelector<HTMLElement>('.editorial-heading');
  const headingLines = heading
    ? Array.from(heading.querySelectorAll<HTMLElement>(':scope > .line-mask > span'))
    : [];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !heading || !headingLines.length) return () => undefined;

  setMaskedHeadingInitialState(headingLines, false);

  const headingTween = gsap.to(headingLines, {
    ...maskedHeadingRevealVars(),
    scrollTrigger: {
      trigger: heading,
      start: 'top 85%',
      toggleActions: 'play none none none',
      once: true,
    },
  });

  return () => {
    headingTween.scrollTrigger?.kill();
    headingTween.kill();
    gsap.set(heading, { clearProps: 'transform,opacity' });
  };
};

const groupCardsByVisualRow = (cards: HTMLElement[]) => {
  const rows: Array<{ top: number; cards: HTMLElement[] }> = [];
  cards.forEach((card) => {
    const top = card.getBoundingClientRect().top;
    const row = rows.find((candidate) => Math.abs(candidate.top - top) <= 2);
    if (row) row.cards.push(card);
    else rows.push({ top, cards: [card] });
  });
  return rows.sort((a, b) => a.top - b.top).map((row) => row.cards);
};

const initEditorialCardEffects = (
  section: HTMLElement,
  revealedCards: WeakSet<HTMLElement>,
) => {
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-editorial-card]'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !cards.length) return () => undefined;

  const rowAnimations = groupCardsByVisualRow(cards).map((row) => {
    const pendingCards = row.filter((card) => !revealedCards.has(card));
    if (!pendingCards.length) return null;

    const timeline = gsap.timeline({
      paused: true,
      onStart: () => pendingCards.forEach((card) => revealedCards.add(card)),
    }).fromTo(pendingCards,
      { autoAlpha: 0, y: 50 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 1,
        stagger: 0.18,
        ease: 'power3.out',
        immediateRender: true,
      });

    const trigger = ScrollTrigger.create({
      trigger: row[0],
      start: 'top 78%',
      animation: timeline,
      toggleActions: 'play none none none',
      once: true,
    });
    return { timeline, trigger };
  }).filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  return () => {
    rowAnimations.forEach(({ timeline, trigger }) => {
      trigger.kill();
      timeline.kill();
    });
    gsap.set(cards, { clearProps: 'transform,opacity,visibility' });
  };
};

type CursorCardHoverOptions = {
  gridSelector: string;
  cardSelector: string;
  indicatorSelector: string;
};

const initCursorCardHover = (section: HTMLElement, options: CursorCardHoverOptions) => {
  const { gridSelector, cardSelector, indicatorSelector } = options;
  const grid = section.querySelector<HTMLElement>(gridSelector);
  const cards = Array.from(section.querySelectorAll<HTMLElement>(cardSelector));
  const hoverCapable = matchMedia('(hover: hover) and (pointer: fine)');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!grid || !cards.length) return () => undefined;

  const cleanup: Array<() => void> = [];
  let activeCard: HTMLElement | null = null;

  const activate = (card: HTMLElement) => {
    if (activeCard === card) return;
    activeCard = card;
  };

  const deactivate = () => {
    activeCard = null;
  };

  cards.forEach((card) => {
    const indicator = card.querySelector<HTMLElement>(indicatorSelector);
    if (!indicator) return;

    gsap.set(indicator, { xPercent: -50, yPercent: -50, autoAlpha: 0, scale: 0.86 });
    const moveX = gsap.quickTo(indicator, 'x', { duration: reduced.matches ? 0 : 0.32, ease: 'power3.out' });
    const moveY = gsap.quickTo(indicator, 'y', { duration: reduced.matches ? 0 : 0.32, ease: 'power3.out' });

    const positionIndicator = (event: PointerEvent, immediate = false) => {
      const rect = card.getBoundingClientRect();
      const radiusX = Math.min(indicator.offsetWidth / 2, rect.width / 2);
      const radiusY = Math.min(indicator.offsetHeight / 2, rect.height / 2);
      const x = gsap.utils.clamp(radiusX, rect.width - radiusX, event.clientX - rect.left) - (rect.width / 2);
      const y = gsap.utils.clamp(radiusY, rect.height - radiusY, event.clientY - rect.top) - (rect.height / 2);
      if (immediate || reduced.matches) {
        gsap.set(indicator, { x, y });
      } else {
        moveX(x);
        moveY(y);
      }
    };

    const onPointerEnter = (event: PointerEvent) => {
      if (!hoverCapable.matches) return;
      activate(card);
      positionIndicator(event, true);
      gsap.to(indicator, {
        autoAlpha: 1,
        scale: 1,
        duration: reduced.matches ? 0 : 0.24,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };
    const onPointerMove = (event: PointerEvent) => {
      if (hoverCapable.matches && activeCard === card) positionIndicator(event);
    };
    const onPointerLeave = (event: PointerEvent) => {
      if (!hoverCapable.matches) return;
      const relatedTarget = event.relatedTarget;
      const nextCard = relatedTarget instanceof Element
        ? relatedTarget.closest<HTMLElement>(cardSelector)
        : null;
      if (nextCard && grid.contains(nextCard)) activate(nextCard);
      else deactivate();
      gsap.to(indicator, {
        autoAlpha: 0,
        scale: 0.86,
        duration: reduced.matches ? 0 : 0.2,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    };

    card.addEventListener('pointerenter', onPointerEnter);
    card.addEventListener('pointermove', onPointerMove);
    card.addEventListener('pointerleave', onPointerLeave);
    cleanup.push(() => {
      card.removeEventListener('pointerenter', onPointerEnter);
      card.removeEventListener('pointermove', onPointerMove);
      card.removeEventListener('pointerleave', onPointerLeave);
      gsap.killTweensOf(indicator);
    });
  });

  return () => {
    deactivate();
    cleanup.forEach((removeListeners) => removeListeners());
  };
};

export function initEditorialSections() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.selected-work, .stories'));
  const editorialImages = sections.flatMap((section) => (
    Array.from(section.querySelectorAll<HTMLElement>('.editorial-artwork img'))
  ));
  gsap.killTweensOf(editorialImages);
  gsap.set(editorialImages, { clearProps: 'transform,transformOrigin,translate,scale,rotate' });
  const destroyers = sections.map((section) => (
    section.classList.contains('selected-work')
      ? initSelectedWorkReveal(section)
      : initEditorialReveal(section)
  ));
  const revealedCards = new WeakSet<HTMLElement>();
  let destroyCardEffects: Array<() => void> = [];
  let refreshGeneration = 0;
  let lastViewportWidth = window.innerWidth;
  let destroyed = false;

  const clearCardEffects = () => {
    destroyCardEffects.forEach((destroy) => destroy());
    destroyCardEffects = [];
  };

  const refreshCardEffects = async () => {
    const generation = ++refreshGeneration;
    await document.fonts.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    if (destroyed || generation !== refreshGeneration) return;

    clearCardEffects();
    destroyCardEffects = sections.map((section) => initEditorialCardEffects(section, revealedCards));
    ScrollTrigger.refresh();
  };

  const settledRefresh = createSettledViewportTask(() => { void refreshCardEffects(); });

  const onResize = () => {
    const nextWidth = window.innerWidth;
    if (Math.abs(nextWidth - lastViewportWidth) < 8) return;
    lastViewportWidth = nextWidth;
    settledRefresh.schedule();
  };
  const selectedWork = sections.find((section) => section.classList.contains('selected-work'));
  const storiesSection = sections.find((section) => section.classList.contains('stories'));
  const destroyWorkCardHover = selectedWork
    ? initCursorCardHover(selectedWork, {
        gridSelector: '.selected-work__grid',
        cardSelector: '.work-card',
        indicatorSelector: '.work-card__view',
      })
    : () => undefined;
  const destroyStoryCardHover = storiesSection
    ? initCursorCardHover(storiesSection, {
        gridSelector: '.stories__grid',
        cardSelector: '.story-card',
        indicatorSelector: '.story-card__read',
      })
    : () => undefined;
  window.addEventListener('resize', onResize, { passive: true });
  return {
    refresh: refreshCardEffects,
    destroy: () => {
      destroyed = true;
      refreshGeneration += 1;
      settledRefresh.cancel();
      window.removeEventListener('resize', onResize);
      destroyers.forEach((destroy) => destroy());
      clearCardEffects();
      destroyWorkCardHover();
      destroyStoryCardHover();
    },
  };
}
