# Sandthron

Rundenstrategie auf Hexfeldern, angelehnt an Dune 2000 und das Dune-Brettspiel, mit eigenen Fraktionen, Namen und Grafik. Läuft im Browser (PWA), am PC und auf dem Handy.

**Spielen:** https://ftigiser-collab.github.io/sandthron/ (sobald GitHub Pages aktiv ist)

## Stand: Stufe 1 (Prototyp)
- Prozedurale Hexkarte: Sand, Dünen, Fels, Gebirge, Glutfelder
- Basisbau über den Bauhof (ein Gebäude pro Runde), Energie-System
- 9 Gebäude, 9 Einheiten inklusive drei Thopter-Typen (Späher, Kampf mit Munition, Träger)
- Kampf mit Gegenschlag, Geländedeckung und Schadensvorschau
- Ernter-Kreislauf mit Auto-Ernte
- Weltphase: wandernder Sturm mit Vorhersage, Würmer jagen Erschütterungen, Glutausbrüche
- Gegner-KI mit Bauplan, Produktion, Sammeln, Angriffswellen, Verteidigung
- Nebel des Krieges, Minikarte, Hilfe-Seite

## Stufe 2
- Animationen: Zielen und Rückstoß, Trefferblitz, Wracks, Trümmer, Thopter-Absturz, Ausrücken, Entladestrom, Bau-Funken, Sturm-Blitze, Drop-Kapseln
- Tag-Nacht-Zyklus (nachts Bodensicht −1, Lichter)
- Gildenkontor mit Orbital-Drops (Söldnertrupp, Gilden-Söldner, Panzer, Ernter)
- Konvent mit 8 Intrigenkarten (Stimme, Vorahnung, Wetterkunde, Klopfer, Verrat, Schildwall, Sabotage, Gildenschuld) und der Verhüllten Schwester
- Bomber- und Abfang-Thopter
- Drei Fraktionen mit eigenem Bonus
- Autosave und Fortsetzen
- KI nutzt Karten, Drops und die neuen Einheiten

## Stufe 3 (in Arbeit)
- Kampagne „Der Sand von Askar“ mit 5 Missionen, Briefings, Zielen und Fortschritt
- Wurmgrößen, Sandgänger mit Klopfern, Balancing der Wirtschaft

## Geplant
- **Später:** Sound und Musik

## Technik
Reines HTML/JavaScript (ES-Module), Canvas 2D, keine Abhängigkeiten. Alle Grafiken entstehen per Code.
