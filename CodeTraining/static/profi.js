const currentMap = document.getElementById("current-map");
const playerLegend = document.getElementById("player-legend");
const schuldenAnzeige = document.getElementById("schulden-anzeige");
const bonusPoints = document.getElementById("bonus-points");
const userLoginInScreen = document.getElementById("user-login-screen");
const logoutLink = document.getElementById("logout-link");
const registerLink = document.getElementById("register-link");
const gameGrid = document.getElementById('game-grid');
const loginPage = document.getElementById('page-login');
const formular = document.getElementById("formular");
const gamePage = document.getElementById('page-game');
const overlay = document.querySelector('.overlay');
const joinAccount = document.getElementById("join-account");
const universalAlert = document.getElementById("universal-alert");
const alertText = document.getElementById("alert-text");
const alertButton = document.getElementById("alert-button");
const leaderBoardContainer = document.querySelector(".leader-board-container");
const userPreviewName = document.querySelector(".user-preview-name");
const userPreviewMap = document.querySelector(".user-preview-map");

const gameState = {
    username: 'Gast',
    level: 1,
    stamina: 15,
    currentPos: 0,
    goalPos: 0,
    schulden: 0,
    bonus: 0,
    special: { gold: [], bombs: [], chaos: [] }
};

// Zentrale API-Funktion
async function apiPost(url, payload) {
    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return await res.json();
    } catch (error) {
        console.error("API Fehler:", error);
    }
}

// --- LOGIN & REGISTRIERUNG ---
overlay.addEventListener('click', (e) => {
    const CardModal = document.querySelector('.card.modal');
    const GoBack = document.getElementById("go-back");

    if (e.target === CardModal) {
        e.stopPropagation();
    }

    if (e.target === overlay || e.target === GoBack) {
        overlay.style.display = "none";
    }
});

registerLink.addEventListener('click', () => {
    overlay.style.display = "flex";
});

alertButton.addEventListener("click", () => {
    universalAlert.style.display = "none";
});

joinAccount.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('create-user').value;
    const password = document.getElementById('create-login').value;
    const data = await apiPost('/Register', { username: username, password: password });

    if (data && data.status === 'success') {
        alert("Deine Account wurde erfolgreich erstellt.");
        gameState.username = data.username;
        gameState.level = data.level;
        gameState.stamina = data.stamina;
        gameState.goalPos = data.goalPos; // Korrigiert
        gameState.currentPos = 0;
        gameState.schulden = 0;
        gameState.bonus = data.bonus;
        
        if (data.specialTiles) { // Korrigiert
            gameState.special = JSON.parse(data.specialTiles); // Korrigiert
        }

        overlay.style.display = "none";
        
        showGamePage();
        
        currentMap.style.display = "flex";
        playerLegend.style.display = "flex";
        schuldenAnzeige.style.display = "flex";
        bonusPoints.style.display = "flex";
        logoutLink.style.display = "flex";
    } else {
        alert("Fehler: " + (data.message || "Name schon vergeben?"));
    }
});

formular.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const payload = {
        username: document.getElementById('user-name').value,
        password: document.getElementById('user-login').value
    };
    
    const data = await apiPost('/Login', payload);

    if (data && data.status === 'success') {
        gameState.username = data.username;
        gameState.level = data.level;
        gameState.stamina = data.stamina;
        gameState.schulden = data.roblocksSchulden; // Korrigiert
        gameState.bonus = data.bonus;
        gameState.currentPos = data.lastPos || 0;   // Korrigiert
        gameState.goalPos = data.goalPos;           // Korrigiert
        
        if (data.specialTiles) { // Korrigiert
            gameState.special = JSON.parse(data.specialTiles); // Korrigiert
        }
        
        showGamePage();
        
        currentMap.style.display = "flex";
        playerLegend.style.display = "flex";
        schuldenAnzeige.style.display = "flex";
        bonusPoints.style.display = "flex";
        logoutLink.style.display = "flex";
    } else {
        alert("Login fehlgeschlagen!");
    }
});

// --- SPIELFELD GENERIEREN ---
function createGrid(count) {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    for (let i = 0; i < count; i++) {
        const tile = document.createElement('div');
        tile.className = 'tile-container';
        tile.dataset.index = i;
        
        tile.innerHTML = `
            <div class="tile-gelenk">
                <div class="tile-front">${i}</div>
                <div class="tile-back">?</div>
            </div>
        `;
        
        if (i === gameState.currentPos) {
            tile.querySelector('.tile-gelenk').classList.add('is-flipped');
            const back = tile.querySelector('.tile-back');
            back.textContent = 'START';
            back.style.background = 'red';
            back.style.color = 'white';
        }
        
        if (i === gameState.goalPos) {
            tile.querySelector('.tile-gelenk').classList.add('is-flipped');
            const back = tile.querySelector('.tile-back');
            back.textContent = 'ZIEL';
            back.style.background = 'yellow';
        }
        
        grid.appendChild(tile);
    }
}

