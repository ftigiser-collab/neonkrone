// Prozedurale Grafik: Einheiten, Gebäude, Würmer (Draufsicht, Licht von oben links)
import { shade, rgba } from './util.js';
import { VDRAW } from './vart.js';
import { IDRAW } from './iart.js';
import { part, drawPart, drawPartShadow } from './art.js';
import { UNITS } from './data.js';
import { hasArt, drawBuildingArt, drawConstruction } from './bart.js';

const M = { dark: '#3a3128', mid: '#6d604c', light: '#a4927a', hi: '#d3c4a6', sand: '#8a7354', glass: '#8fd0f0' };

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function grad(ctx, x0, y0, x1, y1, a, b) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
function shadowOf(ctx, fn, dx = 4, dy = 5, a = 0.35) {
  ctx.save(); ctx.translate(dx, dy); ctx.globalAlpha *= a; ctx.fillStyle = '#000'; ctx.strokeStyle = '#000'; fn(true); ctx.restore();
}

// ---------- Einheiten ----------
export function drawUnit(ctx, u, x, y, color, t, o = {}) {
  ctx.save();
  ctx.translate(x, y);
  if (o.ring) {
    ctx.fillStyle = rgba(color, 0.22); ctx.strokeStyle = rgba(color, 0.75); ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(0, 4, 27, 16, 0, 0, 6.28); ctx.fill(); ctx.stroke();
  }
  ctx.scale(o.scale || 1.62, o.scale || 1.62);
  const f = DRAW[u.type];
  if (f) f(ctx, u, color, t, o);
  ctx.restore();
}

