/**
 * @file script.js
 * @description Client-side behavior for the Portfolio-Mily static site. No bundler or framework;
 *              all modules are plain DOM APIs. Suitable for GitHub Pages or any static host served
 *              over HTTP(S). Using `file://` may break video, PDF iframes, and some fetch-based flows.
 *
 * @section Table of contents
 * 1. Particle canvas — ambient background animation
 * 2. Custom cursor — desktop hover affordance (disabled on touch devices via CSS)
 * 3. Navigation — scroll state, mobile drawer, section→nav active link (IntersectionObserver)
 * 4. Reveal-on-scroll — `.reveal` / `.visible` for entrance motion
 * 5. Hero stats — number tick-up when stats enter viewport
 * 6. CV modal — open/close; `fetch` + blob download for `.js-cv-download` (fallback: open modal)
 * 7. Projects — tabbed IM vs CS panels, hash sync, expandable project cards
 * 8. Experiences — expand/collapse extra timeline items
 * 9. Creative gallery — interleaved photo/video grid, filters, lightbox (photos and videos)
 * 10. Contact — Formspree AJAX submit
 * 11. Misc — skill pill hover, anchor smooth scroll, photo error fallback, project card tilt, landing hero motion
 */

// -----------------------------------------------------------------------------
// How to read this file: it runs straight down at page load—no framework bootstrapping.
// Each block grabs nodes once and attaches listeners. If you’re debugging, use the
// numbered list in the banner above and search for the matching section header.
// -----------------------------------------------------------------------------

// -----------------------------------------------------------------
// Particle system: animated ambient background with mouse repulsion.
// -----------------------------------------------------------------
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], mouse = { x: -9999, y: -9999 };
const PARTICLE_COUNT = 90;

/**
 * Resizes the particle canvas to the current window inner dimensions so drawing coordinates
 * remain aligned with visible pixels after orientation or window changes.
 */
function resizeCanvas() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', () => { resizeCanvas(); initParticles(); });

window.addEventListener('mousemove', e => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
});

const palette = [
  [236, 72, 153],   // pink
  [45, 212, 191],   // teal
  [244, 114, 182],  // pink
  [251, 113, 133],  // rose
  [251, 191, 36],   // amber (rare)
];

/**
 * One floating particle: respawns when it leaves the frame or exceeds its lifespan.
 * Color is sampled from the `palette` array; motion includes gentle sine noise and cursor repulsion.
 */
class Particle {
  constructor() { this.reset(true); }
  reset(randomY = false) {
    this.x = Math.random() * W;
    this.y = randomY ? Math.random() * H : H + 10;
    const c = palette[Math.floor(Math.random() * palette.length)];
    this.r = c[0]; this.g = c[1]; this.b = c[2];
    this.size = Math.random() * 2 + 0.4;
    this.speedX = (Math.random() - 0.5) * 0.4;
    this.speedY = -(Math.random() * 0.5 + 0.2);
    this.alpha = Math.random() * 0.5 + 0.15;
    this.life = 0;
    this.maxLife = Math.random() * 400 + 200;
    this.pulse = Math.random() * Math.PI * 2;
  }
  update() {
    this.life++;
    this.pulse += 0.02;

    // Push particles away from the cursor to create interactive depth.
    const dx = this.x - mouse.x;
    const dy = this.y - mouse.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 120) {
      const force = (120 - dist) / 120;
      this.x += (dx / dist) * force * 2.5;
      this.y += (dy / dist) * force * 2.5;
    }

    this.x += this.speedX + Math.sin(this.pulse * 0.7) * 0.3;
    this.y += this.speedY;

    // Ease particle opacity in/out across its lifespan.
    const lifeRatio = this.life / this.maxLife;
    if (lifeRatio < 0.1) this.alpha = (lifeRatio / 0.1) * 0.5;
    else if (lifeRatio > 0.8) this.alpha = ((1 - lifeRatio) / 0.2) * 0.5;
    else this.alpha = 0.3 + Math.sin(this.pulse) * 0.12;

    if (this.life >= this.maxLife || this.y < -20 || this.x < -20 || this.x > W + 20) {
      this.reset();
    }
  }
  draw() {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = `rgb(${this.r},${this.g},${this.b})`;
    ctx.shadowBlur = this.size * 6;
    ctx.shadowColor = `rgba(${this.r},${this.g},${this.b},0.8)`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

/** Fills the global `particles` array with a fresh set of {@link PARTICLE_COUNT} instances. */
function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
}

