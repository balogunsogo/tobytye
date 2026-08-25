import './styles/main.scss';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Flip from 'gsap/Flip';
import { startLoader } from './scripts/loader';
import { YouTubeController } from './scripts/youtube-player';
import { initHeroScroll } from './scripts/hero-scroll';
import { initCinemaMode } from './scripts/cinema-mode';
import { initMenu } from './scripts/menu';
import { initCreativeScene } from './scripts/creative-scene';

gsap.registerPlugin(ScrollTrigger, Flip);

const asset = (name: string) => `/assets/${encodeURIComponent(name)}`;
const logo = `<img class="brand" src="${asset('TobyTye Logo 1.svg')}" alt="Toby&Tye" />`;

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div class="loader" id="loader" aria-live="polite" aria-label="Loading Toby&Tye">
    ${logo}
    <div class="loader__frame" aria-hidden="true">
      ${Array.from({ length: 6 }, (_, index) => `<img src="${asset(`Preloader ${index + 1}.png`)}" alt="" data-loader-image />`).join('')}
    </div>
    <output class="loader__counter" id="loader-counter">0%</output>
  </div>

  <main class="site-shell" id="site-content">
    <section class="hero" id="home" aria-labelledby="hero-title">
      <header class="site-header" id="site-header">
        <a class="brand-link" href="#home" aria-label="Toby&Tye home">${logo}</a>
        <button class="menu-trigger" id="menu-trigger" type="button" aria-expanded="false" aria-controls="site-menu">
          <span class="menu-trigger__lines" aria-hidden="true"><i></i><i></i></span><span>MENU</span>
        </button>
      </header>
      <div class="hero-stage">
        <div class="hero-media" id="hero-media">
          <img class="hero-poster" id="hero-poster" src="https://i.ytimg.com/vi/SaOwutdzd24/maxresdefault.jpg" alt="Toby&Tye brand film poster" />
          <div class="youtube-player" id="youtube-player" aria-hidden="true"><div id="youtube-player-mount"></div></div>
          <div class="hero-shade" aria-hidden="true"></div>
          <h1 class="hero-title" id="hero-title">more than<br />just a gadget<br />repair company</h1>
          <button class="watch-button" id="watch-button" type="button" aria-label="Watch video with sound"><span aria-hidden="true">▶</span><b>WATCH</b></button>
          <div class="cinema-controls" id="cinema-controls" aria-hidden="true">
            <button class="cinema-close" id="cinema-close" type="button" aria-label="Close cinema mode"><span aria-hidden="true">╳</span> CLOSE</button>
            <div class="cinema-controls__bar">
              <button id="cinema-play" type="button" aria-label="Pause video">Ⅱ</button>
              <button id="cinema-mute" type="button" aria-label="Mute video">SOUND ON</button>
              <input id="cinema-progress" type="range" min="0" max="1000" value="0" aria-label="Video progress" />
              <span id="cinema-time" aria-hidden="true">0:00 / 0:00</span>
              <button id="cinema-fullscreen" type="button" aria-label="Enter fullscreen">FULLSCREEN</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="creative" id="who-we-are" aria-labelledby="creative-title">
      <h2 id="creative-title"><span class="line-mask"><span>WE ARE YOUR CREATIVE</span></span><span class="line-mask"><span>INTELLIGENCE <em>PARTNER</em></span></span></h2>
      <div class="creative-grid">
        <div class="card-composition" aria-label="Selected creative work">
          ${[1, 2, 3].map((n) => `<img src="${asset(`Animated ${n}.png`)}" alt="Creative project artwork ${n}" loading="lazy" decoding="async" data-orbit-card />`).join('')}
        </div>
        <p class="creative-copy"><span class="line-mask"><span>Built for brands that refuse to blend in, we combine creative vision with rigorous intelligence and help ambitious brands transform perception into lasting impact.</span></span></p>
      </div>
    </section>
    <section class="placeholder-section" id="what-we-do"><p>01 / WHAT WE DO</p><h2>Ideas built to move.</h2></section>
    <section class="placeholder-section placeholder-section--dark" id="work"><p>02 / WORK</p><h2>Selected transformations.</h2></section>
    <section class="placeholder-section" id="contact"><p>03 / CONTACT</p><h2>Let’s make an impact.</h2><a href="mailto:hello@tobyandtye.com">hello@tobyandtye.com</a></section>
  </main>

  <nav class="site-menu" id="site-menu" aria-label="Primary navigation" aria-hidden="true" role="dialog" aria-modal="true">
    <div class="site-menu__background" aria-hidden="true"></div>
    <div class="site-menu__content">
      <div class="site-menu__header">${logo}<button class="menu-close" id="menu-close" type="button" aria-label="Close navigation menu"><span aria-hidden="true">╳</span> CLOSE</button></div>
      <div class="site-menu__rule" aria-hidden="true"></div>
      <div class="menu-cards" id="menu-cards">
        ${[['WHO WE ARE', 'who-we-are'], ['WHAT WE DO', 'what-we-do'], ['WORK', 'work'], ['CONTACT', 'contact']].map(([label, id], index) => `<a class="menu-card" href="#${id}" data-menu-card><span class="menu-card__label-mask"><span class="menu-card__label">${label}</span></span><span class="menu-card__image"><img src="${asset(`Menu ${index + 1}.png`)}" alt="" loading="lazy" decoding="async" /></span></a>`).join('')}
      </div>
    </div>
  </nav>
`;

const player = new YouTubeController({ mountId: 'youtube-player-mount', wrapperId: 'youtube-player', posterId: 'hero-poster' });
const menu = initMenu(player);
const cinema = initCinemaMode(player, () => menu.isOpen());
const heroScroll = initHeroScroll(player);
const creative = initCreativeScene();
menu.setCinemaOpen(cinema.isOpen);

const appReady = async () => {
  await startLoader(player.ready);
  player.retryMutedAutoplay();
  heroScroll.refresh();
  ScrollTrigger.refresh();
};

void appReady();
window.addEventListener('pagehide', () => {
  heroScroll.destroy();
  creative.destroy();
  menu.destroy();
  cinema.destroy();
  player.destroy();
}, { once: true });
