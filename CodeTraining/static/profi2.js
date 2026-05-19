const loginPfad = document.getElementById("login-pfad");
const accountChangePfad = document.getElementById("account-change-pfad");
const gameStart = document.getElementById("game-start");
const loginScreen = document.getElementById("login-screen");

gameStart.addEventListener("click", () => {
    checkUserExsits();
});

async function checkUserExsits() {
    const response = await fetch("/check_Login");
    const data = await response.json();

    if (data.loggedIn === true) {
        console.log("User ist eingeloggt", data.username);
    } else {
        console.log("User ist nicht eingeloggt");
        loginScreen.style.display = "block";
    }
}