/** Renders a sparse network graph between particle pairs within `110px` for a tech-mesh look. */
function drawConnections() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 110) {
        const alpha = (1 - dist / 110) * 0.12;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgba(236,72,153,1)`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

/** Main animation loop: clear frame, lines, then update+draw each particle. */
function animateParticles() {
  ctx.clearRect(0, 0, W, H);
  drawConnections();
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

// ------------------------------------------------
// Custom cursor (desktop pointer enhancement only).
// ------------------------------------------------
const cursor = document.getElementById('cursor');
const ring   = document.getElementById('cursor-ring');
let mx = 0, my = 0, rx = 0, ry = 0;

document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top  = my + 'px';
});
(function animRing() {
  rx += (mx - rx) * 0.12;
  ry += (my - ry) * 0.12;
  ring.style.left = rx + 'px';
  ring.style.top  = ry + 'px';
  requestAnimationFrame(animRing);
})();

document.querySelectorAll('a, button').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width  = '16px';
    cursor.style.height = '16px';
    cursor.style.background = 'var(--teal)';
    ring.style.width  = '52px';
    ring.style.height = '52px';
    ring.style.opacity = '0.5';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width  = '10px';
    cursor.style.height = '10px';
    cursor.style.background = 'var(--accent)';
    ring.style.width  = '36px';
    ring.style.height = '36px';
    ring.style.opacity = '1';
  });
});

// Navbar: stay transparent on landing; tint once past home section.
// The hero is intentionally busy—keeping the bar glassy there avoids a heavy bar on
// top of the collage. Once you scroll into calmer sections, we snap to a readable tint.
const navbar = document.getElementById('navbar');
const homeSection = document.getElementById('home');

/**
 * Adds `.scrolled` to `#navbar` once the user scrolls past the hero, switching the bar to a
 * solid, blurred background for contrast on lighter sections below the fold.
 */
function updateNavbarState() {
  if (!navbar || !homeSection) return;
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
  const triggerY = homeSection.offsetTop + homeSection.offsetHeight - navH - 10;
  navbar.classList.toggle('scrolled', window.scrollY > triggerY);
}

window.addEventListener('scroll', updateNavbarState);
window.addEventListener('resize', updateNavbarState);
updateNavbarState();

// Mobile menu: toggle state and lock page scroll while open.
// Body scroll lock is a small detail, but it stops the background from moving under the drawer.
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobile-menu');
hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('open');
  mobileMenu.classList.toggle('open', open);
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.mob-link, .mob-cv').forEach(l => {
  l.addEventListener('click', () => {
    hamburger.classList.remove('open');
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* Nav “you are here” state: whichever section sits in the middle stripe of the viewport wins.
   The asymmetric root margins mean we care about the reading band, not just touching the top. */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const sectObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectObs.observe(s));

// Scroll reveals: each `.reveal` animates in once, then we stop observing so it doesn’t
// flicker if the user scrolls up and down repeatedly.
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

/**
 * Eases a numeric stat (from `data-target`) upward for a short count-up effect.
 * @param {HTMLElement} el Element with class `.stat-num` and `data-target` integer.
 */
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  let current = 0;
  const step  = Math.ceil(target / 40);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current + (target >= 100 ? '+' : '+');
    if (current >= target) clearInterval(timer);
  }, 35);
}

const statsObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll('.stat-num').forEach(animateCounter);
      statsObs.unobserve(e.target);
    }
  });
}, { threshold: 0.5 });
const heroStats = document.querySelector('.hero-stats');
if (heroStats) statsObs.observe(heroStats);

// -----------------------------------------------------------------
// CV modal: `openCV` from About/Contact; backdrop click, Escape, and iframe `error` → fallback CTA
// -----------------------------------------------------------------
const cvBackdrop = document.getElementById('cv-modal-backdrop');
const cvClose    = document.getElementById('cv-modal-close');
const cvIframe   = document.getElementById('cv-iframe');
const cvFallback = document.getElementById('cv-fallback');

function openCV() {
  if (!cvBackdrop) return;
  cvBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  if (cvFallback) cvFallback.classList.remove('show');
}
function closeCV() {
  if (!cvBackdrop) return;
  cvBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  if (cvFallback) cvFallback.classList.remove('show');
}

/** Fetched as bytes, then `blob:` + `download` so the file saves as rabeya-cv.pdf. */
const CV_DOWNLOAD_FILENAME = 'rabeya-cv.pdf';
const CV_SOURCE_PATH = 'cv/Mily_s_Resume__SWE_.pdf';

function saveCvBlobInPlace(blob) {
  if (typeof navigator !== 'undefined' && typeof navigator.msSaveOrOpenBlob === 'function') {
    try {
      navigator.msSaveOrOpenBlob(blob, CV_DOWNLOAD_FILENAME);
      return;
    } catch (_) { /* continue with <a download> */ }
  }
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = CV_DOWNLOAD_FILENAME;
  a.setAttribute('download', CV_DOWNLOAD_FILENAME);
  a.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke only after the browser has time to start the download (long revoke avoids broken saves).
  setTimeout(() => URL.revokeObjectURL(objUrl), 15_000);
}

/**
 * Attempts a plain browser-native file download via `<a download>`.
 * This path is critical for `file://` usage where `fetch` is usually blocked.
 * @param {HTMLAnchorElement | null} sourceAnchor Triggered CV link, if available.
 */
