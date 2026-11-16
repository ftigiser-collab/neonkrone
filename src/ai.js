// Gegner-KI und Auto-Ernter (gemeinsam genutzt)
import { UNITS, BUILDINGS, CARDS, DROPS, ORBITAL_STRIKE, ENDGAME_ROUND } from './data.js';
import { ring } from './hex.js';
import { distance, neighbors } from './hex.js';

const PLAN = ['windfalle', 'raffinerie', 'kaserne', 'windfalle', 'fabrik', 'turm', 'raffinerie', 'horst', 'ausguck', 'windfalle', 'kontor', 'konvent', 'turm', 'windfalle', 'felsenhort', 'flak', 'windfalle', 'fabrik', 'turm', 'raffinerie', 'turm', 'flak', 'windfalle'];

function value(g, e) {
  if (e.isBuilding) return e.type === 'bauhof' ? 2500 : e.def.weapon ? 900 : e.def.cost * 0.6;
  return e.def.cost * (e.def.harvester ? 1.4 : 1);
}

export function dangerFn(g, owner) {
  const knows = (w) => owner !== 0 || g.wormSeen(w);
  return (c, r) => {
    let d = 0;
    if (g.stormNext(c, r)) d += 8;
    if (g.isSand(c, r)) for (const w of g.worms) if (knows(w)) { const dd = distance(c, r, w.c, w.r); if (dd <= 4) d += 5 - dd; if (w.lock && dd <= 6) d += 4; }
    return d;
  };
}

// ---------- Auto-Ernter ----------
export async function autoHarvest(g, u, act) {
  if (u.dead || u.moved || u.carried) return;
  const cap = u.def.capacity;
  const danger = dangerFn(g, u.owner);
  const here = danger(u.c, u.r);
  const refs = g.buildings.filter((b) => !b.dead && b.owner === u.owner && b.type === 'raffinerie' && b.turnsLeft <= 0);
  const nearRef = refs.some((b) => distance(b.c, b.r, u.c, u.r) <= 1);
  if (here < 3) {
    if (g.spiceAt(u.c, u.r) > 0 && u.cargo < cap) return;
    if (nearRef && u.cargo > 0) return;
  }
  const goHome = u.cargo >= cap - 1 || (here >= 3 && u.cargo > cap * 0.5);
  // Träger vorhanden: Ernter fahren nicht selbst zwischen Feld und Raffinerie, sie warten auf die Abholung
  // (nach zwei Runden ohne Abholung fahren sie doch selbst, damit nichts hängen bleibt)
  const hasCarrier = g.units.some((x) => !x.dead && x.owner === u.owner && x.def.carrier && x.auto && !x.carrying);
  let spD = 99;
  if (u.cargo === 0 && g.spiceAt(u.c, u.r) <= 0) for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) if (g.spiceAt(c, r) > 0) spD = Math.min(spD, distance(c, r, u.c, u.r));
  const needsLift = (goHome && !nearRef) || (u.cargo === 0 && nearRef && spD > 2);
  if (hasCarrier && needsLift && here < 3 && (u.waitCarry || 0) < 2) { u.waitCarry = (u.waitCarry || 0) + 1; return; }
  if (!needsLift) u.waitCarry = 0;
  const reach = g.reachable(u);
  const field = g.distanceField(u, (c, r) => danger(c, r) * 1.5);
  let target = null, bd = Infinity;
  if (goHome && refs.length) {
    for (const b of refs) for (const [c, r] of neighbors(b.c, b.r, g.W, g.H)) {
      const occ = g.unitAt(c, r, false);
      if ((occ && occ !== u) || g.buildingAt(c, r)) continue;
      const d = field.d[g.i(c, r)];
      if (d < bd) { bd = d; target = [c, r]; }
    }
  }
  if (!target && u.cargo < cap) {
    for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
      if (g.spiceAt(c, r) <= 0) continue;
      const occ = g.unitAt(c, r, false); if (occ && occ !== u) continue;
      const d = field.d[g.i(c, r)] + danger(c, r) * 3;
      if (d < bd) { bd = d; target = [c, r]; }
    }
  }
  if (!target && here >= 2) {
    // Flucht auf Fels
    for (const [k, n] of reach) if (n.end && !g.isSand(n.c, n.r)) { const d = n.cost; if (d < bd) { bd = d; target = [n.c, n.r]; } }
  }
  if (!target) return;
  const step = g.stepToward(u, field, target[0], target[1], reach);
  if (step && (step.c !== u.c || step.r !== u.r)) await act.move(u, step.c, step.r, reach);
}

