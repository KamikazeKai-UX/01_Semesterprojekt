<?php
// =============================================
// api-proxy.php – Server-seitiger API-Proxy
// =============================================
//
// WARUM BRAUCHEN WIR DIESEN PROXY?
// ---------------------------------
// Das JavaScript im Browser darf aus Sicherheitsgründen keine
// direkte Anfragen an externe APIs stellen (CORS-Blockade).
// football-data.org lässt nur Anfragen von "http://localhost"
// zu – kein Port, kein Live Server, kein Hostpoint.
//
// LÖSUNG: Der Browser fragt NICHT die API direkt an,
// sondern fragt unseren eigenen Server (diese PHP-Datei).
// Dieser Server leitet die Anfrage dann weiter:
//
//   Browser  →  api-proxy.php  →  football-data.org API
//      ↑                                   ↓
//      └──────────── JSON-Antwort ──────────┘
//
// WIE WIRD ES AUFGERUFEN?
// -----------------------
// JavaScript ruft auf:  api-proxy.php?endpoint=competitions/BL1/standings
// Diese Datei baut:     https://api.football-data.org/v4/competitions/BL1/standings
// und hängt den API-Key als Header dran (den nur der Server kennt).
// =============================================


// --- SCHRITT 1: API-Key laden ---
// config.php definiert die Konstante API_KEY mit dem geheimen Token.
// require_once = "lade diese Datei, aber nur einmal" (vermeidet Doppel-Includes)
require_once 'config.php';


// --- SCHRITT 2: CORS-Header setzen ---
// Diese Header erlauben dem Browser, die Antwort zu lesen.
// Ohne diese Header würde der Browser die Antwort blockieren ("CORS-Error").
// '*' bedeutet: jede Herkunft darf anfragen (lokal + Hostpoint)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Content-Type: application/json; charset=utf-8');


// --- SCHRITT 3: OPTIONS-Preflight beantworten ---
// Browser schicken manchmal zuerst eine "OPTIONS"-Anfrage, um zu fragen:
// "Darf ich hier überhaupt anfragen?" – wir antworten mit "Ja" und sind fertig.
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}


// --- SCHRITT 4: Endpoint aus der URL lesen ---
// Der Browser schickt den gewünschten API-Pfad als URL-Parameter:
//   api-proxy.php?endpoint=competitions/BL1/standings
// $_GET['endpoint'] liest genau diesen Wert aus.
// ?? '' bedeutet: falls der Parameter fehlt, nimm einen leeren String.
$endpoint = $_GET['endpoint'] ?? '';


// --- SCHRITT 5: Sicherheitsprüfung – Endpoint vorhanden? ---
// Ohne Endpoint können wir keine sinnvolle API-Anfrage stellen.
// Wir geben einen 400-Fehler zurück (= "schlechte Anfrage").
if (empty($endpoint)) {
    http_response_code(400);
    echo json_encode(['error' => 'Parameter "endpoint" fehlt in der URL']);
    exit;
}


// --- SCHRITT 6: Sicherheitsprüfung – nur erlaubte Zeichen ---
// Wir prüfen den Endpoint mit einem regulären Ausdruck (Regex).
// Erlaubt: Buchstaben, Zahlen, /, -, _
// Verboten: alles andere (z.B. "../config.php" oder Shell-Befehle)
// Das verhindert, dass jemand böswillig andere Dateien auslesen kann.
if (!preg_match('/^[a-zA-Z0-9\/\-_]+$/', $endpoint)) {
    http_response_code(400);
    echo json_encode(['error' => 'Ungültige Zeichen im Endpoint']);
    exit;
}


// --- SCHRITT 7: API-URL zusammenbauen ---
// Wir hängen den Endpoint an die Basis-URL der football-data.org API.
// Beispiel: "competitions/BL1/standings"
// → wird zu: "https://api.football-data.org/v4/competitions/BL1/standings"
$apiUrl = 'https://api.football-data.org/v4/' . $endpoint;


// --- SCHRITT 8: HTTP-Anfrage mit cURL senden ---
// cURL = "Client URL" – eine PHP-Bibliothek für HTTP-Anfragen.
// Ähnlich wie fetch() in JavaScript, aber serverseitig.
//
// curl_init()     → Neue Anfrage starten
// CURLOPT_RETURNTRANSFER → Antwort als String zurückgeben (nicht direkt ausgeben)
// CURLOPT_HTTPHEADER     → Den geheimen API-Key im Header mitschicken
// CURLOPT_TIMEOUT        → Maximal 10 Sekunden warten
$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-Auth-Token: ' . API_KEY   // API_KEY kommt aus config.php
]);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

// Anfrage tatsächlich ausführen und Antwort + Statuscode abholen
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);  // z.B. 200, 404, 429
$curlError = curl_error($ch);                        // Netzwerkfehler-Text (falls vorhanden)
curl_close($ch);                                     // Verbindung sauber schliessen


// --- SCHRITT 9: Netzwerkfehler abfangen ---
// curl_exec() gibt false zurück, wenn die Anfrage technisch scheitert
// (z.B. kein Internet, DNS nicht auflösbar).
// In diesem Fall schicken wir einen 500-Fehler zurück.
if ($response === false) {
    http_response_code(500);
    echo json_encode([
        'error'   => 'cURL-Fehler beim API-Aufruf',
        'details' => $curlError
    ]);
    exit;
}


// --- SCHRITT 10: Antwort weiterleiten ---
// Wir leiten die originale Antwort der API 1:1 an den Browser weiter:
// - Den HTTP-Statuscode (200 = OK, 429 = Rate Limit, etc.)
// - Den JSON-Body (Tabellendaten, Teaminfos, etc.)
// Der Browser (main.js) denkt, er hat direkt mit der API gesprochen.
http_response_code($httpCode);
echo $response;
