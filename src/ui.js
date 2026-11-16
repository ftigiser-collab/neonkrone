// Steuerung: Eingabe, Auswahl, Menüs, Animationen, Rundenablauf
import { UNITS, BUILDINGS, WEAPONS, TERRAIN, MOVE_COST, CARDS, DROPS, FACTIONS, ARMOR_MOD, ORBITAL_STRIKE , POIS, ENDGAME, ENDGAME_ROUND } from './data.js';
import { center, pixelToHex, distance, R, ring } from './hex.js';
import { icon, cardArt } from './sprites.js';
import { angDiff } from './util.js';
import { aiTurn, autoHarvest, autoCarry } from './ai.js';
import { shipKind } from './shipart.js';

const $ = (s) => document.querySelector(s);
const ARMOR_NAME = { inf: 'Infanterie', light: 'Leicht', heavy: 'Schwer', air: 'Luft', bld: 'Gebäude' };
const MT_NAME = { foot: 'zu Fuß', wheel: 'Räder', track: 'Ketten', air: 'Flug' };

export class Controller {
  constructor(game, renderer, fx) {
    this.g = game; this.r = renderer; this.fx = fx;
    this.sel = null; this.mode = 'idle'; this.busy = false;
    this.tweens = [];
    this.reach = null; this.afterMove = new Map();
    this.pointers = new Map();
    this.speed = 1;
    this.actAnimated = {
      move: (u, c, r, reach) => this.doMove(u, c, r, reach, u.owner !== 0),
      attack: (u, t) => this.doAttack(u, t),
      voice: (u, t) => this.doVoice(u, t),
      card: (owner, idx, c, r) => this.doCard(owner, idx, c, r),
      pickup: (car, t) => this.animPickup(car, t),
      thump: (u, c, r) => this.doThump(u, c, r),
      capture: (u, b) => this.doSpecial('capture', u, b),
      infiltrate: (u, b) => this.doSpecial('infiltrate', u, b),
      callWorm: (u, c, r) => this.doWormCall(u, c, r),
      drop: (car, c, r) => this.animDrop(car, c, r),
    };
    this.bindInput();
    this.bindDom();
    this.refresh();
  }

  // ---------- Animation ----------
  update(dt) {
    const keep = [];
    for (const tw of this.tweens) { tw.t += dt * this.speed; const done = tw.step(Math.min(1, tw.t / tw.dur), dt); if (tw.t >= tw.dur || done) { tw.step(1, 0); tw.resolve(); } else keep.push(tw); }
    this.tweens = keep;
    this.r.projectiles = this.projectiles;
    this.updateLog();
    this.minimapT = (this.minimapT || 0) - dt;
    if (this.minimapT <= 0) { this.minimapT = 0.25; this.drawMinimap(); }
  }
  tween(dur, step) { return new Promise((resolve) => this.tweens.push({ t: 0, dur, step, resolve })); }
  wait(s) { return this.tween(s, () => {}); }

