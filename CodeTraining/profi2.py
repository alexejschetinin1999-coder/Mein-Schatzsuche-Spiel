from flask import Flask, session, render_template, request, jsonify
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
app.secret_key = 'dein_ganz_geheimes_passwort'

# --- Datenbankverbindung ---
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="monster_arena"
    )

# --- Startseite laden ---
@app.route('/')
def index():
    return render_template('profi2.html')

if __name__ == '__main__':
    app.run(debug=True, port=5000)