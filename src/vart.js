// Detaillierte Fahrzeuge und Thopter: vorgerenderte Rümpfe und Türme, animierte Ketten und Flügel
import { part, drawPart, drawPartShadow, rr, lg, rg, box, rivets, rivetRow, vents, seams, hazard, pipe, emblem } from './art.js';
import { shade } from './util.js';

const TAN = ['#a3aac3', '#7b8094', '#525564'];
const GLASS = '#8fd0f0';

function tracks(c, x, y, w, h) {
  c.fillStyle = '#1a1816'; rr(c, x, y, w, h, h * 0.45); c.fill();
  c.fillStyle = '#2c2925'; for (let k = x + 1; k < x + w - 1; k += 2.2) c.fillRect(k, y + 0.5, 1.2, h - 1);
  c.fillStyle = 'rgba(209,217,248,0.12)'; c.fillRect(x + 1, y + 0.5, w - 2, 0.6);
}
function wheel(c, x, y, r) { c.fillStyle = '#1a1816'; c.beginPath(); c.arc(x, y, r, 0, 6.28); c.fill(); c.fillStyle = '#3c3f4b'; c.beginPath(); c.arc(x, y, r * 0.45, 0, 6.28); c.fill(); }
function hullPlate(c, pts, a = TAN[0], b = TAN[2]) {
  c.fillStyle = lg(c, -16, -12, 10, 14, a, b); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) c.lineTo(p[0], p[1]); c.closePath(); c.fill();
}
const treadAnim = (c, x, y, w, h, t, moving) => {
  if (!moving) return;
  const off = (t * 26) % 2.2;
  c.fillStyle = 'rgba(63,66,78,0.9)';
  for (let k = x + off; k < x + w; k += 2.2) c.fillRect(k, y, 0.8, h);
};

// ---------- Kampfpanzer ----------
const panzerHull = (color) => part(`vh-panzer-${color}`, 40, 32, (L) => {
  L((c) => { tracks(c, -17, -13, 34, 6.5); tracks(c, -17, 6.5, 34, 6.5); }, { bevel: 0.5, grime: 0.4 });
  L((c) => {
    hullPlate(c, [[15, -6], [12, -8.5], [-13, -8.5], [-15, -6], [-15, 6], [-13, 8.5], [12, 8.5], [15, 6]]);
    seams(c, [[-6, -8.5, -6, 8.5], [3, -8.5, 3, 8.5], [-13, 0, -6, 0]]);
    vents(c, -14, -5, 5, 10, 5, true);
    box(c, 5, -7.5, 6, 3, '#5e6271', 0.6); box(c, 5, 4.5, 6, 3, '#5e6271', 0.6);
    c.fillStyle = color; c.fillRect(-8, -8.5, 1.8, 17);
    rivetRow(c, -12, -7.5, 12, -7.5, 9, 0.35); rivetRow(c, -12, 7.5, 12, 7.5, 9, 0.35);
    c.fillStyle = 'rgba(204,213,243,0.85)'; c.fillRect(14, -5, 1, 1.6); c.fillRect(14, 3.4, 1, 1.6);
  }, { bevel: 0.7, dust: 0.25 });
  L((c) => { for (const yy of [-12.5, 9.5]) { c.fillStyle = lg(c, 0, yy, 0, yy + 3, '#83899e', '#474a57'); rr(c, -9, yy, 20, 3, 0.8); c.fill(); rivetRow(c, -8, yy + 1.5, 10, yy + 1.5, 6, 0.3); } }, { bevel: 0.5 });
});
const panzerTurret = (color) => part(`vt-panzer-${color}`, 50, 22, (L) => {
  L((c) => { c.fillStyle = lg(c, 0, -2, 0, 2, '#3c3e4a', '#1c1915'); c.fillRect(4, -1.7, 17, 3.4); c.fillStyle = '#2a2622'; rr(c, 19, -2.5, 4, 5, 0.6); c.fill(); c.fillStyle = '#111'; c.fillRect(22, -0.8, 1, 1.6); }, { bevel: 0.4 });
  L((c) => {
    c.fillStyle = lg(c, -8, -8, 8, 8, '#b6bed9', '#545766'); c.beginPath(); c.moveTo(8, -3); c.lineTo(5, -7); c.lineTo(-6, -7.5); c.lineTo(-9, -4); c.lineTo(-9, 4); c.lineTo(-6, 7.5); c.lineTo(5, 7); c.lineTo(8, 3); c.closePath(); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(-1, -3, 2.6, 0, 6.28); c.fill(); c.fillStyle = '#6b7081'; c.beginPath(); c.arc(-1, -3, 2.1, 0, 6.28); c.fill(); rivets(c, [[-1, -3]], 0.5);
    box(c, -5, 2.5, 4, 2.6, '#2d2f39', 0.4); c.fillStyle = 'rgba(150,215,255,0.8)'; c.fillRect(-4.4, 3, 2.8, 1);
    emblem(c, 3, 3.5, 2, color);
    rivets(c, [[5, -5.5], [5, 5.5], [-7, -4], [-7, 4]], 0.4);
  }, { bevel: 0.8, dust: 0.2 });
});

// ---------- Raketenwerfer ----------
const werferHull = (color) => part(`vh-werfer-${color}`, 38, 30, (L) => {
  L((c) => { tracks(c, -16, -12, 32, 6); tracks(c, -16, 6, 32, 6); }, { bevel: 0.5, grime: 0.4 });
  L((c) => {
    hullPlate(c, [[14, -5], [11, -7], [-13, -7], [-14, -5], [-14, 5], [-13, 7], [11, 7], [14, 5]], '#9ba1b9', '#4c505d');
    box(c, 8, -5.5, 5, 11, '#2d2f39', 0.8); c.fillStyle = 'rgba(150,215,255,0.8)'; c.fillRect(11, -4, 1.4, 8);
    vents(c, -13, -4, 4, 8, 4, true); c.fillStyle = color; c.fillRect(5, -7, 2, 14);
    rivetRow(c, -11, -6.2, 6, -6.2, 7, 0.35); rivetRow(c, -11, 6.2, 6, 6.2, 7, 0.35);
  }, { bevel: 0.7, dust: 0.25 });
});
const werferTurret = (color) => part(`vt-werfer-${color}`, 26, 22, (L) => {
  L((c) => {
    c.fillStyle = lg(c, -8, -7, 8, 7, '#6e7385', '#30323d'); rr(c, -9, -7.5, 15, 15, 1.6); c.fill();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      const x = -5 + j * 6.5, y = -4.5 + i * 4.5;
      c.fillStyle = '#16130f'; c.beginPath(); c.arc(x, y, 1.8, 0, 6.28); c.fill();
      c.fillStyle = '#c84a30'; c.beginPath(); c.arc(x, y, 1.1, 0, 6.28); c.fill();
      c.fillStyle = 'rgba(197,206,235,0.6)'; c.beginPath(); c.arc(x - 0.4, y - 0.4, 0.4, 0, 6.28); c.fill();
    }
    c.fillStyle = color; c.fillRect(-9, -7.5, 1.6, 15);
    hazard(c, 3.5, -7.5, 2.4, 15);
  }, { bevel: 0.8 });
});

