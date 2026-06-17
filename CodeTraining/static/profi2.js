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


const loader = {
    element: UI.startMessenger,

    show() {
        this.element.classList.remove("hidden");
    },

    hide() {
        this.element.classList.add("hidden");
    }
};


UI.gameStart.addEventListener("click", () => {
    loader.show();
    gameStarterController();
});


async function gameStarterController() {
    const response = await fetch("/check_user_login");    
        
    const result = await response.json();
    console.log(result);

    if (result.loggedIn === true) {

    } else if (result.loggedIn === false) {

    } else if (result.error === true) {

    }

    loader.hide();
}