// ---------- Auto-Träger (Lufttransport für Ernter) ----------
export async function autoCarry(g, car, act) {
  if (car.dead || car.acted || car.moved || car.carrying) return;
  const owner = car.owner;
  const refs = g.buildings.filter((b) => !b.dead && b.owner === owner && b.type === 'raffinerie' && b.turnsLeft <= 0);
  if (!refs.length) return;
  const knows = (w) => owner !== 0 || g.wormSeen(w);
  const wormD = (c, r) => Math.min(99, ...g.worms.filter(knows).map((w) => distance(c, r, w.c, w.r)));
  const harvs = g.ownUnits(owner).filter((u) => u.def.harvester && !u.carried && !u.acted && !u.moved);
  const refD = (u) => Math.min(...refs.map((b) => distance(b.c, b.r, u.c, u.r)));
  let best = null, bs = 0;
  for (const h of harvs) {
    const danger = g.isSand(h.c, h.r) ? Math.max(0, 6 - wormD(h.c, h.r)) : 0;
    let need = 0, goal = null;
    if (danger >= 2) { need = 10 + danger; goal = h.cargo > h.def.capacity * 0.4 ? 'ref' : 'spice'; }
    // Volle Ernter fliegen immer per Träger zurück zur Raffinerie
    else if (h.cargo >= h.def.capacity - 1 && refD(h) > 1) { need = 8 + refD(h); goal = 'ref'; }
    else if (h.cargo < h.def.capacity && g.spiceAt(h.c, h.r) <= 0 && h.cargo < h.def.capacity * 0.3) {
      let sp = 99; for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) if (g.spiceAt(c, r) > 0) sp = Math.min(sp, distance(c, r, h.c, h.r));
      if (sp > 2) { need = 4 + sp * 0.5; goal = 'spice'; }
    }
    if (!need) continue;
    const reach = g.reachable(car);
    let pick = null, pd = Infinity;
    for (const n of reach.values()) if (n.end && distance(n.c, n.r, h.c, h.r) <= 1 && n.cost < pd) { pd = n.cost; pick = n; }
    if (!pick) continue;
    if (need - pd * 0.2 > bs) { bs = need - pd * 0.2; best = { h, pick, reach, goal }; }
  }
  if (!best) return;
  const { h, pick, reach, goal } = best;
  if (pick.c !== car.c || pick.r !== car.r) await act.move(car, pick.c, pick.r, reach);
  if (car.dead || !g.canPickup(car, h)) return;
  await act.pickup(car, h);
  // Zweiter Flugabschnitt mit voller Reichweite (Träger sind auf Transport ausgelegt)
  car.moved = false; car.acted = false;
  const reach2 = g.reachable(car);
  let dest = null, dd = Infinity;
  for (const n of reach2.values()) {
    if (!n.end) continue;
    for (const [c, r] of [[n.c, n.r], ...neighbors(n.c, n.r, g.W, g.H)]) {
      if (!g.groundFree(c, r) || g.cost(h.def.mt, c, r) === Infinity || g.inStorm(c, r)) continue;
      const wd = g.isSand(c, r) ? wormD(c, r) : 99;
      if (wd < 4) continue;
      let score;
      if (goal === 'ref') score = refs.some((b) => distance(b.c, b.r, c, r) <= 1) ? n.cost : Infinity;
      else score = g.spiceAt(c, r) > 0 && !g.unitAt(c, r, false) ? n.cost - wd * 0.3 : Infinity;
      if (score < dd) { dd = score; dest = { n, c, r }; }
    }
  }
  if (!dest) {
    // Notfall: sicher auf Fels absetzen
    for (const n of reach2.values()) if (n.end && !g.isSand(n.c, n.r) && g.groundFree(n.c, n.r) && g.cost(h.def.mt, n.c, n.r) < Infinity) { const s = n.cost; if (s < dd) { dd = s; dest = { n, c: n.c, r: n.r }; } }
  }
  if (!dest) { car.acted = true; return; }
  if (dest.n.c !== car.c || dest.n.r !== car.r) await act.move(car, dest.n.c, dest.n.r, reach2);
  if (!car.dead) await act.drop(car, dest.c, dest.r);
  car.acted = true; car.moved = true;
  h.moved = true;
}