function triggerNativeCvDownload(sourceAnchor) {
  const sourceHref = sourceAnchor?.getAttribute('href') || CV_SOURCE_PATH;
  const directUrl = new URL(sourceHref, window.location.href).href;
  const a = document.createElement('a');
  a.href = directUrl;
  a.download = CV_DOWNLOAD_FILENAME;
  a.setAttribute('download', CV_DOWNLOAD_FILENAME);
  a.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;pointer-events:none;';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/**
 * Intercepts CV anchor clicks, loads the PDF with `fetch`, and saves via a blob + `<a download>`.
 * Falls back to native browser download when `fetch` is unavailable/blocked.
 * @param {MouseEvent} ev Click event from an `a.js-cv-download` control.
 */
async function forceCvDownload(ev) {
  const anchor = ev.currentTarget instanceof HTMLAnchorElement ? ev.currentTarget : null;
  const protocol = window.location.protocol;
  const isWebProtocol = protocol === 'http:' || protocol === 'https:';
  ev.preventDefault();
  // `file://` previews (double-clicking index.html) usually block fetch(); fall back to a
  // plain download click so local checks still feel sane. On GitHub Pages, fetch → blob is nicer.
  if (!isWebProtocol) {
    try {
      triggerNativeCvDownload(anchor);
    } catch {
      openCV();
    }
    return;
  }

  const cvUrl = new URL(anchor?.getAttribute('href') || CV_SOURCE_PATH, window.location.href).href;
  try {
    const res = await fetch(cvUrl, { credentials: 'same-origin', cache: 'no-store' });
    if (!res.ok) throw new Error(`CV HTTP ${res.status}`);
    const buf = await res.arrayBuffer();
    if (!buf || buf.byteLength === 0) throw new Error('CV empty');
    // octet-stream nudges more browsers to save instead of hand off to a PDF viewer
    const blob = new Blob([buf], { type: 'application/octet-stream' });
    saveCvBlobInPlace(blob);
  } catch {
    try {
      triggerNativeCvDownload(anchor);
    } catch {
      openCV();
    }
  }
}

document.querySelectorAll('a.js-cv-download').forEach(a => {
  a.addEventListener('click', forceCvDownload);
});

// Some browsers fail silently on iframe PDF rendering; rely on error event for fallback only.
if (cvIframe) {
  cvIframe.addEventListener('error', () => { if (cvFallback) cvFallback.classList.add('show'); });
}

const btnCvViewAbout = document.getElementById('btn-cv-view-about');
const btnCvViewContact = document.getElementById('btn-cv-view-contact');
if (btnCvViewAbout) btnCvViewAbout.addEventListener('click', openCV);
if (btnCvViewContact) btnCvViewContact.addEventListener('click', openCV);
if (cvClose) cvClose.addEventListener('click', closeCV);
if (cvBackdrop) {
  cvBackdrop.addEventListener('click', e => { if (e.target === cvBackdrop) closeCV(); });
}
// Escape closes whichever overlay is relevant; both helpers no-op if already closed.
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCV(); closeLightbox(); } });

// Projects: IM / CS tabs (slide) + expandable grids.
const projectsTrack = document.getElementById('projects-panels-track');
const tabProjectsIm = document.getElementById('tab-projects-im');
const tabProjectsCs = document.getElementById('tab-projects-cs');
const panelProjectsIm = document.getElementById('im-projects');
const panelProjectsCs = document.getElementById('cs-projects');

/**
 * Switches the Projects area between Interactive Media and CS & HCI: slides the
 * track via `data-active`, updates ARIA on tabs/panels, and applies `inert` to the hidden column.
 * @param {'im'|'cs'} which Active project category.
 */
function setProjectTab(which) {
  if (!projectsTrack || !tabProjectsIm || !tabProjectsCs || !panelProjectsIm || !panelProjectsCs) return;
  const isIm = which === 'im';
  projectsTrack.setAttribute('data-active', isIm ? 'im' : 'cs');
  tabProjectsIm.setAttribute('aria-selected', isIm ? 'true' : 'false');
  tabProjectsCs.setAttribute('aria-selected', isIm ? 'false' : 'true');
  tabProjectsIm.tabIndex = isIm ? 0 : -1;
  tabProjectsCs.tabIndex = isIm ? -1 : 0;
  panelProjectsIm.setAttribute('aria-hidden', isIm ? 'false' : 'true');
  panelProjectsCs.setAttribute('aria-hidden', isIm ? 'true' : 'false');
  if (isIm) {
    panelProjectsIm.removeAttribute('inert');
    panelProjectsCs.setAttribute('inert', '');
  } else {
    panelProjectsIm.setAttribute('inert', '');
    panelProjectsCs.removeAttribute('inert');
  }
  const btnPrev = document.getElementById('projects-page-prev');
  const btnNext = document.getElementById('projects-page-next');
  if (btnPrev) btnPrev.disabled = isIm;
  if (btnNext) btnNext.disabled = !isIm;
}

if (tabProjectsIm && tabProjectsCs) {
  tabProjectsIm.addEventListener('click', () => setProjectTab('im'));
  tabProjectsCs.addEventListener('click', () => setProjectTab('cs'));
  const tabList = tabProjectsIm.parentElement;
  if (tabList) {
    tabList.addEventListener('keydown', (e) => {
      if (!e.target || !e.target.classList?.contains('projects-type-tab')) return;
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      if (e.key === 'ArrowRight') {
        setProjectTab('cs');
        tabProjectsCs?.focus();
      } else {
        setProjectTab('im');
        tabProjectsIm?.focus();
      }
    });
  }
  // Deep links like #cs-projects should land on the right tab; if there’s no hash, we still
  // run once so the edge nav buttons pick up correct disabled state from `data-active`.
  const syncProjectHash = () => {
    if (location.hash === '#cs-projects') setProjectTab('cs');
    else if (location.hash === '#im-projects') setProjectTab('im');
    else {
      const initial = projectsTrack?.getAttribute('data-active') === 'cs' ? 'cs' : 'im';
      setProjectTab(initial);
    }
  };
  syncProjectHash();
  window.addEventListener('hashchange', syncProjectHash);

  /** IM ↔ CS: edge controls (prev → IM, next → CS). */
  const btnProjectsPrev = document.getElementById('projects-page-prev');
  const btnProjectsNext = document.getElementById('projects-page-next');
  btnProjectsPrev?.addEventListener('click', () => setProjectTab('im'));
  btnProjectsNext?.addEventListener('click', () => setProjectTab('cs'));
}

// Projects: expand/collapse extra cards (IM + CS).
const imGrid = document.getElementById('im-projects-grid');
const csGrid = document.getElementById('cs-projects-grid');
const extraIm = () => (imGrid ? imGrid.querySelectorAll('.project-card.extra') : []);
const extraCs = () => (csGrid ? csGrid.querySelectorAll('.project-card.extra') : []);

const PROJECT_TOGGLE_OPEN =
  'Show less <span class="toggle-icon" style="display:inline-block;transform:rotate(180deg)">↓</span>';

