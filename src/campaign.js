// Kampagne: fünf Missionen in Velvet Bay
import { ring, distance } from './hex.js';

const P = 0, E = 1;
const done = (g, o, t) => g.buildings.some((b) => !b.dead && b.owner === o && b.type === t && b.turnsLeft <= 0);
const harvLost = (g) => g.players[P].stats.lostTypes?.ernter || 0;

function freeRock(g, o, near, n, minD = 1) {
  const out = [];
  for (const [c, r] of ring(near.c, near.r, 4, g.W, g.H).sort((a, b) => distance(a[0], a[1], near.c, near.r) - distance(b[0], b[1], near.c, near.r))) {
    if (out.length >= n) break;
    if (distance(c, r, near.c, near.r) < minD || g.terr(c, r) !== 'rock' || !g.groundFree(c, r)) continue;
    if (out.some(([a, b]) => distance(a, b, c, r) < 2)) continue;
    out.push([c, r]);
  }
  return out;
}
function placeUnits(g, o, near, types) {
  const hexes = ring(near.c, near.r, 3, g.W, g.H).filter(([c, r]) => g.groundFree(c, r) && g.terr(c, r) !== 'mountain')
    .sort((a, b) => distance(a[0], a[1], near.c, near.r) - distance(b[0], b[1], near.c, near.r));
  types.forEach((t, i) => { const h = hexes[i]; if (h) g.addUnit(o, t, h[0], h[1]); });
}

