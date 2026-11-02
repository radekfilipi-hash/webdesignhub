// ===== Reference: prohlídka webu řízená scrollováním =====
// Náhled je přichycený na obrazovce, web v notebooku i telefonu se posouvá podle
// scrollování a k právě viditelnému místu se ukáže popisek.
(() => {
  const projects = [...document.querySelectorAll('.rf-proj')];
  if (!projects.length) return;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const items = projects.map((el) => ({
    track: el.querySelector('.rf-track'),
    stage: el.querySelector('.rf-stage'),
    screens: [...el.querySelectorAll('.rf-screen')].map((s) => ({
      s, scroller: s.querySelector('.rf-scroll'), img: s.querySelector('img'),
    })),
    pins: [...el.querySelectorAll('.rf-pin')],
    feats: [...el.querySelectorAll('.rf-feats li')],
    bars: [...el.querySelectorAll('.rf-progress i, .rf-mcap__bar i')],
    cap: el.querySelector('.rf-mcap b'),
    top: 0, len: 1, p: 0, active: -2,
  }));

  // popisky: pozice z data-x/data-y (podíl šířky/výšky stránky), zarovnání bubliny podle strany
  items.forEach((it) => it.pins.forEach((pin) => {
    const x = +pin.dataset.x, y = +pin.dataset.y;
    pin.style.left = x * 100 + '%';
    pin.style.top = y * 100 + '%';
    if (x < 0.35) pin.classList.add('rf-pin--l');
    else if (x > 0.65) pin.classList.add('rf-pin--r');
  }));

  const update = () => {
    items.forEach((it) => {
      const p = Math.min(1, Math.max(0, (scrollY - it.top) / it.len));
      it.p = p;
      it.screens.forEach((x) => { x.scroller.style.transform = `translate3d(0,${(-p * x.shift).toFixed(1)}px,0)`; });
      it.bars.forEach((b) => { b.style.transform = `scaleX(${p.toFixed(3)})`; });

      // aktivní je místo nejblíž středu notebooku, pokud je vidět
      const L = it.screens[0];
      if (!L || !L.imgH) return;
      const center = (p * L.shift + L.frameH / 2) / L.imgH;
      const reach = (L.frameH / 2 / L.imgH) * 0.95;
      let best = -1, bestD = Infinity;
      it.pins.forEach((pin, i) => {
        const d = Math.abs(+pin.dataset.y - center);
        if (d < bestD) { bestD = d; best = i; }
      });
      if (bestD > reach) best = -1;
      if (best !== it.active) {
        it.active = best;
        it.pins.forEach((pin, i) => pin.classList.toggle('is-on', i === best));
        it.feats.forEach((li, i) => li.classList.toggle('is-on', i === best));
        if (it.cap && best >= 0) it.cap.textContent = it.feats[best].textContent;
      }
      // u horního okraje obrazovky dát bublinu pod tečku, ať se neusekne
      if (best >= 0) {
        const dotY = +it.pins[best].dataset.y * L.imgH - p * L.shift;
        it.pins[best].classList.toggle('rf-pin--below', dotY < 64);
      }
    });
  };

  const measure = () => {
    items.forEach((it) => {
      it.top = it.track.getBoundingClientRect().top + scrollY;
      it.len = Math.max(1, it.track.offsetHeight - innerHeight);
      it.screens.forEach((x) => {
        x.frameH = x.s.clientHeight;
        x.imgH = x.img.offsetHeight;
        x.shift = Math.max(0, x.imgH - x.frameH);
      });
    });
    update();
  };

  let ticking = false;
  addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }, { passive: true });
  addEventListener('resize', measure);
  addEventListener('load', measure);
  items.forEach((it) => it.screens.forEach((x) => {
    if (!x.img.complete) x.img.addEventListener('load', measure, { once: true });
  }));
  measure();

  // klik na bod v seznamu doscrolluje na dané místo webu
  items.forEach((it) => it.feats.forEach((li, i) => li.addEventListener('click', () => {
    const L = it.screens[0];
    if (!L.shift || !it.pins[i]) return;
    const p = Math.min(1, Math.max(0, (+it.pins[i].dataset.y * L.imgH - L.frameH / 2) / L.shift));
    scrollTo({ top: it.top + p * it.len, behavior: reduceMotion ? 'auto' : 'smooth' });
  })));

  // jemné natočení scény podle pohybu myši
  if (finePointer && !reduceMotion) items.forEach((it) => {
    it.stage.addEventListener('mousemove', (e) => {
      const r = it.stage.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      it.stage.style.setProperty('--ry', (x * 6).toFixed(2) + 'deg');
      it.stage.style.setProperty('--rx', (-y * 5).toFixed(2) + 'deg');
    });
    it.stage.addEventListener('mouseleave', () => {
      it.stage.style.removeProperty('--ry');
      it.stage.style.removeProperty('--rx');
    });
  });
})();
