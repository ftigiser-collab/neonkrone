// Neon-Symbole statt Einheitenmodellen: Form nach Gattung, Glyphe nach Typ, Leuchten in Teamfarbe
import { rgba } from './util.js';

let enabled = true;
try { enabled = localStorage.getItem('neonkrone-symbols') !== '0'; } catch (e) { /* kein Speicher */ }
export const symbolsOn = () => enabled;
export function setSymbols(v) { enabled = v; try { localStorage.setItem('neonkrone-symbols', v ? '1' : '0'); } catch (e) { /* egal */ } }

// Teamfarbe aufhellen für die Glyphe
function light(hex, k = 0.45) {
  const n = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return '#' + n.map((v) => Math.round(v + (255 - v) * k).toString(16).padStart(2, '0')).join('');
}

const SPECIAL = new Set(['schwester', 'spion', 'duenen', 'todes', 'wurmreiter', 'adler', 'brenner', 'schatten', 'soeldner', 'legionaer', 'trauma']);
function shapeOf(u) {
  if (u.def.mt === 'air') return 'diamond';
  if (u.def.harvester) return 'oct';
  if (SPECIAL.has(u.type)) return 'hex';
  if (u.def.cat === 'veh') return 'square';
  return 'circle';
}
function shapePath(ctx, shape, r) {
  ctx.beginPath();
  if (shape === 'circle') ctx.arc(0, 0, r, 0, 6.28);
  else if (shape === 'square') { const s = r * 0.86, c = r * 0.22; ctx.moveTo(-s + c, -s); ctx.lineTo(s - c, -s); ctx.lineTo(s, -s + c); ctx.lineTo(s, s - c); ctx.lineTo(s - c, s); ctx.lineTo(-s + c, s); ctx.lineTo(-s, s - c); ctx.lineTo(-s, -s + c); ctx.closePath(); }
  else if (shape === 'diamond') { ctx.moveTo(0, -r * 1.12); ctx.lineTo(r * 1.12, 0); ctx.lineTo(0, r * 1.12); ctx.lineTo(-r * 1.12, 0); ctx.closePath(); }
  else if (shape === 'hex') { for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + 0.52; ctx.lineTo(Math.cos(a) * r * 1.04, Math.sin(a) * r * 1.04); } ctx.closePath(); }
  else if (shape === 'oct') { for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28 + 0.39; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); }
}

