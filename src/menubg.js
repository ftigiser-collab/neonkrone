// Animierter Menühintergrund: nächtliche Skyline im Regen, Neonreklame, Schweber, Suchscheinwerfer
export function startMenuBg(host) {
  const cv = document.createElement('canvas');
  cv.className = 'menubg';
  host.prepend(cv);
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dpr = 1, city = null, rain = [], avs = [];
  const NEON = ['255,46,136', '46,240,255', '255,170,40', '170,90,255', '60,255,150'];
  let seed = 4242; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };

  function buildCity() {
    city = document.createElement('canvas'); city.width = W * dpr; city.height = H * dpr;
    const c = city.getContext('2d'); c.scale(dpr, dpr);
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#05040c'); g.addColorStop(0.5, '#1a0c2a'); g.addColorStop(0.78, '#4a1640'); g.addColorStop(1, '#0a0612');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Smogglühen über der Stadt
    const s = c.createRadialGradient(W * 0.55, H * 0.85, 0, W * 0.55, H * 0.85, H * 0.8);
    s.addColorStop(0, 'rgba(255,60,140,0.35)'); s.addColorStop(0.4, 'rgba(120,40,160,0.18)'); s.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = s; c.fillRect(0, 0, W, H);
    // drei Ebenen Hochhäuser, hinten blass, vorne dunkel mit Fenstern und Reklame
    for (const [layer, base, hmax, col, wins] of [[0, 0.72, 0.5, '#1a1428', 0.08], [1, 0.82, 0.62, '#110d1c', 0.16], [2, 0.95, 0.75, '#07060d', 0.26]]) {
      let x = -20;
      while (x < W + 20) {
        const w = 30 + rnd() * (60 + layer * 30), h = H * (0.12 + rnd() * hmax) * (layer === 0 ? 0.8 : 1);
        const top = H * base - h;
        c.fillStyle = col; c.fillRect(x, top, w, H - top);
        // Turmspitze für die höchsten
        if (h > H * 0.45) { c.fillRect(x + w * 0.4, top - 30, w * 0.2, 30); c.fillStyle = 'rgba(255,50,60,0.9)'; c.fillRect(x + w * 0.5 - 1, top - 33, 2, 3); c.fillStyle = col; }
        // Fenster
        for (let yy = top + 6; yy < H; yy += 7) for (let xx = x + 4; xx < x + w - 4; xx += 6) {
          if (rnd() > wins) continue;
          const q = rnd(); c.fillStyle = q < 0.6 ? `rgba(255,205,140,${0.35 + layer * 0.15})` : `rgba(110,230,255,${0.3 + layer * 0.15})`;
          c.fillRect(xx, yy, 2.5, 2);
        }
        // Leuchtreklame an der Fassade
        if (layer > 0 && rnd() < 0.45) {
          const nc = NEON[Math.floor(rnd() * NEON.length)], vertical = rnd() < 0.5;
          const sx = x + w * (0.2 + rnd() * 0.5), sy = top + 20 + rnd() * h * 0.4;
          c.shadowColor = `rgba(${nc},1)`; c.shadowBlur = 14; c.fillStyle = `rgba(${nc},0.9)`;
          if (vertical) { c.fillRect(sx, sy, 7, 40 + rnd() * 40); c.fillStyle = 'rgba(20,10,20,0.8)'; for (let k = sy + 4; k < sy + 70; k += 9) c.fillRect(sx + 2, k, 3, 5); }
          else { c.fillRect(sx, sy, 30 + rnd() * 30, 8); }
          c.shadowBlur = 0;
        }
        x += w + rnd() * 6;
      }
    }
    // Straßenschlucht unten: Lichterkette
    const lg = c.createLinearGradient(0, H * 0.93, 0, H);
    lg.addColorStop(0, 'rgba(255,120,180,0)'); lg.addColorStop(1, 'rgba(255,120,180,0.25)');
    c.fillStyle = lg; c.fillRect(0, H * 0.9, W, H * 0.1);
  }

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    seed = 4242; buildCity();
    rain = Array.from({ length: 220 }, () => ({ x: Math.random() * W, y: Math.random() * H, l: 8 + Math.random() * 18, s: 500 + Math.random() * 400 }));
    avs = Array.from({ length: 4 }, (_, i) => ({ x: Math.random() * W, y: H * (0.15 + i * 0.12), v: (20 + Math.random() * 30) * (i % 2 ? -1 : 1), b: Math.random() * 6 }));
  }
  resize();
  window.addEventListener('resize', resize);

  let last = performance.now(), t = 0, raf = 0, stopped = false;
  function frame(now) {
    if (stopped) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(city, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Suchscheinwerfer
    ctx.globalCompositeOperation = 'lighter';
    for (const [x0, ph] of [[W * 0.3, 0], [W * 0.75, 2]]) {
      const a = -Math.PI / 2 + Math.sin(t * 0.35 + ph) * 0.5;
      const g = ctx.createLinearGradient(x0, H, x0 + Math.cos(a) * H, H + Math.sin(a) * H); g.addColorStop(0, 'rgba(180,200,255,0.12)'); g.addColorStop(1, 'rgba(180,200,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0, H); ctx.lineTo(x0 + Math.cos(a - 0.05) * H * 1.2, H + Math.sin(a - 0.05) * H * 1.2); ctx.lineTo(x0 + Math.cos(a + 0.05) * H * 1.2, H + Math.sin(a + 0.05) * H * 1.2); ctx.closePath(); ctx.fill();
    }
    // Schweber mit Positionslichtern
    for (const a of avs) {
      a.x += a.v * dt; if (a.x > W + 60) a.x = -60; if (a.x < -60) a.x = W + 60;
      const y = a.y + Math.sin(t + a.b) * 4;
      ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#0a0812'; ctx.fillRect(a.x - 14, y - 3, 28, 6); ctx.fillRect(a.x - 18, y - 1, 36, 2);
      ctx.globalCompositeOperation = 'lighter';
      const blink = Math.floor(t * 2 + a.b) % 2;
      ctx.fillStyle = blink ? 'rgba(255,60,70,0.95)' : 'rgba(60,255,140,0.95)'; ctx.beginPath(); ctx.arc(a.x + (a.v > 0 ? 15 : -15), y, 1.6, 0, 6.28); ctx.fill();
      const g = ctx.createRadialGradient(a.x, y + 6, 0, a.x, y + 6, 22); g.addColorStop(0, 'rgba(90,230,255,0.35)'); g.addColorStop(1, 'rgba(90,230,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(a.x, y + 6, 22, 0, 6.28); ctx.fill();
    }
    // flackernde Neonfläche
    if (Math.sin(t * 17) > 0.96) { ctx.fillStyle = 'rgba(255,40,140,0.05)'; ctx.fillRect(0, 0, W, H); }
    ctx.globalCompositeOperation = 'source-over';
    // Regen
    ctx.strokeStyle = 'rgba(170,190,240,0.28)'; ctx.lineWidth = 1; ctx.beginPath();
    for (const r of rain) { r.y += r.s * dt; r.x += r.s * dt * 0.12; if (r.y > H) { r.y = -20; r.x = Math.random() * W; } ctx.moveTo(r.x, r.y); ctx.lineTo(r.x - r.l * 0.12, r.y - r.l); }
    ctx.stroke();
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  return { stop() { stopped = true; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); cv.remove(); } };
}