// ---------- KI-Zug ----------
export async function aiTurn(g, act, owner = 1) {
  const enemy = 1 - owner;
  aiEndgame(g, owner);
  // Für den Entscheidungsschlag sparen, sobald er in Reichweite ist (keine Drops, Schläge, Neubauten außer Energie)
  const pl = g.players[owner], eg = g.endgameDef(owner);
  const saving = !!eg && !pl.endgameUsed && g.round >= ENDGAME_ROUND - 2 && g.hasActive(owner, 'kontor') && pl.credits >= eg.cost * 0.45;
  g._aiSaving = g._aiSaving || {}; g._aiSaving[owner] = saving;
  if (!saving || pl.low) aiBuild(g, owner);
  if (!saving) aiProduce(g, owner);
  if (!g.aiPassive) await aiCards(g, act, owner);

  const mine = g.ownUnits(owner);
  const myB = g.buildings.filter((b) => !b.dead && b.owner === owner);
  const home = myB.find((b) => b.type === 'bauhof') || myB[0];
  const enemyB = g.buildings.filter((b) => !b.dead && b.owner === enemy);
  const enemyU = g.units.filter((u) => !u.dead && u.owner === enemy && !u.carried);
  const threats = enemyU.filter((e) => myB.some((b) => distance(b.c, b.r, e.c, e.r) <= 6));
  const army = mine.filter((u) => g.weapon(u) && !u.def.harvester);
  const diff = g.diff || { wave: 5, firstAttack: 7 };
  const wave = diff.wave + Math.floor(g.round / 6);
  let mode = threats.length ? 'defend' : (army.length >= wave && g.round >= diff.firstAttack) ? 'attack' : 'gather';
  if (g.aiMode === 'attack' && army.length >= Math.max(2, wave * 0.4) && !threats.length) mode = 'attack';
  if (g.aiPassive) mode = threats.length ? 'defend' : 'gather';
  g.aiMode = mode;
  const enemyHome = g.map.starts[enemy];
  const stage = home ? stagingHex(g, home, enemyHome) : null;

  if (!g.aiPassive && !(g._aiSaving && g._aiSaving[owner])) { aiDrop(g, owner, mode, enemyB); aiStrike(g, owner); }
  // Sondereinheiten ohne Waffe: Pionier und Spion
  for (const u of mine) {
    if (u.dead || u.acted || u.moved || g.aiPassive) continue;
    if (u.def.capture || u.def.infiltrate) await specialAct(g, u, act);
  }
  const order = [...army].sort((a, b) => (g.weapon(b).range[1] - g.weapon(a).range[1]));
  for (const u of order) {
    if (u.dead || u.acted || u.moved || g.state !== 'play') continue;
    if (g.canCallWorm(u)) {
      let best = null, bs = 0;
      for (const [c, r] of g.callWormHexes(u)) {
        const around = g.units.filter((e) => !e.dead && !e.carried && e.def.mt !== 'air' && distance(e.c, e.r, c, r) <= 1);
        const sc = around.filter((e) => e.owner !== owner).reduce((a, e) => a + value(g, e), 0) - around.filter((e) => e.owner === owner).length * 700;
        if (sc > bs) { bs = sc; best = [c, r]; }
      }
      if (best && bs >= 600) { await act.callWorm(u, best[0], best[1]); continue; }
    }
    if (g.canThump(u)) {
      // Klopfer neben feindliche Einheiten im Sand, wenn ein Wurm in Reichweite ist
      let best = null, bs = 0;
      for (const [c, r] of g.thumpHexes(u)) {
        if (!g.worms.some((w) => distance(w.c, w.r, c, r) <= 12)) continue;
        const foes = g.units.filter((e) => !e.dead && !e.carried && e.owner !== owner && e.def.mt !== 'air' && g.isSand(e.c, e.r) && distance(e.c, e.r, c, r) <= 1);
        const mine = g.units.filter((e) => !e.dead && e.owner === owner && e.def.mt !== 'air' && distance(e.c, e.r, c, r) <= 1).length;
        const s = foes.reduce((a, e) => a + value(g, e), 0) - mine * 600;
        if (s > bs) { bs = s; best = [c, r]; }
      }
      if (best && bs >= 400) { await act.thump(u, best[0], best[1]); continue; }
    }
    if (g.canVoice(u)) {
      const ts = g.voiceTargets(u).sort((a, b) => value(g, b) - value(g, a));
      if (ts.length && value(g, ts[0]) >= 300) { await act.voice(u, ts[0]); continue; }
    }
    const ck = g.round + '-' + owner; if (g._poiCk !== ck) { g._poiCk = ck; g._poiClaims = new Set(); }
    await unitAct(g, u, act, mode, { threats, enemyB, enemyU, stage, home, poiClaims: g._poiClaims });
  }
  for (const u of mine) if (u.def.carrier && !u.dead) await autoCarry(g, u, act);
  for (const u of mine) if (u.def.harvester && !u.dead) await autoHarvest(g, u, act);
}

