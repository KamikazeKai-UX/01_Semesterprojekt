/* jshint esversion: 11 */
// =============================================
// main.js – KickQuiz: Fussball-Ranking-Quiz
// Autor: Dario Hartmann / IM2 Semesterprojekt
// =============================================
//
// SPIELMODI:
//   Liga Edition → Vereinsdaten über football-data.org (via PHP-Proxy)
//   WM Edition   → Nationaldaten über openfootball/worldcup.json (GitHub raw, kein Proxy)
//
// SPIELIDEE:
//   Der Spieler sieht ein Team und 6 Kategorien. Er wählt die, in der
//   das Team am besten abschneidet → sie wird dem Team zugewiesen.
//   6 Runden. Am Ende: Lösungsvergleich mit idealer Route.
//
// AUFBAU:
//   1. Spielzustand       5. Ranking & Hilfsfunktionen
//   2. Konstanten         6. DOM-Funktionen
//   3. API-Funktionen     7. Spielablauf
//   4. Daten aufbereiten  8. Event Listeners / 9. Init
// =============================================


// =============================================
// 1. SPIELZUSTAND
// =============================================
const gameState = {
    mode:                 null,  // 'liga' | 'wm'
    round:                0,
    totalRounds:          6,
    score:                0,
    teams:                [],
    usedTeams:            [],
    currentTeam:          null,
    gameCategories:       [],    // 6 zufällige Kategorien (für dieses Spiel)
    currentCategories:    [],    // Noch freie Kategorien dieser Runde
    selectedLeague:       null,
    categoryAssignments:  {},
    roundHistory:         []     // { team, pickedCategoryId, pickedRank, points }
};


// =============================================
// 2. KONSTANTEN & KONFIGURATION
// =============================================

const MAX_SCORE = 180;           // 6 × 30 Punkte
const API_BASE  = 'api-proxy.php?endpoint=';
const WM_DATA_BASE = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master/';
const WM_YEARS = [
    1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966,
    1970, 1974, 1978, 1982, 1986, 1990, 1994, 1998,
    2002, 2006, 2010, 2014, 2018, 2022
];

const LEAGUES = [
    { id: 'PL',  name: 'Premier League' },
    { id: 'BL1', name: 'Bundesliga'     },
    { id: 'SA',  name: 'Serie A'        },
    { id: 'PD',  name: 'La Liga'        }
];

// --- Liga-Kategorien (Vereins-Statistiken) ---
const LIGA_CATEGORIES = [
    { id: 'points',            label: 'Tabellenpunkte',       emoji: '🥇', betterWhen: 'high', get: t => t.points,          format: v => `${v} Punkte` },
    { id: 'goals_for',         label: 'Saisontore',           emoji: '⚽', betterWhen: 'high', get: t => t.goalsFor,        format: v => `${v} Tore` },
    { id: 'fewest_conceded',   label: 'Wenigste Gegentore',   emoji: '🧤', betterWhen: 'low',  get: t => t.goalsAgainst,    format: v => `${v} Gegentore` },
    { id: 'goal_difference',   label: 'Tordifferenz',         emoji: '📊', betterWhen: 'high', get: t => t.goalDifference,  format: v => `${v > 0 ? '+' : ''}${v}` },
    { id: 'wins',              label: 'Siege',                emoji: '✅', betterWhen: 'high', get: t => t.won,             format: v => `${v} Siege` },
    { id: 'fewest_losses',     label: 'Wenigste Niederlagen', emoji: '🚫', betterWhen: 'low',  get: t => t.lost,            format: v => `${v} Niederlagen` },
    { id: 'draws',             label: 'Unentschieden',        emoji: '🤝', betterWhen: 'high', get: t => t.draw,            format: v => `${v} Unentschieden` },
    { id: 'win_rate',          label: 'Siegquote',            emoji: '📈', betterWhen: 'high', get: t => t.winRate,         format: v => `${v} %` },
    { id: 'goals_per_game',    label: 'Tore pro Spiel',       emoji: '🎯', betterWhen: 'high', get: t => t.goalsPerGame,    format: v => `${v} Tore/Spiel` },
    { id: 'conceded_per_game', label: 'Gegentore/Spiel',      emoji: '🏃', betterWhen: 'low',  get: t => t.concededPerGame, format: v => `${v} Gegentore/Spiel` },
    { id: 'unbeaten_rate',     label: 'Unbesiegt-Quote',      emoji: '🛡️', betterWhen: 'high', get: t => t.unbeatenRate,    format: v => `${v} %` },
    { id: 'clean_sheets',      label: 'Zu-Null-Spiele',       emoji: '🔒', betterWhen: 'high', get: t => t.cleanSheets,     format: v => `${v} Mal` },
    { id: 'big_wins',          label: 'Hochsiege (3+)',       emoji: '💪', betterWhen: 'high', get: t => t.bigWins,         format: v => `${v} Siege` },
    { id: 'away_wins',         label: 'Auswärtssiege',        emoji: '✈️', betterWhen: 'high', get: t => t.awayWins,        format: v => `${v} Auswärtssiege` }
];

