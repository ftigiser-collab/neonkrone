# Neonkrone

Spin-off von [Sandthron](https://github.com/ftigiser-collab/sandthron): Rundenstrategie auf Hexfeldern im Cyberpunk-Setting, mit eigenen Fraktionen, Namen und Grafik. Läuft im Browser (PWA), am PC und auf dem Handy.

**Spielen:** https://ftigiser-collab.github.io/neonkrone/ (sobald GitHub Pages aktiv ist)

## Setting
Velvet Bay, eine Megastadt im Dauerregen. Konzerne und Gangs kämpfen zwischen Megablocks um Chrom (Schrott, Cyberware, Schwarzware).

| Sandthron | Neonkrone |
|---|---|
| Glut, Ernter, Raffinerie | Chrom, Sammler, Schmelze |
| Sand, Dünen, Fels, Gebirge | Straße, Trümmer, Beton, Megablock |
| Sandwürmer (3 Größen) | Cyberpsychos: Einzeltäter, Psycho-Rotte, Amok-Mech |
| Sandsturm | Smogfront |
| Thopter | Schweber (AVs) mit Mantelpropellern |
| Gilde, Orbital-Drops | Fixer-Büro, AV-Drops, Satellitenschlag |
| Konvent, Intrigenkarten | Netzknoten, Hackkarten (Quickhacks) |
| Felsenheiligtum | Trauma-Team-Posten |

**Fraktionen:** Kashiro-Konzern (Schweber, Raiden-Gunship), Valkor Defense (Fahrzeuge, Inferno), Netzschatten (Netrunner, Phantom), Chromfresser (Gang, Psycho-Prediger).

**Neu gegenüber Sandthron:** Trauma-Team-Schweber (Hangar oder AV-Drop), versorgt jede Runde alle eigenen Einheiten auf und neben seinem Feld.

## Stand: Stufe 1
- Komplettes Sandthron-Gerüst (Kampf, KI, Kampagne mit 5 Missionen, Karten, Drops, Endgame)
- Stadtkarte mit Straßenraster, Fahrbahnmarkierungen, Megablock-Dächern, Fassaden, Neonleuchtschicht, Regen, Pfützenspiegelung
- Schweber, Cyberpsychos, Störsender, Neon-Gebäudeschilder, neue Menü-Skyline

## Stufe 2: Eigene Mechaniken
- **Netrunning:** Netrunnerin, Netzläufer und Phantom mit Cyberdeck und RAM. Sechs Hacks: Systemabsturz, Kurzschluss, Optik-Reset, Cyberpsychose, Geschütz kapern, Kamera anzapfen. Reichweite 3, eingeklinkt 6; ICE um feindliche Netzknoten kostet +2 RAM.
- **Zugangspunkte:** 4 neue Schlüsselorte (NETZ) als Netzanschluss, Sicht und Einkommen.
- **Fahndung (NCPD):** Sterne durch Gewalt auf der Straße, Gebäudezerstörung und Satellitenschläge. Ab 2 keine Tarnung, ab 3 NCPD-Drohnen, ab 4,5 MaxTac-Zugriff mit Vorwarnung. Bestechung im Kommandoblock.
- **Neon-Symbole:** Einheiten als leuchtende Hologramm-Symbole in Teamfarbe (Form nach Gattung, Glyphe nach Typ, RAM-, Munitions- und Ladungsanzeige). Umschaltbar auf Modelle (◈).

## Geplant
- Eigene Gebäudegrafik im Cyberpunk-Stil, Bike und Mech neu, mehr Gang-Flair
- **Später:** Sound und Musik

## Technik
Reines HTML/JavaScript (ES-Module), Canvas 2D, keine Abhängigkeiten. Alle Grafiken entstehen per Code.
