// Always start at top on reload
history.scrollRestoration = 'manual';
window.scrollTo(0, 0);

// Hide loading screen after animation completes
window.addEventListener('load', () => {
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.classList.add('hidden');
    }, 2200);
});

// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Mobile menu
const menuToggle = document.getElementById('menuToggle');
const mainNav = document.getElementById('mainNav');
const navClose = document.getElementById('navClose');
const navOverlay = document.getElementById('navOverlay');

function closeMenu() {
    menuToggle.classList.remove('active');
    mainNav.classList.remove('open');
    navOverlay.classList.remove('active');
    document.body.classList.remove('menu-open');
}

function openMenu() {
    menuToggle.classList.add('active');
    mainNav.classList.add('open');
    navOverlay.classList.add('active');
    document.body.classList.add('menu-open');
}

menuToggle.addEventListener('click', () => {
    mainNav.classList.contains('open') ? closeMenu() : openMenu();
});
navClose.addEventListener('click', closeMenu);
navOverlay.addEventListener('click', closeMenu);
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
});

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;
themeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    showToast(newTheme === 'dark' ? 'Modo oscuro activado' : 'Modo claro activado', 'info');
});

// Custom Cursor
const cursorGlow = document.getElementById('cursorGlow');
let mouseX = 0, mouseY = 0, cursorX = 0, cursorY = 0;
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursorGlow.classList.add('active');
});
document.addEventListener('mouseleave', () => {
    cursorGlow.classList.remove('active');
});
function animateCursor() {
    cursorX += (mouseX - cursorX) * 0.15;
    cursorY += (mouseY - cursorY) * 0.15;
    cursorGlow.style.left = cursorX - 10 + 'px';
    cursorGlow.style.top = cursorY - 10 + 'px';
    requestAnimationFrame(animateCursor);
}
animateCursor();
document.querySelectorAll('a, button, .card').forEach(el => {
    el.addEventListener('mouseenter', () => cursorGlow.classList.add('hovering'));
    el.addEventListener('mouseleave', () => cursorGlow.classList.remove('hovering'));
});

// Particle Canvas — textura de fondo
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

let particles = [];
let viewportW = window.innerWidth;
let viewportH = window.innerHeight;
let connectionDistance = 220;
let animationId = null;

function isLightTheme() {
    return document.documentElement.getAttribute('data-theme') === 'light';
}
// En fondo claro las partículas necesitan más peso para no desaparecer.
function particleColor(alpha) {
    const a = isLightTheme() ? Math.min(1, alpha * 1.25) : alpha;
    return isLightTheme() ? `rgba(13,148,136, ${a})` : `rgba(45,212,191, ${a})`;
}

class Particle {
    constructor() {
        this.x = Math.random() * viewportW;
        this.y = Math.random() * viewportH;
        this.vx = (Math.random() - 0.5) * 0.34;
        this.vy = (Math.random() - 0.5) * 0.34;
        this.radius = Math.random() * 1.5 + 0.9;
        this.alpha = Math.random() * 0.35 + 0.45;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > viewportW) this.vx *= -1;
        if (this.y < 0 || this.y > viewportH) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = particleColor(this.alpha);
        ctx.fill();
    }
}

// La densidad importa: pocas partículas muy separadas no forman red, forman ruido.
function particleBudget() {
    const area = viewportW * viewportH;
    return Math.max(24, Math.min(58, Math.round(area / 38000)));
}

function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewportW = window.innerWidth;
    viewportH = window.innerHeight;
    canvas.width = Math.round(viewportW * dpr);
    canvas.height = Math.round(viewportH * dpr);
    canvas.style.width = viewportW + 'px';
    canvas.style.height = viewportH + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = particleBudget();
    const spacing = Math.sqrt((viewportW * viewportH) / count);
    connectionDistance = Math.max(120, Math.min(230, spacing * 1.15));

    particles = Array.from({ length: count }, () => new Particle());
}

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < connectionDistance) {
                const opacity = (1 - distance / connectionDistance) * 0.32;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = particleColor(opacity);
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
}