function soldier(ctx, x, y, a, color, t, launcher, walking) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  const bob = walking ? Math.sin(t * 14 + x) * 0.8 : 0;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2.5, 3, 5, 4, 0, 0, 6.28); ctx.fill();
  // Beine im Schritt
  const st = walking ? Math.sin(t * 14 + x) * 3 : 0.8;
  ctx.strokeStyle = '#4a3f33'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-1, -1.8); ctx.lineTo(-1 + st, -2.6); ctx.moveTo(-1, 1.8); ctx.lineTo(-1 - st, 2.6); ctx.stroke();
  // Waffe
  ctx.strokeStyle = '#22252a'; ctx.lineWidth = launcher ? 3.2 : 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(launcher ? -4 : 0, launcher ? -3 : 2.5); ctx.lineTo(launcher ? 8 : 9, launcher ? -3 : 2.5); ctx.stroke();
  // Körper (Wüstenanzug)
  ctx.fillStyle = grad(ctx, -4, -4, 4, 4, '#9a8a70', '#5e5242');
  ctx.beginPath(); ctx.ellipse(0, bob * 0.3, 3.6, 4.6, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(-3.8, -1.2 + bob * 0.3, 2.2, 2.4);
  // Kopf mit Kapuze
  ctx.fillStyle = grad(ctx, -2, -2, 2, 2, '#b8a68a', '#6f6250');
  ctx.beginPath(); ctx.arc(0.8, bob * 0.3, 2.4, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(160,230,255,0.85)'; ctx.fillRect(2.2, -0.9 + bob * 0.3, 1, 1.8);
  ctx.restore();
}

const DRAW = {
  inf(ctx, u, color, t, o) {
    const a = u.facing;
    const pts = [[6, 0], [-5, -7], [-5, 7]];
    for (const [px, py] of pts) {
      const ca = Math.cos(a), sa = Math.sin(a);
      soldier(ctx, px * ca - py * sa, px * sa + py * ca, a, color, t, false, o.moving);
    }
  },
  sandgaenger(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[5, -4], [-4, 5]]) {
      ctx.save(); ctx.translate(px * ca - py * sa, px * sa + py * ca); ctx.rotate(a);
      const st = o.moving ? Math.sin(t * 12 + px) * 3 : 0.6;
      ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(2.5, 3, 6, 4.5, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#4a3c2c'; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-1, -1.8); ctx.lineTo(-1 + st, -2.8); ctx.moveTo(-1, 1.8); ctx.lineTo(-1 - st, 2.8); ctx.stroke();
      // Umhang im Wind
      const fl = Math.sin(t * 5 + px) * 1.2;
      ctx.fillStyle = grad(ctx, -6, -5, 4, 5, '#b39a72', '#6f5b40');
      ctx.beginPath(); ctx.moveTo(3, -4); ctx.quadraticCurveTo(-4, -6 - fl, -9, -2); ctx.lineTo(-9, 2); ctx.quadraticCurveTo(-4, 6 + fl, 3, 4); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(1.5, -3.2); ctx.lineTo(1.5, 3.2); ctx.stroke();
      ctx.fillStyle = '#6d5a42'; ctx.beginPath(); ctx.arc(1.5, 0, 2.6, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#2c2620'; ctx.fillRect(3, -1.4, 1.2, 2.8);
      ctx.fillStyle = 'rgba(110,170,255,0.95)'; ctx.fillRect(2.6, -1.6, 0.9, 0.9); ctx.fillRect(2.6, 0.7, 0.9, 0.9);
      ctx.strokeStyle = '#1e1b18'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 2.5); ctx.lineTo(8, 3); ctx.stroke();
      ctx.restore();
    }
  },
  scharf(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(1, 3, 10, 5, 0, 0, 6.28); ctx.fill();
    // Tarnumhang (liegend)
    ctx.fillStyle = grad(ctx, -9, -5, 6, 5, '#b49c74', '#6d5a40');
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(0, -6, -9, -4); ctx.quadraticCurveTo(-12, 0, -9, 4); ctx.quadraticCurveTo(0, 6, 4, 0); ctx.fill();
    ctx.strokeStyle = 'rgba(90,70,45,0.6)'; ctx.lineWidth = 0.8; for (let k = -7; k < 3; k += 2.5) { ctx.beginPath(); ctx.moveTo(k, -4); ctx.lineTo(k + 1, 4); ctx.stroke(); }
    ctx.fillStyle = color; ctx.fillRect(-6, -1, 2.4, 2);
    ctx.fillStyle = '#6d5a42'; ctx.beginPath(); ctx.arc(3, 0, 2.3, 0, 6.28); ctx.fill();
    // Langes Gewehr mit Zielfernrohr
    ctx.strokeStyle = '#1b1d20'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(1, 1.4); ctx.lineTo(19, 1.4); ctx.stroke();
    ctx.fillStyle = '#2a2d31'; ctx.fillRect(5, -0.4, 6, 1.6);
    const glint = (Math.sin(t * 1.3 + u.id) > 0.92) ? 1 : 0.25;
    ctx.fillStyle = `rgba(200,240,255,${glint})`; ctx.beginPath(); ctx.arc(11, 0.4, 1, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#1b1d20'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(15, 1.4); ctx.lineTo(16, 4); ctx.moveTo(15, 1.4); ctx.lineTo(16, -1.2); ctx.stroke();
  },
  schild(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[5, -5], [-4, 5]]) {
      ctx.save(); ctx.translate(px * ca - py * sa, px * sa + py * ca); ctx.rotate(a);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2.5, 3, 5.5, 4.5, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#c9d2dc'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1, 3); ctx.lineTo(10, 4.5); ctx.stroke();
      ctx.fillStyle = grad(ctx, -4, -4, 4, 4, '#8f8a80', '#4a463f'); ctx.beginPath(); ctx.ellipse(0, 0, 4, 5, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = color; ctx.fillRect(-3.8, -1.4, 2.4, 2.8);
      ctx.fillStyle = grad(ctx, -2, -2, 2, 2, '#b8b2a6', '#5e5950'); ctx.beginPath(); ctx.arc(0.8, 0, 2.5, 0, 6.28); ctx.fill();
      // Schildschimmer
      const sh = 0.18 + 0.1 * Math.sin(t * 3 + px);
      ctx.strokeStyle = `rgba(140,200,255,${sh + 0.2})`; ctx.fillStyle = `rgba(140,200,255,${sh * 0.5})`; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0.5, 0, 7.5, 0, 6.28); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
  },
  pionier(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[4, -5], [-4, 5]]) {
      ctx.save(); ctx.translate(px * ca - py * sa, px * sa + py * ca); ctx.rotate(a);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2.5, 3, 5, 4, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#6b6152'; rr(ctx, -6, -3.5, 4, 7, 1.2); ctx.fill();
      ctx.fillStyle = '#d9a33a'; ctx.fillRect(-5.6, -1, 3.2, 2);
      ctx.fillStyle = grad(ctx, -4, -4, 4, 4, '#a08f72', '#5e5242'); ctx.beginPath(); ctx.ellipse(0, 0, 3.6, 4.6, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = color; ctx.fillRect(-1, -4.2, 2, 1.4);
      ctx.fillStyle = '#e2b13c'; ctx.beginPath(); ctx.arc(0.8, 0, 2.7, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#9aa0a8'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(2, 3); ctx.lineTo(7, 4); ctx.stroke();
      ctx.fillStyle = '#9aa0a8'; ctx.beginPath(); ctx.arc(7.5, 4, 1.4, 0, 6.28); ctx.fill();
      ctx.restore();
    }
  },
  spion(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 3, 7, 5, 0, 0, 6.28); ctx.fill();
    const st = o.moving ? Math.sin(t * 12) * 2.5 : 0.5;
    ctx.strokeStyle = '#1a1714'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -1.8); ctx.lineTo(-1 + st, -2.6); ctx.moveTo(-1, 1.8); ctx.lineTo(-1 - st, 2.6); ctx.stroke();
    ctx.fillStyle = grad(ctx, -5, -5, 5, 5, '#3a3530', '#151210');
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(0, -6, -7, -4); ctx.lineTo(-7, 4); ctx.quadraticCurveTo(0, 6, 4, 0); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(-6.5, -3.4); ctx.lineTo(-6.5, 3.4); ctx.stroke();
    ctx.fillStyle = '#1e1a17'; ctx.beginPath(); ctx.arc(1.8, 0, 2.6, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(255,230,160,0.9)'; ctx.fillRect(3.4, -1, 0.8, 0.8); ctx.fillRect(3.4, 0.3, 0.8, 0.8);
  },
  duenen(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[6, 0], [-4, -6], [-4, 6]]) {
      ctx.save(); ctx.translate(px * ca - py * sa, px * sa + py * ca); ctx.rotate(a);
      const st = o.moving ? Math.sin(t * 12 + px + py) * 2.8 : 0.6, fl = Math.sin(t * 5 + px) * 1;
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 3, 5.5, 4, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#4a3c2c'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -1.6); ctx.lineTo(-1 + st, -2.5); ctx.moveTo(-1, 1.6); ctx.lineTo(-1 - st, 2.5); ctx.stroke();
      ctx.fillStyle = grad(ctx, -6, -5, 4, 5, '#c2a67a', '#7a6344');
      ctx.beginPath(); ctx.moveTo(3, -3.6); ctx.quadraticCurveTo(-4, -5.5 - fl, -8, -2); ctx.lineTo(-8, 2); ctx.quadraticCurveTo(-4, 5.5 + fl, 3, 3.6); ctx.closePath(); ctx.fill();
      ctx.fillStyle = color; ctx.fillRect(-3, -3.4, 1.4, 6.8);
      ctx.fillStyle = '#7d6748'; ctx.beginPath(); ctx.arc(1.3, 0, 2.4, 0, 6.28); ctx.fill();
      ctx.fillStyle = 'rgba(80,150,255,1)'; ctx.fillRect(2.6, -1.3, 0.9, 0.9); ctx.fillRect(2.6, 0.5, 0.9, 0.9);
      ctx.strokeStyle = '#1b1d20'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(0, 2.4); ctx.lineTo(8, 2.6); ctx.stroke();
      ctx.restore();
    }
  },
  todes(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[5, -4], [-4, 5]]) {
      ctx.save(); ctx.translate(px * ca - py * sa, px * sa + py * ca); ctx.rotate(a);
      const st = o.moving ? Math.sin(t * 13 + px) * 3 : 0.6, fl = Math.sin(t * 6 + px) * 1.3;
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2.5, 3, 6, 4.5, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#2a2420'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-1, -1.8); ctx.lineTo(-1 + st, -2.8); ctx.moveTo(-1, 1.8); ctx.lineTo(-1 - st, 2.8); ctx.stroke();
      ctx.fillStyle = grad(ctx, -6, -5, 4, 5, '#5a4636', '#231a14');
      ctx.beginPath(); ctx.moveTo(3, -4); ctx.quadraticCurveTo(-4, -6.5 - fl, -10, -2.5); ctx.lineTo(-10, 2.5); ctx.quadraticCurveTo(-4, 6.5 + fl, 3, 4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#a3302a'; ctx.fillRect(-2.5, -4, 1.6, 8);
      ctx.fillStyle = color; ctx.fillRect(-6, -1, 2, 2);
      ctx.fillStyle = '#3a2e24'; ctx.beginPath(); ctx.arc(1.5, 0, 2.6, 0, 6.28); ctx.fill();
      ctx.fillStyle = 'rgba(90,160,255,1)'; ctx.fillRect(2.9, -1.3, 0.9, 0.9); ctx.fillRect(2.9, 0.5, 0.9, 0.9);
      // Kristallklingen
      ctx.fillStyle = 'rgba(235,245,255,0.95)';
      ctx.beginPath(); ctx.moveTo(2, 3.2); ctx.lineTo(9, 3.6); ctx.lineTo(2, 4.4); ctx.fill();
      ctx.beginPath(); ctx.moveTo(2, -3.2); ctx.lineTo(8, -3.6); ctx.lineTo(2, -4.4); ctx.fill();
      ctx.restore();
    }
  },
  wurmreiter(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const st = o.moving ? Math.sin(t * 12) * 3 : 0.6, fl = Math.sin(t * 5) * 1.2;
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(2, 3, 8, 5, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#4a3c2c'; ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(-1, -1.8); ctx.lineTo(-1 + st, -2.8); ctx.moveTo(-1, 1.8); ctx.lineTo(-1 - st, 2.8); ctx.stroke();
    // Haken-Stangen
    ctx.strokeStyle = '#6a5236'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-6, -4); ctx.lineTo(12, -7); ctx.moveTo(-6, 4); ctx.lineTo(12, 7); ctx.stroke();
    ctx.strokeStyle = '#c9c2b0'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(12.5, -8.5, 1.8, -1.5, 2); ctx.stroke(); ctx.beginPath(); ctx.arc(12.5, 8.5, 1.8, -2, 1.5); ctx.stroke();
    ctx.fillStyle = grad(ctx, -7, -5, 4, 5, '#c7ab7f', '#7d6646');
    ctx.beginPath(); ctx.moveTo(3, -4); ctx.quadraticCurveTo(-4, -6 - fl, -9, -2); ctx.lineTo(-9, 2); ctx.quadraticCurveTo(-4, 6 + fl, 3, 4); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-1, -3.6); ctx.lineTo(-1, 3.6); ctx.stroke();
    ctx.fillStyle = '#7d6748'; ctx.beginPath(); ctx.arc(1.5, 0, 2.8, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(80,150,255,1)'; ctx.fillRect(3, -1.4, 1, 1); ctx.fillRect(3, 0.5, 1, 1);
  },
  flakwagen(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const body = () => { rr(ctx, -13, -8, 26, 16, 3); ctx.fill(); };
    shadowOf(ctx, body, 3, 4);
    ctx.fillStyle = '#1d1f22';
    for (const [wx, wy] of [[-10, -10], [5, -10], [-10, 7], [5, 7]]) { rr(ctx, wx, wy, 6, 3.4, 1.2); ctx.fill(); }
    ctx.fillStyle = grad(ctx, 0, -7, 0, 7, M.light, M.dark); rr(ctx, -12, -7, 24, 14, 3); ctx.fill();
    ctx.fillStyle = 'rgba(160,220,255,0.85)'; rr(ctx, 7, -5, 3, 10, 1); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-12, -7, 3, 14);
    ctx.save(); ctx.translate(-3, 0); ctx.rotate(o.turret ?? 0);
    ctx.fillStyle = grad(ctx, -5, -5, 5, 5, M.hi, M.mid); ctx.beginPath(); ctx.arc(0, 0, 5.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#1b1d20'; ctx.fillRect(3, -3.4, 12, 1.8); ctx.fillRect(3, 1.6, 12, 1.8);
    ctx.restore();
  },
  laserpanzer(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const hull = () => { rr(ctx, -15, -10, 30, 20, 6); ctx.fill(); };
    shadowOf(ctx, hull, 4, 5);
    ctx.fillStyle = '#1b1d20'; rr(ctx, -16, -11, 32, 5, 2); ctx.fill(); rr(ctx, -16, 6, 32, 5, 2); ctx.fill();
    ctx.fillStyle = grad(ctx, -12, -8, 12, 8, '#cfc8b6', '#6e675a');
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.lineTo(9, -7); ctx.lineTo(-13, -7); ctx.lineTo(-14, 0); ctx.lineTo(-13, 7); ctx.lineTo(9, 7); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-13, -7, 3, 14);
    ctx.save(); ctx.rotate(o.turret ?? 0);
    ctx.fillStyle = '#2a2d31'; ctx.fillRect(3, -1.6, 19, 3.2);
    ctx.fillStyle = '#5ea8ff'; ctx.fillRect(20, -1.2, 3, 2.4);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(110,180,255,${0.4 + 0.3 * Math.sin(t * 6)})`; ctx.beginPath(); ctx.arc(22, 0, 3.5, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = grad(ctx, -7, -6, 7, 6, '#e2dccd', '#7d7668'); ctx.beginPath(); ctx.moveTo(8, 0); ctx.lineTo(2, -6); ctx.lineTo(-6, -5); ctx.lineTo(-6, 5); ctx.lineTo(2, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(110,180,255,0.9)'; ctx.fillRect(-3, -1, 6, 2);
    ctx.restore();
  },
  koloss(ctx, u, color, t, o) {
    ctx.rotate(u.facing); ctx.scale(1.1, 1.1);
    const tr = o.moving ? (t * 25) % 4 : 0;
    const hull = () => { rr(ctx, -16, -13, 32, 26, 4); ctx.fill(); };
    shadowOf(ctx, hull, 5, 6, 0.4);
    // sechs Ketten
    ctx.fillStyle = '#17181a';
    for (const yy of [-14, -4, 6]) for (const xx of [-17, 2]) { rr(ctx, xx, yy, 15, 8, 2); ctx.fill(); }
    ctx.strokeStyle = '#3a3e44'; ctx.lineWidth = 1;
    for (const yy of [-14, -4, 6]) for (let k = -17 + tr; k < 17; k += 4) { ctx.beginPath(); ctx.moveTo(k, yy); ctx.lineTo(k, yy + 8); ctx.stroke(); }
    ctx.fillStyle = grad(ctx, -14, -11, 14, 11, '#a99a80', '#544a3c'); rr(ctx, -14, -10, 28, 20, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.8;
    for (const xx of [-8, -2, 4, 10]) { ctx.beginPath(); ctx.moveTo(xx, -10); ctx.lineTo(xx, 10); ctx.stroke(); }
    ctx.fillStyle = color; ctx.fillRect(-14, -10, 3, 20);
    ctx.fillStyle = 'rgba(255,190,110,0.7)'; for (const yy of [-8, 7]) ctx.fillRect(11, yy, 2, 1.2);
    ctx.save(); ctx.rotate(o.turret ?? 0);
    const rec = o.recoil || 0;
    ctx.fillStyle = '#202327'; ctx.fillRect(5 - rec * 4, -4.5, 17, 3); ctx.fillRect(5 - rec * 4, 1.5, 17, 3);
    ctx.fillStyle = grad(ctx, -8, -8, 8, 8, '#cbbda2', '#5d5242'); rr(ctx, -9, -8, 17, 16, 3); ctx.fill();
    ctx.fillStyle = shade(color, -0.25); ctx.beginPath(); ctx.arc(-3, 0, 3, 0, 6.28); ctx.fill();
    ctx.restore();
  },
  rak(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[4, -6], [-4, 6]]) soldier(ctx, px * ca - py * sa, px * sa + py * ca, a, color, t, true, o.moving);
  },
  trike(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const body = (sh) => {
      if (!sh) { ctx.fillStyle = '#1d1f22'; }
      for (const [wx, wy, ww, wh] of [[-11, -10, 9, 5], [-11, 5, 9, 5], [8, -2.5, 7, 5]]) { rr(ctx, wx, wy, ww, wh, 2); ctx.fill(); }
      if (!sh) ctx.fillStyle = grad(ctx, 0, -7, 0, 7, M.light, M.dark);
      ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-3, -7); ctx.lineTo(-12, -5); ctx.lineTo(-12, 5); ctx.lineTo(-3, 7); ctx.closePath(); ctx.fill();
    };
    shadowOf(ctx, body, 3, 4);
    body(false);
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-1, -4); ctx.lineTo(-1, 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#3b3027'; ctx.beginPath(); ctx.arc(-5, 0, 3.6, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#8a7a62'; ctx.beginPath(); ctx.arc(-5, 0, 2.2, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(150,220,255,0.9)'; ctx.fillRect(-3.6, -0.8, 1, 1.6);
    if (o.moving) { ctx.strokeStyle = 'rgba(200,170,120,0.5)'; ctx.lineWidth = 1; for (const yy of [-8, 7]) { ctx.beginPath(); ctx.moveTo(-12, yy); ctx.lineTo(-18 - Math.random() * 4, yy + (Math.random() - 0.5) * 2); ctx.stroke(); } }
    ctx.strokeStyle = '#1a1c1f'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-3, -1.5); ctx.lineTo(9, -1.5); ctx.moveTo(-3, 1.5); ctx.lineTo(9, 1.5); ctx.stroke();
  },
  panzer(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const tr = o.moving ? (t * 30) % 4 : 0;
    const hull = () => { rr(ctx, -15, -11, 30, 22, 4); ctx.fill(); };
    shadowOf(ctx, hull, 4, 5);
    // Ketten
    ctx.fillStyle = '#1b1d20'; rr(ctx, -16, -12, 32, 6, 2); ctx.fill(); rr(ctx, -16, 6, 32, 6, 2); ctx.fill();
    ctx.strokeStyle = '#3a3e44'; ctx.lineWidth = 1;
    for (let k = -16 + tr; k < 16; k += 4) { ctx.beginPath(); ctx.moveTo(k, -12); ctx.lineTo(k, -6); ctx.moveTo(k, 6); ctx.lineTo(k, 12); ctx.stroke(); }
    ctx.fillStyle = grad(ctx, -10, -8, 10, 8, M.light, M.mid); rr(ctx, -13, -7, 26, 14, 3); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-13, -7, 4, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(-9, -7, 20, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6;
    for (const xx of [-6, 2, 8]) { ctx.beginPath(); ctx.moveTo(xx, -7); ctx.lineTo(xx, 7); ctx.stroke(); }
    ctx.fillStyle = 'rgba(0,0,0,0.4)'; for (const [xx, yy] of [[-11, -5], [-11, 5], [11, -5], [11, 5]]) { ctx.beginPath(); ctx.arc(xx, yy, 0.7, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = '#2a241d'; for (let k = 0; k < 3; k++) ctx.fillRect(-12.5, -3 + k * 2.2, 2.5, 1.1);
    // Turm
    ctx.rotate(o.turret ?? 0);
    const rec = o.recoil || 0;
    ctx.fillStyle = '#25282d'; ctx.fillRect(4 - rec * 4, -1.8, 16, 3.6);
    ctx.fillStyle = '#1a1c1f'; ctx.fillRect(18 - rec * 4, -2.4, 3, 4.8);
    ctx.fillStyle = grad(ctx, -6, -6, 6, 6, M.hi, M.mid); ctx.beginPath(); ctx.arc(0, 0, 7.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = shade(color, -0.2); ctx.beginPath(); ctx.arc(-2, 0, 2.6, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(2.5, -3.2, 1.6, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(30,25,20,0.8)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(-4, 4); ctx.quadraticCurveTo(-10, 6 + Math.sin(t * 3) * 1.5, -15, 5); ctx.stroke();
  },
  werfer(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const hull = () => { rr(ctx, -14, -10, 28, 20, 4); ctx.fill(); };
    shadowOf(ctx, hull, 4, 5);
    ctx.fillStyle = '#1b1d20'; rr(ctx, -15, -11, 30, 5, 2); ctx.fill(); rr(ctx, -15, 6, 30, 5, 2); ctx.fill();
    ctx.fillStyle = grad(ctx, -10, -8, 10, 8, M.light, M.mid); rr(ctx, -13, -6.5, 26, 13, 3); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(9, -6.5, 4, 13);
    ctx.rotate(o.turret ?? 0);
    ctx.fillStyle = grad(ctx, -8, -7, 8, 7, '#7d6f5b', '#3a3f47'); rr(ctx, -9, -7, 15, 14, 2); ctx.fill();
    for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
      ctx.fillStyle = '#1a1c1f'; ctx.beginPath(); ctx.arc(3, -4 + i * 4, 1.5, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#d24d32'; ctx.beginPath(); ctx.arc(-5 + j * 4, -4 + i * 4, 1.2, 0, 6.28); ctx.fill();
    }
  },
  ernter(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const hull = () => { rr(ctx, -18, -13, 34, 26, 5); ctx.fill(); };
    shadowOf(ctx, hull, 4, 6);
    ctx.fillStyle = '#1b1d20'; rr(ctx, -19, -14, 34, 6, 2); ctx.fill(); rr(ctx, -19, 8, 34, 6, 2); ctx.fill();
    ctx.fillStyle = grad(ctx, -14, -10, 14, 10, '#b19a6c', '#6b5a3d'); rr(ctx, -17, -9, 30, 18, 4); ctx.fill();
    // Tank mit Glutfüllung
    const fill = (u.cargo || 0) / (u.def.capacity || 1);
    ctx.fillStyle = '#3a2e22'; rr(ctx, -15, -7, 15, 14, 3); ctx.fill();
    ctx.fillStyle = `rgba(255,${120 + 40 * fill},40,${0.25 + fill * 0.7})`; rr(ctx, -14, 6 - 12 * fill, 13, 12 * fill, 2); ctx.fill();
    // Kabine
    ctx.fillStyle = color; rr(ctx, 1, -8, 8, 16, 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,220,255,0.85)'; rr(ctx, 6, -5, 3, 10, 1); ctx.fill();
    // Erntewalze
    ctx.fillStyle = '#2a2d31'; rr(ctx, 13, -12, 6, 24, 2); ctx.fill();
    ctx.strokeStyle = '#8f8f8f'; ctx.lineWidth = 1.2;
    const sp = o.harvesting ? t * 40 : 0;
    for (let k = 0; k < 6; k++) { const yy = -11 + ((k * 4 + sp) % 22); ctx.beginPath(); ctx.moveTo(13, yy); ctx.lineTo(19, yy + 2); ctx.stroke(); }
  },
  libelle(ctx, u, color, t, o) { thopter(ctx, u, color, t, o, 'libelle'); },
  adler(ctx, u, color, t, o) { thopter(ctx, u, color, t, o, 'adler'); },
  brenner(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const tr = o.moving ? (t * 30) % 4 : 0;
    const hull = () => { rr(ctx, -15, -11, 30, 22, 4); ctx.fill(); };
    shadowOf(ctx, hull, 4, 5);
    ctx.fillStyle = '#1b1d20'; rr(ctx, -16, -12, 32, 6, 2); ctx.fill(); rr(ctx, -16, 6, 32, 6, 2); ctx.fill();
    ctx.strokeStyle = '#3a3e44'; ctx.lineWidth = 1;
    for (let k = -16 + tr; k < 16; k += 4) { ctx.beginPath(); ctx.moveTo(k, -12); ctx.lineTo(k, -6); ctx.moveTo(k, 6); ctx.lineTo(k, 12); ctx.stroke(); }
    ctx.fillStyle = grad(ctx, -10, -8, 10, 8, '#8c6f55', '#4a3a2c'); rr(ctx, -13, -7, 26, 14, 3); ctx.fill();
    // Treibstofftanks
    for (const yy of [-4.5, 1]) { ctx.fillStyle = grad(ctx, 0, yy, 0, yy + 3.5, '#d8a24a', '#7a5520'); rr(ctx, -12, yy, 12, 3.5, 1.6); ctx.fill(); }
    ctx.fillStyle = color; ctx.fillRect(1, -7, 3, 14);
    ctx.fillStyle = '#2a2d31'; ctx.fillRect(6, -1.6, 13, 3.2);
    ctx.fillStyle = '#5a5f66'; ctx.fillRect(17, -2.2, 3, 4.4);
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,140,40,${0.5 + 0.4 * Math.sin(t * 14)})`; ctx.beginPath(); ctx.arc(21, 0, 2.2, 0, 6.28); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
  },
  schatten(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const st = o.moving ? Math.sin(t * 13) * 3 : 0.5;
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(2, 3, 7, 4.5, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#121214'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-1, -1.8); ctx.lineTo(-1 + st, -2.6); ctx.moveTo(-1, 1.8); ctx.lineTo(-1 - st, 2.6); ctx.stroke();
    ctx.fillStyle = grad(ctx, -5, -5, 5, 5, '#2b3a33', '#0c120f');
    ctx.beginPath(); ctx.moveTo(4, 0); ctx.quadraticCurveTo(-1, -6, -8, -3); ctx.lineTo(-9, 0); ctx.lineTo(-8, 3); ctx.quadraticCurveTo(-1, 6, 4, 0); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(-5, -3); ctx.lineTo(-5, 3); ctx.stroke();
    ctx.fillStyle = '#101512'; ctx.beginPath(); ctx.arc(1.8, 0, 2.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(120,255,170,0.9)'; ctx.fillRect(3.3, -0.9, 0.8, 0.6); ctx.fillRect(3.3, 0.3, 0.8, 0.6);
    ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = 'rgba(150,255,200,0.8)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(2, 3); ctx.lineTo(9, 4.4); ctx.stroke(); ctx.globalCompositeOperation = 'source-over';
  },
  bomber(ctx, u, color, t, o) { thopter(ctx, u, color, t, o, 'bomber'); },
  jaeger(ctx, u, color, t, o) { thopter(ctx, u, color, t, o, 'jaeger'); },
  schwester(ctx, u, color, t, o) {
    ctx.rotate(u.facing);
    const sway = o.moving ? Math.sin(t * 9) * 0.8 : Math.sin(t * 1.5) * 0.4;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(3, 4, 9, 6, 0, 0, 6.28); ctx.fill();
    // Aura
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, 14); g.addColorStop(0, 'rgba(190,120,255,0.25)'); g.addColorStop(1, 'rgba(190,120,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.fill();
    // Robe
    ctx.fillStyle = grad(ctx, -6, -6, 6, 6, '#3c2d4a', '#17111d');
    ctx.beginPath(); ctx.moveTo(5, 0); ctx.quadraticCurveTo(2, -7 - sway, -7, -6); ctx.lineTo(-8, 6); ctx.quadraticCurveTo(2, 7 + sway, 5, 0); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-7, -5.5); ctx.lineTo(-7.6, 5.5); ctx.stroke();
    // Kapuze und Schleier
    ctx.fillStyle = '#251b2e'; ctx.beginPath(); ctx.arc(2, 0, 3.6, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(210,170,255,0.9)'; ctx.fillRect(4.6, -1.2, 1.2, 0.8); ctx.fillRect(4.6, 0.6, 1.2, 0.8);
    ctx.strokeStyle = '#c9c2b0'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(2, 4); ctx.lineTo(8, 5); ctx.stroke();
  },
  soeldner(ctx, u, color, t, o) {
    const a = u.facing, ca = Math.cos(a), sa = Math.sin(a);
    for (const [px, py] of [[5, -5], [-4, 5]]) {
      ctx.save(); ctx.translate(px * ca - py * sa, px * sa + py * ca); ctx.rotate(a);
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2.5, 3, 5.5, 4.5, 0, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#1b1d20'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 2.5); ctx.lineTo(11, 2.5); ctx.stroke();
      ctx.fillStyle = '#7fd0ff'; ctx.fillRect(9, 1.8, 2, 1.4);
      ctx.fillStyle = grad(ctx, -4, -4, 4, 4, '#a8adb5', '#4a4f57'); ctx.beginPath(); ctx.ellipse(0, 0, 4, 5, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#d4a63a'; ctx.fillRect(-4, -1.4, 2.4, 2.8);
      ctx.fillStyle = grad(ctx, -2, -2, 2, 2, '#c9ced6', '#5b616a'); ctx.beginPath(); ctx.arc(0.8, 0, 2.6, 0, 6.28); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,90,0.95)'; ctx.fillRect(2.4, -1, 1, 2);
      ctx.restore();
    }
  },
  falke(ctx, u, color, t, o) { thopter(ctx, u, color, t, o, 'falke'); },
  traeger(ctx, u, color, t, o) { thopter(ctx, u, color, t, o, 'traeger'); },
};

let BANK = 0;
Object.assign(DRAW, VDRAW, IDRAW);
function wings(ctx, x, y, len, wid, a, flap, alpha = 1) {
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(s * a);
    const L = len * flap * (1 - s * BANK * 0.35);
    const g = ctx.createLinearGradient(0, 0, 0, s * L);
    g.addColorStop(0, `rgba(210,225,235,${0.85 * alpha})`); g.addColorStop(1, `rgba(170,190,205,${0.35 * alpha})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(-wid * 0.3, 0); ctx.quadraticCurveTo(-wid, s * L * 0.6, -wid * 0.2, s * L); ctx.quadraticCurveTo(wid * 0.6, s * L * 0.7, wid * 0.4, 0); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = `rgba(60,70,80,${0.5 * alpha})`; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-wid * 0.15, s * L * 0.95); ctx.stroke();
    ctx.restore();
  }
}

function thopter(ctx, u, color, t, o, kind) {
  const z = o.z ?? 26;
  const flapRate = kind === 'traeger' || kind === 'bomber' ? 12 : kind === 'jaeger' ? 24 : 19;
  const ph = t * flapRate + u.id;
  const flapA = 0.55 + 0.45 * Math.abs(Math.sin(ph));
  const flapB = 0.55 + 0.45 * Math.abs(Math.sin(ph + 1.3));
  BANK = o.bank || 0;
  const big = kind === 'traeger' ? 1.25 : kind === 'bomber' ? 1.3 : kind === 'adler' ? 1.3 : kind === 'falke' ? 1.1 : kind === 'jaeger' ? 1.0 : 0.95;
  // Bodenschatten
  ctx.save(); ctx.translate(z * 0.35, z * 0.45); ctx.rotate(u.facing); ctx.scale(big, big);
  ctx.fillStyle = `rgba(0,0,0,${0.28 - z * 0.003})`;
  ctx.beginPath(); ctx.ellipse(0, 0, 14, 5, 0, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(2, 0, 3, 16 * flapA, 0, 0, 6.28); ctx.ellipse(-6, 0, 2.5, 12 * flapB, 0, 0, 6.28); ctx.fill();
  ctx.restore();
  ctx.save(); ctx.translate(0, -z); ctx.rotate(u.facing); ctx.scale(big, big);
  const bank = o.bank || 0;
  if (bank) ctx.scale(1, 1 - Math.abs(bank) * 0.25);
  // Träger: getragene Einheit
  if (kind === 'traeger' && o.carry) {
    ctx.save(); ctx.scale(0.62, 0.62); ctx.rotate(-u.facing); o.carry(); ctx.restore();
  }
  // Flügel (hinten zuerst)
  wings(ctx, -6, 0, kind === 'traeger' ? 15 : 13, 6, 0.25, flapB, 0.9);
  // Motion-Blur-Fächer
  ctx.fillStyle = 'rgba(200,220,235,0.08)';
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.arc(2, 0, 19, -1.9, -1.2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(2, 0); ctx.arc(2, 0, 19, 1.2, 1.9); ctx.closePath(); ctx.fill();
  // Rumpf
  if (kind === 'traeger') {
    ctx.fillStyle = grad(ctx, 0, -6, 0, 6, M.light, M.dark); rr(ctx, -13, -5, 26, 10, 3); ctx.fill();
    ctx.strokeStyle = '#2a2d31'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(-9, 8); ctx.moveTo(7, -8); ctx.lineTo(7, 8); ctx.stroke();
    ctx.fillStyle = color; ctx.fillRect(-13, -5, 3, 10);
    ctx.fillStyle = M.glass; ctx.beginPath(); ctx.ellipse(11, 0, 4, 3.6, 0, 0, 6.28); ctx.fill();
  } else if (kind === 'adler') {
    ctx.fillStyle = grad(ctx, 0, -7, 0, 7, M.hi, M.dark);
    ctx.beginPath(); ctx.moveTo(18, 0); ctx.lineTo(8, -6); ctx.lineTo(-12, -5); ctx.lineTo(-18, -2); ctx.lineTo(-18, 2); ctx.lineTo(-12, 5); ctx.lineTo(8, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2a2d31'; rr(ctx, -4, -10, 12, 3.4, 1.2); ctx.fill(); rr(ctx, -4, 6.6, 12, 3.4, 1.2); ctx.fill();
    ctx.fillStyle = '#e0533a'; ctx.fillRect(7, -9.6, 2, 2.6); ctx.fillRect(7, 7, 2, 2.6);
    ctx.fillStyle = color; ctx.fillRect(-17, -2, 6, 4); ctx.fillRect(-6, -6, 2, 12);
    ctx.fillStyle = M.glass; ctx.beginPath(); ctx.ellipse(11, 0, 4.6, 3.4, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(12, -1, 1.8, 1, 0, 0, 6.28); ctx.fill();
  } else if (kind === 'bomber') {
    ctx.fillStyle = grad(ctx, 0, -7, 0, 7, M.light, M.dark);
    ctx.beginPath(); ctx.moveTo(15, 0); ctx.quadraticCurveTo(12, -7, 0, -7); ctx.lineTo(-14, -4); ctx.lineTo(-17, 0); ctx.lineTo(-14, 4); ctx.lineTo(0, 7); ctx.quadraticCurveTo(12, 7, 15, 0); ctx.fill();
    ctx.fillStyle = '#23262b'; rr(ctx, -9, -3.5, 12, 7, 2); ctx.fill();
    const ammo = u.ammo ?? 2;
    for (let k = 0; k < 2; k++) { ctx.fillStyle = k < ammo ? '#c8b26a' : '#3a3a3a'; ctx.beginPath(); ctx.ellipse(-6 + k * 6, 0, 2.4, 2, 0, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = color; ctx.fillRect(-14, -3, 4, 6);
    ctx.fillStyle = M.glass; ctx.beginPath(); ctx.ellipse(10, 0, 4, 4, 0, 0, 6.28); ctx.fill();
  } else if (kind === 'jaeger') {
    ctx.fillStyle = grad(ctx, 0, -4, 0, 4, M.hi, M.mid);
    ctx.beginPath(); ctx.moveTo(17, 0); ctx.lineTo(2, -3.6); ctx.lineTo(-13, -2); ctx.lineTo(-16, -5); ctx.lineTo(-17, 0); ctx.lineTo(-16, 5); ctx.lineTo(-13, 2); ctx.lineTo(2, 3.6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-12, -1.2, 18, 2.4);
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-2, -7, 9, 1.6); ctx.fillRect(-2, 5.4, 9, 1.6);
    ctx.fillStyle = '#e0533a'; ctx.fillRect(7, -7, 1.6, 1.6); ctx.fillRect(7, 5.4, 1.6, 1.6);
    ctx.fillStyle = M.glass; ctx.beginPath(); ctx.ellipse(9, 0, 3.6, 2.6, 0, 0, 6.28); ctx.fill();
  } else {
    const L = kind === 'falke' ? 15 : 14;
    ctx.fillStyle = grad(ctx, 0, -5, 0, 5, M.hi, M.mid);
    ctx.beginPath(); ctx.moveTo(L, 0); ctx.quadraticCurveTo(L * 0.6, -5, -2, -4.2); ctx.lineTo(-L, -1.5); ctx.lineTo(-L - 3, 0); ctx.lineTo(-L, 1.5); ctx.lineTo(-2, 4.2); ctx.quadraticCurveTo(L * 0.6, 5, L, 0); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-L + 1, -1.6, 6, 3.2);
    ctx.fillStyle = M.glass; ctx.beginPath(); ctx.ellipse(L * 0.55, 0, 4.2, 3.2, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.ellipse(L * 0.55 + 1, -1, 1.6, 1, 0, 0, 6.28); ctx.fill();
    if (kind === 'falke') {
      ctx.fillStyle = '#30343a';
      rr(ctx, -2, -8, 9, 3, 1.2); ctx.fill(); rr(ctx, -2, 5, 9, 3, 1.2); ctx.fill();
      const ammo = u.ammo ?? 3;
      for (let k = 0; k < 3; k++) { ctx.fillStyle = k < ammo ? '#e0533a' : '#444'; ctx.fillRect(5, k === 0 ? -7.5 : k === 1 ? 5.5 : -0.8, 2, 2); }
    } else {
      ctx.strokeStyle = '#22252a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(L - 1, 2.5); ctx.lineTo(L + 5, 2.5); ctx.stroke();
    }
  }
  // Vorderflügel
  wings(ctx, 2, 0, kind === 'traeger' ? 17 : kind === 'bomber' ? 19 : kind === 'jaeger' ? 14 : kind === 'falke' ? 17 : 16, kind === 'jaeger' ? 5 : 7, kind === 'jaeger' ? -0.5 : -0.15, flapA, 1);
  ctx.restore();
}

// ---------- Gebäude ----------
function foundation(ctx, r, color) {
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  hexP(ctx, 4, 5, r); ctx.fill();
  ctx.fillStyle = grad(ctx, -r, -r, r, r, '#9c8b72', '#4f4436');
  hexP(ctx, 0, 0, r); ctx.fill();
  ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 1;
  for (let k = -r; k < r; k += 9) { ctx.beginPath(); ctx.moveTo(k, -r * 0.8); ctx.lineTo(k + 6, r * 0.8); ctx.stroke(); }
  ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5; hexP(ctx, 0, 0, r - 1); ctx.stroke();
  ctx.strokeStyle = rgba(color, 0.7); ctx.lineWidth = 2; ctx.setLineDash([5, 4]); hexP(ctx, 0, 0, r - 4); ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
function hexP(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); const px = x + r * Math.cos(a), py = y + r * Math.sin(a); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.closePath();
}
function box(ctx, x, y, w, h, top, side, r = 3, height = 5) {
  height *= 1.6;
  ctx.fillStyle = 'rgba(0,0,0,0.38)'; rr(ctx, x + height * 0.9, y + height * 0.8, w, h, r); ctx.fill();
  ctx.fillStyle = side; rr(ctx, x, y + height * 0.5, w, h, r); ctx.fill();
  // Fensterschlitze an der Seitenwand
  if (w > 18) { ctx.fillStyle = 'rgba(255,190,110,0.55)'; for (let k = x + 4; k < x + w - 5; k += 7) ctx.fillRect(k, y + h + height * 0.2, 3, 1.4); }
  ctx.fillStyle = top; rr(ctx, x, y, w, h, r); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + w * 0.5, y + 2); ctx.lineTo(x + w * 0.5, y + h - 2); ctx.stroke();
  ctx.fillStyle = 'rgba(255,240,210,0.16)'; ctx.fillRect(x + r, y + 1, w - r * 2, 2);
}
function dome(ctx, x, y, r, col, glow) {
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x + r * 0.35, y + r * 0.45, r, 0, 6.28); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
  g.addColorStop(0, shade(col, 0.45)); g.addColorStop(1, shade(col, -0.35));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.28); ctx.fill();
  if (glow) { ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, r * 0.45, 0, 6.28); ctx.fill(); }
}

export function drawBuilding(ctx, b, x, y, color, t, o = {}) {
  ctx.save(); ctx.translate(x, y);
  const rise = b.rise ?? 1;
  if (b.turnsLeft <= 0 && hasArt(b.type)) {
    ctx.scale((0.8 + 0.2 * rise) * 1.12, (0.8 + 0.2 * rise) * 1.12);
    drawBuildingArt(ctx, b, color, t, o);
    ctx.restore(); return;
  }
  if (b.turnsLeft > 0 && hasArt(b.type)) {
    foundation(ctx, 33, color);
    const prog = 1 - b.turnsLeft / Math.max(1, b.def.turns);
    ctx.scale(1.12, 1.12);
    drawConstruction(ctx, b, color, t, prog);
    ctx.restore(); return;
  }
  foundation(ctx, 33, color);
  if (b.turnsLeft > 0) {
    // Baustelle
    ctx.strokeStyle = 'rgba(240,200,80,0.9)'; ctx.lineWidth = 1.5;
    for (let k = -18; k <= 18; k += 9) { ctx.beginPath(); ctx.moveTo(k, -18); ctx.lineTo(k, 18); ctx.moveTo(-18, k); ctx.lineTo(18, k); ctx.stroke(); }
    ctx.fillStyle = 'rgba(40,40,40,0.5)'; ctx.fillRect(-18, -18, 36, 36);
    const prog = 1 - b.turnsLeft / Math.max(1, b.def.turns);
    ctx.strokeStyle = color; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(0, 0, 13, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.08, prog)); ctx.stroke();
    // Kran
    ctx.save(); ctx.rotate(t * 0.4); ctx.fillStyle = '#e2b13c'; ctx.fillRect(-2, -2, 24, 4); ctx.fillStyle = '#333'; ctx.fillRect(18, -1, 2, 8); ctx.restore();
    ctx.restore(); return;
  }
  ctx.scale(0.75 + 0.25 * rise, 0.75 + 0.25 * rise);
  const f = BDRAW[b.type]; if (f) f(ctx, b, color, t, o);
  ctx.restore();
}

const BDRAW = {
  bauhof(ctx, b, color, t) {
    box(ctx, -22, -18, 44, 34, grad(ctx, 0, -18, 0, 16, '#bcaa8e', '#6e5f4b'), '#463a2e', 5, 6);
    box(ctx, -10, -24, 20, 14, '#d2c2a4', '#6e5f4b', 3, 4);
    ctx.fillStyle = color; ctx.fillRect(-22, 8, 44, 4);
    ctx.fillStyle = '#2a2e33'; rr(ctx, -14, -6, 28, 12, 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,200,120,0.75)'; for (let k = 0; k < 4; k++) ctx.fillRect(-12 + k * 7, -3, 4, 2);
    ctx.save(); ctx.translate(14, -14); ctx.rotate(Math.sin(t * 0.3) * 0.8 + 0.6);
    ctx.fillStyle = '#e2b13c'; ctx.fillRect(-2, -2, 26, 4); ctx.fillStyle = '#2a2a2a'; ctx.fillRect(22, -1, 2, 7);
    ctx.fillStyle = '#c99a2e'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 6.28); ctx.fill(); ctx.restore();
  },
  windfalle(ctx, b, color, t) {
    dome(ctx, -12, 10, 8, '#8f8270'); dome(ctx, 12, 10, 8, '#8f8270');
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(4, 2, 14, 0, 6.28); ctx.fill();
    const g = ctx.createRadialGradient(-5, -9, 2, 0, -4, 15); g.addColorStop(0, '#d8cbb2'); g.addColorStop(1, '#5a4d3d');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, -4, 14, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#23272c'; ctx.beginPath(); ctx.arc(0, -4, 10, 0, 6.28); ctx.fill();
    ctx.save(); ctx.translate(0, -4); ctx.rotate(t * 3);
    for (let k = 0; k < 3; k++) { ctx.rotate(Math.PI * 2 / 3); ctx.fillStyle = '#c8bba2'; ctx.beginPath(); ctx.ellipse(5, 0, 5, 2, 0.3, 0, 6.28); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(120,200,255,0.8)'; ctx.fillRect(-14, 9, 4, 2); ctx.fillRect(10, 9, 4, 2);
  },
  raffinerie(ctx, b, color, t, o) {
    box(ctx, -24, -6, 30, 22, grad(ctx, 0, -6, 0, 16, '#a39a8a', '#655d50'), '#433d35', 4, 5);
    const pulse = 0.5 + 0.5 * Math.sin(t * 3);
    dome(ctx, 13, -10, 10, '#97897a', `rgba(255,${130 + pulse * 40},40,${0.55 + (o.unloading ? 0.4 : 0)})`);
    dome(ctx, 13, 12, 8, '#97897a', 'rgba(255,140,50,0.5)');
    ctx.strokeStyle = '#43382c'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, 2); ctx.lineTo(13, -2); ctx.moveTo(4, 8); ctx.lineTo(10, 10); ctx.stroke();
    ctx.fillStyle = color; ctx.fillRect(-24, -6, 4, 22);
    ctx.fillStyle = '#2a2e33'; rr(ctx, -16, 0, 16, 10, 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,190,80,0.8)'; ctx.lineWidth = 1; for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-14, 2 + k * 3); ctx.lineTo(-2, 2 + k * 3); ctx.stroke(); }
    ctx.fillStyle = '#2b241d'; ctx.fillRect(-22, 17, 26, 4);
    ctx.fillStyle = 'rgba(255,150,60,0.85)'; for (let k = 0; k < 6; k++) { const xx = -22 + ((k * 5 + t * (o.unloading ? 30 : 6)) % 26); ctx.fillRect(xx, 18, 2.5, 2); }
  },
  kaserne(ctx, b, color, t, o = {}) {
    box(ctx, -20, -14, 40, 28, grad(ctx, 0, -14, 0, 14, '#a79f8f', '#6d6455'), '#463f36', 4, 5);
    ctx.fillStyle = '#7b7264'; for (let k = 0; k < 5; k++) ctx.fillRect(-18, -12 + k * 5.4, 36, 2.4);
    ctx.fillStyle = '#2a2e33'; ctx.fillRect(-5, 10, 10, 5);
    if (o.door) { ctx.fillStyle = `rgba(255,190,110,${o.door * 0.8})`; ctx.fillRect(-4, 11, 8, 3); }
    ctx.strokeStyle = '#333'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(16, -12); ctx.lineTo(16, -26); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(16, -26); ctx.quadraticCurveTo(22, -24 + Math.sin(t * 4) * 1.5, 27, -23); ctx.lineTo(16, -19); ctx.closePath(); ctx.fill();
  },
  fabrik(ctx, b, color, t, o = {}) {
    box(ctx, -26, -20, 52, 38, grad(ctx, 0, -20, 0, 18, '#bcaa8e', '#6a5b48'), '#43382c', 5, 6);
    ctx.fillStyle = '#5d4f3e'; for (let k = 0; k < 6; k++) ctx.fillRect(-24 + k * 8.5, -18, 6, 20);
    ctx.fillStyle = '#23272c'; rr(ctx, -14, 6, 28, 12, 2); ctx.fill();
    const door = o.door || 0;
    ctx.fillStyle = 'rgba(255,190,110,' + (0.2 + door * 0.6) + ')'; ctx.fillRect(-12, 8, 24, 8);
    ctx.fillStyle = '#5a4c3c'; for (let k = 0; k < 4; k++) ctx.fillRect(-14, 6 + k * 3 * (1 - door), 28, 2.2 * (1 - door) + 0.4);
    ctx.fillStyle = '#e2b13c'; for (let k = 0; k < 7; k++) ctx.fillRect(-14 + k * 4, 16, 2, 2);
    ctx.fillStyle = color; ctx.fillRect(-26, 2, 52, 3);
    dome(ctx, 18, -14, 5, '#7a6c58');
  },
  ausguck(ctx, b, color, t) {
    box(ctx, -14, -10, 28, 24, grad(ctx, 0, -10, 0, 14, '#c2b093', '#6e5f4b'), '#463a2e', 4, 5);
    ctx.fillStyle = color; ctx.fillRect(-14, 10, 28, 3);
    ctx.save(); ctx.translate(0, -6); ctx.rotate(t * 1.2);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(4, 6, 15, 5, 0, 0, 6.28); ctx.fill();
    const g = ctx.createLinearGradient(0, -6, 0, 6); g.addColorStop(0, '#dfe4ea'); g.addColorStop(1, '#7c848e');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -10); ctx.stroke();
    ctx.restore();
    ctx.fillStyle = `rgba(255,80,60,${0.5 + 0.5 * Math.sin(t * 5)})`; ctx.beginPath(); ctx.arc(10, 8, 1.8, 0, 6.28); ctx.fill();
  },
  horst(ctx, b, color, t) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.arc(3, 4, 24, 0, 6.28); ctx.fill();
    ctx.fillStyle = grad(ctx, -20, -20, 20, 20, '#9a8a72', '#5d4f3e'); ctx.beginPath(); ctx.arc(0, 0, 24, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(240,210,120,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 18, 0, 6.28); ctx.stroke();
    ctx.fillStyle = color; for (let k = 0; k < 3; k++) { ctx.save(); ctx.rotate(k * Math.PI * 2 / 3 + 0.3); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(4, -4); ctx.lineTo(4, 4); ctx.closePath(); ctx.fill(); ctx.restore(); }
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; const on = Math.floor(t * 6) % 8 === k; ctx.fillStyle = on ? 'rgba(160,240,255,1)' : 'rgba(90,140,160,0.6)'; ctx.beginPath(); ctx.arc(Math.cos(a) * 22, Math.sin(a) * 22, on ? 2.2 : 1.4, 0, 6.28); ctx.fill(); }
    box(ctx, 14, -26, 12, 12, '#c4b498', '#5f513f', 2, 4);
    ctx.fillStyle = M.glass; ctx.fillRect(16, -24, 8, 3);
  },
  kontor(ctx, b, color, t) {
    box(ctx, -20, -10, 40, 26, grad(ctx, 0, -10, 0, 16, '#8f8a99', '#4d4956'), '#36333d', 5, 6);
    ctx.fillStyle = '#d4a63a'; ctx.beginPath(); ctx.arc(-8, 3, 6, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#2a2730'; ctx.beginPath(); ctx.arc(-8, 3, 3.5, 0, 6.28); ctx.fill();
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + t * 0.5; ctx.fillStyle = '#f2d27a'; ctx.beginPath(); ctx.arc(-8 + Math.cos(a) * 8.5, 3 + Math.sin(a) * 8.5, 1.1, 0, 6.28); ctx.fill(); }
    ctx.fillStyle = color; ctx.fillRect(-20, 12, 40, 3);
    // Sendeantenne
    ctx.strokeStyle = '#2c2c30'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(10, 4); ctx.lineTo(10, -26); ctx.stroke();
    ctx.save(); ctx.translate(10, -14); ctx.rotate(Math.sin(t * 0.6) * 0.5);
    ctx.fillStyle = grad(ctx, -10, 0, 10, 0, '#e2e6ec', '#7d848e'); ctx.beginPath(); ctx.ellipse(0, 0, 11, 4, 0, 0, 6.28); ctx.fill(); ctx.restore();
    const pulse = (t * 0.8) % 1;
    ctx.strokeStyle = `rgba(255,220,130,${1 - pulse})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(10, -26, 3 + pulse * 18, 0, 6.28); ctx.stroke();
  },
  konvent(ctx, b, color, t) {
    for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; box(ctx, Math.cos(a) * 18 - 3, Math.sin(a) * 18 - 3, 6, 6, '#6e6478', '#3b3443', 2, 3); }
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(4, 5, 16, 0, 6.28); ctx.fill();
    const g = ctx.createRadialGradient(-5, -6, 2, 0, 0, 16); g.addColorStop(0, '#b6a6c6'); g.addColorStop(1, '#3a2f46');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 16, 0, 6.28); ctx.fill();
    ctx.strokeStyle = 'rgba(30,20,40,0.6)'; ctx.lineWidth = 1;
    for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16); ctx.stroke(); }
    const pl = 0.5 + 0.5 * Math.sin(t * 2);
    const g2 = ctx.createRadialGradient(0, 0, 0, 0, 0, 8); g2.addColorStop(0, `rgba(210,150,255,${0.6 + pl * 0.4})`); g2.addColorStop(1, 'rgba(210,150,255,0)');
    ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(0, 0, 8, 0, 6.28); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 17, 0.3, 1.2); ctx.stroke();
  },
  felsenhort(ctx, b, color, t) {
    // Felsnase mit Höhleneingang, Tuchsegel und Wasserzisterne
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(5, 6, 26, 18, 0, 0, 6.28); ctx.fill();
    const g = ctx.createRadialGradient(-8, -10, 4, 0, 0, 28); g.addColorStop(0, '#b19a7c'); g.addColorStop(1, '#4e4031');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-24, 8); ctx.quadraticCurveTo(-26, -16, -6, -22); ctx.quadraticCurveTo(18, -24, 24, -4); ctx.quadraticCurveTo(26, 12, 10, 16); ctx.quadraticCurveTo(-10, 20, -24, 8); ctx.fill();
    ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = 1; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-18 + k * 9, -14 + k); ctx.lineTo(-12 + k * 9, 4); ctx.stroke(); }
    ctx.fillStyle = '#1a120c'; ctx.beginPath(); ctx.ellipse(2, 6, 9, 6, 0, Math.PI, 0); ctx.lineTo(11, 9); ctx.lineTo(-7, 9); ctx.fill();
    ctx.fillStyle = `rgba(90,160,255,${0.5 + 0.3 * Math.sin(t * 2)})`; ctx.beginPath(); ctx.arc(2, 5, 2.2, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(214,190,150,0.9)'; ctx.beginPath(); ctx.moveTo(-18, -6); ctx.lineTo(-4, -12 + Math.sin(t * 3) * 1.5); ctx.lineTo(-6, -2); ctx.closePath(); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(10, -14); ctx.lineTo(20, -10 + Math.sin(t * 3.5) * 1.5); ctx.lineTo(12, -6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a8e9c'; ctx.beginPath(); ctx.arc(-14, 10, 4, 0, 6.28); ctx.fill(); ctx.fillStyle = 'rgba(120,190,255,0.8)'; ctx.beginPath(); ctx.arc(-14, 10, 2.4, 0, 6.28); ctx.fill();
  },
  turm(ctx, b, color, t, o) {
    dome(ctx, 0, 0, 15, '#8d7f6b');
    ctx.save(); ctx.rotate(b.facing);
    const rec = o.recoil || 0;
    ctx.fillStyle = '#202327'; ctx.fillRect(4 - rec * 4, -2.5, 20, 5);
    ctx.fillStyle = grad(ctx, -8, -8, 8, 8, '#d4c7ad', '#6e5f4b'); rr(ctx, -9, -8, 16, 16, 3); ctx.fill();
    ctx.fillStyle = color; ctx.fillRect(-9, -8, 3, 16);
    ctx.restore();
  },
  flak(ctx, b, color, t, o) {
    dome(ctx, 0, 0, 14, '#8d7f6b');
    ctx.save(); ctx.rotate(b.facing);
    ctx.fillStyle = '#202327'; ctx.fillRect(2, -5, 18, 3); ctx.fillRect(2, 2, 18, 3);
    ctx.fillStyle = grad(ctx, -8, -8, 8, 8, '#d4c7ad', '#6e5f4b'); ctx.beginPath(); ctx.arc(0, 0, 8, 0, 6.28); ctx.fill();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(-2, 0, 3, 0, 6.28); ctx.fill();
    ctx.restore();
  },
};

