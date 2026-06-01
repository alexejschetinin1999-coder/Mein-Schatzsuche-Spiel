from flask import Flask, session, render_template, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "dev_only_change_me")
db_pass = os.getenv("DB_PASSWORD")


def get_db_connection():
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password=db_pass,
        database="charakter_arena"
    )
    return conn


@app.route("/")
def index():
    return render_template("profi2.html")


@app.route("/check_login")
def check_login():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"loggedIn": False})

    conn = None
    cursor = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute(
            "SELECT id, username FROM users WHERE id = %s",
            (user_id,)
        )
        user = cursor.fetchone()
    except Exception as e:
        print("DB-Fehler:", e)
        return jsonify({"loggedIn": False, "error": "DB_Fehler"})
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

    if not user:
        session.pop("user_id", None)
        return jsonify({"loggedIn": False})

    return jsonify({
        "loggedIn": True,
        "username": user["username"]
    })

@app.route("/login_google", methods=["POST"])
def login_google():
    print()

@app.route("/login_facebook", methods=["POST"])
def login_facebook():
    print()

@app.route("/login_email", methods=["POST"])
def login_email():
    print()

@app.route("/login_guest", methods=["POST"])
def login_guest():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM game_users WHERE guest_id = %s", (guest_id,))
    user = cursor.fetchone()

    if not user:
        cursor.execute("INSERT INTO game_users (guest_id) VALUES (%s)", (guest_id,))
        conn.commit()

        cursor.execute("SELECT * FROM game_users WHERE guest_id = %s", (guest_id,))
        user = cursor.fetchone()
        session["user_id"] = user["id"]

    return jsonify({
        "loggedIn": True,
        "user_id": user["id"]
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)