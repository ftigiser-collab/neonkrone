// Schlüsselorte: vorgerenderte Bauten plus bewegte Details (Wasser, Schüssel, Leuchtfeuer, Glyphen)
import { part, drawPart, drawPartShadow, rr, lg, rg, rivets, vents, hazard } from './art.js';
import { hexPath, R } from './hex.js';

const stone = (c, x, y, w, h, a = 0) => {
  c.save(); c.translate(x, y); c.rotate(a);
  c.fillStyle = lg(c, -w / 2, -h / 2, w / 2, h / 2, '#9197ae', '#505362'); rr(c, -w / 2, -h / 2, w, h, Math.min(w, h) * 0.25); c.fill();
  c.restore();
};

const STAT = {
  zisterne(L) {
    L((c) => {
      // Steinplatz
      c.fillStyle = '#6c7082'; c.beginPath(); c.arc(0, 0, 27, 0, 6.28); c.fill();
      for (let k = 0; k < 16; k++) { const a = k / 16 * 6.28; stone(c, Math.cos(a) * 23, Math.sin(a) * 23, 9, 6, a + 1.57); }
      // Becken
      c.fillStyle = '#2b2d36'; c.beginPath(); c.arc(0, 0, 17, 0, 6.28); c.fill();
      for (let k = 0; k < 12; k++) { const a = k / 12 * 6.28; stone(c, Math.cos(a) * 17, Math.sin(a) * 17, 7, 4.5, a + 1.57); }
    }, { bevel: 0.5, grime: 0.6, dust: 0.3 });
    L((c) => {
      // zwei Windfallen-Türme mit Lamellen
      for (const sx of [-1, 1]) {
        c.fillStyle = lg(c, sx * 30 - 5, -8, sx * 30 + 5, 8, '#a3aac3', '#565a69'); rr(c, sx * 30 - 5, -9, 10, 18, 2); c.fill();
        vents(c, sx * 30 - 3.5, -6, 7, 12, 5, false);
        c.strokeStyle = '#474a57'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(sx * 25, 0); c.lineTo(sx * 18, 0); c.stroke();
      }
    }, { bevel: 0.6, grime: 0.5 });
  },
  warte(L) {
    L((c) => {
      c.fillStyle = '#616576'; c.beginPath(); hexPath(c, 0, 0, 26); c.fill();
      stone(c, -10, 8, 22, 14);
      c.fillStyle = lg(c, -20, 2, 0, 16, '#a6adc6', '#565a69'); rr(c, -20, 2, 18, 13, 2); c.fill();
      c.fillStyle = 'rgba(255,200,120,0.85)'; c.fillRect(-17, 6, 3, 2); c.fillRect(-12, 6, 3, 2);
      c.fillStyle = '#2e303a'; c.fillRect(-7, 10, 4, 5);
    }, { bevel: 0.6, grime: 0.6, dust: 0.3 });
    L((c) => {
      // Gittermast (von oben als Dreieck mit Streben)
      c.strokeStyle = '#3d404b'; c.lineWidth = 1.4;
      const P = [[10, -14], [20, 2], [2, 2]];
      c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.stroke();
      c.lineWidth = 0.6; c.beginPath(); for (const [x, y] of P) { c.moveTo(x, y); c.lineTo(11, -4); } c.stroke();
      c.fillStyle = '#575b6a'; c.beginPath(); c.arc(11, -4, 3, 0, 6.28); c.fill();
    }, { bevel: 0.4, grime: 0.4 });
  },
  schmuggler(L) {
    L((c) => {
      // Landeplatz
      c.fillStyle = '#595d6c'; c.beginPath(); c.arc(4, 0, 24, 0, 6.28); c.fill();
      c.strokeStyle = '#d9a33a'; c.lineWidth = 1.6; c.beginPath(); c.arc(4, 0, 19, 0, 6.28); c.stroke();
      c.fillStyle = '#d9a33a'; c.font = 'bold 14px system-ui'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('H', 4, 1);
      for (let k = 0; k < 8; k++) { const a = k / 8 * 6.28; c.fillStyle = '#2a2622'; c.fillRect(4 + Math.cos(a) * 22 - 1, Math.sin(a) * 22 - 1, 2, 2); }
    }, { bevel: 0.4, grime: 0.7, dust: 0.35 });
    L((c) => {
      // Kistenstapel und Plane
      const crate = (x, y, w, h, col) => { c.fillStyle = col; rr(c, x, y, w, h, 0.8); c.fill(); c.strokeStyle = 'rgba(30,20,10,0.6)'; c.lineWidth = 0.5; c.strokeRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6); c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.stroke(); };
      crate(-28, -18, 9, 8, '#8a6a42'); crate(-28, -9, 9, 8, '#7a5c38'); crate(-19, -18, 8, 8, '#6a6f81'); crate(-27, 8, 10, 9, '#5b5f6f');
      c.fillStyle = lg(c, 12, 10, 30, 26, '#7f8599', '#444754'); c.beginPath(); c.moveTo(14, 12); c.lineTo(30, 10); c.lineTo(31, 24); c.lineTo(15, 26); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,30,15,0.6)'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(14, 12); c.lineTo(31, 24); c.stroke();
      hazard(c, -12, 18, 14, 3);
    }, { bevel: 0.6, grime: 0.6 });
  },
  zugang(L) {
    L((c) => {
      // Betonsockel mit Kabelschächten
      c.fillStyle = '#3a3c48'; c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + 0.52; c.lineTo(Math.cos(a) * 25, Math.sin(a) * 25); } c.closePath(); c.fill();
      c.strokeStyle = '#1c1d24'; c.lineWidth = 2.4; for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4; c.beginPath(); c.moveTo(Math.cos(a) * 9, Math.sin(a) * 9); c.lineTo(Math.cos(a) * 24, Math.sin(a) * 24); c.stroke(); }
    }, { bevel: 0.4, grime: 0.6 });
    L((c) => {
      // Terminalsäule
      c.fillStyle = lg(c, -9, -9, 9, 9, '#7a8098', '#2a2c36'); rr(c, -9, -9, 18, 18, 3); c.fill();
      c.fillStyle = '#0c0d12'; rr(c, -6, -6, 12, 12, 2); c.fill();
      for (const sx of [-1, 1]) { c.fillStyle = '#4a4e5c'; c.fillRect(sx * 12 - 2, -4, 4, 8); }
    }, { bevel: 0.7, grime: 0.4 });
  },
  heiligtum(L) {
    L((c) => {
      c.fillStyle = '#5e6272'; c.beginPath(); c.arc(0, 0, 26, 0, 6.28); c.fill();
      c.strokeStyle = 'rgba(40,30,20,0.4)'; c.lineWidth = 1; for (let k = 0; k < 3; k++) { c.beginPath(); c.arc(0, 0, 8 + k * 6, 0, 6.28); c.stroke(); }
    }, { bevel: 0.3, grime: 0.7, dust: 0.4 });
    L((c) => {
      // stehende Steine im Kreis, gekippt
      for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + 0.3; stone(c, Math.cos(a) * 21, Math.sin(a) * 21, 7 + (k % 3), 11 + (k % 2) * 3, a); }
      // Zentralstein mit eingeritzter Glyphe
      c.fillStyle = lg(c, -8, -8, 8, 8, '#a2a8c1', '#505362'); c.beginPath(); for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28; c.lineTo(Math.cos(a) * 9, Math.sin(a) * 9); } c.closePath(); c.fill();
    }, { bevel: 0.7, grime: 0.55 });
  },
};

