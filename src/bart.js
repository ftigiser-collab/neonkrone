// Detaillierte Gebäude: statische Ebene (vorgerendert) + animierte Teile
import { part, drawPart, drawPartShadow, rr, lg, rg, box, rivets, rivetRow, vents, seams, hazard, pipe, windows, dome, hexPath, emblem } from './art.js';
import { shade } from './util.js';

const CON = ['#c8b799', '#9c8b70', '#6f604c'];   // Beton/Sandstein hell, mittel, dunkel
const MET = ['#a6a29a', '#77736b', '#4a4741'];   // Metall
const DARK = '#2a231c';

function foundation(L, color) {
  L((c) => {
    c.fillStyle = lg(c, -34, -34, 34, 34, '#a8977c', '#6a5b47'); hexPath(c, 0, 0, 34); c.fill();
  }, { bevel: 1.2, grime: 0.6, dust: 0.25 });
  L((c) => {
    c.fillStyle = lg(c, -28, -28, 28, 28, '#b5a488', '#7d6d56'); hexPath(c, 0, 0, 29.5); c.fill();
    seams(c, [[-29, 0, 29, 0], [-15, -26, 15, 26], [15, -26, -15, 26]], 'rgba(30,22,15,0.35)', 0.5);
    for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); rivets(c, [[Math.cos(a) * 26, Math.sin(a) * 26]], 0.9); }
    c.strokeStyle = color; c.globalAlpha = 0.65; c.lineWidth = 1.2; c.setLineDash([3, 2.4]); hexPath(c, 0, 0, 31.8); c.stroke(); c.setLineDash([]); c.globalAlpha = 1;
  }, { bevel: 0.7, grime: 0.5, dust: 0.2 });
}

// Quader mit Seitenwand (Pseudo-Höhe) — als eigene Ebene für Kanten
function block(L, x, y, w, h, hgt, top, side, extra, o = {}) {
  L((c) => {
    c.fillStyle = 'rgba(0,0,0,0.35)'; rr(c, x + hgt * 0.8, y + hgt * 0.7, w, h, 1.5); c.fill();
    c.fillStyle = side; rr(c, x, y + hgt * 0.5, w, h, 1.5); c.fill();
    c.fillStyle = typeof top === 'function' ? top(c) : top; rr(c, x, y, w, h, 1.5); c.fill();
    if (extra) extra(c);
  }, { bevel: 0.8, grime: 0.55, ...o });
}
const topG = (x, y, w, h, a = CON[0], b = CON[1]) => (c) => lg(c, x, y, x + w * 0.3, y + h, a, b);

