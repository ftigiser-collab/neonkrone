// Datengetriebene Definitionen für den Rundenmodus
// TP = Trefferpunkte (100 = volle Stärke), Reichweite in Hexfeldern

export const FACTIONS = {
  vareth: { name: 'Kashiro-Konzern', color: '#ff3b5c', motto: 'Ehre ist ein Vertrag', perk: { airCost: 0.85, airMove: 1 }, perkText: 'Schweber 15 % günstiger und +1 Bewegung' },
  kordan: { name: 'Valkor Defense', color: '#3fa8ff', motto: 'Frieden durch Feuerkraft', perk: { vehPower: 1.12, bldHp: 1.2 }, perkText: 'Fahrzeuge +12 % Schaden, Gebäude +20 % stabiler' },
  sandvolk: { name: 'Chromfresser', color: '#ff9d1a', motto: 'Mehr Chrom, weniger Mensch', perk: { svCost: 0.7, svMove: 1 }, perkText: 'Chromfresser-Einheiten 30 % günstiger und +1 Bewegung' },
  ossar: { name: 'Netzschatten', color: '#2ef0d0', motto: 'Was im Netz ist, gehört uns', perk: { infMove: 1, dropCost: 0.7 }, perkText: 'Infanterie +1 Bewegung, AV-Drops 30 % günstiger' },
};

export const TERRAIN = {
  sand:     { name: 'Straße',    def: 0,    sand: true,  build: false },
  dune:     { name: 'Trümmer',   def: 0.1,  sand: true,  build: false },
  rock:     { name: 'Beton',     def: 0.15, sand: false, build: true },
  mountain: { name: 'Megablock', def: 0.35, sand: false, build: false },
};
export const TER_IDS = ['sand', 'dune', 'rock', 'mountain'];

// Bewegungskosten je Fortbewegungsart (Infinity = unpassierbar)
export const MOVE_COST = {
  foot:  { sand: 1, dune: 2, rock: 1, mountain: 2 },
  sandfoot: { sand: 1, dune: 1, rock: 1, mountain: 2 },
  wheel: { sand: 1, dune: 3, rock: 1, mountain: Infinity },
  track: { sand: 1, dune: 2, rock: 1, mountain: Infinity },
  air:   { sand: 1, dune: 1, rock: 1, mountain: 1 },
};

export const ARMOR_MOD = {
  rifle:     { inf: 1.0, light: 0.45, heavy: 0.15, bld: 0.12, air: 0 },
  mg:        { inf: 1.1, light: 0.75, heavy: 0.25, bld: 0.15, air: 0 },
  cannon:    { inf: 0.5, light: 0.9, heavy: 0.85, bld: 0.6, air: 0 },
  rocket:    { inf: 0.4, light: 0.95, heavy: 0.95, bld: 0.5, air: 1.0 },
  artillery: { inf: 1.0, light: 0.85, heavy: 0.6, bld: 0.8, air: 0 },
  flak:      { inf: 0.2, light: 0.1, heavy: 0, bld: 0, air: 1.2 },
  tmg:       { inf: 1.05, light: 0.55, heavy: 0.15, bld: 0.1, air: 0.7 },
  trocket:   { inf: 0.55, light: 1.0, heavy: 1.05, bld: 0.75, air: 0 },
  turret:    { inf: 0.8, light: 0.9, heavy: 0.75, bld: 0, air: 0 },
  sniper:    { inf: 1.35, light: 0.35, heavy: 0.1, bld: 0.05, air: 0 },
  laser:     { inf: 0.6, light: 1.0, heavy: 1.1, bld: 0.9, air: 0.8 },
  desert:    { inf: 1.1, light: 0.8, heavy: 0.35, bld: 0.2, air: 0 },
  crys:      { inf: 1.4, light: 0.6, heavy: 0.3, bld: 0.3, air: 0 },
  flame:     { inf: 1.4, light: 0.9, heavy: 0.4, bld: 1.1, air: 0 },
  siege:     { inf: 0.6, light: 0.95, heavy: 0.95, bld: 1.2, air: 0 },
  bomb:      { inf: 0.8, light: 1.0, heavy: 1.0, bld: 1.3, air: 0 },
  aam:       { inf: 0, light: 0, heavy: 0, bld: 0, air: 1.15 },
  blade:     { inf: 1.25, light: 0.3, heavy: 0.1, bld: 0.1, air: 0 },
  gauss:     { inf: 1.1, light: 0.8, heavy: 0.45, bld: 0.3, air: 0.3 },
};