// --- WM-Kategorien (Turnier-Statistiken der Nationalmannschaften) ---
const WM_ROUND_LABELS = {
    10: 'Gruppenphase', 20: 'Achtelfinale', 30: 'Viertelfinale',
    40: 'Halbfinale', 50: '3. Platz', 60: 'Finale'
};

const WM_CATEGORIES = [
    { id: 'wm_goals_for',      label: 'Tore gesamt',          emoji: '⚽', betterWhen: 'high', get: t => t.goalsFor,           format: v => `${v} Tore` },
    { id: 'wm_goals_against',  label: 'Wenigste Gegentore',   emoji: '🧤', betterWhen: 'low',  get: t => t.goalsAgainst,       format: v => `${v} Gegentore` },
    { id: 'wm_goal_diff',      label: 'Tordifferenz',         emoji: '📊', betterWhen: 'high', get: t => t.goalDifference,     format: v => `${v > 0 ? '+' : ''}${v}` },
    { id: 'wm_wins',           label: 'Siege gesamt',         emoji: '✅', betterWhen: 'high', get: t => t.won,                format: v => `${v} Siege` },
    { id: 'wm_draws',          label: 'Unentschieden',        emoji: '🤝', betterWhen: 'high', get: t => t.drawn,              format: v => `${v} Unentschieden` },
    { id: 'wm_losses',         label: 'Wenigste Niederlagen', emoji: '🚫', betterWhen: 'low',  get: t => t.lost,               format: v => `${v} Niederlagen` },
    { id: 'wm_clean_sheets',   label: 'Zu-Null-Spiele',       emoji: '🔒', betterWhen: 'high', get: t => t.cleanSheets,        format: v => `${v} Mal` },
    { id: 'wm_big_wins',       label: 'Hochsiege (3+ Tore)',  emoji: '💪', betterWhen: 'high', get: t => t.bigWins,            format: v => `${v} Siege` },
    { id: 'wm_goals_per_game', label: 'Tore pro Spiel',       emoji: '🎯', betterWhen: 'high', get: t => t.goalsPerGame,       format: v => `${v}` },
    { id: 'wm_round_reached',  label: 'Weiteste Runde',       emoji: '🏆', betterWhen: 'high', get: t => t.roundReached,       format: v => WM_ROUND_LABELS[v] || `Runde ${v}` },
    { id: 'wm_matches',        label: 'Gespielte Spiele',     emoji: '📅', betterWhen: 'high', get: t => t.matchesPlayed,      format: v => `${v} Spiele` },
    { id: 'wm_conceded_pg',    label: 'Gegentore/Spiel',      emoji: '🛡️', betterWhen: 'low',  get: t => t.concededPerGame,    format: v => `${v}` },
    { id: 'wm_tournaments',    label: 'WM-Teilnahmen',        emoji: '🌍', betterWhen: 'high', get: t => t.tournamentsPlayed,  format: v => `${v}× WM` }
];

// Team-Namen normalisieren (historische → heutige Namen)
const WM_NAME_MAP = {
    'West Germany':   'Germany',
    'German DR':      'Germany',     // DDR (1974 Gruppenphase)
    'Zaire':          'DR Congo',
    'Dutch East Indies': 'Indonesia',
    'United States':  'USA',
    "Côte d'Ivoire":  'Ivory Coast',
    'IR Iran':        'Iran',
    'Korea Republic': 'South Korea',
    'Korea DPR':      'North Korea',
    'Republic of Ireland': 'Ireland',
    'Czech Republic': 'Czechia',
    'UAE':            'United Arab Emirates'
};