// ---------- Wurm ----------
export function drawWormSign(ctx, x, y, t, a = 1, scale = 1) {
  // Sandbuckel über dem Wurm: Licht oben links, Schatten unten rechts, Wellen im Sand
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const breathe = 1 + Math.sin(t * 1.4) * 0.06;
  const sh = ctx.createRadialGradient(4, 3, 2, 4, 3, 22 * breathe);
  sh.addColorStop(0, `rgba(80,48,22,${0.4 * a})`); sh.addColorStop(1, 'rgba(80,48,22,0)');
  ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(4, 3, 24 * breathe, 16 * breathe, 0.4, 0, 6.28); ctx.fill();
  const hi = ctx.createRadialGradient(-5, -4, 1, -3, -2, 16 * breathe);
  hi.addColorStop(0, `rgba(255,230,185,${0.5 * a})`); hi.addColorStop(1, 'rgba(255,230,185,0)');
  ctx.fillStyle = hi; ctx.beginPath(); ctx.ellipse(-3, -2, 17 * breathe, 11 * breathe, 0.4, 0, 6.28); ctx.fill();
  for (let k = 0; k < 4; k++) {
    const ph = (((t * 0.45 + k / 4) % 1) + 1) % 1, rx = 10 + ph * 34, ry = 7 + ph * 24, al = (1 - ph) * a;
    ctx.lineWidth = 1.6 * (1 - ph) + 0.6;
    ctx.strokeStyle = `rgba(255,232,190,${0.32 * al})`; ctx.beginPath(); ctx.ellipse(-0.8, -0.8, rx, ry, 0.4, 2.6, 5.8); ctx.stroke();
    ctx.strokeStyle = `rgba(90,55,25,${0.38 * al})`; ctx.beginPath(); ctx.ellipse(0.8, 0.8, rx, ry, 0.4, -0.6, 2.6); ctx.stroke();
  }
  // rieselnde Körner auf dem Buckel
  ctx.fillStyle = `rgba(240,205,150,${0.6 * a})`;
  for (let k = 0; k < 8; k++) { const ph = (t * 0.7 + k * 0.125) % 1, an = k * 0.785; ctx.fillRect(Math.cos(an) * (3 + ph * 12), Math.sin(an) * (2 + ph * 8), 1.2, 1.2); }
  ctx.restore();
}