export const WEAPONS = {
  rifle:     { type: 'rifle', power: 50, range: [1, 1], ground: true, air: false, proj: 'bullet' },
  mg:        { type: 'mg', power: 52, range: [1, 1], ground: true, air: false, proj: 'bullet' },
  cannon:    { type: 'cannon', power: 72, range: [1, 1], ground: true, air: false, proj: 'shell' },
  rocketInf: { type: 'rocket', power: 62, range: [1, 1], ground: true, air: true, proj: 'rocket' },
  artillery: { type: 'artillery', power: 78, range: [2, 4], ground: true, air: false, proj: 'arty', noMoveFire: true, noCounter: true },
  tmg:       { type: 'tmg', power: 48, range: [1, 1], ground: true, air: true, proj: 'bullet' },
  trocket:   { type: 'trocket', power: 70, range: [1, 1], ground: true, air: false, proj: 'rocket', ammo: true },
  sniper:    { type: 'sniper', power: 64, range: [2, 3], ground: true, air: false, proj: 'sniper' },
  laser:     { type: 'laser', power: 72, range: [1, 3], ground: true, air: true, proj: 'laser' },
  desert:    { type: 'desert', power: 58, range: [1, 1], ground: true, air: false, proj: 'bullet' },
  crys:      { type: 'crys', power: 70, range: [1, 1], ground: true, air: false, proj: 'blade' },
  flame:     { type: 'flame', power: 74, range: [1, 1], ground: true, air: false, proj: 'flame' },
  gunship:   { type: 'trocket', power: 64, range: [1, 2], ground: true, air: true, proj: 'rocket' },
  siege:     { type: 'siege', power: 88, range: [1, 2], ground: true, air: false, proj: 'shell' },
  mflak:     { type: 'flak', power: 68, range: [1, 3], ground: false, air: true, proj: 'flak' },
  bombs:     { type: 'bomb', power: 95, range: [0, 1], ground: true, air: false, proj: 'bomb', ammo: true },
  aam:       { type: 'aam', power: 82, range: [1, 2], ground: false, air: true, proj: 'rocket' },
  blade:     { type: 'blade', power: 45, range: [1, 1], ground: true, air: false, proj: 'blade' },
  gauss:     { type: 'gauss', power: 62, range: [1, 1], ground: true, air: true, proj: 'bullet' },
  turretGun: { type: 'turret', power: 68, range: [1, 2], ground: true, air: false, proj: 'shell' },
  flak:      { type: 'flak', power: 75, range: [1, 3], ground: false, air: true, proj: 'flak' },
};