export const MISSIONS = [
  {
    id: 'm1', title: 'Erste Schicht', place: 'Velvet Bay · Hafenviertel', seed: 1101, diff: 'leicht',
    speaker: 'Einsatzleiterin Mori',
    briefing: [
      'Willkommen in Velvet Bay, Kommandant. Kashiro hat die Schürfrechte im Hafenviertel ersteigert — und mit ihnen die Pflicht, Chrom zu liefern.',
      'Baut eine Stromzelle, dann eine Schmelze. Der Sammler, der mit ihr kommt, ist kostbarer als jeder Panzer. Holt ihn von der Straße, wenn die Psycho-Signale ausschlagen.',
      'Valkor beobachtet uns vom Nordufer aus. Noch greifen sie nicht an.',
    ],
    objectives: ['Eine Schmelze errichten', '2.000 Chrom sammeln'],
    setup(g) {
      g.aiPassive = true;
      g.players[E].incomeMult = 0;
      for (const u of g.ownUnits(E)) { u.dead = true; }
      g.cleanup();
    },
    check(g) {
      const h = g.players[P].stats.harvested;
      const lines = [
        { text: 'Schmelze errichten', ok: done(g, P, 'raffinerie') },
        { text: `Chrom sammeln: ${Math.min(2000, h)} / 2.000`, ok: h >= 2000 },
      ];
      return { lines, done: lines.every((l) => l.ok), failed: false };
    },
  },
  {
    id: 'm2', title: 'Die Ödnis', place: 'Velvet Bay · Eingestürzte Hochtrasse', seed: 2207, diff: 'leicht',
    speaker: 'Ghost, Netrunnerin',
    briefing: [
      'Die nahen Lager sind leergeräumt. Das gute Chrom liegt draußen unter der eingestürzten Hochtrasse — dort, wo keiner mehr bei Verstand ist.',
      'Kashiro hat euch einen Schweber-Hangar und einen Träger überlassen. Lasst ihn eure Sammler holen, bevor die Psychos sie finden. Die Polizei meldet einen Amok-Mech in diesem Sektor.',
      'Liefert 5.000 Chrom bis zur zwanzigsten Runde. Verliert ihr mehr als drei Sammler, vergibt der Vorstand die Rechte neu.',
    ],
    objectives: ['5.000 Chrom sammeln bis Runde 20', 'Höchstens 3 Sammler verlieren'],
    setup(g) {
      g.aiPassive = true;
      g.players[E].incomeMult = 0.5;
      const s = g.map.starts[P];
      const [h1, h2, h3] = freeRock(g, P, s, 3, 2);
      if (h1) g.addBuilding(P, 'windfalle', h1[0], h1[1], true);
      if (h2) g.addBuilding(P, 'raffinerie', h2[0], h2[1], true);
      if (h3) g.addBuilding(P, 'horst', h3[0], h3[1], true);
      placeUnits(g, P, s, ['ernter', 'traeger']);
      g.players[P].credits = 2000;
      // Mehr Würmer, darunter ein Uralter
      for (let k = 0; k < 2; k++) g.spawnWorm();
      const big = g.worms[g.worms.length - 1]; if (big) big.size = 3;
      g.updatePower();
    },
    check(g) {
      const h = g.players[P].stats.harvested, lost = harvLost(g);
      const lines = [
        { text: `Chrom sammeln: ${Math.min(5000, h)} / 5.000 (Runde ${g.round} von 20)`, ok: h >= 5000 },
        { text: `Sammler verloren: ${lost} von höchstens 3`, ok: lost <= 3 },
      ];
      return { lines, done: h >= 5000, failed: lost > 3 || (g.round > 20 && h < 5000) };
    },
  },
  {
    id: 'm3', title: 'Außenposten Pier 9', place: 'Velvet Bay · Containerhafen', seed: 3313, diff: 'normal',
    speaker: 'Einsatzleiterin Mori',
    briefing: [
      'Valkor hat an Pier 9 einen Außenposten errichtet, mitten in unserem Sektor. Von dort überfallen sie unsere Sammler.',
      'Der Posten hat keinen Kommandoblock — er kann sich nicht erweitern, aber seine Wachgeschütze sind gut gestellt. Ihr erhaltet eine Panzerkolonne und einen Raketenwerfer.',
      'Macht den Posten platt. Jedes Gebäude.',
    ],
    objectives: ['Alle feindlichen Gebäude zerstören'],
    setup(g) {
      const es = g.map.starts[E];
      const bh = g.buildings.find((b) => b.owner === E && b.type === 'bauhof');
      if (bh) { bh.dead = true; g.cleanup(); }
      g.addBuilding(E, 'kaserne', es.c, es.r, true);
      const spots = freeRock(g, E, es, 5, 1);
      ['turm', 'turm', 'windfalle', 'raffinerie', 'turm'].forEach((t, i) => { const h = spots[i]; if (h) g.addBuilding(E, t, h[0], h[1], true); });
      placeUnits(g, E, es, ['panzer', 'rak', 'rak', 'inf']);
      placeUnits(g, P, g.map.starts[P], ['panzer', 'panzer', 'panzer', 'werfer', 'rak']);
      g.players[P].credits = 1500;
      g.players[E].credits = 800;
      g.updatePower();
    },
    check(g) {
      const left = g.buildings.filter((b) => !b.dead && b.owner === E).length;
      const lines = [{ text: `Feindliche Gebäude übrig: ${left}`, ok: left === 0 }];
      return { lines, done: left === 0, failed: false };
    },
  },
  {
    id: 'm4', title: 'Smogfront', place: 'Velvet Bay · Industriezone Süd', seed: 4421, diff: 'normal',
    speaker: 'Ghost, Netrunnerin',
    briefing: [
      'Valkor hat sich mit der Fixerin Vex verbündet. Ihr Büro in der Industriezone bringt ihnen Söldner per AV — schneller, als wir sie aufhalten können.',
      'Eine dichte Smogfront zieht über die Zone. Nutzt sie, oder sie nutzt euch. Auch wir haben ein Fixer-Büro erhalten.',
      'Zerstört das feindliche Fixer-Büro vor der achtzehnten Runde.',
    ],
    objectives: ['Feindliches Fixer-Büro zerstören', 'Vor Runde 18'],
    setup(g) {
      g.storm.rad = 3;
      const es = g.map.starts[E], ps = g.map.starts[P];
      const e = freeRock(g, E, es, 5, 1);
      ['windfalle', 'windfalle', 'raffinerie', 'ausguck', 'kontor'].forEach((t, i) => { const h = e[i]; if (h) g.addBuilding(E, t, h[0], h[1], true); });
      const p = freeRock(g, P, ps, 4, 1);
      ['windfalle', 'raffinerie', 'ausguck', 'kontor'].forEach((t, i) => { const h = p[i]; if (h) g.addBuilding(P, t, h[0], h[1], true); });
      placeUnits(g, P, ps, ['panzer', 'panzer', 'rak']);
      g.players[P].credits = 3000; g.players[E].credits = 4000;
      g.updatePower();
    },
    check(g) {
      const k = g.buildings.some((b) => !b.dead && b.owner === E && b.type === 'kontor');
      const lines = [
        { text: 'Feindliches Fixer-Büro zerstören', ok: !k },
        { text: `Runde ${g.round} von 18`, ok: g.round <= 18 },
      ];
      return { lines, done: !k, failed: k && g.round > 18 };
    },
  },
  {
    id: 'm5', title: 'Die Neonkrone', place: 'Velvet Bay · Valkor-Turm', seed: 5539, diff: 'schwer',
    speaker: 'Einsatzleiterin Mori',
    briefing: [
      'Das ist es, Kommandant. Valkor hat sich am Fuß seines Turms verschanzt — die leuchtende Spitze nennen sie in der Stadt nur die Neonkrone.',
      'Wer die Krone hält, hält Velvet Bay. Valkor hat alles aufgeboten, was es hat: Schweber, Söldner der Fixerin, eigene Netrunner.',
      'Vernichtet Valkor Defense in Velvet Bay.',
    ],
    objectives: ['Alle feindlichen Gebäude zerstören'],
    setup(g) {
      const es = g.map.starts[E];
      const e = freeRock(g, E, es, 4, 1);
      ['windfalle', 'raffinerie', 'kaserne', 'turm'].forEach((t, i) => { const h = e[i]; if (h) g.addBuilding(E, t, h[0], h[1], true); });
      g.players[E].credits = 5000; g.players[P].credits = 3500;
      g.updatePower();
    },
    check(g) {
      const left = g.buildings.filter((b) => !b.dead && b.owner === E).length;
      return { lines: [{ text: `Feindliche Gebäude übrig: ${left}`, ok: left === 0 }], done: left === 0, failed: false };
    },
  },
];

export function campaignProgress() { try { return Number(localStorage.getItem('neonkrone-campaign') || 0); } catch { return 0; } }
export function setProgress(n) { try { if (n > campaignProgress()) localStorage.setItem('neonkrone-campaign', String(n)); } catch {} }
export function missionById(id) { return MISSIONS.find((m) => m.id === id); }