// --- GAME LOGIK (KLICK) ---
gameGrid.addEventListener('click', async (e) => {
    const tile = e.target.closest('.tile-container');
    if (!tile) return;

    const pos = parseInt(tile.dataset.index);

    if (tile.querySelector('.is-flipped') && pos !== gameState.goalPos) return;

    const diff = Math.abs(pos - gameState.currentPos);

    if (diff === 1 || diff === 10) {

        if (diff === 1) {
            const oldRow = Math.floor(gameState.currentPos / 10);
            const newRow = Math.floor(pos / 10);

            if (oldRow !== newRow) {
                showCustomAlert("Du kannst nicht durch die Wand gehen!", "style-cheat");
                return;
            }
        }
    } else {
        showCustomAlert("Du kannst nur ein Feld weit gehen!", "style-cheat");
        return;
    }

    const result = await apiPost('/Move', { position: pos, map_id: gameState.level });

    if (result && result.status === 'success') {
        if (result.gameState === 'FINISHED') {
            showEndScreen(result);
            return;
        }

        console.log("Server Antwort:", result);
        gameState.stamina = result.newStamina; // Korrigiert
        gameState.bonus = result.newBonus;     // Korrigiert
        gameState.currentPos = pos;

        tile.querySelector('.tile-gelenk').classList.add('is-flipped'); // Korrigiert (Bindestrich)
        updateUI();

        if (result.event === "goal") {
            alert("Ziel erreicht! Willkommen in Level " + result.newLevel); // Korrigiert

            gameState.level = result.newLevel;     // Korrigiert
            gameState.currentPos = result.newBeginn; // Korrigiert
            gameState.goalPos = result.newQuest;     // Korrigiert

            let NewSpecialTiles = JSON.parse(result.newField); // Korrigiert

            gameState.special = NewSpecialTiles;
            updateUI();
            createGrid(100);
        } else if (result.event === "SchuldenKonto") {

            alert(`Energie leer! Du hast ${result.newDebt} Schulden gemacht.`); // Korrigiert
            location.reload();

        } else if (result.event === "boost") {
            showCustomAlert("Du hast ein Koffe/Energy drink bekommen. Du hast jetzt + 5 Züge.", "style-move");

            universalAlert.style.width = "440px";
            universalAlert.style.height = "120px";

        } else if (result.event === "bombe") {
            showCustomAlert("Du bist auf einer Bombe gestoßen. Jetzt hast du auf grund eines streifschussen - 5 Züge weniger.", "style-move");

            universalAlert.style.width = "480px";
            universalAlert.style.height = "130px";
            alertText.style.maxWidth = "370px";

        } else if (result.event === "chaos") {
            showCustomAlert("Du bist auf einer Stadt getroffen, Da nicht sicher sein kannst ob die dir helfen oder nicht. Kannst du entweder 5 Züge +/- bekommen.", "style-move");

            universalAlert.style.width = "525px";
            universalAlert.style.height = "150px";
            alertText.style.maxWidth = "400px";
        } 
    }
});

function updateUI() {
    document.getElementById('player-legend').textContent = `Energie: ${gameState.stamina}`;
    document.getElementById('current-map').textContent = `Map: ${gameState.level}`;
    document.getElementById('user-login-screen').textContent = gameState.username;

    if (schuldenAnzeige) {
        schuldenAnzeige.textContent = `Schulden: ${gameState.schulden}`;
    }

    if (bonusPoints) {
        bonusPoints.textContent = `Bonus: ${gameState.bonus}`;
    }
}

// --- AUTOMATISCHER LOGIN-CHECK ---
window.addEventListener("load", async () => {
    const res = await fetch('/CheckLogin');
    const data = await res.json();

    if (data.logged_in) {
        gameState.username = data.username;
        gameState.level = data.level;
        gameState.stamina = data.stamina;
        gameState.currentPos = data.currentPos || 0;      // Korrigiert
        gameState.schulden = data.roblocksSchulden || 0; // Korrigiert
        gameState.bonus = data.bonus;
        gameState.goalPos = data.goalPos;                  // Korrigiert

        if (data.specialTiles) { // Korrigiert
            gameState.special = JSON.parse(data.specialTiles); // Korrigiert
        }

        showGamePage();

        currentMap.style.display = "flex";
        playerLegend.style.display = "flex";
        schuldenAnzeige.style.display = "flex";
        bonusPoints.style.display = "flex";
        logoutLink.style.display = "flex";
    }
});

logoutLink.addEventListener('click', async () => {
    const abmeldungsBestätigung = confirm("Willst du wirklich raus gehen?");

    if (abmeldungsBestätigung) {
        const res = await fetch('/LogOut', { method: 'POST' });
        const data = await res.json();

        if (data.status === 'success') {
            location.reload();
        }
    }
});

function showGamePage() {
    loginPage.classList.remove('active', 'visible');
    loginPage.classList.add('hidden');

    gamePage.classList.remove('hidden');
    gamePage.classList.add('active', 'visible');
    document.getElementById('status-bar').classList.remove('hidden');

    updateUI();
    createGrid(100);
}

function showCustomAlert(Nachricht, styleKlasse) {
    alertText.textContent = Nachricht;
    universalAlert.className = "confirm-message " + styleKlasse;
    universalAlert.style.display = "block";
}

async function showEndScreen(result) {
    gamePage.classList.remove("active", "visible");
    gamePage.classList.add("hidden");

    leaderBoardContainer.classList.remove("hidden");
    leaderBoardContainer.classList.add("active", "visible");
}