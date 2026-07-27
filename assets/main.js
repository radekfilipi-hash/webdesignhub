const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

// ===== Particle network canvas =====
(() => {
  const canvas = document.getElementById('fx');
  if (!canvas || reduceMotion) return;
  const ctx = canvas.getContext('2d');
  let w, h, dpr, particles = [];
  const mouse = { x: -9999, y: -9999 };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    const count = Math.min(90, Math.floor((innerWidth * innerHeight) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25 * dpr,
      vy: (Math.random() - 0.5) * 0.25 * dpr,
      r: (Math.random() * 1.6 + 0.6) * dpr,
    }));
  };
  resize();
  addEventListener('resize', resize);

  addEventListener('mousemove', (e) => { mouse.x = e.clientX * dpr; mouse.y = e.clientY * dpr; });
  addEventListener('mouseout', () => { mouse.x = mouse.y = -9999; });

  const LINK = 130, LINK_M = 170;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;

      const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (dm < 150 * dpr) { p.x += (p.x - mouse.x) / dm * 0.6; p.y += (p.y - mouse.y) / dm * 0.6; }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(150,140,255,.7)';
      ctx.fill();
    }
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const d = Math.hypot(a.x - b.x, a.y - b.y) / dpr;
        if (d < LINK) {
          ctx.strokeStyle = `rgba(120,110,220,${(1 - d / LINK) * 0.28})`;
          ctx.lineWidth = dpr;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      const dm = Math.hypot(a.x - mouse.x, a.y - mouse.y) / dpr;
      if (dm < LINK_M) {
        ctx.strokeStyle = `rgba(34,211,238,${(1 - dm / LINK_M) * 0.5})`;
        ctx.lineWidth = dpr;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
      }
    }
    requestAnimationFrame(draw);
  };
  draw();
})();

// ===== Cursor spotlight + hero parallax =====
(() => {
  if (!finePointer || reduceMotion) return;
  const spot = document.getElementById('spot');
  const depths = [...document.querySelectorAll('[data-depth]')];
  let tx = 0, ty = 0, cx = 0, cy = 0;

  addEventListener('mousemove', (e) => {
    if (spot) { spot.style.opacity = '1'; spot.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; }
    tx = (e.clientX / innerWidth - 0.5) * 2;
    ty = (e.clientY / innerHeight - 0.5) * 2;
  });

  const loop = () => {
    cx += (tx - cx) * 0.06;
    cy += (ty - cy) * 0.06;
    for (const el of depths) {
      const d = +el.dataset.depth;
      el.style.transform = `translate(${cx * d}px, ${cy * d}px)`;
    }
    requestAnimationFrame(loop);
  };
  loop();
})();

// ===== 3D tilt on cards =====
(() => {
  if (!finePointer || reduceMotion) return;
  document.querySelectorAll('.card, .plan').forEach((el) => {
    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${-py * 6}deg) rotateY(${px * 6}deg) translateY(-6px)`;
    });
    el.addEventListener('mouseleave', () => { el.style.transform = ''; });
  });
})();

// ===== Nav: scroll state + mobile toggle =====
const nav = document.getElementById('nav');
const toggle = document.getElementById('navToggle');
const links = document.getElementById('navLinks');

const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 12);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

toggle.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  toggle.classList.toggle('is-open', open);
});
links.querySelectorAll('a').forEach(a =>
  a.addEventListener('click', () => {
    links.classList.remove('is-open');
    toggle.classList.remove('is-open');
  })
);

// ===== Reveal on scroll =====
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('is-visible');
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

document.querySelectorAll('.reveal').forEach((el, i) => {
  el.style.transitionDelay = `${Math.min(i % 4, 3) * 70}ms`;
  io.observe(el);
});

// ===== Animated counters =====
const fmt = new Intl.NumberFormat('cs-CZ');
const counters = document.querySelectorAll('.stat__num');
const cio = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    if (Number.isNaN(target)) { cio.unobserve(el); return; }
    const dur = 1400, start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt.format(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    cio.unobserve(el);
  });
}, { threshold: 0.6 });
counters.forEach(c => cio.observe(c));

// ===== Contact form (Web3Forms) =====
const form = document.getElementById('poptavka');
const ok = document.getElementById('formOk');
const err = document.getElementById('formErr');
const submitBtn = form.querySelector('button[type="submit"]');
const submitLabel = submitBtn.textContent;
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!form.checkValidity()) { form.reportValidity(); return; }
  ok.hidden = true; if (err) err.hidden = true;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Odesílám…';
  try {
    const payload = Object.fromEntries(new FormData(form).entries());
    const res = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      ok.hidden = false;
      submitBtn.textContent = 'Odesláno ✓';
      form.querySelectorAll('input:not([type=hidden]):not([type=checkbox]), textarea').forEach(f => (f.value = ''));
    } else {
      throw new Error(data.message || 'error');
    }
  } catch (_) {
    if (err) err.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = submitLabel;
  }
});

// ===== Year =====
document.getElementById('year').textContent = new Date().getFullYear();
