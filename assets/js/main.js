const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const canHover = window.matchMedia('(hover: hover)').matches;

// ── Scroll progress bar ──
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.prepend(progressBar);

const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  progressBar.style.width = (docHeight > 0 ? (scrollTop / docHeight) * 100 : 0) + '%';
  if (nav) nav.style.boxShadow = scrollTop > 10 ? '0 4px 40px rgba(0,0,0,0.4)' : 'none';
}, { passive: true });

// ── Mobile nav toggle ──
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// ── Active nav link ──
const pageName = (path) => (path.split('/').pop() || 'index').replace(/\.html$/, '');
const currentPage = pageName(window.location.pathname);
document.querySelectorAll('.nav-links a').forEach(link => {
  if (pageName(link.getAttribute('href')) === currentPage) link.classList.add('active');
});

// ── Scroll fade-up ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── Typewriter ──
function typewriter(el, words, speed = 80, pause = 2000) {
  if (!el || reduceMotion) return;
  let wordIndex = 0, charIndex = 0, deleting = false;
  function tick() {
    const word = words[wordIndex];
    el.textContent = deleting ? word.slice(0, charIndex--) : word.slice(0, charIndex++);
    if (!deleting && charIndex > word.length) {
      deleting = true;
      setTimeout(tick, pause);
      return;
    }
    if (deleting && charIndex < 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
    }
    setTimeout(tick, deleting ? speed / 2 : speed);
  }
  tick();
}
typewriter(document.getElementById('typewriter'), ['your money.', 'your inventory.', 'your collection.', 'the way you work.']);

// ── Pointer effects (desktop only) ──
if (canHover && !reduceMotion) {
  // Border glow follows the cursor
  document.querySelectorAll('.glow').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  // Hero icons drift with the cursor
  const hero = document.querySelector('.hero');
  const heroVisual = document.querySelector('.hero-visual');
  if (hero && heroVisual) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      heroVisual.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      heroVisual.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    });
    hero.addEventListener('pointerleave', () => {
      heroVisual.style.setProperty('--px', 0);
      heroVisual.style.setProperty('--py', 0);
    });
  }

  // Holographic tilt on the card fan
  document.querySelectorAll('[data-holo]').forEach(area => {
    const fan = area.querySelector('.fan');
    if (!fan) return;
    area.addEventListener('pointermove', (e) => {
      const r = area.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      fan.style.setProperty('--ry', (nx * 22).toFixed(2) + 'deg');
      fan.style.setProperty('--rx', (-ny * 16).toFixed(2) + 'deg');
      fan.style.setProperty('--hx', (50 + nx * 120).toFixed(1) + '%');
      fan.style.setProperty('--hy', (50 + ny * 120).toFixed(1) + '%');
      fan.style.setProperty('--ho', 1);
    });
    area.addEventListener('pointerleave', () => {
      ['--ry', '--rx', '--hx', '--hy', '--ho'].forEach(v => fan.style.removeProperty(v));
    });
  });
}

// ── Background colour shifts while a warm section is on screen ──
const warmSection = document.querySelector('[data-tone="warm"]');
if (warmSection) {
  new IntersectionObserver(([entry]) => {
    document.body.classList.toggle('tone-warm', entry.isIntersecting);
  }, { rootMargin: '-35% 0px -35% 0px' }).observe(warmSection);
}