function stagingHex(g, home, target) {
  const dc = target.c - home.c, dr = target.r - home.r, l = Math.hypot(dc, dr) || 1;
  return { c: Math.round(home.c + dc / l * 4), r: Math.round(home.r + dr / l * 4) };
}

async function unitAct(g, u, act, mode, ctx) {
  const w = g.weapon(u);
  const danger = dangerFn(g, u.owner);
  const reach = g.reachable(u);
  // Munitionslose Kampf-Thopter heim
  if (w.ammo && u.ammo <= 0) {
    const h = g.buildings.find((b) => !b.dead && b.owner === u.owner && b.type === 'horst' && b.turnsLeft <= 0);
    if (h) {
      const field = g.distanceField(u);
      const step = g.stepToward(u, field, h.c, h.r, reach);
      if (step && (step.c !== u.c || step.r !== u.r)) await act.move(u, step.c, step.r, reach);
    }
    return;
  }
  // Beste Angriffsoption über alle erreichbaren Felder
  let best = null, bs = mode === 'attack' ? -40 : 15;
  const consider = w.noMoveFire ? [[g.i(u.c, u.r), reach.get(g.i(u.c, u.r))]] : [...reach];
  for (const [k, n] of consider) {
    if (!n || !n.end) continue;
    const ts = g.targetsFrom(u, n.c, n.r, false);
    for (const t of ts) {
      const f = g.forecast(u, t, n.c, n.r);
      let s = f.dmg / 100 * value(g, t) - f.counter / 100 * value(g, u) * 0.9;
      if (f.kills) s += value(g, t) * 0.4;
      s -= danger(n.c, n.r) * 60;
      if (!g.isAir(u)) s += g.terr(n.c, n.r) === 'rock' ? 10 : g.terr(n.c, n.r) === 'mountain' ? 20 : 0;
      s -= n.cost * 2;
      if (s > bs) { bs = s; best = { n, t }; }
    }
  }
  if (best) {
    if (best.n.c !== u.c || best.n.r !== u.r) await act.move(u, best.n.c, best.n.r, reach);
    if (!u.dead && !best.t.dead) await act.attack(u, best.t);
    return;
  }
  // Schlüsselorte: halten bzw. einnehmen
  let poiGoal = null;
  if (!g.isAir(u) && !u.def.harvester && !u.def.carrier && g.pois) {
    const here = g.poiAt(u.c, u.r);
    if (here && (here.owner !== u.owner || (ctx.threats || []).some((t) => !t.dead && distance(t.c, t.r, u.c, u.r) <= 4))) return;
    ctx.poiClaims = ctx.poiClaims || new Set();
    const cand = g.pois.filter((p) => p.owner !== u.owner && !ctx.poiClaims.has(p) && !g.units.some((x) => !x.dead && x.owner === u.owner && x.c === p.c && x.r === p.r) && distance(u.c, u.r, p.c, p.r) <= 10);
    const pt = nearest(u, cand);
    if (pt && (mode !== 'attack' || distance(u.c, u.r, pt.c, pt.r) <= 4)) { ctx.poiClaims.add(pt); poiGoal = pt; }
  }
  // Ziel bestimmen
  let goal = poiGoal;
  if (goal) { /* Schlüsselort */ }
  else if (mode === 'defend' && ctx.threats.length) goal = nearest(u, ctx.threats.filter((t) => !t.dead));
  else if (mode === 'attack') goal = nearest(u, ctx.enemyB.filter((b) => !b.dead)) || nearest(u, ctx.enemyU.filter((t) => !t.dead));
  else if (ctx.stage) goal = ctx.stage;
  if (!goal) return;
  const field = g.distanceField(u, (c, r) => danger(c, r) * 2);
  let tc = goal.c, tr = goal.r;
  if (field.d[g.i(tc, tr)] === Infinity) {
    // Nächstes erreichbares Feld am Ziel
    let bd = Infinity;
    for (const [c, r] of neighbors(goal.c, goal.r, g.W, g.H)) if (field.d[g.i(c, r)] < bd) { bd = field.d[g.i(c, r)]; tc = c; tr = r; }
  }
  if (mode === 'gather' && distance(u.c, u.r, tc, tr) <= 2) return;
  const step = g.stepToward(u, field, tc, tr, reach);
  if (step && (step.c !== u.c || step.r !== u.r)) {
    await act.move(u, step.c, step.r, reach);
    if (!u.dead && g.canFire(u)) {
      const ts = g.targetsFrom(u, u.c, u.r, false);
      let bt = null, b2 = 0;
      for (const t of ts) { const f = g.forecast(u, t); const s = f.dmg / 100 * value(g, t) - f.counter / 100 * value(g, u); if (s > b2) { b2 = s; bt = t; } }
      if (bt) await act.attack(u, bt);
    }
  }
}

