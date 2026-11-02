// ===== Reference: posun celostránkových náhledů v rámečcích zařízení =====
(() => {
  const devices = [...document.querySelectorAll('.rf-device')];
  if (!devices.length) return;

  // o kolik posunout snímek v rámečku; notebook i mobil doběhnou současně
  const measure = () => devices.forEach((d) => {
    const screens = [...d.querySelectorAll('.rf-screen')];
    const shifts = screens.map((s) => {
      const img = s.querySelector('img');
      return img && img.naturalHeight ? Math.max(0, img.offsetHeight - s.clientHeight) : 0;
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

  // dotyková zařízení nemají hover: náhled se rozjede sám, když je v obraze
  if (!matchMedia('(hover: hover)').matches && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => entries.forEach((e) => {
      e.target.classList.toggle('is-play', e.isIntersecting);
    }), { threshold: 0.6 });
    devices.forEach((d) => io.observe(d));
  }
})();
