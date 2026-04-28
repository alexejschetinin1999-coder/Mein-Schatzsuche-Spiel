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
const scoreRow = document.querySelector(".score-row");
const userNamePlate = document.querySelector(".user-name-plate");
const barContainer = document.querySelector(".bar-container");
const schuldenFill = document.getElementById("schulden-fill");
const schuldenText = document.getElementById("schulden-text");
const progressFill = document.querySelectorAll(".progress-fill");
const progressText = document.querySelectorAll(".progress-text");
const bonusFill = document.getElementById("bonus-fill");
const bonusText = document.getElementById("bonus-text");

const userDetails = {
    username: 'Gast',
    level: 1,
    stamina: 15,
    currentPos: 0,
    goalPos: 0,
    schulden: 0,
    bonus: 0,
    gameState: 'PLAYING',
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
        userDetails.username = data.username;
        userDetails.level = data.level;
        userDetails.stamina = data.stamina;
        userDetails.goalPos = data.goalPos; 
        userDetails.currentPos = 0;
        userDetails.schulden = 0;
        userDetails.bonus = data.bonus;
        
        if (data.specialTiles) {
            userDetails.special = JSON.parse(data.specialTiles); 
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
        userDetails.username = data.username;
        userDetails.level = data.level;
        userDetails.stamina = data.stamina;
        userDetails.schulden = data.roblocksSchulden; 
        userDetails.bonus = data.bonus;
        userDetails.currentPos = data.lastPos || 0; 
        userDetails.goalPos = data.goalPos;
        userDetails.gameState = data.gameState;       
        
        if (data.specialTiles) { 
            userDetails.special = JSON.parse(data.specialTiles);
        }
        
        if (data.gameState === 'FINISHED') {
            showEndScreen(data);
        } else {
            showGamePage();
        
            currentMap.style.display = "flex";
            playerLegend.style.display = "flex";
            schuldenAnzeige.style.display = "flex";
            bonusPoints.style.display = "flex";
            logoutLink.style.display = "flex";
        }
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
        
        if (i === userDetails.currentPos) {
            tile.querySelector('.tile-gelenk').classList.add('is-flipped');
            const back = tile.querySelector('.tile-back');
            back.textContent = 'START';
            back.style.background = 'red';
            back.style.color = 'white';
        }
        
        if (i === userDetails.goalPos) {
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

    if (tile.querySelector('.is-flipped') && pos !== userDetails.goalPos) return;

    const diff = Math.abs(pos - userDetails.currentPos);

    if (diff === 1 || diff === 10) {

        if (diff === 1) {
            const oldRow = Math.floor(userDetails.currentPos / 10);
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

    const result = await apiPost('/Move', { position: pos, map_id: userDetails.level });

    if (result && result.status === 'success') {
        if (result.userDetails === 'FINISHED') {
            showEndScreen(result);
            return;
        }

        console.log("Server Antwort:", result);
        userDetails.stamina = result.newStamina; 
        userDetails.bonus = result.newBonus;     
        userDetails.currentPos = pos;

        tile.querySelector('.tile-gelenk').classList.add('is-flipped'); 
        updateUI();

        if (result.event === "goal") {
            alert("Ziel erreicht! Willkommen in Level " + result.newLevel);

            userDetails.level = result.newLevel;     
            userDetails.currentPos = result.newBeginn;
            userDetails.goalPos = result.newQuest;    

            let NewSpecialTiles = JSON.parse(result.newField);

            userDetails.special = NewSpecialTiles;
            updateUI();
            createGrid(100);
        } else if (result.event === "SchuldenKonto") {

            alert(`Energie leer! Du hast ${result.newDebt} Schulden gemacht.`); 
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
    document.getElementById('player-legend').textContent = `Energie: ${userDetails.stamina}`;
    document.getElementById('current-map').textContent = `Map: ${userDetails.level}`;
    document.getElementById('user-login-screen').textContent = userDetails.username;

    if (schuldenAnzeige) {
        schuldenAnzeige.textContent = `Schulden: ${userDetails.schulden}`;
    }

    if (bonusPoints) {
        bonusPoints.textContent = `Bonus: ${userDetails.bonus}`;
    }
}

// --- AUTOMATISCHER LOGIN-CHECK ---
window.addEventListener("load", async () => {
    const res = await fetch('/CheckLogin');
    const data = await res.json();

    if (data.logged_in) {
        userDetails.username = data.username;
        userDetails.level = data.level;
        userDetails.stamina = data.stamina;
        userDetails.currentPos = data.currentPos || 0;     
        userDetails.schulden = data.roblocksSchulden || 0;
        userDetails.bonus = data.bonus;
        userDetails.goalPos = data.goalPos;                  
        userDetails.gameState = data.gameState;

        if (data.specialTiles) {
            userDetails.special = JSON.parse(data.specialTiles);
        }

        if (userDetails.gameState === 'FINISHED') {
            showEndScreen(data);
        } else {
            showGamePage();

            currentMap.style.display = "flex";
            playerLegend.style.display = "flex";
            schuldenAnzeige.style.display = "flex";
            bonusPoints.style.display = "flex";
            logoutLink.style.display = "flex";
        }
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
    const statusBar = document.getElementById("status-bar");

    gamePage.classList.remove("active", "visible");
    gamePage.classList.add("hidden");

    leaderBoardContainer.classList.remove("hidden");
    leaderBoardContainer.classList.add("active", "visible");

    renderLeaderboard(result);
}

async function renderLeaderboard(data) {
    userLoginInScreen.textContent = data.username;
    userPreviewName.textContent = `Willkommen zu deiner Bilanz, Spieler ${data.username}.`;

    const liste = result.top_scores;

    liste.forEach(spieler => {
        const spielerDiv = document.createElement("div");
        spielerDiv.className = "player-entry";

        spielerDiv.innerHTML = `
            <span>${spieler.username}</span>

            <div class="bar-container">
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                    <span class="progress-text">${spieler.schulden} Schulden</span>
                </div>
                <br>
                <div class="progress-bar">
                    <div class="progress-fill"></div>
                    <span class="progress-text">${spieler.bonus} Bonus</span>
                </div>
            </div>
        `;

        scoreRow.appendChild(spielerDiv);
    });
}