// Riesige Großraumschiffe für die Endgame-Schläge (Draufsicht, vorgerendert)
import { part, drawPart, lg, rg, rr, rivetRow, vents, seams, hazard, windows } from './art.js';

const HULL = ['#8c8478', '#4a453e', '#24211d'];

function plate(c, pts, light, dark) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  c.fillStyle = lg(c, Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), light, dark);
  c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
}
function greebles(c, x0, y0, x1, y1, n, seed) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  c.save(); c.globalCompositeOperation = 'source-atop';
  for (let k = 0; k < n; k++) {
    const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0), w = 2 + rnd() * 7, h = 1.5 + rnd() * 5;
    c.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.28)' : 'rgba(255,240,215,0.14)'; c.fillRect(x, y, w, h);
  }
  c.restore();
}

const SHIPS = {
  // Legionsträger: langer, keilförmiger Rumpf, schwarz mit Karmesin
  legion(c, color) {
    plate(c, [[130, 0], [40, -46], [-110, -58], [-135, -30], [-135, 30], [-110, 58], [40, 46]], '#3a3230', '#120f0e');
    plate(c, [[118, 0], [36, -34], [-100, -42], [-100, 0]], '#5a4a46', '#2a2220');
    plate(c, [[118, 0], [36, 34], [-100, 42], [-100, 0]], '#2e2624', '#141010');
    c.fillStyle = '#6a1a16'; c.beginPath(); c.moveTo(120, 0); c.lineTo(30, -8); c.lineTo(-120, -8); c.lineTo(-120, 8); c.lineTo(30, 8); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(201,162,74,0.8)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(118, 0); c.lineTo(30, -9); c.lineTo(-120, -9); c.moveTo(118, 0); c.lineTo(30, 9); c.lineTo(-120, 9); c.stroke();
    for (const sy of [-1, 1]) {
      for (let k = 0; k < 5; k++) { const x = -90 + k * 34; c.fillStyle = '#0c0a09'; rr(c, x, sy > 0 ? 14 : -26, 22, 12, 2); c.fill(); c.fillStyle = 'rgba(255,120,80,0.35)'; c.fillRect(x + 2, sy > 0 ? 16 : -24, 18, 1.2); }
      rivetRow(c, -120, sy * 48, 30, sy * 40, 22, 0.8);
    }
    greebles(c, -125, -50, 100, 50, 140, 7);
    seams(c, [[-40, -50, -40, 50], [10, -44, 10, 44], [60, -36, 60, 36]]);
    for (const sy of [-1, 0, 1]) { c.fillStyle = '#1a1414'; c.beginPath(); c.arc(-136, sy * 26, 11, 0, 6.28); c.fill(); c.fillStyle = '#3a2a24'; c.beginPath(); c.arc(-136, sy * 26, 7, 0, 6.28); c.fill(); }
    c.fillStyle = color; c.fillRect(-70, -4, 30, 8);
  },
  // Flottenträger: breiter, flacher Träger mit Hangarbuchten an beiden Seiten
  flotte(c, color) {
    plate(c, [[120, -20], [120, 20], [70, 62], [-110, 62], [-130, 40], [-130, -40], [-110, -62], [70, -62]], HULL[0], HULL[2]);
    plate(c, [[110, -14], [110, 14], [-120, 14], [-120, -14]], '#a49a8a', '#5a544a');
    for (const sy of [-1, 1]) for (let k = 0; k < 4; k++) {
      const x = -95 + k * 44, y = sy > 0 ? 22 : -54;
      c.fillStyle = '#121110'; rr(c, x, y, 34, 32, 3); c.fill();
      c.strokeStyle = 'rgba(255,200,120,0.5)'; c.lineWidth = 1; c.strokeRect(x + 2, y + 2, 30, 28);
      hazard(c, x, sy > 0 ? y + 28 : y, 34, 3);
    }
    c.fillStyle = '#2a2f33'; rr(c, 80, -10, 30, 20, 4); c.fill(); windows(c, 84, -6, 22, 3, 5, 'rgba(160,220,255,0.9)');
    greebles(c, -125, -60, 110, 60, 160, 11);
    vents(c, -120, -8, 24, 16, 6);
    for (const sy of [-1, 1]) { c.fillStyle = '#26231f'; c.beginPath(); c.arc(-132, sy * 44, 12, 0, 6.28); c.fill(); }
    c.fillStyle = color; c.fillRect(20, -4, 40, 8);
  },
  // Schwerlastträger: wuchtiger Block, vorne keilförmig eingekerbt, gestufte Flanken
  lander(c, color) {
    const outline = [[-120, -70], [100, -70], [100, -18], [62, 0], [100, 18], [100, 70], [-120, 70]];
    plate(c, outline, '#a8a08e', '#4a463e');
    plate(c, [[-112, -60], [88, -60], [88, -20], [54, -4], [54, 4], [88, 20], [88, 60], [-112, 60]], '#bcb4a2', '#6e6858');
    plate(c, [[-100, -44], [70, -44], [44, -4], [44, 4], [70, 44], [-100, 44]], '#9a927f', '#5a554a');
    // Fugen und Panelreihen
    c.strokeStyle = 'rgba(30,26,20,0.55)'; c.lineWidth = 0.9;
    for (let x = -96; x < 70; x += 18) { c.beginPath(); c.moveTo(x, -44); c.lineTo(x, 44); c.stroke(); }
    for (const y of [-26, 0, 26]) { c.beginPath(); c.moveTo(-100, y); c.lineTo(60, y); c.stroke(); }
    for (const sy of [-1, 1]) { c.fillStyle = 'rgba(20,18,15,0.6)'; c.fillRect(-118, sy * 62 - 4, 210, 8); rivetRow(c, -112, sy * 66, 90, sy * 66, 30, 0.9); }
    // Heckmodule
    for (const y of [-40, 0, 40]) { c.fillStyle = '#2a2723'; rr(c, -132, y - 13, 16, 26, 3); c.fill(); }
    greebles(c, -118, -68, 98, 68, 170, 23);
    c.fillStyle = color; c.fillRect(-60, -6, 40, 12);
  },
  // Eiförmiges Landeschiff (dunkel, glatt, kaum Details)
  egg(c, color) {
    const g = c.createRadialGradient(-30, -24, 8, 0, 0, 110);
    g.addColorStop(0, '#5a5650'); g.addColorStop(0.55, '#2c2a27'); g.addColorStop(1, '#0e0d0c');
    c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, 100, 66, 0, 0, 6.28); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.45)'; c.lineWidth = 1;
    for (const k of [0.55, 0.8]) { c.beginPath(); c.ellipse(0, 0, 100 * k, 66 * k, 0, 0, 6.28); c.stroke(); }
    c.beginPath(); c.moveTo(-100, 0); c.lineTo(100, 0); c.stroke();
    c.strokeStyle = 'rgba(255,240,220,0.12)'; c.lineWidth = 2; c.beginPath(); c.ellipse(-4, -4, 94, 60, 0, 3.4, 5.2); c.stroke();
    for (let i = 0; i < 12; i++) { const a = i / 12 * 6.28; c.fillStyle = 'rgba(255,150,90,0.55)'; c.beginPath(); c.arc(Math.cos(a) * 90, Math.sin(a) * 58, 1.6, 0, 6.28); c.fill(); }
    c.fillStyle = color; c.beginPath(); c.ellipse(0, 0, 10, 6, 0, 0, 6.28); c.fill();
  },
};
const ENGINES = {
  legion: [[-136, -26], [-136, 0], [-136, 26]],
  flotte: [[-132, -44], [-132, 44]],
  lander: [[-132, -40], [-132, 0], [-132, 40]],
  egg: [],
};

