// Detaillierte Infanterie: vorgerenderte Figuren, animierte Beine und Effekte
import { part, drawPart, drawPartShadow, rr, lg, rg, rivets } from './art.js';

const S = {
  inf:        { n: 3, body: ['#a8987a', '#5e5242'], head: 'helmet', helm: ['#8a7d64', '#463d30'], gun: 'rifle', pack: 'radio' },
  rak:        { n: 2, body: ['#a39374', '#5a4e3e'], head: 'helmet', helm: ['#857860', '#40372b'], gun: 'launcher', pack: 'ammo' },
  schild:     { n: 2, body: ['#a19c92', '#4d4a43'], head: 'visor', helm: ['#b9b3a6', '#55514a'], gun: 'blade', pack: 'gen' },
  pionier:    { n: 2, body: ['#9c8f76', '#544a3b'], head: 'hardhat', helm: ['#f0c24e', '#9a7420'], gun: 'wrench', pack: 'tools' },
  spion:      { n: 1, body: ['#3d3732', '#141110'], head: 'hood', helm: ['#2a2521', '#100d0b'], gun: 'none', cloak: true, eyes: 'rgba(255,230,160,0.95)' },
  sandgaenger:{ n: 2, body: ['#b8a07a', '#6d5a40'], head: 'mask', helm: ['#7a6548', '#3e3224'], gun: 'rifle', cloak: true, eyes: 'rgba(110,170,255,1)' },
  duenen:     { n: 3, body: ['#c4a87c', '#7a6344'], head: 'mask', helm: ['#806a4a', '#3e3224'], gun: 'desert', cloak: true, eyes: 'rgba(80,150,255,1)' },
  todes:      { n: 2, body: ['#5a4636', '#231a14'], head: 'mask', helm: ['#3a2e24', '#16110d'], gun: 'crys', cloak: true, sash: '#a3302a', eyes: 'rgba(90,160,255,1)' },
  wurmreiter: { n: 1, body: ['#c7ab7f', '#7d6646'], head: 'mask', helm: ['#806a4a', '#3e3224'], gun: 'hooks', cloak: true, eyes: 'rgba(80,150,255,1)' },
  legionaer:  { n: 2, body: ['#5a2a26', '#1e0d0b'], head: 'visor', helm: ['#3a1c19', '#120807'], gun: 'gauss', pack: 'gen', trim: '#c9a24a' },
  soeldner:   { n: 2, body: ['#a8adb5', '#4a4f57'], head: 'visor', helm: ['#c9ced6', '#5b616a'], gun: 'gauss', pack: 'gen', trim: '#d4a63a' },
  schwester:  { n: 1, body: ['#3c2d4a', '#17111d'], head: 'veil', helm: ['#251b2e', '#120c17'], gun: 'blade', cloak: true, eyes: 'rgba(210,170,255,0.95)' },
  schatten:   { n: 1, body: ['#2b3a33', '#0c120f'], head: 'hood', helm: ['#101512', '#050807'], gun: 'crys', cloak: true, eyes: 'rgba(120,255,170,0.95)' },
};
const POS = {
  1: [[0, 0]],
  2: [[5, -5], [-4, 5]],
  3: [[6, 0], [-5, -7], [-5, 7]],
};

