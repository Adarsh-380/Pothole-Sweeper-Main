// Initial Coordinates (Bangalore, IBC Knowledge Park)
const ibc_center = [12.934533, 77.612204];

// Map Options
const mapOptions = {
    zoom_start: 16,
    // min_zoom: 16,
    max_zoom: 16,
    zoomControl: false,
    scrollWheelZoom: true, //Enable Zoom
    doubleClickZoom: true // Enable double click zoom
    };

// Initialize the map
const map = L.map('map', mapOptions).setView(ibc_center, 16);

// Add OpenStreetMap layer
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 16,
    // attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Marker (Draggable)
let marker = L.marker(ibc_center, { draggable: true }).addTo(map);
let boundary; // Boundary variable
const gridSize = 15;
const numPoints = 25;
const latOffset = 0.005; // ~500m
const lonOffset = 0.005;

let initialGridState = null; // Store the grid state after "Freeze"
let cells = []; // Store cell elements

// let mapClickEnabled = true; // Track whether map clicks are enabled for marker movement

// Add these global variables at the top of your script:
let totalMines = 0;
let minesLeft = 0;

// Add this function to update the mine count display:
function updateMineCountDisplay() {
    document.getElementById('mine-count').textContent = minesLeft;
}


/**
 * Creates a boundary (1km x 1km) around the specified coordinates.
 */
function createBoundary(lat, lng) {
    const corner1 = [lat - latOffset, lng - lonOffset];
    const corner2 = [lat + latOffset, lng + lonOffset];

    return L.rectangle([corner1, corner2], {
        color: 'red',
        weight: 1,
        fillColor: 'transparent',
        fillOpacity: 0
    });
}



function updateLocation(lat, lng) {

    // Update Boundary
    if (boundary) map.removeLayer(boundary);
    boundary = createBoundary(lat, lng).addTo(map);

    // Center map
    map.setView([lat, lng], 16);
}

// Initialize Coordinates & Boundary
updateLocation(ibc_center[0], ibc_center[1]);

// Marker Drag Event
marker.on('dragend', function(event) {
    const position = event.target.getLatLng();
    marker.setLatLng([position.lat, position.lng]);
    updateLocation(position.lat, position.lng);
});

// Autocomplete Setup
const searchInput = document.getElementById('search_query');
const suggestionsList = document.createElement('ul');
suggestionsList.id = 'suggestions';
document.getElementById('search-container').appendChild(suggestionsList);

searchInput.addEventListener('input', function() {
    const query = this.value;
    if (!query) {
        suggestionsList.innerHTML = '';
        return;
    }

    fetch(`/autocomplete?q=${query}&countrycodes=in`)
        .then(response => response.json())
        .then(data => {
            suggestionsList.innerHTML = '';
            data.forEach(suggestion => {
                const listItem = document.createElement('li');
                listItem.textContent = suggestion.display_name;
                listItem.addEventListener('click', function(event) {
                    event.preventDefault();

                    searchInput.value = suggestion.display_name;
                    suggestionsList.innerHTML = '';

                    const latitude = parseFloat(suggestion.latitude);
                    const longitude = parseFloat(suggestion.longitude);

                    if (isNaN(latitude) || isNaN(longitude)) {
                        console.error("Invalid suggestion coordinates");
                        return;
                    }

                    marker.setLatLng([latitude, longitude]);
                    updateLocation(latitude, longitude);
                });
                suggestionsList.appendChild(listItem);
            });
        })
        .catch(error => {
            console.error('Error fetching autocomplete suggestions:', error);
        });
});




// Freeze Map Button
// document.getElementById('freeze-map-button').addEventListener('click', function () {
//     const freezeButton = this; // Store the button element

//     if (!boundary) {
//         console.warn("Boundary is not defined.");
//         return;
//     }

//     // Get selected coordinates - directly from the map
//     const center = map.getCenter();
//     const lat = center.lat;
//     const lng = center.lng;

//     // Center the map and apply zoom level 16
//     map.setView([lat, lng], 16);
//     console.log("Freeze button clicked! Centering and zooming to level 16");

//     // Wait to ensure zoom is set before generating grid & potholes
//     setTimeout(() => {
//         console.log("Zoom at level 16, now generating potholes & grid.");

//         freezeButton.disabled = true;
//         // Disable User Interactions
//         map.removeLayer(marker);
//         map.dragging.disable();
//         map.touchZoom.disable();
//         map.doubleClickZoom.disable();
//         map.scrollWheelZoom.disable();
//         map.boxZoom.disable();
//         map.keyboard.disable();
//         if (map.tap) map.tap.disable();

