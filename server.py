#!/usr/bin/env python3
# =============================================
# server.py – Lokaler Entwicklungsserver
# =============================================
#
# WOZU BRAUCHEN WIR DAS?
# ----------------------
# Der VS Code Live Server funktioniert für dieses Projekt NICHT.
# Grund: football-data.org erlaubt CORS nur von "http://localhost"
# (ohne Port). Live Server läuft auf Port 5500/5501 – das wird geblockt.
#
# Dieser Python-Server macht zwei Dinge:
#   1. Statische Dateien ausliefern (index.html, CSS, JS, Bilder)
#   2. Anfragen an "api-proxy.php" abfangen und die echte API aufrufen
#      (weil PHP lokal nicht verfügbar ist)
#
# STARTEN:
#   cd 01_Semesterprojekt
#   python3 server.py
# Dann im Browser öffnen: http://localhost:8000
#
# Python ist auf jedem Mac vorinstalliert – nichts installieren nötig!
# =============================================

import http.server      # Eingebauter Python-Webserver
import urllib.request   # Für HTTP-Anfragen an die externe API
import urllib.parse     # Zum Parsen von URL-Parametern
import re               # Reguläre Ausdrücke (für API-Key auslesen)
import os               # Dateipfade
import sys              # Programm beenden


# =============================================
# SCHRITT 1: API-Key aus config.php lesen
# =============================================
# Da wir kein PHP haben, lesen wir die PHP-Datei als Text
# und suchen mit einem Regex nach dem API-Key-Wert.
# Regex: Suche nach define('API_KEY', '...') und extrahiere die '...'

def read_api_key():
    """Liest den API-Key aus der config.php mit einem regulären Ausdruck."""
    config_path = os.path.join(os.path.dirname(__file__), 'config.php')

    try:
        with open(config_path, 'r') as f:
            content = f.read()

        # Suche nach: define('API_KEY', 'WERT') oder define("API_KEY", "WERT")
        match = re.search(r"define\(\s*['\"]API_KEY['\"]\s*,\s*['\"]([^'\"]+)['\"]\s*\)", content)

        if match:
            return match.group(1)   # Gibt nur den Key-Wert zurück, z.B. "83e16c74..."
        else:
            print("FEHLER: API_KEY nicht in config.php gefunden!")
            sys.exit(1)

    except FileNotFoundError:
        print("FEHLER: config.php nicht gefunden!")
        print("Erstelle die Datei mit: define('API_KEY', 'dein-key-hier');")
        sys.exit(1)


# API-Key beim Start des Servers einmal laden
API_KEY = read_api_key()
print(f"✅ API-Key geladen: {API_KEY[:8]}...")   # Nur die ersten 8 Zeichen anzeigen (Sicherheit)


# =============================================
# SCHRITT 2: Request-Handler definieren
# =============================================
# Der Handler entscheidet für jede eingehende Anfrage, was zu tun ist:
# - Anfragen an /api-proxy.php → weiterleiten an football-data.org
# - Alle anderen Anfragen → statische Datei ausliefern (normal)

class KickQuizHandler(http.server.SimpleHTTPRequestHandler):

    def do_GET(self):
        """Wird für jede GET-Anfrage aufgerufen."""

        # --- API-Proxy: Anfrage abfangen ---
        # Prüfen, ob die URL mit "/api-proxy.php" beginnt
        if self.path.startswith('/api-proxy.php'):
            self.handle_api_proxy()
        else:
            # Normale Datei ausliefern (HTML, CSS, JS, Bilder etc.)
            super().do_GET()


    def handle_api_proxy(self):
        """
        Leitet API-Anfragen an football-data.org weiter.

        Ablauf:
        1. URL-Parameter 'endpoint' auslesen (z.B. "competitions/BL1/standings")
        2. Vollständige API-URL zusammenbauen
        3. Anfrage mit API-Key-Header absenden
        4. Antwort an den Browser zurückschicken
        """

        # URL-Parameter parsen: /api-proxy.php?endpoint=competitions/BL1/standings
        parsed = urllib.parse.urlparse(self.path)
        params = urllib.parse.parse_qs(parsed.query)

        # 'endpoint' Parameter auslesen
        # parse_qs gibt Listen zurück, deshalb [0] für den ersten Wert
        endpoint = params.get('endpoint', [''])[0]

        # Sicherheitscheck: Endpoint darf nicht leer sein
        if not endpoint:
            self.send_response(400)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(b'{"error": "Parameter endpoint fehlt"}')
            return

        # Vollständige API-URL zusammenbauen
        api_url = f'https://api.football-data.org/v4/{endpoint}'
        print(f"   → API-Anfrage: {api_url}")

        try:
            # HTTP-Anfrage mit API-Key im Header
            req = urllib.request.Request(
                api_url,
                headers={'X-Auth-Token': API_KEY}
            )

            # Anfrage ausführen (bis 15 Sekunden warten)
            with urllib.request.urlopen(req, timeout=15) as response:
                status  = response.getcode()    # HTTP-Statuscode (200, 429, etc.)
                body    = response.read()       # JSON-Antwort als Bytes

                print(f"   ← Status: {status}, {len(body)} Bytes")

                # Antwort an Browser weiterleiten
                self.send_response(status)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')   # CORS erlauben
                self.end_headers()
                self.wfile.write(body)

        except urllib.error.HTTPError as e:
            # HTTP-Fehler von der API (z.B. 429 = Rate Limit, 403 = Kein Zugriff)
            print(f"   ✗ HTTP-Fehler: {e.code} {e.reason}")
            body = e.read()
            self.send_response(e.code)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(body)

        except Exception as e:
            # Netzwerkfehler oder sonstige Fehler
            print(f"   ✗ Fehler: {e}")
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(f'{{"error": "{str(e)}"}}'.encode())


    def log_message(self, format, *args):
        """Überschreibt die Standard-Log-Ausgabe für übersichtlicheres Logging."""
        # Statische Assets (Fonts, Icons) nicht loggen – zu viel Lärm
        path = args[0] if args else ''
        if any(ext in path for ext in ['.ttf', '.png', '.ico']):
            return
        print(f"[Server] {path}")


# =============================================
# SCHRITT 3: Server starten
# =============================================
# Der Server läuft auf Port 8000 und bedient Dateien
# aus dem Ordner, von dem aus server.py gestartet wurde.

PORT = 8000

print(f"\n⚽ KickQuiz Dev-Server startet...")
print(f"📁 Ordner: {os.getcwd()}")
print(f"🌐 Adresse: http://localhost:{PORT}")
print(f"🔑 API-Key: aktiv")
print(f"\nMit Ctrl+C stoppen\n")

# http.server.test() startet den Server und hält ihn am Laufen
# HandlerClass = unser eigener Handler (mit API-Proxy-Logik)
# port = 8000
http.server.test(
    HandlerClass=KickQuizHandler,
    port=PORT,
    bind='localhost'    # Nur lokal erreichbar (nicht im Netzwerk)
)