function weapon(c, g) {
  const line = (x0, y0, x1, y1, w, col) => { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
  if (g === 'rifle' || g === 'desert') { line(0, 2.4, 9.5, 2.4, 1.5, '#1b1d20'); c.fillStyle = '#3a3630'; c.fillRect(1, 1.6, 3, 1.6); if (g === 'desert') { c.fillStyle = '#6b5638'; c.fillRect(-1, 1.8, 2.2, 1.2); } }
  else if (g === 'launcher') { line(-5, -2.8, 9, -2.8, 3, '#2a2c2e'); c.fillStyle = '#4a4d50'; c.fillRect(6.5, -4.4, 3, 3.2); c.fillStyle = '#c84a30'; c.beginPath(); c.arc(9.3, -2.8, 0.9, 0, 6.28); c.fill(); }
  else if (g === 'gauss') { line(0, 2.4, 11, 2.4, 1.8, '#1b1d20'); c.fillStyle = '#7fd0ff'; c.fillRect(8.5, 1.7, 2.2, 1.4); c.fillStyle = '#3a3e44'; c.fillRect(2, 1.4, 4, 2); }
  else if (g === 'blade') { line(1, 3, 9, 4.4, 1.3, '#d2d6dc'); line(0.5, 3, 2, 3.2, 1.8, '#4a3a2a'); }
  else if (g === 'crys') { c.fillStyle = 'rgba(235,245,255,0.95)'; for (const s of [1, -1]) { c.beginPath(); c.moveTo(2, s * 3.2); c.lineTo(8.5, s * 3.7); c.lineTo(2, s * 4.4); c.fill(); } }
  else if (g === 'wrench') { line(2, 3, 7, 4, 1.4, '#9aa0a8'); c.fillStyle = '#9aa0a8'; c.beginPath(); c.arc(7.5, 4.1, 1.3, 0, 6.28); c.fill(); }
  else if (g === 'hooks') { line(-6, -4, 12, -7, 1.3, '#6a5236'); line(-6, 4, 12, 7, 1.3, '#6a5236'); c.strokeStyle = '#d0c8b4'; c.lineWidth = 1.1; c.beginPath(); c.arc(12.5, -8.5, 1.8, -1.5, 2); c.stroke(); c.beginPath(); c.arc(12.5, 8.5, 1.8, -2, 1.5); c.stroke(); }
}

function trooper(c, sp, color) {
  // Rucksack
  if (sp.pack) {
    c.fillStyle = lg(c, -6, -3, -2, 3, '#7a6c56', '#3a3228'); rr(c, -6.2, -3.2, 3.6, 6.4, 1); c.fill();
    if (sp.pack === 'radio') { c.strokeStyle = '#2a2622'; c.lineWidth = 0.5; c.beginPath(); c.moveTo(-5.5, -2.5); c.lineTo(-8, -5.5); c.stroke(); }
    if (sp.pack === 'tools') { c.fillStyle = '#d9a33a'; c.fillRect(-5.8, -0.8, 2.8, 1.6); }
    if (sp.pack === 'gen') { c.fillStyle = 'rgba(130,200,255,0.9)'; c.fillRect(-5.6, -0.6, 2.2, 1.2); }
    if (sp.pack === 'ammo') { c.fillStyle = '#5a4a36'; c.fillRect(-6, -3, 3.2, 2); c.fillRect(-6, 1, 3.2, 2); }
  }
  // Körper / Umhang
  if (sp.cloak) {
    c.fillStyle = lg(c, -6, -5, 4, 5, sp.body[0], sp.body[1]);
    c.beginPath(); c.moveTo(3.4, -4); c.quadraticCurveTo(-3, -6.2, -8.5, -2.6); c.quadraticCurveTo(-9.6, 0, -8.5, 2.6); c.quadraticCurveTo(-3, 6.2, 3.4, 4); c.closePath(); c.fill();
    c.strokeStyle = 'rgba(0,0,0,0.25)'; c.lineWidth = 0.4; for (let k = -6; k < 2; k += 2.2) { c.beginPath(); c.moveTo(k, -4.6); c.quadraticCurveTo(k - 1, 0, k, 4.6); c.stroke(); }
    if (sp.sash) { c.fillStyle = sp.sash; c.fillRect(-2.6, -4.3, 1.5, 8.6); }
    c.fillStyle = color; c.fillRect(-6.5, -1, 2, 2);
  } else {
    c.fillStyle = lg(c, -4, -5, 4, 5, sp.body[0], sp.body[1]); c.beginPath(); c.ellipse(0, 0, 3.8, 4.9, 0, 0, 6.28); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.22)'; c.fillRect(-1.2, -4.2, 0.5, 8.4);
    for (const s of [-1, 1]) { c.fillStyle = color; c.beginPath(); c.ellipse(-0.5, s * 3.7, 1.8, 1.2, 0, 0, 6.28); c.fill(); }
    if (sp.trim) { c.strokeStyle = sp.trim; c.lineWidth = 0.6; c.beginPath(); c.ellipse(0, 0, 3.3, 4.4, 0, -1.2, 1.2); c.stroke(); }
    rivets(c, [[1.8, -2.2], [1.8, 2.2]], 0.3);
  }
  // Arme
  c.strokeStyle = sp.body[1]; c.lineWidth = 1.3; c.lineCap = 'round';
  c.beginPath(); c.moveTo(0, -3); c.lineTo(3.4, -0.4); c.moveTo(0, 3); c.lineTo(3.6, 2.4); c.stroke();
  weapon(c, sp.gun);
  // Kopf
  const h = sp.helm;
  if (sp.head === 'hardhat') { c.fillStyle = rg(c, 0, -1, 0.3, 3.3, h[0], h[1]); c.beginPath(); c.arc(0.8, 0, 3, 0, 6.28); c.fill(); c.fillStyle = h[1]; c.fillRect(0.5, -3, 0.6, 6); }
  else if (sp.head === 'veil') { c.fillStyle = rg(c, 0, -1, 0.3, 3.5, h[0], h[1]); c.beginPath(); c.ellipse(1.2, 0, 3.4, 3, 0, 0, 6.28); c.fill(); c.fillStyle = 'rgba(200,190,170,0.35)'; c.beginPath(); c.ellipse(3, 0, 1.2, 2.4, 0, 0, 6.28); c.fill(); }
  else { c.fillStyle = rg(c, -0.5, -1, 0.3, 3.2, h[0], h[1]); c.beginPath(); c.arc(0.8, 0, sp.head === 'hood' ? 2.8 : 2.6, 0, 6.28); c.fill(); }
  if (sp.head === 'helmet') { c.fillStyle = 'rgba(160,230,255,0.9)'; c.fillRect(2.4, -1, 1, 2); c.strokeStyle = 'rgba(0,0,0,0.35)'; c.lineWidth = 0.35; c.beginPath(); c.arc(0.8, 0, 2, 2, 4.3); c.stroke(); }
  if (sp.head === 'visor') { c.fillStyle = 'rgba(255,200,90,0.95)'; c.fillRect(2.3, -1.4, 1, 2.8); }
  if (sp.head === 'mask') { c.fillStyle = '#2c2620'; c.fillRect(2.6, -1.2, 1.1, 2.4); }
  if (sp.eyes) { c.fillStyle = sp.eyes; c.fillRect(2.4, -1.5, 0.85, 0.85); c.fillRect(2.4, 0.65, 0.85, 0.85); }
}

