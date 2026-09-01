import './styles/main.scss';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Flip from 'gsap/Flip';
import { startLoader } from './scripts/loader';
import { VideoController } from './scripts/video-player';
import { initHeroScroll } from './scripts/hero-scroll';
import { initCinemaMode } from './scripts/cinema-mode';
import { initMenu } from './scripts/menu';
import { initCreativeScene } from './scripts/creative-scene';
import { initEditorialSections, renderSelectedWork, renderStories } from './scripts/selected-work';
import { initHeaderTheme } from './scripts/header-theme';

gsap.registerPlugin(ScrollTrigger, Flip);
ScrollTrigger.config({ ignoreMobileResize: true });

const asset = (name: string) => `/assets/${encodeURIComponent(name)}`;
const logo = (decorative = false) => `<span class="brand" ${decorative ? 'aria-hidden="true"' : 'role="img" aria-label="Toby&Tye"'}></span>`;
const useMobileLoaderFrames = matchMedia('(max-width: 700px)').matches;
const loaderFrame = (index: number) => {
  const fallback = asset(`Preloader ${index}.png`);
  const optimized = asset(`Preloader ${index}${useMobileLoaderFrames ? '-mobile' : ''}.webp`);
  const priority = index === 1 ? ' fetchpriority="high"' : '';
  return `<picture data-loader-layer><source srcset="${optimized}" type="image/webp" /><img src="${fallback}" data-fallback-src="${fallback}" alt="" width="335" height="360" decoding="async" data-loader-image${priority} /></picture>`;
};

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="loader" id="loader" aria-live="polite" aria-label="Loading Toby&Tye">
    ${logo()}
    <div class="loader__frame" aria-hidden="true">
      ${Array.from({ length: 6 }, (_, index) => loaderFrame(index + 1)).join('')}
    </div>
    <output class="loader__counter" id="loader-counter">0%</output>
  </div>

  <main class="site-shell" id="site-content">
    <header class="site-header" id="site-header">
      <a class="brand-link" href="#home" aria-label="Toby&Tye home">${logo(true)}</a>
      <button class="menu-trigger" id="menu-trigger" type="button" aria-expanded="false" aria-controls="site-menu">
        <span class="menu-trigger__lines" aria-hidden="true"><i></i><i></i></span><span>MENU</span>
      </button>
    </header>
    <section class="hero" id="home" data-header-theme="light">
      <div class="hero-stage">
        <div class="hero-media" id="hero-media">
          <video class="hero-video" id="hero-video" data-desktop-src="/assets/gamp-animation.mp4" data-mobile-src="/assets/gamp-animation-mobile.mp4" autoplay muted loop playsinline preload="auto" disablepictureinpicture></video>
          <div class="hero-shade" aria-hidden="true"></div>
          <div class="watch-button-wrap">
            <button class="watch-button" id="watch-button" type="button" aria-label="Watch video"><span class="watch-button__icon" aria-hidden="true"></span></button>
          </div>
          <div class="cinema-controls" id="cinema-controls" aria-hidden="true">
            <button class="cinema-close" id="cinema-close" type="button" aria-label="Close cinema mode"><span aria-hidden="true">╳</span> CLOSE</button>
            <div class="cinema-controls__bar">
              <button id="cinema-play" type="button" data-playing="true" aria-label="Pause video"><span class="cinema-play-icon" aria-hidden="true"></span></button>
              <button id="cinema-mute" type="button" aria-label="Mute video">SOUND ON</button>
              <input id="cinema-progress" type="range" min="0" max="1000" value="0" aria-label="Video progress" />
              <span id="cinema-time" aria-hidden="true">0:00 / 0:00</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="creative" id="who-we-are" aria-labelledby="creative-title" data-header-theme="dark">
      <h2 id="creative-title"><span class="line-mask"><span>We are your creative</span></span><span class="line-mask"><span>Intelligence <em>Partner</em></span></span></h2>
      <div class="creative-grid">
        <!-- Previous three-card orbit preserved for rollback.
        <div class="card-composition" aria-label="Selected creative work">
          ${[1, 2, 3].map((n) => `<img src="${asset(`Animated ${n}.png`)}" alt="Creative project artwork ${n}" loading="lazy" decoding="async" data-orbit-card />`).join('')}
        </div>
        -->
        <div class="creative-cube-stage" data-creative-stage role="img" aria-label="Rotating cube featuring selected creative work">
          <div class="creative-cube-tilt" data-creative-cube-tilt>
            <div class="creative-cube" data-creative-cube aria-hidden="true">
              ${(['front', 'right', 'back', 'left', 'top', 'bottom'] as const).map((face, index) => `<span class="creative-cube__face creative-cube__face--${face}"><img src="${asset(`Animated ${(index % 3) + 1}.png`)}" alt="" loading="lazy" decoding="async" /></span>`).join('')}
            </div>
          </div>
        </div>
        <p class="creative-copy"><span class="line-mask"><span>Built for brands that refuse to blend in, we combine creative vision with rigorous intelligence and help ambitious brands transform perception into lasting impact.</span></span></p>
      </div>
    </section>
    ${renderSelectedWork()}
    ${renderStories()}
  </main>

  <nav class="site-menu" id="site-menu" data-menu-state="closed" aria-label="Primary navigation" aria-hidden="true" role="dialog" aria-modal="true" inert>
    <div class="site-menu__background" aria-hidden="true"></div>
    <div class="site-menu__content">
      <div class="site-menu__header">${logo()}<button class="menu-close" id="menu-close" type="button" aria-label="Close navigation menu"><span aria-hidden="true">╳</span> CLOSE</button></div>
      <div class="menu-cards" id="menu-cards" data-lenis-prevent data-lenis-prevent-touch>
        ${[['WHO WE ARE', 'who-we-are'], ['WHAT WE DO', 'what-we-do'], ['WORK', 'work'], ['CONTACT', 'contact']].map(([label, id], index) => `<a class="menu-card" href="#${id}" data-menu-card><span class="menu-card__label">${label}</span><span class="menu-card__image"><img src="${asset(`Menu ${index + 1}.png`)}" alt="" loading="lazy" decoding="async" /></span></a>`).join('')}
      </div>
    </div>
  </nav>
`;

const player = new VideoController('hero-video');
const menu = initMenu(player);
const cinema = initCinemaMode(player, () => menu.isOpen());
const heroScroll = initHeroScroll(player);
const headerTheme = initHeaderTheme();
const creative = initCreativeScene();
const editorialSections = initEditorialSections();
menu.setCinemaOpen(cinema.isOpen);

const appReady = async () => {
  await startLoader(player.ready);
  player.retryMutedAutoplay();
  heroScroll.refresh();
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  await creative.refresh();
  await editorialSections.refresh();
};

void appReady();
window.addEventListener('pagehide', () => {
  heroScroll.destroy();
  headerTheme.destroy();
  creative.destroy();
  editorialSections.destroy();
  menu.destroy();
  cinema.destroy();
  player.destroy();
}, { once: true });
