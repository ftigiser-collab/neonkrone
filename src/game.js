// Spielregeln und Zustand (rundenbasiert)
import { UNITS, BUILDINGS, WEAPONS, ARMOR_MOD, TERRAIN, MOVE_COST, FACTIONS, START_CREDITS, DROPS, CARDS, WORM_SIZES, ORBITAL_STRIKE, SHIELD_PIERCE, POIS, ENDGAME, ENDGAME_ROUND } from './data.js';
import { neighbors, distance, ring, center } from './hex.js';
const LANDED = {};
const ang = (c1, r1, c2, r2) => { const a = center(c1, r1), b = center(c2, r2); return Math.atan2(b.y - a.y, b.x - a.x); };
import { mulberry32 } from './util.js';

let NEXT = 1;

export class Game {
  constructor(map, opts = {}) {
    this.map = map; this.W = map.W; this.H = map.H;
    this.rnd = mulberry32(map.seed * 7 + 3);
    this.units = []; this.buildings = []; this.worms = [];
    this.byId = new Map();
    this.round = 1; this.current = 0;
    this.diff = opts.diff;
    this.players = [
      this.mkPlayer(0, opts.playerFaction || 'vareth'),
      this.mkPlayer(1, opts.enemyFaction || 'kordan'),
    ];
    this.players[1].incomeMult = opts.diff?.aiBonus ?? 1;
    this.visible = new Uint8Array(this.W * this.H);
    this.explored = new Uint8Array(this.W * this.H);
    this.radar = new Uint8Array(this.W * this.H);
    this.log = [];
    this.state = 'play';
    this.storm = null;
    this.thumpers = [];
    this.strikes = [];
    this.wormCalls = [];
    this.pois = (map.pois || []).map((p) => ({ ...p, owner: -1 }));
    for (const p of this.pois) for (const [c, r] of ring(p.c, p.r, 1, this.W, this.H)) this.explored[r * this.W + c] = 1;
    this.revealRound = 0;
  }
  mkPlayer(id, faction) {
    return { id, faction, name: FACTIONS[faction].name, color: FACTIONS[faction].color, perk: FACTIONS[faction].perk || {}, credits: START_CREDITS, incomeMult: 1, powerProd: 0, powerUse: 0, low: false,
      cards: [], cardRound: 0, cardTimer: 0, freeDrop: false, dropCd: 0, pendingDrops: [], stats: { kills: 0, lost: 0, harvested: 0, eaten: 0, lostTypes: {} } };
  }

  // ---------- Fraktionsboni ----------
  unitCost(owner, type) {
    const d = UNITS[type], pk = this.players[owner].perk;
    return Math.round(d.cost * (d.mt === 'air' && pk.airCost ? pk.airCost : 1) * (d.cat === 'sv' && pk.svCost ? pk.svCost : 1));
  }
  moveOf(u) {
    const pk = this.players[u.owner].perk;
    return u.def.move + (u.def.mt === 'air' && pk.airMove ? pk.airMove : 0) + ((u.def.mt === 'foot' || u.def.mt === 'sandfoot') && pk.infMove ? pk.infMove : 0) + (u.def.cat === 'sv' && pk.svMove ? pk.svMove : 0);
  }
  dropCost(owner, id) {
    const p = this.players[owner];
    return p.freeDrop ? 0 : Math.round(DROPS[id].cost * (p.perk.dropCost || 1) * (this.ownsPoi(owner, 'schmuggler') ? 0.75 : 1));
  }
  active(b) { return b && !b.dead && b.turnsLeft <= 0 && !(b.sabotaged > 0); }

  // ---------- Aufbau ----------
  setup() {
    const [s0, s1] = this.map.starts;
    for (const [o, s, sg] of [[0, s0, 1], [1, s1, -1]]) {
      this.addBuilding(o, 'bauhof', s.c, s.r, true);
      const free = ring(s.c, s.r, 2, this.W, this.H).filter(([c, r]) => this.groundFree(c, r) && this.cost('foot', c, r) < Infinity);
      free.sort((a, b) => (b[0] - a[0]) * sg + (b[1] - a[1]) * sg);
      const types = ['inf', 'inf', 'rak', 'trike'];
      types.forEach((t, i) => { const h = free[i]; if (h) this.addUnit(o, t, h[0], h[1]); });
    }
    // Sturm weit weg von den Basen beginnen
    this.storm = { c: Math.round(this.W / 2), r: 1, rad: 2, dir: 5 };
    this.storm.next = this.stormStep(this.storm);
    this.spawnWorm(); this.spawnWorm();
    this.updatePower();
    this.updateVision();
  }

  say(text, kind = 'info', owner = 0) { if (owner === 0) { this.log.push({ text, kind, round: this.round, t: performance.now() }); if (this.log.length > 40) this.log.shift(); } }

  // ---------- Hilfen ----------
  i(c, r) { return r * this.W + c; }
  in(c, r) { return c >= 0 && r >= 0 && c < this.W && r < this.H; }
  terr(c, r) { return this.map.ter[this.i(c, r)]; }
  isSand(c, r) { return TERRAIN[this.terr(c, r)].sand; }
  spiceAt(c, r) { return this.map.spice[this.i(c, r)]; }
  get(id) { const e = this.byId.get(id); return e && !e.dead ? e : null; }
  cost(mt, c, r) { return MOVE_COST[mt][this.terr(c, r)]; }
  unitAt(c, r, air) { return this.units.find((u) => !u.dead && !u.carried && u.c === c && u.r === r && (u.def.mt === 'air') === !!air) || null; }
  buildingAt(c, r) { return this.buildings.find((b) => !b.dead && b.c === c && b.r === r) || null; }
  groundFree(c, r) { return !this.unitAt(c, r, false) && !this.buildingAt(c, r); }
  inStorm(c, r, s = this.storm) { return s && distance(c, r, s.c, s.r) <= s.rad; }
  stormNext(c, r) { return this.storm && distance(c, r, this.storm.next.c, this.storm.next.r) <= this.storm.rad; }
  wormNear(c, r, d = 3) { return this.worms.some((w) => distance(c, r, w.c, w.r) <= d); }
  has(owner, type, done = true) { return this.buildings.some((b) => !b.dead && b.owner === owner && b.type === type && (!done || b.turnsLeft <= 0)); }
  hasActive(owner, type) { return this.buildings.some((b) => b.owner === owner && b.type === type && this.active(b)); }
  count(owner, type) { return this.buildings.filter((b) => !b.dead && b.owner === owner && b.type === type && b.turnsLeft <= 0).length; }
  prereqOk(owner, def) { return (!def.faction || def.faction === this.players[owner].faction) && (!def.prereq || def.prereq.every((t) => this.has(owner, t))); }
  ownUnits(o) { return this.units.filter((u) => !u.dead && u.owner === o); }

  addUnit(owner, type, c, r) {
    const def = UNITS[type];
    const u = { id: NEXT++, isUnit: true, owner, type, def, c, r, hp: 100, moved: false, acted: false, ammo: def.ammo || 0, cargo: 0, carrying: 0, carried: false, auto: !!def.harvester || !!def.carrier, facing: owner === 0 ? 0.5 : 3.6, vib: 0, harvested: false };
    this.units.push(u); this.byId.set(u.id, u);
    return u;
  }
  addBuilding(owner, type, c, r, instant = false) {
    const def = BUILDINGS[type];
    const hpM = this.players[owner].perk.bldHp || 1;
    const b = { id: NEXT++, isBuilding: true, owner, type, def, c, r, hp: Math.round(def.hp * hpM), maxHp: Math.round(def.hp * hpM), turnsLeft: instant ? 0 : def.turns, producing: null, acted: false, usedRound: 0, facing: owner === 0 ? 0.8 : 3.9, rise: instant ? 1 : 0 };
    this.buildings.push(b); this.byId.set(b.id, b);
    this.updatePower();
    return b;
  }

  // ---------- Tarnung ----------
  stealthed(u, viewer = 0) {
    if (!u || !u.isUnit || u.owner === viewer || !u.def.stealth) return false;
    const st = u.def.stealth;
    if (st === 'sand' && !this.isSand(u.c, u.r)) return false;
    if (st === 'still' && (u.moved || u.attacked)) return false;
    return !this.units.some((p) => !p.dead && p.owner === viewer && !p.carried && distance(p.c, p.r, u.c, u.r) <= 1);
  }

  // ---------- Strom ----------
  updatePower() {
    for (const p of this.players) {
      let prod = 0, use = 0;
      for (const b of this.buildings) {
        if (b.dead || b.owner !== p.id || b.turnsLeft > 0 || b.sabotaged > 0) continue;
        if (b.def.power > 0) prod += b.def.power * (b.hp < b.maxHp * 0.5 ? 0.5 : 1); else use -= b.def.power;
      }
      const was = p.low;
      p.powerProd = Math.round(prod); p.powerUse = use; p.low = use > prod;
      if (p.low && !was) this.say('Energie niedrig — Produktion und Abwehr stehen still', 'warn', p.id);
    }
  }