export const UNITS = {
  inf:     { name: 'Söldner', cat: 'inf', move: 3, mt: 'foot', sight: 2, armor: 'inf', weapon: 'rifle', cost: 100, prereq: ['kaserne'], vib: 1,
             desc: 'Günstige Straßensöldner mit Smartgewehren — klettern sogar durch Megablocks.' },
  sandgaenger: { name: 'Netzläufer', cat: 'inf', move: 4, mt: 'sandfoot', sight: 3, armor: 'inf', weapon: 'rifle', cost: 400, prereq: ['kaserne', 'ausguck'], vib: 0, thumper: true, ram: 4, ramRegen: 1, hacks: ['optik', 'kamera'],
             desc: 'Leise Späher mit kleinem Deck (RAM 4): Optik-Reset und Kamera anzapfen. Machen keinen Lärm und locken keine Psychos an, Trümmer kosten sie nichts extra. Setzen alle 3 Runden einen Störsender in bis zu 2 Feldern Entfernung.' },
  scharf:  { name: 'Scharfschütze', cat: 'inf', move: 3, mt: 'foot', sight: 4, armor: 'inf', weapon: 'sniper', cost: 450, prereq: ['kaserne', 'ausguck'], vib: 0.5, stealth: 'still',
             desc: 'Reichweite 2–3, tödlich gegen Infanterie. Mit Thermotarnung unsichtbar, solange er nicht zieht — der Feind sieht ihn nur aus nächster Nähe. Wehrlos im Nahkampf.' },
  schild:  { name: 'Bollwerk-Garde', cat: 'inf', move: 3, mt: 'foot', sight: 2, armor: 'inf', weapon: 'crys', cost: 400, prereq: ['kaserne', 'windfalle'], vib: 1, shield: true,
             desc: 'Kinetikschild: Geschosse richten nur 40 % Schaden an. Klingen, Flammen und Explosionen dringen durch. Laser auf einen Schild lösen eine Überladung aus. Das Summen der Schilde macht Psychos rasend — sie hören es aus großer Entfernung.' },
  pionier: { name: 'Techie', cat: 'inf', move: 3, mt: 'foot', sight: 2, armor: 'inf', cost: 500, prereq: ['kaserne'], vib: 1, capture: true,
             desc: 'Hackt ein angrenzendes feindliches Gebäude und übernimmt es (der Techie bleibt drin) oder repariert ein eigenes um 50 %.' },
  spion:   { name: 'Infiltrator', cat: 'sis', move: 4, mt: 'foot', sight: 3, armor: 'inf', cost: 450, prereq: ['konvent'], vib: 0.3, stealth: 'always', infiltrate: true,
             desc: 'Unsichtbar außer aus nächster Nähe. Infiltriert ein angrenzendes feindliches Gebäude: 2 Runden Ausfall, stiehlt bis zu 400 Credits, deckt die Umgebung auf.' },
  rak:     { name: 'Raketentrupp', cat: 'inf', move: 2, mt: 'foot', sight: 2, armor: 'inf', weapon: 'rocketInf', cost: 250, prereq: ['kaserne'], vib: 1,
             desc: 'Panzerabwehr zu Fuß mit Lenkraketen. Trifft auch Schweber.' },
  trike:   { name: 'Kampfbike', cat: 'veh', move: 7, mt: 'wheel', sight: 3, armor: 'light', weapon: 'mg', cost: 350, prereq: ['fabrik'], vib: 2,
             desc: 'Schnellster Bodenspäher. Hasst Trümmer.' },
  panzer:  { name: 'Schwebepanzer', cat: 'veh', move: 4, mt: 'track', sight: 2, armor: 'heavy', weapon: 'cannon', cost: 800, prereq: ['fabrik'], vib: 2,
             desc: 'Rückgrat jeder Konzernarmee.' },
  werfer:  { name: 'Raketenwerfer', cat: 'veh', move: 3, mt: 'track', sight: 2, armor: 'light', weapon: 'artillery', cost: 900, prereq: ['fabrik', 'ausguck'], vib: 2,
             desc: 'Reichweite 2–4. Kann nicht ziehen und feuern in derselben Runde.' },
  flakwagen: { name: 'Flak-Truck', cat: 'veh', move: 5, mt: 'wheel', sight: 3, armor: 'light', weapon: 'mflak', cost: 600, prereq: ['fabrik'], vib: 2,
             desc: 'Bewegliche Luftabwehr, Reichweite 1–3. Trifft keine Bodenziele.' },
  laserpanzer: { name: 'Laserpanzer', cat: 'veh', move: 4, mt: 'track', sight: 3, armor: 'heavy', weapon: 'laser', turret: true, cost: 1300, prereq: ['fabrik', 'ausguck'], vib: 2,
             desc: 'Laserlanze mit Reichweite 1–3, trifft auch Schweber. Gegen Kinetikschilde verheerend — aber die Überladung trifft auch ihn selbst.' },
  koloss:  { name: 'Belagerungsmech', cat: 'veh', move: 2, mt: 'track', sight: 2, armor: 'heavy', weapon: 'siege', turret: true, cost: 1700, prereq: ['fabrik', 'ausguck'], vib: 4, tough: 0.6,
             desc: 'Schreitender Kampfmech: erleidet nur 60 % Schaden, Kanone mit Reichweite 1–2, stark gegen Gebäude. Langsam und laut — Psychos lieben ihn.' },
  ernter:  { name: 'Sammler', cat: 'veh', move: 4, mt: 'track', sight: 2, armor: 'heavy', cost: 800, prereq: ['fabrik', 'raffinerie'], vib: 4, harvester: true, capacity: 750, rate: 300,
             desc: 'Gepanzerter Bergungslaster: sammelt bis zu 250 Chrom pro Runde, fasst 750. Macht viel Lärm und lockt Psychos stark an.' },
  libelle: { name: 'Spähdrohne', cat: 'air', move: 9, mt: 'air', sight: 4, armor: 'air', weapon: 'tmg', cost: 600, prereq: ['horst', 'ausguck'],
             desc: 'Weitsicht und Bordkanone. Jagt Infanterie und andere Schweber.' },
  falke:   { name: 'Kampf-Schweber', cat: 'air', move: 7, mt: 'air', sight: 3, armor: 'air', weapon: 'trocket', ammo: 3, cost: 1100, prereq: ['horst', 'ausguck'],
             desc: '3 Raketensalven gegen Panzer und Gebäude. Lädt am Hangar nach.' },
  bomber:  { name: 'Bomber-Schweber', cat: 'air', move: 6, mt: 'air', sight: 2, armor: 'air', weapon: 'bombs', ammo: 2, cost: 1300, prereq: ['horst', 'ausguck'],
             desc: 'Wirft Bomben auf das Feld unter sich oder daneben. Stark gegen Gebäude. 2 Abwürfe, lädt am Hangar nach.' },
  jaeger:  { name: 'Abfang-Schweber', cat: 'air', move: 9, mt: 'air', sight: 3, armor: 'air', weapon: 'aam', cost: 850, prereq: ['horst', 'ausguck'],
             desc: 'Luft-Luft-Raketen mit Reichweite 2. Holt feindliche Schweber vom Himmel, kann keine Bodenziele treffen.' },
  schwester: { name: 'Netrunnerin', cat: 'sis', move: 3, mt: 'foot', sight: 3, armor: 'inf', weapon: 'blade', cost: 500, prereq: ['konvent'], vib: 0.5, ram: 8, ramRegen: 2, hacks: ['absturz', 'kurzschluss', 'optik', 'psychose', 'kapern', 'kamera'],
             desc: 'Netrunnerin mit Cyberdeck: hackt mit RAM (8, +2 pro Runde) feindliche Einheiten und Gebäude in 3 Feldern, eingeklinkt am Zugangspunkt, Netzknoten oder Kameraturm in 6. Systemabsturz, Kurzschluss, Optik-Reset, Cyberpsychose, Geschütz kapern, Kamera anzapfen. Im Nahkampf mit Monodraht tödlich gegen Infanterie.' },
  duenen:  { name: 'Chromschläger', cat: 'sv', move: 4, mt: 'sandfoot', sight: 3, armor: 'inf', weapon: 'desert', cost: 450, prereq: ['felsenhort'], vib: 0, stealth: 'sand',
             desc: 'Schläger der Chromfresser: machen keinen Lärm, auf Straßen getarnt, Trümmer kosten nichts extra.' },
  todes:   { name: 'Mantis-Rotte', cat: 'sv', move: 4, mt: 'sandfoot', sight: 3, armor: 'inf', weapon: 'crys', cost: 750, prereq: ['felsenhort', 'ausguck'], vib: 0, stealth: 'sand', elite: 0.75,
             desc: 'Elite der Chromfresser mit Gottesanbeterin-Klingen: erleidet nur 75 % Schaden, vernichtet Infanterie im Nahkampf, auf Straßen getarnt.' },
  wurmreiter: { name: 'Psycho-Prediger', cat: 'sv', move: 4, mt: 'sandfoot', sight: 3, armor: 'inf', weapon: 'desert', cost: 900, prereq: ['felsenhort'], vib: 0, callWorm: true, faction: 'sandvolk',
             desc: 'Sendet alle 4 Runden ein Wahnsignal auf ein Straßenfeld in bis zu 5 Feldern: In der nächsten Psychophase bricht dort eine Psycho-Rotte los und zerlegt alles in 3 Feldern.' },
  adler:   { name: 'Raiden-Gunship', cat: 'air', move: 7, mt: 'air', sight: 3, armor: 'air', weapon: 'gunship', cost: 1400, prereq: ['horst', 'ausguck'], tough: 0.8, faction: 'vareth',
             desc: 'Schwerer Kampf-Schweber des Kashiro-Konzerns: Raketenkanonen mit Reichweite 1–2 gegen Boden und Luft, keine Munitionsgrenze, gepanzert (80 % Schaden).' },
  brenner: { name: 'Inferno', cat: 'veh', move: 4, mt: 'track', sight: 2, armor: 'heavy', weapon: 'flame', cost: 1000, prereq: ['fabrik'], vib: 2, faction: 'kordan',
             desc: 'Flammenpanzer von Valkor Defense: verheerend gegen Infanterie und Gebäude, Flammen durchdringen Schilde. Nur Nahbereich.' },
  schatten: { name: 'Phantom', ram: 4, ramRegen: 1, hacks: ['optik', 'absturz'], cat: 'inf', move: 4, mt: 'foot', sight: 3, armor: 'inf', weapon: 'crys', cost: 600, prereq: ['kaserne'], vib: 0.3, stealth: 'always', elite: 0.85, faction: 'ossar',
             desc: 'Attentäter von Netzschatten: dauerhaft optisch getarnt, Monoklinge gegen Infanterie, erleidet nur 85 % Schaden. Kleines Deck (RAM 4): Optik-Reset und Systemabsturz.' },
  soeldner: { name: 'Fixer-Söldner', cat: 'drop', move: 3, mt: 'foot', sight: 2, armor: 'inf', weapon: 'gauss', cost: 0, vib: 1,
             desc: 'Elite-Söldner, nur über das Fixer-Büro. Railguns treffen auch Schweber.' },
  legionaer: { name: 'Schwarzer Trupp', cat: 'drop', move: 3, mt: 'foot', sight: 2, armor: 'inf', weapon: 'gauss', cost: 0, vib: 1, tough: 0.55,
             desc: 'Gefürchtete Spezialeinheit, nur als Entscheidungsschlag. Nimmt kaum Schaden, Railguns treffen auch Schweber.' },
  traeger: { name: 'Träger-Schweber', cat: 'air', move: 8, mt: 'air', sight: 2, armor: 'air', cost: 650, prereq: ['horst'], carrier: true,
             desc: 'Lastschweber für Bodeneinheiten. Im Auto-Modus holt er Sammler von weit entfernten Feldern, bringt sie zur Schmelze und rettet sie vor Psychos.' },
  trauma:  { name: 'Trauma-Team', cat: 'air', move: 8, mt: 'air', sight: 3, armor: 'air', weapon: 'tmg', cost: 1300, prereq: ['horst', 'ausguck'], tough: 0.75, medic: 25,
             desc: 'Gepanzerter Rettungsschweber mit Bordschützen. Versorgt zu Beginn jeder eigenen Runde alle eigenen Einheiten auf und neben seinem Feld (+25), auch sich selbst. Erleidet nur 75 % Schaden.' },
};