const STAT = {
  bauhof(L, color) {
    foundation(L, color);
    block(L, -23, -16, 46, 32, 7, topG(-23, -16, 46, 32), CON[2], (c) => {
      seams(c, [[-23, -4, 23, -4], [-8, -16, -8, 16], [8, -16, 8, 16]]);
      vents(c, -20, -13, 9, 6, 5); vents(c, 11, -13, 9, 6, 5);
      hazard(c, -11, 10, 22, 4);
      box(c, -10, 2, 20, 8, DARK, 1); windows(c, -9, 3.2, 18, 2.2, 6);
      c.fillStyle = color; c.fillRect(-23, 13, 46, 2.2);
      rivetRow(c, -21, 15, 21, 15, 12, 0.45);
    });
    block(L, -12, -24, 24, 14, 5, topG(-12, -24, 24, 14, '#d6c6a8', CON[1]), CON[2], (c) => {
      windows(c, -10, -20, 20, 2.4, 5, 'rgba(150,215,255,0.85)');
      vents(c, -9, -15.5, 6, 3.4, 3, true); vents(c, 3, -15.5, 6, 3.4, 3, true);
      emblem(c, 0, -14, 3, color);
    });
    L((c) => { c.fillStyle = lg(c, 10, -20, 18, -10, MET[0], MET[2]); c.beginPath(); c.arc(14, -15, 4.6, 0, 6.28); c.fill(); rivets(c, [[14, -15]], 1.2); }, { bevel: 0.6 });
    L((c) => { pipe(c, [[-23, 4], [-28, 4], [-28, 12]], 2.2); pipe(c, [[23, -2], [27, -2], [27, 8]], 1.8); }, { flat: true });
  },
  windfalle(L, color) {
    foundation(L, color);
    for (const x of [-14, 14]) L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(x + 3, 13, 8.5, 0, 6.28); c.fill();
      dome(c, x, 10, 8.5, '#d7d0c4', '#5e5850');
      c.fillStyle = 'rgba(110,190,255,0.85)'; c.fillRect(x - 2.5, 16, 5, 1.4);
    }, { bevel: 0.6 });
    L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.arc(4, 1, 15.5, 0, 6.28); c.fill();
      c.fillStyle = rg(c, -5, -9, 2, 16, '#e0d8cc', '#5c564e'); c.beginPath(); c.arc(0, -4, 15, 0, 6.28); c.fill();
      c.strokeStyle = 'rgba(30,22,15,0.45)'; c.lineWidth = 0.5; for (let r = 11.5; r < 15; r += 1.6) { c.beginPath(); c.arc(0, -4, r, 0, 6.28); c.stroke(); }
      c.fillStyle = '#1d1915'; c.beginPath(); c.arc(0, -4, 10.5, 0, 6.28); c.fill();
      c.strokeStyle = 'rgba(120,110,95,0.6)'; c.lineWidth = 0.4; for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; c.beginPath(); c.moveTo(Math.cos(a) * 3, -4 + Math.sin(a) * 3); c.lineTo(Math.cos(a) * 10.5, -4 + Math.sin(a) * 10.5); c.stroke(); }
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; rivets(c, [[Math.cos(a) * 13.2, -4 + Math.sin(a) * 13.2]], 0.55); }
    }, { bevel: 0.8 });
    L((c) => { pipe(c, [[-14, 3], [-8, -2]], 2); pipe(c, [[14, 3], [8, -2]], 2); pipe(c, [[-20, 18], [20, 18]], 1.4, '#6e8796'); }, { flat: true });
  },
  raffinerie(L, color) {
    foundation(L, color);
    block(L, -26, -10, 30, 26, 7, topG(-26, -10, 30, 26), CON[2], (c) => {
      for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#a8977a' : '#b9a88b'; c.fillRect(-25, -9 + k * 4.6, 28, 4.6); }
      seams(c, [[-25, -9, 3, -9]]);
      box(c, -22, 4, 14, 9, DARK, 1); c.fillStyle = 'rgba(255,150,60,0.55)'; c.fillRect(-21, 5, 12, 7);
      vents(c, -6, 5, 8, 7, 4, true);
      c.fillStyle = color; c.fillRect(-26, -10, 3, 26);
    });
    for (const [x, y, r] of [[14, -11, 10.5], [15, 12, 8.5]]) L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.arc(x + 3.5, y + 4, r, 0, 6.28); c.fill();
      dome(c, x, y, r, '#c4c0b8', '#4e4a44');
      c.fillStyle = '#2a1a10'; c.beginPath(); c.arc(x, y, r * 0.45, 0, 6.28); c.fill();
      rivetRow(c, x - r * 0.8, y + r * 0.3, x + r * 0.8, y + r * 0.3, 6, 0.45);
    }, { bevel: 0.8 });
    L((c) => { pipe(c, [[4, -4], [10, -6]], 3.2); pipe(c, [[4, 8], [9, 10]], 2.6); pipe(c, [[-26, -6], [-30, -6], [-30, 14]], 1.6); hazard(c, -24, 18, 26, 3); box(c, -22, 18.5, 26, 2.2, '#2b241d', 0.3); }, { flat: true });
  },
  kaserne(L, color) {
    foundation(L, color);
    block(L, -21, -15, 42, 29, 6, topG(-21, -15, 42, 29, '#b2a283', '#7c6c55'), CON[2], (c) => {
      for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? 'rgba(60,45,30,0.25)' : 'rgba(255,240,210,0.12)'; c.fillRect(-21, -15 + k * 3.6, 42, 1.8); }
      box(c, -5, 9, 10, 5, DARK, 0.6); vents(c, -18, -12, 7, 4, 3); vents(c, 11, -12, 7, 4, 3);
      c.fillStyle = color; c.fillRect(-21, 4, 42, 1.6);
    });
    L((c) => { for (let k = 0; k < 9; k++) { c.fillStyle = k % 2 ? '#a08a64' : '#8c7756'; c.beginPath(); c.ellipse(-24 + k * 2.6, 20, 2, 1.4, 0, 0, 6.28); c.fill(); } for (let k = 0; k < 9; k++) { c.fillStyle = k % 2 ? '#8c7756' : '#a08a64'; c.beginPath(); c.ellipse(6 + k * 2.6, 20, 2, 1.4, 0, 0, 6.28); c.fill(); } }, { bevel: 0.4, grime: 0.4 });
    L((c) => { box(c, 22, -6, 6, 6, '#7b6a4f', 0.6); box(c, 23, 2, 5, 5, '#6b5b43', 0.6); seams(c, [[22, -3, 28, -3], [25, -6, 25, 0]]); }, { bevel: 0.5 });
  },
  fabrik(L, color) {
    foundation(L, color);
    block(L, -27, -21, 54, 39, 8, topG(-27, -21, 54, 39, '#b8ab94', '#7b6e5a'), CON[2], (c) => {
      for (let k = 0; k < 6; k++) { c.fillStyle = lg(c, -26 + k * 8.8, -20, -20 + k * 8.8, -20, '#8e826e', '#c9bda6'); c.fillRect(-26 + k * 8.8, -20, 6.8, 21); c.fillStyle = 'rgba(150,200,230,0.55)'; c.fillRect(-25 + k * 8.8, -19, 2, 19); }
      box(c, -15, 5, 30, 12, DARK, 1);
      c.fillStyle = color; c.fillRect(-27, 1.5, 54, 2.4);
      rivetRow(c, -25, 3, 25, 3, 16, 0.4);
      hazard(c, -15, 16.5, 30, 2.4);
    });
    L((c) => { c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(22, -13, 5.5, 0, 6.28); c.fill(); c.fillStyle = rg(c, 18, -18, 1, 6, MET[0], MET[2]); c.beginPath(); c.arc(19, -16, 5, 0, 6.28); c.fill(); c.fillStyle = '#1a1612'; c.beginPath(); c.arc(19, -16, 3, 0, 6.28); c.fill(); }, { bevel: 0.6 });
    L((c) => { pipe(c, [[-27, -8], [-31, -8], [-31, 10]], 2); }, { flat: true });
  },
  ausguck(L, color) {
    foundation(L, color);
    block(L, -15, -11, 30, 25, 7, topG(-15, -11, 30, 25, '#c4b597', CON[1]), CON[2], (c) => {
      windows(c, -13, 7, 26, 2.4, 6, 'rgba(150,215,255,0.85)');
      vents(c, -12, -8, 6, 4, 3); c.fillStyle = color; c.fillRect(-15, 11, 30, 2.2);
      rivets(c, [[-13, -9], [13, -9], [-13, 9], [13, 9]], 0.7);
    });
    L((c) => { c.fillStyle = lg(c, -4, -10, 4, -2, MET[0], MET[2]); c.beginPath(); c.arc(0, -5, 4.5, 0, 6.28); c.fill(); rivets(c, [[0, -5]], 1.1); }, { bevel: 0.5 });
    L((c) => { c.strokeStyle = '#3a342c'; c.lineWidth = 0.9; c.beginPath(); c.moveTo(11, 4); c.lineTo(11, -20); c.stroke(); c.lineWidth = 0.5; for (let y = 2; y > -20; y -= 4) { c.beginPath(); c.moveTo(9.5, y); c.lineTo(12.5, y - 2); c.stroke(); } }, { flat: true });
  },
  horst(L, color) {
    foundation(L, color);
    L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(3, 4, 25, 0, 6.28); c.fill();
      c.fillStyle = rg(c, -8, -8, 2, 26, '#8f8a80', '#4d4943'); c.beginPath(); c.arc(0, 0, 25, 0, 6.28); c.fill();
      c.strokeStyle = 'rgba(240,210,120,0.9)'; c.lineWidth = 1.6; c.beginPath(); c.arc(0, 0, 19, 0, 6.28); c.stroke();
      c.setLineDash([2, 2]); c.lineWidth = 0.8; c.beginPath(); c.arc(0, 0, 22.5, 0, 6.28); c.stroke(); c.setLineDash([]);
      seams(c, [[-25, 0, 25, 0], [0, -25, 0, 25]], 'rgba(20,15,10,0.3)');
      c.fillStyle = color; for (let k = 0; k < 3; k++) { c.save(); c.rotate(k * Math.PI * 2 / 3 + 0.3); c.beginPath(); c.moveTo(11, 0); c.lineTo(4, -4.5); c.lineTo(4, 4.5); c.closePath(); c.fill(); c.restore(); }
    }, { bevel: 0.8 });
    block(L, 14, -28, 13, 12, 5, topG(14, -28, 13, 12, '#c9b99c', CON[1]), CON[2], (c) => { windows(c, 15.5, -26, 10, 2.6, 3, 'rgba(150,215,255,0.9)'); });
    L((c) => { for (const [x, y] of [[-24, 16], [-19, 21]]) { c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.arc(x + 1.5, y + 1.5, 3.4, 0, 6.28); c.fill(); c.fillStyle = rg(c, x - 1, y - 1, 0.5, 3.6, '#e0c060', '#7a6020'); c.beginPath(); c.arc(x, y, 3.2, 0, 6.28); c.fill(); } }, { bevel: 0.4 });
  },
  kontor(L, color) {
    foundation(L, color);
    L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.39; c.lineTo(4 + Math.cos(a) * 22, 5 + Math.sin(a) * 22); } c.closePath(); c.fill();
      c.fillStyle = lg(c, -20, -20, 20, 20, '#a49cb0', '#4f4858'); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.39; c.lineTo(Math.cos(a) * 22, Math.sin(a) * 22); } c.closePath(); c.fill();
      c.strokeStyle = '#d4a63a'; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 15, 0, 6.28); c.stroke();
      c.lineWidth = 0.5; c.beginPath(); c.arc(0, 0, 12, 0, 6.28); c.stroke();
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; c.fillStyle = '#f2d27a'; c.beginPath(); c.arc(Math.cos(a) * 15, Math.sin(a) * 15, 0.9, 0, 6.28); c.fill(); }
      c.fillStyle = '#2a2530'; c.beginPath(); c.arc(0, 0, 6, 0, 6.28); c.fill();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.39; rivets(c, [[Math.cos(a) * 19.5, Math.sin(a) * 19.5]], 0.6); }
      c.fillStyle = color; c.fillRect(-3, 18, 6, 4);
    }, { bevel: 0.9 });
  },
  konvent(L, color) {
    foundation(L, color);
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + 0.52; block(L, Math.cos(a) * 20 - 3, Math.sin(a) * 20 - 3, 6, 6, 4, '#7e7288', '#3b3443'); }
    L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.38)'; c.beginPath(); c.arc(4, 5, 17, 0, 6.28); c.fill();
      c.fillStyle = rg(c, -6, -7, 2, 17, '#c3b4d0', '#3a2f46'); c.beginPath(); c.arc(0, 0, 17, 0, 6.28); c.fill();
      c.strokeStyle = 'rgba(30,20,40,0.55)'; c.lineWidth = 0.6; for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; c.beginPath(); c.moveTo(Math.cos(a) * 5, Math.sin(a) * 5); c.lineTo(Math.cos(a) * 17, Math.sin(a) * 17); c.stroke(); }
      for (const r of [9, 13]) { c.beginPath(); c.arc(0, 0, r, 0, 6.28); c.stroke(); }
      c.strokeStyle = color; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, 18, 0.3, 1.4); c.stroke();
    }, { bevel: 0.9 });
  },
  felsenhort(L, color) {
    L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.ellipse(5, 6, 28, 19, 0, 0, 6.28); c.fill();
      c.fillStyle = rg(c, -8, -10, 4, 30, '#b9a283', '#4a3d2e');
      c.beginPath(); c.moveTo(-26, 9); c.quadraticCurveTo(-28, -17, -6, -24); c.quadraticCurveTo(19, -26, 26, -4); c.quadraticCurveTo(28, 13, 10, 17); c.quadraticCurveTo(-11, 21, -26, 9); c.fill();
      c.strokeStyle = 'rgba(40,28,18,0.4)'; c.lineWidth = 0.7;
      for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo(-20 + k * 7, -16 + Math.sin(k) * 3); c.quadraticCurveTo(-17 + k * 7, -4, -14 + k * 7, 6); c.stroke(); }
    }, { bevel: 1.4, grime: 0.7, dust: 0.3 });
    L((c) => {
      c.fillStyle = '#140d08'; c.beginPath(); c.ellipse(2, 7, 10, 7, 0, Math.PI, 0); c.lineTo(12, 10); c.lineTo(-8, 10); c.fill();
      c.fillStyle = '#7a8e9c'; c.beginPath(); c.arc(-15, 11, 4.4, 0, 6.28); c.fill(); c.fillStyle = 'rgba(120,190,255,0.85)'; c.beginPath(); c.arc(-15, 11, 2.6, 0, 6.28); c.fill();
      for (const [x, y] of [[16, 8], [19, 3]]) { c.fillStyle = '#6b5638'; rr(c, x, y, 4, 3.4, 0.5); c.fill(); }
    }, { bevel: 0.5 });
  },
  turm(L, color) {
    L((c) => {
      c.fillStyle = 'rgba(0,0,0,0.35)'; c.beginPath(); c.arc(3, 4, 18, 0, 6.28); c.fill();
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; c.fillStyle = k % 2 ? '#a08a64' : '#8c7756'; c.beginPath(); c.ellipse(Math.cos(a) * 16, Math.sin(a) * 16, 3.2, 2.2, a, 0, 6.28); c.fill(); }
    }, { bevel: 0.5, grime: 0.5 });
    L((c) => {
      c.fillStyle = lg(c, -12, -12, 12, 12, '#bdb09a', '#5e5444'); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.39; c.lineTo(Math.cos(a) * 13, Math.sin(a) * 13); } c.closePath(); c.fill();
      for (let i = 0; i < 8; i++) { const a = i / 8 * 6.28 + 0.39; rivets(c, [[Math.cos(a) * 11, Math.sin(a) * 11]], 0.55); }
      c.fillStyle = color; c.fillRect(-2, 11, 4, 2);
    }, { bevel: 0.9 });
  },
  flak(L, color) { STAT.turm(L, color); },
};

