const loginPfad = document.getElementById("login-pfad");
const accountChangePfad = document.getElementById("account-change-pfad");
const gameStart = document.getElementById("game-start");
const loginScreen = document.getElementById("login-screen");
const loginLoader = document.getElementById("login-loader");

const googleButton = document.getElementById("google-button");
const facebookButton = document.getElementById("facebook-button");
const emailButton = document.getElementById("email-button");

function openLoginOverlay() {
    loginScreen.classList.remove("hidden");
}

function closeLoginOverlay() {
    loginScreen.classList.add("hidden");
}

function showLoader() {
    loginLoader.classList.remove("hidden");
}

function hideLoader() {
    loginLoader.classList.add("hidden");
}

gameStart.addEventListener("click", () => {
    checkUserExists();
});

loginPfad.addEventListener("click", () => {
    openLoginOverlay();
});

loginScreen.addEventListener("click", () => {
    closeLoginOverlay();
});

async function checkUserExists() {
    showLoader();
    try {
        const response = await fetch("/check_login");
        const data = await response.json();

        if (data.loggedIn === true) {
            console.log("User ist eingeloggt:", data.username);
            // hier später: weiter ins Spiel
        } else {
            console.log("User ist nicht eingeloggt");
            openLoginOverlay();
        }
    } catch (err) {
        console.error("Fehler beim Login-Check:", err);
        openLoginOverlay();
    } finally {
        hideLoader();
    }
}

// Platzhalter für spätere Aktionen
googleButton.addEventListener("click", () => {
    console.log("Google-Login geklickt");
});

facebookButton.addEventListener("click", () => {
    console.log("Facebook-Login geklickt");
});

emailButton.addEventListener("click", () => {
    console.log("E-Mail-Login geklickt");
});