let wormSkin = null;
function wormSkinPattern(ctx) {
  if (wormSkin) return wormSkin;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#808080'; c.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) {
    const x = Math.random() * 128, y = Math.random() * 128, r = 0.6 + Math.random() * 2.6, v = Math.random();
    c.fillStyle = v < 0.5 ? `rgba(40,25,15,${0.25 + Math.random() * 0.3})` : `rgba(230,200,160,${0.12 + Math.random() * 0.2})`;
    c.beginPath(); c.ellipse(x, y, r * 1.6, r, Math.random() * 0.4, 0, 6.28); c.fill();
  }
  for (let i = 0; i < 0; i++) { c.strokeStyle = 'rgba(30,18,10,0.35)'; c.lineWidth = 0.7; c.beginPath(); const x = Math.random() * 128, y = Math.random() * 128; c.moveTo(x, y); c.bezierCurveTo(x + 6, y + 3, x + 10, y - 2, x + 18, y + 1); c.stroke(); }
  wormSkin = ctx.createPattern(cv, 'repeat');
  return wormSkin;
}

export function drawWormMaw(ctx, x, y, t, k, scale = 1) {
  // k: 0..1 Auftauchen — durchgehender, gerippter Leib mit aufklaffendem Schlund
  const R = 30 * scale * (0.6 + 0.4 * k), h = 74 * scale * k;
  const lean = 0.6 * R + Math.sin(t * 0.9) * 3 * scale;
  ctx.save(); ctx.translate(x, y);
  // Schatten und Sandkragen
  ctx.fillStyle = `rgba(0,0,0,${0.32 * k})`; ctx.beginPath(); ctx.ellipse(R * 1.4 + h * 0.35, R * 0.5 + h * 0.15, R * 1.5 + h * 0.2, R * 0.6, 0.25, 0, 6.28); ctx.fill();
  const col = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 1.9);
  col.addColorStop(0, `rgba(60,36,18,${0.85 * k})`); col.addColorStop(0.45, `rgba(176,128,78,${0.9 * k})`); col.addColorStop(0.7, `rgba(226,186,128,${0.75 * k})`); col.addColorStop(1, 'rgba(214,170,110,0)');
  ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.9, R * 1.05, 0, 0, 6.28); ctx.fill();
  // Mittellinie des Leibs
  const C = (f) => ({ x: lean * f * f, y: -h * f });
  const rad = (f) => R * (1.18 - 0.22 * f) * (1 + Math.sin(f * 14 - t * 3) * 0.025);
  const N = 36, left = [], right = [];
  for (let i = 0; i <= N; i++) { const f = i / N, c = C(f), r = rad(f); left.push([c.x - r, c.y]); right.push([c.x + r, c.y]); }
  // Leib in gebogenen Bändern; Ringwülste stecken in der Helligkeit, keine Linien
  const ribsN = 3 + 1.5 * scale;
  const tone = (rgb, m) => `rgb(${Math.round(rgb[0] * m)},${Math.round(rgb[1] * m)},${Math.round(rgb[2] * m)})`;
  const STOPS = [[0, [36, 22, 12]], [0.16, [100, 72, 48]], [0.36, [176, 138, 96]], [0.52, [138, 102, 70]], [0.82, [58, 38, 22]], [1, [21, 12, 6]]];
  for (let i = 0; i < N; i++) {
    const f0 = i / N, f1 = (i + 1) / N, c0 = C(f0), c1 = C(f1), r0 = rad(f0), r1 = rad(f1), cm = (c0.x + c1.x) / 2, rm = (r0 + r1) / 2;
    const fm = (f0 + f1) / 2, rib = Math.pow(0.5 + 0.5 * Math.cos(fm * ribsN * 6.283 + 0.6), 4), lip = Math.pow(0.5 + 0.5 * Math.cos(fm * ribsN * 6.283 + 0.6 - 0.9), 6);
    const m = 1 - rib * 0.42 + lip * 0.22;
    const g = ctx.createLinearGradient(cm - rm, 0, cm + rm, 0);
    for (const [o, c] of STOPS) g.addColorStop(o, tone(c, m));
    ctx.fillStyle = g; ctx.beginPath();
    ctx.ellipse(c0.x, c0.y + 1, r0, r0 * 0.46, 0, 0, Math.PI);
    ctx.lineTo(c1.x - r1, c1.y);
    ctx.ellipse(c1.x, c1.y, r1, r1 * 0.46, 0, Math.PI, 0, true);
    ctx.closePath(); ctx.fill();
  }
  // Hautstruktur im Umriss
  const body = new Path2D();
  body.moveTo(left[0][0], left[0][1]); for (const p of left) body.lineTo(p[0], p[1]);
  for (let i = right.length - 1; i >= 0; i--) body.lineTo(right[i][0], right[i][1]);
  body.closePath();
  ctx.save(); ctx.clip(body);
  ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.8; ctx.fillStyle = wormSkinPattern(ctx);
  ctx.translate(0, -t * 6); ctx.fillRect(-R * 3, -h - R * 2 + t * 6, R * 6 + lean, h + R * 4); ctx.restore();
  // Randlicht rechts (Himmelsreflex)
  ctx.strokeStyle = 'rgba(255,220,170,0.18)'; ctx.lineWidth = 1.4 * scale; ctx.beginPath(); right.forEach((p, i) => i ? ctx.lineTo(p[0] - 2, p[1]) : ctx.moveTo(p[0] - 2, p[1])); ctx.stroke();
  // Sand rieselt in Strähnen herab
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1, ph = ((t * 0.9 + i * 0.137) % 1), f = 1 - ph, c = C(f), r = rad(f);
    const sx = c.x + side * r * (0.4 + (i % 5) * 0.12);
    const sg = ctx.createLinearGradient(0, c.y, 0, c.y + 10 * scale); sg.addColorStop(0, `rgba(226,186,128,${0.7 * (1 - ph)})`); sg.addColorStop(1, 'rgba(226,186,128,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(sx - 1.1 * scale, c.y); ctx.lineTo(sx + 1.1 * scale, c.y); ctx.lineTo(sx + 0.3 * scale, c.y + 10 * scale); ctx.lineTo(sx - 0.3 * scale, c.y + 10 * scale); ctx.fill();
  }
  // Sandlippe vorne über dem Leibansatz
  { const r0 = rad(0), sl = ctx.createLinearGradient(0, -r0 * 0.1, 0, r0 * 0.7);
    sl.addColorStop(0, `rgba(236,198,140,${0.95 * k})`); sl.addColorStop(1, `rgba(170,124,76,${0.9 * k})`);
    ctx.fillStyle = sl; ctx.beginPath(); ctx.ellipse(0, r0 * 0.12, r0 * 1.22, r0 * 0.52, 0, 0.05, Math.PI - 0.05); ctx.ellipse(0, -r0 * 0.02, r0 * 1.05, r0 * 0.4, 0, Math.PI - 0.1, 0.1, true); ctx.closePath(); ctx.fill();
    for (let q = 0; q < 16; q++) { const a = 0.2 + q * 0.17 + Math.sin(q * 5.3) * 0.08, rr = r0 * (1.0 + Math.sin(q * 2.7) * 0.12); ctx.fillStyle = q % 3 ? `rgba(250,225,180,${0.35 * k})` : `rgba(120,80,45,${0.35 * k})`; ctx.beginPath(); ctx.ellipse(Math.cos(a) * rr, Math.sin(a) * rr * 0.46 + r0 * 0.1, (1.5 + (q % 4)) * scale, (0.8 + (q % 3) * 0.4) * scale, 0, 0, 6.28); ctx.fill(); } }
  // ---------- Schlund ----------
  const top = C(1); ctx.translate(top.x, top.y);
  const Rm = rad(1);
  // Drei Lippenlappen, nach außen geklappt, Innenseite fleischig
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * 6.28 - 1.57 + 0.4 + Math.sin(t * 1.3 + i * 2) * 0.06;
    ctx.save(); ctx.scale(1, 0.55); ctx.rotate(a); ctx.translate(Rm * 0.62, 0);
    const L = Rm * (0.6 + 0.85 * k), Wd = Rm * 0.85;
    const outer = ctx.createLinearGradient(0, 0, L, 0); outer.addColorStop(0, '#3a2414'); outer.addColorStop(1, '#a8845c');
    ctx.fillStyle = outer; ctx.beginPath(); ctx.moveTo(0, -Wd); ctx.bezierCurveTo(L * 0.8, -Wd * 0.9, L * 1.15, -Wd * 0.25, L, 0); ctx.bezierCurveTo(L * 1.15, Wd * 0.25, L * 0.8, Wd * 0.9, 0, Wd); ctx.closePath(); ctx.fill();
    const inner = ctx.createLinearGradient(0, 0, L, 0); inner.addColorStop(0, '#2a0c08'); inner.addColorStop(0.5, '#8a3a26'); inner.addColorStop(1, '#c8765a');
    ctx.fillStyle = inner; ctx.beginPath(); ctx.moveTo(0, -Wd * 0.72); ctx.bezierCurveTo(L * 0.7, -Wd * 0.65, L * 0.95, -Wd * 0.15, L * 0.86, 0); ctx.bezierCurveTo(L * 0.95, Wd * 0.15, L * 0.7, Wd * 0.65, 0, Wd * 0.72); ctx.closePath(); ctx.fill();
    // Falten
    ctx.strokeStyle = 'rgba(40,10,6,0.45)'; ctx.lineWidth = 0.9 * scale;
    for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(2, j * Wd * 0.25); ctx.quadraticCurveTo(L * 0.5, j * Wd * 0.2, L * 0.82, j * Wd * 0.04); ctx.stroke(); }
    // Zahnreihe am Lappen
    for (let j = -4; j <= 4; j++) {
      const ty = j * Wd * 0.16, tx = L * (0.25 + (1 - Math.abs(j) / 4) * 0.45);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.moveTo(tx, ty - 1.6 * scale); ctx.lineTo(tx - 6 * scale * k, ty + 0.8); ctx.lineTo(tx, ty + 1.6 * scale); ctx.fill();
      ctx.fillStyle = '#e4d4b2'; ctx.beginPath(); ctx.moveTo(tx, ty - 1.4 * scale); ctx.lineTo(tx - 6 * scale * k, ty); ctx.lineTo(tx, ty + 1.4 * scale); ctx.fill();
    }
    ctx.restore();
  }
  // Schlundrand
  const rim = ctx.createRadialGradient(-Rm * 0.2, -Rm * 0.15, Rm * 0.3, 0, 0, Rm * 1.05);
  rim.addColorStop(0, '#3a1a0c'); rim.addColorStop(0.75, '#7a5236'); rim.addColorStop(1, '#b89068');
  ctx.fillStyle = rim; ctx.beginPath(); ctx.ellipse(0, 0, Rm, Rm * 0.56, 0, 0, 6.28); ctx.fill();
  // Tiefe: Zahnringe, die nach innen kleiner und dunkler werden
  for (let ring = 0; ring < 5; ring++) {
    const rr = Rm * (0.86 - ring * 0.15), n = 26 - ring * 4, dk = 1 - ring * 0.17;
    const thr = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
    thr.addColorStop(0, '#050201'); thr.addColorStop(0.7, `rgb(${Math.round(60 * dk)},${Math.round(22 * dk)},${Math.round(12 * dk)})`); thr.addColorStop(1, `rgb(${Math.round(110 * dk)},${Math.round(50 * dk)},${Math.round(30 * dk)})`);
    ctx.fillStyle = thr; ctx.beginPath(); ctx.ellipse(0, rr * 0.05, rr, rr * 0.56, 0, 0, 6.28); ctx.fill();
    const spin = t * (ring % 2 ? 0.55 : -0.4);
    for (let i = 0; i < n; i++) {
      const a = i / n * 6.28 + spin, len = (7 - ring) * scale * k;
      const b0 = Math.round(240 * dk), b1 = Math.round(226 * dk), b2 = Math.round(196 * dk);
      ctx.fillStyle = `rgb(${b0},${b1},${b2})`;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a - 0.09) * rr, Math.sin(a - 0.09) * rr * 0.56);
      ctx.lineTo(Math.cos(a) * (rr - len), Math.sin(a) * (rr - len) * 0.56);
      ctx.lineTo(Math.cos(a + 0.09) * rr, Math.sin(a + 0.09) * rr * 0.56);
      ctx.fill();
    }
  }
  // Glimmen tief im Schlund und Gewürzstaub, der herausweht
  ctx.globalCompositeOperation = 'lighter';
  const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, Rm * 0.45); gl.addColorStop(0, `rgba(255,130,50,${0.5 * k})`); gl.addColorStop(1, 'rgba(255,110,40,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.ellipse(0, 0, Rm * 0.45, Rm * 0.28, 0, 0, 6.28); ctx.fill();
  for (let i = 0; i < 10; i++) {
    const ph = (t * 0.5 + i * 0.1) % 1, a = i * 2.4;
    ctx.fillStyle = `rgba(255,160,80,${0.5 * (1 - ph) * k})`;
    ctx.beginPath(); ctx.arc(Math.cos(a) * Rm * 0.3 * ph * 2, -ph * 30 * scale + Math.sin(a) * Rm * 0.15, 1.3 * scale, 0, 6.28); ctx.fill();
  }
  ctx.restore();
}

