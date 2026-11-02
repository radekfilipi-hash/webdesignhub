// ===== Reference: posun celostránkových náhledů v rámečcích zařízení =====
(() => {
  const devices = [...document.querySelectorAll('.rf-device')];
  if (!devices.length) return;

  // o kolik posunout snímek v rámečku; notebook i mobil doběhnou současně
  const measure = () => devices.forEach((d) => {
    const screens = [...d.querySelectorAll('.rf-screen')];
    // výška obrázku je známá z width/height atributů i před načtením
    const shifts = screens.map((s) => {
      const img = s.querySelector('img');
      return img ? Math.max(0, img.offsetHeight - s.clientHeight) : 0;
    });
    const dur = Math.max(3, (shifts[0] || 0) / 320);
    screens.forEach((s, i) => {
      s.style.setProperty('--shift', -shifts[i] + 'px');
      s.style.setProperty('--dur', dur.toFixed(2) + 's');
    });
  });
  devices.forEach((d) => d.querySelectorAll('img').forEach((img) => {
    if (!img.complete) img.addEventListener('load', measure, { once: true });
  }));
  addEventListener('resize', measure);
  measure();

  // dotyková zařízení nemají hover: náhled se jednou rozjede sám, když je v obraze.
  // Zpátky nahoru se nevrací (při scrollování by se cukal), klepnutím se přehraje znovu.
  if (!matchMedia('(hover: hover)').matches) {
    devices.forEach((d) => d.addEventListener('click', () => d.classList.toggle('is-play')));
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduceMotion && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-play');
        io.unobserve(e.target);
      }), { threshold: 0.6 });
      devices.forEach((d) => io.observe(d));
    }
  }
})();