// Flaggen-Codes für flagcdn.com (ISO 3166-1 alpha-2 bzw. Subdivision-Codes)
const WM_TEAM_FLAGS = {
    // Aktuelle Nationen
    'Argentina': 'ar', 'Australia': 'au', 'Belgium': 'be', 'Brazil': 'br',
    'Cameroon': 'cm', 'Canada': 'ca', 'Costa Rica': 'cr', 'Croatia': 'hr',
    'Denmark': 'dk', 'Ecuador': 'ec', 'England': 'gb-eng', 'France': 'fr',
    'Germany': 'de', 'Ghana': 'gh', 'Iran': 'ir', 'Japan': 'jp',
    'Mexico': 'mx', 'Morocco': 'ma', 'Netherlands': 'nl', 'Poland': 'pl',
    'Portugal': 'pt', 'Qatar': 'qa', 'Saudi Arabia': 'sa', 'Senegal': 'sn',
    'Serbia': 'rs', 'South Korea': 'kr', 'Spain': 'es', 'Switzerland': 'ch',
    'Tunisia': 'tn', 'USA': 'us', 'Uruguay': 'uy', 'Wales': 'gb-wls',
    // Weitere aktuelle Nationen
    'Italy': 'it', 'Hungary': 'hu', 'Austria': 'at', 'Chile': 'cl',
    'Sweden': 'se', 'Romania': 'ro', 'Bolivia': 'bo', 'Paraguay': 'py',
    'Peru': 'pe', 'Turkey': 'tr', 'Colombia': 'co', 'Nigeria': 'ng',
    'Russia': 'ru', 'Algeria': 'dz', 'Ivory Coast': 'ci', 'DR Congo': 'cd',
    'Cuba': 'cu', 'Indonesia': 'id', 'Norway': 'no', 'Scotland': 'gb-sct',
    'Ireland': 'ie', 'Northern Ireland': 'gb-nir', 'Greece': 'gr',
    'Honduras': 'hn', 'Jamaica': 'jm', 'Trinidad and Tobago': 'tt',
    'Haiti': 'ht', 'El Salvador': 'sv', 'New Zealand': 'nz', 'Angola': 'ao',
    'Togo': 'tg', 'Ukraine': 'ua', 'Slovakia': 'sk', 'Slovenia': 'si',
    'Czechia': 'cz', 'Panama': 'pa', 'Iceland': 'is', 'Egypt': 'eg',
    'South Africa': 'za', 'United Arab Emirates': 'ae', 'Iraq': 'iq',
    'Kuwait': 'kw', 'China': 'cn', 'North Korea': 'kp', 'Senegal': 'sn',
    'Bulgaria': 'bg', 'Romania': 'ro', 'Croatia': 'hr', 'Portugal': 'pt',
    'South Korea': 'kr', 'Cameroon': 'cm',
    // Historische Nationen (Ersatz-Codes)
    'Soviet Union': 'ru',   // Russland als Nachfolger
    'Yugoslavia': 'rs',     // Serbien als Hauptnachfolger
    'Czechoslovakia': 'cz'
};

// Rundengewichtung für WM (Matchday X = Gruppenphase = 10, dann aufsteigend)
const WM_ROUND_VALUE = {
    'Round of 16': 20, 'Quarter-finals': 30, 'Semi-finals': 40,
    'Match for third place': 50, 'Final': 60
};
// Alle Matchday-Runden = 10 (Gruppenphase)

const CATEGORIES_PER_ROUND = 6;


// =============================================
// 3. API-FUNKTIONEN
// =============================================

// --- Tabelle einer Liga laden (football-data.org) ---
async function fetchStandings(leagueId) {
    try {
        const response = await fetch(`${API_BASE}competitions/${leagueId}/standings`);
        if (!response.ok) { console.error(`Standings-Fehler: HTTP ${response.status}`); return []; }
        const data = await response.json();
        if (!data.standings?.[0]?.table) { console.error('Unerwartetes Standings-Format'); return []; }
        return data.standings[0].table;
    } catch (e) { console.error('Standings-Fehler:', e); return []; }
}

// --- Match-Stats einer Liga laden (football-data.org) ---
async function fetchMatchStats(leagueId) {
    try {
        const response = await fetch(`${API_BASE}competitions/${leagueId}/matches?status=FINISHED`);
        if (!response.ok) { console.error(`Matches-Fehler: HTTP ${response.status}`); return {}; }
        const data = await response.json();
        const matches = data.matches || [];
        const stats = {};

        function ensureTeam(id) {
            if (!stats[id]) stats[id] = { cleanSheets: 0, bigWins: 0, awayWins: 0 };
        }

        matches.forEach(function (match) {
            const h = match.homeTeam.id, a = match.awayTeam.id;
            const hg = match.score.fullTime.home, ag = match.score.fullTime.away;
            if (hg === null || ag === null) return;
            ensureTeam(h); ensureTeam(a);
            if (ag === 0) stats[h].cleanSheets++;
            if (hg === 0) stats[a].cleanSheets++;
            if (hg - ag >= 3) stats[h].bigWins++;
            if (ag - hg >= 3) stats[a].bigWins++;
            if (ag > hg) stats[a].awayWins++;
        });

        return stats;
    } catch (e) { console.error('Matches-Fehler:', e); return {}; }
}

// --- WM-Daten laden: alle Turniere von 1930 bis 2022 parallel ---
async function fetchWMData() {
    console.log(`📡 Lade WM-Daten (${WM_YEARS.length} Turniere)...`);
    const results = await Promise.all(WM_YEARS.map(async function (year) {
        try {
            const res = await fetch(`${WM_DATA_BASE}${year}/worldcup.json`);
            if (!res.ok) { console.warn(`WM ${year}: HTTP ${res.status}`); return []; }
            const data = await res.json();
            const matches = data.matches || [];
            // Jahr an jedem Match merken (für Debug-Zwecke)
            return matches.map(m => Object.assign({}, m, { _year: year }));
        } catch (e) {
            console.warn(`WM ${year}: Fehler beim Laden`, e.message);
            return [];
        }
    }));

    const allMatches = results.flat();
    console.log(`✅ WM Alltime: ${allMatches.length} Spiele aus ${WM_YEARS.length} Turnieren`);
    return { matches: allMatches };
}


