// Prozedurale Hexkarte und vorgerendertes Gelände
import { Noise, clamp, smoothstep } from './util.js';
import { center, neighbors, distance, worldSize, pixelToHex, R, HW } from './hex.js';
import { MOVE_COST } from './data.js';

export function generateMap(seed, W = 30, H = 22) {
  const N = new Noise(seed), N2 = new Noise(seed + 7), N3 = new Noise(seed + 13), N4 = new Noise(seed + 29);
  const starts = [{ c: 4, r: 4 }, { c: W - 5, r: H - 5 }];
  const ter = new Array(W * H), spice = new Float32Array(W * H);
  const idx = (c, r) => r * W + c;

  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const p = center(c, r), x = p.x / HW, y = p.y / HW;
    let v = N.fbm(x / 5.2, y / 5.2, 4) * 1.1 - 0.03;
    let dmin = 99;
    for (const s of starts) {
      const d = distance(c, r, s.c, s.r); dmin = Math.min(dmin, d);
      if (d <= 3) v = Math.max(v, 0.64);
      else if (d === 4) v = Math.max(v, 0.56 + (N4.v(x, y) - 0.5) * 0.2);
    }
    let t = v > 0.76 ? 'mountain' : v > 0.6 ? 'rock' : 'sand';
    if (dmin <= 3) t = 'rock';
    if (t === 'sand') {
      const dn = N3.fbm(x / 3.2 + 10, y / 3.2, 3);
      if (dn > 0.58) t = 'dune';
    }
    ter[idx(c, r)] = t;
  }

  // Glutfelder: garantiert nahe jeder Basis + Mitte + Rauschen
  const fields = [];
  const mid = { c: W / 2, r: H / 2 };
  for (const s of starts) {
    const dc = mid.c - s.c, dr = mid.r - s.r, l = Math.hypot(dc, dr);
    fields.push({ c: Math.round(s.c + dc / l * 5.5), r: Math.round(s.r + dr / l * 5.5), rad: 2 });
    fields.push({ c: Math.round(s.c + dr / l * 6), r: Math.round(s.r - dc / l * 4), rad: 1 });
  }
  fields.push({ c: Math.round(mid.c), r: Math.round(mid.r), rad: 2 });
  for (const f of fields) {
    for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
      if (distance(c, r, f.c, f.r) > f.rad) continue;
      if (starts.some((s) => distance(c, r, s.c, s.r) <= 3)) continue;
      const i = idx(c, r);
      if (ter[i] === 'rock' || ter[i] === 'mountain') ter[i] = 'sand';
      spice[i] = Math.max(spice[i], 450 + Math.round(N4.v(c, r) * 250));
    }
  }
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const i = idx(c, r);
    if (ter[i] !== 'sand' && ter[i] !== 'dune') continue;
    const p = center(c, r);
    const s = N2.fbm(p.x / HW / 2.5, p.y / HW / 2.5, 3);
    if (s > 0.62) spice[i] = Math.max(spice[i], Math.round(250 + (s - 0.62) * 2000));
  }

  // Fahrzeug-Verbindung zwischen den Basen sicherstellen
  if (!reachable(ter, W, H, starts[0], starts[1])) carve(ter, W, H, starts[0], starts[1]);

  // Schlüsselorte: Mitte und zwei umkämpfte Orte gleich weit von beiden Basen, je ein Heiligtum nahe jeder Basis
  const targets = [[0.5, 0.5, 'zisterne'], [0.24, 0.78, 'warte'], [0.76, 0.22, 'schmuggler'], [0.36, 0.3, 'heiligtum'], [0.64, 0.7, 'heiligtum']];
  const pois = [];
  for (const [fx, fy, type] of targets) {
    const tc = Math.round(fx * (W - 1)), tr = Math.round(fy * (H - 1));
    let best = null, bd = 1e9;
    for (let r = 1; r < H - 1; r++) for (let c = 1; c < W - 1; c++) {
      if (starts.some((s) => distance(c, r, s.c, s.r) < 6) || pois.some((p) => distance(c, r, p.c, p.r) < 4)) continue;
      const i = idx(c, r);
      const d = distance(c, r, tc, tr) * 3 + (ter[i] === 'rock' ? 0 : ter[i] === 'mountain' ? 4 : 2) + (spice[i] > 0 ? 3 : 0);
      if (d < bd) { bd = d; best = [c, r]; }
    }
    if (!best) continue;
    const [c, r] = best, i = idx(c, r);
    ter[i] = 'rock'; spice[i] = 0;
    for (const [nc, nr] of neighbors(c, r, W, H)) if (ter[idx(nc, nr)] === 'mountain' && pois.length % 2 === 0) ter[idx(nc, nr)] = 'rock';
    pois.push({ c, r, type });
  }

  const map = { W, H, seed, ter, spice, starts, idx, pois };
  map.size = worldSize(W, H);
  map.base = renderBase(map, N3, N4);
  return map;
}