// Etwas weitere Sicht für alle Einheiten
for (const u of Object.values(UNITS)) u.sight = (u.sight || 1) + 1;

export const BUILDINGS = {
  bauhof:     { name: 'Kommandoblock', hp: 300, power: 10, cost: 3000, turns: 0, sight: 3, buildable: false,
                desc: 'Herz der Basis. Errichtet ein Gebäude pro Runde und bringt 150 Credits Grundeinkommen.' },
  windfalle:  { name: 'Stromzelle', cat: 'bld', hp: 150, power: 100, cost: 300, turns: 1, sight: 2, prereq: ['bauhof'],
                desc: 'Kompakter Fusionsblock, zapft nebenbei das Stadtnetz an.' },
  raffinerie: { name: 'Schmelze', cat: 'bld', hp: 220, power: -30, cost: 1400, turns: 2, sight: 2, prereq: ['windfalle'], freeUnit: ['ernter', 'traeger'],
                desc: 'Sammler laden hier ab, Chrom wird zu Credits. Kommt mit einem Sammler und einem Träger-Schweber, der die Sammler zwischen Feld und Schmelze fliegt. Credits gibt es erst, wenn ein Sammler hier abgeladen hat. Die Wachdrohnen der Basis halten Psychos auf 2 Felder Abstand.' },
  kaserne:    { name: 'Kaserne', cat: 'bld', hp: 180, power: -20, cost: 300, turns: 1, sight: 2, prereq: ['windfalle'], produces: 'inf',
                desc: 'Heuert eine Infanterieeinheit pro Runde an.' },
  fabrik:     { name: 'Fahrzeughalle', cat: 'bld', hp: 260, power: -30, cost: 1500, turns: 2, sight: 2, prereq: ['raffinerie'], produces: 'veh',
                desc: 'Baut ein Fahrzeug pro Runde.' },
  ausguck:    { name: 'Kameraturm', cat: 'bld', hp: 180, power: -40, cost: 700, turns: 1, sight: 6, prereq: ['raffinerie'], radar: true,
                desc: 'Weite Sicht über das Kameranetz. Zeigt Psycho-Signale im Umkreis von 9 Feldern.' },
  horst:      { name: 'Schweber-Hangar', cat: 'bld', hp: 220, power: -40, cost: 1000, turns: 2, sight: 2, prereq: ['raffinerie'], produces: 'air',
                desc: 'Baut Schweber und munitioniert Kampf-Schweber auf.' },
  kontor:     { name: 'Fixer-Büro', cat: 'bld', hp: 220, power: -40, cost: 1200, turns: 2, sight: 2, prereq: ['ausguck'],
                desc: 'Draht zur Fixerin Vex: AV-Drops auf jedes bekannte Feld. Ein Drop alle 2 Runden.' },
  konvent:    { name: 'Netzknoten', cat: 'bld', hp: 180, power: -30, cost: 1000, turns: 2, sight: 3, prereq: ['kaserne', 'raffinerie'], produces: 'sis',
                desc: 'Serverraum des Netrunner-Kollektivs: alle 3 Runden eine Hackkarte, bildet Netrunnerinnen und Infiltratoren aus.' },
  felsenhort: { name: 'Schlund', cat: 'bld', hp: 200, power: 0, cost: 900, turns: 2, sight: 3, prereq: ['raffinerie'], produces: 'sv',
                desc: 'Unterschlupf der Chromfresser in einer alten Fabrik: bildet Chromschläger, Mantis-Rotten und Psycho-Prediger aus. Braucht keine Energie.' },
  turm:       { name: 'Wachgeschütz', cat: 'def', hp: 200, power: -15, cost: 500, turns: 1, sight: 3, prereq: ['kaserne'], weapon: 'turretGun',
                desc: 'Bodenabwehr, Reichweite 2. Feuert automatisch am Rundenende.' },
  flak:       { name: 'Luftabwehr', cat: 'def', hp: 160, power: -20, cost: 600, turns: 1, sight: 3, prereq: ['ausguck'], weapon: 'flak',
                desc: 'Flugabwehr, Reichweite 3. Feuert automatisch am Rundenende.' },
};

