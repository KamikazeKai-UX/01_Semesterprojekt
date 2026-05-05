async function loadData() {
    const years = [
        1930, 1934, 1938, 1950, 1954, 1958, 1962, 1966, 1970,
        1974, 1978, 1982, 1986, 1990, 1994, 1998, 2002, 2006,
        2010, 2014, 2018, 2022, 2026
    ];

    const baseUrl = 'https://raw.githubusercontent.com/openfootball/worldcup.json/master';

    try {
        const results = await Promise.all(
            years.map(year =>
                fetch(`${baseUrl}/${year}/worldcup.json`).then(r => r.json())
            )
        );
        return results; // Array mit einem Objekt pro WM
    } catch (error) {
        console.error(error);
        return false;
    }
}

const data = await loadData();
console.log(data);