function nearest(u, list) {
  let best = null, bd = Infinity;
  for (const e of list) { const d = distance(u.c, u.r, e.c, e.r); if (d < bd) { bd = d; best = e; } }
  return best;
}

export function aiBuild(g, owner) {
  const p = g.players[owner];
  if (!g.bauhofReady(owner)) return;
  const tally = {};
  for (const b of g.buildings) if (!b.dead && b.owner === owner) tally[b.type] = (tally[b.type] || 0) + 1;
  let want = null;
  if (p.low || p.powerProd - p.powerUse < 15) want = 'windfalle';
  else {
    const need = {};
    for (const t of PLAN) { need[t] = (need[t] || 0) + 1; if ((tally[t] || 0) < need[t]) { want = t; break; } }
  }
  if (!want) want = g.round % 2 ? 'turm' : 'windfalle';
  const def = BUILDINGS[want];
  if (!g.prereqOk(owner, def) || p.credits < def.cost) return;
  const hexes = g.buildHexes(owner, want);
  if (!hexes.length) return;
  const home = g.map.starts[owner], foe = g.map.starts[1 - owner];
  let best = null, bs = -Infinity;
  for (const [c, r] of hexes) {
    let s = -distance(c, r, home.c, home.r) * 2 + g.rnd() * 1.5;
    if (def.weapon) s = -distance(c, r, foe.c, foe.r) * 1.2 - distance(c, r, home.c, home.r) * 0.6 + g.rnd();
    if (want === 'raffinerie') { // nahe Glut
      let near = 99;
      for (let rr = 0; rr < g.H; rr++) for (let cc = 0; cc < g.W; cc++) if (g.spiceAt(cc, rr) > 0) near = Math.min(near, distance(c, r, cc, rr));
      s -= near * 3;
    }
    // Nicht alles zubauen: Nachbarn frei lassen
    const freeN = neighbors(c, r, g.W, g.H).filter(([nc, nr]) => g.groundFree(nc, nr)).length;
    s += freeN * 0.8;
    if (s > bs) { bs = s; best = [c, r]; }
  }
  if (best) g.placeBuilding(owner, want, best[0], best[1]);
}