// Schlüsselorte auf der Karte: einnehmen, indem eine eigene Bodeneinheit zu Beginn des eigenen Zuges darauf steht
export const POIS = {
  zisterne:   { name: 'Schwarzmarkt', icon: '💰', text: '+120 Credits pro Runde. Wer den Markt hält, verdient an jedem Deal mit.' },
  warte:      { name: 'Funkmast', icon: '📡', text: '+40 Credits pro Runde und große Sicht (5 Felder) rund um den Mast.' },
  schmuggler: { name: 'Schmugglertunnel', icon: '📦', text: 'AV-Drops 25 % günstiger und alle drei Runden eine Hackkarte.' },
  zugang:     { name: 'Zugangspunkt', icon: '⌁', text: 'Offener Netzanschluss: Netrunner in bis zu 2 Feldern Entfernung sind eingeklinkt und hacken mit Reichweite 6. Dazu 3 Felder Sicht und +30 Credits pro Runde.' },
  heiligtum:  { name: 'Trauma-Team-Posten', icon: '✚', text: 'Eigene Einheiten auf und neben dem Posten werden um 15 pro Runde versorgt. Wer darauf steht, erhält 25 % Deckung.' },
};

export const WORM_SIZES = {
  1: { name: 'Cyberpsycho', steps: 3, sated: 3, weight: 60, scale: 1 },
  2: { name: 'Psycho-Rotte', steps: 4, sated: 3, weight: 30, scale: 1.4 },
  3: { name: 'Amok-Mech', steps: 5, sated: 4, weight: 10, scale: 1.9 },
};