  async animMove(u, path) {
    if (path.length < 2) return;
    const pts = path.map((h) => center(h.c, h.r));
    const segT = u.def.mt === 'air' ? 0.09 : u.def.cat === 'inf' ? 0.2 : 0.14;
    u.anim = true;
    const sand = (h) => this.g.isSand(h.c, h.r);
    // Eigene Einheiten decken während der Bewegung auf, Feld für Feld (kein Verschwinden im Schwarz)
    const g = this.g, revealed = new Set();
    const sight = u.owner === 0 && !u.carried ? Math.max(1, u.def.sight - (g.isNight() && u.def.mt !== 'air' ? 1 : 0)) : 0;
    const revealAt = (j) => {
      if (!sight || revealed.has(j)) return; revealed.add(j);
      const h = path[j]; let changed = false;
      for (const [x, y] of ring(h.c, h.r, sight, g.W, g.H)) { const q = g.i(x, y); if (!g.visible[q] || !g.explored[q]) { g.visible[q] = 1; g.explored[q] = 1; changed = true; } }
      if (changed) this.r.fogDirty = true;
    };
    revealAt(0);
    await this.tween(segT * (pts.length - 1), (k) => {
      const f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), l = f - i;
      if (l > 0.25) revealAt(i + 1);
      const a = pts[i], b = pts[i + 1];
      u.vis = { x: a.x + (b.x - a.x) * l, y: a.y + (b.y - a.y) * l };
      const nf = Math.atan2(b.y - a.y, b.x - a.x);
      if (u.def.mt === 'air') {
        const d = angDiff(u.facing ?? nf, nf);
        u.bank = Math.max(-1, Math.min(1, (u.bank || 0) * 0.85 + d * 1.6));
        if ((k < 0.12 || k > 0.88) && Math.random() < 0.6) { const ga = Math.random() * 6.28; this.fx.dust(u.vis.x + Math.cos(ga) * 18, u.vis.y + Math.sin(ga) * 12, 1, '210,175,120', 6, 5); }
      }
      u.facing = nf;
      if (u.def.mt !== 'air' && u.def.cat === 'veh' && sand(path[i + 1]) && Math.random() < 0.5) this.fx.dust(u.vis.x - Math.cos(u.facing) * 12, u.vis.y - Math.sin(u.facing) * 12, 1, '205,160,100', 6, 4);
      if (u.def.mt !== 'air' && u.def.cat === 'veh') { const lt = u._lt; if (!lt || Math.hypot(u.vis.x - lt.x, u.vis.y - lt.y) > 7) { this.fx.track(u.vis.x, u.vis.y, u.facing, u.type === 'trike' ? 8 : u.type === 'ernter' ? 15 : 11); u._lt = { ...u.vis }; } }
      if (u.def.mt === 'air' && sand(path[i + 1]) && Math.random() < 0.15) this.fx.dust(u.vis.x, u.vis.y, 1, '210,170,110', 14, 5);
      if (u.def.cat === 'inf' && Math.random() < 0.08) this.fx.dust(u.vis.x, u.vis.y + 4, 1, '190,150,100', 8, 2);
      const c = u.carrying && this.g.get(u.carrying); if (c) c.vis = u.vis;
    });
    u.vis = null; u.anim = false;
    if (u.bank) this.tween(0.4, (k) => { u.bank *= 0.8; }).then(() => { u.bank = 0; });
    const c = u.carrying && this.g.get(u.carrying); if (c) c.vis = null;
  }

  shotVisual(a, t, proj) {
    const pa = this.r.posOf(a), pt = this.r.posOf(t);
    const az = a.isUnit && a.def.mt === 'air' ? 26 : 0, tz = t.isUnit && t.def.mt === 'air' ? 26 : 0;
    const sx = pa.x, sy = pa.y - az, tx = pt.x + (Math.random() - 0.5) * 10, ty = pt.y - tz + (Math.random() - 0.5) * 10;
    const fx = this.fx;
    const team = a.owner === 0 ? '170,215,255' : '255,190,150';
    if (proj === 'bullet') {
      const ang = Math.atan2(ty - sy, tx - sx);
      return this.tween(0.45, (k, dt) => {
        if (Math.random() < dt * 22) {
          const jx = (Math.random() - 0.5) * 16, jy = (Math.random() - 0.5) * 16;
          fx.tracer(sx, sy, tx + jx, ty + jy, team); fx.muzzle(sx, sy, ang, 0.6); if (Math.random() < 0.5) fx.casing(sx, sy, ang);
          if (Math.random() < 0.6) fx.spark(tx + jx, ty + jy, 2, '255,230,170', 60);
        }
      }).then(() => fx.dust(tx, ty, 3, '170,150,120', 10, 4));
    }
    if (proj === 'flak') {
      return this.tween(0.5, (k, dt) => {
        if (Math.random() < dt * 9) { const jx = (Math.random() - 0.5) * 26, jy = (Math.random() - 0.5) * 26; fx.flash(tx + jx, ty + jy, 14, '255,210,140', 0.15); fx.smoke(tx + jx, ty + jy, 2, 4, 0.9); fx.flash(sx, sy, 9, '255,220,150', 0.05); }
      });
    }
    if (proj === 'laser') {
      fx.flash(sx, sy, 16, '130,190,255', 0.2);
      return this.tween(0.4, (k) => {
        const w = 1 - k;
        fx.add({ kind: 'line', x: sx, y: sy, x2: tx, y2: ty, life: 0.05, col: '160,210,255', a: 0.9 * w + 0.1 });
        if (Math.random() < 0.6) fx.add({ kind: 'glow', x: tx + (Math.random() - 0.5) * 8, y: ty + (Math.random() - 0.5) * 8, life: 0.2, size: 8, grow: 10, col: '140,200,255', a: 0.8 });
      }).then(() => { fx.flash(tx, ty, 26, '160,210,255', 0.25); fx.spark(tx, ty, 10, '200,230,255', 130); });
    }
    if (proj === 'sniper') {
      fx.flash(sx, sy, 10, '255,240,200', 0.07);
      fx.add({ kind: 'line', x: sx, y: sy, x2: tx, y2: ty, life: 0.18, col: '255,250,230', a: 1 });
      return this.wait(0.12).then(() => { fx.spark(tx, ty, 5, '255,220,180', 70); fx.dust(tx, ty, 3, '170,140,110', 8, 3); });
    }
    if (proj === 'flame') {
      return this.tween(0.6, (k, dt) => {
        for (let n = 0; n < 4; n++) {
          const f = Math.random(), x = sx + (tx - sx) * f, y = sy + (ty - sy) * f;
          fx.add({ kind: 'glow', x: x + (Math.random() - 0.5) * 6 * f * 3, y: y + (Math.random() - 0.5) * 6 * f * 3, vx: (tx - sx) * 0.8, vy: (ty - sy) * 0.8 - 10, life: 0.35, size: 4 + f * 8, grow: 14, col: Math.random() < 0.5 ? '255,140,40' : '255,200,80', a: 0.85 });
        }
        if (Math.random() < 0.3) fx.smoke(tx, ty, 1, 5, 0.9);
      }).then(() => { fx.fire(tx, ty, 8, 6); fx.decal(tx, ty, 12); });
    }
    if (proj === 'blade') {
      return this.tween(0.35, (k, dt) => {
        if (Math.random() < dt * 14) { const a = Math.random() * 6.28; fx.tracer(tx + Math.cos(a) * 10, ty + Math.sin(a) * 10, tx - Math.cos(a) * 10, ty - Math.sin(a) * 10, '230,210,255'); fx.spark(tx, ty, 2, '240,220,255', 40); }
      });
    }
    if (proj === 'bomb') {
      const bombs = [0, 1, 2].map((k) => ({ kind: 'bomb', x: sx + (k - 1) * 6, y: pt.y + (k - 1) * 8, h: az, ang: 0, d: k * 0.08 }));
      this.projectiles = this.projectiles || []; this.projectiles.push(...bombs);
      return this.tween(0.55, (k) => { for (const b of bombs) { const kk = Math.max(0, Math.min(1, (k - b.d) / 0.7)); b.h = az * (1 - kk * kk); b.x = sx + (tx - sx) * kk + (b.d - 0.08) * 60; b.y = pt.y + (ty + tz - pt.y) * kk; } }).then(() => {
        this.projectiles = this.projectiles.filter((q) => !bombs.includes(q));
        bombs.forEach((b, i) => setTimeout(() => fx.explosion(b.x, b.y, 0.9), i * 70));
        fx.shake = 5;
      });
    }
    const p = { kind: proj === 'arty' ? 'arty' : proj, x: sx, y: sy, h: 0, ang: Math.atan2(ty - sy, tx - sx) };
    this.projectiles = this.projectiles || [];
    this.projectiles.push(p);
    const d = Math.hypot(tx - sx, ty - sy);
    const dur = proj === 'arty' ? 0.75 : proj === 'rocket' ? 0.18 + d / 420 : 0.1 + d / 650;
    fx.flash(sx, sy, proj === 'shell' ? 16 : 10, '255,200,120', 0.08);
    if (proj === 'shell') { fx.smoke(sx, sy, 2, 4, 0.9); fx.muzzle(sx, sy, Math.atan2(ty - sy, tx - sx), 1.3); fx.dust(sx, sy + 6, 3, '190,150,100', 16, 5); }
    return this.tween(dur, (k) => {
      const kk = proj === 'rocket' ? k * k : k;
      p.x = sx + (tx - sx) * kk; p.y = sy + (ty - sy) * kk;
      p.h = proj === 'arty' ? Math.sin(Math.PI * k) * (50 + d * 0.15) : 0;
      if (proj === 'arty') { const k2 = Math.min(1, k + 0.02), nh = Math.sin(Math.PI * k2) * (50 + d * 0.15); p.ang = Math.atan2((ty - sy) * 0.02 - (nh - p.h), (tx - sx) * 0.02); }
      if ((proj === 'rocket' || proj === 'arty') && Math.random() < 0.9) fx.add({ kind: 'puff', x: p.x, y: p.y - p.h, life: 0.7, size: 2.5, grow: 9, col: '210,200,190', a: 0.4, air: true });
    }).then(() => {
      this.projectiles = this.projectiles.filter((q) => q !== p);
      fx.explosion(tx, ty, proj === 'arty' ? 0.9 : 0.5);
    });
  }

  // Kämpfe laufen bewusst langsamer, damit man Treffer und Konter verfolgen kann
  async animAttack(ev) {
    const sp = this.speed; this.speed = sp * 0.65;
    try { await this.animAttackInner(ev); } finally { this.speed = sp; }
  }
  async animAttackInner(ev) {
    const g = this.g;
    const a = g.byId.get(ev.att), t = g.byId.get(ev.target);
    if (!a || !t) return;
    const visible = g.seen(a) || g.seen(t) || a.owner === 0 || t.owner === 0;
    if (!visible) { if (ev.killed) t.gone = true; if (ev.counterKilled) a.gone = true; return; }
    const pt = this.r.posOf(t);
    this.ensureVisible(pt.x, pt.y);
    const pa = this.r.posOf(a);
    await this.aimAt(a, Math.atan2(pt.y - pa.y, pt.x - pa.x));
    this.kick(a, ev.proj);
    await this.shotVisual(a, t, ev.proj);
    this.hitFlash(t);
    if (t.isUnit && t.def.shield && !ev.shieldBlast && ['bullet', 'sniper'].includes(ev.proj)) { this.fx.ring(pt.x, pt.y, 14, '140,200,255', 0.35); this.r.float(pt.x, pt.y - 30, 'Schild', '#9fd0ff'); }
    if (ev.shieldBlast) {
      this.fx.flash(pt.x, pt.y, 120, '200,230,255', 0.5); this.fx.ring(pt.x, pt.y, 30, '180,220,255', 0.8);
      this.fx.explosion(pt.x, pt.y, 1.6); this.fx.shake = 12;
      this.r.float(pt.x, pt.y - 40, 'Schildreaktion!', '#bfe4ff', true);
      this.hitFlash(a);
    }
    this.r.float(pt.x, pt.y - (t.isUnit && t.def.mt === 'air' ? 26 : 0), `-${Math.round(ev.dmg)}`, '#ff8a6a', ev.dmg > 40);
    if (ev.shieldBlast && ev.counterKilled) { await this.finishKill(a, true); }
    if (ev.killed) { await this.wait(0.1); await this.finishKill(t, true); await this.wait(0.3); }
    else if (ev.counter > 0 || ev.counterKilled) {
      await this.wait(0.12);
      await this.aimAt(t, Math.atan2(pa.y - pt.y, pa.x - pt.x));
      this.kick(t, ev.counterProj);
      await this.shotVisual(t, a, ev.counterProj);
      this.hitFlash(a);
      this.r.float(pa.x, pa.y - (a.isUnit && a.def.mt === 'air' ? 26 : 0), `-${Math.round(ev.counter)}`, '#ffb36a');
      if (ev.counterKilled) { await this.wait(0.1); await this.finishKill(a, true); await this.wait(0.3); }
    }
    await this.wait(0.15);
  }

  async aimAt(a, ang) {
    const turret = a.isUnit && (a.type === 'panzer' || a.type === 'werfer');
    if (turret) {
      const from = a.turretRel || 0, to = angDiff(a.facing, ang), d = angDiff(from, to);
      a.aimUntil = this.r.t + 4;
      if (Math.abs(d) > 0.05) await this.tween(Math.min(0.35, Math.abs(d) * 0.15 + 0.05), (k) => { a.turretRel = from + d * k; });
      a.turretRel = to; return;
    }
    if (a.isUnit && a.def.cat === 'inf') { a.facing = ang; return; }
    const from = a.facing || 0, d = angDiff(from, ang);
    if (Math.abs(d) > 0.05) await this.tween(Math.min(0.35, Math.abs(d) * 0.13 + 0.05), (k) => { a.facing = from + d * k; });
    a.facing = ang;
  }
  kick(a, proj) {
    if (proj === 'bullet' || proj === 'flak') return;
    a.recoil = 1; this.tween(0.3, (k) => { a.recoil = 1 - k; });
  }
  hitFlash(t) { if (!t || t.dead) return; t.hitFlash = 1; this.tween(0.25, (k) => { t.hitFlash = 1 - k; }); }

  async finishKill(e, killed) {
    if (!killed || !e || e.gone || e.crashing) return;
    const p = { ...this.r.posOf(e) };
    const fx = this.fx, col = this.g.players[e.owner].color;
    if (e.isBuilding) {
      fx.explosion(p.x, p.y, 1.8); fx.shake = 9;
      for (let k = 0; k < 5; k++) setTimeout(() => fx.explosion(p.x + (Math.random() - 0.5) * 44, p.y + (Math.random() - 0.5) * 34, 0.8 + Math.random() * 0.5), 110 * k);
      fx.debris(p.x, p.y, 24, '90,85,80');
      this.r.addRubble(p);
      e.gone = true; return;
    }
    if (e.def.mt === 'air') {
      // Absturz: trudeln, Rauchspur, Aufschlag
      e.crashing = true;
      const z0 = e.z ?? 26, f0 = e.facing, dx = (Math.random() - 0.5) * 50, dy = 20 + Math.random() * 20;
      fx.explosion(p.x, p.y - z0, 0.6);
      await this.tween(0.9, (k) => {
        e.z = z0 * (1 - k * k); e.facing = f0 + k * 9;
        e.vis = { x: p.x + dx * k, y: p.y + dy * k * 0.5 };
        if (Math.random() < 0.8) { fx.smoke(e.vis.x, e.vis.y - e.z, 1, 4, 0.95); fx.fire(e.vis.x, e.vis.y - e.z, 1, 3); }
      });
      const q = { ...e.vis };
      fx.explosion(q.x, q.y, 1.3); fx.shake = 6;
      this.r.addWreck(e, q);
      e.gone = true; return;
    }
    if (e.def.cat === 'inf') {
      fx.dust(p.x, p.y, 6, '150,120,90', 14, 4); fx.spark(p.x, p.y, 4, '255,160,100', 50);
      fx.corpse(p.x, p.y, e.facing + Math.PI / 2, col, e.type === 'rak' ? 2 : 3);
      e.gone = true; return;
    }
    fx.explosion(p.x, p.y, 1.2);
    fx.debris(p.x, p.y, 10, '60,58,55');
    if (e.def.turret) { const a = Math.random() * 6.28; fx.add({ kind: 'debris', x: p.x, y: p.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, vz: 220, life: 1.6, size: 9, col: '70,62,52', a: 1 }); fx.smoke(p.x, p.y, 6, 8, 0.95); }
    this.r.addWreck(e, p);
    e.gone = true;
  }

  ensureVisible(x, y) {
    const s = this.r.w2s(x, y);
    if (s.x < 60 || s.y < 60 || s.x > this.r.vw - 60 || s.y > this.r.vh - 60) this.r.centerOn(x, y);
  }

  async playEvents(evs) {
    const g = this.g;
    for (const ev of evs) {
      if (ev.type === 'attack') await this.animAttack(ev);
      else if (ev.type === 'harvest') {
        const u = g.get(ev.u); if (!u || !g.seen(u)) continue;
        const p = this.r.posOf(u); u.harvestAnim = 1; this.r.float(p.x, p.y, `+${ev.amount} Chrom`, '#ffb060');
        for (let k = 0; k < 10; k++) this.fx.add({ kind: 'glow', x: p.x + (Math.random() - 0.5) * 30, y: p.y + (Math.random() - 0.5) * 20, vy: -20, life: 0.8, size: 3, grow: 1, col: '255,150,60', a: 0.9 });
      } else if (ev.type === 'unload') {
        const u = g.get(ev.u); if (!u) continue;
        const ref = g.byId.get(ev.ref);
        if (ref && g.seen(u)) {
          const a = this.r.posOf(u), b = center(ref.c, ref.r);
          ref.unloading = 1;
          await this.tween(0.7, (k, dt) => {
            for (let n = 0; n < 3; n++) { const sx = a.x + (Math.random() - 0.5) * 12, sy = a.y + (Math.random() - 0.5) * 12; this.fx.add({ kind: 'glow', x: sx, y: sy, vx: (b.x - sx) * 1.6, vy: (b.y - sy) * 1.6 - 20, life: 0.6, size: 3, grow: -2, col: '255,150,60', a: 0.9 }); }
          });
          ref.unloading = 0;
        }
        if (u.owner === 0) { const p = this.r.posOf(u); this.r.float(p.x, p.y - 10, `+${ev.amount} Credits`, '#8ef08a', true); this.pulse('#credits'); }
      } else if (ev.type === 'spawn') {
        const u = g.get(ev.u); if (!u || !g.seen(u)) continue;
        const p = center(u.c, u.r); this.fx.ring(p.x, p.y, 8, '160,220,255', 0.5);
        const src = ev.from && g.byId.get(ev.from);
        if (src && g.seen(u)) {
          const a = center(src.c, src.r);
          u.facing = Math.atan2(p.y - a.y, p.x - a.x);
          if (u.def.mt === 'air') { u.z = 0; this.tween(0.9, (k) => { u.z = 26 * k; u.vis = { x: a.x + (p.x - a.x) * k * k, y: a.y + (p.y - a.y) * k * k }; if (Math.random() < 0.4) this.fx.dust(u.vis.x, u.vis.y, 1, '200,180,150', 18, 6); }).then(() => { u.vis = null; }); }
          else { u.anim = true; this.fx.dust(a.x, a.y + 10, 6, '160,140,120', 20, 6); src.door = 1; this.tween(1.4, (k) => { src.door = k < 0.7 ? 1 : 1 - (k - 0.7) / 0.3; }); this.tween(0.6, (k) => { const kk = 1 - (1 - k) * (1 - k); u.vis = { x: a.x + (p.x - a.x) * kk, y: a.y + (p.y - a.y) * kk }; }).then(() => { u.vis = null; u.anim = false; }); }
        } else if (u.def.mt === 'air') { u.z = 0; this.tween(0.8, (k) => { u.z = 26 * k; }); }
      } else if (ev.type === 'built') {
        const b = g.get(ev.b); if (!b || !g.seen(b)) continue;
        const p = this.r.posOf(b); b.rise = 0; this.fx.dust(p.x, p.y, 14, '170,150,120', 40, 8); this.tween(0.6, (k) => { b.rise = k; });
      } else if (ev.type === 'orbital') await this.animOrbital(ev);
      else if (ev.type === 'endgame') await this.animEndgame(ev);
      else if (ev.type === 'strike') await this.animStrike(ev);
      else if (ev.type === 'card') { if (ev.owner === 0) { this.pulse('#cardsbtn'); this.refresh(); } }
      else if (ev.type === 'income') {
        if (ev.owner === 0) { const b = g.buildings.find((x) => x.owner === 0 && x.type === 'bauhof'); if (b) { const p = center(b.c, b.r); this.r.float(p.x, p.y - 20, `+${ev.amount} Credits`, '#8ef08a'); } }
      } else if (ev.type === 'poi') {
        const p = center(ev.poi.c, ev.poi.r), col = g.players[ev.owner].color;
        if (g.explored[g.i(ev.poi.c, ev.poi.r)]) { this.fx.ring(p.x, p.y, 16, '255,230,170', 0.6); this.fx.flash(p.x, p.y, 40, '255,220,150', 0.3); this.r.float(p.x, p.y - 34, `${POIS[ev.poi.type].name} eingenommen`, col, true); }
      } else if (ev.type === 'heal') {
        const u = g.get(ev.u); if (u && g.seen(u)) { const p = this.r.posOf(u); this.r.float(p.x, p.y - 22, `+${ev.amount}`, '#8ef08a'); this.fx.add({ kind: 'glow', x: p.x, y: p.y, life: 0.6, size: 18, grow: 20, col: '140,255,160', a: 0.5 }); }
      } else if (ev.type === 'rearm') {
        const u = g.get(ev.u); if (u && u.owner === 0) { const p = this.r.posOf(u); this.r.float(p.x, p.y - 26, 'Aufmunitioniert', '#a0e0ff'); }
      } else if (ev.type === 'storm') await this.animStorm(ev);
      else if (ev.type === 'worm') await this.animWorm(ev);
      else if (ev.type === 'blow') {
        const p = center(ev.c, ev.r);
        if (g.explored[g.i(ev.c, ev.r)]) {
          this.r.centerOn(p.x, p.y); await this.wait(0.3);
          const fx = this.fx;
          // Beben und aufwölbender Boden
          await this.tween(0.7, (k) => { fx.shake = Math.max(fx.shake, 2 + k * 3); if (Math.random() < 0.7) fx.dust(p.x + (Math.random() - 0.5) * 60 * k, p.y + (Math.random() - 0.5) * 40 * k, 1, '190,120,60', 10, 6); });
          // Eruption: Glutsäule
          fx.flash(p.x, p.y, 90, '255,150,60', 0.6); fx.sandBurst(p.x, p.y, 50, 30); fx.shake = 10;
          await this.tween(1.0, (k, dt) => {
            for (let n = 0; n < 6; n++) fx.add({ kind: 'glow', x: p.x + (Math.random() - 0.5) * 14, y: p.y, vx: (Math.random() - 0.5) * 60, vy: -160 - Math.random() * 160, life: 1.1, size: 4 + Math.random() * 4, grow: 3, col: '255,140,50', a: 0.9 });
            for (let n = 0; n < 3; n++) fx.add({ kind: 'puff', x: p.x + (Math.random() - 0.5) * 20, y: p.y - Math.random() * 30, vx: (Math.random() - 0.5) * 70, vy: -60 - Math.random() * 80, life: 2.4, size: 6, grow: 16, col: Math.random() < 0.5 ? '220,120,50' : '200,150,90', a: 0.45, air: true });
          });
          // Glutregen
          for (let n = 0; n < 40; n++) fx.add({ kind: 'glow', x: p.x + (Math.random() - 0.5) * 120, y: p.y - 60 - Math.random() * 60, vy: 40 + Math.random() * 40, life: 1.4, size: 2.5, grow: 0, col: '255,170,80', a: 0.9 });
          this.r.float(p.x, p.y - 30, 'Chromfund!', '#ffb060', true);
          await this.wait(0.8);
        }
      }
    }
    g.cleanup();
  }

  async animStorm(ev) {
    const g = this.g, s = g.storm;
    const a = center(ev.from.c, ev.from.r), b = center(ev.to.c, ev.to.r);
    const anyVisible = g.visible[g.i(ev.to.c, ev.to.r)] || g.visible[g.i(ev.from.c, ev.from.r)] || ev.hits.length;
    if (anyVisible) { this.r.centerOn((a.x + b.x) / 2, (a.y + b.y) / 2); await this.wait(0.25); }
    await this.tween(anyVisible ? 1.0 : 0.01, (k) => { s.vis = { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k }; });
    s.vis = null;
    for (const h of ev.hits) {
      const e = g.byId.get(h.id); if (!e || !(g.seen(e) || e.owner === 0)) continue;
      const p = this.r.posOf(e); this.r.float(p.x, p.y, `-${h.dmg}`, '#ffcf8a');
      if (e.dead) await this.finishKill(e, true);
    }
    if (ev.hits.length) await this.wait(0.6);
  }

  async animWorm(ev) {
    const g = this.g, w = g.byId.get(ev.id); if (!w) return;
    const pts = ev.path.map((h) => center(h.c, h.r));
    const seenAny = ev.path.some((h) => g.visible[g.i(h.c, h.r)] || g.radar[g.i(h.c, h.r)]);
    const victims = (ev.eatMany || []).map((id) => g.byId.get(id)).filter(Boolean);
    const strike = ev.eatHexes || ev.thumper;
    const show = seenAny || victims.some((v) => v.owner === 0) || ev.thumper;
    if (!show) { for (const v of victims) v.gone = true; return; }
    const sc = { 1: 1, 2: 1.4, 3: 1.9 }[w.size || 1];
    const fx = this.fx;
    w.forceShow = true;
    const end = pts[pts.length - 1];
    if (strike) { this.r.centerOn(end.x, end.y); await this.wait(0.25); }
    // 1. Anmarsch unter dem Sand: Sandwelle, Staub, Beben
    if (pts.length > 1) {
      // langsam und schwer: Großer Wurm braucht länger, sanftes An- und Ausgleiten
      await this.tween(0.62 * (pts.length - 1) * (0.85 + 0.15 * sc), (k0) => {
        const k = k0 < 0.5 ? 2 * k0 * k0 : 1 - Math.pow(-2 * k0 + 2, 2) / 2;
        const f = k * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f)), l = f - i;
        // Catmull-Rom zwischen den Feldern für eine geschwungene Bahn
        const P = (j) => pts[Math.max(0, Math.min(pts.length - 1, j))];
        const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), l2 = l * l, l3 = l2 * l;
        const cr = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * l + (2 * a - 5 * b + 4 * c - d) * l2 + (-a + 3 * b - 3 * c + d) * l3);
        const nx = cr(p0.x, p1.x, p2.x, p3.x), ny = cr(p0.y, p1.y, p2.y, p3.y);
        if (w.vis) { const a = Math.atan2(ny - w.vis.y, nx - w.vis.x); if (Math.hypot(nx - w.vis.x, ny - w.vis.y) > 0.3) w.dir = a; }
        w.vis = { x: nx, y: ny };
        fx.shake = Math.max(fx.shake, 0.8 * sc);
        if (Math.random() < 0.55) fx.dust(w.vis.x - Math.cos(w.dir) * 20 * sc, w.vis.y - Math.sin(w.dir) * 20 * sc, 2, '200,150,95', 26 * sc, 7 * sc);
        if (Math.random() < 0.3) fx.add({ kind: 'debris', x: w.vis.x + (Math.random() - 0.5) * 30 * sc, y: w.vis.y + (Math.random() - 0.5) * 16 * sc, vx: (Math.random() - 0.5) * 50, vy: (Math.random() - 0.5) * 30, vz: 60 + Math.random() * 90 * sc, life: 0.9, size: 2 + Math.random() * 2, col: '214,168,104', a: 1 });
        if (strike) fx.shake = Math.max(fx.shake, 1.5 * sc * k);
      });
    }
    w.vis = { ...end };
    if (strike) {
      // 2. Sandtrichter: Boden sackt ein, Opfer werden hineingezogen
      const hexPts = (ev.eatHexes || [[ev.path[ev.path.length - 1].c, ev.path[ev.path.length - 1].r]]).map(([c, r]) => center(c, r));
      for (const v of victims) v.vis = { ...center(v.c, v.r) };
      $('#app').classList.add('quake');
      await this.tween(0.8, (k) => {
        w.whirl = k;
        fx.shake = Math.max(fx.shake, 3 * sc);
        for (const v of victims) { const p0 = center(v.c, v.r); v.vis = { x: p0.x + (end.x - p0.x) * k * 0.5 + (Math.random() - 0.5) * 3, y: p0.y + (end.y - p0.y) * k * 0.5 + (Math.random() - 0.5) * 3 }; }
        for (const hp of hexPts) if (Math.random() < 0.5) fx.dust(hp.x + (Math.random() - 0.5) * 50, hp.y + (Math.random() - 0.5) * 40, 1, '190,140,85', 10, 6);
      });
      // 3. Ausbruch von unten nach oben: Kopf steigt Richtung Kamera, Schlund klappt auf
      fx.shake = 12 * sc;
      for (const hp of hexPts) fx.sandBurst(hp.x, hp.y, 22, 30, 3);
      fx.sandBurst(end.x, end.y, 50 * sc, 40 * sc, 6);
      fx.ring(end.x, end.y, 22 * sc, '240,210,160', 0.6);
      w.open = 0;
      await this.tween(0.7, (k) => {
        w.surface = 1 - (1 - k) * (1 - k); w.open = Math.max(0, (k - 0.35) / 0.65) * 0.6;
        for (const v of victims) { const p0 = v.vis; v.vis = { x: p0.x + (end.x - p0.x) * 0.2, y: p0.y + (end.y - p0.y) * 0.2 }; v.sink = k; }
      });
      for (const v of victims) v.gone = true;
      this.r.float(end.x, end.y - 46 * sc, victims.length ? (victims.length > 1 ? `${victims.length} Einheiten zerlegt!` : 'Zerlegt!') : 'Der Köder ist Schrott', '#ff7050', true);
      await this.tween(0.45, (k) => { w.open = 0.6 + 0.4 * k; });
      // 4. Verharren: Zahnringe mahlen, Sand rieselt in den Schlund
      await this.tween(1.1, (k) => {
        fx.shake = Math.max(fx.shake, 2 * sc);
        if (Math.random() < 0.8) { const a = Math.random() * 6.28, rr = 46 * sc; fx.add({ kind: 'debris', x: end.x + Math.cos(a) * rr, y: end.y + Math.sin(a) * rr, vx: -Math.cos(a) * 30, vy: -Math.sin(a) * 30, vz: 20, life: 0.7, size: 2 + Math.random() * 2, col: '214,168,104', a: 1 }); }
      });
      // 5. Schlund schließt sich, der Wurm kippt nach vorn und taucht ab; sein Rücken gleitet durch den Sand
      await this.tween(0.35, (k) => { w.open = 1 - k; });
      const dir = w.dir || 0, ux = Math.cos(dir), uy = Math.sin(dir), nx = -uy, ny = ux;
      const D = 140 * sc, bend = 20 * sc * (Math.random() < 0.5 ? -1 : 1);
      const at = (f) => ({ x: end.x + ux * D * f + nx * Math.sin(f * Math.PI) * bend, y: end.y + uy * D * f + ny * Math.sin(f * Math.PI) * bend });
      const body = (f0, f1) => { const pts = []; for (let i = 0; i <= 16; i++) { const f = f0 + (f1 - f0) * i / 16, p = at(f); pts.push([p.x, p.y]); } return pts; };
      $('#app').classList.remove('quake');
      await this.tween(2.1, (k) => {
        if (k < 0.45) {
          const f = k / 0.45; const h = at(f);
          w.vis = { x: h.x, y: h.y }; w.surface = 1 - f * 0.75; w.body = body(0, f);
          w.dir = dir + Math.cos(f * Math.PI) * 0.4 * Math.sign(bend);
          if (Math.random() < 0.25) fx.dust(h.x + Math.cos(dir) * 20 * sc, h.y + Math.sin(dir) * 20 * sc, 1, '200,150,95', 18 * sc, 6 * sc);
        } else {
          const f = (k - 0.45) / 0.55; w.surface = Math.max(0, 0.25 - f * 0.6); w.vis = at(1);
          w.body = body(f, 1);
          const tail = at(f); if (Math.random() < 0.25) fx.dust(tail.x, tail.y, 1, '200,150,95', 16 * sc, 6 * sc);
        }
        w.whirl = Math.max(0, 1 - k * 2);
      });
      fx.sandBurst(w.vis.x, w.vis.y, 20 * sc, 26 * sc, 3);
      w.surface = 0; w.whirl = 0; w.body = null; w.open = 0;
      fx.decal(end.x, end.y, 30 * sc);
      await this.wait(0.2);
    }
    w.vis = null; w.forceShow = false;
  }

  async animOrbital(ev) {
    const g = this.g, units = ev.units.map((id) => g.get(id)).filter(Boolean);
    const seen = ev.owner === 0 || units.some((u) => g.visible[g.i(u.c, u.r)]);
    if (!seen) return;
    const col = g.players[ev.owner].color;
    for (const u of units) u.hidden = true;
    const tgt = center(ev.c, ev.r);
    this.r.centerOn(tgt.x, tgt.y); await this.wait(0.3);
    const pods = units.map((u, i) => { const p = center(u.c, u.r); return { x: p.x, y: p.y, h: 520 + i * 60, open: 0, color: col, ox: 260 + i * 30 }; });
    this.r.pods.push(...pods);
    await this.tween(1.0, (k) => {
      for (const pd of pods) {
        const kk = Math.min(1, k * (520 / (pd.h0 || (pd.h0 = pd.h))));
        pd.cur = 1 - k; pd.hh = pd.h0 * (1 - k);
        pd.h = pd.hh; pd.drawX = pd.x + pd.ox * (1 - k);
        if (Math.random() < 0.9) { this.fx.fire(pd.x + pd.ox * (1 - k) * 0, pd.y - pd.h, 1, 5); this.fx.smoke(pd.x, pd.y - pd.h + 10, 1, 5, 0.6); }
      }
    });
    for (const pd of pods) { pd.h = 0; this.fx.explosion(pd.x, pd.y, 0.7); this.fx.ring(pd.x, pd.y, 14, '255,220,170', 0.6); this.fx.dust(pd.x, pd.y, 16, '200,160,110', 40, 9); }
    this.fx.shake = 7;
    await this.tween(0.4, (k) => { for (const pd of pods) pd.open = k; });
    for (const u of units) { u.hidden = false; this.hitFlash(u); }
    await this.wait(0.5);
    this.r.pods = this.r.pods.filter((p) => !pods.includes(p));
    if (ev.owner === 0) { g.updateVision(); this.r.fogDirty = true; }
  }

  // Endgame: Großraumschiff kommt über den Kartenrand, schwebt ein, setzt per Lichtstrahl ab, zieht wieder ab
  async animEndgame(ev) {
    const g = this.g, units = ev.units.map((id) => g.get(id)).filter(Boolean);
    const seen = ev.owner === 0 || g.explored[g.i(ev.c, ev.r)];
    if (!seen) return;
    const col = g.players[ev.owner].color, tgt = center(ev.c, ev.r);
    this.r.centerOn(tgt.x, tgt.y); await this.wait(0.3);
    if (ev.faction === 'sandvolk') {
      // Das Wüstenheer steigt aus dem Sand, wo der Uralte war
      for (const u of units) u.hidden = true;
      $('#app').classList.add('quake');
      for (const u of units) { const p = center(u.c, u.r); this.fx.sandBurst(p.x, p.y, 26, 26, 3); }
      this.fx.shake = 10;
      await this.wait(0.5);
      for (const u of units) { u.hidden = false; this.hitFlash(u); }
      $('#app').classList.remove('quake');
      this.r.float(tgt.x, tgt.y - 60, 'Die Chromfresser brechen los!', '#ffd28a', true);
      await this.wait(0.8);
    } else {
      for (const u of units) u.hidden = true;
      const kind = shipKind(ev.faction), dir = ev.owner === 0 ? -1 : 1;
      // 1. Der Gilden-Großtransporter zieht hoch oben vorbei und gibt die Landeschiffe frei
      const ring = { kind: 'ring', x: tgt.x + dir * 1400, y: tgt.y + 40, z: 170, r: 480, rot: 0.15, alpha: 0.95 };
      this.r.ships.push(ring);
      await this.tween(2.6, (k) => { const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; ring.x = tgt.x + dir * 1400 - dir * 2800 * e; this.fx.shake = Math.max(this.fx.shake, 1.5); });
      this.r.ships = this.r.ships.filter((x) => x !== ring);
      // 2. Landeschiffe: Legion kommt in drei Eiern, die anderen in einem großen Schiff
      const groups = kind === 'egg' ? [units.slice(0, 2), units.slice(2, 4), units.slice(4)] : [units];
      const ships = groups.filter((g2) => g2.length).map((g2, i) => {
        const ps = g2.map((u) => center(u.c, u.r)), cx = ps.reduce((a, p) => a + p.x, 0) / ps.length, cy = ps.reduce((a, p) => a + p.y, 0) / ps.length;
        const ea = i * 2.094 - 1.57, tx = kind === 'egg' ? tgt.x + Math.cos(ea) * 95 : cx, ty = kind === 'egg' ? tgt.y + Math.sin(ea) * 70 : cy;
        const sh = { kind, color: col, x: tx + dir * (700 + i * 160), y: ty - 300 - i * 60, z: 360, scale: kind === 'egg' ? 0.7 : 1.6, alpha: 1, thrust: 1, beams: [], tx, ty, group: g2 };
        sh.sx = sh.x; sh.sy = sh.y; sh.rot = kind === 'egg' ? 0 : Math.atan2(cy - sh.y, cx - sh.x);
        return sh;
      });
      this.r.ships.push(...ships);
      await this.tween(2.2, (k) => {
        const e = 1 - Math.pow(1 - k, 3);
        for (const sh of ships) { sh.x = sh.sx + (sh.tx - sh.sx) * e; sh.y = sh.sy + (sh.ty - sh.sy) * e; sh.z = 360 - (kind === 'egg' ? 300 : 270) * e; }
        this.fx.shake = Math.max(this.fx.shake, 2 + 4 * k);
        for (const sh of ships) if (Math.random() < 0.35) this.fx.dust(sh.x + (Math.random() - 0.5) * 200, sh.y + (Math.random() - 0.5) * 120, 1, '205,165,112', 40, 9);
      });
      $('#app').classList.add('quake');
      for (const sh of ships) {
        sh.beams = sh.group.map((u) => { const p = center(u.c, u.r); return { x: p.x, y: p.y, a: 0 }; });
        if (kind === 'egg') { this.fx.dust(sh.x, sh.y, 30, '205,165,112', 70, 10); this.fx.ring(sh.x, sh.y, 30, '230,200,160', 0.6); }
      }
      for (const sh of ships) for (let i = 0; i < sh.group.length; i++) {
        const b = sh.beams[i];
        await this.tween(0.3, (k) => { b.a = k; });
        sh.group[i].hidden = false; this.hitFlash(sh.group[i]); this.fx.dust(b.x, b.y, 12, '205,165,112', 40, 8); this.fx.ring(b.x, b.y, 12, '255,220,170', 0.5);
      }
      await this.wait(0.5);
      await this.tween(0.4, (k) => { for (const sh of ships) for (const b of sh.beams) b.a = 1 - k; });
      $('#app').classList.remove('quake');
      // 3. Abflug
      for (const sh of ships) { sh.ex = sh.x; sh.ey = sh.y; sh.ez = sh.z; }
      await this.tween(1.6, (k) => { const e = k * k; for (const sh of ships) { sh.z = sh.ez + 520 * e; sh.x = sh.ex - dir * 300 * e; sh.y = sh.ey - 200 * e; sh.thrust = 1 + k; sh.alpha = 1 - Math.max(0, k - 0.6) * 2.5; } });
      this.r.ships = this.r.ships.filter((s2) => !ships.includes(s2));
      this.r.float(tgt.x, tgt.y - 60, `${ENDGAME[ev.faction].name} ist gelandet!`, ev.owner === 0 ? '#ffd28a' : '#ff7050', true);
    }
    if (ev.owner === 0) { g.updateVision(); this.r.fogDirty = true; }
  }

  async doVoice(u, t) {
    const g = this.g;
    const ev = g.voice(u, t);
    const a = this.r.posOf(u), b = this.r.posOf(t);
    if (u.owner === 0 || g.seen(u) || g.seen(t)) {
      this.ensureVisible(b.x, b.y);
      await this.tween(0.7, (k, dt) => {
        if (Math.random() < dt * 14) this.fx.ring(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 4, '210,150,255', 0.5);
      });
      this.fx.ring(b.x, b.y, 10, '210,150,255', 0.7); this.fx.flash(b.x, b.y, 30, '190,120,255', 0.3);
      this.r.float(b.x, b.y - 10, 'Gelähmt!', '#d6a8ff', true);
      await this.wait(0.4);
    }
  }

  async doCard(owner, idx, c, r) {
    const g = this.g;
    const ev = g.playCard(owner, idx, c, r);
    if (!ev) return false;
    const p = center(c, r);
    const card = CARDS[ev.card];
    const visible = owner === 0 || (c !== undefined && g.visible[g.i(c, r)]);
    await this.banner(card.name, owner === 0 ? 'Hack des Netrunner-Kollektivs' : `${g.players[owner].name} hackt`, 0.9);
    if (!visible && !['wetter', 'sabotage', 'stimme', 'verrat'].includes(ev.card)) { this.refresh(); return true; }
    if (ev.target || ev.card === 'klopfer' || ev.card === 'wetter') { this.r.centerOn(p.x, p.y); await this.wait(0.3); }
    const fx = this.fx;
    if (ev.card === 'stimme') { fx.ring(p.x, p.y, 12, '210,150,255', 0.8); fx.flash(p.x, p.y, 40, '190,120,255', 0.4); this.r.float(p.x, p.y, 'Gelähmt!', '#d6a8ff', true); }
    else if (ev.card === 'vorahnung') { this.r.fogDirty = true; $('#app').classList.add('vision'); setTimeout(() => $('#app').classList.remove('vision'), 900); }
    else if (ev.card === 'wetter') { fx.ring(p.x, p.y, 20, '255,190,120', 0.8); this.r.float(p.x, p.y, 'Smog umgelenkt', '#ffc080', true); }
    else if (ev.card === 'klopfer') { fx.dust(p.x, p.y, 10, '200,160,110', 20, 6); this.r.float(p.x, p.y, 'Störsender gesetzt', '#ffd080', true); }
    else if (ev.card === 'verrat') { const u = g.get(ev.target); fx.spark(p.x, p.y, 20, '210,160,255', 90); if (u) this.hitFlash(u); this.r.float(p.x, p.y, 'Übergelaufen!', '#d6a8ff', true); }
    else if (ev.card === 'schild') { fx.ring(p.x, p.y, 14, '140,210,255', 0.8); this.r.float(p.x, p.y, 'Schildwall', '#9fdcff', true); }
    else if (ev.card === 'sabotage') { for (let k = 0; k < 6; k++) setTimeout(() => { fx.spark(p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 30, 6, '255,200,120', 80); fx.smoke(p.x, p.y, 2, 6, 0.9); }, k * 90); this.r.float(p.x, p.y, 'Sabotiert!', '#ffb070', true); }
    else if (ev.card === 'gilde' && owner === 0) { this.flash('Nächster AV-Drop kostenlos'); }
    await this.wait(0.6);
    g.updateVision(); this.r.fogDirty = true;
    this.refresh();
    return true;
  }

  async animStrike(ev) {
    const g = this.g, p = center(ev.c, ev.r), fx = this.fx;
    this.r.centerOn(p.x, p.y); await this.wait(0.35);
    await this.banner('Satellitenschlag', ev.owner === 0 ? 'Einschlag' : 'Feindlicher Einschlag', 0.6);
    // Leitstrahl, dann Lanzen aus dem Orbit
    await this.tween(0.6, (k) => { fx.add({ kind: 'line', x: p.x, y: p.y - 500, x2: p.x, y2: p.y, life: 0.05, col: '255,120,90', a: 0.3 + k * 0.5 }); fx.shake = Math.max(fx.shake, k * 3); });
    const pts = ring(ev.c, ev.r, ORBITAL_STRIKE.radius, g.W, g.H).map(([c, r]) => center(c, r));
    for (let n = 0; n < pts.length + 3; n++) {
      const q = pts[n % pts.length], x = q.x + (Math.random() - 0.5) * 20, y = q.y + (Math.random() - 0.5) * 16;
      await this.tween(0.12, (k) => { fx.add({ kind: 'line', x: x + 60 * (1 - k), y: y - 600 * (1 - k), x2: x, y2: y, life: 0.06, col: '255,230,190', a: 1 }); });
      fx.explosion(x, y, 1.3); fx.flash(x, y, 70, '255,200,140', 0.3); fx.shake = 12;
    }
    fx.ring(p.x, p.y, 40, '255,220,180', 0.9); fx.flash(p.x, p.y, 180, '255,180,120', 0.6);
    for (const q of pts) fx.decal(q.x, q.y, 34);
    for (const h of ev.hits) { const e = g.byId.get(h.id); if (!e) continue; const q = this.r.posOf(e); this.r.float(q.x, q.y, `-${h.dmg}`, '#ffb070'); if (e.dead) await this.finishKill(e, true); }
    await this.wait(0.8);
    g.updateVision(); this.r.fogDirty = true;
  }

  async doSpecial(kind, u, b) {
    const g = this.g;
    const a = this.r.posOf(u), p = center(b.c, b.r);
    const visible = u.owner === 0 || b.owner === 0 || g.seen(b);
    if (visible) {
      this.ensureVisible(p.x, p.y);
      u.anim = true;
      await this.tween(0.45, (k) => { u.vis = { x: a.x + (p.x - a.x) * k * 0.8, y: a.y + (p.y - a.y) * k * 0.8 }; u.sink = k * 0.6; });
    }
    let ev;
    if (kind === 'capture') ev = g.capture(u, b);
    else if (kind === 'repair') ev = g.repair(u, b);
    else ev = g.infiltrate(u, b);
    u.vis = null; u.anim = false; u.sink = 0;
    if (kind !== 'repair') u.gone = true;
    if (visible) {
      if (kind === 'capture') { this.fx.ring(p.x, p.y, 16, '255,230,150', 0.7); this.hitFlash(b); this.r.float(p.x, p.y - 30, 'Übernommen!', '#ffe08a', true); }
      else if (kind === 'repair') { this.fx.spark(p.x, p.y, 16, '160,230,255', 80); this.r.float(p.x, p.y - 30, 'Repariert', '#9fdcff'); }
      else { for (let k = 0; k < 6; k++) setTimeout(() => { this.fx.spark(p.x + (Math.random() - 0.5) * 30, p.y + (Math.random() - 0.5) * 30, 6, '255,200,120', 80); this.fx.smoke(p.x, p.y, 2, 6, 0.9); }, k * 90); this.r.float(p.x, p.y - 30, `Infiltriert (+${ev.steal})`, '#d6a8ff', true); }
      await this.wait(0.6);
    }
    g.cleanup(); g.updateVision(); this.r.fogDirty = true; this.refresh(); this.checkEnd();
  }

  async doWormCall(u, c, r) {
    const g = this.g;
    g.callWorm(u, c, r);
    if (u.owner === 0 || g.seen(u)) {
      const a = this.r.posOf(u), b = center(c, r);
      this.ensureVisible(b.x, b.y);
      for (let k = 0; k < 5; k++) { this.fx.ring(a.x, a.y, 6 + k * 3, '220,190,140', 0.5); await this.wait(0.12); this.fx.shake = 2; }
      this.fx.dust(b.x, b.y, 12, '200,150,95', 30, 8);
      this.r.float(b.x, b.y - 10, 'Der Ruf ist geschlagen', '#ffd080', true);
      await this.wait(0.3);
    }
  }

  async doThump(u, c, r) {
    const g = this.g;
    g.thump(u, c, r);
    if (u.owner === 0 || g.visible[g.i(c, r)]) {
      const a = this.r.posOf(u), b = center(c, r);
      this.ensureVisible(b.x, b.y);
      await this.tween(0.5, (k) => { if (Math.random() < 0.5) this.fx.dust(a.x + (b.x - a.x) * k, a.y + (b.y - a.y) * k, 1, '200,160,110', 8, 4); });
      this.fx.dust(b.x, b.y, 10, '200,160,110', 20, 6); this.fx.ring(b.x, b.y, 8, '255,210,140', 0.6);
      this.r.float(b.x, b.y - 10, 'Störsender!', '#ffd080', true);
      await this.wait(0.3);
    }
  }

  pulse(sel) { const el = $(sel); if (!el) return; el.classList.remove('pulse'); void el.offsetWidth; el.classList.add('pulse'); }

  async banner(text, sub = '', dur = 1.1) {
    const el = $('#banner');
    el.innerHTML = `<div class="b-main">${text}</div>${sub ? `<div class="b-sub">${sub}</div>` : ''}`;
    el.classList.add('show');
    await this.wait(dur);
    el.classList.remove('show');
    await this.wait(0.2);
  }

  // ---------- Aktionen ----------
  async doMove(u, c, r, reach) {
    const g = this.g;
    const path = g.moveUnit(u, c, r, reach);
    const visible = u.owner === 0 || path.some((h) => g.visible[g.i(h.c, h.r)]);
    if (visible) {
      if (u.owner !== 0) { const p = center(path[0].c, path[0].r); this.ensureVisible(p.x, p.y); }
      await this.animMove(u, path);
    }
    if (u.owner === 0) { g.updateVision(); this.r.fogDirty = true; }
    if (u.ambushed) {
      const o = g.get(u.ambushed);
      if (o && (u.owner === 0 || o.owner === 0)) { const p = this.r.posOf(o); this.r.float(p.x, p.y - 20, 'Hinterhalt!', '#ffcf6a', true); this.hitFlash(o); await this.wait(0.4); }
    }
    const evs = g.reflexFire(u);
    for (const ev of evs) {
      const a = g.byId.get(ev.att);
      if (a && (g.seen(a) || a.owner === 0 || u.owner === 0)) { const p = this.r.posOf(a); this.r.float(p.x, p.y - 26, 'Reaktionsfeuer', '#ffe08a'); }
      await this.animAttack(ev);
    }
    if (evs.length) { g.cleanup(); this.checkEnd(); }
  }

  // Träger landen zum Aufnehmen und Abladen: hinfliegen, absinken, Staub, Klammern, steigen, zurück
  async landAt(car, x, y, onGround) {
    const fx = this.fx, home = this.r.posOf(car), z0 = car.z ?? 26;
    const ang = Math.atan2(y - home.y, x - home.x);
    if (Math.hypot(x - home.x, y - home.y) > 2) { car.facing = ang; await this.tween(0.45, (k) => { const e = k * k * (3 - 2 * k); car.vis = { x: home.x + (x - home.x) * e, y: home.y + (y - home.y) * e }; }); }
    car.vis = { x, y };
    await this.tween(0.55, (k) => {
      car.z = z0 - (z0 - 5) * (k * k * (3 - 2 * k));
      if (Math.random() < 0.6 + k * 0.4) fx.dust(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, 1, '205,165,112', 30 * k + 10, 7);
    });
    fx.dust(x, y, 10, '205,165,112', 40, 8);
    if (onGround) onGround();
    await this.wait(0.25);
    await this.tween(0.55, (k) => {
      car.z = 5 + (z0 - 5) * (k * k * (3 - 2 * k));
      if (Math.random() < 0.6 * (1 - k)) fx.dust(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 20, 1, '205,165,112', 26, 7);
    });
    if (Math.hypot(x - home.x, y - home.y) > 2) await this.tween(0.45, (k) => { const e = k * k * (3 - 2 * k); car.vis = { x: x + (home.x - x) * e, y: y + (home.y - y) * e }; });
    car.vis = null; car.z = undefined;
  }
  // Landen / Starten: absinken mit Staub und Flügel einklappen bzw. hochziehen
  async animLand(u, down) {
    const g = this.g, p = center(u.c, u.r), fx = this.fx;
    if (down) {
      await this.tween(0.8, (k) => { u.z = 26 - 23 * (k * k * (3 - 2 * k)); if (Math.random() < 0.8) fx.dust(p.x + (Math.random() - 0.5) * 34, p.y + (Math.random() - 0.5) * 24, 1, '205,165,112', 20 + k * 20, 7); });
      g.land(u); u.z = undefined; fx.dust(p.x, p.y, 14, '205,165,112', 36, 8);
    } else {
      g.takeoff(u); u.z = 3;
      await this.tween(0.8, (k) => { u.z = 3 + 23 * (k * k * (3 - 2 * k)); if (Math.random() < 0.8 * (1 - k)) fx.dust(p.x + (Math.random() - 0.5) * 34, p.y + (Math.random() - 0.5) * 24, 1, '205,165,112', 30, 7); });
      u.z = undefined;
    }
    if (u.owner === 0) { g.updateVision(); this.r.fogDirty = true; }
  }

  async animPickup(car, t) {
    const g = this.g;
    if (car.owner === 0 || g.seen(car)) {
      const at = center(t.c, t.r);
      await this.landAt(car, at.x, at.y, () => g.pickup(car, t));
    } else g.pickup(car, t);
  }
  async animDrop(car, c, r) {
    const g = this.g;
    if (car.owner === 0 || g.seen(car)) {
      const at = center(c, r); let ev = null;
      await this.landAt(car, at.x, at.y, () => { ev = g.drop(car, c, r); });
      if (!ev) return;
    } else if (!g.drop(car, c, r)) return;
    if (car.owner === 0) { g.updateVision(); this.r.fogDirty = true; }
  }

  async doAttack(u, t) {
    const ev = this.g.attack(u, t);
    await this.animAttack(ev);
    this.g.cleanup();
    if (u.owner === 0 || t.owner === 0) { this.g.updateVision(); this.r.fogDirty = true; }
    this.checkEnd();
  }

  // ---------- Auswahl ----------
  clearHL() { Object.assign(this.r.hl, { move: null, attack: [], build: [], drop: [], target: [], path: null, sel: null, forecast: null }); this.hideForecast(); }

  deselect() { this.infoSel = null; this.sel = null; this.mode = 'idle'; this.reach = null; this.afterMove.clear(); this.clearHL(); this.showPanel(null); }

  select(e) {
    const g = this.g;
    this.clearHL();
    this.sel = e; this.r.hl.sel = e;
    this.mode = 'idle';
    if (e.isUnit && e.owner === 0 && g.current === 0 && !this.busy) {
      if (!e.moved && !e.acted) {
        this.reach = g.reachable(e);
        this.r.hl.move = this.reach;
        this.mode = 'unit';
        this.computeAfterMove(e);
      } else if (!e.acted) this.mode = 'moved';
      this.r.hl.attack = g.canFire(e) ? g.targetsFrom(e, e.c, e.r) : [];
      if (this.mode === 'unit') for (const [id] of this.afterMove) { const t = g.get(id); if (t && !this.r.hl.attack.includes(t)) this.r.hl.attack.push(t); }
    } else if (e.isBuilding && e.owner === 0 && e.def.weapon && g.canFire(e) && !this.busy) {
      this.mode = 'turret';
      this.r.hl.attack = g.targetsFrom(e, e.c, e.r);
    }
    this.showPanel(e);
  }

  computeAfterMove(u) {
    const g = this.g; this.afterMove.clear();
    const w = g.weapon(u); if (!w || w.noMoveFire || (w.ammo && u.ammo <= 0)) return;
    for (const n of this.reach.values()) {
      if (!n.end) continue;
      for (const t of g.targetsFrom(u, n.c, n.r)) {
        const prev = this.afterMove.get(t.id);
        const score = -n.cost + TERRAIN[g.terr(n.c, n.r)].def * 5;
        if (!prev || score > prev.score) this.afterMove.set(t.id, { c: n.c, r: n.r, score });
      }
    }
  }

  async handleTap(sx, sy) {
    const g = this.g;
    if (this.busy) return;
    const w = this.r.s2w(sx, sy);
    const { col: c, row: r } = pixelToHex(w.x, w.y);
    if (!g.in(c, r)) { this.deselect(); return; }
    const i = g.i(c, r);
    const vis = g.visible[i], exp = g.explored[i];
    const ug = g.unitAt(c, r, false), ua = g.unitAt(c, r, true), b = g.buildingAt(c, r);
    const enemyAt = [ua, ug, b].filter((e) => e && e.owner !== 0 && (e.isBuilding ? exp : vis));
    const ownAt = [ug, ua, b].filter((e) => e && e.owner === 0);

    if (this.mode === 'build') {
      if (this.r.hl.build.some(([bc, br]) => bc === c && br === r)) {
        const nb = g.placeBuilding(0, this.buildType, c, r);
        if (nb) { const p = center(c, r); this.fx.dust(p.x, p.y, 16, '170,150,120', 40, 8); this.fx.ring(p.x, p.y, 10, '140,255,160', 0.5); }
        this.deselect(); this.refresh(); return;
      }
      this.deselect(); return;
    }
    if (this.mode === 'drop') {
      if (this.r.hl.drop.some(([dc, dr]) => dc === c && dr === r)) {
        await this.animDrop(this.sel, c, r);
        this.deselect(); this.refresh(); return;
      }
      this.mode = 'moved'; this.select(this.sel); return;
    }
    if (['card', 'orbital', 'voice', 'thump', 'capture', 'repair', 'infiltrate', 'callworm', 'strike', 'endgame'].includes(this.mode)) {
      const hit = this.r.hl.target.some(([tc, tr]) => tc === c && tr === r);
      const m = this.mode; this.clearHL(); this.mode = 'idle';
      if (!hit) { this.deselect(); return; }
      this.busy = true;
      if (m === 'card') await this.doCard(0, this.cardIdx, c, r);
      else if (m === 'orbital') { if (g.orderDrop(0, this.dropId, c, r)) { const p = center(c, r); this.fx.ring(p.x, p.y, 10, '255,210,120', 0.6); } }
      else if (m === 'thump') await this.doThump(this.sel, c, r);
      else if (m === 'capture' || m === 'repair' || m === 'infiltrate') { const b = g.buildingAt(c, r); if (b) await this.doSpecial(m, this.sel, b); }
      else if (m === 'callworm') await this.doWormCall(this.sel, c, r);
      else if (m === 'strike') { if (g.orderStrike(0, c, r)) { const p = center(c, r); this.fx.ring(p.x, p.y, 20, '255,90,70', 0.7); } }
      else if (m === 'endgame') { if (g.orderEndgame(0, c, r)) { const p = center(c, r); this.fx.ring(p.x, p.y, 40, '255,210,120', 0.8); this.fx.flash(p.x, p.y, 60, '255,220,150', 0.3); } }
      else if (m === 'voice') { const t = g.voiceTargets(this.sel).find((t) => t.c === c && t.r === r); if (t) await this.doVoice(this.sel, t); }
      this.busy = false; this.deselect(); this.refresh(); return;
    }
    if (this.mode === 'pickup') {
      const t = ownAt.find((e) => g.canPickup(this.sel, e));
      if (t) {
        await this.animPickup(this.sel, t);
        const car = this.sel; this.deselect(); this.refresh();
        if (!car.acted) { this.select(car); this.flash('Aufgenommen — jetzt fliegen und absetzen'); }
        return;
      }
      this.select(this.sel); return;
    }

    // Angriff bestätigen / auswählen
    const sel = this.sel;
    if (sel && (this.mode === 'unit' || this.mode === 'moved' || this.mode === 'turret' || this.mode === 'confirm') && enemyAt.length) {
      const t = enemyAt.find((e) => this.r.hl.attack.includes(e));
      if (t) {
        if (this.mode === 'confirm' && this.confirmTarget === t) { await this.executeAttack(); return; }
        this.prepareAttack(t); return;
      }
    }
    if (this.mode === 'confirm') { this.mode = this.prevMode; this.select(this.sel); if (!enemyAt.length && !ownAt.length) return; }

    // Bewegung
    if (sel && this.mode === 'unit' && !ownAt.includes(sel)) {
      const n = this.reach.get(i);
      if (n && n.end && !(enemyAt.length)) {
        await this.moveSelected(c, r); return;
      }
    }
    // Auswahl wechseln (Stapel Boden/Luft durchschalten)
    if (ownAt.length) {
      const idx = ownAt.indexOf(sel);
      const next = idx >= 0 ? ownAt[(idx + 1) % ownAt.length] : ownAt[0];
      if (next === sel && ownAt.length === 1) { this.deselect(); return; }
      this.select(next); return;
    }
    if (enemyAt.length) { this.select(enemyAt[0]); return; }
    this.deselect();
    this.showTerrainInfo(c, r);
  }

  async moveSelected(c, r) {
    const g = this.g, u = this.sel; u.rally = null;
    this.busy = true; this.clearHL(); this.r.hl.sel = u;
    await this.doMove(u, c, r, this.reach);
    this.busy = false;
    this.refresh();
    const targets = g.canFire(u) ? g.targetsFrom(u, u.c, u.r) : [];
    const carrierAct = u.def.carrier && !u.acted;
    const special = !u.acted && ((u.def.capture && (g.adjBuildings(u, true).length || g.adjBuildings(u, false).some((b) => b.hp < b.maxHp))) || (u.def.infiltrate && g.adjBuildings(u, true).length) || g.canCallWorm(u) || g.canThump(u) || g.canVoice(u));
    if (!targets.length && !carrierAct && !special && !g.canLand(u)) { u.acted = true; this.deselect(); this.refresh(); return; }
    this.mode = 'moved';
    this.select(u);
  }

  prepareAttack(t) {
    const g = this.g, u = this.sel;
    this.prevMode = this.mode === 'confirm' ? this.prevMode : this.mode;
    this.confirmTarget = t;
    let from = { c: u.c, r: u.r };
    if (this.mode === 'unit' && !g.targetsFrom(u, u.c, u.r).includes(t)) {
      const m = this.afterMove.get(t.id); if (!m) return;
      from = m;
      this.r.hl.path = g.pathFrom(this.reach, m.c, m.r);
    } else this.r.hl.path = null;
    this.attackFrom = from;
    this.mode = 'confirm';
    const f = this.forecastFrom(u, t, from);
    this.showForecast(t, f);
  }

  forecastFrom(u, t, from) {
    const g = this.g;
    const oc = u.c, or = u.r;
    u.c = from.c; u.r = from.r;
    const f = g.forecast(u, t);
    u.c = oc; u.r = or;
    return f;
  }

  async executeAttack() {
    const g = this.g, u = this.sel, t = this.confirmTarget, from = this.attackFrom;
    if (u.isUnit && (from.c !== u.c || from.r !== u.r)) u.rally = null;
    this.busy = true; this.hideForecast(); this.clearHL();
    if (u.isUnit && (from.c !== u.c || from.r !== u.r)) await this.doMove(u, from.c, from.r, this.reach);
    if (!u.dead && !t.dead) await this.doAttack(u, t);
    this.busy = false;
    this.deselect(); this.refresh();
  }

  // ---------- Rundenablauf ----------
  async endTurn() {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.state !== 'play') return;
    this.busy = true; this.deselect();
    $('#endturn').disabled = true;
    // Auto-Träger und Auto-Ernter
    for (const u of g.ownUnits(0)) if (u.def.carrier && u.auto && !u.moved && !u.acted) await autoCarry(g, u, this.actAnimated);
    for (const u of g.ownUnits(0)) if (u.def.harvester && u.auto && !u.moved) await autoHarvest(g, u, this.actAnimated);
    await this.playEvents(g.endTurnEvents(0));
    if (this.checkEnd()) return;
    await this.playEvents(g.wormPhase());
    if (this.checkEnd()) return;
    const foe = g.players[1];
    await this.banner(foe.name, 'ist am Zug', 0.9);
    g.current = 1;
    await this.playEvents(g.beginTurn(1));
    await aiTurn(g, this.actAnimated, 1);
    await this.playEvents(g.endTurnEvents(1));
    if (this.checkEnd()) return;
    await this.playEvents(g.wormPhase());
    g.updateVision(); this.r.fogDirty = true;
    if (this.checkEnd()) return;
    await this.banner('Weltphase', 'Smog · Chrom', 0.7);
    await this.playEvents(g.worldPhase());
    g.updateVision(); this.r.fogDirty = true;
    if (this.checkEnd()) return;
    await this.playEvents(g.beginTurn(0));
    g.updateVision(); this.r.fogDirty = true;
    this.refresh();
    await this.banner(`Runde ${g.round}`, g.isNight() ? 'Euer Zug · Nacht: Bodensicht −1' : 'Euer Zug', 0.9);
    if (this.rallyUnits().some((u) => u.rally)) { this.busy = false; await this.rallyStep(); }
    this.busy = false;
    $('#endturn').disabled = false;
    this.refresh();
    this.save();
  }

  save() { try { localStorage.setItem('neonkrone-save', this.g.serialize()); } catch (e) { /* Speicher voll oder gesperrt */ } }

  checkEnd() {
    const s = this.g.checkEnd();
    if (this.g.mission) this.refresh();
    if (s === 'play') return false;
    this.busy = true;
    const el = $('#endscreen');
    const p = this.g.players[0], m = this.g.mission;
    el.querySelector('h1').textContent = m ? (s === 'won' ? 'Mission erfüllt' : 'Mission gescheitert') : s === 'won' ? 'Die Stadt gehört euch' : 'Eure Basis ist gefallen';
    el.querySelector('.stats').innerHTML = `${m ? `<b>${m.title}</b><br>` : ''}Runde ${this.g.round} · Gegner vernichtet: ${p.stats.kills} · Eigene Verluste: ${p.stats.lost} · Chrom gesammelt: ${p.stats.harvested}`;
    if (m) {
      if (s === 'won') this.onMissionWon?.(m);
      el.querySelector('.ebtns').innerHTML = `<button id="tocamp" class="primary">${s === 'won' ? 'Zur Kampagne' : 'Kampagne'}</button><button onclick="location.reload()">Hauptmenü</button>`;
      el.querySelector('#tocamp').onclick = () => { try { sessionStorage.setItem('neonkrone-open-campaign', '1'); } catch {} location.reload(); };
    }
    el.classList.add('show');
    try { localStorage.removeItem('neonkrone-save'); } catch (e) {}
    this.onEnd?.();
    return true;
  }

  // Warnung, wenn noch Einheiten nicht bewegt wurden
  idleUnits() { return this.g.ownUnits(0).filter((u) => !u.dead && !u.carried && !u.moved && !u.acted && !((u.def.harvester || u.def.carrier) && u.auto)); }
  requestEndTurn() {
    const g = this.g;
    if (this.busy || g.current !== 0 || g.state !== 'play') return;
    const idle = this.idleUnits();
    if (!idle.length) { this.endTurn(); return; }
    let box = document.getElementById('confirmbox');
    if (!box) { box = document.createElement('div'); box.id = 'confirmbox'; document.getElementById('app').appendChild(box); }
    box.innerHTML = `<div class="cb-card"><div class="cb-title">Noch ${idle.length} ${idle.length === 1 ? 'Einheit' : 'Einheiten'} nicht bewegt</div>
      <div class="cb-text">Trotzdem die Runde beenden?</div>
      <div class="cb-btns"><button data-a="show">Zur Einheit</button><button class="primary" data-a="end">Runde beenden</button></div></div>`;
    box.classList.add('show');
    const close = () => box.classList.remove('show');
    box.querySelector('[data-a="show"]').onclick = () => { close(); const u = idle[0]; this.select(u); const p = center(u.c, u.r); this.r.centerOn(p.x, p.y); };
    box.querySelector('[data-a="end"]').onclick = () => { close(); this.endTurn(); };
    box.onclick = (e) => { if (e.target === box) close(); };
  }

  nextUnit() {
    const g = this.g;
    const list = g.ownUnits(0).filter((u) => !u.acted && !u.carried && (!u.moved || g.canFire(u)) && !(u.def.harvester && u.auto && !u.moved));
    if (!list.length) { this.flash('Alle Einheiten haben gehandelt'); return; }
    const idx = list.indexOf(this.sel);
    const u = list[(idx + 1) % list.length];
    this.select(u);
    const p = center(u.c, u.r); this.r.centerOn(p.x, p.y);
  }

  // ---------- Eingabe ----------
  bindInput() {
    const cv = this.r.cv;
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('pointerdown', (e) => {
      cv.setPointerCapture(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.offsetX, y: e.offsetY, sx: e.offsetX, sy: e.offsetY, t: performance.now(), button: e.button });
      if (this.pointers.size === 2) { const [a, b] = [...this.pointers.values()]; this.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y) }; }
    });
    cv.addEventListener('pointermove', (e) => {
      const p = this.pointers.get(e.pointerId);
      if (!p) { this.hover(e.offsetX, e.offsetY); return; }
      const dx = e.offsetX - p.x, dy = e.offsetY - p.y;
      p.x = e.offsetX; p.y = e.offsetY;
      if (this.pointers.size === 2 && this.pinch) {
        const [a, b] = [...this.pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        this.r.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, d / this.pinch.d); this.pinch.d = d;
        p.moved = true;
        return;
      }
      if (Math.hypot(p.x - p.sx, p.y - p.sy) > 8) p.moved = true;
      if (p.moved) { this.r.camTarget = null; this.r.cam.x -= dx / this.r.cam.z; this.r.cam.y -= dy / this.r.cam.z; this.r.clampCam(); }
    });
    const up = (e) => {
      const p = this.pointers.get(e.pointerId); if (!p) return;
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinch = null;
      if (!p.moved && performance.now() - p.t < 600 && this.pointers.size === 0) {
        if (p.button === 2) { this.deselect(); return; }
        this.handleTap(e.offsetX, e.offsetY);
      }
    };
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', (e) => { this.pointers.delete(e.pointerId); this.pinch = null; });
    cv.addEventListener('wheel', (e) => { e.preventDefault(); this.r.camTarget = null; this.r.zoomAt(e.offsetX, e.offsetY, e.deltaY < 0 ? 1.12 : 1 / 1.12); }, { passive: false });
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.deselect();
      else if (e.key === 'e' || e.key === 'E') this.requestEndTurn();
      else if (e.key === 'n' || e.key === 'N' || e.key === 'Tab') { e.preventDefault(); this.nextUnit(); }
      else if (e.key === ' ' && this.mode === 'confirm') { e.preventDefault(); this.executeAttack(); }
      const k = 40 / this.r.cam.z;
      if (['ArrowLeft', 'a', 'A'].includes(e.key)) this.r.cam.x -= k;
      if (['ArrowRight', 'd', 'D'].includes(e.key)) this.r.cam.x += k;
      if (['ArrowUp', 'w', 'W'].includes(e.key)) this.r.cam.y -= k;
      if (['ArrowDown', 's', 'S'].includes(e.key)) this.r.cam.y += k;
      this.r.clampCam();
    });
    window.addEventListener('resize', () => this.r.resize());
  }

  hover(sx, sy) {
    const g = this.g;
    const w = this.r.s2w(sx, sy);
    const { col: c, row: r } = pixelToHex(w.x, w.y);
    if (!g.in(c, r)) { this.r.hl.hover = null; return; }
    this.r.hl.hover = { c, r };
    if (this.mode === 'unit' && this.sel && !this.busy) {
      const n = this.reach.get(g.i(c, r));
      this.r.hl.path = n && n.end ? g.pathFrom(this.reach, c, r) : null;
    }
  }

  // ---------- DOM ----------
  bindDom() {
    $('#endturn').onclick = () => this.requestEndTurn();
    $('#nextunit').onclick = () => this.nextUnit();
    $('#helpbtn').onclick = () => $('#help').classList.toggle('show');
    $('#cardsbtn').onclick = () => this.showCards();
    $('#help').onclick = (e) => { if (e.target.id === 'help' || e.target.classList.contains('close')) $('#help').classList.remove('show'); };
    $('#zoomin').onclick = () => this.r.zoomAt(this.r.vw / 2, this.r.vh / 2, 1.2);
    $('#zoomout').onclick = () => this.r.zoomAt(this.r.vw / 2, this.r.vh / 2, 1 / 1.2);
    $('#fc-ok').onclick = () => this.executeAttack();
    $('#fc-no').onclick = () => { this.mode = this.prevMode; this.select(this.sel); };
    const mm = $('#minimap');
    const mmGo = (e) => {
      const rect = mm.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width * this.g.map.size.w, y = (e.clientY - rect.top) / rect.height * this.g.map.size.h;
      this.r.centerOn(x, y, false);
    };
    mm.addEventListener('pointerdown', (e) => { mmGo(e); mm.setPointerCapture(e.pointerId); mm.onpointermove = mmGo; });
    mm.addEventListener('pointerup', () => { mm.onpointermove = null; });
  }

  refresh() {
    const g = this.g, p = g.players[0];
    $('#round').textContent = g.round;
    const ph = g.dayPhase(); const tz = $('#daytime'); if (tz) { tz.textContent = { morgen: 'Morgengrauen', tag: 'Smogtag', abend: 'Abend', nacht: 'Nacht' }[ph]; tz.parentElement.classList.toggle('night', ph === 'nacht'); }
    $('#credits').textContent = Math.floor(p.credits).toLocaleString('de-DE');
    const pw = $('#power');
    pw.textContent = `${p.powerProd - p.powerUse >= 0 ? '+' : ''}${p.powerProd - p.powerUse}`;
    pw.parentElement.classList.toggle('low', p.low);
    const left = g.ownUnits(0).filter((u) => !u.acted && !u.carried && !u.moved && !(u.def.harvester && u.auto)).length;
    $('#nextunit').textContent = left ? `Nächste Einheit (${left})` : 'Nächste Einheit';
    const ob = $('#objectives');
    if (g.mission) {
      const st = g.missionStatus || g.mission.check(g);
      ob.innerHTML = `<b>${g.mission.title}</b>` + st.lines.map((l) => `<div class="${l.ok ? 'ok' : ''}">${l.ok ? '✓' : '○'} ${l.text}</div>`).join('');
      ob.classList.add('show');
    } else ob.classList.remove('show');
    const cb = $('#cardsbtn'); cb.textContent = `Hacks (${p.cards.length})`; cb.classList.toggle('ready', p.cards.length > 0 && g.canPlayCard(0));
    if (this.sel && !this.sel.dead) this.showPanel(this.sel, true);
  }

  flash(text) { this.g.say(text, 'info'); }

  updateLog() {
    const el = $('#log');
    const now = performance.now();
    const items = this.g.log.filter((m) => now - m.t < 7000).slice(-5);
    const html = items.map((m) => `<div class="msg ${m.kind}" style="opacity:${Math.min(1, (7000 - (now - m.t)) / 1200)}">${m.text}</div>`).join('');
    if (html !== this._logHtml) { el.innerHTML = html; this._logHtml = html; }
  }

  showForecast(t, f) {
    const el = $('#forecast');
    const name = t.isBuilding ? t.def.name : t.def.name;
    el.querySelector('.fc-title').textContent = `Angriff auf ${name}`;
    el.querySelector('.fc-dmg').textContent = `${Math.round(f.dmg)} %${f.kills ? ' · zerstört' : ''}`;
    el.querySelector('.fc-ctr').textContent = f.kills ? '—' : `${Math.round(f.counter)} %`;
    el.classList.add('show');
  }
  hideForecast() { $('#forecast').classList.remove('show'); }

  showTerrainInfo(c, r) {
    const g = this.g;
    if (!g.explored[g.i(c, r)]) { this.showPanel(null); return; }
    const po = g.poiAt(c, r);
    if (po) {
      const d = POIS[po.type], own = po.owner >= 0 ? g.players[po.owner] : null;
      $('#panel').innerHTML = `<div class="p-head"><div><div class="p-name">${d.icon} ${d.name}</div><div class="p-sub" style="color:${own ? own.color : '#cfc4b0'}">${own ? 'Gehalten von ' + own.name : 'Unbesetzt'}</div></div><button class="x" data-a="close">×</button></div>
        <p class="p-poi">${d.text}</p>
        <p class="p-poi"><b>Einnehmen:</b> Eine eigene Bodeneinheit auf dem Feld zu Beginn eures Zuges. Der Ort bleibt eurer, bis eine feindliche Einheit ihn besetzt.</p>${this.rallyBtn()}`;
      $('#panel').classList.add('show');
      $('#panel').querySelector('[data-a="close"]')?.addEventListener('click', () => this.showPanel(null));
      this.hookRally(c, r);
      return;
    }
    const t = TERRAIN[g.terr(c, r)];
    const sp = g.spiceAt(c, r);
    const mc = (mt) => { const v = MOVE_COST[mt][g.terr(c, r)]; return v === Infinity ? '—' : v; };
    $('#panel').innerHTML = `<div class="p-head"><div><div class="p-name">${t.name}</div><div class="p-sub">Feld ${c}·${r}</div></div></div>
      <div class="p-grid"><span>Deckung</span><b>${Math.round(t.def * 100)} %</b><span>Bebaubar</span><b>${t.build ? 'ja' : 'nein'}</b>
      <span>Psychogebiet</span><b>${t.sand ? 'ja' : 'nein'}</b><span>Chrom</span><b>${Math.round(sp)}</b>
      <span>Kosten Fuß/Rad/Kette</span><b>${mc('foot')}/${mc('wheel')}/${mc('track')}</b></div>
      ${g.inStorm(c, r) ? '<div class="p-warn">Im Smog — unpassierbar</div>' : g.stormNext(c, r) ? '<div class="p-warn">Smog zieht nächste Runde hierher</div>' : ''}${this.rallyBtn()}`;
    $('#panel').classList.add('show');
    this.hookRally(c, r);
  }

  // ---------- Sammelbefehl: alle Einheiten (außer Ernter/Träger) marschieren zu einem Feld ----------
  rallyUnits() { return this.g.ownUnits(0).filter((u) => !u.dead && !u.carried && !u.def.harvester && !u.def.carrier); }
  rallyBtn() {
    const g = this.g;
    if (g.current !== 0 || g.state !== 'play' || !this.rallyUnits().length) return '';
    return '<button class="primary wide" data-a="rally">⚑ Alle Einheiten hierher</button><div class="pi-why" style="color:#cfc4b0">Außer Sammler und Träger. Sie marschieren auch in den nächsten Runden weiter, bis sie da sind oder ihr sie selbst bewegt.</div>';
  }
  hookRally(c, r) {
    const b = $('#panel').querySelector('[data-a="rally"]'); if (!b) return;
    b.onclick = async () => { if (this.busy) return; await this.rallyTo(c, r); };
  }
  async rallyTo(c, r) {
    const us = this.rallyUnits();
    for (const u of us) u.rally = { c, r };
    this.showPanel(null);
    this.flash(`${us.length} Einheiten auf dem Marsch`);
    await this.rallyStep();
  }
  async rallyStep() {
    const g = this.g;
    const list = this.rallyUnits().filter((u) => u.rally);
    if (!list.length) return;
    this.busy = true;
    // nächste zuerst, damit die Spitze den Weg freimacht
    list.sort((a, b) => distance(a.c, a.r, a.rally.c, a.rally.r) - distance(b.c, b.r, b.rally.c, b.rally.r));
    for (const u of list) {
      if (u.dead || !u.rally) continue;
      const { c, r } = u.rally;
      if (distance(u.c, u.r, c, r) <= 1 || (u.c === c && u.r === r)) { u.rally = null; continue; }
      if (u.moved || u.acted) continue;
      const reach = g.reachable(u), field = g.distanceField(u);
      const st = g.stepToward(u, field, c, r, reach);
      if (!st || (st.c === u.c && st.r === u.r)) continue;
      await this.doMove(u, st.c, st.r, reach);
      if (!u.dead && distance(u.c, u.r, c, r) <= 1) u.rally = null;
      if (g.state !== 'play') break;
    }
    this.busy = false;
    this.refresh();
  }

  showPanel(e, keep = false) {
    const el = $('#panel');
    if (!e || e.dead) { el.classList.remove('show'); el.innerHTML = ''; return; }
    const g = this.g;
    const own = e.owner === 0;
    const col = g.players[e.owner].color;
    const pct = e.isBuilding ? e.hp / e.maxHp * 100 : e.hp;
    const bar = `<div class="hpbar"><i style="width:${pct}%;background:${pct > 60 ? '#6fdc6a' : pct > 30 ? '#f2d35b' : '#ff6a50'}"></i></div>`;
    let html = `<div class="p-head"><canvas class="p-icon"></canvas><div><div class="p-name">${e.def.name}</div><div class="p-sub" style="color:${col}">${g.players[e.owner].name}${e.isUnit ? ` · Stärke ${Math.ceil(e.hp)}` : ''}</div>${bar}</div><button class="more" data-a="expand">${this.expanded ? 'Weniger' : 'Details'}</button><button class="x" data-a="close">×</button></div>`;
    if (e.isUnit) {
      const w = g.weapon(e);
      html += `<div class="p-grid">
        <span>Stärke</span><b>${Math.ceil(e.hp)} / 100</b>
        <span>Bewegung</span><b>${e.def.move} (${MT_NAME[e.def.mt]})</b>
        <span>Panzerung</span><b>${ARMOR_NAME[e.def.armor]}</b>
        <span>Sicht</span><b>${e.def.sight}</b>
        ${w ? `<span>Waffe</span><b>Stärke ${w.power} · Reichweite ${w.range[0] === w.range[1] ? w.range[0] : w.range.join('–')}${w.air ? ' · Luft' : ''}${w.ground ? '' : ' (nur Luft)'}</b>` : ''}
        ${e.def.ammo ? `<span>Munition</span><b>${e.ammo} / ${e.def.ammo}</b>` : ''}
        ${e.def.harvester ? `<span>Ladung</span><b>${Math.round(e.cargo)} / ${e.def.capacity}</b>` : ''}
        ${e.def.carrier ? `<span>Fracht</span><b>${e.carrying ? g.get(e.carrying)?.def.name : 'leer'}</b>` : ''}
        ${e.def.mt !== 'air' ? `<span>Gelände</span><b>${TERRAIN[g.terr(e.c, e.r)].name} (${Math.round(TERRAIN[g.terr(e.c, e.r)].def * 100)} % Deckung)</b>` : ''}
      </div><div class="p-desc">${e.def.desc}</div>`;
      if (own && g.current === 0) {
        const btns = [];
        if (e.def.harvester) btns.push(`<button data-a="auto" class="${e.auto ? 'on' : ''}">Auto-Ernte: ${e.auto ? 'an' : 'aus'}</button>`);
        const tg = g.canFire(e) ? g.targetsFrom(e, e.c, e.r).length : 0;
        if (tg && e.moved) btns.push(`<span class="hint">${tg} Ziel${tg > 1 ? 'e' : ''} in Reichweite — rot markiert antippen</span>`);
        if (e.def.capture && !e.acted) {
          if (g.adjBuildings(e, true).length) btns.push('<button data-a="capture" class="purple">Übernehmen</button>');
          if (g.adjBuildings(e, false).some((b) => b.hp < b.maxHp)) btns.push('<button data-a="repair">Reparieren</button>');
          if (!g.adjBuildings(e, true).length && !g.adjBuildings(e, false).some((b) => b.hp < b.maxHp)) btns.push('<button disabled>Neben ein Gebäude ziehen</button>');
        }
        if (e.def.infiltrate && !e.acted) btns.push(g.adjBuildings(e, true).length ? '<button data-a="infiltrate" class="purple">Infiltrieren</button>' : '<button disabled>Neben feindliches Gebäude ziehen</button>');
        if (e.def.callWorm) btns.push(g.canCallWorm(e) ? '<button data-a="callworm" class="purple">Psycho rufen</button>' : `<button disabled>Psychoruf bereit in ${e.wormCd || 0} ${e.wormCd === 1 ? 'Runde' : 'Runden'}</button>`);
        if (e.def.stealth) btns.push(`<span class="hint">${g.stealthed(e, 1) ? 'Getarnt' : 'Sichtbar'}</span>`);
        if (e.def.thumper) btns.push(g.canThump(e) ? '<button data-a="thump" class="purple">Störsender setzen</button>' : `<button disabled>Störsender bereit in ${e.thumpCd || 0} ${e.thumpCd === 1 ? 'Runde' : 'Runden'}</button>`);
        if (e.def.voice) btns.push(g.canVoice(e) ? (g.voiceTargets(e).length ? '<button data-a="voice" class="purple">Stimme einsetzen</button>' : '<button disabled>Stimme: kein Ziel in 2 Feldern</button>') : `<button disabled>Stimme bereit in ${e.voiceCd || 0} ${e.voiceCd === 1 ? 'Runde' : 'Runden'}</button>`);
        if (e.stunned > 0 || e.wasStunned) btns.push('<button disabled>Gelähmt</button>');
        if (e.def.carrier) btns.push(`<button data-a="auto" class="${e.auto ? 'on' : ''}">Auto-Transport: ${e.auto ? 'an' : 'aus'}</button>`);
        if (e.def.carrier && !e.acted) {
          if (e.carrying) btns.push('<button data-a="drop">Absetzen</button>');
          else if (g.units.some((t) => g.canPickup(e, t))) btns.push('<button data-a="pickup">Aufnehmen</button>');
        }
        if (g.canLand(e)) btns.push('<button data-a="land">⬇ Landen</button>');
        if (e.landed) btns.push(g.canTakeoff(e) ? '<button data-a="takeoff" class="primary">⬆ Starten</button>' : '<button disabled>Gelandet — nächste Runde startbereit</button>');
        if (!e.acted) btns.push('<button data-a="wait">Warten</button>');
        html += `<div class="p-actions">${btns.join('')}</div>`;
        const state = e.acted ? 'Hat gehandelt' : e.moved ? (g.canFire(e) ? 'Bewegt — kann noch angreifen' : 'Bewegt') : 'Bereit';
        html += `<div class="p-state">${state}</div>`;
      }
    } else {
      html += `<div class="p-grid"><span>Zustand</span><b>${Math.ceil(e.hp)} / ${e.maxHp}</b>
        <span>Energie</span><b>${e.def.power > 0 ? '+' : ''}${e.def.power}</b>
        ${e.turnsLeft > 0 ? `<span>Im Bau</span><b>noch ${e.turnsLeft} ${e.turnsLeft === 1 ? 'Runde' : 'Runden'}</b>` : ''}
        ${e.producing ? `<span>Produziert</span><b>${UNITS[e.producing].name} (nächste Runde)</b>` : ''}</div>
        <div class="p-desc">${e.def.desc}</div>`;
      if (own && g.current === 0 && e.turnsLeft <= 0) html += this.buildMenuHtml(e);
    }
    if (e.isUnit) html += `<div class="p-detail">${this.profileHtml('unit', e.type)}</div>`;
    el.innerHTML = html;
    el.classList.add('show');
    el.classList.toggle('expanded', !!this.expanded);
    if (this.infoSel && el.querySelector('.cards')) this.showInfo(this.infoSel.kind, this.infoSel.type, e);
    const ic = el.querySelector('.p-icon');
    if (ic) { const src = icon(e.isUnit ? 'unit' : 'bld', e.type, col), d = Math.min(3, window.devicePixelRatio || 1); ic.width = 60 * d; ic.height = 45 * d; const ix = ic.getContext('2d'); ix.imageSmoothingQuality = 'high'; ix.drawImage(src, 0, 0, ic.width, ic.height); }
    el.querySelectorAll('canvas[data-icon]').forEach((c) => { const [k, t] = c.dataset.icon.split(':'); const src = icon(k, t, g.players[0].color), d = Math.min(3, window.devicePixelRatio || 1); c.width = 96 * d; c.height = 72 * d; const ix = c.getContext('2d'); ix.imageSmoothingQuality = 'high'; ix.drawImage(src, 0, 0, c.width, c.height); });
    el.querySelectorAll('[data-a]').forEach((b) => b.onclick = (ev) => this.panelAction(b.dataset.a, b.dataset.t, e, ev));
  }

  showInfo(kind, type, b) {
    const g = this.g, p = g.players[0], box = $('#pinfo'); if (!box) return;
    const isB = kind === 'bld', d = isB ? BUILDINGS[type] : UNITS[type];
    const cost = isB ? d.cost : g.unitCost(0, type);
    const ok = isB ? (g.bauhofReady(0) && g.prereqOk(0, d) && p.credits >= cost) : g.canProduce(b, type);
    const missing = g.prereqOk(0, d) ? '' : 'Benötigt: ' + (d.prereq || []).filter((x) => !g.has(0, x)).map((x) => BUILDINGS[x].name).join(', ');
    const why = ok ? '' : missing || (p.credits < cost ? 'Zu wenig Credits' : isB ? 'Kommandoblock hat diese Runde schon gebaut' : b.producing ? 'Produziert bereits' : p.low ? 'Energie zu niedrig' : 'Nicht verfügbar');
    box.innerHTML = `<div class="pi-head"><b>${d.name}</b><span>◈ ${cost}${isB ? ` · ${d.turns} ${d.turns === 1 ? 'Runde' : 'Runden'}` : ' · nächste Runde'}</span></div>
      ${this.profileHtml(kind, type)}
      ${isB ? (ok ? '<div class="pi-hint">▶ Grünes Feld auf der Karte antippen, um zu bauen</div>' : '') : `<button class="primary wide" data-a="prod" data-t="${type}" ${ok ? '' : 'disabled'}>Produzieren</button>`}${why ? `<div class="pi-why">${why}</div>` : ''}`;
    box.querySelectorAll('[data-a]').forEach((btn) => btn.onclick = () => this.panelAction(btn.dataset.a, btn.dataset.t, b));
    document.querySelectorAll('#panel .card').forEach((c) => c.classList.toggle('sel', c.dataset.t === `${kind}:${type}`));
  }

  profileHtml(kind, type) {
    const CLS = { inf: 'Infanterie', light: 'leichte Fahrzeuge', heavy: 'Panzer', bld: 'Gebäude', air: 'Schweber' };
    if (kind === 'bld') {
      const d = BUILDINGS[type];
      const extra = [];
      if (d.power) extra.push(`Energie ${d.power > 0 ? '+' : ''}${d.power}`);
      if (d.weapon) { const w = WEAPONS[d.weapon]; extra.push(`Reichweite ${w.range.join('–')}`); }
      return `<div class="pi-desc">${d.desc}</div><div class="pi-tags">${extra.map((x) => `<span>${x}</span>`).join('')}<span>Stabilität ${d.hp}</span></div>`;
    }
    const d = UNITS[type], w = WEAPONS[d.weapon];
    const strong = [], weak = [];
    if (w) for (const [k, v] of Object.entries(ARMOR_MOD[w.type])) {
      const can = k === 'air' ? w.air : w.ground;
      if (!can || v <= 0.3) weak.push(CLS[k]); else if (v >= 0.9) strong.push(CLS[k]);
    }
    const threats = Object.entries(UNITS).filter(([, o]) => o.weapon && o.cost && ARMOR_MOD[WEAPONS[o.weapon].type][d.armor] >= 0.95 && (d.mt === 'air' ? WEAPONS[o.weapon].air : WEAPONS[o.weapon].ground)).map(([, o]) => o.name).slice(0, 4);
    const tags = [`Bewegung ${d.move}`, `Sicht ${d.sight}`, `Panzerung: ${CLS[d.armor] || d.armor}`];
    if (w) tags.push(`Waffe ${w.power} · Reichweite ${w.range[0] === w.range[1] ? w.range[0] : w.range.join('–')}`);
    if (d.ammo) tags.push(`Munition ${d.ammo}`);
    if (d.faction) tags.unshift(`Exklusiv: ${FACTIONS[d.faction].name}`);
    if (d.stealth) tags.push(d.stealth === 'sand' ? 'Getarnt auf der Straße' : d.stealth === 'still' ? 'Getarnt, solange still' : 'Immer getarnt');
    if (d.shield) tags.push('Schild');
    if (d.medic) tags.push(`Versorgt Nachbarn +${d.medic}/Runde`);
    if (d.tough || d.elite) tags.push(`Erleidet ${Math.round((d.tough || d.elite) * 100)} % Schaden`);
    return `<div class="pi-desc">${d.desc}</div><div class="pi-tags">${tags.map((x) => `<span>${x}</span>`).join('')}</div>
      ${w ? `<div class="pi-row good"><b>Stark gegen</b> ${strong.join(', ') || '—'}</div><div class="pi-row bad"><b>Schwach gegen</b> ${weak.join(', ') || '—'}</div>` : '<div class="pi-row"><b>Unbewaffnet</b></div>'}
      ${threats.length ? `<div class="pi-row warn"><b>Gefährdet durch</b> ${threats.join(', ')}</div>` : ''}
      ${w && w.noMoveFire ? '<div class="pi-row">Kann nicht ziehen und feuern in derselben Runde, kein Gegenschlag gegen ihn.</div>' : ''}`;
  }

  buildMenuHtml(b) {
    const g = this.g, p = g.players[0];
    let items = [], title = '';
    if (b.type === 'bauhof') {
      const ready = g.bauhofReady(0);
      title = ready ? 'Bauen (ein Gebäude pro Runde)' : 'Kommandoblock hat diese Runde schon gebaut';
      for (const [t, d] of Object.entries(BUILDINGS)) {
        if (d.buildable === false) continue;
        const pre = g.prereqOk(0, d), money = p.credits >= d.cost;
        const missing = pre ? '' : 'Benötigt: ' + d.prereq.filter((x) => !g.has(0, x)).map((x) => BUILDINGS[x].name).join(', ');
        items.push({ kind: 'bld', t, d, ok: ready && pre && money, missing, sub: `${d.cost} · ${d.turns} ${d.turns === 1 ? 'Runde' : 'Runden'}` });
      }
    } else if (b.def.produces) {
      title = b.producing ? `In Produktion: ${UNITS[b.producing].name}` : p.low ? 'Energie zu niedrig für Produktion' : 'Produzieren (fertig nächste Runde)';
      for (const [t, d] of Object.entries(UNITS)) {
        if (d.cat !== b.def.produces) continue;
        if (d.faction && d.faction !== p.faction) continue;
        const pre = g.prereqOk(0, d);
        const missing = pre ? '' : 'Benötigt: ' + d.prereq.filter((x) => !g.has(0, x)).map((x) => BUILDINGS[x].name).join(', ');
        items.push({ kind: 'unit', t, d, ok: g.canProduce(b, t), missing, sub: `${g.unitCost(0, t)}` });
      }
    } else if (b.type === 'kontor') {
      const can = g.canDrop(0);
      title = !g.active(b) ? 'Fixer-Büro außer Betrieb' : p.low ? 'Energie zu niedrig' : p.dropCd > 0 ? `Fixerin wieder bereit in ${p.dropCd} ${p.dropCd === 1 ? 'Runde' : 'Runden'}` : p.freeDrop ? 'AV-Drop — der nächste ist kostenlos' : 'AV-Drop (landet nächste Runde)';
      const html = Object.entries(DROPS).map(([id, d]) => {
        const cost = g.dropCost(0, id), ok = can && p.credits >= cost;
        return `<button class="drop ${ok ? '' : 'locked'}" data-a="orbital" data-t="${id}"><b>${d.name}</b><span>${d.desc}</span><em>◈ ${cost}</em></button>`;
      }).join('');
      const sc = p.strikeCd || 0, sok = g.canStrike(0);
      const strike = `<div class="p-title">Satellitenschlag</div><button class="drop ${sok ? '' : 'locked'}" data-a="strike"><b>Schlag anfordern</b><span>Trifft das Zielfeld und alle Nachbarn zu Beginn eurer nächsten Runde: ${ORBITAL_STRIKE.unitDmg} Schaden an Einheiten, ${ORBITAL_STRIKE.bldDmg * 100} % an Gebäuden. Der Feind sieht die Zielmarkierung.${sc ? ` Bereit in ${sc} ${sc === 1 ? 'Runde' : 'Runden'}.` : ''}</span><em>◈ ${ORBITAL_STRIKE.cost}</em></button>`;
      const eg = ENDGAME[p.faction];
      let endg = '';
      if (eg) {
        const eok = g.canEndgame(0);
        const why = p.endgameUsed ? 'Bereits eingesetzt (einmal pro Partie).' : g.round < ENDGAME_ROUND ? `Verfügbar ab Runde ${ENDGAME_ROUND}.` : p.credits < eg.cost ? 'Zu wenig Credits.' : '';
        endg = `<div class="p-title">Entscheidungsschlag</div><button class="drop endgame ${eok ? '' : 'locked'}" data-a="endgame"><b>${eg.name}</b><span>${eg.desc} Landet zu Beginn eurer nächsten Runde, mindestens 3 Felder von feindlichen Gebäuden entfernt. Der Feind sieht die Ankunftszone.${why ? ' ' + why : ''}</span><em>◈ ${eg.cost}</em></button>`;
      }
      return `<div class="p-title">${title}</div><div class="drops">${html}</div><div class="drops">${strike}</div><div class="drops">${endg}</div>`;
    } else if (b.type === 'konvent' && !items.length) {
      title = 'Ausbilden (fertig nächste Runde)';
    } else return '';
    if (b.type === 'konvent') {
      title = b.producing ? `In Ausbildung: ${UNITS[b.producing].name}` : 'Ausbilden (fertig nächste Runde)';
      items = [{ kind: 'unit', t: 'schwester', d: UNITS.schwester, ok: g.canProduce(b, 'schwester'), missing: '', sub: `${g.unitCost(0, 'schwester')}` }];
    }
    const cards = items.map((it) => `<button class="card ${it.ok ? '' : 'locked'}" data-a="info" data-t="${it.kind}:${it.t}" title="${it.missing || it.d.desc}">
      <canvas data-icon="${it.kind === 'bld' ? 'bld' : 'unit'}:${it.t}"></canvas><span class="c-name">${it.d.name}</span><span class="c-cost">◈ ${it.sub}</span>${it.missing ? `<span class="c-lock">${it.missing}</span>` : ''}</button>`).join('');
    const cancel = b.producing ? '<button data-a="cancelprod" class="wide">Produktion abbrechen (Rückerstattung)</button>' : '';
    return `<div class="p-title">${title}</div><div class="cards">${cards}</div><div id="pinfo"><div class="pi-empty">Antippen für Details, Stärken und Schwächen</div></div>${cancel}`;
  }

  startBuild(t, fromCard) {
    const g = this.g, d = BUILDINGS[t];
    if (!g.bauhofReady(0) || !g.prereqOk(0, d) || g.players[0].credits < d.cost) {
      if (this.mode === 'build') { this.clearHL(); this.mode = 'idle'; }
      if (!fromCard) this.flash(g.players[0].credits < d.cost ? 'Zu wenig Credits' : 'Noch nicht verfügbar');
      return;
    }
    const sel = this.r.hl.sel;
    this.clearHL(); this.r.hl.sel = sel; this.mode = 'build'; this.buildType = t;
    this.r.hl.build = g.buildHexes(0, t);
    if (!this.r.hl.build.length) { this.flash('Kein freies Betonfeld in Reichweite der Basis'); this.mode = 'idle'; return; }
    this.flash(`${d.name}: grünes Feld antippen`);
    // Menü einklappen, damit alle Bauplätze frei liegen
    $('#panel').classList.remove('show');
  }

  panelAction(a, t, e) {
    const g = this.g;
    if (this.busy && a !== 'close') return;
    if (a === 'close') { this.deselect(); return; }
    if (a === 'expand') { this.expanded = !this.expanded; this.showPanel(e); return; }
    if (a === 'info') {
      const [kind, type] = t.split(':'); this.infoSel = { kind, type }; this.showInfo(kind, type, e);
      // Gebäude: Antippen der Karte startet direkt das Platzieren, ohne extra Bauen-Knopf
      if (kind === 'bld') this.startBuild(type, true);
      return;
    }
    if (a === 'wait') { e.acted = true; e.moved = true; this.deselect(); this.refresh(); return; }
    if (a === 'land') { if (g.canLand(e)) { this.busy = true; this.animLand(e, true).then(() => { this.busy = false; this.deselect(); this.refresh(); }); } return; }
    if (a === 'takeoff') { if (g.canTakeoff(e)) { this.busy = true; this.animLand(e, false).then(() => { this.busy = false; this.select(e); this.refresh(); }); } return; }
    if (a === 'auto') { e.auto = !e.auto; this.showPanel(e); return; }
    if (a === 'build') { this.infoSel = null; this.startBuild(t, false); return; }
    if (a === 'prod') { this.infoSel = null; if (g.produce(e, t)) { this.flash(`${UNITS[t].name} in Auftrag gegeben`); this.refresh(); this.showPanel(e); } else this.flash('Produktion nicht möglich'); return; }
    if (a === 'cancelprod') { g.cancelProduce(e); this.refresh(); this.showPanel(e); return; }
    if (a === 'capture' || a === 'infiltrate') { this.mode = a; this.clearHL(); this.r.hl.sel = e; this.r.hl.target = g.adjBuildings(e, true).map((b) => [b.c, b.r]); this.flash('Feindliches Gebäude antippen'); return; }
    if (a === 'repair') { this.mode = 'repair'; this.clearHL(); this.r.hl.sel = e; this.r.hl.target = g.adjBuildings(e, false).filter((b) => b.hp < b.maxHp).map((b) => [b.c, b.r]); this.flash('Eigenes Gebäude antippen'); return; }
    if (a === 'callworm') { this.mode = 'callworm'; this.clearHL(); this.r.hl.sel = e; this.r.hl.target = g.callWormHexes(e); this.flash('Straßenfeld für die Psycho-Rotte antippen (bis 5 Felder)'); return; }
    if (a === 'endgame') {
      if (!g.canEndgame(0)) { this.flash('Entscheidungsschlag noch nicht verfügbar'); return; }
      this.clearHL(); this.mode = 'endgame'; this.r.hl.target = g.endgameHexes(0); $('#panel').classList.remove('show'); this.flash(`${ENDGAME[g.players[0].faction].name}: Zielfeld antippen`); return;
    }
    if (a === 'strike') {
      if (!g.canStrike(0)) { this.flash(g.players[0].credits < ORBITAL_STRIKE.cost ? 'Zu wenig Credits' : 'Satellit noch nicht bereit'); return; }
      this.clearHL(); this.mode = 'strike'; this.r.hl.target = g.strikeHexes(0); $('#panel').classList.remove('show'); this.flash('Zielfeld für den Satellitenschlag antippen (trifft 7 Felder)'); return;
    }
    if (a === 'thump') { this.mode = 'thump'; this.clearHL(); this.r.hl.sel = e; this.r.hl.target = g.thumpHexes(e); this.flash('Straßenfeld für den Störsender antippen (bis 2 Felder)'); return; }
    if (a === 'voice') { this.mode = 'voice'; this.clearHL(); this.r.hl.sel = e; this.r.hl.target = g.voiceTargets(e).map((t) => [t.c, t.r]); this.flash('Ziel für die Stimme antippen'); return; }
    if (a === 'orbital') {
      const cost = g.dropCost(0, t);
      if (!g.canDrop(0) || g.players[0].credits < cost) { this.flash(g.players[0].credits < cost ? 'Zu wenig Credits' : 'Fixerin gerade nicht bereit'); return; }
      this.clearHL(); this.mode = 'orbital'; this.dropId = t; this.r.hl.target = g.orbitalHexes(0);
      $('#panel').classList.remove('show'); this.flash(`${DROPS[t].name}: Landezone antippen`); return;
    }
    if (a === 'pickup') { this.mode = 'pickup'; this.clearHL(); this.r.hl.sel = e; this.r.hl.drop = g.units.filter((u) => g.canPickup(e, u)).map((u) => [u.c, u.r]); this.flash('Einheit zum Aufnehmen antippen'); return; }
    if (a === 'drop') { this.mode = 'drop'; this.clearHL(); this.r.hl.sel = e; this.r.hl.drop = g.dropHexes(e); this.flash('Feld zum Absetzen antippen'); return; }
  }

  showCards() {
    const g = this.g, p = g.players[0], el = $('#cards');
    if (el.classList.contains('show')) { el.classList.remove('show'); return; }
    const can = g.canPlayCard(0) && !this.busy;
    const hand = p.cards.map((id, i) => `<div class="icard"><canvas data-card="${id}"></canvas><b>${CARDS[id].name}</b><p>${CARDS[id].desc}</p><button class="primary" data-i="${i}" ${can ? '' : 'disabled'}>Ausspielen</button></div>`).join('');
    const has = g.has(0, 'konvent');
    el.innerHTML = `<div class="box"><button class="close">×</button><h2>Hacks des Netrunner-Kollektivs</h2>
      <div class="sub">${has ? `Neue Karte in ${3 - p.cardTimer} ${3 - p.cardTimer === 1 ? 'Runde' : 'Runden'} · ` : 'Baut einen Netzknoten, um Karten zu erhalten · '}Eine Karte pro Runde${can ? '' : ' — diese Runde schon gespielt'}</div>
      <div class="hand">${hand || '<p class="empty">Keine Karten auf der Hand.</p>'}</div></div>`;
    el.querySelectorAll('canvas[data-card]').forEach((c) => { const src = cardArt(c.dataset.card); c.width = 120; c.height = 80; c.getContext('2d').drawImage(src, 0, 0); });
    el.querySelectorAll('button[data-i]').forEach((b) => b.onclick = () => this.playCardUI(Number(b.dataset.i)));
    el.querySelector('.close').onclick = () => el.classList.remove('show');
    el.classList.add('show');
  }

  async playCardUI(i) {
    const g = this.g, id = g.players[0].cards[i];
    $('#cards').classList.remove('show');
    if (!id || !g.canPlayCard(0)) return;
    if (CARDS[id].target === 'none') { this.busy = true; await this.doCard(0, i); this.busy = false; this.refresh(); return; }
    const ts = g.cardTargets(0, id);
    if (!ts.length) { this.flash('Kein gültiges Ziel für diese Karte'); return; }
    this.deselect(); this.mode = 'card'; this.cardIdx = i; this.r.hl.target = ts;
    this.flash(`${CARDS[id].name}: Ziel antippen`);
  }

  drawMinimap() {
    const g = this.g, cv = $('#minimap'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const W = cv.width, H = cv.height, sx = W / g.map.size.w, sy = H / g.map.size.h;
    ctx.drawImage(g.map.base, 0, 0, W, H);
    const cols = { sand: null };
    for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
      const i = g.i(c, r), p = center(c, r);
      if (!g.explored[i]) { ctx.fillStyle = 'rgba(6,4,8,0.95)'; ctx.fillRect((p.x - R) * sx, (p.y - R) * sy, R * 2 * sx + 1, R * 2 * sy + 1); continue; }
      if (g.spiceAt(c, r) > 0) { ctx.fillStyle = 'rgba(220,100,40,0.8)'; ctx.fillRect((p.x - 10) * sx, (p.y - 10) * sy, 20 * sx + 1, 20 * sy + 1); }
      if (!g.visible[i]) { ctx.fillStyle = 'rgba(6,4,8,0.4)'; ctx.fillRect((p.x - R) * sx, (p.y - R) * sy, R * 2 * sx + 1, R * 2 * sy + 1); }
    }
    for (const b of g.buildings) if (g.seen(b)) { const p = center(b.c, b.r); ctx.fillStyle = g.players[b.owner].color; ctx.fillRect(p.x * sx - 3, p.y * sy - 3, 6, 6); }
    for (const u of g.units) if (!u.carried && g.seen(u)) { const p = center(u.c, u.r); ctx.fillStyle = g.players[u.owner].color; ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, 2, 0, 6.28); ctx.fill(); }
    for (const po of g.pois || []) { const p = center(po.c, po.r); ctx.save(); ctx.translate(p.x * sx, p.y * sy); ctx.rotate(0.785); ctx.fillStyle = po.owner >= 0 ? g.players[po.owner].color : '#e8dcc4'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1; ctx.fillRect(-3.5, -3.5, 7, 7); ctx.strokeRect(-3.5, -3.5, 7, 7); ctx.restore(); }
    for (const w of g.worms) if (g.wormSeen(w)) { const p = center(w.c, w.r); ctx.strokeStyle = '#ffcc66'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, 3.5, 0, 6.28); ctx.stroke(); }
    const s = g.storm; if (s) { const p = center(s.c, s.r); ctx.fillStyle = 'rgba(200,130,60,0.45)'; ctx.beginPath(); ctx.arc(p.x * sx, p.y * sy, (s.rad + 0.5) * 66 * sx, 0, 6.28); ctx.fill(); }
    const cam = this.r.cam;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1;
    ctx.strokeRect(cam.x * sx, cam.y * sy, this.r.vw / cam.z * sx, this.r.vh / cam.z * sy);
  }
}
