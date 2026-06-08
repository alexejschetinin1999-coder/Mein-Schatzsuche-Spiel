const loginPfad = document.getElementById("login-pfad");
const gameStart = document.getElementById("game-start");

const loginScreen = document.getElementById("login-screen");
const loginBox = document.getElementById("login-box");
const loginLoader = document.getElementById("login-loader");

const googleButton = document.getElementById("google-button");
const facebookButton = document.getElementById("facebook-button");
const emailButton = document.getElementById("email-button");
const gastButton = document.getElementById("gast-button");

const startMessenger = document.getElementById("start-messenger");
const loaderText = document.getElementById("loader-text");
const spinner = document.getElementById("spinner");


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


const loaderTextController = {
    
    message: startMessenger,

    show() {
        this.message.classList.remove("hidden");
    },

    hide() {
        this.message.classList.add("hidden");
    }
};


gameStart.addEventListener("click", () => {
    checkUserExists();
});


async function checkUserExists() {

    console.log("Gast Login gestartet"); 
    loaderTextController.show();
    loaderController.show();

    try {
        const response = await fetch("/login_guest", { method: "POST" });
        const data = await response.json();

        loaderTextController.hide();
        loaderController.hide();

        if (data.loggedIn) {
            console.log("User ID:", data.user_id);
            // Weiterleitung oder Overlay schließen
        }

    } catch (err) {
        loaderTextController.hide();
        loaderController.hide();
        console.error("Fehler beim Gast-Login:", err);
    }
}

async function googleLogin() { 
    console.log("Google Login gestartet");
    
    fetch("/login_google", { method: "POST" })
}

async function facebookLogin() { 
    console.log("Facebook Login gestartet"); 

    fetch("/login_facebook", { method: "POST" })
}

async function emailLogin() { 
    console.log("Email Login gestartet"); 

    fetch("/login_guest", { method: "POST" })
}

async function gastLogin() { 
    console.log("Gast Login gestartet"); 
    loaderTextController.show();

    fetch("/login_guest", { method: "POST" })
}

overlayController.init();
loginController.init();