export const DIFFICULTY = {
  leicht: { name: 'Leicht', aiBonus: 0.8, wave: 4, firstAttack: 9 },
  normal: { name: 'Normal', aiBonus: 1.0, wave: 5, firstAttack: 7 },
  schwer: { name: 'Schwer', aiBonus: 1.3, wave: 6, firstAttack: 5 },
};

export const START_CREDITS = 2500;

export const DROPS = {
  trupp:  { name: 'Söldnertrupp', units: ['inf', 'inf', 'rak'], cost: 650, desc: '2 Söldnertrupps und ein Raketentrupp.' },
  elite:  { name: 'Fixer-Söldner', units: ['soeldner', 'soeldner'], cost: 1100, desc: 'Zwei Trupps Elite-Söldner mit Railguns.' },
  panzer: { name: 'Panzerlieferung', units: ['panzer'], cost: 1250, desc: 'Ein Schwebepanzer, direkt an die Front.' },
  garde:  { name: 'Bollwerk-Kommando', units: ['schild', 'schild', 'scharf'], cost: 1300, desc: 'Zwei Bollwerk-Garden und ein Scharfschütze.' },
  trauma: { name: 'Trauma-Team-Einsatz', units: ['trauma'], cost: 1200, desc: 'Ein Trauma-Team-Schweber mit Platin-Vertrag, versorgt jede Runde die eigenen Einheiten um sich.' },
  ernter: { name: 'Sammler-Lieferung', units: ['ernter'], cost: 1300, desc: 'Ein Sammler, abgesetzt direkt an einem Chromfeld.' },
};

