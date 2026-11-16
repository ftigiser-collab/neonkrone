// Prozedurale Hexkarte und vorgerendertes Gelände
import { Noise, clamp, smoothstep } from './util.js';
import { center, neighbors, distance, worldSize, pixelToHex, R, HW } from './hex.js';
import { MOVE_COST } from './data.js';
import { renderCity } from './city.js';

export function generateMap(seed, W = 30, H = 22) {
  const N = new Noise(seed), N2 = new Noise(seed + 7), N3 = new Noise(seed + 13), N4 = new Noise(seed + 29);
  const starts = [{ c: 4, r: 4 }, { c: W - 5, r: H - 5 }];
  const ter = new Array(W * H), spice = new Float32Array(W * H), roads = new Uint8Array(W * H);
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
    // Straßenraster: Avenuen entlang der Reihen, Diagonalen entlang zweier Würfelachsen
    const cx = c - (r - (r & 1)) / 2, cy = -cx - r;
    const road = (r % 4 === 1) || (((cx % 5) + 5) % 5 === 2) || (((cy % 7) + 7) % 7 === 3 && N4.v(x / 3, y / 3) > 0.45);
    let t = v > 0.66 ? 'mountain' : v > 0.5 ? 'rock' : 'sand';
    if (road) t = 'sand';
    if (dmin <= 3) t = 'rock';
    const dn = N3.fbm(x / 3.2 + 10, y / 3.2, 3);
    if (t === 'sand' && dn > (road ? 0.66 : 0.58)) t = 'dune';
    if (!road && t === 'rock' && dn > 0.7 && dmin > 4) t = 'dune';
    roads[idx(c, r)] = road ? 1 : 0;
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

  const map = { W, H, seed, ter, spice, starts, idx, pois, roads };
  map.size = worldSize(W, H);
  const city = renderCity(map);
  map.base = city.base; map.neon = city.neon;
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

function mulberry(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