// =============================================
// 4. DATEN AUFBEREITEN
// =============================================

// --- Liga: eine Liga laden und zu Team-Objekten zusammenbauen ---
async function loadLeague(leagueId) {
    const league = LEAGUES.find(l => l.id === leagueId);
    console.log(`📡 Lade ${league.name}...`);
    const standings  = await fetchStandings(leagueId);
    const matchStats = await fetchMatchStats(leagueId);
    if (standings.length === 0) return [];

    const teams = [];
    standings.forEach(function (entry) {
        const played = entry.playedGames || 1;
        const ms = matchStats[entry.team.id] || { cleanSheets: 0, bigWins: 0, awayWins: 0 };

        teams.push({
            id:               entry.team.id,
            name:             entry.team.name,
            shortName:        entry.team.shortName || entry.team.name,
            crest:            entry.team.crest,
            leagueName:       league.name,
            points:           entry.points,
            goalsFor:         entry.goalsFor,
            goalsAgainst:     entry.goalsAgainst,
            goalDifference:   entry.goalDifference,
            won:              entry.won,
            draw:             entry.draw,
            lost:             entry.lost,
            playedGames:      played,
            winRate:          Math.round(entry.won / played * 100),
            goalsPerGame:     parseFloat((entry.goalsFor / played).toFixed(2)),
            concededPerGame:  parseFloat((entry.goalsAgainst / played).toFixed(2)),
            unbeatenRate:     Math.round((entry.won + entry.draw) / played * 100),
            cleanSheets:      ms.cleanSheets,
            bigWins:          ms.bigWins,
            awayWins:         ms.awayWins
        });
    });

    console.log(`✅ ${league.name}: ${teams.length} Teams`);
    return teams;
}


// --- Teamnamen normalisieren (historische Bezeichnungen → heutige) ---
function normalizeTeamName(name) {
    return WM_NAME_MAP[name] || name;
}

// --- WM: Spieldaten aller Turniere verarbeiten und Team-Objekte bauen ---
function processWMData(data) {
    const matches = data.matches || [];
    const stats   = {};

    function ensure(name) {
        if (!stats[name]) {
            stats[name] = {
                won: 0, drawn: 0, lost: 0,
                goalsFor: 0, goalsAgainst: 0,
                cleanSheets: 0, bigWins: 0,
                matchesPlayed: 0, roundReached: 0,
                tournamentsPlayed: new Set()
            };
        }
    }

    matches.forEach(function (match) {
        // --- Null-/Formatcheck ---
        if (!match.score) return;
        const ft = match.score.ft;
        if (!ft || !Array.isArray(ft) || ft.length < 2) return;
        const g1 = ft[0], g2 = ft[1];
        if (g1 === null || g1 === undefined || g2 === null || g2 === undefined) return;

        // Teamnamen normalisieren
        const t1 = normalizeTeamName(match.team1);
        const t2 = normalizeTeamName(match.team2);
        if (!t1 || !t2) return;

        // Rundengewicht: Matchday X = Gruppenphase = 10, KO-Runden aus WM_ROUND_VALUE
        const rv = WM_ROUND_VALUE[match.round] || 10;

        ensure(t1); ensure(t2);
        stats[t1].matchesPlayed++; stats[t2].matchesPlayed++;
        stats[t1].goalsFor     += g1;  stats[t1].goalsAgainst += g2;
        stats[t2].goalsFor     += g2;  stats[t2].goalsAgainst += g1;

        if      (g1 > g2) { stats[t1].won++;   stats[t2].lost++;  }
        else if (g1 < g2) { stats[t1].lost++;  stats[t2].won++;   }
        else               { stats[t1].drawn++; stats[t2].drawn++; }

        if (g2 === 0) stats[t1].cleanSheets++;
        if (g1 === 0) stats[t2].cleanSheets++;
        if (g1 - g2 >= 3) stats[t1].bigWins++;
        if (g2 - g1 >= 3) stats[t2].bigWins++;

        stats[t1].roundReached = Math.max(stats[t1].roundReached, rv);
        stats[t2].roundReached = Math.max(stats[t2].roundReached, rv);

        if (match._year) {
            stats[t1].tournamentsPlayed.add(match._year);
            stats[t2].tournamentsPlayed.add(match._year);
        }
    });

    // Team-Objekte zusammenbauen (nur Teams mit mind. 1 Spiel)
    return Object.entries(stats)
        .filter(function ([, s]) { return s.matchesPlayed > 0; })
        .map(function ([name, s]) {
            const played   = s.matchesPlayed || 1;
            const flagCode = WM_TEAM_FLAGS[name] || 'un';
            return {
                id:                   name,
                name:                 name,
                shortName:            name,
                crest:                `https://flagcdn.com/w80/${flagCode}.png`,
                leagueName:           'WM Alltime',
                goalsFor:             s.goalsFor,
                goalsAgainst:         s.goalsAgainst,
                goalDifference:       s.goalsFor - s.goalsAgainst,
                won:                  s.won,
                drawn:                s.drawn,
                lost:                 s.lost,
                matchesPlayed:        s.matchesPlayed,
                cleanSheets:          s.cleanSheets,
                bigWins:              s.bigWins,
                goalsPerGame:         parseFloat((s.goalsFor / played).toFixed(2)),
                concededPerGame:      parseFloat((s.goalsAgainst / played).toFixed(2)),
                roundReached:         s.roundReached,
                tournamentsPlayed:    s.tournamentsPlayed.size
            };
        });
}