export function shipKind(faction) { return faction === 'vareth' ? 'flotte' : faction === 'kordan' ? 'lander' : 'egg'; }

// Gilden-Großtransporter: gewaltiger Ring hoch über der Karte, wirft einen Ringschatten
export function drawGuildRing(ctx, s, t) {
  const Ro = s.r, Ri = s.r * 0.72;
  ctx.save(); ctx.globalAlpha = s.alpha ?? 1;
  // Schatten am Boden
  ctx.fillStyle = 'rgba(10,6,4,0.32)'; ctx.beginPath(); ctx.ellipse(s.x + s.z * 0.4, s.y + s.z * 0.55, Ro, Ro * 0.62, s.rot, 0, 6.28); ctx.ellipse(s.x + s.z * 0.4, s.y + s.z * 0.55, Ri, Ri * 0.62, s.rot, 6.28, 0, true); ctx.fill();
  // Ringkörper
  ctx.translate(s.x, s.y - s.z); ctx.rotate(s.rot);
  const g = ctx.createLinearGradient(-Ro, -Ro, Ro, Ro);
  g.addColorStop(0, '#8a7c6a'); g.addColorStop(0.5, '#4a4239'); g.addColorStop(1, '#1c1814');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, Ro, Ro * 0.62, 0, 0, 6.28); ctx.ellipse(0, 0, Ri, Ri * 0.62, 0, 6.28, 0, true); ctx.fill();
  // Innenwand (Tiefe) und Rand-Licht
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, Ri, Ri * 0.62, 0, 0, 6.28); ctx.ellipse(0, Ro * 0.06, Ri * 0.98, Ri * 0.6, 0, 6.28, 0, true); ctx.fill();
  ctx.strokeStyle = 'rgba(255,225,185,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 0, Ro, Ro * 0.62, 0, 3.3, 5.3); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5;
  for (let i = 0; i < 48; i++) { const a = i / 48 * 6.28; ctx.beginPath(); ctx.moveTo(Math.cos(a) * Ri, Math.sin(a) * Ri * 0.62); ctx.lineTo(Math.cos(a) * Ro, Math.sin(a) * Ro * 0.62); ctx.stroke(); }
  ctx.restore();
}

