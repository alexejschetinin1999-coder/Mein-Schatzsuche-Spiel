const UI = {
    loginPfad: document.getElementById("login-pfad"),
    accountChangePfad: document.getElementById("account-change-pfad"),

    gameStart: document.getElementById("game-start"),

    loginScreen: document.getElementById("login-screen"),
    loginBox: document.getElementById("login-box"),
    registrierenRemarker: document.getElementById("registrieren-remarker"),
    googleButton: document.getElementById("google-button"),
    facebookButton: document.getElementById("facebook-button"),
    emailButton: document.getElementById("email-button"),

    guestButton: document.getElementById("guest-button"),

    startMessenger: document.getElementById("start-messenger"),
    spinner: document.getElementById("spinner")
}


UI.gameStart.addEventListener("click", () => {
    gameStarterController();
});

async function gameStarterController() {
    try {
        const response = await fetch("/check_user_login");    
        
        const result = await response.json();
        console.log(result);
    } catch (error) {
        console.log(error.message);
    } finally {
        
    }
}