// ---------- Wurm von oben ----------
// Rücken als gerippter Schlauch entlang eines Pfads (Draufsicht), gleitet mit t
export function drawWormBody(ctx, pts, width, t, scale = 1) {
  if (pts.length < 2) return;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const n = pts.length;
  // Breite: am Schwanzende (Index 0) taucht der Leib in den Sand — schmaler
  const wAt = (i) => width * (0.55 + 0.45 * Math.min(1, i / (n * 0.35)));
  const seg = (i, w, col) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[i + 1][0], pts[i + 1][1]); ctx.stroke(); };
  ctx.save(); ctx.translate(10 * scale, 9 * scale); ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts) ctx.lineTo(p[0], p[1]); ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = width * 0.85; ctx.stroke(); ctx.restore();
  for (const [f, col] of [[1, '#3a2516'], [0.82, '#5e4229'], [0.58, '#8a6646'], [0.32, '#a98460'], [0.1, '#c9a277']]) for (let i = 0; i < n - 1; i++) seg(i, wAt(i) * f, col);
  // Ringwülste, wandern mit der Bewegung
  let acc = 0; const step = 10 * scale, off = (t * 40 * scale) % step;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], L = Math.hypot(x1 - x0, y1 - y0); if (L < 0.01) continue;
    const ux = (x1 - x0) / L, uy = (y1 - y0) / L, nx = -uy, ny = ux, hw = wAt(i) * 0.46;
    for (let d = (step - ((acc + off) % step)) % step; d < L; d += step) {
      const cx = x0 + ux * d, cy = y0 + uy * d;
      ctx.strokeStyle = 'rgba(25,14,7,0.32)'; ctx.lineWidth = 2.2 * scale;
      ctx.beginPath(); ctx.moveTo(cx + nx * hw, cy + ny * hw); ctx.quadraticCurveTo(cx + ux * 3 * scale, cy + uy * 3 * scale, cx - nx * hw, cy - ny * hw); ctx.stroke();
      ctx.strokeStyle = 'rgba(240,210,165,0.14)'; ctx.lineWidth = 1.4 * scale;
      ctx.beginPath(); ctx.moveTo(cx + nx * hw * 0.8 - ux * 2.5, cy + ny * hw * 0.8 - uy * 2.5); ctx.quadraticCurveTo(cx, cy, cx - nx * hw * 0.8 - ux * 2.5, cy - ny * hw * 0.8 - uy * 2.5); ctx.stroke();
    }
    acc += L;
  }
  // Sandwälle, wo der Leib in den Sand eintaucht (beide Enden)
  // nur Bugwellen: Sand schiebt sich seitlich an den Eintauchstellen auf, Leib bleibt sichtbar
  for (const [i0, i1] of [[0, 1], [n - 1, n - 2]]) {
    const [x, y] = pts[i0], [xb, yb] = pts[i1], a = Math.atan2(y - yb, x - xb), w = wAt(Math.min(i0, n - 2));
    ctx.save(); ctx.translate(x, y); ctx.rotate(a);
    const g = ctx.createRadialGradient(w * 0.15, 0, w * 0.1, w * 0.15, 0, w * 0.75);
    g.addColorStop(0, 'rgba(214,170,112,0.9)'); g.addColorStop(1, 'rgba(214,170,112,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(w * 0.15, 0, w * 0.45, w * 0.75, 0, 0, 6.28); ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// Kopf von oben: k = Höhe (0..1, wächst Richtung Kamera), open = Schlund offen (0..1)
export function drawWormTop(ctx, x, y, t, k, scale = 1, dir = 0, open = 1) {
  const Rm = 24 * scale * (0.75 + 0.45 * k);
  ctx.save(); ctx.translate(x, y);
  // Sandkragen am Austritt
  const col = ctx.createRadialGradient(0, 0, Rm * 0.6, 0, 0, Rm * 2.2);
  col.addColorStop(0, `rgba(70,42,20,${0.7 * k})`); col.addColorStop(0.45, `rgba(190,140,86,${0.75 * k})`); col.addColorStop(0.7, `rgba(236,198,140,${0.5 * k})`); col.addColorStop(1, 'rgba(214,170,110,0)');
  ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, Rm * 2.2, 0, 6.28); ctx.fill();
  // Schatten: je höher, desto weiter versetzt
  ctx.fillStyle = `rgba(0,0,0,${0.35 * k})`; ctx.beginPath(); ctx.arc(14 * scale * k, 12 * scale * k, Rm * 1.02, 0, 6.28); ctx.fill();
  ctx.rotate(dir);
  // Hautscheibe mit Ringwülsten
  const skin = ctx.createRadialGradient(-Rm * 0.35, -Rm * 0.35, Rm * 0.1, 0, 0, Rm);
  skin.addColorStop(0, '#c49a6c'); skin.addColorStop(0.6, '#7e5a3c'); skin.addColorStop(1, '#2e1d12');
  ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(0, 0, Rm, 0, 6.28); ctx.fill();
  for (let i = 1; i <= 3; i++) { ctx.strokeStyle = 'rgba(25,14,7,0.2)'; ctx.lineWidth = 1.4 * scale; ctx.beginPath(); ctx.arc(0, 0, Rm * (1 - i * 0.09), 0, 6.28); ctx.stroke(); }
  // Hautplatten
  ctx.fillStyle = 'rgba(30,18,10,0.3)';
  for (let i = 0; i < 18; i++) { const a = i / 18 * 6.28; ctx.save(); ctx.rotate(a); ctx.fillRect(Rm * 0.84, -1.2 * scale, Rm * 0.12, 2.4 * scale); ctx.restore(); }
  const o = Math.max(0, Math.min(1, open));
  if (o < 0.05) {
    // geschlossen: dreifache Naht
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const a = i * 2.094 + 1.047; ctx.strokeStyle = 'rgba(30,14,8,0.55)'; ctx.lineWidth = 1.6 * scale; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(Math.cos(a + 0.3) * Rm * 0.4, Math.sin(a + 0.3) * Rm * 0.4, Math.cos(a) * Rm * 0.66, Math.sin(a) * Rm * 0.66); ctx.stroke(); }
    ctx.fillStyle = 'rgba(255,225,180,0.18)'; ctx.beginPath(); ctx.arc(-Rm * 0.25, -Rm * 0.25, Rm * 0.35, 0, 6.28); ctx.fill();
  } else {
    // drei Lippen klappen nach außen und liegen über dem Kragen
    for (let i = 0; i < 3; i++) {
      const a = i * 2.094 + 1.047 + Math.sin(t * 1.3 + i * 2) * 0.05;
      ctx.save(); ctx.rotate(a);
      const L = Rm * (0.45 + 0.75 * o), Wd = Rm * 0.9;
      ctx.translate(Rm * 0.3 * o, 0);
      const outer = ctx.createLinearGradient(0, 0, L, 0); outer.addColorStop(0, '#4a2e1a'); outer.addColorStop(1, '#a8845c');
      const lip = (dx, dy, sc2) => { ctx.beginPath(); ctx.moveTo(dx, -Wd * sc2 + dy); ctx.bezierCurveTo(L * 0.7 + dx, -Wd * 0.95 * sc2 + dy, L * 1.12 + dx, -Wd * 0.45 * sc2 + dy, L + dx, dy); ctx.bezierCurveTo(L * 1.12 + dx, Wd * 0.45 * sc2 + dy, L * 0.7 + dx, Wd * 0.95 * sc2 + dy, dx, Wd * sc2 + dy); ctx.closePath(); };
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; lip(3, 3, 1); ctx.fill();
      ctx.fillStyle = outer; lip(0, 0, 1); ctx.fill();
      const inner = ctx.createLinearGradient(0, 0, L, 0); inner.addColorStop(0, '#3a0e08'); inner.addColorStop(0.55, '#8e3a26'); inner.addColorStop(1, '#c8765a');
      ctx.fillStyle = inner; ctx.save(); ctx.scale(0.9, 1); lip(0, 0, 0.74); ctx.restore(); ctx.fill();
      ctx.strokeStyle = 'rgba(40,10,6,0.45)'; ctx.lineWidth = 0.9 * scale;
      for (let j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(2, j * Wd * 0.22); ctx.quadraticCurveTo(L * 0.5, j * Wd * 0.18, L * 0.8, j * Wd * 0.04); ctx.stroke(); }
      for (let j = -4; j <= 4; j++) {
        const ty = j * Wd * 0.15, tx = L * (0.3 + (1 - Math.abs(j) / 4) * 0.42);
        ctx.fillStyle = 'rgba(226,210,176,0.85)'; ctx.beginPath(); ctx.moveTo(tx, ty - 1 * scale); ctx.lineTo(tx - 3.5 * scale * o, ty); ctx.lineTo(tx, ty + 1 * scale); ctx.fill();
      }
      ctx.restore();
    }
    // Schlundöffnung mit Zahnringen, die nach innen kleiner und dunkler werden
    const hole = Rm * 0.72 * o;
    for (let ring = 0; ring < 5; ring++) {
      const rr = hole * (1 - ring * 0.17), n = 26 - ring * 4, dk = 1 - ring * 0.18;
      const thr = ctx.createRadialGradient(0, 0, 0, 0, 0, rr);
      thr.addColorStop(0, '#040100'); thr.addColorStop(0.7, `rgb(${60 * dk | 0},${22 * dk | 0},${12 * dk | 0})`); thr.addColorStop(1, `rgb(${110 * dk | 0},${50 * dk | 0},${30 * dk | 0})`);
      ctx.fillStyle = thr; ctx.beginPath(); ctx.arc(0, 0, rr, 0, 6.28); ctx.fill();
      const spin = t * (ring % 2 ? 0.6 : -0.45);
      ctx.fillStyle = `rgb(${236 * dk | 0},${222 * dk | 0},${192 * dk | 0})`;
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + spin, len = (6.5 - ring) * scale * o;
        ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.09) * rr, Math.sin(a - 0.09) * rr); ctx.lineTo(Math.cos(a) * (rr - len), Math.sin(a) * (rr - len)); ctx.lineTo(Math.cos(a + 0.09) * rr, Math.sin(a + 0.09) * rr); ctx.fill();
      }
    }
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, hole * 0.45); gl.addColorStop(0, `rgba(255,130,50,${0.55 * o})`); gl.addColorStop(1, 'rgba(255,110,40,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, hole * 0.45, 0, 6.28); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  // Sand rieselt vom Rand nach außen
  ctx.fillStyle = `rgba(232,192,135,${0.75 * k})`;
  for (let i = 0; i < 20; i++) { const a = i * 0.314 + t * 0.2, ph = ((t * 0.9 + i * 0.13) % 1); const rr = Rm * (1 + ph * 0.6); ctx.fillRect(Math.cos(a) * rr - 1, Math.sin(a) * rr - 1, 2.2 * scale * (1 - ph), 2.2 * scale * (1 - ph)); }
  ctx.restore();
}