const glyph = (c, s) => {
  c.beginPath(); c.moveTo(0, -s); c.lineTo(0, s); c.moveTo(-s * 0.7, -s * 0.3); c.lineTo(s * 0.7, -s * 0.3); c.moveTo(-s * 0.5, s * 0.5); c.quadraticCurveTo(0, s * 0.1, s * 0.5, s * 0.5);
};

export function drawPoi(ctx, x, y, type, ownerColor, t) {
  ctx.save(); ctx.translate(x, y);
  // Besitz: Hexrand in Teamfarbe oder grau, leicht pulsierend
  ctx.setLineDash([6, 4]); ctx.lineDashOffset = -t * 8;
  ctx.strokeStyle = ownerColor || 'rgba(191,199,227,0.55)'; ctx.lineWidth = 2.2; ctx.globalAlpha = 0.85;
  ctx.beginPath(); hexPath(ctx, 0, 0, R - 3); ctx.stroke(); ctx.setLineDash([]); ctx.globalAlpha = 1;
  const p = part('poi-' + type, 72, 64, (L) => STAT[type](L));
  drawPartShadow(ctx, p, 3, 4, 0.3); drawPart(ctx, p);
  // bewegte Details
  if (type === 'zisterne') {
    // Schwarzmarkt: Stände mit Planen, Neon-Preisschilder
    ctx.fillStyle = '#16151e'; ctx.beginPath(); ctx.arc(0, 0, 14, 0, 6.28); ctx.fill();
    const cols = ['#c0306a', '#2a8ac0', '#c08a2a', '#6a3ac0', '#2ac08a'];
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.3; ctx.save(); ctx.translate(Math.cos(a) * 8, Math.sin(a) * 8); ctx.rotate(a); ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(-3, -3, 8, 7); ctx.fillStyle = cols[k]; ctx.fillRect(-4, -4, 8, 7); ctx.fillStyle = 'rgba(255,255,255,0.25)'; for (let q = -4; q < 4; q += 2) ctx.fillRect(q, -4, 1, 7); ctx.restore(); }
    ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 5; k++) { const a = k * 1.2566 + 0.9, on = Math.sin(t * 3 + k * 2) > -0.6; ctx.fillStyle = on ? 'rgba(80,240,255,0.9)' : 'rgba(80,240,255,0.2)'; ctx.fillRect(Math.cos(a) * 12 - 1.5, Math.sin(a) * 12 - 0.8, 3, 1.6); }
    ctx.globalCompositeOperation = 'source-over';
  } else if (type === 'warte') {
    ctx.save(); ctx.translate(11, -4); ctx.rotate(t * 0.8);
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(2, 3, 8, 3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#d6d8dc'; ctx.beginPath(); ctx.ellipse(0, 0, 8, 3, 0, 0, 6.28); ctx.fill();
    ctx.fillStyle = '#8a8e94'; ctx.beginPath(); ctx.ellipse(0, 0.6, 6, 1.8, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#3a3e44'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -6); ctx.stroke();
    ctx.restore();
    if ((t * 1.2) % 1 < 0.15) { ctx.fillStyle = '#ff5040'; ctx.beginPath(); ctx.arc(10, -14, 1.6, 0, 6.28); ctx.fill(); }
  } else if (type === 'schmuggler') {
    const b = 0.5 + 0.5 * Math.sin(t * 4);
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(4, 0, 0, 4, 0, 22); g.addColorStop(0, `rgba(255,190,90,${0.12 * b})`); g.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(4, 0, 22, 0, 6.28); ctx.fill();
    for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.785; ctx.fillStyle = `rgba(255,200,110,${0.4 + 0.6 * ((t * 2 + k * 0.25) % 1 < 0.3 ? 1 : 0)})`; ctx.beginPath(); ctx.arc(4 + Math.cos(a) * 19, Math.sin(a) * 19, 1.5, 0, 6.28); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  } else if (type === 'zugang') {
    // Holo-Bildschirm mit Datenstrom
    ctx.globalCompositeOperation = 'lighter';
    const pu = 0.5 + 0.5 * Math.sin(t * 3);
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 26); gl.addColorStop(0, `rgba(60,240,255,${0.18 + 0.12 * pu})`); gl.addColorStop(1, 'rgba(60,240,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 6.28); ctx.fill();
    ctx.fillStyle = 'rgba(60,240,255,0.85)';
    for (let k = 0; k < 4; k++) { const w = 3 + ((t * 7 + k * 3) % 6); ctx.fillRect(-5, -4.5 + k * 2.6, w, 1.2); }
    for (let k = 0; k < 4; k++) { const a = k * 1.57 + 0.4, f = (t * 0.8 + k * 0.25) % 1; ctx.fillStyle = `rgba(190,110,255,${1 - f})`; ctx.beginPath(); ctx.arc(Math.cos(a) * (9 + f * 15), Math.sin(a) * (9 + f * 15), 1.5, 0, 6.28); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  } else if (type === 'heiligtum') {
    const g = 0.5 + 0.5 * Math.sin(t * 1.6);
    ctx.globalCompositeOperation = 'lighter';
    const gl = ctx.createRadialGradient(0, 0, 0, 0, 0, 20); gl.addColorStop(0, `rgba(120,230,255,${0.18 + 0.15 * g})`); gl.addColorStop(1, 'rgba(120,230,255,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, 20, 0, 6.28); ctx.fill();
    ctx.strokeStyle = `rgba(150,240,255,${0.5 + 0.4 * g})`; ctx.lineWidth = 1.3; ctx.lineCap = 'round'; glyph(ctx, 5); ctx.stroke();
    for (let k = 0; k < 7; k++) { const a = k / 7 * 6.28 + 0.3; ctx.fillStyle = `rgba(150,240,255,${0.25 + 0.3 * Math.sin(t * 2 + k)})`; ctx.beginPath(); ctx.arc(Math.cos(a) * 21, Math.sin(a) * 21, 1.4, 0, 6.28); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
  }
  // Neonschild mit Ortsnamen
  { const txt = { zisterne: 'MARKT', warte: 'FUNK', schmuggler: 'TUNNEL', heiligtum: '+ TRAUMA', zugang: 'NETZ' }[type], col = type === 'heiligtum' ? '255,60,80' : type === 'zisterne' ? '255,60,160' : type === 'zugang' ? '190,110,255' : '80,230,255';
    ctx.save(); ctx.translate(0, 23); ctx.font = 'bold 6.5px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const w = ctx.measureText(txt).width + 6; ctx.fillStyle = 'rgba(8,8,14,0.85)'; ctx.fillRect(-w / 2, -4.5, w, 9);
    ctx.globalCompositeOperation = 'lighter'; const fl = Math.sin(t * 19 + x) > 0.97 ? 0.4 : 1;
    ctx.strokeStyle = `rgba(${col},${0.85 * fl})`; ctx.lineWidth = 0.8; ctx.strokeRect(-w / 2 + 0.5, -4, w - 1, 8);
    ctx.shadowColor = `rgba(${col},1)`; ctx.shadowBlur = 6; ctx.fillStyle = `rgba(${col},${fl})`; ctx.fillText(txt, 0, 0.3); ctx.shadowBlur = 0;
    ctx.restore(); }
  // Banner in Besitzerfarbe
  ctx.save(); ctx.translate(-22, -20);
  ctx.strokeStyle = '#2e303a'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, -10); ctx.stroke();
  ctx.fillStyle = ownerColor || '#80869a';
  ctx.beginPath(); ctx.moveTo(0, -10);
  for (let k = 0; k <= 6; k++) ctx.lineTo(k * 1.8, -10 + Math.sin(t * 5 - k * 0.8) * 1.2);
  for (let k = 6; k >= 0; k--) ctx.lineTo(k * 1.8, -4 + Math.sin(t * 5 - k * 0.8) * 1.2);
  ctx.closePath(); ctx.fill();
  ctx.restore();
  ctx.restore();
}