/**
 * Binds a “View more / View all” control to show `.project-card.extra` rows with a staggered reveal.
 * @param {HTMLButtonElement | null} button
 * @param {() => NodeListOf<Element>} getExtraCards Returns hidden cards for this grid
 * @param {string} labelClosed Button label when the extra rows are collapsed
 * @param {string} scrollSectionId `id` of a section to scroll to when closing (keeps context in view)
 */
function bindProjectExtraToggle(button, getExtraCards, labelClosed, scrollSectionId) {
  if (!button) return;
  let open = false;
  button.addEventListener('click', () => {
    open = !open;
    button.classList.toggle('active', open);
    button.setAttribute('aria-expanded', open ? 'true' : 'false');
    const cards = getExtraCards();
    if (open) {
      button.innerHTML = PROJECT_TOGGLE_OPEN;
      cards.forEach((c, i) => {
        setTimeout(() => {
          c.classList.add('shown');
          c.style.opacity = '1';
          c.style.transform = 'none';
        }, i * 80);
      });
    } else {
      button.innerHTML = `${labelClosed} <span class="toggle-icon">↓</span>`;
      cards.forEach(c => c.classList.remove('shown'));
      document.getElementById(scrollSectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

bindProjectExtraToggle(document.getElementById('btn-im-projects-toggle'), extraIm, 'View more', 'im-projects');
bindProjectExtraToggle(document.getElementById('btn-cs-projects-toggle'), extraCs, 'View all', 'cs-projects');

// Experiences: same “reveal extras + smooth scroll back” pattern as project grids.
const btnExp   = document.getElementById('btn-exp-toggle');
const extraExp = document.querySelectorAll('.exp-item.extra');
let expOpen    = false;

btnExp.addEventListener('click', () => {
  expOpen = !expOpen;
  btnExp.classList.toggle('active', expOpen);
  if (expOpen) {
    btnExp.innerHTML = 'Show Less <span class="toggle-icon" style="display:inline-block;transform:rotate(180deg)">↓</span>';
    extraExp.forEach((item, i) => { setTimeout(() => item.classList.add('shown'), i * 100); });
  } else {
    btnExp.innerHTML = 'View All <span class="toggle-icon">↓</span>';
    extraExp.forEach(item => item.classList.remove('shown'));
    document.getElementById('experiences').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// -----------------------------------------------------------------
// Creative lightbox: visible photo + video cards in grid order; `lbIndex` matches that list
// -----------------------------------------------------------------
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lightbox-img');
const lbVideo = document.getElementById('lightbox-video');
const lbCaption = document.getElementById('lightbox-caption');
const lbClose = document.getElementById('lightbox-close');
const lbPrev = document.getElementById('lightbox-prev');
const lbNext = document.getElementById('lightbox-next');
let lightboxItems = [];
let lbIndex = 0;

/**
 * @returns {HTMLElement[]} Non-hidden `.creative-item` nodes in current DOM order (after filters)
 */
function getVisibleCreativeItems() {
  const grid = document.getElementById('creative-grid');
  if (!grid) return [];
  return Array.from(grid.querySelectorAll('.creative-item')).filter(el => !el.classList.contains('hidden'));
}

/**
 * Populates `lightboxItems` from visible photo and video items (filter + “View all” state).
 * Called on each open so prev/next and indices match what the user sees.
 */
function buildLightboxList() {
  lightboxItems = [];
  getVisibleCreativeItems().forEach(item => {
    const cap = item.querySelector('.creative-caption');
    const caption = cap ? cap.textContent : '';
    if (item.classList.contains('photo')) {
      const img = item.querySelector('img');
      const ph = item.querySelector('.creative-placeholder span');
      const src = img && img.style.display !== 'none' && img.getAttribute('src') ? img.src : '';
      lightboxItems.push({
        kind: 'photo',
        src: src || '',
        caption,
        placeholder: ph ? ph.textContent : '',
      });
    } else if (item.classList.contains('video')) {
      const v = item.querySelector('video.creative-video');
      const src = v ? (v.currentSrc || v.getAttribute('src') || '') : '';
      lightboxItems.push({ kind: 'video', src: src || '', caption });
    }
  });
}

function resetLightboxVideo() {
  if (!lbVideo) return;
  lbVideo.pause();
  lbVideo.removeAttribute('src');
  lbVideo.load();
  lbVideo.style.display = 'none';
}

function resetLightboxImage() {
  if (!lbImg) return;
  lbImg.removeAttribute('src');
  lbImg.removeAttribute('alt');
  lbImg.style.display = 'none';
}

/**
 * @param {HTMLElement} item A `.creative-item` that is currently visible
 */
function openLightboxForElement(item) {
  buildLightboxList();
  const visible = getVisibleCreativeItems();
  const idx = visible.indexOf(item);
  if (idx < 0 || lightboxItems.length === 0) return;
  document.querySelectorAll('#creative-grid .creative-item.video video').forEach(v => {
    v.pause();
    v.removeAttribute('controls');
  });
  lbIndex = idx;
  showLightboxItem();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  resetLightboxVideo();
  resetLightboxImage();
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}

function showLightboxItem() {
  const item = lightboxItems[lbIndex];
  if (!item) return;
  // Mobile Safari is picky: try unmuted play first, then fall back to muted autoplay if the
  // browser blocks audio without a direct user gesture.
  if (item.kind === 'video') {
    resetLightboxImage();
    if (item.src && lbVideo) {
      lbVideo.style.display = 'block';
      lbVideo.src = item.src;
      setupCreativeVideoEl(lbVideo);
      lbVideo.controls = true;
      const tryPlay = () => {
        lbVideo.play().catch(() => {
          lbVideo.muted = true;
          lbVideo.play().catch(() => {});
        });
      };
      if (lbVideo.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) tryPlay();
      else {
        const once = () => {
          lbVideo.removeEventListener('loadeddata', once);
          lbVideo.removeEventListener('canplay', once);
          tryPlay();
        };
        lbVideo.addEventListener('loadeddata', once);
        lbVideo.addEventListener('canplay', once);
      }
    } else if (lbVideo) {
      lbVideo.style.display = 'none';
    }
  } else {
    resetLightboxVideo();
    if (item.src) {
      lbImg.src = item.src;
      lbImg.alt = item.caption || '';
      lbImg.style.display = 'block';
    } else {
      resetLightboxImage();
    }
  }
  lbCaption.textContent = item.caption || '';
}

if (lightbox) {
  lbClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  lbPrev.addEventListener('click', () => {
    lbIndex = (lbIndex - 1 + lightboxItems.length) % lightboxItems.length;
    showLightboxItem();
  });
  lbNext.addEventListener('click', () => {
    lbIndex = (lbIndex + 1) % lightboxItems.length;
    showLightboxItem();
  });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      closeLightbox();
      return;
    }
    if (e.key === 'ArrowLeft') { lbIndex = (lbIndex - 1 + lightboxItems.length) % lightboxItems.length; showLightboxItem(); }
    if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lightboxItems.length; showLightboxItem(); }
  });
}

// Creative gallery manifests — keep these arrays aligned with files on disk. The gallery
// builder interleaves photos and videos so the grid doesn’t read as two separate blocks.
const PHOTO_BASE = 'assets/photos';
const VIDEO_BASE = 'assets/Videos';

/**
 * @param {string} base e.g. `assets/photos` or `assets/Videos` (no trailing slash)
 * @param {string} filename Raw file name; segment-encoded for URL safety
 * @returns {string} Resolvable path relative to the site root
 */
function creativeMediaSrc(base, filename) {
  return `${base}/${encodeURIComponent(filename)}`;
}

/**
 * Ensures inline playback on iOS and older WebKit: required for programmatic `play()` after tap.
 * @param {HTMLVideoElement} video
 */
function setupCreativeVideoEl(video) {
  video.playsInline = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
}

/** Keep in sync with files in assets/photos (add one object per image). */
const CREATIVE_PHOTO_FILES = [
  { file: '20250715_1314_HALA Logo Blueprint_remix_01k07h2t6vevrtp6nrevdr4map.png', caption: 'HALA — logo blueprint', tall: true },
  { file: 'IM-2.png', caption: '' },
  { file: 'IMG_5494.jpg', caption: 'Aurroa' },
  { file: 'IMG_7316.jpg', caption: 'London' },
  { file: 'Mily_Week4-2_D&P1.JPG', caption: 'Design & Production' },
  { file: 'Mily_Week5_D&P1.JPG', caption: 'Design & Production — Charcoal work', tall: true },
  { file: 'blossom.jpg', caption: 'Blossom' },
  { file: 'bruges.jpg', caption: 'Bruges' },
  { file: 'eiffel.jpg', caption: 'Eiffel Tower' },
  { file: 'flower1.jpg', caption: 'Keukenhof', tall: true },
  { file: 'flower2.jpg', caption: 'Netherlands' },
  { file: 'food1.jpg', caption: 'Food' },
  { file: 'italy.jpg', caption: 'Italy' },
  { file: 'milzz_E-Textile_Light-Up_Butterfly_Bracelet_Modern_editorial__68cbbdf7-c533-46f7-a87e-a65ce00ad3ca_0.png', caption: 'E-textile — editorial frame', tall: true },
  { file: 'monalisa.jpg', caption: 'Mona Lisa' },
  { file: 'norway2.jpg', caption: 'Norway' },
  { file: 'painting1.jpg', caption: 'Painting I', tall: true },
  { file: 'painting2.jpg', caption: 'Landscape' },
];

/** Keep in sync with files in assets/Videos (add one object per clip). */
const CREATIVE_VIDEO_FILES = [
  { file: 'video.mov', caption: 'Edited cut — motion & rhythm' },
  { file: 'baking.mov', caption: 'Baking — short form' },
  { file: 'cooking.mov', caption: 'Cooking with friends' },
  { file: 'cooking2.mov', caption: 'Cooking II' },
  { file: 'kayaking.mov', caption: 'Kayaking' },
  { file: 'life goes on.mov', caption: 'Life goes on — personal edit' },
  { file: 'nyc.mov', caption: 'NYC' },
  { file: 'productmarketing.mov', caption: 'Product marketing' },
  { file: 'soundsofdubai.mov', caption: 'Sounds of Dubai' },
];

/** Default preview counts shown before expanding the "All" grid. */
const CREATIVE_PREVIEW_PHOTOS = 4;
const CREATIVE_PREVIEW_VIDEOS = 2;

let creativeExpanded = false;
const CREATIVE_LIKES_STORAGE_KEY = 'portfolioCreativeLikesV1';
let creativeLikes = new Set();

// “Loved by you” is entirely front-end: IDs are filenames, persisted in localStorage so
// repeat visitors keep their picks without a backend.
function loadCreativeLikes() {
  try {
    const raw = localStorage.getItem(CREATIVE_LIKES_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) creativeLikes = new Set(parsed.filter(Boolean));
  } catch {
    creativeLikes = new Set();
  }
}

function persistCreativeLikes() {
  try {
    localStorage.setItem(CREATIVE_LIKES_STORAGE_KEY, JSON.stringify([...creativeLikes]));
  } catch {
    /* ignore storage quota/private-mode failures */
  }
}

function isCreativeLiked(mediaId) {
  return Boolean(mediaId) && creativeLikes.has(mediaId);
}

function updateLikedFilterCount() {
  const likedBtn = document.querySelector('.creative-filters .filter-btn[data-filter="liked"]');
  if (!likedBtn) return;
  likedBtn.textContent = `Loved by You (${creativeLikes.size}) ✨`;
}

function syncCreativeLikeUi(item) {
  if (!item) return;
  const mediaId = item.dataset.mediaId || '';
  const likeBtn = item.querySelector('.creative-like-btn');
  const liked = isCreativeLiked(mediaId);
  item.classList.toggle('liked', liked);
  if (likeBtn) {
    likeBtn.setAttribute('aria-pressed', liked ? 'true' : 'false');
    likeBtn.setAttribute('aria-label', liked ? 'Unlike this post' : 'Like this post');
  }
}

function toggleCreativeLike(mediaId) {
  if (!mediaId) return;
  if (creativeLikes.has(mediaId)) creativeLikes.delete(mediaId);
  else creativeLikes.add(mediaId);
  persistCreativeLikes();
  updateLikedFilterCount();
}

/**
 * Shows or hides each `.creative-item` based on: (1) filter `all|photo|video`, and (2) whether
 * “extra” items are allowed when the “All” filter is active (`creativeExpanded` and preview caps).
 */
function applyCreativeVisibility() {
  const grid = document.getElementById('creative-grid');
  if (!grid) return;
  const filterBtn = document.querySelector('.creative-filters .filter-btn.active');
  const filter = filterBtn ? filterBtn.dataset.filter : 'all';
  const previewAll = filter === 'all' && !creativeExpanded;

  grid.querySelectorAll('.creative-item').forEach(cItem => {
    const matchType = filter === 'all' || filter === 'liked' || cItem.dataset.type === filter;
    const matchLiked = filter !== 'liked' || isCreativeLiked(cItem.dataset.mediaId || '');
    const isExtra = cItem.classList.contains('extra');
    const match = matchType && matchLiked && !(previewAll && isExtra);

    cItem.style.transition = 'opacity .3s, transform .3s';
    if (match) {
      cItem.style.opacity = '1';
      cItem.style.transform = '';
      cItem.classList.remove('hidden');
    } else {
      // Fade out first, then `hidden` so screen readers / layout skip collapsed tiles cleanly.
      cItem.style.opacity = '0';
      cItem.style.transform = 'scale(.95)';
      setTimeout(() => cItem.classList.add('hidden'), 300);
    }
  });

  const viewWrap = document.getElementById('creative-view-all-wrap');
  if (viewWrap) {
    const hasExtras = grid.querySelectorAll('.creative-item.extra').length > 0;
    const showToggle = hasExtras && filter === 'all';
    viewWrap.style.removeProperty('display');
    viewWrap.hidden = !showToggle;
  }
}

/**
 * One-time setup: interleaves photo and video entries, builds “social post” card markup, wires
 * filter buttons, “View all”, and card clicks→shared lightbox (photos and videos).
 */
function initCreativeGallery() {
  const grid = document.getElementById('creative-grid');
  if (!grid) return;

  /* Interleave one photo then one video until one list runs out, then drain the remainder (keeps grid visually mixed). */
  const sequence = [];
  let pi = 0;
  let vi = 0;
  while (pi < CREATIVE_PHOTO_FILES.length || vi < CREATIVE_VIDEO_FILES.length) {
    if (pi < CREATIVE_PHOTO_FILES.length) sequence.push({ type: 'photo', ...CREATIVE_PHOTO_FILES[pi++] });
    if (vi < CREATIVE_VIDEO_FILES.length) sequence.push({ type: 'video', ...CREATIVE_VIDEO_FILES[vi++] });
  }

  const postIconHeart = '<svg class="creative-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
  const postIconComment = '<svg class="creative-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>';
  const postIconSend = '<svg class="creative-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  const postIconBookmark = '<svg class="creative-post-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>';
  const postLikeButton = `<button type="button" class="creative-like-btn" aria-label="Like this post" aria-pressed="false">${postIconHeart}</button>`;

  let previewPhotoCount = 0;
  let previewVideoCount = 0;

  sequence.forEach((item, idx) => {
    const delayN = (idx % 3) + 1;
    const wrap = document.createElement('div');
    let isExtra = false;
    if (item.type === 'photo') {
      if (previewPhotoCount >= CREATIVE_PREVIEW_PHOTOS) isExtra = true;
      else previewPhotoCount += 1;
    } else {
      if (previewVideoCount >= CREATIVE_PREVIEW_VIDEOS) isExtra = true;
      else previewVideoCount += 1;
    }
    if (item.type === 'photo') {
      wrap.className = `creative-item photo reveal delay-${delayN}`;
      wrap.dataset.type = 'photo';
      wrap.dataset.mediaId = item.file;
      wrap.innerHTML = `
        <div class="creative-post-frame">
          <div class="creative-post-header">
            <span class="creative-post-title">Photography</span>
            <span class="creative-post-dots" aria-hidden="true">⋯</span>
          </div>
          <div class="creative-post-media">
            <img loading="lazy" onerror="this.style.display='none'" alt="" />
            <div class="creative-placeholder photo-ph"><span>📷</span></div>
          </div>
          <div class="creative-post-toolbar">
            <div class="creative-post-toolbar-left">${postLikeButton}</div>
            <div class="creative-post-toolbar-right">${postIconComment}${postIconSend}${postIconBookmark}</div>
          </div>
          <p class="creative-post-caption creative-caption"></p>
        </div>`;
      const img = wrap.querySelector('img');
      img.src = creativeMediaSrc(PHOTO_BASE, item.file);
      img.alt = item.caption;
      wrap.querySelector('.creative-caption').textContent = item.caption;
    } else {
      wrap.className = `creative-item video reveal delay-${delayN}`;
      wrap.dataset.type = 'video';
      wrap.dataset.mediaId = item.file;
      wrap.innerHTML = `
        <div class="creative-post-frame">
          <div class="creative-post-header">
            <span class="creative-post-title">Videography</span>
            <span class="creative-post-dots" aria-hidden="true">⋯</span>
          </div>
          <div class="creative-post-media">
            <video class="creative-video" playsinline preload="metadata"></video>
            <div class="creative-placeholder video-ph"><span>🎬</span></div>
          </div>
          <div class="creative-post-toolbar">
            <div class="creative-post-toolbar-left">${postLikeButton}</div>
            <div class="creative-post-toolbar-right">${postIconComment}${postIconSend}${postIconBookmark}</div>
          </div>
          <p class="creative-post-caption creative-caption"></p>
        </div>`;
      const video = wrap.querySelector('video');
      video.src = creativeMediaSrc(VIDEO_BASE, item.file);
      setupCreativeVideoEl(video);
      video.setAttribute('aria-label', item.caption);
      wrap.querySelector('.creative-caption').textContent = item.caption;
    }
    if (isExtra) wrap.classList.add('extra');
    grid.appendChild(wrap);
  });

  grid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));
  loadCreativeLikes();
  updateLikedFilterCount();
  grid.querySelectorAll('.creative-item').forEach(syncCreativeLikeUi);

  const filterBtns = document.querySelectorAll('.creative-filters .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyCreativeVisibility();
    });
  });

  grid.querySelectorAll('.creative-like-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const item = btn.closest('.creative-item');
      if (!item) return;
      const mediaId = item.dataset.mediaId || '';
      toggleCreativeLike(mediaId);
      syncCreativeLikeUi(item);
      applyCreativeVisibility();
    });
  });

  const btnCreative = document.getElementById('btn-creative-toggle');
  const hasExtras = CREATIVE_PHOTO_FILES.length > CREATIVE_PREVIEW_PHOTOS
    || CREATIVE_VIDEO_FILES.length > CREATIVE_PREVIEW_VIDEOS;
  if (btnCreative && hasExtras) {
    btnCreative.addEventListener('click', () => {
      creativeExpanded = !creativeExpanded;
      btnCreative.classList.toggle('active', creativeExpanded);
      if (creativeExpanded) {
        btnCreative.innerHTML = 'Show Less <span class="toggle-icon" style="display:inline-block;transform:rotate(180deg)">↓</span>';
      } else {
        btnCreative.innerHTML = 'View All <span class="toggle-icon">↓</span>';
      }
      applyCreativeVisibility();
      if (!creativeExpanded && document.querySelector('.creative-filters .filter-btn.active')?.dataset.filter === 'all') {
        document.getElementById('creative')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  applyCreativeVisibility();

  grid.querySelectorAll('.creative-item').forEach(item => {
    item.addEventListener('click', e => {
      if (item.classList.contains('hidden')) return;
      e.preventDefault();
      openLightboxForElement(item);
    });
  });
}

initCreativeGallery();

// -----------------------------------------------------------------
// Contact: Formspree endpoint receives POST as `multipart/form-data` (same as native submit).
// -----------------------------------------------------------------
// We POST with fetch so visitors stay on the page and get inline success / error copy.
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqewgnyb';
const form = document.getElementById('contact-form');
const sendBtn = document.getElementById('send-btn');
const successMsg = document.getElementById('form-success');
const errorMsg = document.getElementById('form-error');

/**
 * Submits the contact form via `fetch` so the page does not navigate away. Formspree returns JSON
 * with field errors when validation fails; network errors are surfaced in `errorMsg`.
 */
form.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.name.value.trim() || !form.email.value.trim() || !form.message.value.trim()) return;
  successMsg.classList.remove('visible');
  errorMsg.classList.remove('visible');
  errorMsg.textContent = '';
  sendBtn.disabled = true;
  const sendText = sendBtn.querySelector('.btn-send-text');
  sendText.textContent = 'Sending...';
  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' },
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      form.reset();
      successMsg.classList.add('visible');
      setTimeout(() => successMsg.classList.remove('visible'), 5000);
    } else {
      let detail = '';
      if (data.errors) {
        detail = Object.values(data.errors)
          .flat()
          .filter(Boolean)
          .join(' ');
      }
      errorMsg.textContent =
        detail || data.error || 'Something went wrong. Please try again or use the email above.';
      errorMsg.classList.add('visible');
    }
  } catch {
    errorMsg.textContent =
      'Could not send right now. Check your connection or email me using the address on the left.';
    errorMsg.classList.add('visible');
  } finally {
    sendBtn.disabled = false;
    sendText.textContent = 'Send';
  }
});