// =============================================
// 5. RANKING & HILFSFUNKTIONEN
// =============================================

// --- Ränge berechnen ---
// Nimmt die aktiven Kategorien (LIGA oder WM) als Parameter.
// Rang 1 = bester. Gleiche Werte → gleicher Rang.
function buildRankings(teams, categories) {
    categories.forEach(function (cat) {
        const sorted = [...teams].sort(function (a, b) {
            return cat.betterWhen === 'high'
                ? cat.get(b) - cat.get(a)
                : cat.get(a) - cat.get(b);
        });

        let rank = 0, prevValue = null;
        sorted.forEach(function (team, index) {
            const value = cat.get(team);
            if (value !== prevValue) { rank = index + 1; prevValue = value; }
            if (!team.ranks) team.ranks = {};
            team.ranks[cat.id] = rank;
        });
    });
}


// --- Array mischen (Fisher-Yates) ---
function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}


// --- Punkte für einen erzielten relativen Rang ---
// Rang 1 = beste verfügbare Option dieser Runde → 30 Pt
// Rang 6 = schlechteste verfügbare Option → 5 Pt
function calculateRoundPoints(relativeRank) {
    if (relativeRank === 1) return 30;
    if (relativeRank === 2) return 25;
    if (relativeRank === 3) return 20;
    if (relativeRank === 4) return 15;
    if (relativeRank === 5) return 10;
    return 5;
}


// --- Globale Ideal-Route (Backtracking, 6! = 720 Permutationen) ---
// Nutzt relatives Scoring (gleiche Logik wie handleAnswer).
// Garantiert: idealRank ≤ pickedRank (weltweiter Rang) für jede Runde.
function computeGlobalIdealRoute(teams, categoryIds, roundHistory) {
    // Relative Ränge pro Team vorberechnen (1 = beste der 6 Kategorien)
    const relativeRanks = teams.map(function (team) {
        const sorted = [...categoryIds].sort((a, b) => team.ranks[a] - team.ranks[b]);
        const map = {};
        sorted.forEach(function (id, i) { map[id] = i + 1; });
        return map;
    });

    let bestScore = -1;
    let bestRoute = categoryIds.slice();

    function permute(remaining, current) {
        if (remaining.length === 0) {
            let score = 0;
            for (let i = 0; i < teams.length; i++) {
                score += calculateRoundPoints(relativeRanks[i][current[i]]);
            }
            if (score > bestScore) { bestScore = score; bestRoute = current.slice(); }
            return;
        }
        for (let i = 0; i < remaining.length; i++) {
            permute(
                [...remaining.slice(0, i), ...remaining.slice(i + 1)],
                [...current, remaining[i]]
            );
        }
    }

    permute(categoryIds, []);

    // Sicherheits-Check: Ideal darf nie schlechter sein als Spieler-Wahl (weltweiter Rang)
    return bestRoute.map(function (catId, i) {
        const idealRank  = teams[i].ranks[catId];
        const pickedRank = roundHistory[i].pickedRank;
        return idealRank > pickedRank ? roundHistory[i].pickedCategoryId : catId;
    });
}


// --- Logo-Untertitel auf allen Screens setzen ---
function setSubtitle(text) {
    document.querySelectorAll('.js-subtitle').forEach(function (el) {
        el.textContent = text;
    });
}


// --- Highscore (getrennt für Liga und WM) ---
function getHighscoreKey() {
    return gameState.mode === 'wm' ? 'kickquiz-highscore-wm' : 'kickquiz-highscore-liga';
}
function getHighscore() { return parseInt(localStorage.getItem(getHighscoreKey())) || 0; }
function saveHighscore(score) {
    if (score > getHighscore()) localStorage.setItem(getHighscoreKey(), score);
}