function trooperPart(type, color) {
  return part(`in-${type}-${color}`, 30, 22, (L) => L((c) => trooper(c, S[type], color), { bevel: 0.32, grime: 0.3, light: 0.55, shade: 0.5, rim: false }), 7);
}

function legs(c, x, y, a, t, moving, col) {
  const st = moving ? Math.sin(t * 13 + x * 0.7 + y) * 3 : 0.7;
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = 'rgba(0,0,0,0.2)'; c.beginPath(); c.ellipse(1.8, 2.2, 4.6, 3.6, 0, 0, 6.28); c.fill();
  c.strokeStyle = col; c.lineWidth = 1.8; c.lineCap = 'round';
  c.beginPath(); c.moveTo(-1, -1.8); c.lineTo(-1 + st, -2.7); c.moveTo(-1, 1.8); c.lineTo(-1 - st, 2.7); c.stroke();
  c.restore();
}

function squad(type) {
  return (ctx, u, color, t, o) => {
    const sp = S[type], p = trooperPart(type, color), a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    const pos = POS[sp.n];
    for (const [px, py] of pos) {
      const x = px * ca - py * sa, y = px * sa + py * ca;
      const bob = o.moving ? Math.sin(t * 13 + px) * 0.35 : 0;
      legs(ctx, x, y, a, t, o.moving, sp.body[1]);
      ctx.save(); ctx.translate(x, y + bob); ctx.rotate(a); drawPart(ctx, p); ctx.restore();
    }
    // Effekte
    if (type === 'schild') for (const [px, py] of pos) {
      const x = px * ca - py * sa, y = px * sa + py * ca, sh = 0.16 + 0.1 * Math.sin(t * 3 + px);
      ctx.strokeStyle = `rgba(140,200,255,${sh + 0.22})`; ctx.fillStyle = `rgba(140,200,255,${sh * 0.45})`; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.arc(x, y, 7.5, 0, 6.28); ctx.fill(); ctx.stroke();
    }
    if (type === 'schwester') { const g = rg(ctx, 0, 0, 2, 14, 'rgba(190,120,255,0.28)', 'rgba(190,120,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.fill(); }
    if (type === 'schatten') { ctx.save(); ctx.rotate(a); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(150,255,200,0.75)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(2, 3.2); ctx.lineTo(8.5, 4); ctx.stroke(); ctx.restore(); }
  };
}

// Scharfschütze: liegende Figur, eigenes Teil
function sniperPart(color) {
  return part(`in-scharf-${color}`, 44, 18, (L) => L((c) => {
    c.fillStyle = lg(c, -9, -5, 6, 5, '#b49c74', '#6d5a40');
    c.beginPath(); c.moveTo(4, 0); c.quadraticCurveTo(0, -6, -10, -4.2); c.quadraticCurveTo(-13, 0, -10, 4.2); c.quadraticCurveTo(0, 6, 4, 0); c.fill();
    c.strokeStyle = 'rgba(90,70,45,0.55)'; c.lineWidth = 0.6; for (let k = -8; k < 3; k += 2) { c.beginPath(); c.moveTo(k, -4); c.lineTo(k + 1.2, 4); c.stroke(); }
    for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? 'rgba(120,100,70,0.6)' : 'rgba(200,180,140,0.5)'; c.beginPath(); c.arc(-9 + Math.random() * 11, (Math.random() - 0.5) * 7, 0.8, 0, 6.28); c.fill(); }
    c.fillStyle = color; c.fillRect(-6, -1, 2.4, 2);
    c.fillStyle = rg(c, 2.5, -0.5, 0.3, 2.6, '#7a6650', '#3e3224'); c.beginPath(); c.arc(3, 0, 2.4, 0, 6.28); c.fill();
    c.strokeStyle = '#1b1d20'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(1, 1.4); c.lineTo(20, 1.4); c.stroke();
    c.fillStyle = '#2a2d31'; rr(c, 5, -0.5, 6.5, 1.8, 0.6); c.fill();
    c.strokeStyle = '#1b1d20'; c.lineWidth = 0.8; c.beginPath(); c.moveTo(15.5, 1.4); c.lineTo(16.5, 4); c.moveTo(15.5, 1.4); c.lineTo(16.5, -1.2); c.stroke();
  }, { bevel: 0.32, grime: 0.35, rim: false }), 7);
}

export const IDRAW = {
  scharf(ctx, u, color, t) {
    const p = sniperPart(color);
    ctx.rotate(u.facing);
    drawPartShadow(ctx, p, 1.5, 2.5, 0.3); drawPart(ctx, p);
    const glint = Math.sin(t * 1.3 + u.id) > 0.92 ? 1 : 0.2;
    ctx.fillStyle = `rgba(200,240,255,${glint})`; ctx.beginPath(); ctx.arc(11.5, 0.4, 0.9, 0, 6.28); ctx.fill();
  },
};
for (const k of Object.keys(S)) IDRAW[k] = squad(k);