// ---------- Laserpanzer ----------
const laserHull = (color) => part(`vh-laser-${color}`, 40, 30, (L) => {
  L((c) => { tracks(c, -17, -12, 34, 5.5); tracks(c, -17, 6.5, 34, 5.5); }, { bevel: 0.5, grime: 0.35 });
  L((c) => {
    hullPlate(c, [[16, 0], [10, -7.5], [-13, -7.5], [-15, -4], [-15, 4], [-13, 7.5], [10, 7.5]], '#b8c0dc', '#595c6c');
    seams(c, [[10, -7.5, 4, 0, 10, 7.5], [-6, -7.5, -6, 7.5]]);
    c.fillStyle = 'rgba(110,180,255,0.7)'; c.fillRect(-12, -5.5, 4, 1.2); c.fillRect(-12, 4.3, 4, 1.2);
    c.fillStyle = color; c.fillRect(-14, -3, 2, 6);
    rivetRow(c, -10, -6.6, 6, -6.6, 6, 0.35); rivetRow(c, -10, 6.6, 6, 6.6, 6, 0.35);
  }, { bevel: 0.8, dust: 0.15 });
});
const laserTurret = (color) => part(`vt-laser-${color}`, 50, 18, (L) => {
  L((c) => { c.fillStyle = lg(c, 0, -2, 0, 2, '#5a6068', '#22262a'); c.fillRect(3, -1.6, 20, 3.2); c.fillStyle = '#3a4048'; for (let k = 6; k < 20; k += 4) c.fillRect(k, -2.2, 1.2, 4.4); c.fillStyle = '#5ea8ff'; c.fillRect(21, -1.2, 3, 2.4); }, { bevel: 0.4 });
  L((c) => {
    c.fillStyle = lg(c, -7, -6, 7, 6, '#c9d1ef', '#676b7c'); c.beginPath(); c.moveTo(8, 0); c.lineTo(2, -6); c.lineTo(-7, -5); c.lineTo(-7, 5); c.lineTo(2, 6); c.closePath(); c.fill();
    c.fillStyle = 'rgba(110,180,255,0.9)'; c.fillRect(-4, -1, 6, 2);
    emblem(c, -4, -3.5, 1.4, color);
    rivets(c, [[3, -3.5], [3, 3.5], [-5, 3.5]], 0.4);
  }, { bevel: 0.8 });
});

// ---------- Belagerungskoloss ----------
const kolossHull = (color) => part(`vh-koloss-${color}`, 44, 40, (L) => {
  L((c) => { for (const yy of [-15.5, -4.5, 6.5]) { tracks(c, -18.5, yy, 16, 8.5); tracks(c, 2, yy, 16, 8.5); } }, { bevel: 0.5, grime: 0.45 });
  L((c) => {
    hullPlate(c, [[16, -9], [13, -11.5], [-14, -11.5], [-16, -9], [-16, 9], [-14, 11.5], [13, 11.5], [16, 9]], '#989eb6', '#414450');
    seams(c, [[-8, -11.5, -8, 11.5], [-1, -11.5, -1, 11.5], [6, -11.5, 6, 11.5], [-16, 0, -8, 0]]);
    vents(c, -15, -8, 6, 16, 6, true);
    for (const yy of [-10, 7.2]) { box(c, 8, yy, 6, 2.8, '#545766', 0.5); }
    c.fillStyle = color; c.fillRect(-9, -11.5, 2, 23);
    rivetRow(c, -13, -10.6, 13, -10.6, 12, 0.4); rivetRow(c, -13, 10.6, 13, 10.6, 12, 0.4);
    c.fillStyle = 'rgba(255,190,110,0.8)'; c.fillRect(15, -7, 1, 2); c.fillRect(15, 5, 1, 2);
  }, { bevel: 0.9, dust: 0.3 });
});
const kolossTurret = (color) => part(`vt-koloss-${color}`, 50, 26, (L) => {
  L((c) => { for (const yy of [-4.8, 1.6]) { c.fillStyle = lg(c, 0, yy, 0, yy + 3.2, '#3c3e4a', '#1c1915'); c.fillRect(5, yy, 18, 3.2); c.fillStyle = '#2a2622'; c.fillRect(20, yy - 0.5, 4, 4.2); } }, { bevel: 0.4 });
  L((c) => {
    c.fillStyle = lg(c, -9, -9, 9, 9, '#aeb5cf', '#484b59'); rr(c, -10, -8.5, 18, 17, 3); c.fill();
    seams(c, [[-10, 0, 8, 0]]);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(-4, -3.5, 2.6, 0, 6.28); c.fill(); c.fillStyle = '#6b7081'; c.beginPath(); c.arc(-4, -3.5, 2.1, 0, 6.28); c.fill();
    emblem(c, -3, 4, 2.4, color);
    rivets(c, [[5, -6.5], [5, 6.5], [-8, -6.5], [-8, 6.5], [5, 0]], 0.5);
  }, { bevel: 0.9, dust: 0.2 });
});

// ---------- Brenner ----------
const brennerHull = (color) => part(`vh-brenner-${color}`, 40, 32, (L) => {
  L((c) => { tracks(c, -17, -13, 34, 6.5); tracks(c, -17, 6.5, 34, 6.5); }, { bevel: 0.5, grime: 0.45 });
  L((c) => {
    hullPlate(c, [[15, -6], [12, -8.5], [-13, -8.5], [-15, -6], [-15, 6], [-13, 8.5], [12, 8.5], [15, 6]], '#777c8f', '#353742');
    for (const yy of [-6, 1.5]) { c.fillStyle = lg(c, 0, yy, 0, yy + 4.2, '#e6b45a', '#7a5520'); rr(c, -13, yy, 13, 4.2, 2); c.fill(); c.strokeStyle = 'rgba(60,35,10,0.6)'; c.lineWidth = 0.4; for (let k = -11; k < 0; k += 3) { c.beginPath(); c.moveTo(k, yy); c.lineTo(k, yy + 4.2); c.stroke(); } }
    hazard(c, 1, -8.5, 3, 17); c.fillStyle = color; c.fillRect(-14.5, -3, 1.5, 6);
    rivetRow(c, 5, -7.5, 12, -7.5, 4, 0.35); rivetRow(c, 5, 7.5, 12, 7.5, 4, 0.35);
    c.fillStyle = lg(c, 0, -2, 0, 2, '#3c3e4a', '#1c1915'); c.fillRect(6, -1.8, 13, 3.6); c.fillStyle = '#5a5f66'; rr(c, 17, -2.4, 3.4, 4.8, 0.8); c.fill();
  }, { bevel: 0.7, dust: 0.25 });
});

// ---------- Flakwagen ----------
const flakHull = (color) => part(`vh-flak-${color}`, 34, 26, (L) => {
  L((c) => { for (const [x, y] of [[-9, -9.5], [6, -9.5], [-9, 9.5], [6, 9.5]]) wheel(c, x, y, 3); }, { bevel: 0.5, grime: 0.3 });
  L((c) => {
    hullPlate(c, [[13, -5], [11, -7], [-12, -7], [-13, -5], [-13, 5], [-12, 7], [11, 7], [13, 5]], '#9fa6be', '#4f5361');
    box(c, 6, -6, 6, 12, '#2d2f39', 1); c.fillStyle = 'rgba(160,220,255,0.85)'; rr(c, 9, -4.5, 2.4, 9, 0.6); c.fill();
    c.fillStyle = color; c.fillRect(-12, -7, 2, 14);
    vents(c, -9, 3, 8, 3, 4, true); rivetRow(c, -10, -6.2, 4, -6.2, 6, 0.35);
  }, { bevel: 0.7, dust: 0.3 });
});
const flakTurret = (color) => part(`vt-flak-${color}`, 34, 16, (L) => {
  L((c) => { c.fillStyle = '#1b1915'; c.fillRect(3, -3.6, 12, 1.8); c.fillRect(3, 1.8, 12, 1.8); c.fillStyle = '#2f313b'; c.fillRect(13, -4, 2.2, 2.6); c.fillRect(13, 1.4, 2.2, 2.6); }, { bevel: 0.3 });
  L((c) => { c.fillStyle = rg(c, -2, -2, 1, 6, '#b8c0db', '#4e5260'); c.beginPath(); c.arc(0, 0, 5.6, 0, 6.28); c.fill(); c.fillStyle = color; c.beginPath(); c.arc(-1.4, 0, 1.8, 0, 6.28); c.fill(); rivets(c, [[3, -3], [3, 3]], 0.4); }, { bevel: 0.7 });
});

