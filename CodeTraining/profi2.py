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

            search_in_sql = "SELECT * FROM game_users WHERE id = %s"
            
            cursor.execute(search_in_sql, (user_id,))
            player = cursor.fetchone()

            if player is None:
                session.pop("user_id", None)
                return jsonify({
                    "loggedIn": False,
                    "message": "invalid session" 
                })
            else:
                return jsonify({
                    "loggedIn": True,
                    "message": "in game"
                })
        except Exception as e:
                print(e)

                return jsonify({
                    "error": True,
                    "message": "no connection"
                })
        finally:
            try:
                cursor.close()
            except NameError:
                pass 

            try:
                conn.close()
            except NameError:
                pass


def create_account():
    print()


if __name__ == "__main__":
    app.run(debug=True, port=5000)