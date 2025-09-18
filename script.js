const display_locations = [
    "Zephyr Town (West)",
    "Zephyr Town (Middle)",
    "Zephyr Town (East)",
    "Mountains (Base)",
    "Mountains (Middle)",
    "Mountains (Peak)",
    "Equestrian Park",
    "Bazaar",
];

const size_order = {
    small: 1,
    medium: 2,
    large: 3,
    guardian: 4
};

const tool_power = {
    copper: 1,
    silver: 3,
    gold: 5,
    orihalcum: 7,
    mithril: 9
}

function escapeHtml(str) {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

async function load_fish_data() {
    const res = await fetch('fish_data2.json');
    return res.json();
}

// Generate tables on page load
window.addEventListener('DOMContentLoaded', updateTables);

// Listen for changes
document.getElementById('toollevel').addEventListener('change', updateTables);
document.getElementById('season').addEventListener('change', updateTables);
document.getElementById('weather').addEventListener('change', updateTables);

async function updateTables() {
    const toollevelliteral = document.getElementById('toollevel').value;
    const toollevel = tool_power[toollevelliteral] || 1;
    const season = document.getElementById('season').value;
    const weather = document.getElementById('weather').value;
    const fish_data = await load_fish_data();
    build_tables(fish_data, toollevel, season, weather);
}

function build_tables(fish_data, toollevel, season, weather) {
    const location_dict = {};

    for (const location of display_locations) {
        location_dict[location] = []
    }

    for (const fish of fish_data) {
        if (
            toollevel >= fish.toolLevel &&
            fish[season] === 1 &&
            fish[weather] === 1 &&
            display_locations.includes(fish.location)
        ) {
            const existing_fish = location_dict[fish.location].find(fish_obj => (fish_obj.name === fish.name));

            if (existing_fish) {
                existing_fish.weight += Number(fish.weight)
            } else {
                location_dict[fish.location].push(fish);
            }
        }
    }

    const results = document.getElementById('results');
    results.innerHTML = ''; // clear previous

    if (Object.keys(location_dict).length === 0) {
        results.textContent = 'No fish available with this filter.';
        return;
    }

    for (const [location, fish_list] of Object.entries(location_dict)) {
        const total = fish_list.reduce((running_weight, fish) => running_weight + (Number(fish.weight) || 0), 0);

        const section = document.createElement('section');
        section.classList.add('location-section');

        const title = document.createElement('h2');
        title.textContent = `${location}`;
        section.appendChild(title);

        const table = document.createElement('table');
        table.classList.add('fish-table');

        const header = document.createElement('tr');
        header.innerHTML = '<th></th><th>Name</th><th></th><th></th><th></th><th></th><th></th><th></th><th></th><th>Time</th><th>Spawn Chance</th>';
        table.appendChild(header);

        //fish_list.sort((a, b) => (size_order[a.size] || 0) - (size_order[b.size] || 0));
        //fish_list.sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
        fish_list.sort((a, b) => {
            const weightDiff = (Number(b.weight) || 0) - (Number(a.weight) || 0); // primary: weight descending
            if (weightDiff !== 0) return weightDiff;
            return (size_order[a.size] || 0) - (size_order[b.size] || 0); // secondary: size ascending
        });

        for (const fish of fish_list) {
            const weight = Number(fish.weight) || 0;
            const relative = total > 0 ? (weight / total) * 100 : 0;

            const row = document.createElement('tr');


            // Clear the row first (optional)
            row.innerHTML = "";

            // 1. Fish icon
            const iconTd = document.createElement("td");
            const iconImg = document.createElement("img");
            if (fish.type === "Fish") {
                iconImg.src = `icons/item_icon_${fish.fishid}a.png`;
            } else {
                iconImg.src = `icons/item_icon_${fish.fishid}.png`;
            }
            
            iconImg.className = "fish-icon";
            iconTd.appendChild(iconImg);
            row.appendChild(iconTd);

            // 2. Fish name
            const nameTd = document.createElement("td");
            nameTd.textContent = escapeHtml(fish.name);
            row.appendChild(nameTd);

            // 3. Weather cells
            const weatherFields = ["sunny", "cloudy", "rain", "heavyRain", "hurricane", "snow", "blizzard"];
            weatherFields.forEach(weather => {
                const weatherTd = document.createElement("td");
                const weatherImg = document.createElement("img");
                weatherImg.src = `icons/weather_${weather}.png`;
                weatherImg.className = "fish-icon";
                if (fish[weather] === 1) {
                    weatherTd.appendChild(weatherImg);
                }
                row.appendChild(weatherTd);
                
            });

            // 4. Time
            const timeTd = document.createElement("td");
            timeTd.textContent = escapeHtml(fish.time);
            row.appendChild(timeTd);

            // 5. Relative percentage
            const relativeTd = document.createElement("td");
            relativeTd.textContent = `${relative.toFixed(1)}%`;
            row.appendChild(relativeTd);

            table.appendChild(row);
        }

        section.appendChild(table);

        results.appendChild(section);
    }
}