// ---------- Sandläufer ----------
const trikeBody = (color) => part(`vh-trike-${color}`, 34, 26, (L) => {
  L((c) => { wheel(c, -7, -8, 3.6); wheel(c, -7, 8, 3.6); wheel(c, 11, 0, 3); }, { bevel: 0.5, grime: 0.3 });
  L((c) => {
    c.fillStyle = lg(c, 0, -7, 0, 7, '#aab1cb', '#4c505d'); c.beginPath(); c.moveTo(14, 0); c.lineTo(-2, -6.5); c.lineTo(-12, -4.5); c.lineTo(-12, 4.5); c.lineTo(-2, 6.5); c.closePath(); c.fill();
    c.fillStyle = color; c.beginPath(); c.moveTo(11, 0); c.lineTo(0, -3.5); c.lineTo(0, 3.5); c.closePath(); c.fill();
    seams(c, [[-2, -6.5, -2, 6.5]]); vents(c, -11, -3, 3, 6, 3, true);
    c.fillStyle = '#2c2d37'; c.beginPath(); c.arc(-5, 0, 3.4, 0, 6.28); c.fill();
    c.fillStyle = '#6b7082'; c.beginPath(); c.arc(-5, 0, 2.1, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(150,220,255,0.9)'; c.fillRect(-3.6, -0.8, 1, 1.6);
    c.strokeStyle = '#1a1c1f'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-3, -1.4); c.lineTo(9, -1.4); c.moveTo(-3, 1.4); c.lineTo(9, 1.4); c.stroke();
  }, { bevel: 0.6, dust: 0.25 });
});

// ---------- Ernter ----------
const ernterBody = (color) => part(`vh-ernter-${color}`, 44, 34, (L) => {
  L((c) => { tracks(c, -19, -14.5, 34, 6.5); tracks(c, -19, 8, 34, 6.5); }, { bevel: 0.5, grime: 0.5 });
  L((c) => {
    c.fillStyle = lg(c, -16, -10, 14, 10, '#979db4', '#4f5361'); rr(c, -18, -9.5, 31, 19, 3.5); c.fill();
    seams(c, [[-1, -9.5, -1, 9.5], [-18, 0, -1, 0]]);
    c.fillStyle = '#21222a'; rr(c, -16, -7.5, 14, 15, 2.6); c.fill();
    c.strokeStyle = 'rgba(120,95,60,0.6)'; c.lineWidth = 0.5; for (let k = -15; k < -2; k += 2.4) { c.beginPath(); c.moveTo(k, -7.5); c.lineTo(k, 7.5); c.stroke(); }
    c.fillStyle = color; rr(c, 1, -8, 8, 16, 2); c.fill();
    c.fillStyle = 'rgba(160,220,255,0.88)'; rr(c, 6, -5.5, 2.6, 11, 0.8); c.fill();
    hazard(c, -18, 8, 6, 1.5); rivetRow(c, -17, -8.6, 12, -8.6, 11, 0.38);
    pipe(c, [[-2, -9], [-2, -12], [3, -12]], 1.2);
  }, { bevel: 0.8, dust: 0.35, grime: 0.65 });
  L((c) => { c.fillStyle = lg(c, 13, -13, 19, 13, '#494d5a', '#24211d'); rr(c, 13, -13, 6, 26, 2); c.fill(); rivetRow(c, 16, -11.5, 16, 11.5, 8, 0.4); }, { bevel: 0.6 });
});

// ---------- Thopter (Filmstil: kantiger Rumpf, facettierte Kanzel, Heckausleger, je Seite zwei Flügelsätze) ----------
const HULL_L = '#a9b0c4', HULL_M = '#666d82', HULL_D = '#2c303c';

// facettierte Glaskanzel, Nase zeigt nach +x
function canopy(c, x, len, wid) {
  const pts = [[x + len, 0], [x + len * 0.72, -wid * 0.55], [x + len * 0.3, -wid * 0.62], [x, -wid * 0.5], [x, wid * 0.5], [x + len * 0.3, wid * 0.62], [x + len * 0.72, wid * 0.55]];
  c.fillStyle = '#2a2f33'; c.beginPath(); pts.forEach(([px, py], i) => i ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill();
  // Glasfacetten in zwei Tönen, Rahmen dazwischen
  const panes = [
    [[x + len * 0.95, 0], [x + len * 0.7, -wid * 0.48], [x + len * 0.5, -wid * 0.22], [x + len * 0.55, 0]],
    [[x + len * 0.95, 0], [x + len * 0.7, wid * 0.48], [x + len * 0.5, wid * 0.22], [x + len * 0.55, 0]],
    [[x + len * 0.66, -wid * 0.52], [x + len * 0.32, -wid * 0.56], [x + len * 0.22, -wid * 0.18], [x + len * 0.47, -wid * 0.18]],
    [[x + len * 0.66, wid * 0.52], [x + len * 0.32, wid * 0.56], [x + len * 0.22, wid * 0.18], [x + len * 0.47, wid * 0.18]],
    [[x + len * 0.5, -wid * 0.14], [x + len * 0.2, -wid * 0.14], [x + len * 0.2, wid * 0.14], [x + len * 0.5, wid * 0.14]],
  ];
  panes.forEach((pp, i) => {
    const g = c.createLinearGradient(x, -wid, x + len, wid); g.addColorStop(0, i % 2 ? '#bfe6f6' : '#7fb8d4'); g.addColorStop(1, i % 2 ? '#4f7f96' : '#2f566a');
    c.fillStyle = g; c.beginPath(); pp.forEach(([px, py], j) => j ? c.lineTo(px, py) : c.moveTo(px, py)); c.closePath(); c.fill();
  });
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.moveTo(x + len * 0.86, -wid * 0.08); c.lineTo(x + len * 0.66, -wid * 0.36); c.lineTo(x + len * 0.62, -wid * 0.28); c.closePath(); c.fill();
}
// eckiger Rumpfabschnitt (sechseckiger Querschnitt von oben: Mittelgrat + Flanken)
function hullBlock(c, x0, x1, w0, w1, light = HULL_L, dark = HULL_D) {
  c.fillStyle = dark; c.beginPath(); c.moveTo(x0, -w0); c.lineTo(x1, -w1); c.lineTo(x1, w1); c.lineTo(x0, w0); c.closePath(); c.fill();
  c.fillStyle = lg(c, 0, -w0, 0, 0, light, HULL_M); c.beginPath(); c.moveTo(x0, -w0 * 0.92); c.lineTo(x1, -w1 * 0.92); c.lineTo(x1, 0); c.lineTo(x0, 0); c.closePath(); c.fill();
  c.fillStyle = lg(c, 0, 0, 0, w0, HULL_M, '#595d6c'); c.beginPath(); c.moveTo(x0, 0); c.lineTo(x1, 0); c.lineTo(x1, w1 * 0.92); c.lineTo(x0, w0 * 0.92); c.closePath(); c.fill();
  c.strokeStyle = 'rgba(215,224,255,0.45)'; c.lineWidth = 0.4; c.beginPath(); c.moveTo(x0, -0.2); c.lineTo(x1, -0.2); c.stroke();
}
// segmentierter Heckausleger
function tailBoom(c, x0, len, w, color, fins = true) {
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = x0 - len * i / n, b = x0 - len * (i + 1) / n + 0.6, ww = w * (1 - i * 0.12);
    hullBlock(c, b, a, ww * 0.88, ww);
    c.fillStyle = 'rgba(22,23,29,0.6)'; c.fillRect(b - 0.2, -ww * 0.9, 0.6, ww * 1.8);
  }
  const e = x0 - len;
  if (fins) { c.fillStyle = HULL_D; c.beginPath(); c.moveTo(e + 3, -0.8); c.lineTo(e - 1, -w * 2.2); c.lineTo(e - 2.5, -w * 2); c.lineTo(e - 1, -0.8); c.closePath(); c.fill(); c.beginPath(); c.moveTo(e + 3, 0.8); c.lineTo(e - 1, w * 2.2); c.lineTo(e - 2.5, w * 2); c.lineTo(e - 1, 0.8); c.closePath(); c.fill(); }
  c.fillStyle = color; c.fillRect(e + len * 0.25, -w * 0.5, len * 0.18, w);
}
// Flügelwurzel-Gehäuse mit Antrieb
function wingRoot(c, x, w, len = 6) {
  for (const sy of [-1, 1]) {
    c.fillStyle = lg(c, x - len / 2, 0, x + len / 2, 0, '#4b4e5c', '#2a2622'); c.beginPath();
    c.moveTo(x - len / 2, sy * w * 0.8); c.lineTo(x + len / 2, sy * w * 0.8); c.lineTo(x + len * 0.35, sy * (w + 2.6)); c.lineTo(x - len * 0.35, sy * (w + 2.6)); c.closePath(); c.fill();
    c.fillStyle = '#72778a'; c.beginPath(); c.arc(x, sy * (w + 1.4), 1.1, 0, 6.28); c.fill();
  }
}