// =============================================
// 6. DOM-FUNKTIONEN
// =============================================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function (s) {
        s.classList.remove('active', 'fade-in');
    });
    const target = document.querySelector(`#${screenId}`);
    target.classList.add('active', 'fade-in');
}

function buildProgressBar() {
    const bar = document.querySelector('#progress-bar');
    bar.innerHTML = '';
    for (let i = 1; i <= gameState.totalRounds; i++) {
        const seg = document.createElement('div');
        seg.classList.add('progress-bar__segment');
        seg.dataset.round = i;
        bar.appendChild(seg);
    }
}

function updateProgressBar() {
    document.querySelectorAll('.progress-bar__segment').forEach(function (seg) {
        seg.classList.toggle('active', parseInt(seg.dataset.round) < gameState.round);
    });
}

// --- Runde anzeigen ---
function displayRound() {
    const team = gameState.currentTeam;

    document.querySelector('#team-crest').src = team.crest;
    document.querySelector('#team-crest').alt = team.name;
    document.querySelector('#team-name').innerText = team.name;

    // Fragetext je nach Modus
    document.querySelector('#question-text').innerText = gameState.mode === 'wm'
        ? `Worin war ${team.name} alltime an der WM am stärksten?`
        : `Worin rankt ${team.shortName} am höchsten?`;

    document.querySelector('#round-display').innerText =
        `Runde ${gameState.round} von ${gameState.totalRounds}`;
    document.querySelector('#score-badge').classList.add('hidden');

    updateProgressBar();

    document.querySelector('#feedback-bar').classList.add('hidden');
    document.querySelector('#feedback-bar').classList.remove('correct', 'wrong', 'neutral');
    document.querySelector('#btn-next').classList.add('hidden');

    // Buttons erzeugen (fixer Order vom Spielstart – kein Runden-Shuffle)
    const grid = document.querySelector('#answer-grid');
    grid.innerHTML = '';

    gameState.gameCategories.forEach(function (cat) {
        const btn = document.createElement('button');
        btn.classList.add('answer-btn');
        btn.dataset.categoryId = cat.id;

        const assignment = gameState.categoryAssignments[cat.id];
        if (assignment) {
            btn.disabled = true;
            btn.classList.add('assigned');
            btn.innerHTML =
                `<span class="answer-btn__emoji">${cat.emoji}</span> ${cat.label}` +
                `<span class="answer-btn__assigned">` +
                    `<img class="answer-btn__assigned-crest" src="${assignment.team.crest}" alt="${assignment.team.shortName}">` +
                    `<span class="answer-btn__rank">#${assignment.rank}</span>` +
                `</span>`;
        } else {
            btn.innerHTML = `<span class="answer-btn__emoji">${cat.emoji}</span> ${cat.label}`;
            btn.addEventListener('click', function () { handleAnswer(cat.id, btn); });
        }

        grid.appendChild(btn);
    });
}

// --- Feedback-Bar (null = neutral, true = grün, false = rot) ---
function showFeedbackBar(isCorrect, text) {
    const bar      = document.querySelector('#feedback-bar');
    const iconWrap = document.querySelector('.feedback-bar__icon-wrap');
    bar.classList.remove('hidden', 'correct', 'wrong', 'neutral');
    if (isCorrect === true)        { bar.classList.add('correct'); iconWrap.style.display = ''; }
    else if (isCorrect === false)  { bar.classList.add('wrong');   iconWrap.style.display = ''; }
    else                           { bar.classList.add('neutral'); iconWrap.style.display = 'none'; }
    document.querySelector('#feedback-text').innerText = text;
}


// =============================================
// 7. SPIELABLAUF
// =============================================

function startRound() {
    let available = gameState.teams.filter(t => !gameState.usedTeams.includes(t.id));
    if (available.length === 0) { gameState.usedTeams = []; available = gameState.teams; }

    const team = available[Math.floor(Math.random() * available.length)];
    gameState.usedTeams.push(team.id);
    gameState.currentTeam = team;

    const freeCategories = gameState.gameCategories.filter(c => !gameState.categoryAssignments[c.id]);
    gameState.currentCategories = freeCategories;

    if (freeCategories.length === 0) { showResult(); return; }

    displayRound();
}

function handleAnswer(categoryId, clickedBtn) {
    const team           = gameState.currentTeam;
    const cat            = gameState.gameCategories.find(c => c.id === categoryId);
    const worldRank      = team.ranks[categoryId];
    const freeCategories = gameState.currentCategories;

    // Relativer Rang: Position unter den noch freien Optionen (1 = beste)
    const sortedFree    = [...freeCategories].sort((a, b) => team.ranks[a.id] - team.ranks[b.id]);
    const relativeRank  = sortedFree.findIndex(c => c.id === categoryId) + 1;
    const pts           = calculateRoundPoints(relativeRank);

    gameState.score += pts;
    gameState.roundHistory.push({
        team, pickedCategoryId: categoryId,
        pickedRank: worldRank, points: pts
    });
    // Assignment setzen BEVOR nextRound() → displayRound() zeigt Badge in finaler Position
    gameState.categoryAssignments[categoryId] = { team, rank: worldRank };

    // Sofort weiter – keine Verzögerung
    nextRound();
}