// Endgame: je Fraktion ein entscheidender Schlag für sehr viel Glut, damit Partien zu einem Ende kommen
export const ENDGAME = {
  ossar:    { name: 'Schwarzer Trupp', ship: 'Schwerlast-AV', cost: 8000, units: ['legionaer', 'legionaer', 'legionaer', 'legionaer', 'legionaer', 'legionaer'],
              desc: 'Ein Schwerlast-AV setzt sechs Schwarze Trupps ab: fast unverwundbare Spezialeinheiten, die niemand angeheuert haben will.' },
  vareth:   { name: 'Kashiro-Luftflotte', ship: 'Flottenträger', cost: 8000, units: ['adler', 'adler', 'falke', 'falke', 'bomber', 'bomber'],
              desc: 'Ein Kashiro-Flottenträger öffnet seine Hangars über dem Ziel: zwei Raiden-Gunships, zwei Kampf-Schweber und zwei Bomber.' },
  kordan:   { name: 'Stählerne Landung', ship: 'Schwerlastlander', cost: 8000, units: ['koloss', 'koloss', 'laserpanzer', 'laserpanzer', 'panzer'],
              desc: 'Ein Valkor-Schwerlastlander setzt ein Panzerbataillon ab: zwei Belagerungsmechs, zwei Laserpanzer und ein Schwebepanzer.' },
  sandvolk: { name: 'Großer Amoklauf', ship: null, cost: 8000, units: ['wurmreiter', 'todes', 'todes', 'duenen', 'duenen', 'duenen'],
              desc: 'Ein Amok-Mech bricht am Ziel durch den Asphalt und zerlegt feindliche Einheiten auf der Straße. In seinem Schatten kommt ein Chromfresser-Heer.' },
};
export const ENDGAME_ROUND = 8;

export const ORBITAL_STRIKE = { cost: 2500, cooldown: 6, radius: 1, unitDmg: 65, bldDmg: 0.45 };
export const SHIELD_PIERCE = ['blade', 'crys', 'artillery', 'bomb', 'siege', 'flak', 'laser', 'flame'];