// Drehteile (vorgerendert, im Spiel rotiert)
function turretPart(kind, color) {
  if (kind === 'turm') return part(`tt-${color}`, 40, 24, (L) => {
    L((c) => { c.fillStyle = '#1e1b17'; c.fillRect(4, -2.6, 16, 5.2); c.fillStyle = '#2c2822'; c.fillRect(17, -3.2, 3.5, 6.4); }, { bevel: 0.4 });
    L((c) => { c.fillStyle = lg(c, -9, -8, 9, 8, '#d8ccb4', '#62584a'); rr(c, -9, -8, 16, 16, 3); c.fill(); vents(c, -7, -5, 4, 10, 4, true); c.fillStyle = color; c.fillRect(-9, -8, 2.4, 16); rivets(c, [[4, -6], [4, 6]], 0.6); }, { bevel: 0.8 });
  });
  return part(`tf-${color}`, 40, 24, (L) => {
    L((c) => { c.fillStyle = '#1e1b17'; c.fillRect(2, -5.2, 17, 3); c.fillRect(2, 2.2, 17, 3); }, { bevel: 0.3 });
    L((c) => { c.fillStyle = rg(c, -3, -3, 1, 9, '#d8ccb4', '#62584a'); c.beginPath(); c.arc(0, 0, 8.5, 0, 6.28); c.fill(); c.fillStyle = color; c.beginPath(); c.arc(-2, 0, 3, 0, 6.28); c.fill(); rivets(c, [[4, -4], [4, 4], [-5, -5], [-5, 5]], 0.5); }, { bevel: 0.8 });
  });
}

