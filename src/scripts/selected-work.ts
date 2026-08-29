import gsap from 'gsap';

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
const artwork = (image: string, alt: string, shape: ArtworkShape, imageClass: string) => `
  <div class="editorial-artwork editorial-artwork--${shape}">
    <img class="${imageClass}" src="${image}" alt="${alt}" width="419" height="420" loading="lazy" decoding="async" />
  </div>
`;

export const renderSelectedWork = () => `
  <section class="selected-work" id="work" aria-labelledby="selected-work-title" data-header-theme="light">
    <h2 class="editorial-heading" id="selected-work-title"><span>SELECTED</span> <em>WORK</em></h2>
    <div class="selected-work__grid" role="list">
      ${selectedProjects.map((project) => `
        <article class="work-card" role="listitem" data-editorial-card>
          ${artwork(project.image, project.alt, project.shape, 'work-card__art')}
          <div class="work-card__meta">
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <ul class="work-card__tags" aria-label="${project.title} project categories">
              <li class="work-tag work-tag--primary work-tag--${project.categoryClass}">${project.category}</li>
              ${secondaryTags.map((tag) => `<li class="work-tag">${tag}</li>`).join('')}
            </ul>
          </div>
        </article>
      `).join('')}
    </div>
  </section>
`;

export const renderStories = () => `
  <section class="stories" aria-labelledby="stories-title" data-header-theme="light">
    <h2 class="editorial-heading" id="stories-title">STORIES</h2>
    <div class="stories__grid" role="list">
      ${stories.map((story) => `
        <article class="story-card" role="listitem" data-editorial-card>
          ${artwork(story.image, story.alt, story.shape, 'story-card__art')}
          <div class="story-card__meta">
            <span class="story-category">${story.category}</span>
            <h3>${story.title}</h3>
            <p>${story.description}</p>
          </div>
        </article>
      `).join('')}
    </div>
  </section>
`;

const initEditorialReveal = (section: HTMLElement) => {
  const heading = section.querySelector<HTMLElement>('.editorial-heading');
  const cards = Array.from(section.querySelectorAll<HTMLElement>('[data-editorial-card]'));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !heading || !cards.length) return () => undefined;

  gsap.set(heading, { y: 22, opacity: 0 });
  gsap.set(cards, { y: 28, opacity: 0 });

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top 78%',
      once: true,
    },
  })
    .to(heading, { y: 0, opacity: 1, duration: 0.58, ease: 'power3.out' })
    .to(cards, { y: 0, opacity: 1, duration: 0.58, stagger: 0.065, ease: 'power3.out' }, 0.1);

  return () => {
    timeline.scrollTrigger?.kill();
    timeline.kill();
    gsap.set([heading, ...cards], { clearProps: 'transform,opacity' });
  };
};

export function initEditorialSections() {
  const sections = Array.from(document.querySelectorAll<HTMLElement>('.selected-work, .stories'));
  const destroyers = sections.map(initEditorialReveal);
  return { destroy: () => destroyers.forEach((destroy) => destroy()) };
}