const THOPTER = {
  // Späher: schlank, ein Flügelsatz je Seite vorn und hinten (4 Flügel)
  libelle: { size: [52, 18], wings: [[3, 1, 18, 4.2], [-4, 1, 16, 3.8]], rootW: 3.2, rate: 22, scale: 0.92, body(c, color) {
    tailBoom(c, -6, 17, 2, color);
    hullBlock(c, -7, 8, 3.2, 3.6); wingRoot(c, 3, 3.2, 4.5); wingRoot(c, -4, 3.2, 4.5);
    canopy(c, 7, 11, 7.4);
    c.strokeStyle = '#22252a'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(16, 2.4); c.lineTo(21, 2.4); c.stroke();
    rivets(c, [[-5, -2.4], [-5, 2.4], [1, -2.6], [1, 2.6]], 0.3);
  } },
  // Kampf-Thopter: klassischer Achtflügler mit Raketenbehältern
  falke: { size: [58, 24], wings: [[4, 2, 21, 4.6], [-5, 2, 19, 4.4]], rootW: 4, rate: 19, scale: 1, body(c, color) {
    tailBoom(c, -8, 19, 2.4, color);
    hullBlock(c, -9, 9, 4, 4.6); wingRoot(c, 4, 4, 5.5); wingRoot(c, -5, 4, 5.5);
    for (const sy of [-1, 1]) { c.fillStyle = lg(c, 0, sy * 7.5, 0, sy * 10, '#3d404b', '#1e1c19'); rr(c, -2, sy > 0 ? 7 : -10, 10, 3, 1); c.fill(); c.fillStyle = '#c84a30'; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(7.6, (sy > 0 ? 7.6 : -9.4) + k * 0.8, 0.35, 0, 6.28); c.fill(); } }
    canopy(c, 8, 12, 9);
    seams(c, [[-1, -4.4, -1, 4.4], [-6, -4.1, -6, 4.1]]);
    c.fillStyle = color; c.fillRect(-8, -1, 5, 2);
    rivets(c, [[-3, -3.2], [-3, 3.2], [6, -3.6], [6, 3.6]], 0.3);
  } },
  // Abfangjäger: pfeilförmige Nase, kurze gepfeilte Flügel
  jaeger: { size: [56, 22], wings: [[3, 1.6, 17, 3.8, 0.15], [-5, 1.6, 15, 3.6, 0.6]], rootW: 3.4, rate: 26, scale: 0.98, body(c, color) {
    tailBoom(c, -8, 18, 2, color);
    hullBlock(c, -9, 8, 3.4, 4.2); wingRoot(c, 3, 3.4, 4.5); wingRoot(c, -5, 3.4, 4.5);
    c.fillStyle = HULL_D; c.beginPath(); c.moveTo(8, -4.2); c.lineTo(24, 0); c.lineTo(8, 4.2); c.closePath(); c.fill();
    canopy(c, 8, 13, 6.8);
    for (const sy of [-1, 1]) { c.fillStyle = '#ecebe6'; c.fillRect(-2, sy * 6.6 - 0.8, 9, 1.6); c.fillStyle = '#d24a30'; c.fillRect(6.4, sy * 6.6 - 0.8, 1.6, 1.6); }
    c.fillStyle = color; c.fillRect(-8, -0.8, 6, 1.6);
  } },
  // Bomber: Doppelrumpf mit mittiger Kanzelgondel und Bombenschacht
  bomber: { size: [60, 30], wings: [[5, 8, 20, 5], [-6, 8, 19, 4.8]], rootW: 8, rate: 13, scale: 1.12, body(c, color) {
    for (const sy of [-1, 1]) { c.save(); c.translate(0, sy * 7); tailBoom(c, -6, 20, 2.2, color, false); hullBlock(c, -8, 12, 2.8, 2.6); c.restore(); }
    c.fillStyle = HULL_D; c.fillRect(-12, -9.2, 3, 18.4);
    hullBlock(c, -8, 6, 5.5, 6); c.fillStyle = '#1e1b17'; rr(c, -6, -3.4, 10, 6.8, 1.5); c.fill(); hazard(c, -6, -3.4, 10, 1.2);
    wingRoot(c, 5, 8.6, 5); wingRoot(c, -6, 8.6, 5);
    canopy(c, 6, 11, 9.6);
    c.fillStyle = color; c.fillRect(-11.6, -6, 2.2, 12);
  } },
  // Sturmadler: schwer gepanzerter Kanonen-Thopter
  adler: { size: [62, 28], wings: [[5, 3, 22, 5.2], [-6, 3, 21, 5]], rootW: 5, rate: 15, scale: 1.12, body(c, color) {
    tailBoom(c, -9, 18, 3, color);
    hullBlock(c, -10, 10, 5, 5.8); wingRoot(c, 5, 5, 6); wingRoot(c, -6, 5, 6);
    for (const sy of [-1, 1]) { c.fillStyle = lg(c, 0, sy * 8, 0, sy * 11, '#3d404b', '#1e1c19'); rr(c, -4, sy > 0 ? 8 : -11, 12, 3, 1); c.fill(); c.fillStyle = '#d24a30'; c.fillRect(7, sy > 0 ? 8.5 : -10.5, 1.6, 2); }
    canopy(c, 9, 12, 10);
    c.strokeStyle = '#1e2024'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(20, 0); c.lineTo(27, 0); c.stroke();
    c.fillStyle = '#2a2d31'; c.beginPath(); c.arc(20, 0, 2, 0, 6.28); c.fill();
    seams(c, [[0, -5.3, 0, 5.3], [-5, -5.1, -5, 5.1]]); rivetRow(c, -8, -4.6, 8, -5.2, 7, 0.3); rivetRow(c, -8, 4.6, 8, 5.2, 7, 0.3);
    c.fillStyle = color; c.fillRect(-9, -1.4, 6, 2.8);
  } },
  // Träger: langer Rahmen mit Lastklammern, große Flügel
  traeger: { size: [62, 28], wings: [[6, 4.5, 22, 5], [-7, 4.5, 21, 5]], rootW: 4.5, rate: 13, scale: 1.12, body(c, color) {
    tailBoom(c, -11, 15, 2.6, color);
    c.fillStyle = HULL_D; c.fillRect(-12, -4.5, 24, 9);
    hullBlock(c, -12, 12, 3.6, 4.2);
    c.strokeStyle = '#2a2622'; c.lineWidth = 1.8;
    for (const x of [-8, 7]) { c.beginPath(); c.moveTo(x, -10); c.lineTo(x, 10); c.stroke(); c.fillStyle = '#d9a33a'; c.fillRect(x - 1.2, -10.5, 2.4, 2); c.fillRect(x - 1.2, 8.5, 2.4, 2); }
    wingRoot(c, 6, 4.5, 5); wingRoot(c, -7, 4.5, 5);
    hazard(c, -3, -3.6, 5, 1.4);
    canopy(c, 11, 10, 8);
    c.fillStyle = color; c.fillRect(-11, -1.2, 4, 2.4);
  } },
};