const DYN = {
  bauhof(c, b, color, t) {
    c.save(); c.translate(14, -15); c.rotate(Math.sin(t * 0.3) * 0.8 + 0.6);
    c.fillStyle = '#d9a83a'; c.fillRect(-1.6, -1.6, 27, 3.2);
    c.strokeStyle = '#7a5c18'; c.lineWidth = 0.5; for (let k = 2; k < 26; k += 3) { c.beginPath(); c.moveTo(k, -1.6); c.lineTo(k + 1.5, 1.6); c.stroke(); }
    c.fillStyle = '#2a2a2a'; c.fillRect(24, -0.6, 1.2, 6 + Math.sin(t) * 1.5); c.fillStyle = '#555'; c.fillRect(23, 5 + Math.sin(t) * 1.5, 3.2, 1.6);
    c.restore();
  },
  windfalle(c, b, color, t) {
    c.save(); c.translate(0, -4); c.rotate(t * 3);
    for (let k = 0; k < 3; k++) { c.rotate(Math.PI * 2 / 3); c.fillStyle = lg(c, 0, -2, 0, 2, '#d8d0c0', '#7a7266'); c.beginPath(); c.ellipse(5.5, 0, 5.5, 1.9, 0.3, 0, 6.28); c.fill(); }
    c.restore();
    c.fillStyle = color; c.beginPath(); c.arc(0, -4, 2.3, 0, 6.28); c.fill();
  },
  raffinerie(c, b, color, t, o) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = `rgba(255,${120 + pulse * 50},40,${0.45 + (o.unloading ? 0.45 : 0)})`; c.beginPath(); c.arc(14, -11, 4.6, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(255,140,50,0.4)'; c.beginPath(); c.arc(15, 12, 3.8, 0, 6.28); c.fill();
    c.globalCompositeOperation = 'source-over';
    c.fillStyle = 'rgba(255,150,60,0.9)'; for (let k = 0; k < 7; k++) { const xx = -22 + ((k * 4 + t * (o.unloading ? 30 : 6)) % 26); c.fillRect(xx, 19, 2.4, 1.6); }
  },
  kaserne(c, b, color, t, o) {
    c.strokeStyle = '#2f2a24'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(17, -13); c.lineTo(17, -28); c.stroke();
    c.fillStyle = color; c.beginPath(); c.moveTo(17, -28); c.quadraticCurveTo(23, -26 + Math.sin(t * 4) * 1.5, 28, -25); c.quadraticCurveTo(23, -22 + Math.sin(t * 4 + 1) * 1.5, 17, -21); c.closePath(); c.fill();
    if (o.door) { c.fillStyle = `rgba(255,190,110,${o.door * 0.8})`; c.fillRect(-4, 10, 8, 3.5); }
  },
  fabrik(c, b, color, t, o) {
    const door = o.door || 0;
    c.fillStyle = `rgba(255,190,110,${0.15 + door * 0.6})`; c.fillRect(-13, 6.5, 26, 9);
    c.fillStyle = '#5c4f40'; for (let k = 0; k < 4; k++) c.fillRect(-15, 5 + k * 3 * (1 - door), 30, 2.4 * (1 - door) + 0.4);
  },
  ausguck(c, b, color, t) {
    c.save(); c.translate(0, -5); c.rotate(t * 1.2);
    c.fillStyle = 'rgba(0,0,0,0.3)'; c.beginPath(); c.ellipse(3, 5, 15, 5, 0, 0, 6.28); c.fill();
    c.fillStyle = lg(c, 0, -6, 0, 6, '#ece6da', '#7c766c'); c.beginPath(); c.ellipse(0, 0, 15, 5.6, 0, 0, 6.28); c.fill();
    c.strokeStyle = 'rgba(60,55,50,0.6)'; c.lineWidth = 0.4; for (let k = -12; k <= 12; k += 4) { c.beginPath(); c.moveTo(k, -4.5); c.lineTo(k, 4.5); c.stroke(); }
    c.strokeStyle = '#555'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -9); c.stroke();
    c.restore();
    c.fillStyle = `rgba(255,70,50,${0.5 + 0.5 * Math.sin(t * 5)})`; c.beginPath(); c.arc(11, -20, 1.4, 0, 6.28); c.fill();
  },
  horst(c, b, color, t) {
    for (let k = 0; k < 10; k++) { const a = k / 10 * 6.28; const on = Math.floor(t * 6) % 10 === k; c.fillStyle = on ? 'rgba(170,240,255,1)' : 'rgba(90,140,160,0.6)'; c.beginPath(); c.arc(Math.cos(a) * 22.5, Math.sin(a) * 22.5, on ? 1.9 : 1.1, 0, 6.28); c.fill(); }
  },
  kontor(c, b, color, t) {
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + t * 0.5; c.fillStyle = '#f7dc8a'; c.beginPath(); c.arc(Math.cos(a) * 9, Math.sin(a) * 9, 1, 0, 6.28); c.fill(); }
    c.strokeStyle = '#2c2c30'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(0, 0); c.lineTo(0, -24); c.stroke();
    c.save(); c.translate(0, -16); c.rotate(Math.sin(t * 0.6) * 0.5); c.fillStyle = lg(c, -10, 0, 10, 0, '#e8ecf0', '#7d848e'); c.beginPath(); c.ellipse(0, 0, 10, 3.6, 0, 0, 6.28); c.fill(); c.restore();
    const pulse = (t * 0.8) % 1; c.strokeStyle = `rgba(255,220,130,${1 - pulse})`; c.lineWidth = 1.3; c.beginPath(); c.arc(0, -24, 3 + pulse * 18, 0, 6.28); c.stroke();
  },
  konvent(c, b, color, t) {
    const pl = 0.5 + 0.5 * Math.sin(t * 2);
    c.globalCompositeOperation = 'lighter';
    c.fillStyle = rg(c, 0, 0, 0, 8, `rgba(210,150,255,${0.6 + pl * 0.4})`, 'rgba(210,150,255,0)'); c.beginPath(); c.arc(0, 0, 8, 0, 6.28); c.fill();
    c.globalCompositeOperation = 'source-over';
  },
  felsenhort(c, b, color, t) {
    c.fillStyle = `rgba(90,160,255,${0.5 + 0.3 * Math.sin(t * 2)})`; c.beginPath(); c.arc(2, 6, 2.2, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(214,190,150,0.92)'; c.beginPath(); c.moveTo(-19, -6); c.lineTo(-4, -13 + Math.sin(t * 3) * 1.5); c.lineTo(-6, -2); c.closePath(); c.fill();
    c.fillStyle = color; c.beginPath(); c.moveTo(10, -15); c.lineTo(21, -11 + Math.sin(t * 3.5) * 1.5); c.lineTo(12, -6); c.closePath(); c.fill();
  },
  turm(c, b, color, t, o) {
    const p = turretPart('turm', color);
    c.save(); c.rotate(b.facing); c.translate(-(o.recoil || 0) * 3, 0); drawPartShadow(c, p, 2, 2, 0.3); drawPart(c, p, 6, 0); c.restore();
  },
  flak(c, b, color, t, o) {
    const p = turretPart('flak', color);
    c.save(); c.rotate(b.facing); drawPartShadow(c, p, 2, 2, 0.3); drawPart(c, p, 6, 0); c.restore();
  },
};

