# ⚽ KickQuiz

## Projektidee

KickQuiz ist ein interaktives Fussball-Quiz. Man sieht 6 Teams und muss 6 Statistik-Kategorien — zum Beispiel Meistertitel oder Tore pro Saison — den richtigen Teams zuordnen. Das Ziel ist es, möglichst viele Punkte zu sammeln, indem man die Kategorie wählt, in der das jeweilige Team am besten abschneidet. Am Ende wird die eigene Lösung mit der optimalen Antwort verglichen.

Das Projekt gibt es in zwei Varianten: einer **Liga Edition** mit Live-Daten aus vier europäischen Ligen — Premier League, Bundesliga, Serie A und La Liga — sowie einer **WM Edition** mit aggregierten Alltime-Statistiken aus allen 22 Weltmeisterschaften seit 1930.

## Spielprinzip

Pro Spiel gibt es 6 Runden. In jeder Runde wird ein Team angezeigt, und man wählt aus den verbleibenden Kategorien diejenige, in der dieses Team im Vergleich zu den anderen 5 Teams am besten dasteht. Die Kategorien werden dabei fest zugeteilt — jede Kategorie kann nur einmal vergeben werden.

Das Punktesystem ist relativ: Die beste Wahl unter den 6 Teams bringt immer 30 Punkte, die schlechteste 5 Punkte. So bleibt das Spiel fair, egal ob man gerade Real Madrid oder einen Underdog vor sich hat.

Nach dem Spiel sieht man, wie die eigene Route mit der idealen verglichen wird. Diese optimale Lösung wird vorab mit einem Backtracking-Algorithmus berechnet, der alle 720 möglichen Kombinationen durchprobiert und die punktemässig beste findet.

## Technologien

- HTML, CSS, JavaScript (ES2020)
- football-data.org API für die Ligadaten
- openfootball/worldcup.json für die WM-Daten
- PHP als Proxy für die API-Anfragen
- LottieFiles für die Ladeanimation
- localStorage für den Highscore
- Claude AI als grosse Unterstützung ;)

## Projektstruktur

```
01_Semesterprojekt/
├── index.html        ← Alle 5 Screens
├── css/style.css     ← Styling und Responsive Design
├── js/main.js        ← Gesamte Spiellogik
├── api-proxy.php     ← PHP-Proxy für die API
└── config.php        ← API-Key (nicht im Repository)
```

## Lokal starten

Für die lokale Entwicklung wird ein PHP-fähiger Server benötigt, da die API-Anfragen über einen PHP-Proxy laufen. Empfehlenswert ist MAMP — einfach den Projektordner als Root-Verzeichnis setzen und die Seite unter `http://localhost:8888` öffnen.

## Was uns beschäftigt hat

**CORS-Fehler bei der API**

Der erste grössere Stolperstein war der CORS-Fehler bei der football-data.org API. Direkte Anfragen aus dem Browser werden blockiert, weshalb wir die Anfragen über einen PHP-Proxy leiten mussten. Das bedeutete auch, dass wir nicht mehr einfach mit dem Live-Server arbeiten konnten, sondern immer einen lokalen PHP-Server brauchten.

**Punktesystem und Spielbalance**

Anfangs haben wir mit absoluten Welträngen gearbeitet, was schnell zu einem unausgewogenen Spiel geführt hat — kleine Teams konnten kaum Punkte einbringen, egal wie gut man spielte. Die Umstellung auf ein relatives Punktesystem, bei dem immer die beste verfügbare Wahl 30 Punkte bringt, hat das Spielgefühl deutlich verbessert.

**WM-Daten über alle Jahrzehnte**

Die WM Edition war aufwändiger als erwartet. Wir laden 22 separate JSON-Dateien parallel und aggregieren daraus Alltime-Statistiken pro Nation. Dabei mussten historische Teamnamen wie «West Germany» oder «Soviet Union» normalisiert und fehlende oder unvollständige Spielstände abgefangen werden.

**Lottie-Animation**

Beim Einbinden der Ladeanimation hat uns das Timing-Verhalten des dotlottie-wc Web Components überrascht. Der `complete`-Event feuert deutlich später als das Ende der Animation. Nach verschiedenen Ansätzen haben wir uns für eine fixe Wartezeit entschieden, was zuverlässig und vorhersehbar funktioniert.

**Buttons und Layout-Stabilität**

Ein kleineres aber störendes Problem war, dass sich die Antwort-Buttons nach jeder Runde neu angeordnet haben. Das war verwirrend, weil man sich die Positionen nicht merken konnte. Die Lösung war einfach: Die Reihenfolge wird einmal zu Spielbeginn festgelegt und bleibt über alle 6 Runden gleich.

## User Testing

Während der Entwicklung haben wir Personen aus dem Fussballteam von Dario das Spiel spielen lassen. Das Feedback war grundsätzlich positiv — das Spielprinzip wurde schnell verstanden und die zwei Editionen kamen gut an.

Der häufigste Kritikpunkt war das Punktesystem: Es war nicht sofort klar, wie die Punkte berechnet werden und warum man manchmal weniger Punkte bekommt als erwartet. Die Spieler hatten das Gefühl, eine gute Wahl getroffen zu haben, und waren am Schluss über das Resultat überrascht.

## Was gut funktioniert hat

Der Backtracking-Algorithmus für die ideale Route war eine der spannendsten Teile des Projekts. Es war cool zu sehen, wie der Algorithmus alle 720 Kombinationen durchrechnet und die beste Lösung findet — und das in einem Bruchteil einer Sekunde.

Auch die WM Edition mit `Promise.all()` über 22 Turnier-JSONs läuft überraschend schnell. Was nach viel Daten klingt, ist in der Praxis kaum spürbar.

## Fazit

KickQuiz war ein Projekt, das deutlich komplexer wurde als ursprünglich geplant — und genau das hat es interessant gemacht. Wir haben viel über API-Integration, Datenverarbeitung und Spielmechaniken gelernt und konnten dabei eigene Ideen vollständig selbst umsetzen.

## Autor

Dario Hartmann und Kai Dunker — FHGR MMP FS26