function nextRound() {
    gameState.round++;
    if (gameState.round > gameState.totalRounds) showResult();
    else startRound();
}


// --- Lösungsvergleich-Slider ---
function buildLoesungsvergleich(history, idealRoute) {
    const existing = document.querySelector('.lv-wrap');
    if (existing) existing.remove();

    const wrap = document.createElement('div');
    wrap.className = 'lv-wrap';
    wrap.innerHTML =
        `<div class="lv-header">` +
            `<span class="lv-title">Lösungsvergleich</span>` +
            `<div class="lv-nav">` +
                `<button class="lv-btn" id="lv-prev">&#8249;</button>` +
                `<div class="lv-dots" id="lv-dots"></div>` +
                `<button class="lv-btn" id="lv-next">&#8250;</button>` +
            `</div>` +
        `</div>` +
        `<div class="lv-cards" id="lv-cards"></div>`;

    document.querySelector('.result-card').insertBefore(wrap, document.querySelector('#btn-restart'));

    const cardsEl = document.querySelector('#lv-cards');
    const dotsEl  = document.querySelector('#lv-dots');
    let current   = 0;

    // Aktive Kategorie-Liste für Lookup (Liga oder WM)
    const allCats = gameState.mode === 'wm' ? WM_CATEGORIES : LIGA_CATEGORIES;

    history.forEach(function (entry, i) {
        const pickedCat  = allCats.find(c => c.id === entry.pickedCategoryId);
        const idealCatId = idealRoute[i];
        const bestCat    = allCats.find(c => c.id === idealCatId);
        const bestRank   = entry.team.ranks[idealCatId];
        const isOptimal  = entry.pickedCategoryId === idealCatId;

        const card = document.createElement('div');
        card.className = 'lv-card' + (i === 0 ? ' active' : '');
        card.innerHTML =
            `<div class="lv-card__head">` +
                `<div class="lv-card__team">` +
                    `<img class="lv-card__crest" src="${entry.team.crest}" alt="">` +
                    `<span class="lv-card__name">${entry.team.name}</span>` +
                `</div>` +
                `<span class="lv-card__round">Runde ${i + 1}</span>` +
            `</div>` +
            `<hr class="lv-card__divider">` +
            `<div class="lv-card__cols">` +
                `<div class="lv-col">` +
                    `<div class="lv-col__label">Deine Wahl</div>` +
                    `<div class="lv-col__cat">${pickedCat.emoji} ${pickedCat.label}</div>` +
                    `<div class="lv-col__rank${isOptimal ? ' optimal' : ''}">#${entry.pickedRank}</div>` +
                `</div>` +
                `<div class="lv-col lv-col--right">` +
                    `<div class="lv-col__label">Ideale Wahl</div>` +
                    `<div class="lv-col__cat">${bestCat.emoji} ${bestCat.label}</div>` +
                    `<div class="lv-col__rank lv-col__rank--ideal">#${bestRank}</div>` +
                `</div>` +
            `</div>` +
            (isOptimal ? `<div class="lv-optimal-badge">✓ Optimal gewählt</div>` : '');

        cardsEl.appendChild(card);

        const dot = document.createElement('span');
        dot.className = 'lv-dot' + (i === 0 ? ' active' : '');
        dotsEl.appendChild(dot);
    });

    function goTo(index) {
        document.querySelectorAll('.lv-card').forEach((c, i) => c.classList.toggle('active', i === index));
        document.querySelectorAll('.lv-dot').forEach((d, i)  => d.classList.toggle('active', i === index));
        current = index;
    }

    document.querySelector('#lv-prev').addEventListener('click', () =>
        goTo((current - 1 + history.length) % history.length));
    document.querySelector('#lv-next').addEventListener('click', () =>
        goTo((current + 1) % history.length));
}


