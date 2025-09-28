// Constants for display locations, size ordering, and tool power
const DISPLAY_LOCATIONS = [
  "Zephyr Town (West)",
  "Zephyr Town (Middle)",
  "Zephyr Town (East)",
  "Mountains (Base)",
  "Mountains (Middle)",
  "Mountains (Peak)",
  "Equestrian Park",
  "Bazaar",
];

const SIZE_ORDER = {
  small: 1,
  medium: 2,
  large: 3,
  guardian: 4,
};

const TOOL_POWER = {
  base: 2,
  copper: 3,
  silver: 5,
  gold: 7,
  orihalcum: 9,
};

// Global variable for selected weather
let selectedWeather = "sunny"; // Default weather

// Escape HTML to prevent XSS
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// Load fish data from JSON file
async function loadFishData() {
  const response = await fetch("fish_data2.json?v=2");
  return response.json();
}

// Save user preferences to localStorage
function savePreferences() {
  const toolLevel = document.getElementById("toollevel").value;
  const season = document.getElementById("season").value;

  localStorage.setItem("toollevel", toolLevel);
  localStorage.setItem("season", season);
  localStorage.setItem("weather", selectedWeather);
}

// Load user preferences from localStorage
function loadPreferences() {
  const toolLevel = localStorage.getItem("toollevel");
  const season = localStorage.getItem("season");
  const savedWeather = localStorage.getItem("weather");

  if (toolLevel) document.getElementById("toollevel").value = toolLevel;
  if (season) document.getElementById("season").value = season;

  if (savedWeather) {
    selectedWeather = savedWeather;
    const icon = document.querySelector(`#weather-select .weather-icon[data-weather="${savedWeather}"]`);
    if (icon) icon.classList.add("selected");
  } else {
    document.querySelector(`#weather-select .weather-icon[data-weather="sunny"]`).classList.add("selected");
  }
}

// Update tables based on user selections
async function updateTables() {
  const toolLevelLiteral = document.getElementById("toollevel").value;
  const toolLevel = TOOL_POWER[toolLevelLiteral] || 1;
  const season = document.getElementById("season").value;
  const fishData = await loadFishData();
  buildTables(fishData, toolLevel, season, selectedWeather);
}

// Build tables for fish data
function buildTables(fishData, toolLevel, season, weather) {
  const locationDict = Object.fromEntries(DISPLAY_LOCATIONS.map(loc => [loc, []]));

  // Filter and aggregate fish data
  for (const fish of fishData) {
    if (
      toolLevel >= fish.toollevel &&
      fish[season] === 1 &&
      fish[weather] === 1 &&
      DISPLAY_LOCATIONS.includes(fish.location)
    ) {
      const existingFish = locationDict[fish.location].find(f => f.name === fish.name);
      if (existingFish) {
        existingFish.weight += Number(fish.weight);
      } else {
        locationDict[fish.location].push({ ...fish });
      }
    }
  }

  const results = document.getElementById("results");
  results.innerHTML = ""; // Clear previous content

  if (!Object.values(locationDict).some(list => list.length > 0)) {
    results.textContent = "No fish available with this filter.";
    return;
  }

  // Build tables for each location
  for (const [location, fishList] of Object.entries(locationDict)) {
    if (fishList.length === 0) continue;

    const totalWeight = fishList.reduce((sum, fish) => sum + Number(fish.weight || 0), 0);

    // Create section and table
    const section = document.createElement("section");
    section.classList.add("location-section");

    const title = document.createElement("h2");
    title.textContent = location;
    section.appendChild(title);

    const table = document.createElement("table");
    table.classList.add("fish-table");

    // Table header
    const header = document.createElement("tr");
    header.innerHTML = "<th></th><th>Name</th><th>Size</th><th>Time</th><th>Chance</th>";
    table.appendChild(header);

    // Sort fish: primary by weight (desc), secondary by size (asc)
    fishList.sort((a, b) => {
      const weightDiff = Number(b.weight || 0) - Number(a.weight || 0);
      if (weightDiff !== 0) return weightDiff;
      return (SIZE_ORDER[a.size] || 0) - (SIZE_ORDER[b.size] || 0);
    });

    // Build table rows
    for (const fish of fishList) {
      const weight = Number(fish.weight) || 0;
      const relative = totalWeight > 0 ? (weight / totalWeight) * 100 : 0;

      const row = document.createElement("tr");

      // Fish icon
      const iconTd = document.createElement("td");
      const iconImg = document.createElement("img");
      iconImg.src = `icons/item_icon_${fish.fishid}${fish.type === "Fish" ? "a" : ""}.png`;
      iconImg.className = "fish-icon";
      iconTd.appendChild(iconImg);
      row.appendChild(iconTd);

      // Fish name
      const nameTd = document.createElement("td");
      nameTd.textContent = escapeHtml(fish.name);
      row.appendChild(nameTd);

      // Fish size
      const sizeTd = document.createElement("td");
      sizeTd.textContent = escapeHtml(fish.size);
      row.appendChild(sizeTd);

      // Time
      const timeTd = document.createElement("td");
      timeTd.textContent = escapeHtml(fish.time);
      row.appendChild(timeTd);

      // Relative percentage
      const relativeTd = document.createElement("td");
      relativeTd.textContent = `${relative.toFixed(1)}%`;
      row.appendChild(relativeTd);

      table.appendChild(row);
    }

    section.appendChild(table);
    results.appendChild(section);
  }
}

// Event Listeners
document.addEventListener("DOMContentLoaded", () => {
  loadPreferences();
  updateTables();
});

document.getElementById("toollevel").addEventListener("change", () => {
  savePreferences();
  updateTables();
});

document.getElementById("season").addEventListener("change", () => {
  savePreferences();
  updateTables();
});

document.querySelectorAll("#weather-select .weather-icon").forEach(icon => {
  icon.addEventListener("click", () => {
    document.querySelectorAll("#weather-select .weather-icon").forEach(i => i.classList.remove("selected"));
    icon.classList.add("selected");
    selectedWeather = icon.dataset.weather;
    localStorage.setItem("weather", selectedWeather);
    updateTables();
  });
});