// -----------------------------------------------------------------
// Skills: subtle inline transform on pill hover (progressive enhancement; no `prefers-reduced-motion` gating)
// -----------------------------------------------------------------
document.querySelectorAll('.skill-pill').forEach(p => {
  p.addEventListener('mouseenter', () => p.style.transform = 'translateY(-2px)');
  p.addEventListener('mouseleave', () => p.style.transform = '');
});

// In-page anchors: native smooth scroll ignores the fixed header, so we subtract `--nav-h`
// manually; keeps section titles from hiding under the nav bar.
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
});

// About section: if portrait `<img>` errors, show adjacent initials placeholder in `.photo-frame`.
document.querySelectorAll('.photo-frame img').forEach(img => {
  img.addEventListener('error', function() {
    this.style.display = 'none';
    const init = this.nextElementSibling;
    if (init) init.style.display = 'flex';
  });
  img.addEventListener('load', function() {
    const init = this.nextElementSibling;
    if (init) init.style.display = 'none';
  });
});

// Projects: subtle perspective tilt on desktop pointers—purely decorative; CSS still does
// the main hover lift so touch users aren’t missing critical feedback.
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-5px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform .4s var(--ease), border-color .3s, box-shadow .3s';
  });
  card.addEventListener('mouseenter', () => {
    card.style.transition = 'transform .1s, border-color .3s, box-shadow .3s';
  });
});

