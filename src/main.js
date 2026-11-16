// Einstieg: Menü, Initialisierung, Spielschleife
import { generateMap } from './map.js';
import { Game } from './game.js';
import { Renderer } from './render.js';
import { Controller } from './ui.js';
import { FX } from './fx.js';
import { DIFFICULTY } from './data.js';
import { center } from './hex.js';
import { MISSIONS, campaignProgress, setProgress, missionById } from './campaign.js';
import { startMenuBg } from './menubg.js';
let menuBg = null;
try { menuBg = startMenuBg(document.getElementById('menu')); } catch (e) { console.warn(e); }

const $ = (s) => document.querySelector(s);
let diff = 'normal', faction = 'vareth';
document.querySelectorAll('#menu [data-fac]').forEach((b) => {
  b.onclick = () => { faction = b.dataset.fac; document.querySelectorAll('#menu [data-fac]').forEach((x) => x.classList.toggle('on', x === b)); };
});
let saved = null;
try { saved = JSON.parse(localStorage.getItem('neonkrone-save') || 'null'); } catch (e) { saved = null; }
if (saved && saved.v === 2) { const c = $('#continue'); c.style.display = 'block'; c.textContent = `Fortsetzen (Runde ${saved.round})`; c.onclick = () => start(saved); }

document.querySelectorAll('#menu [data-diff]').forEach((b) => {
  b.onclick = () => { diff = b.dataset.diff; document.querySelectorAll('#menu [data-diff]').forEach((x) => x.classList.toggle('on', x === b)); };
});
$('#start').onclick = () => start();
$('#campaignbtn').onclick = () => showCampaign();
function showCampaign() {
  const prog = campaignProgress();
  const el = $('#campaign');
  el.innerHTML = `<div class="box"><button class="close">×</button><h2>Kampagne: Nächte in Velvet Bay</h2><div class="sub">Kashiro gegen Valkor · ${prog} von ${MISSIONS.length} Missionen erfüllt</div>
    <div class="mlist">${MISSIONS.map((m, i) => `<button class="mcard ${i > prog ? 'locked' : ''} ${i < prog ? 'done' : ''}" data-i="${i}" ${i > prog ? 'disabled' : ''}>
      <span class="mnum">${i + 1}</span><b>${m.title}</b><span>${m.place}</span><em>${i < prog ? 'Erfüllt' : i === prog ? 'Bereit' : 'Gesperrt'}</em></button>`).join('')}</div></div>`;
  el.classList.add('show');
  el.querySelector('.close').onclick = () => el.classList.remove('show');
  el.querySelectorAll('.mcard').forEach((b) => b.onclick = () => showBriefing(MISSIONS[Number(b.dataset.i)]));
}
function showBriefing(m) {
  const el = $('#campaign');
  el.innerHTML = `<div class="box brief"><button class="close">×</button><div class="place">${m.place}</div><h2>${m.title}</h2>
    <div class="speaker">${m.speaker}</div>${m.briefing.map((p) => `<p>${p}</p>`).join('')}
    <div class="m-label">Ziele</div><ul>${m.objectives.map((o) => `<li>${o}</li>`).join('')}</ul>
    <div class="row"><button id="bback">Zurück</button><button id="bgo" class="primary">Mission starten</button></div></div>`;
  el.querySelector('.close').onclick = () => el.classList.remove('show');
  el.querySelector('#bback').onclick = () => showCampaign();
  el.querySelector('#bgo').onclick = () => { el.classList.remove('show'); start(null, m); };
}
try { if (sessionStorage.getItem('neonkrone-open-campaign')) { sessionStorage.removeItem('neonkrone-open-campaign'); showCampaign(); } } catch {}

async function start(save, mission) {
  $('#menu .loading').classList.add('show');
  $('#start').disabled = true;
  await new Promise((r) => setTimeout(r, 50));
  let seed, map, game;
  if (save) {
    seed = save.seed; map = generateMap(seed);
    game = Game.restore(map, save, DIFFICULTY[save.diffName || 'normal']);
    if (save.missionId) game.mission = missionById(save.missionId);
  } else if (mission) {
    seed = mission.seed; map = generateMap(seed);
    game = new Game(map, { diff: DIFFICULTY[mission.diff], playerFaction: 'vareth', enemyFaction: 'kordan' });
    game.diffName = mission.diff;
    game.setup();
    mission.setup(game);
    game.mission = mission;
    game.updateVision();
  } else {
    const seedIn = $('#seed').value.trim();
    seed = seedIn ? (parseInt(seedIn, 10) || hash(seedIn)) : Math.floor(Math.random() * 1e6);
    map = generateMap(seed);
    const foes = ['vareth', 'kordan', 'ossar', 'sandvolk'].filter((f) => f !== faction);
    game = new Game(map, { diff: DIFFICULTY[diff], playerFaction: faction, enemyFaction: foes[Math.floor(Math.random() * foes.length)] });
    game.diffName = diff;
    game.setup();
  }
  const fx = new FX();
  const renderer = new Renderer($('#game'), game, fx);
  const ctrl = new Controller(game, renderer, fx);
  ctrl.onMissionWon = (m) => { const i = MISSIONS.indexOf(m); setProgress(i + 1); };
  window.__game = { game, renderer, ctrl };
  const home = center(map.starts[0].c, map.starts[0].r);
  renderer.cam.z = window.innerWidth < 700 ? 0.8 : 1.05;
  renderer.centerOn(home.x + 60, home.y + 40, false);
  $('#menu').classList.add('hide');
  if (menuBg) { const b = menuBg; menuBg = null; setTimeout(() => b.stop(), 600); }
  $('#seedinfo').textContent = `Karte ${seed}`;
  let last = performance.now();
  const loop = (now) => {
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000)); last = now;
    ctrl.update(dt);
    renderer.draw(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  if (!save) {
    game.say('Willkommen in Velvet Bay. Baut eure Basis aus und sammelt Chrom.', 'info');
    game.say('Tipp: Kommandoblock antippen, um Gebäude zu errichten.', 'info');
  }
  if (!save) ctrl.save();
  ctrl.refresh();
  if (game.mission && !save) for (const p of game.mission.briefing.slice(-1)) game.say(p, 'info');
  await ctrl.banner(game.mission ? game.mission.title : `Runde ${game.round}`, save ? 'Spiel fortgesetzt' : game.mission ? game.mission.place : `${game.players[0].name} gegen ${game.players[1].name}`, 1.6);
}

function hash(s) { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h) % 1e6; }

if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
