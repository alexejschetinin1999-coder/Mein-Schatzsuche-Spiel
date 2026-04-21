from flask import Flask, session, render_template, request, jsonify
import mysql.connector
import random
from werkzeug.security import generate_password_hash, check_password_hash
import json

app = Flask(__name__)
app.secret_key = 'dein_ganz_geheimes_passwort'

db_config = {
    "host": "localhost",
    "user": "root",
    "password": "",
    "database": "projekt_beginn"
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# NEU: Die Hilfsfunktion, um doppelten Code zu vermeiden
def get_user_game_data(username):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    # Holt alle Spalten für den User
    cursor.execute("SELECT * FROM profi_nutzer WHERE username = %s", [username])
    user = cursor.fetchone()
    cursor.close()
    conn.close()
    return user

@app.route('/')
def index():
    username = session.get('user')
    if username:
        data = get_user_game_data(username)
        return render_template('profi.html', 
                               logged_in=True, 
                               username=data['username'],
                               level=data['current_map'], 
                               stamina=data['stamina'],
                               schulden=data['roblocks_schulden'],
                               bonus=data['bonus_points'])
    

    return render_template('profi.html', logged_in=False, level=1, stamina=15, schulden=0, bonus=0)

@app.route('/Register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"status": "error", "message": "Daten unvollständig"}), 400

    hashed_pw = generate_password_hash(password)

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        query = """
            INSERT INTO profi_nutzer 
            (username, password, stamina, current_pos, current_map, roblocks_schulden, last_position, bonus_points, game_state) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        cursor.execute(query, (username, hashed_pw, 15, 0, 1, 0, "0", 0, 'PLAYING'))
        conn.commit()

        cursor.execute("SELECT goal_pos, special_tiles FROM profi_maps WHERE map_id = 1")
        map_info = cursor.fetchone()

        session['user'] = username
        cursor.close()
        conn.close()

        return jsonify({
            "status": "success",
            "username": username,
            "level": 1,
            "stamina": 15,
            "roblocksSchulden": 0,
            "bonus": 0,
            "goalPos": map_info['goal_pos'] if map_info else 99,
            "specialTiles": map_info['special_tiles'] if map_info else '{"gold":[], "bombs":[], "chaos":[]}'
        })
    except mysql.connector.Error as err:
        print(err)
        return jsonify({"status": "error", "message": "Name bereits vergeben"}), 500

@app.route('/Login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM profi_nutzer WHERE username = %s", (username,))
        user_data = cursor.fetchone()

        if user_data and check_password_hash(user_data['password'], password):
            cursor.execute("SELECT goal_pos, special_tiles FROM profi_maps WHERE map_id = %s", [user_data['current_map']])
            map_info = cursor.fetchone()
            
            session['user'] = user_data['username']
            response = {
                "status": "success",
                "username": user_data['username'],
                "level": user_data['current_map'],
                "gameState": user_data['game_state'],
                "stamina": user_data['stamina'],
                "roblocksSchulden": user_data['roblocks_schulden'],
                "bonus": user_data['bonus_points'],
                "lastPos": user_data['current_pos'],
                "goalPos": map_info['goal_pos'] if map_info else 0,
                "specialTiles": map_info['special_tiles'] if map_info else '{"gold":[], "bombs":[], "chaos":[]}'
            }
            cursor.close()
            conn.close()
            return jsonify(response)
        
        return jsonify({"status": "error", "message": "Login fehlgeschlagen"}), 401
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/Move', methods=['POST'])
def move():
    data = request.json
    pos = int(data.get('position'))
    map_id = int(data.get('map_id'))
    username = session.get('user')

    if not username:
        return jsonify({"status": "error", "message": "Nicht eingeloggt"}), 401

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM profi_maps WHERE map_id = %s", [map_id])
    map_daten = cursor.fetchone()
    cursor.execute("SELECT * FROM profi_nutzer WHERE username = %s", [username])
    user_daten = cursor.fetchone()

    special = json.loads(map_daten['special_tiles'])
    
    # --- LOGIK RECHNUNG ---
    stamina_change = -1 # Grundkosten
    event_name = "move"
    level_up = map_id
    bonus_zuwachs = 0
    echte_schulden = 0
    neue_start_pos = pos
    neue_goal_pos = map_daten['goal_pos']
    neue_tiles = map_daten['special_tiles']
    still_playing = user_daten['game_state']

    # 1. Zuerst prüfen: Ist er auf dem Ziel gelandet? (Damit er den Bonus kriegt!)
    if pos == map_daten['goal_pos']:
        event_name = "goal"
        level_up = map_id + 1
        bonus_zuwachs = user_daten['stamina'] # Dein Bonus!
        stamina_change = (15 - user_daten['stamina']) 
        neu_stamina = 15 # Direkt auf 15 setzen

        cursor.execute("SELECT start_pos, goal_pos, special_tiles FROM profi_maps WHERE map_id = %s", [level_up])
        next_map = cursor.fetchone()
        if next_map:
            pos = next_map['start_pos']
            neue_start_pos = pos
            neue_goal_pos = next_map['goal_pos']
            neue_tiles = next_map['special_tiles']

    # 2. Wenn nicht Ziel, hat er vielleicht keine Energie mehr?
    elif (user_daten['stamina'] + stamina_change) < 0:
        event_name = "SchuldenKonto"
        echte_schulden = abs(user_daten['stamina'] + stamina_change)
        level_up = map_id + 1
        neu_stamina = 15

        cursor.execute("SELECT start_pos, goal_pos, special_tiles FROM profi_maps WHERE map_id = %s", [level_up])
        next_map = cursor.fetchone()
        if next_map:
            pos = next_map['start_pos']
            neue_start_pos = pos
            neue_goal_pos = next_map['goal_pos']
            neue_tiles = next_map['special_tiles']

    # 3. Wenn weder Ziel noch Schulden, dann Spezialfelder prüfen
    elif pos in special.get('gold', []):
        stamina_change += 5
        event_name = "boost"
    elif pos in special.get('bombs', []):
        stamina_change += -5
        event_name = "bombe"
    elif pos in special.get('chaos', []):
        effekt = random.choice([5, -5])
        stamina_change += effekt
        event_name = "chaos"

    if event_name not in ["goal", "SchuldenKonto"]:
        neu_stamina = user_daten['stamina'] + stamina_change

    if level_up > 10:
        event_name = "game_break"
        still_playing = 'FINISHED'
        level_up = 10

    update_sql = """
        UPDATE profi_nutzer 
        SET stamina = %s, current_map = %s, roblocks_schulden = roblocks_schulden + %s, 
        bonus_points = bonus_points + %s, current_pos = %s, game_state = %s
        WHERE username = %s
    """

    cursor.execute(update_sql, [neu_stamina, level_up, echte_schulden, bonus_zuwachs, pos, username])
    conn.commit()

    cursor.execute("SELECT bonus_points, roblocks_schulden FROM profi_nutzer WHERE username = %s", [username])
    aktueller_stand = cursor.fetchone()
    
    finaler_bonus = aktueller_stand['bonus_points']
    finale_schulden = aktueller_stand['roblocks_schulden']

    cursor.close()
    conn.close()

    return jsonify({
        "status": "success",
        "newStamina": neu_stamina,
        "event": event_name,
        "newLevel": level_up,
        "gameState": still_playing,
        "newBeginn": neue_start_pos,
        "newQuest": neue_goal_pos,
        "newField": neue_tiles,
        "change": stamina_change,
        "newDebt": finale_schulden,
        "newBonus": finaler_bonus
    })

@app.route('/CheckLogin')
def check_login():
    if 'user' in session:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM profi_nutzer WHERE username = %s", [session['user']])
        ergebnis = cursor.fetchone()

        if ergebnis:
            cursor.execute("SELECT goal_pos, special_tiles FROM profi_maps WHERE map_id = %s", [ergebnis['current_map']])
            map_info = cursor.fetchone()
            
            response = {
                "logged_in": True,
                "username": ergebnis['username'],
                "level": ergebnis['current_map'],
                "stamina": ergebnis['stamina'],
                "gameState": ergebnis['game_state'],
                "roblocksSchulden": ergebnis['roblocks_schulden'],
                "bonus": ergebnis['bonus_points'],
                "currentPos": ergebnis['current_pos'],
                "goalPos": map_info['goal_pos'] if map_info else 0,
                "specialTiles": map_info['special_tiles'] if map_info else '{"gold":[], "bombs":[], "chaos":[]}'
            }
            cursor.close()
            conn.close()
            return jsonify(response)
            
    return jsonify({"logged_in": False})

@app.route('/LogOut', methods=['POST'])
def log_out():
    session.clear()
    return jsonify({"status": "success"})

if __name__ == '__main__':
    app.run(debug=True, port=5000)