// Landing (portfolio hero): parallax on mouse — text block, year, name, and decorative assets share depth.
const landingHero = document.querySelector('.hero-portfolio');
const landingPortText = document.querySelector('.hero-portfolio .port-text');
const landingPhotoWrap = document.getElementById('photoWrap');
const landingBgWord = document.querySelector('.hero-portfolio .bg-word');
const landingYearText = document.querySelector('.hero-portfolio .year-text');
const landingNameBlock = document.querySelector('.hero-portfolio .name-block');
const landingElements = document.querySelectorAll('.hero-portfolio .hero-element');

/**
 * @param {Element} element One of `.hero-element-*` icons; preserves their authored rotation in CSS.
 * @returns {string} A `transform` fragment used when resetting after `mouseleave`
 */
function getLandingElementBaseTransform(element) {
  if (element.classList.contains('hero-element-camera')) return 'rotate(-9deg)';
  if (element.classList.contains('hero-element-laptop')) return 'rotate(8deg)';
  if (element.classList.contains('hero-element-clapper')) return 'rotate(-11deg)';
  if (element.classList.contains('hero-element-code')) return 'rotate(6deg)';
  return '';
}

const landingParallaxMedia = window.matchMedia('(min-width: 769px)');

function clearLandingParallaxIfNarrow() {
  if (landingParallaxMedia.matches) return;
  if (landingPortText) landingPortText.style.transform = '';
  if (landingPhotoWrap) landingPhotoWrap.style.transform = '';
  if (landingBgWord) landingBgWord.style.transform = '';
  if (landingYearText) landingYearText.style.transform = '';
  if (landingNameBlock) landingNameBlock.style.transform = '';
  landingElements.forEach(element => {
    element.style.transform = getLandingElementBaseTransform(element);
  });
}
if (typeof landingParallaxMedia.addEventListener === 'function') {
  landingParallaxMedia.addEventListener('change', clearLandingParallaxIfNarrow);
} else {
  landingParallaxMedia.addListener(clearLandingParallaxIfNarrow);
}
clearLandingParallaxIfNarrow();