//         searchInput.disabled = true;
//         mapClickEnabled = false; //Disable it from here


//         // Step 1: Generate 25 Random Pothole Coordinates
//         const potholeCoordinates = generateRandomCoordinates(lat, lng);
//         // markPotholesImmediately(potholeCoordinates);

//         // Step 2: Create Grid Overlay
//         createGridOverlay(lat, lng);

//         // Step 3: Map Potholes into Grid Cells (FIXED CORRECTLY)
//         const uniqueCellLocations = getUniqueGridCells(potholeCoordinates, lat, lng);

//         // console.log(...uniqueCellLocations)

//         // Step 4: Final Mapping of Potholes on Grid
//         // markFinalPotholes(uniqueCellLocations, lat, lng);

//         // Now update totalMines *before* creating the game grid
//         totalMines = uniqueCellLocations.length;
//         document.getElementById('mine-count-container').style.display = 'block';
//         updateMineCountDisplay(); // Display total number of mines

//         //initialGridState = saveGridState(cells);
//         createGameGrid(uniqueCellLocations);

//     }, 500);
// });
document.getElementById('freeze-map-button').addEventListener('click', function () {
    const freezeButton = this; // Store the button element

    if (!boundary) {
        console.warn("Boundary is not defined.");
        return;
    }

    // **Get coordinates from the marker instead of map.getCenter()**
    const markerPosition = marker.getLatLng();
    const lat = markerPosition.lat;
    const lng = markerPosition.lng;

    // Center the map and apply zoom level 16
    map.setView([lat, lng], 16);
    console.log("Freeze button clicked! Centering and zooming to level 16");

    // Wait to ensure zoom is set before generating grid & potholes
    setTimeout(() => {
        console.log("Zoom at level 16, now generating potholes & grid.");

        freezeButton.disabled = true;
        // Disable User Interactions
        map.removeLayer(marker);
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();

        searchInput.disabled = true;
        mapClickEnabled = false; //Disable it from here


        // Step 1: Generate 25 Random Pothole Coordinates
        const potholeCoordinates = generateRandomCoordinates(lat, lng);
        // markPotholesImmediately(potholeCoordinates);

        // Step 2: Create Grid Overlay
        createGridOverlay(lat, lng);

        // Step 3: Map Potholes into Grid Cells (FIXED CORRECTLY)
        const uniqueCellLocations = getUniqueGridCells(potholeCoordinates, lat, lng);

        // console.log(...uniqueCellLocations)

        // Step 4: Final Mapping of Potholes on Grid
        // markFinalPotholes(uniqueCellLocations, lat, lng);

        // Now update totalMines *before* creating the game grid
        totalMines = uniqueCellLocations.length;
        document.getElementById('mine-count-container').style.display = 'block';
        updateMineCountDisplay(); // Display total number of mines

        //initialGridState = saveGridState(cells);
        createGameGrid(uniqueCellLocations);

    }, 500);
});

/**
 * Generates unique pothole locations and maps them.
 */
function generateRandomCoordinates(centerLat, centerLng) {
    const numPoints = 5;
    const latOffset = 0.005, lonOffset = 0.005;
    return Array.from({ length: numPoints }, () => [
        centerLat - latOffset + Math.random() * (2 * latOffset),
        centerLng - lonOffset + Math.random() * (2 * lonOffset)
    ]);
}

function markPotholesImmediately(potholeCoordinates) {
    potholeCoordinates.forEach(coord => {
        L.circleMarker(coord, { radius: 3, color: "magenta", fillOpacity: 1 })
         .bindPopup(`Generated: ${coord[0].toFixed(6)}, ${coord[1].toFixed(6)}`)
         .addTo(map);
    });
}

/**
 * Creates a 15x15 grid overlay inside the 1km boundary.
 */
function createGridOverlay(centerLat, centerLng) {
    const gridSize = 15;
    const latOffset = 0.005, lonOffset = 0.005;
    const gridColor = "black";

    for (let i = 0; i <= gridSize; i++) {
        const lat = centerLat - latOffset + i * (2 * latOffset / gridSize);
        L.polyline([[lat, centerLng - lonOffset], [lat, centerLng + lonOffset]],
           { color: gridColor, weight: 1, opacity: 1 }).addTo(map);
    }
    for (let i = 0; i <= gridSize; i++) {
        const lon = centerLng - lonOffset + i * (2 * lonOffset / gridSize);
        L.polyline([[centerLat - latOffset, lon], [centerLat + latOffset, lon]],
           { color: gridColor, weight: 1, opacity: 1 }).addTo(map);
    }
}

