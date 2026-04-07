const CurrentMap = document.getElementById("CurrentMap");
const PlayerLegend = document.getElementById("PlayerLegend");
const SchuldenAnzeige = document.getElementById("SchuldenAnzeige");
const BonusPoints = document.getElementById("BonusPoints");
const UserLoginInScreen = document.getElementById("UserLogInScreen");
const LogoutLink = document.getElementById("LogoutLink");
const overlay = document.querySelector('.overlay');

const gameState = {
    username: 'Gast',
    level: 1,
    stamina: 15,
    currentPos: 0,
    goal_pos: 0,
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
    const GoBack = document.getElementById("GoBack");

    if (e.target === CardModal) {
        e.stopPropagation();
    }
    
    if (e.target === overlay || e.target === GoBack) {
        overlay.style.display = "none";
    }
});

document.getElementById('RegisterLink').addEventListener('click', () => {
    overlay.style.display = "flex";
});

document.getElementById('JoinAccount').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('CreateUser').value;
    const password = document.getElementById('CreateLogin').value;

    const data = await apiPost('/Register', {
        username: username,
        password: password
    });

    if (data && data.status === 'success') {
        alert("Deine Account wurde erfolgreich erstellt.");

        gameState.username = data.username;
        gameState.level = data.level;
        gameState.stamina = data.stamina;
        gameState.goal_pos = data.goal_pos; 
        gameState.currentPos = 0;
        gameState.schulden = 0;
        gameState.bonus = data.bonus;

        if (data.special_tiles) {
            gameState.special = JSON.parse(data.special_tiles)
        }

        overlay.style.display = "none";

        showGamePage();

        CurrentMap.style.display = "flex";
        PlayerLegend.style.display = "flex";
        SchuldenAnzeige.style.display = "flex";
        BonusPoints.style.display = "flex";
        LogoutLink.style.display = "flex"; 
    } else {
        alert("Fehler: " + (data.message || "Name schon vergeben?"));
    }
});

document.getElementById('Formular').addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById('UserName').value,
        password: document.getElementById('UserLogin').value
    };

    const data = await apiPost('/Login', payload);
    if (data && data.status === 'success') {
        gameState.username = data.username;
        gameState.level = data.level;
        gameState.stamina = data.stamina;
        gameState.schulden = data.roblocks_schulden;
        gameState.bonus = data.bonus;
        gameState.currentPos = data.last_pos || 0;
        gameState.goal_pos = data.goal_pos;

        if (data.special_tiles) {
            gameState.special = JSON.parse(data.special_tiles);
        }
        
        showGamePage(); // Helferfunktion zum Seitenwechsel

        CurrentMap.style.display = "flex";
        PlayerLegend.style.display = "flex";
        SchuldenAnzeige.style.display = "flex";
        BonusPoints.style.display = "flex";
        LogoutLink.style.display = "flex"; 
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
        tile.className = 'tileContainer';
        tile.dataset.index = i;

        tile.innerHTML = `
            <div class="tileGelenk">
                <div class="tileFront">${i}</div>
                <div class="tileBack">?</div>
            </div>
        `;

        if (i === gameState.currentPos) {
            tile.querySelector('.tileGelenk').classList.add('is-flipped');
            const back = tile.querySelector('.tileBack');
            back.textContent = 'START';
            back.style.background = 'red';
            back.style.color = 'white';
        }

        if (i === gameState.goal_pos) {
            tile.querySelector('.tileGelenk').classList.add('is-flipped');
            const back = tile.querySelector('.tileBack');
            back.textContent = 'ZIEL';
            back.style.background = 'yellow';
        }
 
        grid.appendChild(tile);
    }
}