// Glyphen im Feld [-1, 1], Strichbreite wird vorher gesetzt
const L = (ctx, pts) => { ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.stroke(); };
const C = (ctx, x, y, r, fill) => { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); fill ? ctx.fill() : ctx.stroke(); };
const chevron = (ctx, x, s = 0.45) => L(ctx, [[x - s, -0.55], [x + s * 0.4, 0], [x - s, 0.55]]);
const G = {
  inf(c) { L(c, [[-0.7, -0.15], [0.75, -0.15]]); L(c, [[-0.7, -0.15], [-0.7, 0.3]]); L(c, [[-0.15, -0.15], [-0.28, 0.45]]); L(c, [[0.45, -0.15], [0.45, -0.35]]); },
  sandgaenger(c) { C(c, -0.55, 0.45, 0.1, true); for (const r of [0.45, 0.8]) { c.beginPath(); c.arc(-0.55, 0.45, r, -1.4, -0.1); c.stroke(); } },
  scharf(c) { C(c, 0, 0, 0.5); L(c, [[0, -0.85], [0, -0.25]]); L(c, [[0, 0.25], [0, 0.85]]); L(c, [[-0.85, 0], [-0.25, 0]]); L(c, [[0.25, 0], [0.85, 0]]); },
  schild(c) { L(c, [[0, -0.75], [0.6, -0.5], [0.55, 0.15], [0, 0.75], [-0.55, 0.15], [-0.6, -0.5], [0, -0.75]]); },
  pionier(c) { L(c, [[-0.6, 0.6], [0.2, -0.2]]); c.beginPath(); c.arc(0.38, -0.38, 0.32, 2.4, 0.9, false); c.stroke(); },
  spion(c) { c.beginPath(); c.moveTo(-0.8, 0); c.quadraticCurveTo(0, -0.7, 0.8, 0); c.quadraticCurveTo(0, 0.7, -0.8, 0); c.stroke(); C(c, 0, 0, 0.18, true); },
  rak(c) { L(c, [[-0.7, 0.25], [0.35, 0.25], [0.75, 0], [0.35, -0.25], [-0.7, -0.25], [-0.7, 0.25]]); L(c, [[-0.7, 0.25], [-0.9, 0.5]]); L(c, [[-0.7, -0.25], [-0.9, -0.5]]); },
  trike(c) { C(c, -0.45, 0.25, 0.3); C(c, 0.5, 0.25, 0.3); L(c, [[-0.45, 0.25], [-0.05, -0.3], [0.5, 0.25]]); L(c, [[-0.05, -0.3], [0.3, -0.45]]); },
  panzer(c) { c.strokeRect(-0.65, -0.4, 1.0, 0.8); C(c, -0.15, 0, 0.22); L(c, [[0.07, 0], [0.9, 0]]); },
  werfer(c) { c.beginPath(); c.moveTo(-0.8, 0.55); c.quadraticCurveTo(0, -1.1, 0.75, 0.4); c.stroke(); L(c, [[0.45, 0.25], [0.75, 0.4], [0.75, 0.05]]); },
  flakwagen(c) { L(c, [[-0.55, 0.15], [0, -0.35], [0.55, 0.15]]); L(c, [[-0.55, 0.6], [0, 0.1], [0.55, 0.6]]); },
  laserpanzer(c) { L(c, [[0.15, -0.85], [-0.35, 0.1], [0.15, 0.1], [-0.15, 0.85]]); },
  koloss(c) { c.strokeRect(-0.45, -0.75, 0.9, 0.6); L(c, [[-0.3, -0.15], [-0.55, 0.75]]); L(c, [[0.3, -0.15], [0.55, 0.75]]); L(c, [[0.45, -0.5], [0.85, -0.5]]); },
  ernter(c) { c.strokeRect(-0.6, -0.45, 1.2, 0.9); L(c, [[-0.6, -0.45], [0.6, 0.45]]); L(c, [[-0.1, -0.45], [0.6, 0.05]]); L(c, [[-0.6, 0.05], [0.1, 0.45]]); },
  libelle(c) { L(c, [[-0.5, -0.5], [0.5, 0.5]]); L(c, [[0.5, -0.5], [-0.5, 0.5]]); for (const [x, y] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) C(c, x, y, 0.2); },
  falke(c) { chevron(c, -0.1); chevron(c, 0.4); },
  bomber(c) { L(c, [[0, -0.8], [0, 0.25]]); L(c, [[-0.35, -0.1], [0, 0.25], [0.35, -0.1]]); L(c, [[-0.7, 0.65], [0.7, 0.65]]); },
  jaeger(c) { L(c, [[-0.75, 0], [0.55, 0]]); L(c, [[0.25, -0.3], [0.6, 0], [0.25, 0.3]]); C(c, -0.35, 0, 0.3); },
  schwester(c) { C(c, 0, 0, 0.16, true); for (const [x, y] of [[0, -0.7], [0.62, 0.4], [-0.62, 0.4]]) { L(c, [[0, 0], [x * 0.8, y * 0.8]]); C(c, x, y, 0.15); } },
  duenen(c) { L(c, [[-0.45, 0.65], [0.05, -0.65]]); L(c, [[0.05, 0.65], [0.55, -0.65]]); },
  todes(c) { c.beginPath(); c.moveTo(-0.6, 0.7); c.quadraticCurveTo(-0.7, -0.5, 0.1, -0.8); c.stroke(); c.beginPath(); c.moveTo(0.6, 0.7); c.quadraticCurveTo(0.7, -0.5, -0.1, -0.8); c.stroke(); },
  wurmreiter(c) { L(c, [[0, -0.8], [0.75, 0.6], [-0.75, 0.6], [0, -0.8]]); L(c, [[0, -0.3], [0, 0.15]]); C(c, 0, 0.38, 0.06, true); },
  adler(c) { chevron(c, -0.4, 0.38); chevron(c, 0.05, 0.38); chevron(c, 0.5, 0.38); },
  brenner(c) { c.beginPath(); c.moveTo(0, 0.75); c.quadraticCurveTo(-0.7, 0.3, -0.25, -0.35); c.quadraticCurveTo(-0.1, 0, 0, -0.85); c.quadraticCurveTo(0.7, -0.1, 0.45, 0.35); c.quadraticCurveTo(0.35, 0.65, 0, 0.75); c.stroke(); },
  schatten(c) { c.beginPath(); c.moveTo(-0.8, 0); c.quadraticCurveTo(0, -0.7, 0.8, 0); c.quadraticCurveTo(0, 0.7, -0.8, 0); c.stroke(); L(c, [[-0.7, 0.6], [0.7, -0.6]]); },
  soeldner(c) { c.beginPath(); for (let k = 0; k < 10; k++) { const a = -1.571 + k * 0.628, r = k % 2 ? 0.35 : 0.8; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.stroke(); },
  legionaer(c) { c.beginPath(); c.arc(0, -0.15, 0.6, 3.6, 5.82); c.lineTo(0.42, 0.55); c.lineTo(-0.42, 0.55); c.closePath(); c.stroke(); C(c, -0.22, -0.1, 0.12, true); C(c, 0.22, -0.1, 0.12, true); },
  traeger(c) { L(c, [[0, -0.8], [0, 0.2]]); c.beginPath(); c.arc(-0.25, 0.2, 0.25, 0, 3.14); c.stroke(); L(c, [[-0.6, -0.8], [0.6, -0.8]]); },
  trauma(c) { c.fillRect(-0.18, -0.68, 0.36, 1.36); c.fillRect(-0.68, -0.18, 1.36, 0.36); },
};

export function drawSymbol(ctx, u, color, t, o = {}) {
  const shape = shapeOf(u), air = u.def.mt === 'air';
  const R0 = (o.icon ? 15 : 18.5) * (o.scale ? o.scale / 1.62 : 1);
  const lift = air && !o.landed && !o.icon ? Math.min(18, (o.z ?? 26) * 0.55) : 0;
  const glyphCol = light(color, 0.5);
  // Flughöhe: Bodenmarke und gestrichelte Lotlinie
  if (lift) {
    ctx.save(); ctx.strokeStyle = rgba(color, 0.45); ctx.lineWidth = 1; ctx.setLineDash([2, 3]);
    ctx.beginPath(); ctx.moveTo(0, -lift + R0); ctx.lineTo(0, 0); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(3, 4, R0 * 0.8, R0 * 0.35, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = rgba(color, 0.5); ctx.beginPath(); ctx.ellipse(0, 0, R0 * 0.6, R0 * 0.26, 0, 0, 6.28); ctx.stroke();
    ctx.restore();
  } else if (!o.icon) {
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(2.5, 4, R0 * 0.95, R0 * 0.5, 0, 0, 6.28); ctx.fill();
  }
  ctx.save(); ctx.translate(0, -lift + (o.moving && !air ? Math.sin(t * 14 + u.id) * 0.8 : 0));
  // Grundfläche
  shapePath(ctx, shape, R0);
  ctx.fillStyle = 'rgba(8,8,18,0.82)'; ctx.fill();
  // Leuchten: breiter weicher Rand, dann scharfe Kante
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const pulse = 0.85 + 0.15 * Math.sin(t * 2.4 + u.id);
  ctx.strokeStyle = rgba(color, 0.18 * pulse); ctx.lineWidth = 7; shapePath(ctx, shape, R0); ctx.stroke();
  ctx.strokeStyle = rgba(color, 0.32 * pulse); ctx.lineWidth = 3.5; shapePath(ctx, shape, R0); ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = color; ctx.lineWidth = 1.8; shapePath(ctx, shape, R0); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 0.6; shapePath(ctx, shape, R0 - 0.2); ctx.stroke();
  // Blickrichtung: kleiner Pfeil außen
  if (!o.icon) {
    const a = u.facing || 0, d = R0 + 4.5;
    ctx.save(); ctx.rotate(a); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(d + 3.5, 0); ctx.lineTo(d - 1, -3); ctx.lineTo(d - 1, 3); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  // Glyphe
  const f = G[u.type];
  ctx.save(); ctx.scale(R0 * 0.62, R0 * 0.62);
  ctx.strokeStyle = glyphCol; ctx.fillStyle = glyphCol; ctx.lineWidth = 2.1 / (R0 * 0.62); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 6;
  if (f) f(ctx); else C(ctx, 0, 0, 0.25, true);
  ctx.restore();
  // Hologramm-Scanlinie
  if (!o.icon) {
    ctx.save(); shapePath(ctx, shape, R0 - 1); ctx.clip();
    const y = ((t * 0.7 + u.id * 0.13) % 1) * R0 * 2.4 - R0 * 1.2;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(color, 0.22); ctx.fillRect(-R0, y, R0 * 2, 1.4);
    ctx.restore();
  }
  // Zusatzanzeigen: Ladung, Munition, Fracht, RAM
  if (u.def.harvester && u.def.capacity) {
    const k = Math.min(1, (u.cargo || 0) / u.def.capacity);
    ctx.strokeStyle = 'rgba(70,235,255,0.9)'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.arc(0, 0, R0 + 3.5, -1.571, -1.571 + k * 6.283); ctx.stroke();
  }
  if (u.def.ammo && !o.icon) for (let k = 0; k < u.def.ammo; k++) { ctx.fillStyle = k < (u.ammo ?? u.def.ammo) ? '#5ff0ff' : 'rgba(255,255,255,0.18)'; ctx.fillRect(-u.def.ammo * 2.5 + k * 5 + 0.5, R0 + 5, 4, 2); }
  if (u.def.ram && !o.icon) {
    const n = u.def.ram, have = u.ram ?? n, w = Math.min(3.2, 26 / n);
    for (let k = 0; k < n; k++) { ctx.fillStyle = k < have ? '#c58bff' : 'rgba(197,139,255,0.18)'; ctx.fillRect(-n * w / 2 + k * w + 0.4, -R0 - 7, w - 0.8, 2.6); }
  }
  if (u.carrying && !o.icon) { ctx.strokeStyle = glyphCol; ctx.lineWidth = 1; ctx.strokeRect(-4, R0 * 0.6, 8, 5); }
  if (u.blind > 0 && !o.icon) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = `rgba(200,110,255,${0.5 + 0.4 * Math.sin(t * 9)})`; ctx.lineWidth = 1.2;
    for (let k = 0; k < 3; k++) { const yy = -R0 * 0.5 + k * R0 * 0.5 + Math.sin(t * 20 + k) * 2; ctx.beginPath(); ctx.moveTo(-R0 * 0.9, yy); ctx.lineTo(R0 * 0.9, yy); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}