/**
 * Maps each coordinate to its corresponding grid cell and removes duplicates.
 */
function getUniqueGridCells(potholeCoordinates, centerLat, centerLng) {
    const gridSize = 15;
    const latOffset = 0.005, lonOffset = 0.005;

    const cellSizeLat = (2 * latOffset) / gridSize;
    const cellSizeLng = (2 * lonOffset) / gridSize;

    const uniqueCells = [];

    potholeCoordinates.forEach(coord => {


        let row = Math.floor((coord[0] - (centerLat - latOffset)) / cellSizeLat);
        let column = Math.floor((coord[1] - (centerLng - lonOffset)) / cellSizeLng);


        row = Math.max(0, Math.min(gridSize - 1, row));
        column = Math.max(0, Math.min(gridSize - 1, column));

        if (!uniqueCells.some(c => c[0] === row && c[1] === column)) {
            uniqueCells.push([row, column]);
        }
    });

    uniqueCells.sort((a, b) => {
        if (a[0] === b[0]) return a[1] - b[1];  // Sort by column if same row
        return a[0] - b[0]; // Otherwise, sort by row
    });

    return uniqueCells;
}

/**
 * Marks **final mapped pothole positions** on the grid **(FIXED ROW & COLUMN CALCULATION)**
 */
function markFinalPotholes(uniqueCellLocations, centerLat, centerLng) {
    const gridSize = 15;
    const latOffset = 0.005, lonOffset = 0.005;

    uniqueCellLocations.forEach(cell => {
        const row = cell[0];
        const column = cell[1];

        const lat = centerLat - latOffset + (row + 0.5) * (2 * latOffset / gridSize);
        const lng = centerLng - lonOffset + (column + 0.5) * (2 * lonOffset / gridSize);

        L.circleMarker([lat, lng], { radius: 3, color: "red", fillOpacity: 1 })
         .bindPopup(`Final Mapped: ${lat.toFixed(6)}, ${lng.toFixed(6)}`)
         .addTo(map);
    });
}


/**
 * Creates a clickable game grid overlay with Minesweeper logic applied.
 */