// ---------- Kachel-Icons für das Menü ----------
const iconCache = new Map();
const iconBg = {};
function iconBackdrop(sky) {
  if (iconBg[sky]) return iconBg[sky];
  const W = 240, H = 180, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const g = c.createLinearGradient(0, 0, W * 0.3, H);
  if (sky) { g.addColorStop(0, '#e6c7a0'); g.addColorStop(1, '#b48456'); } else { g.addColorStop(0, '#d9ad74'); g.addColorStop(1, '#9a6a3c'); }
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // Sandrippel
  for (let k = 0; k < 70; k++) {
    const x = Math.random() * W, y = Math.random() * H, len = 14 + Math.random() * 30;
    c.strokeStyle = 'rgba(255,236,200,0.22)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + len / 2, y - 3, x + len, y + 2); c.stroke();
    c.strokeStyle = 'rgba(110,70,35,0.16)'; c.beginPath(); c.moveTo(x + 1, y + 2.5); c.quadraticCurveTo(x + len / 2 + 1, y - 0.5, x + len + 1, y + 4.5); c.stroke();
  }
  for (let k = 0; k < 400; k++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(90,55,25,0.18)' : 'rgba(255,240,210,0.2)'; c.fillRect(Math.random() * W, Math.random() * H, 1.2, 1.2); }
  if (sky) { const h = c.createLinearGradient(0, 0, 0, H); h.addColorStop(0, 'rgba(255,240,220,0.35)'); h.addColorStop(1, 'rgba(255,240,220,0)'); c.fillStyle = h; c.fillRect(0, 0, W, H); }
  // Licht oben links, Vignette
  const l = c.createRadialGradient(W * 0.3, H * 0.25, 10, W * 0.5, H * 0.5, W * 0.75);
  l.addColorStop(0, 'rgba(255,235,200,0.25)'); l.addColorStop(0.6, 'rgba(0,0,0,0)'); l.addColorStop(1, 'rgba(30,15,5,0.55)');
  c.fillStyle = l; c.fillRect(0, 0, W, H);
  return (iconBg[sky] = cv);
}
export function icon(kind, type, color) {
  const key = kind + type + color;
  if (iconCache.has(key)) return iconCache.get(key);
  const W = 240, H = 180, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');
  const def = kind === 'unit' ? (UNITS[type] || {}) : {};
  const air = def.mt === 'air';
  ctx.drawImage(iconBackdrop(air), 0, 0);
  ctx.save();
  if (kind === 'unit') {
    const cat = def.cat;
    const sc = cat === 'inf' ? 3.6 : air ? 2.25 : type === 'koloss' ? 1.85 : (type === 'panzer' || type === 'laserpanzer' || type === 'ernter' || type === 'werfer' || type === 'brenner') ? 2.3 : 2.6;
    ctx.translate(W / 2, H * 0.55 + (air ? 6 : 0)); ctx.scale(sc, sc);
    const fake = { type, def: { ...def }, facing: -0.55, id: 3, cargo: 0.6, ammo: 3, hp: 100 };
    drawUnit(ctx, fake, 0, 0, color, 0.3, { z: air ? 12 : 0, turret: 0.15 });
  } else {
    ctx.translate(W / 2, H * 0.53); ctx.scale(2.05, 2.05);
    drawBuilding(ctx, { type, turnsLeft: 0, def: {}, facing: -0.6, rise: 1, id: 1, c: 0, r: 0 }, 0, 0, color, 0.7, {});
  }
  ctx.restore();
  // Rahmenlicht
  ctx.strokeStyle = 'rgba(255,230,190,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(1, 1, W - 2, H - 2);
  iconCache.set(key, cv);
  return cv;
}

// ---------- Drop-Kapsel, Klopfer, Karten ----------
function podBody(color) {
  return part('pod-' + color, 34, 40, (L) => {
    L((c) => {
      // Hitzeschild unten, Kapselkörper, Schubdüsen
      const g = c.createLinearGradient(-12, 0, 12, 0); g.addColorStop(0, '#d9dde3'); g.addColorStop(0.45, '#8c939c'); g.addColorStop(1, '#3a3f46');
      c.fillStyle = g; c.beginPath(); c.moveTo(0, -18); c.bezierCurveTo(9, -14, 12, 0, 11, 10); c.lineTo(-11, 10); c.bezierCurveTo(-12, 0, -9, -14, 0, -18); c.closePath(); c.fill();
      c.fillStyle = '#2c241d'; c.beginPath(); c.ellipse(0, 10, 12, 4.5, 0, 0, 6.28); c.fill();
      const sc = c.createLinearGradient(0, 2, 0, 12); sc.addColorStop(0, 'rgba(60,35,20,0)'); sc.addColorStop(1, 'rgba(60,35,20,0.85)');
      c.fillStyle = sc; c.beginPath(); c.moveTo(-11, 2); c.lineTo(11, 2); c.lineTo(11, 10); c.lineTo(-11, 10); c.fill();
      c.fillStyle = color; c.fillRect(-10, -2, 20, 3.2);
      c.strokeStyle = 'rgba(20,15,10,0.6)'; c.lineWidth = 0.5;
      for (const yy of [-10, -5, 5]) { c.beginPath(); c.moveTo(-10, yy); c.quadraticCurveTo(0, yy + 1.5, 10, yy); c.stroke(); }
      c.beginPath(); c.moveTo(0, -18); c.lineTo(0, 10); c.stroke();
      c.fillStyle = 'rgba(255,220,140,0.9)'; c.beginPath(); c.arc(0, -11, 1.8, 0, 6.28); c.fill();
      for (const sx of [-7, 7]) { c.fillStyle = '#4a4f57'; c.fillRect(sx - 1.5, -15, 3, 4); }
    }, { bevel: 0.4, grime: 0.45 });
  });
}
function podPetal(color) {
  return part('podpetal-' + color, 16, 22, (L) => L((c) => {
    const g = c.createLinearGradient(-6, 0, 6, 0); g.addColorStop(0, '#c8cdd4'); g.addColorStop(1, '#4a4f57');
    c.fillStyle = g; c.beginPath(); c.moveTo(-6.5, 8); c.quadraticCurveTo(-6, -6, 0, -10); c.quadraticCurveTo(6, -6, 6.5, 8); c.closePath(); c.fill();
    c.fillStyle = 'rgba(70,40,22,0.8)'; c.fillRect(-6.5, 5, 13, 3);
    c.fillStyle = color; c.fillRect(-5, -1, 10, 2);
  }, { bevel: 0.4, grime: 0.4 }));
}

export function drawPod(ctx, x, y, h, open, color, t) {
  ctx.save(); ctx.translate(x, y);
  const near = 1 - Math.min(1, h / 320);
  ctx.fillStyle = `rgba(0,0,0,${0.4 * near})`; ctx.beginPath(); ctx.ellipse(h * 0.25, 4 + h * 0.08, 10 + 8 * near, 5 + 4 * near, 0, 0, 6.28); ctx.fill();
  if (h > 5 && open <= 0) {
    // Zielmarke am Boden
    ctx.strokeStyle = `rgba(255,170,90,${0.5 * near + 0.2})`; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.lineDashOffset = -t * 20;
    ctx.beginPath(); ctx.arc(0, 0, 10 + (1 - near) * 14, 0, 6.28); ctx.stroke(); ctx.setLineDash([]);
  }
  ctx.translate(0, -h);
  if (open > 0) {
    const pt = podPetal(color);
    ctx.globalCompositeOperation = 'lighter';
    const ig = ctx.createRadialGradient(0, 0, 0, 0, 0, 14); ig.addColorStop(0, `rgba(255,200,120,${0.7 * (1 - open * 0.6)})`); ig.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#1e1a17'; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.28); ctx.fill();
    for (let k = 0; k < 4; k++) {
      ctx.save(); ctx.rotate(k * Math.PI / 2 + 0.785); ctx.translate(0, -6 - open * 9); ctx.rotate(open * 0.5);
      drawPartShadow(ctx, pt, 2, 2, 0.35); drawPart(ctx, pt); ctx.restore();
    }
  } else {
    const body = podBody(color);
    if (h > 5) {
      // Plasmahülle und Schweif
      ctx.globalCompositeOperation = 'lighter';
      const tr = ctx.createLinearGradient(0, -10, 0, -70); tr.addColorStop(0, 'rgba(255,180,90,0.55)'); tr.addColorStop(1, 'rgba(255,120,40,0)');
      ctx.fillStyle = tr; ctx.beginPath(); ctx.moveTo(-9, -8); ctx.lineTo(9, -8); ctx.lineTo(3, -70); ctx.lineTo(-3, -70); ctx.closePath(); ctx.fill();
      const fl = 0.85 + Math.sin(t * 40) * 0.15;
      const fg = ctx.createRadialGradient(0, 12, 1, 0, 12, 20 * fl); fg.addColorStop(0, 'rgba(255,240,200,1)'); fg.addColorStop(0.4, 'rgba(255,170,80,0.7)'); fg.addColorStop(1, 'rgba(255,90,30,0)');
      ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(0, 12, 20 * fl, 0, 6.28); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    drawPart(ctx, body);
    if (h > 5) {
      ctx.globalCompositeOperation = 'lighter';
      const hs = ctx.createLinearGradient(0, 4, 0, 14); hs.addColorStop(0, 'rgba(255,120,40,0)'); hs.addColorStop(1, 'rgba(255,200,120,0.8)');
      ctx.fillStyle = hs; ctx.beginPath(); ctx.ellipse(0, 10, 12, 5, 0, 0, 6.28); ctx.fill();
    }
  }
  ctx.restore();
}

function thumperBase() {
  return part('thumper-base', 26, 26, (L) => L((c) => {
    for (let k = 0; k < 3; k++) {
      const a = k * 2.094 + 0.5; c.strokeStyle = '#4a4f57'; c.lineWidth = 2.2; c.lineCap = 'round';
      c.beginPath(); c.moveTo(0, 0); c.lineTo(Math.cos(a) * 10, Math.sin(a) * 9); c.stroke();
      c.fillStyle = '#2e3236'; c.beginPath(); c.arc(Math.cos(a) * 10, Math.sin(a) * 9, 1.8, 0, 6.28); c.fill();
    }
    const g = c.createRadialGradient(-1.5, -1.5, 0.5, 0, 0, 5); g.addColorStop(0, '#9aa0a8'); g.addColorStop(1, '#3a3f46');
    c.fillStyle = g; c.beginPath(); c.arc(0, 0, 4.6, 0, 6.28); c.fill();
    c.fillStyle = '#d9a33a'; c.fillRect(-1, -4.5, 2, 9);
  }, { bevel: 0.4, grime: 0.4 }));
}
export function drawThumper(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y);
  const beat = (t * 1.6) % 1, hit = beat < 0.12 ? 1 - beat / 0.12 : 0;
  // Schlagwellen im Sand
  for (let k = 0; k < 3; k++) {
    const ph = (t * 1.6 + k / 3) % 1, rx = 8 + ph * 40, ry = 5 + ph * 26, al = (1 - ph);
    ctx.lineWidth = 2 * al + 0.5;
    ctx.strokeStyle = `rgba(255,232,190,${0.35 * al})`; ctx.beginPath(); ctx.ellipse(-0.8, 1.2, rx, ry, 0, 2.6, 5.8); ctx.stroke();
    ctx.strokeStyle = `rgba(90,55,25,${0.4 * al})`; ctx.beginPath(); ctx.ellipse(0.8, 2.8, rx, ry, 0, -0.6, 2.6); ctx.stroke();
  }
  const base = thumperBase();
  drawPartShadow(ctx, base, 2, 3, 0.35); drawPart(ctx, base);
  // Kolben: hebt sich und schlägt
  const lift = (1 - Math.pow(1 - Math.min(1, beat / 0.85), 2)) * 9;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(1.5 + lift * 0.3, -1 - lift * 0.2, 4, 4);
  ctx.fillStyle = '#6b7178'; ctx.fillRect(-1, -4 - lift, 2, 4 + lift);
  ctx.fillStyle = '#c7a24a'; ctx.fillRect(-3.4, -8 - lift, 6.8, 4.5);
  ctx.fillStyle = 'rgba(255,240,200,0.45)'; ctx.fillRect(-3.4, -8 - lift, 6.8, 1.2);
  if (hit > 0) { ctx.fillStyle = `rgba(230,195,140,${0.6 * hit})`; ctx.beginPath(); ctx.ellipse(0, 1, 10 * (1.4 - hit), 6 * (1.4 - hit), 0, 0, 6.28); ctx.fill(); }
  ctx.fillStyle = `rgba(255,80,40,${0.5 + 0.5 * Math.sin(t * 8)})`; ctx.beginPath(); ctx.arc(0, -8 - lift - 1, 0.9, 0, 6.28); ctx.fill();
  ctx.restore();
}

const cardCache = new Map();
export function cardArt(id) {
  if (cardCache.has(id)) return cardCache.get(id);
  const cv = document.createElement('canvas'); cv.width = 120; cv.height = 80;
  const c = cv.getContext('2d');
  const bg = c.createRadialGradient(60, 40, 5, 60, 40, 80); bg.addColorStop(0, '#4a3358'); bg.addColorStop(1, '#160f1c');
  c.fillStyle = bg; c.fillRect(0, 0, 120, 80);
  c.strokeStyle = 'rgba(220,180,255,0.9)'; c.fillStyle = 'rgba(220,180,255,0.9)'; c.lineWidth = 2.5; c.lineCap = 'round';
  c.translate(60, 40);
  const sym = {
    stimme() { for (let k = 1; k <= 3; k++) { c.beginPath(); c.arc(-14, 0, k * 9, -0.7, 0.7); c.stroke(); } c.beginPath(); c.arc(-20, 0, 5, 0, 6.28); c.fill(); },
    vorahnung() { c.beginPath(); c.ellipse(0, 0, 26, 13, 0, 0, 6.28); c.stroke(); c.beginPath(); c.arc(0, 0, 8, 0, 6.28); c.fill(); c.fillStyle = '#160f1c'; c.beginPath(); c.arc(0, 0, 3, 0, 6.28); c.fill(); },
    wetter() { for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 8 + k * 8, k, k + 4); c.stroke(); } },
    klopfer() { c.fillRect(-2, -22, 4, 30); c.fillRect(-7, -24, 14, 6); for (let k = 1; k <= 2; k++) { c.beginPath(); c.ellipse(0, 12, 12 * k, 4 * k, 0, 0, 6.28); c.stroke(); } },
    verrat() { c.beginPath(); c.moveTo(-20, 10); c.lineTo(0, -14); c.lineTo(20, 10); c.stroke(); c.beginPath(); c.moveTo(-8, 4); c.lineTo(8, 4); c.stroke(); c.beginPath(); c.arc(0, -14, 4, 0, 6.28); c.fill(); },
    schild() { c.beginPath(); c.moveTo(0, -22); c.lineTo(18, -12); c.lineTo(14, 10); c.lineTo(0, 22); c.lineTo(-14, 10); c.lineTo(-18, -12); c.closePath(); c.stroke(); },
    sabotage() { c.beginPath(); c.arc(0, 4, 13, 0, 6.28); c.stroke(); c.beginPath(); c.moveTo(8, -6); c.quadraticCurveTo(16, -18, 22, -16); c.stroke(); c.fillStyle = '#ffb35a'; c.beginPath(); c.arc(22, -16, 3, 0, 6.28); c.fill(); },
    gilde() { c.beginPath(); c.arc(0, 0, 18, 0, 6.28); c.stroke(); for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; c.beginPath(); c.arc(Math.cos(a) * 24, Math.sin(a) * 24, 2, 0, 6.28); c.fill(); } c.beginPath(); c.arc(0, 0, 6, 0, 6.28); c.fill(); },
  }[id];
  if (sym) sym();
  cardCache.set(id, cv);
  return cv;
}

