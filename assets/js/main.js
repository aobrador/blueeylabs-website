// ── Page load fade-in ──
document.documentElement.style.opacity = '0';
window.addEventListener('DOMContentLoaded', () => {
  document.documentElement.style.transition = 'opacity 0.4s ease';
  document.documentElement.style.opacity = '1';
});

// ── Scroll progress bar ──
const progressBar = document.createElement('div');
progressBar.id = 'scroll-progress';
document.body.prepend(progressBar);

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progressBar.style.width = pct + '%';

  // Nav shadow
  const nav = document.querySelector('nav');
  if (nav) {
    nav.style.boxShadow = scrollTop > 10 ? '0 4px 40px rgba(0,0,0,0.4)' : 'none';
  }
});

// ── Mobile nav toggle with X animation ──
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
  // Close on link click
  navLinks.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// ── Active nav link ──
const currentPath = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(link => {
  const href = link.getAttribute('href');
  if (href === currentPath || (currentPath === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// ── Scroll fade-up animation ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.fade-up').forEach(el => observer.observe(el));

// ── Typewriter effect ──
function typewriter(el, words, speed = 80, pause = 2000) {
  if (!el) return;
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
const typeEl = document.getElementById('typewriter');
if (typeEl) {
  typewriter(typeEl, ['the way you work.', 'your budget.', 'your workflow.', 'what matters.']);
}