function createGameGrid(uniqueCellLocations, centerLat, centerLng) {
    if (!boundary) return;

    const gridSize = 15;
    const bounds = boundary.getBounds();
    const topLeft = map.latLngToContainerPoint(bounds.getNorthWest());
    const bottomRight = map.latLngToContainerPoint(bounds.getSouthEast());

    const width = bottomRight.x - topLeft.x, height = bottomRight.y - topLeft.y;
    const cellSize = { width: width / gridSize, height: height / gridSize };

    // ✅ Remove any existing grid before generating a new one
    const existingGrid = document.getElementById('game-container');
    if (existingGrid) {
        existingGrid.remove();
    }

    // ✅ Create game grid overlay
    const gameContainer = document.createElement('div');
    gameContainer.id = 'game-container';
    gameContainer.style.position = "absolute";
    gameContainer.style.top = `${topLeft.y}px`;
    gameContainer.style.left = `${topLeft.x}px`;
    gameContainer.style.width = `${width}px`;
    gameContainer.style.height = `${height}px`;
    gameContainer.style.zIndex = "1001";
    //gameContainer.style.background = "rgba(200, 200, 200, 0.25)"; // Can keep or remove

    const mineCounts = calculateMineCounts(gridSize, uniqueCellLocations);
    cells = []; // Store cell elements for later access - MAKE SURE THIS IS GLOBAL or accessible!

    totalMines = uniqueCellLocations.length; // Set total number of mines
    minesLeft = totalMines; // Initialize mines left

    // Update the mine count display immediately after game grid is created
    updateMineCountDisplay();

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            const cell = document.createElement('div');
            cell.style.width = `${cellSize.width}px`;
            cell.style.height = `${cellSize.height}px`;
            cell.style.position = "absolute";
            cell.style.left = `${col * cellSize.width}px`;
            cell.style.top = `${row * cellSize.height}px`;
            cell.style.border = "1px solid rgba(0, 0, 0, 0.3)";
            cell.style.background = "rgba(200, 200, 200, 0.75)"; // Initial background for all cells
            cell.style.display = 'flex'; // Use flexbox for centering content
            cell.style.justifyContent = 'center';
            cell.style.alignItems = 'center';
            cell.style.fontSize = '20px';  // Increased Font Size
            cell.style.fontWeight = 'bold';

            let adjustedRow = gridSize - 1 - row;  // Correct row adjustment

            let mineCount = mineCounts[adjustedRow][col];
            const isMine = uniqueCellLocations.some(cellLoc => cellLoc[0] === adjustedRow && cellLoc[1] === col);

            cell.dataset.row = adjustedRow; // Store the adjusted row and column for later use
            cell.dataset.col = col;
            cell.dataset.isMine = isMine;
            cell.dataset.mineCount = mineCount;
            cell.dataset.revealed = false;  // Track if cell is revealed
            cell.dataset.flagged = false; // Add a flag stage

            if (isMine) {
                // Do not show mines initially
            } else {
                // Do not show mine counts initially
            }


            // Attach click event to each grid cell
            cell.addEventListener('click', () => {
                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);
                const isFlagged = cell.dataset.flagged === 'true';
                
                // Do nothing if the cell is flagged
                if (isFlagged) {
                    return;
                }
                
                const isMine = cell.dataset.isMine === 'true';
                const mineCount = parseInt(cell.dataset.mineCount);
                if (isMine) {
                    revealAllMines(cells); // Reveal all mines
                    showGameOverPopup();
                } else {
                    revealCell(row, col, cells, mineCounts, gridSize);
                }
            });

            // Right-click event listener for flagging
            cell.addEventListener('contextmenu', (event) => {
                event.preventDefault(); // Prevent default context menu

                const row = parseInt(cell.dataset.row);
                const col = parseInt(cell.dataset.col);

                toggleFlag(cell, row, col);
            });


            cells.push(cell); // Store the cell for later use
            gameContainer.appendChild(cell);
        }
    }

    document.getElementById('map').appendChild(gameContainer);

    // Store the initial grid state after grid is created
    initialGridState = saveGridState(cells);
}

const canvas = document.querySelector('#confetti');
const jsConfetti = new JSConfetti();

function launchConfetti() {
    jsConfetti.addConfetti({
        confettiRadius: 6,
        confettiNumber: 1500,
        confettiColors: ['#ff0000', '#00ff00', '#0000ff'], // Example colors
        duration: 1000, // 10 seconds
        power: 400, // Adjust Power
        speed: 50, // Adjust Speed
        angle: 90, // 60 degrees
        spread: 1800,
        gravity: 0.25, // Adjust Gravity
        startVelocity: 30,
        element: document.getElementById('confetti-canvas') // Specify a canvas element
    });
}

function toggleFlag(cell, row, col) {
    const isFlagged = cell.dataset.flagged === 'true';

    if (isFlagged) {
        // Remove the flag
        cell.dataset.flagged = 'false';
        cell.textContent = ''; // Remove the triangle
        cell.style.color = '';  // Remove triangle color
        minesLeft++;  // Increment mine count
    } else {
        // Add the flag if the cell isn't revealed
        if (cell.dataset.revealed === 'false') {
            cell.dataset.flagged = 'true';
            cell.textContent = '▲'; // Red Triangle
            cell.style.color = 'green'; // Red Triangle
            minesLeft--; // Decrement mine count
        }
    }

    updateMineCountDisplay(); // Update display regardless of flagging

    // Check if the game is won when minesLeft is 0
    if (minesLeft === 0) {
        if (checkWinCondition()) {
            showWinPopup();
            launchConfetti();
        } else {
            showLosePopup();
        }
    }
}

function revealAllMines(cells) {
    cells.forEach(cell => {
        if (cell.dataset.isMine === 'true') {
            cell.style.background = "red";
            cell.textContent = "M";
            cell.dataset.revealed = 'true'; // Mark as revealed to prevent further actions
        }
    });
}

// Function to check win condition
function checkWinCondition() {
    let allMinesFlagged = true;
    cells.forEach(cell => {
        if (cell.dataset.isMine === 'true') {
            if (cell.dataset.flagged !== 'true') {
                allMinesFlagged = false;
            }
        }
    });
    return allMinesFlagged;
}





