# ⚽ KickQuiz

![Static Badge](https://img.shields.io/badge/Sprache-JavaScript-%23f7df1e)
![Static Badge](https://img.shields.io/badge/Kurs-MMP_IM2-blue)
![Static Badge](https://img.shields.io/badge/Semester-FS26-coral)
![Static Badge](https://img.shields.io/badge/Status-Abgabe_bereit-1f883d)

## Überblick

In diesem Projekt haben wir ein interaktives Fussball-Ranking-Quiz entwickelt. Der Spieler sieht 6 Fussballteams und 6 Statistik-Kategorien — zum Beispiel Meistertitel, Marktwert oder Tore pro Saison. Ziel ist es, jeder Kategorie das Team zuzuordnen, das darin am besten abschneidet. Je näher man an der optimalen Lösung ist, desto mehr Punkte erhält man.

Das Spiel bietet zwei Editionen: In der **Liga Edition** werden Live-Daten aus der Premier League, Bundesliga, Serie A und La Liga geladen. Die **WM Alltime Edition** basiert auf aggregierten Statistiken aus allen 22 Weltmeisterschaften von 1930 bis 2022.

Eine grosse Unterstützung war dabei die Arbeit mit KI-Tools. Wir haben uns intensiv mit Claude auseinandergesetzt und die KI als Hilfsmittel während des Projekts eingesetzt.

## Verwendete Technologien

- HTML
- CSS
- JavaScript (ES2020)
- LottieFiles
- API-Integration (football-data.org)
- PHP
- Claude AI

## Herausforderungen

**CORS-Fehler bei der API-Integration**

Zu Beginn hatten wir Probleme mit der API-Integration von football-data.org, da ein CORS-Fehler auftrat. Deshalb mussten wir die API-Anfragen über eine PHP-Datei (Proxy) einbinden. Dies bedeutete, dass wir die Seite nicht mehr direkt über den Live-Server testen konnten, sondern einen lokalen PHP-fähigen Server benötigten.

**WM-Daten über alle Jahrzehnte**

Eine weitere Herausforderung war das Laden und Verarbeiten der historischen WM-Daten. Wir haben 22 einzelne JSON-Dateien parallel geladen und zu Alltime-Statistiken aggregiert. Dabei mussten wir historische Teamnamen wie «West Germany» oder «Soviet Union» normalisieren und fehlende Spielstände abfangen.

**Punktesystem und Spielbalance**

Anfangs haben wir mit absoluten Welträngen gearbeitet, was dazu führte, dass kleinere Teams kaum Punkte einbringen konnten. Wir haben das System auf ein relatives Ranking umgestellt — die beste Wahl unter den 6 verfügbaren Teams bringt immer 30 Punkte, unabhängig davon wie gross oder bekannt das Team ist. Das hat das Spielgefühl deutlich verbessert.

**Lottie-Animation Timing**

Beim Einbinden der Lottie-Ladeanimation stellte sich heraus, dass der `complete`-Event des Web Components zu spät feuert. Nach verschiedenen Ansätzen haben wir uns für eine fixe Wartezeit von 2800ms entschieden, was zuverlässig funktioniert.

## Fazit

Das Projekt war eine kreative und lehrreiche Erfahrung. Wir konnten neue Technologien kennenlernen, eigenständig Probleme lösen und unsere Ideen praktisch umsetzen. Besonders spannend war die Arbeit mit externen APIs, dem Backtracking-Algorithmus für die ideale Route sowie der Integration von Lottie-Animationen.

## Autor

Dario Hartmann — FHGR MMP FS26
