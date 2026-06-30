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

const minTime = 1500;

const loader = {
    element: UI.startMessenger,

    show() {
        this.element.classList.remove("hidden");
    },

    hide() {
        this.element.classList.add("hidden");
    }
};


function startGame() {
    loader.show();
    const startTime = Date.now();
    gameStarterController(startTime);
}

UI.gameStart.addEventListener("click", startGame);

async function gameStarterController(startTime) {
    const response = await fetch("/check_user_login");
    const result = await response.json();

    finishLoaderTiming(startTime);
    handleLoginResult(result);
}


function handleLoginResult(result) {
    if (result.loggedIn === true) {

    }

    else if (result.loggedIn === false) {
        UI.loginScreen.classList.remove("hidden");
        UI.loginBox.classList.remove("hidden");
    }

    else if (result.error === true) {
        alert("Es ist ein Fehler aufgetreten.");
    }
}


async function googleLogin() {
    const loginRoute = await fetch("/create_account_google");
    const googleRoute = await loginRoute.json();
}

async function facebookLogin() {
    const loginRoute = await fetch("/create_account_facebook");
    const facebookRoute = await loginRoute.json();   
}

async function emailLogin() {
    const loginRoute = await fetch("/create_account_email");
    const emailRoute = await loginRoute.json();
}

async function guestLogin() {
    const loginRoute = await fetch("/create_account_guest");
    const guestRoute = await loginRoute.json();
}


function finishLoaderTiming(startTime) {
    const waitTime = Date.now() - startTime;
    const restTime = minTime - waitTime;

    if (restTime <= 0) {
        loader.hide();
    } else {
        setTimeout(() => loader.hide(), restTime);
    }
}