export function aiProduce(g, owner) {
  const p = g.players[owner];
  const harvesters = g.ownUnits(owner).filter((u) => u.def.harvester).length;
  const refs = g.count(owner, 'raffinerie');
  const reserve = g.round > 3 ? 250 : 0;
  for (const b of g.buildings) {
    if (b.dead || b.owner !== owner || !b.def.produces || b.producing || b.turnsLeft > 0) continue;
    let opts = [];
    if (b.def.produces === 'veh') {
      if (refs && harvesters < Math.min(4, refs * 2) && g.prereqOk(owner, UNITS.ernter)) opts = [['ernter', 10]];
      else {
        const foeAir = g.units.filter((u) => !u.dead && u.owner !== owner && u.def.mt === 'air').length;
        opts = [['panzer', 4], ['trike', 1], ['werfer', 2], ['laserpanzer', 2], ['koloss', 1], ['brenner', 3], ['flakwagen', foeAir ? 3 : 0]];
      }
    } else if (b.def.produces === 'sv') {
      const n = (t) => g.ownUnits(owner).filter((u) => u.type === t).length;
      opts = [['duenen', 3], ['todes', 2], ['wurmreiter', n('wurmreiter') < 1 ? 2 : 0]];
    } else if (b.def.produces === 'inf') {
      const infN = g.ownUnits(owner).filter((u) => u.def.cat === 'inf').length;
      const hasFab = g.has(owner, 'fabrik', false);
      const threatened = g.units.some((e) => !e.dead && e.owner !== owner && g.buildings.some((bb) => !bb.dead && bb.owner === owner && distance(bb.c, bb.r, e.c, e.r) <= 5));
      // Sparen für das Fahrzeugwerk, Infanterie begrenzen
      if (!threatened && ((!hasFab && p.credits < 1900) || infN >= 7 || (hasFab && g.rnd() < 0.5))) opts = [];
      else {
        const n = (t) => g.ownUnits(owner).filter((u) => u.type === t).length;
        opts = [['inf', 2], ['rak', 2], ['scharf', 2], ['schild', 2], ['schatten', 2], ['pionier', n('pionier') < 1 ? 1 : 0], ['sandgaenger', n('sandgaenger') < 2 ? 1 : 0]];
      }
    }
    else if (b.def.produces === 'air') {
      const foeAir = g.units.filter((u) => !u.dead && u.owner !== owner && u.def.mt === 'air').length;
      const carriers = g.ownUnits(owner).filter((u) => u.def.carrier).length;
      opts = carriers < 1 && harvesters >= 2 ? [['traeger', 10]] : [['falke', 3], ['libelle', 1], ['bomber', 2], ['adler', 3], ['jaeger', foeAir ? 3 : 0]];
    } else if (b.def.produces === 'sis') opts = [['schwester', g.ownUnits(owner).filter((u) => u.type === 'schwester').length < 2 ? 2 : 0], ['spion', g.ownUnits(owner).filter((u) => u.type === 'spion').length < 1 ? 2 : 0]];
    opts = opts.filter(([, w]) => w > 0);
    opts = opts.filter(([t]) => UNITS[t] && g.prereqOk(owner, UNITS[t]) && p.credits >= g.unitCost(owner, t) + (t === 'ernter' ? 0 : reserve));
    if (!opts.length) continue;
    const tot = opts.reduce((a, o) => a + o[1], 0);
    let x = g.rnd() * tot, pick = opts[0][0];
    for (const [t, wgt] of opts) { x -= wgt; if (x <= 0) { pick = t; break; } }
    g.produce(b, pick);
  }
}