function reachable(ter, W, H, a, b) {
  const seen = new Uint8Array(W * H), q = [[a.c, a.r]];
  seen[a.r * W + a.c] = 1;
  while (q.length) {
    const [c, r] = q.pop();
    if (c === b.c && r === b.r) return true;
    for (const [nc, nr] of neighbors(c, r, W, H)) {
      const i = nr * W + nc;
      if (!seen[i] && MOVE_COST.track[ter[i]] < Infinity) { seen[i] = 1; q.push([nc, nr]); }
    }
  }
  return false;
}

function carve(ter, W, H, a, b) {
  let c = a.c, r = a.r;
  for (let k = 0; k < 200 && !(c === b.c && r === b.r); k++) {
    let best = null, bd = 1e9;
    for (const [nc, nr] of neighbors(c, r, W, H)) { const d = distance(nc, nr, b.c, b.r); if (d < bd) { bd = d; best = [nc, nr]; } }
    [c, r] = best;
    if (ter[r * W + c] === 'mountain') ter[r * W + c] = 'rock';
  }
}

// Gelände als Bild: organische Übergänge, Höhenschattierung, Feindetails
function renderBase(map, N3, N4) {
  const { W, H, ter } = map;
  const S = 0.6;
  const w = Math.ceil(map.size.w * S), h = Math.ceil(map.size.h * S);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const img = ctx.createImageData(w, h);
  const height = new Float32Array(w * h), rockW = new Float32Array(w * h), mtnW = new Float32Array(w * h), duneW = new Float32Array(w * h), ridgeA = new Float32Array(w * h);
  const W_R = { sand: 0, dune: 0, rock: 1, mountain: 1 }, W_M = { sand: 0, dune: 0, rock: 0, mountain: 1 }, W_D = { sand: 0, dune: 1, rock: 0, mountain: 0 };
  const N5 = new Noise(map.seed + 41);

  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const X = px / S, Y = py / S;
    const wx = X + (N4.v(X / 40, Y / 40) - 0.5) * 30 + (N5.v(X / 11, Y / 11) - 0.5) * 12, wy = Y + (N4.v(X / 40 + 50, Y / 40) - 0.5) * 30 + (N5.v(X / 11 + 30, Y / 11) - 0.5) * 12;
    const hx = pixelToHex(wx, wy);
    let sr = 0, sm = 0, sd = 0, sw = 0;
    const cand = [[hx.col, hx.row], ...neighbors(clamp(hx.col, 0, W - 1), clamp(hx.row, 0, H - 1), W, H)];
    for (const [c, r] of cand) {
      if (c < 0 || r < 0 || c >= W || r >= H) continue;
      const p = center(c, r);
      const d = Math.hypot(wx - p.x, wy - p.y);
      let k = 1 - d / (R * 1.22); if (k <= 0) continue;
      k = k * k * k;
      const t = ter[r * W + c];
      sr += W_R[t] * k; sm += W_M[t] * k; sd += W_D[t] * k; sw += k;
    }
    if (sw === 0) sw = 1;
    const rk = sr / sw, mt = sm / sw, du = sd / sw;
    const x = X / HW, y = Y / HW;
    // Dünen: gerichtete Grate mit scharfer Leeseite
    const u = (x * 0.8 + y * 0.6) * 2.6, vv = (-x * 0.6 + y * 0.8) * 0.9;
    const n = N3.fbm(u + N3.v(vv, u * 0.2) * 0.8, vv, 3);
    const saw = n * 4 % 1, ridge = Math.pow(1 - Math.abs(2 * n - 1), 1.6);
    const micro = N5.fbm(x * 9, y * 9, 2);
    const sandH = ridge * (0.05 + du * 0.34) + N4.fbm(x * 1.6, y * 1.6, 2) * 0.08 + micro * 0.012;
    // Fels: Schichtung und Blöcke
    const strata = Math.sin((y * 6.5 + x * 1.5 + N4.fbm(x * 2, y * 2, 3) * 3.5) * 3.1);
    const rockH = 0.32 + N4.fbm(x * 5, y * 5, 3) * 0.2 + strata * 0.018 + N5.fbm(x * 14, y * 14, 2) * 0.03;
    // Gebirge: Grate
    let mtnH = 0.7, amp = 0.55, fq = 2.2;
    for (let o = 0; o < 5; o++) { const rn = N5.v(x * fq + o * 17, y * fq - o * 9), cr = 1 - Math.abs(2 * rn - 1); mtnH += cr * cr * amp; amp *= 0.5; fq *= 2.1; }
    const rr2 = smoothstep(0.22, 0.78, rk), mm = smoothstep(0.28, 0.82, mt);
    const i = py * w + px;
    height[i] = sandH * (1 - rr2) + rockH * rr2 * (1 - mm) + mtnH * mm;
    rockW[i] = rr2; mtnW[i] = mm; duneW[i] = du; ridgeA[i] = ridge * (1 - rr2) + strata * 0.0001;
  }
  const L = [-0.6, -0.6, 0.53];
  for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
    const i = py * w + px;
    const hx = height[py * w + Math.min(px + 1, w - 1)] - height[py * w + Math.max(px - 1, 0)];
    const hy = height[Math.min(py + 1, h - 1) * w + px] - height[Math.max(py - 1, 0) * w + px];
    const rr2 = rockW[i], mm = mtnW[i];
    const k = 3.4 + mm * 4.5 + rr2 * 1.2;
    let nx = -hx * k, ny = -hy * k, nz = 1;
    const nl = Math.hypot(nx, ny, nz); nx /= nl; ny /= nl; nz /= nl;
    const dot = clamp(nx * L[0] + ny * L[1] + nz * L[2], 0, 1);
    const sh = 0.46 + dot * 0.8;
    const x = px / S / HW, y = py / S / HW;
    const big = N4.v(x * 0.7, y * 0.7), v1 = N4.v(x * 2, y * 2), grain = (N5.v(x * 40, y * 40) - 0.5) * 10;
    // Sand: warme Großflächenvariation
    let r = 226 - big * 22 - v1 * 14 + grain, g = 172 - big * 26 - v1 * 16 + grain * 0.9, b = 104 - big * 22 - v1 * 12 + grain * 0.7;
    // Glanz auf Dünenkämmen
    const crest = ridgeA[i] > 0.85 ? (ridgeA[i] - 0.85) * 5 : 0;
    r += crest * 18; g += crest * 14; b += crest * 8;
    // Fels mit Schichtfarbe
    const strata = Math.sin((y * 6.5 + x * 1.5 + N4.fbm(x * 2, y * 2, 2) * 3.5) * 3.1);
    const rr0 = 124 - v1 * 22 + strata * 9 + grain, rg0 = 101 - v1 * 18 + strata * 7 + grain * 0.9, rb0 = 84 - v1 * 14 + strata * 5 + grain * 0.8;
    r = r * (1 - rr2) + rr0 * rr2; g = g * (1 - rr2) + rg0 * rr2; b = b * (1 - rr2) + rb0 * rr2;
    // Gebirge dunkel, kühl
    const pk = clamp((height[i] - 1.15) * 1.6, 0, 1);
    r = r * (1 - mm) + (90 - v1 * 16 + grain + pk * 40) * mm; g = g * (1 - mm) + (74 - v1 * 12 + grain + pk * 30) * mm; b = b * (1 - mm) + (66 - v1 * 8 + grain + pk * 18) * mm;
    img.data[i * 4] = clamp(r * sh + 6, 0, 255);
    img.data[i * 4 + 1] = clamp(g * sh, 0, 255);
    img.data[i * 4 + 2] = clamp(b * sh * 0.97, 0, 255);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);

  const full = document.createElement('canvas');
  full.width = Math.ceil(map.size.w); full.height = Math.ceil(map.size.h);
  const fc = full.getContext('2d');
  fc.imageSmoothingEnabled = true; fc.imageSmoothingQuality = 'high';
  fc.drawImage(cv, 0, 0, full.width, full.height);
  const at = (arr, X, Y) => { const ix = clamp(Math.floor(X * S), 0, w - 1), iy = clamp(Math.floor(Y * S), 0, h - 1); return arr[iy * w + ix]; };
  const rnd = mulberry(map.seed);

  // Sandrippel quer zum Wind
  const ripA = Math.atan2(0.6, 0.8) + Math.PI / 2;
  for (let k = 0; k < 9000; k++) {
    const X = rnd() * full.width, Y = rnd() * full.height;
    if (at(rockW, X, Y) > 0.08) continue;
    const len = 6 + rnd() * 14, a = ripA + (rnd() - 0.5) * 0.3 + (N4.v(X / 120, Y / 120) - 0.5) * 0.8;
    const ca = Math.cos(a), sa = Math.sin(a), wob = 1 + rnd() * 1.5;
    fc.lineWidth = 0.8 + rnd() * 0.6;
    for (const [off, col] of [[0, 'rgba(255,236,200,0.16)'], [1.3, 'rgba(110,70,35,0.12)']]) {
      fc.strokeStyle = col; fc.beginPath();
      for (let j = 0; j <= 4; j++) { const f = j / 4 - 0.5, px = X + ca * len * f + sa * off, py = Y + sa * len * f - ca * off + Math.sin(f * 6.28) * wob; j ? fc.lineTo(px, py) : fc.moveTo(px, py); }
      fc.stroke();
    }
  }
  // Großflächige Farbflecken (Mineralien, Verwitterung)
  for (let k = 0; k < 70; k++) {
    const X = rnd() * full.width, Y = rnd() * full.height, rad = 30 + rnd() * 90;
    const g = fc.createRadialGradient(X, Y, 0, X, Y, rad);
    const col = rnd() < 0.5 ? '120,70,40' : rnd() < 0.5 ? '235,200,150' : '160,90,60';
    g.addColorStop(0, `rgba(${col},${0.05 + rnd() * 0.05})`); g.addColorStop(1, `rgba(${col},0)`);
    fc.fillStyle = g; fc.beginPath(); fc.arc(X, Y, rad, 0, 6.28); fc.fill();
  }
  // Feine Körnung
  const grain = fc.createImageData(full.width, full.height);
  for (let i = 0; i < grain.data.length; i += 4) { const gv = Math.random() * 255; grain.data[i] = grain.data[i + 1] = grain.data[i + 2] = gv; grain.data[i + 3] = 16; }
  const gc = document.createElement('canvas'); gc.width = full.width; gc.height = full.height; gc.getContext('2d').putImageData(grain, 0, 0);
  fc.globalCompositeOperation = 'overlay'; fc.drawImage(gc, 0, 0); fc.globalCompositeOperation = 'source-over';

  // Felsrisse mit Lichtkante
  const crack = (X, Y, len, depth) => {
    let x = X, y = Y, a = rnd() * 6.28;
    const pts = [[x, y]];
    for (let s = 0; s < len; s++) { a += (rnd() - 0.5) * 0.9; x += Math.cos(a) * 3.2; y += Math.sin(a) * 3.2; if (at(rockW, x, y) < 0.6) break; pts.push([x, y]); if (depth < 2 && rnd() < 0.12) crack(x, y, len * 0.5, depth + 1); }
    if (pts.length < 2) return;
    for (const [dx, col, lw] of [[0.7, 'rgba(255,235,205,0.18)', 1], [0, 'rgba(25,16,10,0.55)', 0.9 - depth * 0.25]]) {
      fc.strokeStyle = col; fc.lineWidth = lw; fc.beginPath(); fc.moveTo(pts[0][0] + dx, pts[0][1] + dx); for (const p of pts) fc.lineTo(p[0] + dx, p[1] + dx); fc.stroke();
    }
  };
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) {
    const t = ter[r * W + c], p = center(c, r);
    if (t === 'rock') for (let k = 0; k < 3; k++) crack(p.x + (rnd() - 0.5) * R, p.y + (rnd() - 0.5) * R, 6 + rnd() * 10, 0);
    if (t === 'mountain') {
      // Felsblöcke in Bodenfarbe, weich eingebettet
      for (let k = 0; k < 9; k++) {
        const x0 = p.x + (rnd() - 0.5) * R * 1.5, y0 = p.y + (rnd() - 0.5) * R * 1.5, s0 = 2.5 + rnd() * 6, a0 = rnd() * 6.28;
        const pts = []; for (let j = 0; j < 6; j++) { const a = a0 + j * 1.047 + (rnd() - 0.5) * 0.5, rr = s0 * (0.6 + rnd() * 0.5); pts.push([x0 + Math.cos(a) * rr, y0 + Math.sin(a) * rr * 0.8]); }
        const path = (dx) => { fc.beginPath(); pts.forEach(([x, y], j) => j ? fc.lineTo(x + dx, y + dx) : fc.moveTo(x + dx, y + dx)); fc.closePath(); };
        fc.fillStyle = 'rgba(12,8,5,0.32)'; path(2); fc.fill();
        const gr = fc.createLinearGradient(x0 - s0, y0 - s0, x0 + s0, y0 + s0); gr.addColorStop(0, 'rgba(190,160,130,0.55)'); gr.addColorStop(0.5, 'rgba(110,88,72,0.35)'); gr.addColorStop(1, 'rgba(30,20,14,0.5)');
        fc.fillStyle = gr; path(0); fc.fill();
      }
      for (let k = 0; k < 2; k++) crack(p.x + (rnd() - 0.5) * R, p.y + (rnd() - 0.5) * R, 8, 1);
    }
  }
  // Geröll an Felskanten und Steine auf Fels
  for (let k = 0; k < 5000; k++) {
    const X = rnd() * full.width, Y = rnd() * full.height, rw = at(rockW, X, Y), mw = at(mtnW, X, Y);
    const edge = rw > 0.15 && rw < 0.75, onRock = rw >= 0.75 && mw < 0.3;
    if (!(edge || (onRock && rnd() < 0.25))) continue;
    const s0 = (edge ? 0.7 : 0.9) + rnd() * (edge ? 1.8 : 2), a = rnd() * 6.28;
    const pts = []; for (let j = 0; j < 5; j++) { const aa = a + j * 1.256 + (rnd() - 0.5) * 0.6, rr = s0 * (0.6 + rnd() * 0.6); pts.push([X + Math.cos(aa) * rr, Y + Math.sin(aa) * rr * 0.8]); }
    const path = (d) => { fc.beginPath(); pts.forEach(([x, y], j) => j ? fc.lineTo(x + d, y + d) : fc.moveTo(x + d, y + d)); fc.closePath(); };
    fc.fillStyle = 'rgba(10,6,3,0.35)'; path(s0 * 0.5); fc.fill();
    const b0 = 82 + rnd() * 42;
    fc.fillStyle = `rgb(${b0 + 22},${b0 + 6},${b0 - 10})`; path(0); fc.fill();
    fc.fillStyle = 'rgba(255,230,200,0.3)'; fc.beginPath(); fc.moveTo(pts[0][0], pts[0][1]); fc.lineTo(pts[1][0], pts[1][1]); fc.lineTo(X, Y); fc.closePath(); fc.fill();
  }
  // Sandverwehungen an der Leeseite von Felsen
  for (let k = 0; k < 1400; k++) {
    const X = rnd() * full.width, Y = rnd() * full.height, rw = at(rockW, X, Y);
    if (rw < 0.05 || rw > 0.4) continue;
    if (at(rockW, X - 10, Y - 10) < rw) continue;
    const g = fc.createRadialGradient(X, Y, 0, X, Y, 12);
    g.addColorStop(0, 'rgba(232,192,130,0.22)'); g.addColorStop(1, 'rgba(232,192,130,0)');
    fc.fillStyle = g; fc.beginPath(); fc.arc(X, Y, 12, 0, 6.28); fc.fill();
  }
  return full;
}

function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
