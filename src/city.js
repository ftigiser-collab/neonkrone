// Stadtgelände als Bild: Straßen, Trümmer, Betonplätze, Megablocks — plus Leuchtschicht für Neon
import { Noise, clamp } from './util.js';
import { center, corners, R, HW } from './hex.js';

const NB_EVEN = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
const NB_ODD = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];
// Richtung → Kante (Kante i liegt zwischen Ecke i und i+1; 0 = Osten, 1 = Südost, 2 = Südwest, 3 = Westen, 4 = Nordwest, 5 = Nordost)
const DIR_EDGE = [0, 5, 4, 3, 2, 1];
export const NEON = ['255,46,136', '46,240,255', '255,170,40', '170,90,255', '60,255,150', '255,70,70'];

function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function cv(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }

// ---------- Kacheltexturen ----------
function texture(seed, size, fn) {
  const c = cv(size, size), x = c.getContext('2d'), img = x.createImageData(size, size), N = new Noise(seed);
  for (let y = 0; y < size; y++) for (let X = 0; X < size; X++) {
    const a = X / size * 6.2832, b = y / size * 6.2832;
    // kachelbar über Torus
    const n = (fx) => N.fbm(Math.cos(a) * fx + 7, Math.sin(a) * fx + Math.cos(b) * fx, 3);
    const i = (y * size + X) * 4, [r, g, bl] = fn(X, y, n, Math.random());
    img.data[i] = clamp(r, 0, 255); img.data[i + 1] = clamp(g, 0, 255); img.data[i + 2] = clamp(bl, 0, 255); img.data[i + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

function makeTextures() {
  const asphalt = texture(11, 256, (x, y, n, q) => {
    const v = 30 + n(3) * 14 + (q - 0.5) * 9 + (q > 0.985 ? 22 : 0);
    return [v - 1, v, v + 6];
  });
  const concrete = texture(23, 256, (x, y, n, q) => {
    const tx = Math.floor(x / 32), ty = Math.floor(y / 32), tile = ((tx * 37 + ty * 91) % 7) * 2.2;
    const grout = (x % 32 < 1.3 || y % 32 < 1.3) ? -16 : 0;
    const v = 66 + n(2) * 16 + tile + grout + (q - 0.5) * 7;
    return [v, v + 1, v + 9];
  });
  const rubble = texture(37, 256, (x, y, n, q) => {
    const m = n(4), v = 34 + m * 26 + (q - 0.5) * 16;
    return [v + 6, v + 2, v];
  });
  const roof = texture(53, 256, (x, y, n, q) => {
    const seam = (x % 64 < 1.2 || y % 42 < 1.2) ? -10 : 0;
    const v = 40 + n(2) * 10 + seam + (q - 0.5) * 6;
    return [v, v + 1, v + 8];
  });
  // Risse und Flecken in den Asphalt
  const ax = asphalt.getContext('2d'), rnd = mulberry(77);
  for (let k = 0; k < 18; k++) {
    let x = rnd() * 256, y = rnd() * 256, a = rnd() * 6.28;
    ax.strokeStyle = 'rgba(8,8,12,0.55)'; ax.lineWidth = 0.8; ax.beginPath(); ax.moveTo(x, y);
    for (let s = 0; s < 12; s++) { a += (rnd() - 0.5) * 1.1; x += Math.cos(a) * 4; y += Math.sin(a) * 4; ax.lineTo(x, y); }
    ax.stroke();
  }
  for (let k = 0; k < 10; k++) { const x = rnd() * 256, y = rnd() * 256, r = 6 + rnd() * 16, g = ax.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(6,6,10,0.35)'); g.addColorStop(1, 'rgba(6,6,10,0)'); ax.fillStyle = g; ax.fillRect(x - r, y - r, r * 2, r * 2); }
  return { asphalt, concrete, rubble, roof };
}

// ---------- Hauptfunktion ----------
export function renderCity(map) {
  const { W, H, ter } = map;
  const full = cv(map.size.w, map.size.h), fc = full.getContext('2d');
  const neon = cv(map.size.w, map.size.h), nc = neon.getContext('2d');
  const rnd = mulberry(map.seed * 3 + 1);
  const T = (c, r) => (c < 0 || r < 0 || c >= W || r >= H) ? 'mountain' : ter[r * W + c];
  const nbs = (c, r) => (r & 1 ? NB_ODD : NB_EVEN).map(([dc, dr], d) => ({ c: c + dc, r: r + dr, e: DIR_EDGE[d], t: T(c + dc, r + dr) }));
  const tex = makeTextures();
  const pat = {};
  for (const k in tex) pat[k] = fc.createPattern(tex[k], 'repeat');
  const street = (t) => t === 'sand' || t === 'dune';
  const glow = (x, y, r, col, a) => { const g = nc.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); nc.fillStyle = g; nc.fillRect(x - r, y - r, r * 2, r * 2); };
  const hexFill = (x, y, r) => { fc.beginPath(); const p = corners(x, y, r); p.forEach(([a, b], i) => i ? fc.lineTo(a, b) : fc.moveTo(a, b)); fc.closePath(); };
  const edgePts = (x, y, e, r = R) => { const p = corners(x, y, r); return [p[e], p[(e + 1) % 6]]; };

  fc.fillStyle = '#15151c'; fc.fillRect(0, 0, full.width, full.height);
  // 1. Flächen
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const t = ter[r * W + c], p = center(c, r);
    fc.fillStyle = t === 'rock' ? pat.concrete : t === 'dune' ? pat.rubble : t === 'mountain' ? '#1a1a22' : pat.asphalt;
    hexFill(p.x, p.y, R + 1); fc.fill();
  }
  // Ränder der Karte: alles außerhalb ist Megablock-Schatten
  // 2. Straßen: Markierungen, Bordsteine, Zebrastreifen, Pfützen
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const t = ter[r * W + c]; if (t !== 'sand') continue;
    const isRoad = (cc, rr) => cc >= 0 && rr >= 0 && cc < W && rr < H && map.roads[rr * W + cc] && ter[rr * W + cc] === 'sand';
    const p = center(c, r), ns = nbs(c, r), con = isRoad(c, r) ? ns.filter((n) => isRoad(n.c, n.r)) : [];
    if (!isRoad(c, r)) {
      // Hinterhof / Parkfläche: Stellplätze statt Fahrbahn
      if (rnd() < 0.55) { fc.save(); fc.translate(p.x, p.y); fc.rotate(Math.floor(rnd() * 3) * 1.047); fc.strokeStyle = 'rgba(220,224,235,0.2)'; fc.lineWidth = 1; for (let k = -3; k <= 3; k++) { fc.beginPath(); fc.moveTo(k * 7, -18); fc.lineTo(k * 7, -6); fc.moveTo(k * 7, 6); fc.lineTo(k * 7, 18); fc.stroke(); } fc.restore(); }
      if (rnd() < 0.4) { const a = rnd() * 6.28, x = p.x + (rnd() - 0.5) * 24, y = p.y + (rnd() - 0.5) * 24; fc.save(); fc.translate(x, y); fc.rotate(a); fc.fillStyle = 'rgba(0,0,0,0.4)'; rrect(fc, -8, -3, 18, 9, 2.5); fc.fill(); const cc = ['#5a2b34', '#2e3f5a', '#4d4d55', '#6a5a2a'][Math.floor(rnd() * 4)]; fc.fillStyle = cc; rrect(fc, -9, -4.5, 18, 9, 2.5); fc.fill(); fc.fillStyle = 'rgba(140,190,230,0.35)'; fc.fillRect(-3, -3.5, 6, 7); fc.restore(); }
    }
    // leichte Fahrbahn-Aufhellung entlang der Verbindungen
    for (const n of con) {
      const q = center(n.c, n.r), mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
      fc.strokeStyle = 'rgba(70,72,86,0.18)'; fc.lineWidth = 30; fc.lineCap = 'butt';
      fc.beginPath(); fc.moveTo(p.x, p.y); fc.lineTo(mx, my); fc.stroke();
    }
    for (const n of con) {
      const q = center(n.c, n.r), mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2, a = Math.atan2(my - p.y, mx - p.x);
      const ox = -Math.sin(a), oy = Math.cos(a);
      // Mittellinie gestrichelt, Randlinien durchgezogen
      fc.setLineDash([7, 6]); fc.lineDashOffset = 0; fc.strokeStyle = 'rgba(232,190,60,0.5)'; fc.lineWidth = 1.4;
      fc.beginPath(); fc.moveTo(p.x + Math.cos(a) * (con.length > 2 ? 12 : 0), p.y + Math.sin(a) * (con.length > 2 ? 12 : 0)); fc.lineTo(mx, my); fc.stroke();
      fc.setLineDash([]); fc.strokeStyle = 'rgba(220,224,235,0.22)'; fc.lineWidth = 1;
      for (const s of [-12, 12]) { fc.beginPath(); fc.moveTo(p.x + ox * s + Math.cos(a) * (con.length > 2 ? 14 : 0), p.y + oy * s + Math.sin(a) * (con.length > 2 ? 14 : 0)); fc.lineTo(mx + ox * s, my + oy * s); fc.stroke(); }
      if (con.length > 2) {
        // Zebrastreifen vor der Kreuzung
        fc.fillStyle = 'rgba(225,228,238,0.32)';
        for (let k = -2; k <= 2; k++) {
          const cx = p.x + Math.cos(a) * 19 + ox * k * 4.6, cy = p.y + Math.sin(a) * 19 + oy * k * 4.6;
          fc.save(); fc.translate(cx, cy); fc.rotate(a); fc.fillRect(-3, -1.3, 6, 2.6); fc.restore();
        }
      }
    }
    if (con.length > 2) {
      // Kreuzungsfeld mit Sperrschraffur
      fc.save(); fc.beginPath(); hexPathTo(fc, p.x, p.y, 10); fc.clip();
      fc.strokeStyle = 'rgba(232,190,60,0.32)'; fc.lineWidth = 1.2;
      for (let k = -14; k < 14; k += 4) { fc.beginPath(); fc.moveTo(p.x + k, p.y - 12); fc.lineTo(p.x + k + 12, p.y + 12); fc.stroke(); }
      fc.restore();
      fc.strokeStyle = 'rgba(232,190,60,0.45)'; fc.lineWidth = 1; fc.beginPath(); hexPathTo(fc, p.x, p.y, 10); fc.stroke();
    }
    // Bordstein und Laternen zu Nicht-Straßen
    for (const n of ns) {
      if (street(n.t)) continue;
      const [a, b] = edgePts(p.x, p.y, n.e, R - 1.5);
      fc.strokeStyle = 'rgba(150,152,165,0.55)'; fc.lineWidth = 2; fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(b[0], b[1]); fc.stroke();
      fc.strokeStyle = 'rgba(0,0,0,0.4)'; fc.lineWidth = 1.5; const [a2, b2] = edgePts(p.x, p.y, n.e, R - 3.5); fc.beginPath(); fc.moveTo(a2[0], a2[1]); fc.lineTo(b2[0], b2[1]); fc.stroke();
      if (rnd() < 0.45) {
        const mx = (a[0] + b[0]) / 2 * 0.86 + p.x * 0.14, my = (a[1] + b[1]) / 2 * 0.86 + p.y * 0.14;
        fc.fillStyle = '#0c0c10'; fc.beginPath(); fc.arc(mx, my, 1.8, 0, 6.28); fc.fill();
        const col = rnd() < 0.6 ? '255,196,120' : '120,220,255';
        glow(mx, my, 26, col, 0.22); glow(mx, my, 5, col, 0.8);
      }
    }
    // Gullydeckel, Ölflecken, Pfützen mit Spiegelung
    if (rnd() < 0.35) { const x = p.x + (rnd() - 0.5) * 30, y = p.y + (rnd() - 0.5) * 30; fc.fillStyle = '#1a1a20'; fc.beginPath(); fc.arc(x, y, 3.6, 0, 6.28); fc.fill(); fc.strokeStyle = 'rgba(120,120,130,0.5)'; fc.lineWidth = 0.7; fc.stroke(); for (let k = -2; k <= 2; k += 2) { fc.beginPath(); fc.moveTo(x - 2.5, y + k * 0.8); fc.lineTo(x + 2.5, y + k * 0.8); fc.stroke(); } }
    for (let k = 0; k < 2; k++) if (rnd() < 0.5) {
      const x = p.x + (rnd() - 0.5) * 44, y = p.y + (rnd() - 0.5) * 40, rx = 5 + rnd() * 10, ry = 3 + rnd() * 5, a = rnd() * 3;
      fc.fillStyle = 'rgba(12,14,24,0.55)'; fc.beginPath(); fc.ellipse(x, y, rx, ry, a, 0, 6.28); fc.fill();
      fc.strokeStyle = 'rgba(140,150,180,0.12)'; fc.lineWidth = 0.8; fc.stroke();
      const col = NEON[Math.floor(rnd() * NEON.length)];
      nc.save(); nc.translate(x, y); nc.rotate(a); nc.scale(1, ry / rx);
      const g = nc.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(${col},0.35)`); g.addColorStop(1, `rgba(${col},0)`); nc.fillStyle = g; nc.beginPath(); nc.arc(0, 0, rx, 0, 6.28); nc.fill(); nc.restore();
    }
    // Bremsspuren
    if (rnd() < 0.25) { const a = rnd() * 6.28, x = p.x + (rnd() - 0.5) * 20, y = p.y + (rnd() - 0.5) * 20; fc.strokeStyle = 'rgba(8,8,10,0.35)'; fc.lineWidth = 2; for (const o of [-3, 3]) { fc.beginPath(); fc.moveTo(x - Math.sin(a) * o, y + Math.cos(a) * o); fc.quadraticCurveTo(x + Math.cos(a) * 10, y + Math.sin(a) * 10 + 3, x + Math.cos(a) * 22 - Math.sin(a) * o, y + Math.sin(a) * 22 + Math.cos(a) * o); fc.stroke(); } }
    // Müll
    for (let k = 0; k < 6; k++) { fc.fillStyle = rnd() < 0.5 ? 'rgba(160,160,170,0.35)' : 'rgba(10,10,14,0.4)'; fc.fillRect(p.x + (rnd() - 0.5) * 56, p.y + (rnd() - 0.5) * 56, 1 + rnd() * 2, 1 + rnd() * 1.5); }
  }
  // 3. Trümmer: aufgerissener Asphalt, Betonbrocken, Bewehrung, Autowracks
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (ter[r * W + c] !== 'dune') continue;
    const p = center(c, r);
    fc.save(); fc.beginPath(); hexPathTo(fc, p.x, p.y, R + 1); fc.clip();
    for (let k = 0; k < 5; k++) {
      let x = p.x + (rnd() - 0.5) * R * 1.6, y = p.y + (rnd() - 0.5) * R * 1.6, a = rnd() * 6.28;
      fc.strokeStyle = 'rgba(5,5,7,0.7)'; fc.lineWidth = 1.2 + rnd(); fc.beginPath(); fc.moveTo(x, y);
      for (let s = 0; s < 8; s++) { a += (rnd() - 0.5) * 1.2; x += Math.cos(a) * 5; y += Math.sin(a) * 5; fc.lineTo(x, y); }
      fc.stroke();
    }
    if (rnd() < 0.3) {
      // ausgebranntes Autowrack
      const a = rnd() * 6.28, x = p.x + (rnd() - 0.5) * 20, y = p.y + (rnd() - 0.5) * 20;
      fc.save(); fc.translate(x, y); fc.rotate(a);
      fc.fillStyle = 'rgba(0,0,0,0.4)'; rrect(fc, -10, -4, 22, 11, 3); fc.fill();
      fc.fillStyle = '#2b241f'; rrect(fc, -11, -5.5, 22, 11, 3); fc.fill();
      fc.fillStyle = '#171310'; rrect(fc, -5, -4, 10, 8, 2); fc.fill();
      fc.fillStyle = 'rgba(120,70,40,0.5)'; fc.fillRect(-11, -5.5, 4, 11);
      fc.restore();
    }
    for (let k = 0; k < 16; k++) {
      const x = p.x + (rnd() - 0.5) * R * 1.7, y = p.y + (rnd() - 0.5) * R * 1.7, s = 1.5 + rnd() * 5, a = rnd() * 6.28;
      const pts = []; for (let j = 0; j < 5; j++) { const aa = a + j * 1.256 + (rnd() - 0.5) * 0.6, rr = s * (0.6 + rnd() * 0.6); pts.push([x + Math.cos(aa) * rr, y + Math.sin(aa) * rr * 0.85]); }
      const path = (d) => { fc.beginPath(); pts.forEach(([u, v], j) => j ? fc.lineTo(u + d, v + d) : fc.moveTo(u + d, v + d)); fc.closePath(); };
      fc.fillStyle = 'rgba(0,0,0,0.45)'; path(s * 0.5); fc.fill();
      const b0 = 70 + rnd() * 50; fc.fillStyle = `rgb(${b0},${b0},${b0 + 8})`; path(0); fc.fill();
      fc.fillStyle = 'rgba(255,255,255,0.18)'; fc.beginPath(); fc.moveTo(pts[0][0], pts[0][1]); fc.lineTo(pts[1][0], pts[1][1]); fc.lineTo(x, y); fc.closePath(); fc.fill();
    }
    fc.strokeStyle = 'rgba(140,80,50,0.6)'; fc.lineWidth = 0.8;
    for (let k = 0; k < 4; k++) { const x = p.x + (rnd() - 0.5) * 50, y = p.y + (rnd() - 0.5) * 50, a = rnd() * 6.28; fc.beginPath(); fc.moveTo(x, y); fc.quadraticCurveTo(x + Math.cos(a) * 6 + 3, y + Math.sin(a) * 6 - 3, x + Math.cos(a) * 12, y + Math.sin(a) * 12); fc.stroke(); }
    if (rnd() < 0.3) { const x = p.x + (rnd() - 0.5) * 30, y = p.y + (rnd() - 0.5) * 30; glow(x, y, 14, '255,120,40', 0.25); glow(x, y, 3, '255,170,80', 0.7); }
    fc.restore();
  }
  // 4. Betonplätze: Gehweg an der Straße, Parkmarkierungen, Gitter, Pflanzkübel
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    if (ter[r * W + c] !== 'rock') continue;
    const p = center(c, r), ns = nbs(c, r);
    for (const n of ns) {
      if (!street(n.t)) continue;
      const [a, b] = edgePts(p.x, p.y, n.e, R - 3);
      fc.strokeStyle = 'rgba(190,192,205,0.18)'; fc.lineWidth = 5; fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(b[0], b[1]); fc.stroke();
    }
    const kind = rnd();
    if (kind < 0.25) {
      fc.strokeStyle = 'rgba(230,230,240,0.25)'; fc.lineWidth = 1;
      const a = Math.floor(rnd() * 3) * 1.047;
      fc.save(); fc.translate(p.x, p.y); fc.rotate(a);
      for (let k = -2; k <= 2; k++) { fc.beginPath(); fc.moveTo(k * 9, -10); fc.lineTo(k * 9, 10); fc.stroke(); }
      fc.restore();
    } else if (kind < 0.31) {
      fc.save(); fc.translate(p.x, p.y);
      fc.strokeStyle = 'rgba(232,190,60,0.4)'; fc.lineWidth = 2; fc.setLineDash([5, 4]); fc.beginPath(); hexPathTo(fc, 0, 0, 20); fc.stroke(); fc.setLineDash([]);
      fc.restore();
    }
    if (rnd() < 0.5) { const x = p.x + (rnd() - 0.5) * 34, y = p.y + (rnd() - 0.5) * 34; fc.fillStyle = 'rgba(15,15,20,0.6)'; fc.fillRect(x - 4, y - 2.5, 8, 5); fc.strokeStyle = 'rgba(110,110,120,0.4)'; fc.lineWidth = 0.6; for (let k = -3; k <= 3; k += 1.5) { fc.beginPath(); fc.moveTo(x + k, y - 2.5); fc.lineTo(x + k, y + 2.5); fc.stroke(); } }
    for (let k = 0; k < 2; k++) if (rnd() < 0.45) { const x = p.x + (rnd() - 0.5) * 40, y = p.y + (rnd() - 0.5) * 40, rr = 5 + rnd() * 9, g = fc.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(10,10,14,0.4)'); g.addColorStop(1, 'rgba(10,10,14,0)'); fc.fillStyle = g; fc.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
    if (rnd() < 0.18) {
      // Pflanzkübel mit verkümmertem Baum
      const x = p.x + (rnd() - 0.5) * 30, y = p.y + (rnd() - 0.5) * 30;
      fc.fillStyle = 'rgba(0,0,0,0.4)'; fc.fillRect(x - 4, y - 3, 10, 10);
      fc.fillStyle = '#4a4c56'; fc.fillRect(x - 5, y - 5, 10, 10);
      fc.fillStyle = '#26402c'; fc.beginPath(); fc.arc(x, y, 5.5, 0, 6.28); fc.fill(); fc.fillStyle = '#3a6440'; fc.beginPath(); fc.arc(x - 1.3, y - 1.3, 3, 0, 6.28); fc.fill();
    }
  }
  // 5. Megablocks: Schatten, Fassaden, Dächer
  const mtns = [];
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) if (ter[r * W + c] === 'mountain') mtns.push([c, r]);
  for (const [c, r] of mtns) { const p = center(c, r); fc.fillStyle = 'rgba(0,0,0,0.5)'; hexFill(p.x + 13, p.y + 19, R + 1); fc.fill(); }
  for (const [c, r] of mtns) { const p = center(c, r); fc.fillStyle = 'rgba(0,0,0,0.25)'; hexFill(p.x + 24, p.y + 32, R + 1); fc.fill(); }
  const HT = 15;
  // Fassaden nach Süden (Kanten 1 und 2) und Osten (0), wenn dort kein Megablock steht
  for (const [c, r] of mtns) {
    const p = center(c, r);
    for (const n of nbs(c, r)) {
      if (n.t === 'mountain' || ![0, 1, 2].includes(n.e)) continue;
      const [a, b] = edgePts(p.x, p.y, n.e, R + 0.5);
      const shade = n.e === 0 ? 0.6 : n.e === 1 ? 0.8 : 1;
      const g = fc.createLinearGradient(0, Math.min(a[1], b[1]), 0, Math.max(a[1], b[1]) + HT);
      g.addColorStop(0, `rgb(${58 * shade | 0},${58 * shade | 0},${72 * shade | 0})`); g.addColorStop(1, `rgb(${28 * shade | 0},${28 * shade | 0},${36 * shade | 0})`);
      fc.fillStyle = g; fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(b[0], b[1]); fc.lineTo(b[0], b[1] + HT); fc.lineTo(a[0], a[1] + HT); fc.closePath(); fc.fill();
      // Fensterreihen
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), nW = Math.floor(len / 5);
      for (let row = 0; row < 3; row++) for (let k = 0; k < nW; k++) {
        const f = (k + 0.5) / nW, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f + 3 + row * 4.2;
        const lit = rnd();
        fc.fillStyle = lit < 0.3 ? 'rgba(255,205,140,0.55)' : lit < 0.42 ? 'rgba(120,230,255,0.5)' : 'rgba(10,12,20,0.7)';
        fc.fillRect(x - 1.3, y - 1, 2.6, 2);
        if (lit < 0.42) { nc.fillStyle = lit < 0.3 ? 'rgba(255,200,130,0.85)' : 'rgba(110,230,255,0.85)'; nc.fillRect(x - 1.3, y - 1, 2.6, 2); }
      }
      // Leuchtreklame an der Fassade
      if (rnd() < 0.42) {
        const f = 0.25 + rnd() * 0.5, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f + 6, col = NEON[Math.floor(rnd() * NEON.length)], w = 6 + rnd() * 9;
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        for (const ctx of [fc, nc]) {
          ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
          ctx.fillStyle = ctx === fc ? `rgba(${col},0.5)` : `rgba(${col},0.95)`; ctx.fillRect(-w / 2, -2.6, w, 5.2);
          ctx.fillStyle = ctx === fc ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)';
          for (let k = -w / 2 + 1.5; k < w / 2 - 1; k += 2.6) ctx.fillRect(k, -1.4, 1.3, 2.8);
          ctx.restore();
        }
        glow(x, y + 8, 30, col, 0.28);
      }
    }
  }
  // Dächer
  for (const [c, r] of mtns) {
    const p = center(c, r), tier = (c * 7 + r * 13 + map.seed) % 4;
    const base = [[44, 44, 54], [52, 52, 62], [38, 40, 50], [58, 56, 64]][tier];
    fc.save(); hexFill(p.x, p.y, R + 0.6); fc.clip();
    fc.fillStyle = pat.roof; fc.fill();
    fc.fillStyle = `rgba(${base[0]},${base[1]},${base[2]},0.75)`; fc.fill();
    // Brüstung zu Nachbarn ohne Megablock oder mit anderer Höhe
    for (const n of nbs(c, r)) {
      const other = n.t === 'mountain' ? (n.c * 7 + n.r * 13 + map.seed) % 4 : -1;
      if (other === tier) continue;
      const [a, b] = edgePts(p.x, p.y, n.e, R - 1.2);
      fc.strokeStyle = 'rgba(120,122,140,0.55)'; fc.lineWidth = 2.2; fc.beginPath(); fc.moveTo(a[0], a[1]); fc.lineTo(b[0], b[1]); fc.stroke();
      const [a2, b2] = edgePts(p.x, p.y, n.e, R - 3.4);
      fc.strokeStyle = 'rgba(0,0,0,0.45)'; fc.lineWidth = 1.6; fc.beginPath(); fc.moveTo(a2[0], a2[1]); fc.lineTo(b2[0], b2[1]); fc.stroke();
    }
    // Dachaufbauten
    const kind = rnd();
    if (kind < 0.16) {
      // Landeplatz
      fc.fillStyle = 'rgba(30,30,38,0.9)'; fc.beginPath(); fc.arc(p.x, p.y, 17, 0, 6.28); fc.fill();
      fc.strokeStyle = 'rgba(232,190,60,0.4)'; fc.lineWidth = 1.2; fc.beginPath(); fc.arc(p.x, p.y, 15, 0, 6.28); fc.stroke();
      fc.strokeStyle = 'rgba(235,235,245,0.75)'; fc.lineWidth = 2; fc.beginPath(); fc.moveTo(p.x - 5, p.y - 6); fc.lineTo(p.x - 5, p.y + 6); fc.moveTo(p.x + 5, p.y - 6); fc.lineTo(p.x + 5, p.y + 6); fc.moveTo(p.x - 5, p.y); fc.lineTo(p.x + 5, p.y); fc.stroke();
      for (let k = 0; k < 8; k += 2) { const a = k * 0.785, x = p.x + Math.cos(a) * 15, y = p.y + Math.sin(a) * 15; glow(x, y, 3, '255,190,80', 0.45); }
    } else {
      const n = 2 + Math.floor(rnd() * 4);
      for (let k = 0; k < n; k++) {
        const x = p.x + (rnd() - 0.5) * 36, y = p.y + (rnd() - 0.5) * 34, w = 6 + rnd() * 8, h = 5 + rnd() * 6;
        fc.fillStyle = 'rgba(0,0,0,0.45)'; fc.fillRect(x - w / 2 + 2, y - h / 2 + 3, w, h);
        fc.fillStyle = '#5a5c6a'; fc.fillRect(x - w / 2, y - h / 2, w, h);
        fc.fillStyle = '#6e7080'; fc.fillRect(x - w / 2, y - h / 2, w, 1.4);
        if (rnd() < 0.6) { fc.fillStyle = '#25262e'; fc.beginPath(); fc.arc(x, y + 0.5, Math.min(w, h) * 0.32, 0, 6.28); fc.fill(); fc.strokeStyle = '#4a4c58'; fc.lineWidth = 0.6; fc.beginPath(); fc.moveTo(x - 2, y + 0.5); fc.lineTo(x + 2, y + 0.5); fc.moveTo(x, y - 1.5); fc.lineTo(x, y + 2.5); fc.stroke(); }
        else { fc.strokeStyle = 'rgba(20,20,26,0.8)'; fc.lineWidth = 0.6; for (let v = -w / 2 + 1.5; v < w / 2; v += 1.6) { fc.beginPath(); fc.moveTo(x + v, y - h / 2 + 1.5); fc.lineTo(x + v, y + h / 2 - 1); fc.stroke(); } }
      }
      if (rnd() < 0.45) { const x = p.x + (rnd() - 0.5) * 24, y = p.y + (rnd() - 0.5) * 24; fc.fillStyle = 'rgba(0,0,0,0.4)'; fc.beginPath(); fc.arc(x + 2, y + 3, 6, 0, 6.28); fc.fill(); const g = fc.createRadialGradient(x - 2, y - 2, 0, x, y, 6); g.addColorStop(0, '#8a8c98'); g.addColorStop(1, '#3c3e48'); fc.fillStyle = g; fc.beginPath(); fc.arc(x, y, 6, 0, 6.28); fc.fill(); }
      if (rnd() < 0.5) {
        // Antenne mit Warnlicht
        const x = p.x + (rnd() - 0.5) * 30, y = p.y + (rnd() - 0.5) * 30;
        fc.strokeStyle = '#8a8c98'; fc.lineWidth = 1; fc.beginPath(); fc.moveTo(x, y); fc.lineTo(x + 8, y - 10); fc.stroke();
        fc.strokeStyle = 'rgba(0,0,0,0.4)'; fc.beginPath(); fc.moveTo(x + 2, y + 2); fc.lineTo(x + 16, y + 6); fc.stroke();
        glow(x + 8, y - 10, 6, '255,50,50', 0.9);
      }
      if (rnd() < 0.35) {
        // Oberlicht
        const x = p.x + (rnd() - 0.5) * 26, y = p.y + (rnd() - 0.5) * 26, col = rnd() < 0.5 ? '255,200,140' : '120,220,255';
        fc.fillStyle = `rgba(${col},0.35)`; fc.fillRect(x - 6, y - 3, 12, 6);
        nc.fillStyle = `rgba(${col},0.55)`; nc.fillRect(x - 6, y - 3, 12, 6); glow(x, y, 16, col, 0.18);
      }
      if (rnd() < 0.22) {
        // Holo-Werbung auf dem Dach
        const x = p.x + (rnd() - 0.5) * 16, y = p.y + (rnd() - 0.5) * 16, col = NEON[Math.floor(rnd() * NEON.length)];
        fc.strokeStyle = 'rgba(30,30,36,0.9)'; fc.lineWidth = 2; fc.beginPath(); fc.moveTo(x - 10, y + 4); fc.lineTo(x + 10, y + 4); fc.stroke();
        nc.strokeStyle = `rgba(${col},0.9)`; nc.lineWidth = 1.2; nc.strokeRect(x - 9, y - 6, 18, 9);
        nc.fillStyle = `rgba(${col},0.75)`; for (let k = -6; k < 7; k += 3) nc.fillRect(x + k - 0.6, y - 4 + (k % 2 ? 1 : 0), 1.3, 4);
        glow(x, y, 26, col, 0.25);
      }
    }
    fc.restore();
  }
  // 6. Großflächige Abstufung (Smog-Schleier, Lichtinseln)
  for (let k = 0; k < 40; k++) {
    const x = rnd() * full.width, y = rnd() * full.height, rr = 60 + rnd() * 140, g = fc.createRadialGradient(x, y, 0, x, y, rr);
    const col = rnd() < 0.5 ? '10,10,20' : '70,60,90';
    g.addColorStop(0, `rgba(${col},${0.06 + rnd() * 0.06})`); g.addColorStop(1, `rgba(${col},0)`);
    fc.fillStyle = g; fc.fillRect(x - rr, y - rr, rr * 2, rr * 2);
  }
  // Körnung
  const grain = fc.createImageData(full.width, full.height);
  for (let i = 0; i < grain.data.length; i += 4) { const gv = Math.random() * 255; grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = gv; grain.data[i + 3] = 12; }
  const gc = cv(full.width, full.height); gc.getContext('2d').putImageData(grain, 0, 0);
  fc.globalCompositeOperation = 'overlay'; fc.drawImage(gc, 0, 0); fc.globalCompositeOperation = 'source-over';
  // Ein Hauch Neon schon im Grundbild, damit es auch am Smogtag leuchtet
  fc.globalCompositeOperation = 'lighter'; fc.globalAlpha = 0.35; fc.drawImage(neon, 0, 0); fc.globalAlpha = 1; fc.globalCompositeOperation = 'source-over';
  return { base: full, neon };
}

function hexPathTo(ctx, x, y, r) { const p = corners(x, y, r); p.forEach(([a, b], i) => i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)); ctx.closePath(); }
function rrect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