export function drawMothership(ctx, s, t) {
  if (s.kind === 'ring') return drawGuildRing(ctx, s, t);
  const p = part(`ship-${s.kind}-${s.color}`, 290, 150, (L) => L((c) => SHIPS[s.kind](c, s.color), { bevel: 1.2, grime: 0.5 }), 2.5);
  const z = s.z, sc = s.scale || 1;
  // Schatten: groß, weich, je höher desto weiter versetzt
  ctx.save(); ctx.translate(s.x + z * 0.45, s.y + z * 0.6); ctx.rotate(s.rot); ctx.scale(sc, sc);
  ctx.globalAlpha = 0.38 * (s.alpha ?? 1); ctx.drawImage(p.sh, -p.w / 2, -p.h / 2, p.w, p.h); ctx.restore();
  // Landestrahlen zu den abgesetzten Einheiten
  if (s.beams) for (const b of s.beams) {
    if (b.a <= 0) continue;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(s.x, s.y - z, b.x, b.y);
    g.addColorStop(0, `rgba(255,220,160,${0.45 * b.a})`); g.addColorStop(1, `rgba(255,200,130,${0.15 * b.a})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(s.x - 6, s.y - z); ctx.lineTo(b.x - 14, b.y); ctx.lineTo(b.x + 14, b.y); ctx.lineTo(s.x + 6, s.y - z); ctx.closePath(); ctx.fill();
    const gg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, 22); gg.addColorStop(0, `rgba(255,230,180,${0.5 * b.a})`); gg.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(b.x, b.y, 22, 0, 6.28); ctx.fill();
    ctx.restore();
  }
  // Rumpf
  ctx.save(); ctx.translate(s.x, s.y - z); ctx.rotate(s.rot); ctx.scale(sc, sc); ctx.globalAlpha = s.alpha ?? 1;
  drawPart(ctx, p);
  // Triebwerke und Positionslichter
  ctx.globalCompositeOperation = 'lighter';
  const fl = 0.8 + 0.2 * Math.sin(t * 30);
  for (const [x, y] of ENGINES[s.kind]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 26 * fl * (s.thrust ?? 1));
    g.addColorStop(0, 'rgba(255,245,220,0.95)'); g.addColorStop(0.35, 'rgba(255,170,90,0.6)'); g.addColorStop(1, 'rgba(255,100,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 26 * fl * (s.thrust ?? 1), 0, 6.28); ctx.fill();
  }
  const blink = (t * 1.2) % 1 < 0.15;
  if (blink) for (const [x, y, col] of [[100, -40, '255,60,50'], [100, 40, '80,255,120'], [-120, 0, '255,255,255']]) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, 9); g.addColorStop(0, `rgba(${col},1)`); g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.28); ctx.fill();
  }
  ctx.restore();
}