  // ---------- Bewegung ----------
  blocked(u, c, r) {
    // Kann u dieses Feld betreten (durchqueren)?
    const air = u.def.mt === 'air';
    if (this.inStorm(c, r) && !(c === u.c && r === u.r)) return true;
    if (!air) { const b = this.buildingAt(c, r); if (b) return true; }
    const o = this.unitAt(c, r, air);
    if (o && o.owner !== u.owner && !this.stealthed(o, u.owner) && (u.owner !== 0 || this.visible[this.i(c, r)])) return true;
    if (!air) { const w = this.worms.find((w) => w.surfaced && w.c === c && w.r === r); if (w) return true; }
    return false;
  }

  reachable(u, budget = this.moveOf(u)) {
    const res = new Map();
    const key = (c, r) => r * this.W + c;
    res.set(key(u.c, u.r), { c: u.c, r: u.r, cost: 0, prev: null });
    if (u.landed) return res;
    const open = [[u.c, u.r, 0]];
    while (open.length) {
      open.sort((a, b) => a[2] - b[2]);
      const [c, r, g] = open.shift();
      if (g > (res.get(key(c, r))?.cost ?? Infinity)) continue;
      for (const [nc, nr] of neighbors(c, r, this.W, this.H)) {
        const k = key(nc, nr);
        const step = this.cost(u.def.mt, nc, nr);
        if (step === Infinity || this.blocked(u, nc, nr)) continue;
        const ng = g + step;
        if (ng > budget) continue;
        const cur = res.get(k);
        if (!cur || ng < cur.cost) { res.set(k, { c: nc, r: nr, cost: ng, prev: key(c, r) }); open.push([nc, nr, ng]); }
      }
    }
    // Endfelder: nicht von eigenen (oder sichtbaren) Einheiten besetzt
    for (const [k, v] of res) {
      const occ = this.unitAt(v.c, v.r, u.def.mt === 'air');
      v.end = !occ || occ === u || (occ.owner !== u.owner && (this.stealthed(occ, u.owner) || (u.owner === 0 && !this.visible[this.i(v.c, v.r)])));
    }
    return res;
  }

  pathFrom(reach, c, r) {
    const path = [];
    let k = r * this.W + c;
    while (k !== null && k !== undefined) { const n = reach.get(k); if (!n) break; path.push({ c: n.c, r: n.r }); k = n.prev; }
    return path.reverse();
  }

  // Dijkstra über die ganze Karte (ignoriert eigene Einheiten) — für KI/Auto-Ernter
  distanceField(u, avoid) {
    const W = this.W, d = new Float32Array(W * this.H).fill(Infinity), prev = new Int32Array(W * this.H).fill(-1);
    d[this.i(u.c, u.r)] = 0;
    const open = [[u.c, u.r, 0]];
    while (open.length) {
      let bi = 0; for (let k = 1; k < open.length; k++) if (open[k][2] < open[bi][2]) bi = k;
      const [c, r, g] = open.splice(bi, 1)[0];
      if (g > d[this.i(c, r)]) continue;
      for (const [nc, nr] of neighbors(c, r, W, this.H)) {
        let step = this.cost(u.def.mt, nc, nr);
        if (step === Infinity) continue;
        if (u.def.mt !== 'air' && this.buildingAt(nc, nr)) continue;
        const o = this.unitAt(nc, nr, u.def.mt === 'air'); if (o && o.owner !== u.owner) step += 6;
        if (avoid) step += avoid(nc, nr);
        const ng = g + step, k = this.i(nc, nr);
        if (ng < d[k]) { d[k] = ng; prev[k] = this.i(c, r); open.push([nc, nr, ng]); }
      }
    }
    return { d, prev };
  }

  // Schritt Richtung Ziel innerhalb der Reichweite
  stepToward(u, field, tc, tr, reach = this.reachable(u)) {
    const W = this.W;
    let k = this.i(tc, tr);
    if (field.d[k] === Infinity) return null;
    const chain = [];
    while (k !== -1) { chain.push(k); k = field.prev[k]; }
    // vom Ziel zurück: erstes Feld, das erreichbar und frei ist
    for (const kk of chain) { const n = reach.get(kk); if (n && n.end) return { c: n.c, r: n.r }; }
    return null;
  }

  moveUnit(u, c, r, reach) {
    let path = this.pathFrom(reach || this.reachable(u), c, r);
    // Hinterhalt: verdeckter Gegner auf dem Weg stoppt die Bewegung
    u.ambushed = false;
    const air = u.def.mt === 'air';
    for (let k = 1; k < path.length; k++) {
      const o = this.unitAt(path[k].c, path[k].r, air);
      if (o && o.owner !== u.owner) { path = path.slice(0, k); u.ambushed = o.id; break; }
    }
    // Endfeld muss frei sein — sonst zurück bis zum letzten freien
    while (path.length > 1) { const e = path[path.length - 1]; const occ = this.unitAt(e.c, e.r, air); if (!occ || occ === u) break; path.pop(); }
    c = path[path.length - 1].c; r = path[path.length - 1].r;
    if (u.ambushed) { u.acted = true; this.say(`Hinterhalt! ${u.def.name} stößt auf einen verborgenen Gegner`, 'warn', u.owner); }
    if (path.length > 1) {
      const a = path[path.length - 2];
      u.facing = ang(a.c, a.r, c, r);
    }
    u.c = c; u.r = r; u.moved = true;
    const carried = this.get(u.carrying); if (carried) { carried.c = c; carried.r = r; }
    return path;
  }

  // ---------- Kampf ----------
  weapon(e) { return WEAPONS[e.def.weapon] || null; }
  isAir(e) { return e.isUnit && e.def.mt === 'air'; }
  // ---------- Thopter landen / starten ----------
  isThopter(u) { return u.isUnit && UNITS[u.type].mt === 'air'; }
  landedDef(type) { LANDED[type] = LANDED[type] || { ...UNITS[type], mt: 'track', landedForm: true }; return LANDED[type]; }
  canLand(u) {
    return this.isThopter(u) && !u.landed && !u.didLand && !u.carried && !u.carrying && u.owner === this.current && !this.inStorm(u.c, u.r)
      && !this.unitAt(u.c, u.r, false) && !this.buildingAt(u.c, u.r) && this.cost('track', u.c, u.r) !== Infinity;
  }
  land(u) { u.landed = true; u.didLand = true; u.def = this.landedDef(u.type); u.moved = true; u.acted = true; return { type: 'land', u: u.id }; }
  canTakeoff(u) { return !!u.landed && !u.acted && u.owner === this.current; }
  takeoff(u) { u.landed = false; u.def = UNITS[u.type]; u.didLand = true; return { type: 'takeoff', u: u.id }; }
  canHit(w, t) { return !!w && (this.isAir(t) ? w.air : w.ground); }
  inRange(w, c1, r1, c2, r2) { const d = distance(c1, r1, c2, r2); return d >= w.range[0] && d <= w.range[1]; }

  canFire(u) {
    const w = this.weapon(u); if (!w || u.acted || u.carried || u.landed) return false;
    if (w.noMoveFire && u.moved) return false;
    if (w.ammo && u.ammo <= 0) return false;
    if (u.isBuilding && (u.turnsLeft > 0 || this.players[u.owner].low || u.sabotaged > 0)) return false;
    if (u.stunned > 0 && u.owner === this.current) return false;
    return true;
  }

  targetsFrom(e, c, r, onlyVisible = e.owner === 0) {
    const w = this.weapon(e); if (!w) return [];
    const out = [];
    for (const t of this.units) {
      if (t.dead || t.carried || t.owner === e.owner || !this.canHit(w, t)) continue;
      if (onlyVisible && !this.visible[this.i(t.c, t.r)]) continue;
      if (this.stealthed(t, e.owner)) continue;
      if (this.inRange(w, c, r, t.c, t.r)) out.push(t);
    }
    if (w.ground) for (const b of this.buildings) {
      if (b.dead || b.owner === e.owner) continue;
      if (onlyVisible && !this.explored[this.i(b.c, b.r)]) continue;
      if (this.inRange(w, c, r, b.c, b.r)) out.push(b);
    }
    return out;
  }