// Flügelblatt (Filmanlehnung: lang, schmal, kantig, aus Metall), wurzelt bei (0,0), zeigt nach +y*side
// f = scheinbare Länge durch den Schlag (Verkürzung), ghost = Schlieren der Bewegungsunschärfe
function angWing(c, side, len, chord, f, sweep, alpha, ghost = false) {
  const L = len * f, w = chord * 0.9;
  c.save(); c.rotate(side * sweep);
  const P = [[-w * 0.5, 0], [-w * 0.62, side * L * 0.15], [-w * 0.5, side * L * 0.96], [-w * 0.1, side * L], [w * 0.45, side * L * 0.93], [w * 0.55, side * L * 0.12], [w * 0.4, 0]];
  const path = () => { c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); };
  if (ghost) { c.fillStyle = `rgba(126,132,152,${0.16 * alpha})`; path(); c.fill(); c.restore(); return; }
  const g = c.createLinearGradient(-w, 0, w, 0);
  g.addColorStop(0, `rgba(165,172,197,${alpha})`); g.addColorStop(0.5, `rgba(126,131,151,${alpha})`); g.addColorStop(1, `rgba(76,80,93,${alpha})`);
  c.fillStyle = g; path(); c.fill();
  // Kante, Mittelholm, Segmentfugen
  c.strokeStyle = `rgba(40,38,34,${0.75 * alpha})`; c.lineWidth = 0.45; path(); c.stroke();
  c.strokeStyle = `rgba(194,202,231,${0.55 * alpha})`; c.lineWidth = 0.35; c.beginPath(); c.moveTo(-w * 0.15, side * 1.5); c.lineTo(-w * 0.15, side * L * 0.94); c.stroke();
  c.strokeStyle = `rgba(40,38,34,${0.45 * alpha})`; c.beginPath();
  for (let k = 1; k <= 3; k++) { const y = side * L * k / 4; c.moveTo(-w * 0.55, y); c.lineTo(w * 0.5, y); }
  c.stroke();
  c.restore();
}

function thopterArt(ctx, u, color, t, o, kind) {
  const def = THOPTER[kind];
  const p = part(`th2-${kind}-${color}`, def.size[0], def.size[1], (L) => L((c) => def.body(c, color), { bevel: 0.5, grime: 0.35 }));
  const z = o.z ?? 26, sc = def.scale, bank = o.bank || 0;
  // Viele kleine Flügel: je Wurzel ein Fächer aus drei schmalen Flügeln, jeder mit eigenem Takt
  const wl = wingList(def);
  const fl = (w, side) => o.landed ? 0.92 : 0.25 + 0.75 * Math.abs(Math.cos(t * def.rate * w.rate + u.id + w.off + (side > 0 ? 0.9 : 0)));
  const drawWings = (alpha) => {
    for (const side of [-1, 1]) {
      const lean = 1 - side * bank * 0.3;
      for (const w of wl) {
        const f = fl(w, side);
        // Schlieren: das Blatt an zwei früheren Schlagpositionen, sehr blass
        if (!o.landed) for (const d of [0.22, 0.44]) c2(ctx, () => { ctx.translate(w.x, side * w.y); angWing(ctx, side, w.len * lean, w.chord, Math.min(1, f + d * (f < 0.6 ? 1 : -1)), w.sw + side * d * 0.25, alpha, true); });
        c2(ctx, () => { ctx.translate(w.x, side * w.y); angWing(ctx, side, w.len * lean, w.chord, f, o.landed ? w.sw + 0.95 : w.sw, alpha); });
      }
      // Flügelnaben
      for (const [x, rootY] of def.wings) { ctx.fillStyle = '#2f313b'; ctx.beginPath(); ctx.arc(x, side * rootY, 1.4, 0, 6.28); ctx.fill(); ctx.fillStyle = '#73778a'; ctx.beginPath(); ctx.arc(x - 0.3, side * rootY - 0.3, 0.7, 0, 6.28); ctx.fill(); }
      // Bewegungsunschärfe als Fächer je Wurzel
      if (!o.landed) for (const [x, rootY, len, , sw0] of def.wings) {
        const sw = sw0 ?? 0.15;
        ctx.save(); ctx.translate(x, side * rootY); ctx.fillStyle = `rgba(142,148,170,${0.07 * alpha})`;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, len * 0.8 * lean, side > 0 ? 1.0 - sw : -2.15 + sw, side > 0 ? 2.15 - sw : -1.0 + sw); ctx.closePath(); ctx.fill(); ctx.restore();
      }
    }
  };
  // Bodenschatten
  ctx.save(); ctx.translate(z * 0.35, z * 0.45); ctx.rotate(u.facing); ctx.scale(sc, sc);
  ctx.globalAlpha *= Math.max(0.1, 0.3 - z * 0.003);
  ctx.drawImage(p.sh, -p.w / 2, -p.h / 2, p.w, p.h);
  ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  const sa = ctx.globalAlpha; ctx.globalAlpha = sa * 0.6; drawWingsShadow(ctx, wl, fl); ctx.globalAlpha = sa;
  ctx.restore();
  // Maschine
  ctx.save(); ctx.translate(0, -z); ctx.rotate(u.facing); ctx.scale(sc, sc);
  if (bank) ctx.scale(1, 1 - Math.abs(bank) * 0.22);
  if (kind === 'traeger' && o.carry) { ctx.save(); ctx.translate(0, 0); ctx.scale(0.62, 0.62); ctx.rotate(-u.facing); o.carry(); ctx.restore(); }
  drawPartShadow(ctx, p, 1.2, 1.6, 0.25);
  drawPart(ctx, p);
  if (kind === 'falke' || kind === 'bomber' || kind === 'adler') {
    const ammo = u.ammo ?? 3, max = kind === 'bomber' ? 2 : 3;
    for (let k = 0; k < max; k++) { ctx.fillStyle = k < ammo ? '#ffb070' : '#3a3a3a'; ctx.fillRect(-4 + k * 2.4, -0.7, 1.4, 1.4); }
  }
  drawWings(0.95);
  ctx.restore();
}
function c2(ctx, fn) { ctx.save(); fn(); ctx.restore(); }
const WL = new Map();
function wingList(def) {
  if (WL.has(def)) return WL.get(def);
  const out = [];
  def.wings.forEach(([x, rootY, len, chord, sw0], si) => {
    const base = sw0 ?? (si ? 0.42 : -0.1);
    [[-0.9, -0.14, 1.0], [0.9, 0.14, 0.95]].forEach(([dx, da, lf], j) => {
      out.push({ x: x + dx, y: rootY, len: len * lf, chord: chord * 0.8, sw: base + da, rate: 1 + 0.13 * j + 0.07 * si, off: si * 1.3 + j * 2.1 });
    });
  });
  WL.set(def, out);
  return out;
}
function drawWingsShadow(ctx, wl, fl) {
  ctx.fillStyle = '#000';
  for (const side of [-1, 1]) for (const w of wl) {
    const L = w.len * fl(w, side);
    ctx.save(); ctx.translate(w.x, side * w.y); ctx.rotate(side * w.sw);
    ctx.beginPath(); ctx.moveTo(-w.chord * 0.4, 0); ctx.lineTo(-w.chord * 0.5, side * L); ctx.lineTo(w.chord * 0.35, side * L * 0.9); ctx.lineTo(w.chord * 0.4, 0); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}


// ---------- Schweber (AVs): kantige Rümpfe, Mantelpropeller statt Flügel ----------
function nacelle(c, x, y, r) {
  c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(x + 0.6, y + 0.8, r + 1.2, 0, 6.28); c.fill();
  c.fillStyle = lg(c, x - r, y - r, x + r, y + r, '#8a92a8', '#262a34'); c.beginPath(); c.arc(x, y, r + 1.1, 0, 6.28); c.fill();
  c.fillStyle = '#0d0f14'; c.beginPath(); c.arc(x, y, r * 0.86, 0, 6.28); c.fill();
  c.strokeStyle = 'rgba(220,230,255,0.35)'; c.lineWidth = 0.35; c.beginPath(); c.arc(x, y, r + 0.7, 3.4, 5.2); c.stroke();
}
function strut(c, x0, y0, x1, y1, w) { c.strokeStyle = HULL_D; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); c.strokeStyle = 'rgba(200,210,235,0.35)'; c.lineWidth = w * 0.3; c.beginPath(); c.moveTo(x0, y0 - w * 0.25); c.lineTo(x1, y1 - w * 0.25); c.stroke(); }
function navStripe(c, x0, x1, y, color) { c.fillStyle = color; c.fillRect(x0, y - 0.45, x1 - x0, 0.9); }

