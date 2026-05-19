from flask import Flask, session, render_template, request, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
app.secret_key = 'dein_ganz_geheimes_passwort'

def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="charakter_arena"
    )

@app.route('/')
def index():
    return render_template('profi2.html')

@app.route('/check_Login')
def Check_Login():
    user_id = session.get("user_id")

    if not user_id:
        return jsonify({"loggedIn": False})

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT id, username FROM users WHERE id = %s", (user_id,))
    user = cursor.fetchone()

    cursor.close()
    conn.close()

    if not user:
        session.pop("user_id", None)
        return jsonify({"loggedIn": False})
    
    return jsonify({
        "loggedIn": True,
        "username": user["username"]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)