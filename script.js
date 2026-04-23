/* ================================================================
   Portfolio Frontend Controller
   - Handles visual effects, section interactions, and form submission
   - Designed for static hosting (no build step required)
   ================================================================ */

// -----------------------------------------------------------------
// Particle system: animated ambient background with mouse repulsion.
// -----------------------------------------------------------------
const canvas = document.getElementById('particle-canvas');
const ctx = canvas.getContext('2d');
let W, H, particles = [], mouse = { x: -9999, y: -9999 };
const PARTICLE_COUNT = 90;

// Keep the canvas dimensions in lockstep with the viewport.
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
  [124, 92, 252],   // purple
  [45, 212, 191],   // teal
  [244, 114, 182],  // pink
  [168, 126, 255],  // lavender
  [251, 191, 36],   // amber (rare)
];

// Single particle lifecycle (spawn -> animate -> recycle).
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

function initParticles() {
  particles = [];
  for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
}

// Draw subtle connection lines between nearby particles.
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
        ctx.strokeStyle = `rgba(124,92,252,1)`;
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

// Navbar: apply translucent style once scrolling starts.
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => navbar.classList.toggle('scrolled', window.scrollY > 20));

// Mobile menu: toggle state and lock page scroll while open.
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

// Active navigation state based on visible section.
const sections  = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-link');
new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' }).observe.bind(null);

const sectObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      const id = e.target.id;
      navLinks.forEach(l => l.classList.toggle('active', l.getAttribute('href') === `#${id}`));
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' });
sections.forEach(s => sectObs.observe(s));

// Reveal-on-scroll animation trigger.
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); }
  });
}, { threshold: 0.08, rootMargin: '0px 0px -50px 0px' });
document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// Increment animated metrics when hero stats enter view.
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

// CV modal open/close behavior and fallback handling.
const cvBackdrop = document.getElementById('cv-modal-backdrop');
const cvClose    = document.getElementById('cv-modal-close');
const cvIframe   = document.getElementById('cv-iframe');
const cvFallback = document.getElementById('cv-fallback');

function openCV() {
  cvBackdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  cvFallback.classList.remove('show');
}
function closeCV() {
  cvBackdrop.classList.remove('open');
  document.body.style.overflow = '';
  cvFallback.classList.remove('show');
}

// Some browsers fail silently on iframe PDF rendering; rely on error event for fallback only.
cvIframe.addEventListener('error', () => cvFallback.classList.add('show'));

document.getElementById('btn-cv-view-about').addEventListener('click', openCV);
document.getElementById('btn-cv-view-contact').addEventListener('click', openCV);
cvClose.addEventListener('click', closeCV);
cvBackdrop.addEventListener('click', e => { if (e.target === cvBackdrop) closeCV(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeCV(); closeLightbox(); } });

// Projects list expansion/collapse.
const btnProjects  = document.getElementById('btn-projects-toggle');
const extraProjects = document.querySelectorAll('.project-card.extra');
let projectsOpen   = false;