// Sandtrichter: der Boden sackt ein, Sand strömt spiralförmig zur Mitte
export function drawSandWhirl(ctx, x, y, t, k, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const R = 52 * k;
  const g = ctx.createRadialGradient(0, 0, 2, 0, 0, R);
  g.addColorStop(0, `rgba(40,24,12,${0.75 * k})`); g.addColorStop(0.6, `rgba(110,70,35,${0.45 * k})`); g.addColorStop(1, 'rgba(170,120,70,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.28); ctx.fill();
  ctx.strokeStyle = `rgba(235,195,140,${0.5 * k})`; ctx.lineWidth = 1.6;
  for (let i = 0; i < 10; i++) {
    const a0 = i / 10 * 6.28 + t * 2.2;
    ctx.beginPath();
    for (let j = 0; j <= 12; j++) { const f = j / 12, rr2 = R * (1 - f * 0.85), a = a0 + f * 2.4; const px = Math.cos(a) * rr2, py = Math.sin(a) * rr2; j ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
  }
  ctx.restore();
}

// Wandernde Sandwelle über einem Wurm unter der Oberfläche
export function drawWormRidge(ctx, x, y, ang, t, scale = 1) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(scale, scale);
  const g = ctx.createRadialGradient(-6, -4, 2, 0, 0, 34);
  g.addColorStop(0, 'rgba(255,225,170,0.55)'); g.addColorStop(0.5, 'rgba(200,150,95,0.35)'); g.addColorStop(1, 'rgba(120,80,40,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(-8, 0, 40, 18, 0, 0, 6.28); ctx.fill();
  ctx.fillStyle = 'rgba(60,35,18,0.3)'; ctx.beginPath(); ctx.ellipse(-4, 8, 36, 7, 0, 0, 6.28); ctx.fill();
  ctx.strokeStyle = 'rgba(255,235,195,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.quadraticCurveTo(-10, -12, -46, -4); ctx.stroke();
  for (let k = 0; k < 3; k++) { const ph = (t * 1.6 + k / 3) % 1; ctx.strokeStyle = `rgba(150,105,60,${0.4 * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(-10 - ph * 40, 0, 20 + ph * 16, 10 + ph * 8, 0, 0, 6.28); ctx.stroke(); }
  ctx.restore();
}