function renderParticles() {
    ctx.clearRect(0, 0, viewportW, viewportH);
    for (const p of particles) {
        p.update();
        p.draw();
    }
    drawConnections();
}

function animateParticles() {
    renderParticles();
    animationId = requestAnimationFrame(animateParticles);
}

function startParticles() {
    if (animationId !== null) return;
    if (reducedMotionQuery.matches) {
        renderParticles();
        return;
    }
    animationId = requestAnimationFrame(animateParticles);
}

function stopParticles() {
    if (animationId !== null) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
}

resizeCanvas();
startParticles();

window.addEventListener('resize', () => {
    resizeCanvas();
    if (reducedMotionQuery.matches) renderParticles();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopParticles();
    } else {
        startParticles();
    }
});

reducedMotionQuery.addEventListener('change', () => {
    if (reducedMotionQuery.matches) {
        stopParticles();
        renderParticles();
    } else {
        startParticles();
    }
});

// Typewriter Effect
const typewriterText = document.getElementById('typewriterText');
const phrases = [
    'Automatización de procesos empresariales...',
    'Chatbots inteligentes 24/7...',
    'Análisis de datos en tiempo real...',
    'Integraciones con tu tech stack...',
    'ROI medible desde el primer día...'
];
let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeSpeed = 100;

function typeWriter() {
    const currentPhrase = phrases[phraseIndex];
    if (isDeleting) {
        typewriterText.textContent = currentPhrase.substring(0, charIndex - 1);
        charIndex--;
        typeSpeed = 50;
    } else {
        typewriterText.textContent = currentPhrase.substring(0, charIndex + 1);
        charIndex++;
        typeSpeed = 100;
    }
    if (!isDeleting && charIndex === currentPhrase.length) {
        isDeleting = true;
        typeSpeed = 2000;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        typeSpeed = 500;
    }
    setTimeout(typeWriter, typeSpeed);
}
setTimeout(typeWriter, 1000);

// Animated Counters
function animateCounters() {
    const counters = document.querySelectorAll('[data-count]');
    counters.forEach(counter => {
        const target = parseInt(counter.getAttribute('data-count'));
        const duration = 2000;
        const start = 0;
        const startTime = performance.now();
        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(start + (target - start) * easeOut);
            counter.textContent = current + (counter.classList.contains('hero-stat-number') && target === 100 ? '' : '+');
            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }
        requestAnimationFrame(update);
    });
}

// Scroll Reveal
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            if (entry.target.querySelector('[data-count]')) {
                animateCounters();
            }
        } else {
            entry.target.classList.remove('visible');
        }
    });
}, { threshold: 0.05 });
revealElements.forEach(el => revealObserver.observe(el));

// Active nav link
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        if (scrollY >= sectionTop - 200) {
            current = section.getAttribute('id');
        }
    });
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === '#' + current) {
            link.classList.add('active');
        }
    });
});

// FAQ Accordion
document.querySelectorAll('.faq-question').forEach(question => {
    question.addEventListener('click', () => {
        const item = question.parentElement;
        const isActive = item.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('active'));
        if (!isActive) {
            item.classList.add('active');
        }
    });
});

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}</span>
        <span>${message}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Contact Form

// Demo Button
document.getElementById('demoBtn').addEventListener('click', () => {
    window.location.href = '/deck?demo=1#4';
});

// Scroll to Top
const scrollToTopBtn = document.getElementById('scrollToTopBtn');
window.addEventListener('scroll', () => {
    if (window.scrollY > 500) {
        scrollToTopBtn.classList.add('visible');
    } else {
        scrollToTopBtn.classList.remove('visible');
    }
});
scrollToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href !== '#' && document.querySelector(href)) {
            e.preventDefault();
            document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            history.pushState(null, null, href);
        }
    });
});

// Magnetic Buttons Effect
document.querySelectorAll('.magnetic-btn').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.2}px)`;
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
    });
});

// Keyboard accessibility
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        menuToggle.classList.remove('active');
        mainNav.classList.remove('open');
    }
});

// Performance: Pause particles when tab is hidden
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        cancelAnimationFrame(animationId);
    } else {
        animateParticles();
    }
});
