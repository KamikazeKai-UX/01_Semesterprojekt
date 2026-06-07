# KickQuiz ⚽

![Static Badge](https://img.shields.io/badge/Sprache-JavaScript_ES2020-%23f7df1e)
![Static Badge](https://img.shields.io/badge/Kurs-MMP_IM2-blue)
![Static Badge](https://img.shields.io/badge/Semester-FS26-coral)
![Static Badge](https://img.shields.io/badge/Status-Abgabe_bereit-1f883d)

Interaktives Fussball-Quiz, bei dem du 6 Kategorien auf 6 Teams verteilst und versuchst, möglichst viele Punkte zu sammeln. Inspiriert vom Flaggen-Ranking-Prinzip.

---

## Projektbeschreibung

Du siehst 6 Fussballteams und 6 Statistik-Kategorien (z.B. „Meistertitel", „Marktwert", „Tore"). Deine Aufgabe: Ordne jeder Kategorie genau das Team zu, das darin am besten abschneidet. Je näher du an der optimalen Zuordnung bist, desto mehr Punkte erhältst du.

Nach dem Spiel wird deine Route mit der **idealen Route** verglichen — berechnet durch einen Backtracking-Algorithmus (6! = 720 Permutationen), der die maximale Punktzahl ermittelt.

### Spielprinzip

1. **Modus wählen**: Liga Edition oder WM Alltime Edition
2. **Liga wählen** (nur Liga Edition): Premier League, Bundesliga, Serie A oder La Liga
3. **Quiz**: 6 Runden — in jeder Runde siehst du ein Team und wählst die passende Kategorie
4. **Punkte**: Relative Bewertung — das beste Team einer Kategorie bekommt immer 30 Punkte, das schlechteste 5 Punkte
5. **Ergebnis**: Vergleich deiner Route mit der optimalen Route

---

## Features

- **Liga Edition** — Live-Daten aus 4 Ligen via football-data.org API
  - 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League
  - 🇩🇪 Bundesliga
  - 🇮🇹 Serie A
  - 🇪🇸 La Liga
- **WM Alltime Edition** — Aggregierte Allzeit-Statistiken aus allen 22 WM-Turnieren (1930–2022)
- **Relatives Punktesystem** — Beste Wahl = immer 30 Punkte, unabhängig von der Teamgrösse
- **Ideale Route** — Backtracking-Algorithmus berechnet vorab die global beste Zuteilung
- **Lösungsvergleich** — Slider-Ansicht nach Spielende: deine Route vs. ideale Route
- **Lottie Intro-Animation** — Ladescreen mit dotlottie-wc Web Component
- **Highscore** — Bestpunktzahl pro Modus in `localStorage` gespeichert
- **Responsive** — Optimiert für Mobile und Desktop

---

## Tech Stack

| Technologie | Einsatz |
|---|---|
| **Vanilla JS ES2020** | Gesamte Spiellogik, `type="module"`, `async/await` |
| **HTML5 / CSS3** | Markup, Flexbox-Layouts, CSS-Transitions |
| **PHP-Proxy** (`api-proxy.php`) | CORS-Umgehung für football-data.org |
| **football-data.org API v4** | Ligatabellen, Spielergebnisse (Liga Edition) |
| **openfootball/worldcup.json** | WM-Matchdaten 1930–2022 via GitHub Raw (WM Edition) |
| **@lottiefiles/dotlottie-wc** | `.lottie`-Animations-Web-Component (Ladescreen) |
| **Google Fonts** | Roboto Slab |
| **localStorage** | Highscore-Persistenz pro Spielmodus |

---

## APIs

### football-data.org v4
- **Dokumentation:** https://www.football-data.org/documentation/quickstart
- **Endpunkte genutzt:**
  - `GET /v4/competitions/{leagueId}/standings` — Ligatabelle mit Punkten, Toren, etc.
  - `GET /v4/competitions/{leagueId}/matches` — Spielergebnisse der Saison
- **Auth:** API-Key via `X-Auth-Token`-Header (serverseitig via `config.php`, nie clientseitig)
- **CORS:** Requests gehen über `api-proxy.php` (PHP leitet weiter, fügt Header ein)

### openfootball/worldcup.json
- **Repo:** https://github.com/openfootball/worldcup.json
- **Kein API-Key nötig**, direkt abrufbar via GitHub Raw URLs
- **22 Turnier-JSONs** werden parallel via `Promise.all()` geladen
- **Verarbeitung:** Ergebnisse werden aggregiert zu Alltime-Statistiken pro Nation (Siege, Tore, Unentschieden etc.)
- **Robustheit:** Null-Checks für fehlende Spielstände (`match.score`, `match.score.ft`), Normalisierung historischer Teamnamen (z.B. „West Germany" → „Germany")

---

## Projektstruktur

```
01_Semesterprojekt/
├── index.html              ← Alle 5 Screens (loading, mode, start, quiz, result)
├── css/
│   └── style.css           ← Gesamtes Styling inkl. Responsive + Lottie-Styles
├── js/
│   └── main.js             ← Gesamte Spiellogik (~860 Zeilen, 9 kommentierte Sektionen)
├── api-proxy.php           ← PHP-CORS-Proxy für football-data.org
├── config.php              ← API-Key (GITIGNORED — nie committen!)
├── server.py               ← Lokaler Dev-Server (Python)
├── assets/
│   └── animations/         ← Lottie-Animationen (aktuell via CDN geladen)
└── README.md               ← Diese Datei
```

### Aufbau `main.js` (9 Sektionen)

| Sektion | Inhalt |
|---|---|
| 1. Konfiguration | Konstanten, Kategorie-Definitionen, API-Endpoints |
| 2. State | `gameState`-Objekt, Reset-Funktionen |
| 3. API & Daten | `fetchLeagueData()`, `fetchWMData()`, `processWMData()` |
| 4. Ranking-Berechnung | `buildRankings()` für Liga- und WM-Kategorien |
| 5. Ideal-Route | `computeGlobalIdealRoute()` via Backtracking (6! Permutationen) |
| 6. Spielablauf | `startGame()`, `displayRound()`, `handleAnswer()`, `nextRound()` |
| 7. Punkte-Logik | `calculateRoundPoints()` — relatives Ranking unter 6 Optionen |
| 8. UI-Utilities | `showScreen()`, `setSubtitle()`, `shuffle()`, `renderProgressBar()` |
| 9. Result-Screen | `showResult()`, Slider-Vergleich, Highscore-Verwaltung |

---

## Lokal starten

### Voraussetzungen
- Python 3 (für lokalen Dev-Server)
- PHP-CLI (für den API-Proxy, oder ein lokaler Apache/MAMP)

### Setup

```bash
# 1. In den Projektordner wechseln
cd 01_Semesterprojekt

# 2. config.php anlegen (NICHT committen!)
# Inhalt: <?php define('API_KEY', 'dein-api-key-hier'); ?>

# 3. Dev-Server starten
python3 server.py

# 4. Browser öffnen
open http://localhost:8000
```

> **Hinweis:** Der PHP-Proxy (`api-proxy.php`) benötigt einen PHP-fähigen Server.  
> Mit `python3 server.py` läuft die WM Edition vollständig — die Liga Edition benötigt zusätzlich PHP.

---

## Punkte-System

Das Punktesystem ist **relativ** — es bewertet deine Wahl im Vergleich zu den anderen 5 Optionen dieser Runde, nicht anhand absoluter Weltrekorde.

| Rang unter den 6 Teams | Punkte |
|---|---|
| 1 (bestes Team in dieser Kategorie) | **30** |
| 2 | 25 |
| 3 | 20 |
| 4 | 15 |
| 5 | 10 |
| 6 (schwächstes Team) | 5 |

**Maximum pro Spiel: 180 Punkte** (6 Runden × 30 Punkte)

---

## Reflexion

### Was gut lief

- **Relatives Punktesystem** — Die ursprüngliche Idee, absolute Weltränge zu nutzen, hätte zu unfairem Gameplay geführt (kleines Team = nie Punkte). Das relative System macht jede Runde fair und spannend.
- **WM Alltime Edition** — Das parallele Laden von 22 Turnier-JSONs via `Promise.all()` funktioniert zuverlässig und schnell. Die Aggregation über alle Jahrzehnte (inkl. historischer Teamnamen) war eine schöne Herausforderung.
- **Backtracking-Algorithmus** — Die Ideal-Route via vollständiger Permutation (6! = 720) ist korrekt und performant genug für die Problemgrösse.
- **Stabiles Button-Layout** — Durch feste Reihenfolge (`gameState.gameCategories`) statt Per-Runden-Shuffle verschieben sich die Buttons nicht zwischen Runden.
- **Lottie-Integration** — `customElements.whenDefined('dotlottie-wc')` stellt sicher, dass die Animation sauber lädt, bevor der Screen wechselt.

### Was schwieriger war

- **CORS mit football-data.org** — Direkte Browser-Requests werden blockiert; PHP-Proxy war notwendig. Beim Deployment auf Hostpoint muss `config.php` manuell per SFTP hinterlegt werden.
- **Lottie Timing** — Der `complete`-Event des dotlottie-wc Web Component feuert 1–2 Sekunden nach dem sichtbaren Ende der Animation. Event-basierte Ansätze haben nicht zuverlässig funktioniert; fixe `setTimeout(2800ms)` ist die pragmatische Lösung.
- **Historische WM-Daten** — Teamnamen wie „West Germany", „Soviet Union" oder „Czechoslovakia" mussten normalisiert werden; ausserdem waren nicht alle Matches mit vollständigen Spielständen dokumentiert (Null-Check nötig).
- **JSHint ES5-Warnings** — Der Kurs-Validator war standardmässig auf ES5 eingestellt; Fix via `/* jshint esversion: 11 */` am Dateianfang.

---

## Autor

**Dario Hartmann**  
FHGR — Bachelor Multimedia Production  
Modul: Interaktive Medien 2 (IM2) — FS26
