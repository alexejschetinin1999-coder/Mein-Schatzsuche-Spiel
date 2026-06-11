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

a
@app.route("/")
def index():
    return render_template("profi2.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)