export function hasArt(type) { return !!STAT[type]; }

// Baustelle: das fertige Gebäude wächst von unten, oben nur als Bauplan
export function drawConstruction(ctx, b, color, t, prog) {
  const p = part(`b-${b.type}-${color}`, 92, 92, (L) => STAT[b.type](L, color));
  const top = 36 - 72 * clampN(0.15 + prog * 0.85);
  // Bauplan-Geist
  ctx.save(); ctx.globalAlpha *= 0.2; drawPart(ctx, p); ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(120,210,255,0.35)'; ctx.lineWidth = 0.5; ctx.setLineDash([2, 2]);
  ctx.strokeRect(-30, -30, 60, 60); ctx.beginPath(); ctx.moveTo(-30, 0); ctx.lineTo(30, 0); ctx.moveTo(0, -30); ctx.lineTo(0, 30); ctx.stroke(); ctx.restore();
  // Fertiger Teil
  ctx.save(); ctx.beginPath(); ctx.rect(-50, top, 100, 100); ctx.clip();
  drawPartShadow(ctx, p, 5, 6, 0.28); drawPart(ctx, p); ctx.restore();
  // Gerüst an der Baukante
  ctx.save();
  ctx.strokeStyle = 'rgba(200,170,110,0.85)'; ctx.lineWidth = 0.8;
  const y0 = top - 9, y1 = top + 7;
  ctx.beginPath();
  for (let x = -28; x <= 28; x += 7) { ctx.moveTo(x, y0); ctx.lineTo(x, y1); }
  ctx.moveTo(-28, y0); ctx.lineTo(28, y0); ctx.moveTo(-28, top); ctx.lineTo(28, top);
  for (let x = -28; x < 28; x += 7) { ctx.moveTo(x, y0); ctx.lineTo(x + 7, top); }
  ctx.stroke();
  // Schweißfunken
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 3; k++) {
    const ph = (t * 1.7 + k * 0.37) % 1, wx = Math.sin(t * 0.9 + k * 2.1) * 24;
    if (ph < 0.35) {
      const a = 1 - ph / 0.35;
      ctx.fillStyle = `rgba(255,240,190,${a})`; ctx.beginPath(); ctx.arc(wx, top, 2.2 * a + 0.6, 0, 6.28); ctx.fill();
      for (let j = 0; j < 4; j++) { const sx = wx + Math.sin(k * 7 + j * 3 + t * 30) * 6 * (1 - a), sy = top + (1 - a) * (3 + j * 2); ctx.fillStyle = `rgba(255,190,90,${a})`; ctx.fillRect(sx, sy, 0.9, 0.9); }
    }
  }
  ctx.restore();
  // Kran mit pendelndem Haken
  ctx.save(); ctx.translate(30, 26);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(1, 1, 6, 6);
  ctx.fillStyle = '#d9a33a'; ctx.fillRect(-3, -3, 6, 6); ctx.strokeStyle = '#3a2a14'; ctx.lineWidth = 0.6; ctx.strokeRect(-3, -3, 6, 6);
  const ja = -2.4 + Math.sin(t * 0.35 + b.c) * 0.5;
  ctx.rotate(ja);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(5, 7, 44, 3);
  ctx.fillStyle = '#e8b440'; ctx.fillRect(0, -1.6, 44, 3.2);
  ctx.strokeStyle = '#6a4a16'; ctx.lineWidth = 0.5; ctx.beginPath(); for (let x = 0; x < 44; x += 4) { ctx.moveTo(x, -1.6); ctx.lineTo(x + 4, 1.6); } ctx.stroke();
  ctx.fillStyle = '#5a5048'; ctx.fillRect(-8, -2.4, 7, 4.8);
  const hx = 30 + Math.sin(t * 1.4 + b.r) * 6;
  ctx.fillStyle = '#2a2622'; ctx.fillRect(hx - 1.5, -2.2, 3, 4.4);
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(hx + 1, 2, 4, 4);
  ctx.fillStyle = '#8c8070'; ctx.fillRect(hx - 2, -1, 4, 3);
  ctx.restore();
  // Fortschritt
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-20, 33, 40, 4);
  ctx.fillStyle = color; ctx.fillRect(-19.5, 33.5, 39 * prog, 3);
}
function clampN(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

export function drawBuildingArt(ctx, b, color, t, o) {
  const p = part(`b-${b.type}-${color}`, 92, 92, (L) => STAT[b.type](L, color));
  drawPartShadow(ctx, p, 5, 6, 0.28);
  drawPart(ctx, p);
  const d = DYN[b.type]; if (d) d(ctx, b, color, t, o);
}