  calcDamage(att, t, attHp = att.hp, fromC = att.c, fromR = att.r) {
    const w = this.weapon(att); if (!w || !this.canHit(w, t)) return 0;
    const armor = t.isBuilding ? 'bld' : t.def.armor;
    const mod = ARMOR_MOD[w.type][armor] ?? 0;
    const hpF = att.isBuilding ? 1 : 0.35 + 0.65 * (attHp / 100);
    const def = t.isBuilding || this.isAir(t) ? 0 : TERRAIN[this.terr(t.c, t.r)].def + (this.poiAt(t.c, t.r)?.type === 'heiligtum' ? 0.25 : 0);
    let dmg = w.power * mod * hpF * (1 - def);
    if (att.isUnit && att.def.cat === 'veh') dmg *= this.players[att.owner].perk.vehPower || 1;
    if (t.shield > 0) dmg *= 0.5;
    if (t.isUnit && t.def.shield && !SHIELD_PIERCE.includes(w.type)) dmg *= 0.4;
    if (t.isUnit && t.def.tough) dmg *= t.def.tough;
    if (t.isUnit && t.def.elite) dmg *= t.def.elite;
    if (w.type === 'laser' && t.isUnit && t.def.shield) dmg *= 2.5;
    if (t.isBuilding) dmg = dmg * t.maxHp / 100; // Gebäude-TP skalieren
    return dmg;
  }

  hpPct(e) { return e.isBuilding ? (e.hp / e.maxHp) * 100 : e.hp; }

  forecast(att, t, fromC = att.c, fromR = att.r) {
    const dmg = this.calcDamage(att, t);
    const tHpAfter = Math.max(0, t.hp - dmg);
    let counter = 0;
    if (tHpAfter > 0 && this.canCounter(t, att, fromC, fromR)) {
      const tHpPct = t.isBuilding ? (tHpAfter / t.maxHp) * 100 : tHpAfter;
      counter = this.calcDamage(t, att, tHpPct) * 0.85;
    }
    const pct = (v, e) => (e.isBuilding ? (v / e.maxHp) * 100 : v);
    return { dmg: pct(dmg, t), counter: pct(counter, att), kills: tHpAfter <= 0 };
  }

  canCounter(t, att, ac = att.c, ar = att.r) {
    const w = this.weapon(t); if (!w || w.noCounter || !this.canHit(w, att)) return false;
    if (t.isBuilding && (t.turnsLeft > 0 || this.players[t.owner].low || t.sabotaged > 0)) return false;
    if (w.ammo && t.ammo <= 0) return false;
    return this.inRange(w, t.c, t.r, ac, ar);
  }

  attack(att, t) {
    const w = this.weapon(att);
    const rnd = 0.92 + this.rnd() * 0.16;
    const dmg = this.calcDamage(att, t) * rnd;
    t.hp -= dmg;
    att.acted = true; att.moved = true; att.attacked = true; att.fought = true; t.fought = true;
    if (w.ammo) att.ammo--;
    att.facing = ang(att.c, att.r, t.c, t.r);
    const ev = { type: 'attack', att: att.id, target: t.id, dmg: this.pct(dmg, t), proj: w.proj, counter: 0, killed: false, counterKilled: false };
    if (w.type === 'laser' && t.isUnit && t.def.shield) {
      // Laser trifft Schild: Reaktion trifft auch den Schützen und alles daneben
      ev.shieldBlast = true;
      att.hp -= 30;
      for (const o of this.units) if (!o.dead && o !== t && o !== att && !o.carried && distance(o.c, o.r, t.c, t.r) === 1) { o.hp -= 25; if (o.hp <= 0.5) this.kill(o, att); }
      if (att.hp <= 0.5) { ev.counterKilled = true; this.kill(att, t); }
    }
    if (t.hp <= 0.5) { ev.killed = true; this.kill(t, att); }
    else if (this.canCounter(t, att)) {
      const cw = this.weapon(t);
      const cd = this.calcDamage(t, att, this.hpPct(t)) * 0.85 * (0.92 + this.rnd() * 0.16);
      att.hp -= cd; ev.counter = this.pct(cd, att); ev.counterProj = cw.proj;
      if (cw.ammo) t.ammo--;
      if (att.hp <= 0.5) { ev.counterKilled = true; this.kill(att, t); }
    }
    return ev;
  }
  pct(v, e) { return e.isBuilding ? (v / e.maxHp) * 100 : v; }

  // Reaktionsfeuer: wer in der eigenen Runde nicht angegriffen hat, schießt einmal auf Gegner, die in Reichweite ziehen
  reflexFire(mover) {
    const ev = [];
    if (mover.dead || mover.carried) return ev;
    const shooters = [...this.units, ...this.buildings].filter((e) => !e.dead && e.reflex && e.owner !== mover.owner && !(e.isUnit && e.carried));
    for (const s of shooters) {
      if (mover.dead) break;
      const w = this.weapon(s);
      if (!w || !this.canHit(w, mover) || !this.inRange(w, s.c, s.r, mover.c, mover.r)) continue;
      if (s.isBuilding && (s.turnsLeft > 0 || this.players[s.owner].low || s.sabotaged > 0)) continue;
      if (w.ammo && s.ammo <= 0) continue;
      const dmg = this.calcDamage(s, mover) * 0.7 * (0.92 + this.rnd() * 0.16);
      mover.hp -= dmg; s.reflex = false; mover.fought = true;
      if (w.ammo) s.ammo--;
      const e = { type: 'attack', att: s.id, target: mover.id, dmg: this.pct(dmg, mover), proj: w.proj, counter: 0, killed: false, reflex: true };
      if (mover.hp <= 0.5) { e.killed = true; this.kill(mover, s); }
      ev.push(e);
    }
    return ev;
  }

  kill(e, by) {
    if (e.dead) return;
    e.dead = true; e.hp = 0;
    if (by) this.players[by.owner].stats.kills++;
    this.players[e.owner].stats.lost++;
    const lt = this.players[e.owner].stats.lostTypes || (this.players[e.owner].stats.lostTypes = {});
    lt[e.type] = (lt[e.type] || 0) + 1;
    if (e.isUnit) {
      const c = this.get(e.carrying); if (c) this.kill(c, by);
      if (e.def.harvester && e.cargo > 0 && this.isSand(e.c, e.r)) this.map.spice[this.i(e.c, e.r)] += e.cargo;
      this.say(`${e.def.name} verloren`, 'bad', e.owner);
    } else {
      this.say(`${e.def.name} zerstört`, 'bad', e.owner);
      this.updatePower();
    }
  }

