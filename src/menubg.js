// Animierter Menühintergrund: Dünen in der Dämmerung, zwei Monde, Thopter, ein Wurm
import { Noise } from './util.js';

export function startMenuBg(host) {
  const cv = document.createElement('canvas');
  cv.className = 'menubg';
  host.prepend(cv);
  const ctx = cv.getContext('2d');
  const N = new Noise(77);
  let W = 0, H = 0, dpr = 1, stars = [], static_ = null;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = host.clientWidth; H = host.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    stars = Array.from({ length: 140 }, () => ({ x: Math.random() * W, y: Math.random() * H * 0.5, r: Math.random() * 1.2 + 0.2, p: Math.random() * 6 }));
    static_ = null;
  }
  resize();
  window.addEventListener('resize', resize);

  const ridge = (y0, amp, f, ph, oct = 3) => (x) => {
    let v = 0, a = 1, fr = f;
    for (let o = 0; o < oct; o++) { v += (N.v(x * fr + ph + o * 13, o * 7) - 0.5) * a; a *= 0.5; fr *= 2.1; }
    return y0 + v * amp;
  };

  function drawSky(c) {
    const g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a0f24'); g.addColorStop(0.35, '#4a2238'); g.addColorStop(0.55, '#a8482a'); g.addColorStop(0.68, '#e98a3e'); g.addColorStop(1, '#3a1d0e');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // Sonnenglut am Horizont
    const s = c.createRadialGradient(W * 0.68, H * 0.62, 0, W * 0.68, H * 0.62, H * 0.6);
    s.addColorStop(0, 'rgba(255,214,140,0.85)'); s.addColorStop(0.15, 'rgba(255,170,90,0.45)'); s.addColorStop(1, 'rgba(255,120,60,0)');
    c.fillStyle = s; c.fillRect(0, 0, W, H);
    // Großer Mond
    const mx = W * 0.22, my = H * 0.2, mr = Math.min(W, H) * 0.09;
    const mg = c.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.1, mx, my, mr);
    mg.addColorStop(0, '#f6e6d0'); mg.addColorStop(1, '#b89a86');
    c.fillStyle = mg; c.beginPath(); c.arc(mx, my, mr, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(120,90,80,0.35)';
    for (let k = 0; k < 9; k++) { const a = k * 2.3, d = mr * (0.2 + (k % 4) * 0.18); c.beginPath(); c.arc(mx + Math.cos(a) * d, my + Math.sin(a) * d, mr * (0.08 + (k % 3) * 0.05), 0, 6.28); c.fill(); }
    c.fillStyle = 'rgba(40,20,40,0.35)'; c.beginPath(); c.arc(mx + mr * 0.35, my + mr * 0.1, mr * 0.95, 0, 6.28); c.fill();
    const halo = c.createRadialGradient(mx, my, mr, mx, my, mr * 2.4); halo.addColorStop(0, 'rgba(255,230,210,0.18)'); halo.addColorStop(1, 'rgba(255,230,210,0)');
    c.fillStyle = halo; c.beginPath(); c.arc(mx, my, mr * 2.4, 0, 6.28); c.fill();
    // Kleiner Mond
    const sx = W * 0.32, sy = H * 0.1, sr = mr * 0.32;
    c.fillStyle = '#d8c2ae'; c.beginPath(); c.arc(sx, sy, sr, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(40,20,40,0.4)'; c.beginPath(); c.arc(sx + sr * 0.4, sy, sr * 0.9, 0, 6.28); c.fill();
    // ferne Tafelberge
    const mesa = ridge(H * 0.6, H * 0.08, 0.004, 3, 4);
    c.fillStyle = 'rgba(110,50,40,0.55)';
    c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) { let y = mesa(x); const flat = N.v(x * 0.006, 50); if (flat > 0.55) y = Math.min(y, H * 0.56); c.lineTo(x, y); }
    c.lineTo(W, H); c.fill();
  }

  function dune(c, t, y0, amp, f, speed, cTop, cBot, rim) {
    const base = ridge(y0, amp * 0.5, f * 0.6, t * speed + 9, 2);
    const fn = (x) => { const n = N.v(x * f + t * speed * 3, 3.3), cr = 1 - Math.abs(2 * n - 1); return base(x) - cr * cr * amp; };
    const g = c.createLinearGradient(0, y0 - amp, 0, H);
    g.addColorStop(0, cTop); g.addColorStop(1, cBot);
    c.fillStyle = g; c.beginPath(); c.moveTo(0, H);
    const pts = [];
    for (let x = 0; x <= W + 4; x += 4) { const y = fn(x); pts.push([x, y]); c.lineTo(x, y); }
    c.lineTo(W, H); c.fill();
    // Leeseite: versetzte Kammlinie bildet eine weiche, gebogene Schattenfläche
    c.save(); c.beginPath(); c.moveTo(0, H); for (const [x, y] of pts) c.lineTo(x, y); c.lineTo(W, H); c.clip();
    const sh = c.createLinearGradient(0, y0 - amp, 0, y0 + amp * 2);
    sh.addColorStop(0, 'rgba(40,12,24,0.5)'); sh.addColorStop(1, 'rgba(40,12,24,0.05)');
    c.fillStyle = sh; c.beginPath(); c.moveTo(0, H);
    for (let x = 0; x <= W + 4; x += 4) c.lineTo(x, fn(x + 70) + amp * 0.25);
    c.lineTo(W, H); c.closePath();
    // Schatten liegt über der Kammlinie (Leeseite) — Differenzfläche
    c.globalCompositeOperation = 'source-atop';
    c.fill('evenodd');
    c.restore();
    // Kammlicht und Schattenseite
    c.strokeStyle = rim; c.lineWidth = 1.2; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    return fn;
  }

  const thopters = [];
  let wormX = -300, wormNext = 1;
  let last = performance.now(), t = 0, running = true;

  function frame(now) {
    if (!running) return;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now; t += dt;
    if (!static_) { static_ = document.createElement('canvas'); static_.width = cv.width; static_.height = cv.height; const sc = static_.getContext('2d'); sc.scale(dpr, dpr); drawSky(sc); }
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(static_, 0, 0);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    for (const s of stars) { ctx.fillStyle = `rgba(255,240,230,${(0.35 + 0.35 * Math.sin(t * 2 + s.p)) * (1 - s.y / (H * 0.5))})`; ctx.fillRect(s.x, s.y, s.r, s.r); }
    // Thopter
    if (Math.random() < dt * 0.25 && thopters.length < 3) thopters.push({ x: -40, y: H * (0.18 + Math.random() * 0.25), s: 0.6 + Math.random() * 0.7, v: 40 + Math.random() * 40 });
    for (const th of thopters) {
      th.x += th.v * dt; const y = th.y + Math.sin(t * 1.5 + th.x * 0.01) * 6;
      ctx.save(); ctx.translate(th.x, y); ctx.scale(th.s, th.s); ctx.fillStyle = 'rgba(30,14,22,0.85)';
      ctx.beginPath(); ctx.ellipse(0, 0, 14, 3.5, 0, 0, 6.28); ctx.fill(); ctx.fillRect(-22, -1, 10, 2);
      const fl = Math.sin(t * 40) * 6;
      ctx.beginPath(); ctx.moveTo(-2, -1); ctx.lineTo(-10, -8 - fl); ctx.lineTo(8, -8 - fl); ctx.lineTo(4, -1); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-2, 1); ctx.lineTo(-8, 5 + fl * 0.3); ctx.lineTo(6, 5 + fl * 0.3); ctx.lineTo(4, 1); ctx.fill();
      ctx.restore();
    }
    for (let i = thopters.length - 1; i >= 0; i--) if (thopters[i].x > W + 60) thopters.splice(i, 1);
    // Dünenschichten
    dune(ctx, t, H * 0.7, H * 0.08, 0.003, 0.02, '#a0502a', '#5a2a14', 'rgba(255,190,120,0.5)');
    const mid = dune(ctx, t, H * 0.8, H * 0.1, 0.0025, 0.04, '#8a4422', '#3e1d0e', 'rgba(255,200,130,0.55)');
    // Wurm unter dem Sand der mittleren Düne
    wormNext -= dt;
    if (wormNext <= 0 && wormX < -200) { wormX = -120; wormNext = 14; }
    if (wormX > -200) {
      wormX += 70 * dt;
      ctx.fillStyle = 'rgba(70,32,16,0.75)';
      ctx.beginPath();
      for (let x = wormX - 160; x <= wormX; x += 4) { const k = (x - wormX + 160) / 160, y = mid(x) - Math.sin(k * Math.PI) * 10 * k; x === wormX - 160 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.lineTo(wormX, mid(wormX) + 4); ctx.lineTo(wormX - 160, mid(wormX - 160) + 4); ctx.fill();
      for (let k = 0; k < 3; k++) { const x = wormX - Math.random() * 30, y = mid(x) - 6; ctx.fillStyle = `rgba(230,170,110,${0.3 * Math.random()})`; ctx.beginPath(); ctx.arc(x, y - Math.random() * 14, 3 + Math.random() * 6, 0, 6.28); ctx.fill(); }
      if (wormX > W + 200) wormX = -300;
    }
    dune(ctx, t, H * 0.92, H * 0.07, 0.002, 0.07, '#6a3218', '#24100a', 'rgba(255,190,120,0.4)');
    // treibender Sand
    ctx.strokeStyle = 'rgba(255,200,140,0.08)'; ctx.lineWidth = 1;
    for (let k = 0; k < 40; k++) { const x = ((k * 97 + t * 160) % (W + 200)) - 100, y = H * 0.55 + (k * 53 % (H * 0.45)); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 50, y + 4); ctx.stroke(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  return { stop() { running = false; window.removeEventListener('resize', resize); cv.remove(); } };
}
