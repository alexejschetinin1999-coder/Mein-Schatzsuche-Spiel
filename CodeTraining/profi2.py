from flask import Flask, session, render_template, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import os
from dotenv import load_dotenv
import uuid
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


@app.route("/check_user_login")
def check_user_login():
    user_id = session.get("user_id")

    if user_id is None:
        return jsonify({
            "loggedIn": False,
            "message": "no session" 
        })
    else:
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)
        except:
            print()
        finally:
            print()

        return jsonify({
            "loggedIn": True,
            "message": "in game"
        })


if __name__ == "__main__":
    app.run(debug=True, port=5000)