// ---------- KI: Intrigen ----------
async function aiCards(g, act, owner) {
  const p = g.players[owner];
  if (!p.cards.length || !g.canPlayCard(owner)) return;
  const foe = 1 - owner;
  const myB = g.buildings.filter((b) => !b.dead && b.owner === owner);
  const foeU = g.units.filter((u) => !u.dead && !u.carried && u.owner === foe);
  const near = (e, d) => myB.some((b) => distance(b.c, b.r, e.c, e.r) <= d);
  for (let i = 0; i < p.cards.length; i++) {
    const id = p.cards[i];
    let tgt = null;
    if (id === 'gilde') tgt = [0, 0];
    else if (id === 'stimme') { const u = foeU.filter((u) => near(u, 7)).sort((a, b) => value(g, b) - value(g, a))[0]; if (u && value(g, u) >= 350) tgt = [u.c, u.r]; }
    else if (id === 'klopfer') { const h = foeU.find((u) => u.def.harvester && g.isSand(u.c, u.r)) || foeU.filter((u) => g.isSand(u.c, u.r) && u.def.mt !== 'air').sort((a, b) => value(g, b) - value(g, a))[0]; if (h && g.worms.some((w) => distance(w.c, w.r, h.c, h.r) <= 12)) tgt = [h.c, h.r]; }
    else if (id === 'sabotage') { const b = g.buildings.find((b) => !b.dead && b.owner === foe && ['fabrik', 'horst', 'windfalle'].includes(b.type)); if (b) tgt = [b.c, b.r]; }
    else if (id === 'verrat') { const u = foeU.filter((u) => u.def.mt === 'foot').sort((a, b) => value(g, b) - value(g, a))[0]; if (u) tgt = [u.c, u.r]; }
    else if (id === 'schild') { const threatened = foeU.some((u) => near(u, 5)); const bh = myB.find((b) => b.type === 'bauhof'); if (threatened && bh) tgt = [bh.c, bh.r]; }
    else if (id === 'wetter') {
      let best = null, bs = 0;
      for (const [c, r] of g.cardTargets(owner, 'wetter')) { const s = foeU.filter((u) => distance(u.c, u.r, c, r) <= 2 && u.def.mt !== 'mountain').length - myB.filter((b) => distance(b.c, b.r, c, r) <= 2).length * 2; if (s > bs) { bs = s; best = [c, r]; } }
      if (best && bs >= 2) tgt = best;
    } else if (id === 'vorahnung' && p.cards.length >= 5) tgt = [0, 0];
    if (tgt) { await act.card(owner, i, tgt[0], tgt[1]); return; }
  }
}