// --- Ergebnis-Screen ---
function showResult() {
    showScreen('screen-result');
    document.querySelector('#result-score-value').innerText = gameState.score;

    const pct = gameState.score / MAX_SCORE;
    let grade;
    if      (pct >= 0.9) grade = '🏆 Weltklasse!';
    else if (pct >= 0.7) grade = '🥇 Sehr gut!';
    else if (pct >= 0.5) grade = '🥈 Gut!';
    else if (pct >= 0.3) grade = '🥉 Ausbaufähig';
    else                 grade = '😅 Nächstes Mal besser!';
    document.querySelector('#result-grade').innerText = grade;

    saveHighscore(gameState.score);
    document.querySelector('#result-highscore').innerText =
        `🏅 Highscore: ${getHighscore()} Punkte`;

    // Ideal-Route berechnen
    const idealTeams  = gameState.roundHistory.map(e => e.team);
    const idealCatIds = gameState.gameCategories.map(c => c.id);
    const idealRoute  = computeGlobalIdealRoute(idealTeams, idealCatIds, gameState.roundHistory);

    const optimalCount = gameState.roundHistory.filter((e, i) =>
        e.pickedCategoryId === idealRoute[i]).length;

    document.querySelector('#result-stats').innerHTML =
        `<div class="result-stat"><div class="result-stat__value">${optimalCount}</div><div class="result-stat__label">Optimal</div></div>` +
        `<div class="result-stat"><div class="result-stat__value">${gameState.totalRounds - optimalCount}</div><div class="result-stat__label">Suboptimal</div></div>` +
        `<div class="result-stat"><div class="result-stat__value">${gameState.score}</div><div class="result-stat__label">Punkte</div></div>` +
        `<div class="result-stat"><div class="result-stat__value">${MAX_SCORE}</div><div class="result-stat__label">Maximum</div></div>`;

    buildLoesungsvergleich(gameState.roundHistory, idealRoute);
}


// --- Liga starten ---
async function startWithLeague(leagueId) {
    gameState.mode = 'liga';
    gameState.selectedLeague = leagueId;
    setSubtitle('Liga Edition');
    showScreen('screen-loading');

    const teams = await loadLeague(leagueId);
    if (teams.length === 0) {
        alert('Fehler beim Laden. Läuft der Server? (python3 server.py)');
        showScreen('screen-start');
        return;
    }

    buildRankings(teams, LIGA_CATEGORIES);
    gameState.teams             = teams;
    gameState.gameCategories    = shuffle(LIGA_CATEGORIES).slice(0, CATEGORIES_PER_ROUND);
    gameState.round             = 1;
    gameState.score             = 0;
    gameState.usedTeams         = [];
    gameState.categoryAssignments = {};
    gameState.roundHistory      = [];

    buildProgressBar();
    showScreen('screen-quiz');
    startRound();
}


// --- WM starten ---
async function startWM() {
    gameState.mode = 'wm';
    setSubtitle('WM Alltime');
    showScreen('screen-loading');

    const data = await fetchWMData();
    if (!data) {
        alert('Fehler beim Laden der WM-Daten. Prüfe die Internetverbindung.');
        showScreen('screen-mode');
        return;
    }

    const teams = processWMData(data);
    if (teams.length === 0) {
        alert('WM-Daten konnten nicht verarbeitet werden.');
        showScreen('screen-mode');
        return;
    }

    console.log(`✅ WM Alltime: ${teams.length} Nationen aus 22 Turnieren`);
    buildRankings(teams, WM_CATEGORIES);
    gameState.teams             = teams;
    gameState.gameCategories    = shuffle(WM_CATEGORIES).slice(0, CATEGORIES_PER_ROUND);
    gameState.round             = 1;
    gameState.score             = 0;
    gameState.usedTeams         = [];
    gameState.categoryAssignments = {};
    gameState.roundHistory      = [];

    buildProgressBar();
    showScreen('screen-quiz');
    startRound();
}


// --- Spiel neu starten → Modus-Auswahl ---
function restartGame() {
    setSubtitle('Edition wählen');
    showScreen('screen-mode');
}


// =============================================
// 8. EVENT LISTENERS
// =============================================
function registerEventListeners() {

    // Modus-Auswahl
    document.querySelector('#btn-mode-liga').addEventListener('click', () =>
        showScreen('screen-start'));
    document.querySelector('#btn-mode-wm').addEventListener('click', () =>
        startWM());

    // Liga-Karten
    document.querySelectorAll('.btn-league').forEach(function (btn) {
        btn.addEventListener('click', () => startWithLeague(btn.dataset.leagueId));
    });

    // Nächste Frage
    document.querySelector('#btn-next').addEventListener('click', nextRound);

    // Haus-Button → zurück zur Modus-Auswahl
    document.querySelector('#btn-abort').addEventListener('click', restartGame);

    // Nochmal spielen → Modus-Auswahl
    document.querySelector('#btn-restart').addEventListener('click', restartGame);
}


// =============================================
// 9. INITIALISIERUNG
// =============================================
async function initGame() {
    console.log('⚽ KickQuiz startet...');
    registerEventListeners();

    // Intro-Animation läuft einmal durch.
    // Dauer hier anpassen falls Animation kürzer/länger ist.
    await new Promise(resolve => setTimeout(resolve, 2600));

    showScreen('screen-mode');
    console.log('✅ Bereit!');
}

initGame();
