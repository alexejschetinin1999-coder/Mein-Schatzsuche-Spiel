const loginPfad = document.getElementById("login-pfad");
const gameStart = document.getElementById("game-start");

const loginScreen = document.getElementById("login-screen");
const loginBox = document.getElementById("login-box");
const loginLoader = document.getElementById("login-loader");

const googleButton = document.getElementById("google-button");
const facebookButton = document.getElementById("facebook-button");
const emailButton = document.getElementById("email-button");
const gastButton = document.getElementById("gast-button");


const overlayController = {

    overlay: loginScreen,
    box: loginBox,

    init() {
        this.overlay.addEventListener("click", () => {
            this.toggle();
        });

        // Klick in der Box → NICHT schließen
        this.box.addEventListener("click", (event) => {
            event.stopPropagation();
        });

        // Login-Button oben links → Overlay öffnen
        loginPfad.addEventListener("click", () => {
            this.toggle();
        });
    },

    toggle() {
        this.overlay.classList.toggle("hidden");
    }
};


const loaderController = {

    loader: loginLoader,

    show() {
        this.loader.classList.remove("hidden");
    },

    hide() {
        this.loader.classList.add("hidden");
    }
};


const loginController = {

    methods: {
        google:   { element: googleButton,   action: googleLogin },
        facebook: { element: facebookButton, action: facebookLogin },
        email:    { element: emailButton,    action: emailLogin },
        guest:    { element: gastButton,     action: gastLogin }
    },

    init() {
        Object.values(this.methods).forEach(method => {
            method.element.addEventListener("click", method.action);
        });
    }
};

gameStart.addEventListener("click", () => {
    checkUserExists();
});


async function checkUserExists() {

    loaderController.show();

    try {
        const response = await fetch("/check_login");
        const data = await response.json();

        if (data.loggedIn === true) {
            console.log("User ist eingeloggt:", data.username);
        } else {
            console.log("User ist nicht eingeloggt");
            overlayController.toggle();
        }

    } catch (err) {
        console.error("Fehler beim Login-Check:", err);
        overlayController.toggle();

    } finally {
        loaderController.hide();
    }
}

function googleLogin()  { console.log("Google Login gestartet"); }
function facebookLogin(){ console.log("Facebook Login gestartet"); }
function emailLogin()   { console.log("Email Login gestartet"); }
function gastLogin()    { console.log("Gast Login gestartet"); }

overlayController.init();
loginController.init();