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

// Particle Canvas
const canvas = document.getElementById('particleCanvas');
const ctx = canvas.getContext('2d');
let particles = [];
const particleCount = 60;
const connectionDistance = 150;
let animationId;

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas.height) this.vy *= -1;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 255, 136, 0.5)';
        ctx.fill();
    }
}

function initParticles() {
    particles = [];
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}
initParticles();

function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < connectionDistance) {
                const opacity = (1 - distance / connectionDistance) * 0.2;
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.strokeStyle = `rgba(0, 255, 136, ${opacity})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
        p.update();
        p.draw();
    });
    drawConnections();
    animationId = requestAnimationFrame(animateParticles);
}
animateParticles();

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

// Testimonials Slider
const track = document.getElementById('testimonialTrack');
const dots = document.querySelectorAll('.testimonial-dot');
const prevBtn = document.getElementById('prevTestimonial');
const nextBtn = document.getElementById('nextTestimonial');
let currentSlide = 0;
const totalSlides = 3;

function goToSlide(index) {
    currentSlide = index;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    dots.forEach((dot, i) => {
        dot.classList.toggle('active', i === currentSlide);
    });
}
dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToSlide(i));
});
prevBtn.addEventListener('click', () => {
    goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
});
nextBtn.addEventListener('click', () => {
    goToSlide((currentSlide + 1) % totalSlides);
});
setInterval(() => {
    goToSlide((currentSlide + 1) % totalSlides);
}, 6000);

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
    showToast('Demo interactiva - Próximamente disponible', 'info');
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