btnProjects.addEventListener('click', () => {
  projectsOpen = !projectsOpen;
  btnProjects.classList.toggle('active', projectsOpen);
  if (projectsOpen) {
    btnProjects.innerHTML = 'Show Less <span class="toggle-icon" style="display:inline-block;transform:rotate(180deg)">↓</span>';
    extraProjects.forEach((c, i) => {
      setTimeout(() => { c.classList.add('shown'); c.style.opacity='1'; c.style.transform='none'; }, i * 80);
    });
  } else {
    btnProjects.innerHTML = 'View All <span class="toggle-icon">↓</span>';
    extraProjects.forEach(c => c.classList.remove('shown'));
    document.getElementById('projects').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

// Experience timeline expansion/collapse.
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

// Lightbox for photography items in the creative section.
const lightbox    = document.getElementById('lightbox');
const lbImg       = document.getElementById('lightbox-img');
const lbCaption   = document.getElementById('lightbox-caption');
const lbClose     = document.getElementById('lightbox-close');
const lbPrev      = document.getElementById('lightbox-prev');
const lbNext      = document.getElementById('lightbox-next');
let lightboxItems = [];
let lbIndex       = 0;

// Rebuild the photo list from visible DOM items to stay in sync with filters.
function buildLightboxList() {
  lightboxItems = [];
  document.querySelectorAll('.creative-item.photo').forEach(item => {
    const img  = item.querySelector('img');
    const cap  = item.querySelector('.creative-caption');
    const src  = img && img.style.display !== 'none' ? img.src : null;
    const ph   = item.querySelector('.creative-placeholder span');
    lightboxItems.push({
      src: src || '',
      caption: cap ? cap.textContent : '',
      placeholder: ph ? ph.textContent : ''
    });
  });
}

function openLightbox(index) {
  buildLightboxList();
  lbIndex = index;
  showLightboxItem();
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.style.overflow = '';
}
function showLightboxItem() {
  const item = lightboxItems[lbIndex];
  if (!item) return;
  if (item.src) {
    lbImg.src = item.src;
    lbImg.style.display = 'block';
  } else {
    lbImg.style.display = 'none';
  }
  lbCaption.textContent = item.caption;
}

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
  if (e.key === 'ArrowLeft')  { lbIndex = (lbIndex - 1 + lightboxItems.length) % lightboxItems.length; showLightboxItem(); }
  if (e.key === 'ArrowRight') { lbIndex = (lbIndex + 1) % lightboxItems.length; showLightboxItem(); }
});

// Creative gallery manifests (one entry per local media file).
const PHOTO_BASE = 'assets/photos';
const VIDEO_BASE = 'assets/Videos';

// Encode filenames safely so spaces and special characters resolve correctly.
function creativeMediaSrc(base, filename) {
  return `${base}/${encodeURIComponent(filename)}`;
}

/** Keep in sync with files in assets/photos (add one object per image). */
const CREATIVE_PHOTO_FILES = [
  { file: '20250715_1314_HALA Logo Blueprint_remix_01k07h2t6vevrtp6nrevdr4map.png', caption: 'HALA — logo blueprint', tall: true },
  { file: 'IM-2.png', caption: 'Interactive media' },
  { file: 'IMG_5494.jpg', caption: 'IMG 5494' },
  { file: 'IMG_7316.jpg', caption: 'IMG 7316' },
  { file: 'Mily_Week4-2_D&P1.JPG', caption: 'Design & Production — week 4' },
  { file: 'Mily_Week5_D&P1.JPG', caption: 'Design & Production — week 5', tall: true },
  { file: 'blossom.jpg', caption: 'Blossom' },
  { file: 'bruges.jpg', caption: 'Bruges' },
  { file: 'eiffel.jpg', caption: 'Eiffel Tower' },
  { file: 'flower1.jpg', caption: 'Flowers I', tall: true },
  { file: 'flower2.jpg', caption: 'Flowers II' },
  { file: 'flower3.jpg', caption: 'Flowers III' },
  { file: 'food1.jpg', caption: 'Food' },
  { file: 'italy.jpg', caption: 'Italy' },
  { file: 'louvre1.jpg', caption: 'Louvre I', tall: true },
  { file: 'louvre2.jpg', caption: 'Louvre II' },
  { file: 'milzz_E-Textile_Light-Up_Butterfly_Bracelet_Modern_editorial__68cbbdf7-c533-46f7-a87e-a65ce00ad3ca_0.png', caption: 'E-textile — editorial frame', tall: true },
  { file: 'monalisa.jpg', caption: 'Mona Lisa' },
  { file: 'norway2.jpg', caption: 'Norway' },
  { file: 'painting1.jpg', caption: 'Painting I', tall: true },
  { file: 'painting2.jpg', caption: 'Painting II' },
];

/** Keep in sync with files in assets/Videos (add one object per clip). */
const CREATIVE_VIDEO_FILES = [
  { file: 'video.mov', caption: 'Edited cut — motion & rhythm' },
  { file: 'baking.mov', caption: 'Baking — short form' },
  { file: 'cooking.mov', caption: 'Cooking' },
  { file: 'cooking2.mov', caption: 'Cooking II' },
  { file: 'dayvlog.mov', caption: 'Day vlog' },
  { file: 'iguessillgetonaplane.mov', caption: 'I guess I\'ll get on a plane' },
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

// Apply active filter + preview/expanded state to every gallery item.
function applyCreativeVisibility() {
  const grid = document.getElementById('creative-grid');
  if (!grid) return;
  const filterBtn = document.querySelector('.creative-filters .filter-btn.active');
  const filter = filterBtn ? filterBtn.dataset.filter : 'all';
  const previewAll = filter === 'all' && !creativeExpanded;

  grid.querySelectorAll('.creative-item').forEach(cItem => {
    const matchType = filter === 'all' || cItem.dataset.type === filter;
    const isExtra = cItem.classList.contains('extra');
    const match = matchType && !(previewAll && isExtra);

    cItem.style.transition = 'opacity .3s, transform .3s';
    if (match) {
      cItem.style.opacity = '1';
      cItem.style.transform = '';
      cItem.classList.remove('hidden');
    } else {
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

// Build media cards, wire filters/toggles, and attach per-item behaviors.
function initCreativeGallery() {
  const grid = document.getElementById('creative-grid');
  if (!grid) return;

  const sequence = [];
  let pi = 0, vi = 0;
  while (pi < CREATIVE_PHOTO_FILES.length || vi < CREATIVE_VIDEO_FILES.length) {
    if (pi < CREATIVE_PHOTO_FILES.length) sequence.push({ type: 'photo', ...CREATIVE_PHOTO_FILES[pi++] });
    if (vi < CREATIVE_VIDEO_FILES.length) sequence.push({ type: 'video', ...CREATIVE_VIDEO_FILES[vi++] });
  }

  const playSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

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
      wrap.innerHTML = `
        <img loading="lazy" onerror="this.style.display='none'" alt="" />
        <div class="creative-placeholder photo-ph"><span>📷</span></div>
        <div class="creative-overlay">
          <span class="creative-type-badge">Photography</span>
          <p class="creative-caption"></p>
        </div>`;
      const img = wrap.querySelector('img');
      img.src = creativeMediaSrc(PHOTO_BASE, item.file);
      img.alt = item.caption;
      wrap.querySelector('.creative-caption').textContent = item.caption;
    } else {
      wrap.className = `creative-item video reveal delay-${delayN}`;
      wrap.dataset.type = 'video';
      wrap.innerHTML = `
        <video class="creative-video" playsinline preload="metadata"></video>
        <div class="creative-placeholder video-ph"><span>🎬</span></div>
        <div class="play-btn-wrap">
          <div class="play-btn">${playSvg}</div>
        </div>
        <div class="creative-overlay">
          <span class="creative-type-badge video-badge">Videography</span>
          <p class="creative-caption"></p>
        </div>`;
      const video = wrap.querySelector('video');
      video.src = creativeMediaSrc(VIDEO_BASE, item.file);
      video.setAttribute('aria-label', item.caption);
      wrap.querySelector('.creative-caption').textContent = item.caption;
    }
    if (isExtra) wrap.classList.add('extra');
    grid.appendChild(wrap);
  });

  grid.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

  const filterBtns = document.querySelectorAll('.creative-filters .filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
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

  grid.querySelectorAll('.creative-item.photo').forEach((item, i) => {
    item.addEventListener('click', () => openLightbox(i));
  });

  grid.querySelectorAll('.creative-item.video').forEach(item => {
    const video = item.querySelector('video.creative-video');
    if (!video) return;
    item.addEventListener('click', () => {
      grid.querySelectorAll('.creative-item.video video').forEach(v => {
        if (v !== video) {
          v.pause();
          v.removeAttribute('controls');
        }
      });
      video.setAttribute('controls', '');
      video.play().catch(() => {});
    });
  });
}

initCreativeGallery();

// Contact form submission via Formspree (AJAX).
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mqewgnyb';
const form       = document.getElementById('contact-form');
const sendBtn    = document.getElementById('send-btn');
const successMsg = document.getElementById('form-success');
const errorMsg   = document.getElementById('form-error');

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

// Supplemental hover lift for skill pills.
document.querySelectorAll('.skill-pill').forEach(p => {
  p.addEventListener('mouseenter', () => p.style.transform = 'translateY(-2px)');
  p.addEventListener('mouseleave', () => p.style.transform = '');
});

// Smooth anchor navigation with fixed-navbar offset compensation.
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h')) || 68;
    window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
  });
});