  // ---------- Bauen und Produktion ----------
  bauhofReady(owner) {
    const b = this.buildings.find((x) => !x.dead && x.owner === owner && x.type === 'bauhof');
    return b && b.usedRound !== this.round ? b : null;
  }
  buildHexes(owner, type) {
    const out = [];
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) if (this.canPlace(owner, type, c, r)) out.push([c, r]);
    return out;
  }
  canPlace(owner, type, c, r) {
    if (this.terr(c, r) !== 'rock' || !this.groundFree(c, r) || this.inStorm(c, r) || this.poiAt(c, r)) return false;
    return this.buildings.some((b) => !b.dead && b.owner === owner && distance(b.c, b.r, c, r) <= 2);
  }
  placeBuilding(owner, type, c, r) {
    const def = BUILDINGS[type], p = this.players[owner];
    const bh = this.bauhofReady(owner);
    if (!bh || !this.prereqOk(owner, def) || p.credits < def.cost || !this.canPlace(owner, type, c, r)) return null;
    p.credits -= def.cost; bh.usedRound = this.round;
    const b = this.addBuilding(owner, type, c, r);
    this.say(`${def.name} wird errichtet (${def.turns} ${def.turns === 1 ? 'Runde' : 'Runden'})`, 'info', owner);
    return b;
  }
  canProduce(b, type) {
    const def = UNITS[type], p = this.players[b.owner];
    return this.active(b) && !b.producing && b.def.produces === def.cat && this.prereqOk(b.owner, def) && p.credits >= this.unitCost(b.owner, type) && !p.low;
  }
  produce(b, type) {
    if (!this.canProduce(b, type)) return false;
    this.players[b.owner].credits -= this.unitCost(b.owner, type);
    b.producing = type; b.paid = this.unitCost(b.owner, type);
    return true;
  }
  cancelProduce(b) { if (b.producing) { this.players[b.owner].credits += b.paid ?? UNITS[b.producing].cost; b.producing = null; } }

  spawnNear(owner, type, c, r) {
    const air = UNITS[type].mt === 'air';
    if (air && !this.unitAt(c, r, true)) return this.addUnit(owner, type, c, r);
    const cands = ring(c, r, 2, this.W, this.H).sort((a, b) => distance(c, r, a[0], a[1]) - distance(c, r, b[0], b[1]));
    for (const [nc, nr] of cands) {
      if (air ? this.unitAt(nc, nr, true) : (!this.groundFree(nc, nr) || this.cost(UNITS[type].mt, nc, nr) === Infinity)) continue;
      return this.addUnit(owner, type, nc, nr);
    }
    return null;
  }

  // Rundenbeginn eines Spielers: Bauten fertig, Einheiten erscheinen, Aktionen zurücksetzen
  poiAt(c, r) { return this.pois.find((p) => p.c === c && p.r === r); }
  ownsPoi(owner, type) { return this.pois.some((p) => p.owner === owner && p.type === type); }
  // Schlüsselorte: Einnahme durch Besetzen, danach Erträge
  poiTurn(owner, ev) {
    for (const p of this.pois) {
      const u = this.units.find((x) => !x.dead && !x.carried && x.c === p.c && x.r === p.r && x.def.mt !== 'air');
      if (u && u.owner === owner && p.owner !== owner) {
        const lost = p.owner;
        p.owner = owner;
        ev.push({ type: 'poi', poi: p, owner });
        if (owner === 0) this.say(`${POIS[p.type].name} eingenommen!`, 'good');
        else if (lost === 0) this.say(`${POIS[p.type].name} an den Feind verloren!`, 'bad');
        else this.say(`Der Feind hat ${POIS[p.type].name} eingenommen`, 'warn', 0);
      }
    }
    if (this.round <= 1) return;
    let cr = 0;
    for (const p of this.pois) {
      if (p.owner !== owner) continue;
      if (p.type === 'zisterne') cr += 120;
      if (p.type === 'warte') cr += 40;
      if (p.type === 'schmuggler' && this.round % 3 === 0) { const c = this.drawCard(owner); if (c) ev.push({ type: 'card', owner, card: c }); }
      if (p.type === 'heiligtum') for (const u of this.units) if (!u.dead && u.owner === owner && u.isUnit && distance(u.c, u.r, p.c, p.r) <= 1 && u.hp < 100) { u.hp = Math.min(100, u.hp + 15); ev.push({ type: 'heal', u: u.id, amount: 15 }); }
    }
    if (cr) { this.players[owner].credits += cr; ev.push({ type: 'income', amount: cr, owner }); }
  }
  beginTurn(owner) {
    const ev = [];
    this.current = owner;
    this.poiTurn(owner, ev);
    if (this.round > 1) {
      let amt = 0;
      for (const b of this.buildings) if (!b.dead && b.owner === owner && b.turnsLeft <= 0) amt += b.type === 'bauhof' ? 150 : 0;
      amt = Math.round(amt * this.players[owner].incomeMult);
      if (amt) { this.players[owner].credits += amt; ev.push({ type: 'income', amount: amt, owner }); }
    }
    for (const b of this.buildings) {
      if (b.dead || b.owner !== owner) continue;
      b.acted = false;
      if (b.turnsLeft > 0) {
        b.turnsLeft--;
        if (b.turnsLeft === 0) {
          this.say(`${b.def.name} fertig`, 'good', owner);
          if (b.type === 'konvent') { const c = this.drawCard(owner); if (c) ev.push({ type: 'card', owner, card: c }); }
          ev.push({ type: 'built', b: b.id });
          if (b.def.freeUnit) for (const t of [].concat(b.def.freeUnit)) { const u = this.spawnNear(owner, t, b.c, b.r); if (u) ev.push({ type: 'spawn', u: u.id, from: b.id }); }
        }
      }
      if (b.sabotaged > 0) { b.sabotaged--; if (b.sabotaged > 0 || b.producing) { if (b.producing) this.say(`${b.def.name}: Produktion durch Sabotage verzögert`, 'warn', owner); continue; } }
      if (b.producing && b.turnsLeft <= 0) {
        const u = this.spawnNear(owner, b.producing, b.c, b.r);
        if (u) { ev.push({ type: 'spawn', u: u.id, from: b.id }); this.say(`${u.def.name} bereit`, 'good', owner); b.producing = null; }
        else this.say(`${b.def.name}: kein Platz zum Ausrücken`, 'warn', owner);
      }
    }
    // Orbitalbombardement schlägt ein, Orbital-Drops landen
    const p = this.players[owner];
    if (p.dropCd > 0) p.dropCd--;
    if (p.strikeCd > 0) p.strikeCd--;
    ev.push(...this.resolveStrikes(owner));
    ev.push(...this.resolveEndgame(owner));
    for (const d of p.pendingDrops) {
      const ids = [];
      for (const t of DROPS[d.id].units) { const u = this.spawnNear(owner, t, d.c, d.r); if (u) { u.dropped = true; ids.push(u.id); } }
      ev.push({ type: 'orbital', owner, c: d.c, r: d.r, units: ids });
      this.say(`AV-Drop gelandet: ${DROPS[d.id].name}`, 'good', owner);
    }
    p.pendingDrops = [];
    // Intrigenkarten
    if (this.hasActive(owner, 'konvent')) {
      p.cardTimer++;
      if (p.cardTimer >= 3) { p.cardTimer = 0; const c = this.drawCard(owner); if (c) ev.push({ type: 'card', owner, card: c }); }
    }
    for (const u of this.units) {
      if (u.dead || u.owner !== owner) continue;
      u.moved = false; u.acted = false; u.harvested = false; u.attacked = false; u.reflex = false; u.ambushed = false;
      if (u.voiceCd > 0) u.voiceCd--;
      if (u.thumpCd > 0) u.thumpCd--;
      if (u.wormCd > 0) u.wormCd--;
      if (u.shield > 0) u.shield--;
      if (u.stunned > 0) { u.stunned--; u.moved = true; u.acted = true; u.wasStunned = true; } else u.wasStunned = false;
      u.didLand = false;
      if (u.landed) {
        if (u.hp < 100) { const h = Math.min(100 - u.hp, 20); u.hp += h; ev.push({ type: 'heal', u: u.id, amount: h }); }
        if (u.def.ammo && u.ammo < u.def.ammo) { u.ammo = u.def.ammo; ev.push({ type: 'rearm', u: u.id }); }
      }
      if (u.def.medic) for (const v of this.units) if (!v.dead && !v.carried && v.owner === owner && v.hp < 100 && distance(v.c, v.r, u.c, u.r) <= 1) { const h = Math.min(100 - v.hp, u.def.medic); v.hp += h; ev.push({ type: 'heal', u: v.id, amount: h }); }
      if (u.def.ammo && u.ammo < u.def.ammo) {
        const h = this.buildings.find((b) => !b.dead && b.owner === owner && b.type === 'horst' && b.turnsLeft <= 0 && distance(b.c, b.r, u.c, u.r) <= 1);
        if (h) { u.ammo = u.def.ammo; ev.push({ type: 'rearm', u: u.id }); }
      }
    }
    for (const b of this.buildings) if (!b.dead && b.owner === owner) { if (b.shield > 0) b.shield--; b.attacked = false; b.reflex = false; }
    this.updatePower();
    return ev;
  }

  // ---------- Intrigenkarten ----------
  drawCard(owner) {
    const p = this.players[owner];
    if (p.cards.length >= 5) return null;
    const ids = Object.keys(CARDS), tot = ids.reduce((a, k) => a + CARDS[k].weight, 0);
    let x = this.rnd() * tot;
    for (const k of ids) { x -= CARDS[k].weight; if (x <= 0) { p.cards.push(k); if (owner === 0) this.say(`Neue Hackkarte: ${CARDS[k].name}`, 'good'); return k; } }
    p.cards.push(ids[0]); return ids[0];
  }
  canPlayCard(owner) { return this.players[owner].cardRound !== this.round && this.current === owner; }
  cardTargets(owner, id) {
    const foe = 1 - owner, vis = (c, r) => owner !== 0 || this.visible[this.i(c, r)];
    const t = CARDS[id].target;
    if (t === 'enemyUnit') return this.units.filter((u) => !u.dead && !u.carried && u.owner === foe && vis(u.c, u.r)).map((u) => [u.c, u.r]);
    if (t === 'enemyInf') return this.units.filter((u) => !u.dead && !u.carried && u.owner === foe && u.def.cat === 'inf' && vis(u.c, u.r)).map((u) => [u.c, u.r]);
    if (t === 'enemyBld') return this.buildings.filter((b) => !b.dead && b.owner === foe && (owner !== 0 || this.explored[this.i(b.c, b.r)])).map((b) => [b.c, b.r]);
    if (t === 'own') return [...this.units.filter((u) => !u.dead && !u.carried && u.owner === owner).map((u) => [u.c, u.r]), ...this.buildings.filter((b) => !b.dead && b.owner === owner).map((b) => [b.c, b.r])];
    if (t === 'sandHex') { const out = []; for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) if (this.isSand(c, r) && (owner !== 0 || this.explored[this.i(c, r)])) out.push([c, r]); return out; }
    if (t === 'stormHex') return ring(this.storm.next.c, this.storm.next.r, 4, this.W, this.H).filter(([c, r]) => c >= 1 && r >= 1 && c < this.W - 1 && r < this.H - 1);
    return [];
  }
  playCard(owner, idx, c, r) {
    const p = this.players[owner], id = p.cards[idx];
    if (!id || !this.canPlayCard(owner)) return null;
    const card = CARDS[id];
    if (card.target !== 'none' && !this.cardTargets(owner, id).some(([a, b]) => a === c && b === r)) return null;
    const foe = 1 - owner;
    const ev = { type: 'cardplay', owner, card: id, c, r };
    if (id === 'stimme') { const u = this.unitAt(c, r, true) && this.unitAt(c, r, true).owner === foe ? this.unitAt(c, r, true) : this.unitAt(c, r, false); u.stunned = 1; ev.target = u.id; }
    else if (id === 'vorahnung') { if (owner === 0) this.revealRound = this.round; }
    else if (id === 'wetter') { this.storm.next = { c, r, dir: this.storm.next.dir }; }
    else if (id === 'klopfer') { this.thumpers.push({ c, r, owner, life: 2 }); }
    else if (id === 'verrat') { const u = this.unitAt(c, r, false); u.owner = owner; u.moved = true; u.acted = true; u.auto = !!u.def.harvester; ev.target = u.id; }
    else if (id === 'schild') { const e = this.unitAt(c, r, true)?.owner === owner ? this.unitAt(c, r, true) : this.unitAt(c, r, false)?.owner === owner ? this.unitAt(c, r, false) : this.buildingAt(c, r); e.shield = 2; ev.target = e.id; }
    else if (id === 'sabotage') { const b = this.buildingAt(c, r); b.sabotaged = 1; ev.target = b.id; this.updatePower(); }
    else if (id === 'gilde') { p.freeDrop = true; }
    p.cards.splice(idx, 1); p.cardRound = this.round;
    if (owner === 0) this.say(`Hack ausgeführt: ${card.name}`, 'good');
    else this.say(`Feindlicher Hack: ${card.name}`, 'warn');
    this.updateVision();
    return ev;
  }

  // ---------- Orbital-Drops ----------
  canDrop(owner) {
    const p = this.players[owner];
    return this.hasActive(owner, 'kontor') && !p.low && p.dropCd <= 0 && this.current === owner;
  }
  orbitalHexes(owner) {
    const out = [];
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) {
      if (owner === 0 && !this.explored[this.i(c, r)]) continue;
      if (this.terr(c, r) === 'mountain' || this.inStorm(c, r) || !this.groundFree(c, r)) continue;
      if (this.buildings.some((b) => !b.dead && b.owner !== owner && distance(b.c, b.r, c, r) <= 1)) continue;
      out.push([c, r]);
    }
    return out;
  }
  orderDrop(owner, id, c, r) {
    const p = this.players[owner], cost = this.dropCost(owner, id);
    if (!this.canDrop(owner) || p.credits < cost) return false;
    if (!this.orbitalHexes(owner).some(([a, b]) => a === c && b === r)) return false;
    p.credits -= cost; p.freeDrop = false; p.dropCd = 2;
    p.pendingDrops.push({ id, c, r });
    if (owner === 0) this.say(`Fixerin bestätigt: ${DROPS[id].name} landet nächste Runde`, 'good');
    return true;
  }

  // ---------- Pionier, Spion, Wurmreiter ----------
  adjBuildings(u, enemy) {
    return this.buildings.filter((b) => !b.dead && (enemy ? b.owner !== u.owner : b.owner === u.owner) && distance(b.c, b.r, u.c, u.r) === 1 && (!enemy || u.owner !== 0 || this.explored[this.i(b.c, b.r)]));
  }
  canAct(u) { return !u.acted && u.owner === this.current && !u.carried; }
  capture(u, b) {
    const from = b.owner;
    b.owner = u.owner; b.producing = null; b.sabotaged = 0; b.reflex = false;
    u.dead = true;
    this.say(u.owner === 0 ? `${b.def.name} übernommen!` : `Der Feind hat euer Gebäude übernommen: ${b.def.name}`, u.owner === 0 ? 'good' : 'bad');
    this.updatePower();
    return { type: 'capture', u: u.id, b: b.id, from };
  }
  repair(u, b) {
    b.hp = Math.min(b.maxHp, b.hp + b.maxHp * 0.5); u.acted = true; u.moved = true;
    return { type: 'repair', u: u.id, b: b.id };
  }
  infiltrate(u, b) {
    const foe = this.players[b.owner], me = this.players[u.owner];
    const steal = Math.min(400, Math.floor(foe.credits));
    foe.credits -= steal; me.credits += steal;
    b.sabotaged = 2;
    if (u.owner === 0) for (const [c, r] of ring(b.c, b.r, 4, this.W, this.H)) this.explored[this.i(c, r)] = 1;
    u.dead = true;
    this.say(u.owner === 0 ? `Spion in ${b.def.name}: ${steal} Credits erbeutet, Gebäude 2 Runden lahmgelegt` : `Ein feindlicher Spion hat ${b.def.name} sabotiert (${steal} Credits gestohlen)`, u.owner === 0 ? 'good' : 'bad');
    this.updatePower();
    return { type: 'infiltrate', u: u.id, b: b.id, steal };
  }
  canCallWorm(u) { return u.def.callWorm && !(u.wormCd > 0) && this.canAct(u); }
  callWormHexes(u) { return ring(u.c, u.r, 5, this.W, this.H).filter(([c, r]) => this.isSand(c, r) && !this.buildings.some((b) => !b.dead && distance(b.c, b.r, c, r) <= 2)); }
  callWorm(u, c, r) {
    this.wormCalls.push({ c, r, owner: u.owner });
    u.wormCd = 4; u.acted = true; u.moved = true;
    if (u.owner === 0) this.say('Der Psycho-Prediger sendet das Signal — in der nächsten Psychophase bricht eine Psycho-Rotte los', 'good');
    return { type: 'wormcall', u: u.id, c, r };
  }

  // ---------- Endgame-Schlag (einmal pro Partie) ----------
  endgameDef(owner) { return ENDGAME[this.players[owner].faction]; }
  canEndgame(owner) {
    const p = this.players[owner], d = this.endgameDef(owner);
    return !!d && this.hasActive(owner, 'kontor') && !p.low && !p.endgameUsed && this.round >= ENDGAME_ROUND && p.credits >= d.cost && this.current === owner;
  }
  endgameHexes(owner) {
    return this.orbitalHexes(owner).filter(([c, r]) => !this.buildings.some((b) => !b.dead && b.owner !== owner && distance(b.c, b.r, c, r) <= 2));
  }
  orderEndgame(owner, c, r) {
    if (!this.canEndgame(owner) || !this.endgameHexes(owner).some(([a, b]) => a === c && b === r)) return false;
    const p = this.players[owner], d = this.endgameDef(owner);
    p.credits -= d.cost; p.endgameUsed = true; p.pendingEndgame = { c, r };
    this.say(owner === 0 ? `${d.name} angefordert — Ankunft zu Beginn eurer nächsten Runde` : `Warnung: Der Feind hat die ${d.name} gerufen! Ankunft nächste Runde`, owner === 0 ? 'good' : 'bad');
    return true;
  }
  resolveEndgame(owner) {
    const p = this.players[owner], pe = p.pendingEndgame; if (!pe) return [];
    p.pendingEndgame = null;
    const d = this.endgameDef(owner), ev = [];
    if (this.players[owner].faction === 'sandvolk') {
      // Der Uralte bricht am nächsten Sandfeld hervor und frisst nur Feinde
      let best = null, bd = 99;
      for (const [c, r] of [[pe.c, pe.r], ...ring(pe.c, pe.r, 3, this.W, this.H)]) if (this.isSand(c, r)) { const dd = distance(c, r, pe.c, pe.r); if (dd < bd) { bd = dd; best = [c, r]; } }
      if (best) {
        const w = this.spawnWorm(best[0], best[1]);
        if (w) {
          w.size = 3; w.sated = 4;
          const hexes = [[best[0], best[1]], ...neighbors(best[0], best[1], this.W, this.H).filter(([c, r]) => this.isSand(c, r))];
          const eaten = this.units.filter((u) => !u.dead && !u.carried && u.owner !== owner && u.def.mt !== 'air' && hexes.some(([c, r]) => c === u.c && r === u.r));
          for (const u of eaten) { this.kill(u, { owner }); this.players[u.owner].stats.eaten++; }
          ev.push({ type: 'worm', id: w.id, path: [{ c: best[0], r: best[1] }], eatMany: eaten.map((u) => u.id), eatHexes: hexes, called: true });
        }
      }
    }
    const ids = [];
    for (const t of d.units) { const u = this.spawnNear(owner, t, pe.c, pe.r); if (u) { u.dropped = true; ids.push(u.id); } }
    ev.push({ type: 'endgame', owner, c: pe.c, r: pe.r, units: ids, faction: this.players[owner].faction });
    this.say(`${d.name} ist eingetroffen!`, owner === 0 ? 'good' : 'bad');
    return ev;
  }

  // ---------- Orbitalbombardement ----------
  canStrike(owner) {
    const p = this.players[owner];
    return this.hasActive(owner, 'kontor') && !p.low && !(p.strikeCd > 0) && p.credits >= ORBITAL_STRIKE.cost && this.current === owner;
  }
  strikeHexes(owner) {
    const out = [];
    for (let r = 0; r < this.H; r++) for (let c = 0; c < this.W; c++) if (owner !== 0 || this.explored[this.i(c, r)]) out.push([c, r]);
    return out;
  }
  orderStrike(owner, c, r) {
    if (!this.canStrike(owner)) return false;
    const p = this.players[owner];
    p.credits -= ORBITAL_STRIKE.cost; p.strikeCd = ORBITAL_STRIKE.cooldown;
    this.strikes.push({ c, r, owner });
    this.say(owner === 0 ? 'Satellitenschlag angefordert — Einschlag zu Beginn eurer nächsten Runde' : 'Warnung: feindliches Satellitenschlag im Anflug! Zielzone räumen', owner === 0 ? 'good' : 'bad');
    return true;
  }
  resolveStrikes(owner) {
    const ev = [];
    for (const s of this.strikes.filter((x) => x.owner === owner)) {
      const hits = [];
      for (const [c, r] of ring(s.c, s.r, ORBITAL_STRIKE.radius, this.W, this.H)) {
        for (const u of this.units) if (!u.dead && !u.carried && u.c === c && u.r === r) { const d = ORBITAL_STRIKE.unitDmg * (c === s.c && r === s.r ? 1.3 : 1) * (u.def.tough || 1); u.hp -= d; hits.push({ id: u.id, dmg: Math.round(d) }); if (u.hp <= 0.5) this.kill(u, { owner }); }
        const b = this.buildingAt(c, r);
        if (b) { const d = b.maxHp * ORBITAL_STRIKE.bldDmg; b.hp -= d; hits.push({ id: b.id, dmg: Math.round(ORBITAL_STRIKE.bldDmg * 100) }); if (b.hp <= 0) this.kill(b, { owner }); }
        if (this.map.spice[this.i(c, r)] > 0) this.map.spice[this.i(c, r)] *= 0.5;
      }
      ev.push({ type: 'strike', owner, c: s.c, r: s.r, hits });
    }
    this.strikes = this.strikes.filter((x) => x.owner !== owner);
    return ev;
  }

  // ---------- Schwester ----------
  canVoice(u) { return u.def.voice && !(u.voiceCd > 0) && !u.acted && u.owner === this.current; }
  voiceTargets(u) {
    return this.units.filter((t) => !t.dead && !t.carried && t.owner !== u.owner && distance(u.c, u.r, t.c, t.r) <= 2 && (u.owner !== 0 || this.visible[this.i(t.c, t.r)]));
  }
  voice(u, t) {
    t.stunned = 1; u.voiceCd = 3; u.acted = true; u.moved = true;
    return { type: 'voice', u: u.id, t: t.id };
  }

  // Rundenende eines Spielers: Abwehr feuert, Ernter ernten/entladen
  endTurnEvents(owner) {
    const ev = [];
    const p = this.players[owner];
    for (const b of this.buildings) {
      if (b.dead || b.owner !== owner || !b.def.weapon || !this.canFire(b)) continue;
      const ts = this.targetsFrom(b, b.c, b.r, false).filter((t) => owner !== 0 || this.visible[this.i(t.c, t.r)]);
      if (!ts.length) continue;
      ts.sort((a, b2) => this.calcDamage(b, b2) / Math.max(1, b2.hp) - this.calcDamage(b, a) / Math.max(1, a.hp));
      ev.push(this.attack(b, ts[0]));
    }
    for (const u of this.units) {
      if (u.dead || u.owner !== owner) continue;
      // Vibration für Würmer
      const sand = this.isSand(u.c, u.r) && !u.carried && u.def.mt !== 'air';
      u.vib = 0;
      if (!u.def.harvester) continue;
      const sp = this.spiceAt(u.c, u.r);
      if (sp > 0 && u.cargo < u.def.capacity && !u.carried) {
        const take = Math.min(u.def.rate, sp, u.def.capacity - u.cargo);
        this.map.spice[this.i(u.c, u.r)] -= take; u.cargo += take; u.harvested = true;
        ev.push({ type: 'harvest', u: u.id, amount: take });
      }
      const ref = this.buildings.find((b) => !b.dead && b.owner === owner && b.type === 'raffinerie' && b.turnsLeft <= 0 && distance(b.c, b.r, u.c, u.r) <= 1);
      if (ref && u.cargo > 0 && !u.carried) {
        const amt = Math.round(u.cargo * p.incomeMult);
        p.credits += amt; p.stats.harvested += u.cargo; u.cargo = 0;
        ev.push({ type: 'unload', u: u.id, amount: amt, ref: ref.id });
      }
    }
    for (const e of [...this.units, ...this.buildings]) {
      if (e.dead || e.owner !== owner) continue;
      const w = this.weapon(e);
      e.reflex = !!w && !e.attacked && !w.noMoveFire && !(e.isUnit && e.carried);
    }
    for (const u of this.units) {
      if (u.dead || u.owner !== owner || u.carried || u.def.mt === 'air' || !this.isSand(u.c, u.r)) { if (!u.dead) { u.vib = 0; u.fought = false; } continue; }
      const veh = u.def.cat === 'veh';
      if (u.def.vib === 0 && !(u.shield > 0)) { u.vib = u.fought ? 1 : 0; u.fought = false; continue; }
      u.vib = u.harvested ? 4 : u.dropped ? 3 : u.moved ? (veh ? 2.5 : 1.2) : (veh ? 0.8 : 0.3);
      if (u.fought) u.vib += 2;
      if (u.def.shield || u.shield > 0) u.vib += 4; // Schilde machen Würmer rasend
      u.dropped = false; u.fought = false;
    }
    return ev;
  }

  // ---------- Thopter-Transport ----------
  canPickup(carrier, t) {
    return carrier.def.carrier && !carrier.carrying && !carrier.acted && t && !t.acted && t.isUnit !== undefined && t.isUnit && t.owner === carrier.owner && t.def.mt !== 'air' && !t.carried && distance(carrier.c, carrier.r, t.c, t.r) <= 1;
  }
  pickup(carrier, t) {
    carrier.carrying = t.id; t.carried = true; t.c = carrier.c; t.r = carrier.r; t.moved = true; t.acted = true;
    if (carrier.moved) carrier.acted = true; // vor dem Flug aufgenommen: darf danach noch fliegen
    return { type: 'pickup', u: carrier.id, t: t.id };
  }
  dropHexes(carrier) {
    const t = this.get(carrier.carrying); if (!t) return [];
    const cands = [[carrier.c, carrier.r], ...neighbors(carrier.c, carrier.r, this.W, this.H)];
    return cands.filter(([c, r]) => this.groundFree(c, r) && this.cost(t.def.mt, c, r) < Infinity && !this.inStorm(c, r));
  }
  drop(carrier, c, r) {
    const t = this.get(carrier.carrying); if (!t) return null;
    t.carried = false; t.c = c; t.r = r; t.waitCarry = 0; carrier.carrying = 0; carrier.acted = true; carrier.moved = true;
    return { type: 'drop', u: carrier.id, t: t.id };
  }

  // ---------- Weltphase ----------
  stormStep(s) {
    let dir = s.dir;
    if (this.rnd() < 0.35) dir = (dir + (this.rnd() < 0.5 ? 1 : 5)) % 6;
    let c = s.c, r = s.r;
    for (let k = 0; k < 2; k++) {
      let nb = neighbors(c, r, this.W, this.H);
      const order = [dir, (dir + 1) % 6, (dir + 5) % 6, (dir + 2) % 6, (dir + 4) % 6, (dir + 3) % 6];
      // Richtungsindex wie in hex.js-Tabellen
      const t = r & 1 ? [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]] : [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
      let moved = false;
      for (const d of order) {
        const nc = c + t[d][0], nr = r + t[d][1];
        if (nc >= 1 && nr >= 1 && nc < this.W - 1 && nr < this.H - 1 && this.map.starts.every((st) => distance(nc, nr, st.c, st.r) >= 5)) { c = nc; r = nr; dir = d; moved = true; break; }
      }
      if (!moved) break;
    }
    return { c, r, dir };
  }

  worldPhase() {
    const ev = [];
    // 1. Sturm
    const s = this.storm;
    const from = { c: s.c, r: s.r };
    s.c = s.next.c; s.r = s.next.r; s.dir = s.next.dir;
    s.next = this.stormStep(s);
    const hits = [];
    for (const [c, r] of ring(s.c, s.r, s.rad, this.W, this.H)) {
      const i = this.i(c, r);
      if (this.map.spice[i] > 0) this.map.spice[i] = Math.floor(this.map.spice[i] * 0.5);
      for (const u of this.units) {
        if (u.dead || u.carried || u.c !== c || u.r !== r) continue;
        const t = this.terr(c, r);
        const dmg = u.def.mt === 'air' ? 55 : t === 'mountain' ? 0 : t === 'rock' ? 15 : 45;
        if (dmg) { u.hp -= dmg; hits.push({ id: u.id, dmg }); if (u.hp <= 0.5) this.kill(u); }
      }
      const b = this.buildingAt(c, r);
      if (b) { const d = b.maxHp * 0.12; b.hp -= d; hits.push({ id: b.id, dmg: 12 }); if (b.hp <= 0) this.kill(b); }
    }
    ev.push({ type: 'storm', from, to: { c: s.c, r: s.r }, hits });
    if (hits.some((h) => { const e = this.byId.get(h.id); return e && e.owner === 0; })) this.say('Der Smog trifft eure Einheiten!', 'bad');

    // 2. Würmer ziehen in eigenen Phasen nach jedem Spielerzug (wormPhase)
    this.thumpers = this.thumpers.filter((t) => !t.used && --t.life > 0);

    // 3. Glutausbruch
    if (this.round % 4 === 0) {
      for (let tries = 0; tries < 60; tries++) {
        const c = 2 + Math.floor(this.rnd() * (this.W - 4)), r = 2 + Math.floor(this.rnd() * (this.H - 4));
        if (!this.isSand(c, r) || this.map.starts.some((st) => distance(c, r, st.c, st.r) < 5) || this.inStorm(c, r)) continue;
        for (const [nc, nr] of ring(c, r, 1, this.W, this.H)) if (this.isSand(nc, nr)) this.map.spice[this.i(nc, nr)] += 300 + Math.round(this.rnd() * 300);
        let worm = null;
        if (this.worms.length < 5 && this.rnd() < 0.8) worm = this.spawnWorm(c, r);
        ev.push({ type: 'blow', c, r, worm: worm?.id });
        this.say(this.explored[this.i(c, r)] ? 'Chromfund! Neues Schrottlager aufgeflogen' : 'Chromfund irgendwo in der Stadt', 'good');
        break;
      }
    }
    this.round++;
    this.updatePower();
    return ev;
  }

  wormPhase() {
    const ev = [];
    // Gerufene Würmer brechen zuerst hervor
    for (const call of this.wormCalls) {
      const w = this.spawnWorm(call.c, call.r); if (!w) continue;
      w.size = 2;
      const hexes = this.wormBite(w, call.c, call.r);
      const eaten = this.units.filter((u) => !u.dead && !u.carried && u.def.mt !== 'air' && hexes.some(([c, r]) => c === u.c && r === u.r));
      for (const u of eaten) { this.kill(u, { owner: call.owner }); this.players[u.owner].stats.eaten++; }
      w.sated = 2;
      ev.push({ type: 'worm', id: w.id, path: [{ c: call.c, r: call.r }], eatMany: eaten.map((u) => u.id), eatHexes: hexes, called: true });
    }
    this.wormCalls = [];
    for (const w of this.worms) ev.push(...this.wormTurn(w));
    this.updateVision();
    return ev;
  }

  spawnWorm(c, r) {
    if (c === undefined) {
      for (let k = 0; k < 200; k++) {
        const cc = Math.floor(this.rnd() * this.W), rr = Math.floor(this.rnd() * this.H);
        if (this.isSand(cc, rr) && this.map.starts.every((s) => distance(cc, rr, s.c, s.r) > 8)) { c = cc; r = rr; break; }
      }
      if (c === undefined) return null;
    }
    let size = 1, x = this.rnd() * 100;
    for (const [k, v] of Object.entries(WORM_SIZES)) { x -= v.weight; if (x <= 0) { size = Number(k); break; } }
    if (this.worms.some((w) => w.size === 3) && size === 3) size = 2;
    const w = { id: NEXT++, isWorm: true, c, r, sated: 0, surfaced: false, facing: 0, size };
    this.worms.push(w); this.byId.set(w.id, w);
    return w;
  }

  wormTurn(w) {
    const ev = [];
    const sandPass = (c, r) => this.isSand(c, r) && !this.buildings.some((b) => !b.dead && distance(b.c, b.r, c, r) <= 2);
    const th = this.thumpers.filter((t) => !t.used && distance(w.c, w.r, t.c, t.r) <= 12).sort((a, b) => distance(w.c, w.r, a.c, a.r) - distance(w.c, w.r, b.c, b.r))[0];
    if (th) {
      const route = this.sandRoute(w.c, w.r, th.c, th.r, sandPass);
      if (route) {
        const steps = route.slice(1, 9), path = [{ c: w.c, r: w.r }, ...steps];
        const last = steps[steps.length - 1] || { c: w.c, r: w.r };
        w.c = last.c; w.r = last.r;
        if (last.c === th.c && last.r === th.r) {
          th.used = true; w.sated = 2;
          const hexes = [...new Set([...ring(th.c, th.r, 1, this.W, this.H).filter(([c, r]) => this.isSand(c, r)), ...this.wormBite(w, th.c, th.r)].map((h) => h.join(',')))].map((k) => k.split(',').map(Number));
          const eaten = this.units.filter((u) => !u.dead && !u.carried && u.def.mt !== 'air' && hexes.some(([c, r]) => c === u.c && r === u.r));
          for (const u of eaten) this.kill(u);
          ev.push({ type: 'worm', id: w.id, path, eatMany: eaten.map((u) => u.id), eatHexes: hexes, thumper: true });
          if (eaten.some((u) => u.owner === 1)) this.say(`Der Störsender hat einen Psycho angelockt — ${eaten.filter((u) => u.owner === 1).length} feindliche Einheiten zerlegt!`, 'good');
          if (eaten.some((u) => u.owner === 0)) this.say('Ein Psycho folgte einem Störsender und zerlegte eure Einheiten!', 'bad');
          return ev;
        }
        ev.push({ type: 'worm', id: w.id, path });
        return ev;
      }
    }
    // Vorwarnzeit: Ziel muss einen eigenen Zug zum Reagieren haben (Würmer ziehen zweimal pro Runde)
    const grace = w.lockGrace > 0; if (grace) w.lockGrace--;
    let best = null, bs = 0;
    if (w.sated <= 0) {
      for (const u of this.units) {
        if (u.dead || u.carried || u.def.mt === 'air' || !this.isSand(u.c, u.r)) continue;
        const d = distance(w.c, w.r, u.c, u.r);
        const shielded = u.def.shield || u.shield > 0;
        if (d > (shielded ? 11 : 7) || !sandPass(u.c, u.r)) continue;
        const s = (u.vib + (u.def.harvester ? 1 : 0) + (w.lock === u.id ? 1.5 : 0)) / (1 + d * 0.25);
        if (s > bs) { bs = s; best = u; }
      }
    } else w.sated--;
    if (!best || bs <= 0.05) w.lock = null;
    const path = [{ c: w.c, r: w.r }];
    if (best && bs > 0.05) {
      // BFS über Sand zum Ziel
      const prev = new Map(), q = [[w.c, w.r]], key = (c, r) => r * this.W + c;
      prev.set(key(w.c, w.r), null);
      let found = false;
      while (q.length && !found) {
        const [c, r] = q.shift();
        for (const [nc, nr] of neighbors(c, r, this.W, this.H)) {
          const k = key(nc, nr);
          if (prev.has(k) || !sandPass(nc, nr)) continue;
          prev.set(k, key(c, r)); q.push([nc, nr]);
          if (nc === best.c && nr === best.r) { found = true; break; }
        }
      }
      if (found) {
        const chain = []; let k = key(best.c, best.r);
        while (k !== null) { chain.push({ c: k % this.W, r: Math.floor(k / this.W) }); k = prev.get(k); }
        chain.reverse();
        const locked = w.lock === best.id && !grace;
        const stalking = w.lock === best.id;
        // Ohne Vorwarnung kein Angriff: erst anpirschen (mind. 2 Felder Abstand), Ziel markieren, nächste Runde zuschlagen
        let steps = chain.slice(1, 1 + WORM_SIZES[w.size || 1].steps);
        if (!locked) steps = steps.filter((h) => distance(h.c, h.r, best.c, best.r) >= 2);
        path.push(...steps);
        const last = steps[steps.length - 1] || { c: w.c, r: w.r };
        w.c = last.c; w.r = last.r;
        if (locked && last.c === best.c && last.r === best.r) {
          const hexes = this.wormBite(w, last.c, last.r);
          const eaten = this.units.filter((u) => !u.dead && !u.carried && u.def.mt !== 'air' && hexes.some(([c, r]) => c === u.c && r === u.r));
          for (const u of eaten) { this.kill(u); this.players[u.owner].stats.eaten++; }
          w.sated = WORM_SIZES[w.size || 1].sated; w.lock = null;
          ev.push({ type: 'worm', id: w.id, path, eatMany: eaten.map((u) => u.id), eatHexes: hexes, owner: best.owner });
          if (best.owner === 0) this.say(`Ein Psycho hat euren ${best.def.name} zerlegt!`, 'bad');
          return ev;
        }
        if (!stalking) {
          w.lock = best.id; w.lockGrace = 1;
          if (best.owner === 0) this.say(`Ein Psycho hat euren ${best.def.name} ins Visier genommen! Nächste Runde schlägt er zu — auf Beton bringen oder ausfliegen`, 'warn');
        }
        if (path.length > 1) { ev.push({ type: 'worm', id: w.id, path }); return ev; }
      }
    }
    if (path.length === 1) {
      // Umherziehen
      let c = w.c, r = w.r;
      for (let k = 0; k < 2; k++) {
        const nb = neighbors(c, r, this.W, this.H).filter(([nc, nr]) => sandPass(nc, nr));
        if (!nb.length) break;
        [c, r] = nb[Math.floor(this.rnd() * nb.length)];
        path.push({ c, r });
      }
      w.c = c; w.r = r;
    }
    ev.push({ type: 'worm', id: w.id, path });
    const near = this.units.some((u) => !u.dead && u.owner === 0 && !u.carried && u.def.mt !== 'air' && this.isSand(u.c, u.r) && distance(u.c, u.r, w.c, w.r) <= 5);
    if (near) this.say('Psycho-Signale! Einheiten auf Beton bringen', 'warn');
    return ev;
  }

  // Biss eines Wurms: Größe 1 ein Feld, Größe 2 drei Felder, Größe 3 sieben Felder
  wormBite(w, c, r) {
    const size = w.size || 1;
    const sandN = neighbors(c, r, this.W, this.H).filter(([nc, nr]) => this.isSand(nc, nr));
    if (size === 1) return [[c, r]];
    if (size === 2) {
      const withUnits = sandN.filter(([nc, nr]) => this.unitAt(nc, nr, false));
      const rest = sandN.filter((h) => !withUnits.includes(h));
      return [[c, r], ...[...withUnits, ...rest].slice(0, 2)];
    }
    return [[c, r], ...sandN];
  }

  // ---------- Sandgänger: Klopfer setzen ----------
  canThump(u) { return u.def.thumper && !(u.thumpCd > 0) && !u.acted && u.owner === this.current; }
  thumpHexes(u) { return ring(u.c, u.r, 2, this.W, this.H).filter(([c, r]) => this.isSand(c, r) && !this.thumpers.some((t) => t.c === c && t.r === r)); }
  thump(u, c, r) {
    this.thumpers.push({ c, r, owner: u.owner, life: 2 });
    u.thumpCd = 3; u.acted = true; u.moved = true;
    if (u.owner === 0) this.say('Störsender gesetzt — Psychos im Umkreis von 12 Feldern werden angelockt', 'good');
    return { type: 'thump', u: u.id, c, r };
  }

  sandRoute(sc, sr, tc, tr, pass) {
    const key = (c, r) => r * this.W + c, prev = new Map([[key(sc, sr), null]]), q = [[sc, sr]];
    while (q.length) {
      const [c, r] = q.shift();
      if (c === tc && r === tr) break;
      for (const [nc, nr] of neighbors(c, r, this.W, this.H)) { const k = key(nc, nr); if (prev.has(k) || !pass(nc, nr)) continue; prev.set(k, key(c, r)); q.push([nc, nr]); }
    }
    if (!prev.has(key(tc, tr))) return null;
    const out = []; let k = key(tc, tr);
    while (k !== null) { out.push({ c: k % this.W, r: Math.floor(k / this.W) }); k = prev.get(k); }
    return out.reverse();
  }

  wormSeen(w) { return !!(this.visible[this.i(w.c, w.r)] || this.radar[this.i(w.c, w.r)]); }

  // ---------- Tageszeit ----------
  dayPhase(round = this.round) { return ['morgen', 'tag', 'tag', 'tag', 'abend', 'nacht', 'nacht', 'morgen'][(round - 1) % 8]; }
  isNight() { return this.dayPhase() === 'nacht'; }

  // ---------- Sicht ----------
  updateVision() {
    this.visible.fill(0); this.radar.fill(0);
    const reveal = (c, r, rad, arr = this.visible) => { for (const [x, y] of ring(c, r, rad, this.W, this.H)) arr[this.i(x, y)] = 1; };
    for (const u of this.units) if (!u.dead && u.owner === 0 && !u.carried) reveal(u.c, u.r, Math.max(1, u.def.sight - (this.isNight() && u.def.mt !== 'air' ? 1 : 0)));
    for (const b of this.buildings) if (!b.dead && b.owner === 0) {
      reveal(b.c, b.r, b.def.sight);
      if (b.def.radar && b.turnsLeft <= 0 && !this.players[0].low) reveal(b.c, b.r, 9, this.radar);
    }
    for (const p of this.pois) if (p.owner === 0 && p.type === 'warte') reveal(p.c, p.r, 5);
    for (const w of this.worms) {
      if (this.units.some((u) => !u.dead && u.owner === 0 && !u.carried && u.def.mt !== 'air' && distance(u.c, u.r, w.c, w.r) <= 5)) this.radar[this.i(w.c, w.r)] = 1;
    }
    if (this.revealRound === this.round) this.visible.fill(1);
    for (let k = 0; k < this.visible.length; k++) if (this.visible[k]) this.explored[k] = 1;
  }
  seen(e) {
    if (e.owner === 0) return true;
    if (e.isBuilding) return !!this.explored[this.i(e.c, e.r)];
    return !!this.visible[this.i(e.c, e.r)] && !this.stealthed(e, 0);
  }

  checkEnd() {
    const alive = (o) => this.buildings.some((b) => !b.dead && b.owner === o);
    if (this.mission) {
      const r = this.mission.check(this);
      this.missionStatus = r;
      if (r.failed) this.state = 'lost';
      else if (r.done) this.state = 'won';
      else if (!alive(0) && !this.units.some((u) => !u.dead && u.owner === 0)) this.state = 'lost';
      return this.state;
    }
    if (!alive(1)) this.state = 'won';
    else if (!alive(0) && !this.units.some((u) => !u.dead && u.owner === 0)) this.state = 'lost';
    return this.state;
  }

  // ---------- Speichern ----------
  serialize() {
    const strip = (o) => { const c = { ...o }; delete c.def; delete c.vis; delete c.anim; delete c.gone; delete c.hitFlash; delete c.recoil; delete c.forceShow; delete c.surface; delete c.crashing; delete c.aimUntil; return c; };
    return JSON.stringify({ v: 2, seed: this.map.seed, ter: this.map.ter, spice: Array.from(this.map.spice), round: this.round, current: this.current,
      players: this.players, units: this.units.filter((u) => !u.dead).map(strip), buildings: this.buildings.filter((b) => !b.dead).map(strip),
      worms: this.worms.map(strip), storm: { c: this.storm.c, r: this.storm.r, rad: this.storm.rad, dir: this.storm.dir, next: this.storm.next },
      thumpers: this.thumpers, strikes: this.strikes, wormCalls: this.wormCalls, explored: Array.from(this.explored).join(''), revealRound: this.revealRound, aiMode: this.aiMode, diffName: this.diffName, missionId: this.mission?.id || null, aiPassive: !!this.aiPassive, pois: this.pois.map((p) => p.owner) });
  }
  static restore(map, data, diff) {
    map.ter = data.ter; map.spice = Float32Array.from(data.spice);
    const g = new Game(map, { diff });
    g.diffName = data.diffName; g.aiPassive = data.aiPassive; g.round = data.round; g.current = 0; g.aiMode = data.aiMode; g.revealRound = data.revealRound;
    g.players = data.players.map((p) => ({ ...p, perk: FACTIONS[p.faction].perk || {} }));
    g.units = data.units.map((u) => ({ ...u, def: u.landed ? g.landedDef(u.type) : UNITS[u.type] }));
    g.buildings = data.buildings.map((b) => ({ ...b, def: BUILDINGS[b.type], rise: 1 }));
    if (data.pois) g.pois.forEach((p, k) => { p.owner = data.pois[k] ?? -1; });
    g.worms = data.worms; g.storm = data.storm; g.thumpers = data.thumpers || []; g.strikes = data.strikes || []; g.wormCalls = data.wormCalls || [];
    for (const e of [...g.units, ...g.buildings, ...g.worms]) { g.byId.set(e.id, e); NEXT = Math.max(NEXT, e.id + 1); }
    for (let k = 0; k < data.explored.length; k++) g.explored[k] = data.explored.charCodeAt(k) === 49 ? 1 : 0;
    g.rnd = mulberry32(map.seed * 7 + data.round * 131);
    g.updatePower(); g.updateVision();
    return g;
  }

  cleanup() {
    this.units = this.units.filter((u) => !u.dead);
    this.buildings = this.buildings.filter((b) => !b.dead);
  }
}