// ---------- KI: Orbital-Drops ----------
function aiDrop(g, owner, mode, enemyB) {
  if (!g.canDrop(owner)) return;
  const p = g.players[owner];
  const harvesters = g.ownUnits(owner).filter((u) => u.def.harvester).length;
  let id = mode === 'attack' ? (g.rnd() < 0.5 ? 'panzer' : 'elite') : harvesters < 2 ? 'ernter' : 'trupp';
  if (p.credits < g.dropCost(owner, id) + 400) { id = 'trupp'; if (p.credits < g.dropCost(owner, id) + 400) return; }
  const hexes = g.orbitalHexes(owner);
  const home = g.map.starts[owner], foeHome = g.map.starts[1 - owner];
  let best = null, bs = -Infinity;
  for (const [c, r] of hexes) {
    let s;
    if (id === 'ernter') { s = g.spiceAt(c, r) > 0 ? 20 - distance(c, r, home.c, home.r) : -99; }
    else if (mode === 'attack') { const d = Math.min(...enemyB.filter((b) => !b.dead).map((b) => distance(b.c, b.r, c, r)), 99); s = d >= 2 && d <= 4 ? 20 - d : -d; }
    else s = -Math.abs(distance(c, r, home.c, home.r) - 3) - distance(c, r, foeHome.c, foeHome.r) * 0.1;
    if (g.isSand(c, r)) s -= 3;
    s += g.rnd();
    if (s > bs) { bs = s; best = [c, r]; }
  }
  if (best) g.orderDrop(owner, id, best[0], best[1]);
}

// ---------- KI: Pionier und Spion ----------
async function specialAct(g, u, act) {
  const adj = g.adjBuildings(u, true);
  if (adj.length) {
    const b = adj.sort((a, b2) => value(g, b2) - value(g, a))[0];
    if (u.def.capture) await act.capture(u, b); else await act.infiltrate(u, b);
    return;
  }
  const targets = g.buildings.filter((b) => !b.dead && b.owner !== u.owner);
  if (!targets.length) return;
  const goal = targets.sort((a, b) => distance(a.c, a.r, u.c, u.r) - distance(b.c, b.r, u.c, u.r))[0];
  const danger = dangerFn(g, u.owner);
  const field = g.distanceField(u, (c, r) => danger(c, r) * 2);
  let tc = goal.c, tr = goal.r, bd = Infinity;
  for (const [c, r] of neighbors(goal.c, goal.r, g.W, g.H)) if (field.d[g.i(c, r)] < bd) { bd = field.d[g.i(c, r)]; tc = c; tr = r; }
  const reach = g.reachable(u);
  const step = g.stepToward(u, field, tc, tr, reach);
  if (step && (step.c !== u.c || step.r !== u.r)) await act.move(u, step.c, step.r, reach);
  if (!u.dead && !u.acted) {
    const adj2 = g.adjBuildings(u, true);
    if (adj2.length) { if (u.def.capture) await act.capture(u, adj2[0]); else await act.infiltrate(u, adj2[0]); }
  }
}

// ---------- KI: Entscheidungsschlag nahe der feindlichen Basis ----------
function aiEndgame(g, owner) {
  if (!g.canEndgame(owner)) return;
  const foeB = g.buildings.filter((b) => !b.dead && b.owner !== owner);
  if (!foeB.length) return;
  const key = foeB.find((b) => b.type === 'bauhof') || foeB[0];
  let best = null, bd = 1e9;
  for (const [c, r] of g.endgameHexes(owner)) { const d = distance(c, r, key.c, key.r) + (g.isSand(c, r) && g.players[owner].faction !== 'sandvolk' ? 1.5 : 0); if (d < bd) { bd = d; best = [c, r]; } }
  if (best) g.orderEndgame(owner, best[0], best[1]);
}

// ---------- KI: Orbitalbombardement ----------
function aiStrike(g, owner) {
  if (!g.canStrike(owner) || g.players[owner].credits < ORBITAL_STRIKE.cost + 400) return;
  let best = null, bs = 0;
  for (let r = 0; r < g.H; r++) for (let c = 0; c < g.W; c++) {
    let s = 0;
    for (const [hc, hr] of ring(c, r, 1, g.W, g.H)) {
      for (const u of g.units) if (!u.dead && !u.carried && u.c === hc && u.r === hr) s += u.owner === owner ? -value(g, u) * 1.5 : value(g, u) * 0.6;
      const b = g.buildingAt(hc, hr); if (b) s += b.owner === owner ? -2000 : value(g, b) * 0.5;
    }
    if (s > bs) { bs = s; best = [c, r]; }
  }
  if (best && bs >= 1400) g.orderStrike(owner, best[0], best[1]);
}