// Profile image fallback: reveal initials if photo fails to load.
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

// Mascot eye tracking and blink behavior.
(() => {
  const doll = document.getElementById('mily-doll');
  if (!doll) return;
  const svg = doll.querySelector('.mily-doll');
  const pupils = doll.querySelectorAll('.mily-pupil');
  if (!svg || pupils.length === 0) return;

  // Maximum pupil displacement in SVG coordinate space.
  const MAX_SHIFT = 3.2;
  // Baseline pupil centers in the SVG viewBox.
  const centers = [
    { x: 115, y: 170 },
    { x: 185, y: 170 },
  ];

  let targetX = 0, targetY = 0;
  let currX = 0, currY = 0;
  let rafId = null;

  function onMouseMove(e) {
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0) return;
    // Convert pointer position from CSS pixels into SVG coordinates.
    const vb = svg.viewBox.baseVal;
    const mx = ((e.clientX - rect.left) / rect.width)  * vb.width;
    const my = ((e.clientY - rect.top)  / rect.height) * vb.height;
    // Compute gaze direction from the midpoint between both eyes.
    const cx = (centers[0].x + centers[1].x) / 2;
    const cy = (centers[0].y + centers[1].y) / 2;
    const dx = mx - cx;
    const dy = my - cy;
    const dist = Math.hypot(dx, dy) || 1;
    const scale = Math.min(1, dist / 120); // soften motion for near-cursor positions
    targetX = (dx / dist) * MAX_SHIFT * scale;
    targetY = (dy / dist) * MAX_SHIFT * scale;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    currX += (targetX - currX) * 0.22;
    currY += (targetY - currY) * 0.22;
    pupils.forEach(p => {
      p.setAttribute('transform', `translate(${currX.toFixed(2)} ${currY.toFixed(2)})`);
    });
    if (Math.abs(targetX - currX) > 0.05 || Math.abs(targetY - currY) > 0.05) {
      rafId = requestAnimationFrame(tick);
    } else {
      rafId = null;
    }
  }

  window.addEventListener('mousemove', onMouseMove, { passive: true });

  // Trigger periodic blink to keep the character feeling alive.
  function blink() {
    pupils.forEach(p => { p.style.transition = 'transform .15s, opacity .12s'; p.style.opacity = '0'; });
    setTimeout(() => pupils.forEach(p => { p.style.opacity = '1'; }), 140);
    setTimeout(blink, 3500 + Math.random() * 4000);
  }
  setTimeout(blink, 2500);
})();

// Pointer-based 3D tilt interaction for project cards.
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