// --- GAME LOGIK (KLICK) ---
document.getElementById('game-grid').addEventListener('click', async (e) => {
    const tile = e.target.closest('.tileContainer');
    if (!tile || tile.querySelector('.is-flipped')) return;

    const pos = parseInt(tile.dataset.index);
    
    // Distanz-Check
    const diff = Math.abs(pos - gameState.currentPos);
    if (diff !== 1 && diff !== 10) {
        alert("Nur angrenzende Felder!");
        return;
    }

    const result = await apiPost('/Move', { position: pos, map_id: gameState.level });
    
    if (result && result.status === 'success') {
        // WICHTIG: Python schickt "NewStamina", JS muss es annehmen
        gameState.stamina = result.NewStamina; 
        gameState.currentPos = pos;
        
        // UI Update
        tile.querySelector('.tileGelenk').classList.add('is-flipped');
        updateUI();

        // Event-Handling
        if (result.event === "goal") {
            alert("Ziel erreicht! Willkommen in Level " + result.new_level);
            
            gameState.level = result.new_level;
            gameState.currentPos = result.new_beginn;
            gameState.goal_pos = result.new_quest;

            let NewSpecialTiles = JSON.parse(result.new_field);
            gameState.special = NewSpecialTiles;

            updateUI();
            createGrid(100);
        } else if (result.event === "SchuldenKonto") {
            alert(`Energie leer! Du hast ${result.new_debt} Schulden gemacht.`);
            location.reload(); // Reload um Energie & Level zu aktualisieren
        } else if (result.event === "boost") {
            alert("Du hast ein Koffe/Energy drink bekommen. Du hast jetzt + 5 Züge.");
        } else if (result.event === "bombe") {
            alert("Du bist auf einer Bombe gestoßen. Jetzt hast du auf grund eines streif" + 
                "schussen - 5 Züge weniger.");
        } else if (result.event === "chaos") {
            alert("Du bist auf einer Stadt getroffen, Da nicht sicher sein kannst ob die dir" + 
                "helfen oder nicht. Kannst du entweder 5 Züge +/- bekommen.");
        }
    }
});

function updateUI() {
    document.getElementById('PlayerLegend').textContent = `Energie: ${gameState.stamina}`;
    document.getElementById('CurrentMap').textContent = `Map: ${gameState.level}`;
    document.getElementById('UserLoginInScreen').textContent = gameState.username;
    
    if (SchuldenAnzeige) {
        SchuldenAnzeige.textContent = `Schulden: ${gameState.schulden}`;
    }

    if (BonusPoints) {
        BonusPoints.textContent = `Bonus: ${gameState.bonus}`;
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
        // Hier müsste das Backend eigentlich auch last_pos mitschicken!
        gameState.currentPos = data.current_pos || 0; 
        gameState.schulden = data.roblocks_schulden || 0;
        gameState.bonus = data.bonus;
        gameState.goal_pos = data.goal_pos;

        if (data.special_tiles) {
            gameState.special = JSON.parse(data.special_tiles);
        }

        showGamePage();

        CurrentMap.style.display = "flex";
        PlayerLegend.style.display = "flex";
        SchuldenAnzeige.style.display = "flex";
        BonusPoints.style.display = "flex";
        LogoutLink.style.display = "flex";
    }
});

// Logout-Funktion hinzufügen
document.getElementById('LogoutLink').addEventListener('click', async () => {
    const AbmeldungsBestätigung = confirm("Willst du wirklich raus gehen?");
        
    if (AbmeldungsBestätigung) {
        const res = await fetch('/LogOut', { method: 'POST' });
        const data = await res.json();

        if (data.status === 'success') {
            location.reload(); 
        }
    }
});

function showGamePage() {
    // Login verstecken
    const loginPage = document.getElementById('page-login');
    loginPage.classList.remove('active', 'visible');
    loginPage.classList.add('hidden');

    // Spiel zeigen
    const gamePage = document.getElementById('page-game');
    gamePage.classList.remove('hidden');
    gamePage.classList.add('active', 'visible');

    // Status-Elemente zeigen (Das ersetzt das manuelle .style.display = "flex")
    document.getElementById('status-bar').classList.remove('hidden');

    updateUI();
    createGrid(100);
}