const AV = {
  // Spähdrohne: X-Rahmen, vier Rotoren, Sensorauge
  libelle: { size: [40, 40], scale: 0.85, fans: [[8, -8, 4.6], [8, 8, 4.6], [-8, -8, 4.6], [-8, 8, 4.6]], glow: '90,230,255', body(c, color) {
    for (const [x, y] of [[8, -8], [8, 8], [-8, -8], [-8, 8]]) strut(c, 0, 0, x, y, 2.4);
    for (const [x, y] of [[8, -8], [8, 8], [-8, -8], [-8, 8]]) nacelle(c, x, y, 4.6);
    hullBlock(c, -6, 6, 3.6, 3.2);
    c.fillStyle = '#14161c'; c.beginPath(); c.arc(5, 0, 2.6, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(255,70,90,0.95)'; c.beginPath(); c.arc(5.6, 0, 1.2, 0, 6.28); c.fill();
    c.fillStyle = color; c.fillRect(-5, -0.8, 5, 1.6);
  } },
  // Kampf-Schweber: schlanker Rumpf, vier Mantelpropeller an Stummelflügeln, Raketenbehälter
  falke: { size: [58, 40], scale: 1, fans: [[7, -12, 5], [7, 12, 5], [-9, -12, 5], [-9, 12, 5]], glow: '90,230,255', body(c, color) {
    for (const x of [7, -9]) for (const sy of [-1, 1]) strut(c, x, sy * 3.5, x, sy * 12, 3);
    for (const [x, y] of [[7, -12], [7, 12], [-9, -12], [-9, 12]]) nacelle(c, x, y, 5);
    hullBlock(c, -16, 10, 3.6, 4.6);
    c.fillStyle = HULL_D; c.beginPath(); c.moveTo(-16, -3); c.lineTo(-21, -5); c.lineTo(-21, 5); c.lineTo(-16, 3); c.closePath(); c.fill();
    for (const sy of [-1, 1]) { c.fillStyle = lg(c, 0, sy * 5.5, 0, sy * 8, '#4a4e5a', '#1a1c22'); rr(c, -3, sy > 0 ? 5 : -7.8, 9, 2.8, 1); c.fill(); c.fillStyle = '#ff4a60'; for (let k = 0; k < 3; k++) c.fillRect(5.2, (sy > 0 ? 5.4 : -7.4) + k * 0.7, 0.8, 0.5); }
    canopy(c, 8, 11, 8);
    navStripe(c, -15, -4, -2.4, color); navStripe(c, -15, -4, 2.4, color);
    seams(c, [[-1, -4.2, -1, 4.2], [-8, -3.9, -8, 3.9]]);
    rivets(c, [[-4, -3], [-4, 3], [5, -3.6], [5, 3.6]], 0.3);
  } },
  // Abfang-Schweber: Pfeilform, zwei große Heckturbinen, zwei kleine vorn
  jaeger: { size: [58, 40], scale: 0.98, fans: [[-11, -11, 6], [-11, 11, 6], [8, -7.5, 3.4], [8, 7.5, 3.4]], glow: '255,90,200', body(c, color) {
    c.fillStyle = HULL_D; c.beginPath(); c.moveTo(14, -3); c.lineTo(-6, -15); c.lineTo(-14, -15); c.lineTo(-10, -3); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(14, 3); c.lineTo(-6, 15); c.lineTo(-14, 15); c.lineTo(-10, 3); c.closePath(); c.fill();
    for (const [x, y, r] of [[-11, -11, 6], [-11, 11, 6], [8, -7.5, 3.4], [8, 7.5, 3.4]]) nacelle(c, x, y, r);
    hullBlock(c, -16, 10, 3, 4);
    c.fillStyle = HULL_M; c.beginPath(); c.moveTo(10, -4); c.lineTo(25, 0); c.lineTo(10, 4); c.closePath(); c.fill();
    canopy(c, 9, 12, 6.4);
    for (const sy of [-1, 1]) { c.fillStyle = '#e8eaf0'; c.fillRect(-4, sy * 5.6 - 0.7, 8, 1.4); c.fillStyle = '#ff4a60'; c.fillRect(3.4, sy * 5.6 - 0.7, 1.4, 1.4); }
    navStripe(c, -15, -2, 0, color);
  } },
  // Bomber: breiter Nurflügler mit Bombenschacht und vier Turbinen
  bomber: { size: [60, 48], scale: 1.1, fans: [[4, -15, 5.4], [4, 15, 5.4], [-10, -15, 5.4], [-10, 15, 5.4]], glow: '255,170,60', body(c, color) {
    c.fillStyle = HULL_D; c.beginPath(); c.moveTo(12, -5); c.lineTo(6, -20); c.lineTo(-15, -20); c.lineTo(-17, -5); c.lineTo(-17, 5); c.lineTo(-15, 20); c.lineTo(6, 20); c.lineTo(12, 5); c.closePath(); c.fill();
    c.fillStyle = lg(c, 0, -20, 0, 20, HULL_M, '#3a3e4a'); c.beginPath(); c.moveTo(10, -5); c.lineTo(5, -18); c.lineTo(-14, -18); c.lineTo(-15, -5); c.closePath(); c.fill();
    for (const [x, y] of [[4, -15], [4, 15], [-10, -15], [-10, 15]]) nacelle(c, x, y, 5.4);
    hullBlock(c, -14, 9, 5.5, 5.8); c.fillStyle = '#121418'; rr(c, -10, -3.4, 11, 6.8, 1.5); c.fill(); hazard(c, -10, -3.4, 11, 1.2);
    canopy(c, 7, 9, 9);
    navStripe(c, -16, -12, -6, color); navStripe(c, -16, -12, 6, color);
  } },
  // Raiden-Gunship: schwer, sechs Turbinen, Kinnkanone
  adler: { size: [64, 46], scale: 1.12, fans: [[10, -13, 4.6], [10, 13, 4.6], [-2, -16, 5.4], [-2, 16, 5.4], [-14, -13, 4.6], [-14, 13, 4.6]], glow: '255,70,90', body(c, color) {
    for (const [x, y] of [[10, -13], [-2, -16], [-14, -13]]) { strut(c, x, -4, x, y, 3.2); strut(c, x, 4, x, -y, 3.2); }
    for (const [x, y, r] of [[10, -13, 4.6], [10, 13, 4.6], [-2, -16, 5.4], [-2, 16, 5.4], [-14, -13, 4.6], [-14, 13, 4.6]]) nacelle(c, x, y, r);
    hullBlock(c, -19, 12, 5, 6);
    for (const sy of [-1, 1]) { c.fillStyle = lg(c, 0, sy * 6, 0, sy * 9, '#4a4e5a', '#1a1c22'); rr(c, -8, sy > 0 ? 6 : -9, 12, 3, 1); c.fill(); }
    canopy(c, 11, 11, 9.5);
    c.strokeStyle = '#16181d'; c.lineWidth = 1.8; c.beginPath(); c.moveTo(21, 0); c.lineTo(29, 0); c.stroke();
    c.fillStyle = '#262a31'; c.beginPath(); c.arc(21, 0, 2.4, 0, 6.28); c.fill();
    seams(c, [[2, -5.6, 2, 5.6], [-7, -5.3, -7, 5.3]]); rivetRow(c, -16, -4.6, 9, -5.4, 8, 0.3); rivetRow(c, -16, 4.6, 9, 5.4, 8, 0.3);
    c.fillStyle = color; c.fillRect(-17, -1.6, 7, 3.2);
    c.fillStyle = '#ff3b5c'; c.fillRect(-12, -5.2, 1.2, 10.4);
  } },
  // Träger: langer Rahmen mit Lastklammern, vier große Turbinen
  traeger: { size: [64, 48], scale: 1.12, fans: [[10, -15, 6], [10, 15, 6], [-12, -15, 6], [-12, 15, 6]], glow: '90,230,255', body(c, color) {
    for (const x of [10, -12]) for (const sy of [-1, 1]) strut(c, x, sy * 4, x, sy * 15, 3.4);
    for (const [x, y] of [[10, -15], [10, 15], [-12, -15], [-12, 15]]) nacelle(c, x, y, 6);
    c.fillStyle = HULL_D; c.fillRect(-15, -4.5, 26, 9);
    hullBlock(c, -16, 13, 3.6, 4.2);
    c.strokeStyle = '#22252c'; c.lineWidth = 1.8;
    for (const x of [-6, 3]) { c.beginPath(); c.moveTo(x, -9); c.lineTo(x, 9); c.stroke(); c.fillStyle = '#e8b830'; c.fillRect(x - 1.2, -9.5, 2.4, 2); c.fillRect(x - 1.2, 7.5, 2.4, 2); }
    hazard(c, -3, -3.6, 5, 1.4);
    canopy(c, 12, 9, 8);
    c.fillStyle = color; c.fillRect(-15, -1.2, 4, 2.4);
  } },
  // Trauma Team: weißer Panzerschweber, blaue Streifen, rotes Kreuz, Bordschütze
  trauma: { size: [62, 46], scale: 1.1, fans: [[9, -15, 5.6], [9, 15, 5.6], [-12, -15, 5.6], [-12, 15, 5.6]], glow: '120,200,255', body(c, color) {
    for (const x of [9, -12]) for (const sy of [-1, 1]) strut(c, x, sy * 5, x, sy * 15, 3.2);
    for (const [x, y] of [[9, -15], [9, 15], [-12, -15], [-12, 15]]) nacelle(c, x, y, 5.6);
    hullBlock(c, -19, 12, 6, 6.6, '#f2f4f8', '#7a8090');
    c.fillStyle = '#e6e9f0'; c.beginPath(); c.moveTo(12, -6); c.lineTo(18, -3); c.lineTo(18, 3); c.lineTo(12, 6); c.closePath(); c.fill();
    for (const sy of [-1, 1]) { c.fillStyle = '#1e7ae0'; c.fillRect(-18, sy * 4.6 - 0.8, 28, 1.6); }
    c.fillStyle = '#d42a3a'; c.fillRect(-9, -1, 8, 2); c.fillRect(-6, -4, 2, 8);
    c.fillStyle = '#fff'; c.fillRect(-8.2, -0.4, 6.4, 0.8); c.fillRect(-5.4, -3.2, 0.8, 6.4);
    canopy(c, 11, 8, 9);
    // Bordschütze an der offenen Seitentür
    c.fillStyle = '#20232a'; c.fillRect(-2, 6, 6, 2.2); c.strokeStyle = '#111'; c.lineWidth = 1.1; c.beginPath(); c.moveTo(1, 7.4); c.lineTo(7, 9); c.stroke();
    c.fillStyle = color; c.fillRect(-18, -1.2, 3, 2.4);
  } },
};

function avArt(ctx, u, color, t, o, kind) {
  const def = AV[kind];
  const p = part(`av-${kind}-${color}`, def.size[0], def.size[1], (L) => L((c) => def.body(c, color), { bevel: 0.5, grime: 0.3 }));
  const z = o.z ?? 26, sc = def.scale, bank = o.bank || 0;
  // Bodenschatten mit Lichtkegel der Turbinen
  ctx.save(); ctx.translate(z * 0.35, z * 0.45); ctx.rotate(u.facing); ctx.scale(sc, sc);
  ctx.globalAlpha *= Math.max(0.1, 0.32 - z * 0.003);
  ctx.drawImage(p.sh, -p.w / 2, -p.h / 2, p.w, p.h);
  ctx.restore();
  if (!o.landed) {
    ctx.save(); ctx.translate(z * 0.2, z * 0.3); ctx.rotate(u.facing); ctx.scale(sc, sc); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y, r] of def.fans) { const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3); g.addColorStop(0, `rgba(${def.glow},0.16)`); g.addColorStop(1, `rgba(${def.glow},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r * 3, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  // Maschine
  ctx.save(); ctx.translate(0, -z); ctx.rotate(u.facing); ctx.scale(sc, sc);
  if (bank) ctx.scale(1, 1 - Math.abs(bank) * 0.2);
  if (kind === 'traeger' && o.carry) { ctx.save(); ctx.scale(0.62, 0.62); ctx.rotate(-u.facing); o.carry(); ctx.restore(); }
  drawPartShadow(ctx, p, 1.2, 1.6, 0.25);
  drawPart(ctx, p);
  // Rotoren: Blätter mit Bewegungsunschärfe
  const spin = o.landed ? t * 1.5 : t * 38;
  for (const [x, y, r] of def.fans) {
    ctx.save(); ctx.translate(x, y);
    if (!o.landed) { ctx.fillStyle = 'rgba(170,180,200,0.16)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, 6.28); ctx.fill(); }
    ctx.rotate(spin + x * 0.3 + y);
    ctx.strokeStyle = o.landed ? 'rgba(150,158,176,0.9)' : 'rgba(190,198,220,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); for (let k = 0; k < 3; k++) { const a = k * 2.094; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); } ctx.stroke();
    ctx.fillStyle = '#4a505e'; ctx.beginPath(); ctx.arc(0, 0, r * 0.25, 0, 6.28); ctx.fill();
    ctx.restore();
    if (!o.landed) { ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${def.glow},0.35)`); g.addColorStop(1, `rgba(${def.glow},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
  }
  if (kind === 'falke' || kind === 'bomber' || kind === 'adler') {
    const ammo = u.ammo ?? 3, max = kind === 'bomber' ? 2 : 3;
    for (let k = 0; k < max; k++) { ctx.fillStyle = k < ammo ? '#5ff0ff' : '#3a3a3a'; ctx.fillRect(-4 + k * 2.4, -0.7, 1.4, 1.4); }
  }
  // Positionslichter, beim Trauma Team das Blaulicht
  ctx.globalCompositeOperation = 'lighter';
  const half = def.size[0] / 2 - 4, blink = Math.floor(t * 2.5 + u.id) % 2;
  if (kind === 'trauma') {
    const ph = Math.floor(t * 6) % 2;
    for (const [x, col] of [[2, ph ? '60,140,255' : '255,40,60'], [-6, ph ? '255,40,60' : '60,140,255']]) { const g = ctx.createRadialGradient(x, 0, 0, x, 0, 9); g.addColorStop(0, `rgba(${col},0.9)`); g.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, 0, 9, 0, 6.28); ctx.fill(); }
  }
  ctx.fillStyle = blink ? 'rgba(255,60,70,0.95)' : 'rgba(255,60,70,0.25)'; ctx.beginPath(); ctx.arc(-half, -2, 1.1, 0, 6.28); ctx.fill();
  ctx.fillStyle = blink ? 'rgba(60,255,140,0.25)' : 'rgba(60,255,140,0.95)'; ctx.beginPath(); ctx.arc(-half, 2, 1.1, 0, 6.28); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  ctx.restore();
}

// ---------- Zeichenfunktionen (Signatur wie DRAW in sprites.js) ----------
function hullWithTurret(ctx, u, color, t, o, hull, turret, tr, turretOffset = 0) {
  ctx.rotate(u.facing);
  drawPartShadow(ctx, hull, 4, 5, 0.38);
  drawPart(ctx, hull);
  if (tr) for (const [x, y, w, h] of tr) treadAnim(ctx, x, y, w, h, t, o.moving);
  if (turret) {
    ctx.save(); ctx.translate(turretOffset, 0); ctx.rotate(o.turret ?? 0); ctx.translate(-(o.recoil || 0) * 3.5, 0);
    drawPartShadow(ctx, turret, 1.5, 2, 0.35);
    drawPart(ctx, turret);
    ctx.restore();
  }
}

export const VDRAW = {
  panzer(ctx, u, color, t, o) {
    hullWithTurret(ctx, u, color, t, o, panzerHull(color), panzerTurret(color), [[-17, -13, 34, 0.9], [-17, 12.1, 34, 0.9]]);
    ctx.rotate(o.turret ?? 0); ctx.strokeStyle = 'rgba(22,23,30,0.85)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-6, 5); ctx.quadraticCurveTo(-12, 7 + Math.sin(t * 3) * 1.5, -17, 6); ctx.stroke();
  },
  werfer(ctx, u, color, t, o) { hullWithTurret(ctx, u, color, t, o, werferHull(color), werferTurret(color), [[-16, -12, 32, 0.9], [-16, 11.1, 32, 0.9]], -2); },
  laserpanzer(ctx, u, color, t, o) {
    hullWithTurret(ctx, u, color, t, o, laserHull(color), laserTurret(color), [[-17, -12, 34, 0.8], [-17, 11.2, 34, 0.8]]);
    ctx.rotate(o.turret ?? 0);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(110,180,255,${0.35 + 0.3 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(23, 0, 3.6, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  },
  koloss(ctx, u, color, t, o) { ctx.scale(1.08, 1.08); hullWithTurret(ctx, u, color, t, o, kolossHull(color), kolossTurret(color), [[-18.5, -15.5, 16, 0.9], [2, -15.5, 16, 0.9], [-18.5, 14.1, 16, 0.9], [2, 14.1, 16, 0.9]]); },
  brenner(ctx, u, color, t, o) {
    hullWithTurret(ctx, u, color, t, o, brennerHull(color), null, [[-17, -13, 34, 0.9], [-17, 12.1, 34, 0.9]]);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,140,40,${0.5 + 0.4 * Math.sin(t * 14)})`; ctx.beginPath(); ctx.arc(21, 0, 2.2, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  },
  flakwagen(ctx, u, color, t, o) { hullWithTurret(ctx, u, color, t, o, flakHull(color), flakTurret(color), null, -3); },
  trike(ctx, u, color, t, o) {
    ctx.rotate(u.facing); const p = trikeBody(color);
    drawPartShadow(ctx, p, 3, 4, 0.35); drawPart(ctx, p);
    if (o.moving) { ctx.strokeStyle = 'rgba(150,156,180,0.5)'; ctx.lineWidth = 1; for (const yy of [-8, 8]) { ctx.beginPath(); ctx.moveTo(-11, yy); ctx.lineTo(-17 - Math.random() * 4, yy + (Math.random() - 0.5) * 2); ctx.stroke(); } }
  },
  ernter(ctx, u, color, t, o) {
    ctx.rotate(u.facing); const p = ernterBody(color);
    drawPartShadow(ctx, p, 4, 6, 0.38); drawPart(ctx, p);
    treadAnim(ctx, -19, -14.5, 34, 0.9, t, o.moving); treadAnim(ctx, -19, 13.6, 34, 0.9, t, o.moving);
    const fill = (u.cargo || 0) / (u.def.capacity || 1);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,${110 + 50 * fill},40,${0.15 + fill * 0.6})`; rr(ctx, -15, 6.5 - 13 * fill, 12, 13 * fill, 2); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#8d93a9'; ctx.lineWidth = 1.2;
    const sp = o.harvesting ? t * 40 : 0;
    for (let k = 0; k < 7; k++) { const yy = -12 + ((k * 3.6 + sp) % 24); ctx.beginPath(); ctx.moveTo(13.5, yy); ctx.lineTo(18.5, yy + 1.8); ctx.stroke(); }
  },
  libelle(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'libelle'); },
  falke(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'falke'); },
  bomber(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'bomber'); },
  jaeger(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'jaeger'); },
  traeger(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'traeger'); },
  adler(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'adler'); },
  trauma(ctx, u, color, t, o) { avArt(ctx, u, color, t, o, 'trauma'); },
};