export const CARDS = {
  stimme:    { name: 'Systemabsturz', target: 'enemyUnit', weight: 3, desc: 'Eine sichtbare feindliche Einheit kann in ihrer nächsten Runde nicht handeln.' },
  vorahnung: { name: 'Netz-Scan', target: 'none', weight: 2, desc: 'Deckt für den Rest dieser Runde die ganze Karte über alle Kameras auf.' },
  wetter:    { name: 'Lüftungshack', target: 'stormHex', weight: 2, desc: 'Lenkt den Smog über die Abluftanlagen: Wählt sein nächstes Ziel, bis zu 4 Felder vom vorhergesagten entfernt.' },
  klopfer:   { name: 'Lockruf', target: 'sandHex', weight: 3, desc: 'Ein Störsignal auf der Straße. In der Weltphase kommen alle Psychos im Umkreis von 12 Feldern dorthin und zerlegen, was im Umkreis von 1 Feld steht.' },
  verrat:    { name: 'Überläufer', target: 'enemyInf', weight: 2, desc: 'Eine sichtbare feindliche Infanterie-Einheit wechselt für ein besseres Angebot die Seite.' },
  schild:    { name: 'Panzerungs-Boost', target: 'own', weight: 3, desc: 'Eine eigene Einheit oder ein Gebäude erleidet 2 Runden lang nur halben Schaden.' },
  sabotage:  { name: 'Kurzschluss', target: 'enemyBld', weight: 2, desc: 'Ein bekanntes feindliches Gebäude fällt eine Runde lang aus: keine Produktion, kein Strom, keine Abwehr.' },
  gilde:     { name: 'Fixer-Gefallen', target: 'none', weight: 1, desc: 'Der nächste AV-Drop kostet nichts.' },
};

// ---------- Netrunning ----------
export const HACKS = {
  absturz:     { name: 'Systemabsturz', ram: 4, target: 'unit', desc: 'Eine feindliche Einheit fällt aus und kann in ihrer nächsten Runde nicht handeln.' },
  kurzschluss: { name: 'Kurzschluss', ram: 3, target: 'unit', dmg: 32, desc: '32 Schaden, ignoriert Panzerung, Schilde und Deckung. Gegen Fahrzeuge und Schweber 50 % mehr.' },
  optik:       { name: 'Optik-Reset', ram: 2, target: 'unit', desc: 'Das Ziel ist geblendet: Bis zum Ende seiner nächsten Runde richtet es nur 60 % Schaden an und schießt nicht zurück.' },
  psychose:    { name: 'Cyberpsychose', ram: 6, target: 'inf', desc: 'Feindliche Infanterie dreht durch und greift sofort die nächste Einheit in Reichweite an, egal wessen. Danach ist sie eine Runde gelähmt.' },
  kapern:      { name: 'Geschütz kapern', ram: 5, target: 'turret', desc: 'Ein feindliches Wachgeschütz oder eine Luftabwehr feuert 2 Runden lang für euch.' },
  kamera:      { name: 'Kamera anzapfen', ram: 2, target: 'bld', desc: 'Zapft die Kameras eines feindlichen Gebäudes an: 3 Runden lang seht ihr alles im Umkreis von 4 Feldern.' },
};
export const HACK_RANGE = 3, HACK_RANGE_LINKED = 6, ICE_COST = 2;

// ---------- Fahndung (NCPD) ----------
export const HEAT = {
  kill: 0.5,        // Abschuss auf Straße oder Trümmern
  building: 0.5,    // Gebäude zerstört
  strike: 1.5,      // Satellitenschlag angefordert
  hackKill: 0.25,
  decay: 0.5,       // Abbau pro eigener Runde
  scan: 2,          // ab hier: Tarnung wirkungslos
  drone: 3,         // ab hier: NCPD-Drohnen beschießen Einheiten auf der Straße
  droneDmg: 15,
  maxtac: 4.5,      // ab hier: MaxTac-Zugriff angekündigt
  maxtacDmg: 60, maxtacBld: 0.2,
  bribeCost: 500, bribe: 2,
};