if (landingHero && landingPortText && landingPhotoWrap && landingYearText && landingNameBlock) {
  landingHero.addEventListener('mousemove', e => {
    if (!landingParallaxMedia.matches) return;
    const { clientX, clientY, currentTarget } = e;
    const { width, height, left, top } = currentTarget.getBoundingClientRect();
    const cx = (clientX - left) / width - 0.5;
    const cy = (clientY - top) / height - 0.5;

    landingPortText.style.transform = `perspective(900px) rotateY(${cx * 12}deg) rotateX(${-cy * 8}deg) translateZ(20px)`;
    landingPhotoWrap.style.transform = `translateX(calc(-50% + ${cx * 18}px)) translateY(${cy * 10}px)`;
    if (landingBgWord) {
      landingBgWord.style.transform = `translateX(${cx * -30}px) translateY(${cy * -10}px)`;
    }
    landingYearText.style.transform = `perspective(600px) rotateY(${cx * 6}deg) rotateX(${-cy * 4}deg)`;
    landingNameBlock.style.transform = `translateX(${cx * -12}px) translateY(${cy * -6}px)`;
    landingElements.forEach((element, i) => {
      const depth = (i + 1) * 8;
      element.style.transform = `${getLandingElementBaseTransform(element)} translate3d(${cx * depth}px, ${cy * depth}px, 0)`;
    });
  });

  landingHero.addEventListener('mouseleave', () => {
    if (!landingParallaxMedia.matches) {
      clearLandingParallaxIfNarrow();
      return;
    }
    landingPortText.style.transform = 'perspective(900px) rotateY(0deg) rotateX(0deg) translateZ(0)';
    landingPhotoWrap.style.transform = 'translateX(-50%) translateY(0)';
    if (landingBgWord) landingBgWord.style.transform = 'none';
    landingYearText.style.transform = 'none';
    landingNameBlock.style.transform = 'none';
    landingElements.forEach(element => {
      element.style.transform = getLandingElementBaseTransform(element);
    });
  });

  // Split “PORTFOLIO” into spans so hovering can wiggle letters—small delight, desktop only.
  const text = landingPortText.textContent || '';
  landingPortText.innerHTML = text
    .split('')
    .map((ch, i) => `<span class="pl" style="display:inline-block;transition:transform .25s ${i * 0.04}s,color .25s ${i * 0.04}s">${ch}</span>`)
    .join('');

  landingPortText.addEventListener('mouseenter', () => {
    landingPortText.querySelectorAll('.pl').forEach((span, i) => {
      span.style.transform = `translateY(${i % 2 === 0 ? '-8px' : '8px'}) rotate(${(i - 4) * 2}deg)`;
      span.style.color = '#d9305a';
    });
  });

  landingPortText.addEventListener('mouseleave', () => {
    landingPortText.querySelectorAll('.pl').forEach(span => {
      span.style.transform = '';
      span.style.color = '';
    });
  });
}