function revealCell(row, col, cells, mineCounts, gridSize) {
    const cell = cells.find(c => parseInt(c.dataset.row) === row && parseInt(c.dataset.col) === col);

    if (!cell || cell.dataset.revealed === 'true' || cell.dataset.flagged === 'true') {
        return; // Already revealed, flagged, or invalid cell
    }

    cell.dataset.revealed = 'true';

    const mineCount = parseInt(cell.dataset.mineCount);

    if (mineCount > 0) {
        cell.textContent = mineCount.toString();
        switch (mineCount) {
            case 1: cell.style.color = 'blue'; break;
            case 2: cell.style.color = 'red'; break;
            case 3: cell.style.color = 'brown'; break;
            case 4: cell.style.color = 'black'; break;
            default: cell.style.color = 'black';
        }
        cell.style.background = "transparent"; // Make background transparent for non-zero minecount
    } else {
        // cell.style.background = "green"; // Only make background green if mineCount = 0
        cell.style.background = "transparent"; // Make background transparent for non-zero minecount
        // Reveal neighboring cells with 0 mine count recursively
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                if (i === 0 && j === 0) continue; // Skip the cell itself

                let neighborRow = row + i;
                let neighborCol = col + j;

                if (neighborRow >= 0 && neighborRow < gridSize && neighborCol >= 0 && neighborCol < gridSize) {
                    // Only reveal the neighbor if it's NOT flagged
                    const neighborCell = cells.find(c => parseInt(c.dataset.row) === neighborRow && parseInt(c.dataset.col) === neighborCol);
                    if (neighborCell && neighborCell.dataset.flagged !== 'true') {
                        revealCell(neighborRow, neighborCol, cells, mineCounts, gridSize); // Recursive call
                    }
                }
            }
        }
    }
}

function calculateMineCounts(gridSize, uniqueCellLocations) {
    const mineCounts = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0)); // Initialize with 0

    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            // Check neighbors for mines
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    if (i === 0 && j === 0) continue; // Skip the cell itself

                    let neighborRow = row + i;
                    let neighborCol = col + j;

                    // Check boundaries
                    if (neighborRow >= 0 && neighborRow < gridSize && neighborCol >= 0 && neighborCol < gridSize) {
                        if (uniqueCellLocations.some(cellLoc => cellLoc[0] === neighborRow && cellLoc[1] === neighborCol)) {
                            mineCounts[row][col]++;
                        }
                    }
                }
            }
        }
    }

    return mineCounts;
}

// Function to show the game over popup
function showGameOverPopup() {
    document.getElementById('game-over-popup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// Function to hide the game over popup
function hideGameOverPopup() {
    document.getElementById('game-over-popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Function to reset the grid to its initial state
function resetGrid() {
    if (!initialGridState) {
        console.warn("Initial grid state not saved.");
        return;
    }

    cells.forEach((cell, index) => {
        // Restore the initial properties from the saved state
        const savedState = initialGridState[index];

        cell.dataset.revealed = savedState.revealed;
        cell.style.background = savedState.background;
        cell.textContent = savedState.textContent;


        if (savedState.color) {
            cell.style.color = savedState.color;
        }
    });

    minesLeft = totalMines;
    updateMineCountDisplay();

    hideGameOverPopup(); // Hide the popup after resetting
    hideLosePopup();
    hideWinPopup();

}


function saveGridState(cells) {
    return cells.map(cell => ({
        revealed: cell.dataset.revealed,
        background: cell.style.background,
        textContent: cell.textContent,
        color: cell.style.color,
    }));
}





// Function to show the win popup
function showWinPopup() {
    document.getElementById('win-popup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// Function to hide the win popup
function hideWinPopup() {
    document.getElementById('win-popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}

// Function to show the lose popup
function showLosePopup() {
    document.getElementById('lose-popup').style.display = 'block';
    document.getElementById('overlay').style.display = 'block';
}

// Function to hide the lose popup
function hideLosePopup() {
    document.getElementById('lose-popup').style.display = 'none';
    document.getElementById('overlay').style.display = 'none';
}


// Add event listeners to the reset and restart buttons
document.getElementById('reset-button').addEventListener('click', resetGrid);
document.getElementById('reset-button-lose').addEventListener('click', resetGrid);
document.getElementById('restart-button').addEventListener('click', () => {
    window.location.reload(); // Reload the page to restart
});
document.getElementById('restart-button-won').addEventListener('click', () => {
    window.location.reload(); // Reload the page to restart
});
document.getElementById('restart-button-lose').addEventListener('click', () => {
    window.location.reload(); // Reload the page to restart
});

