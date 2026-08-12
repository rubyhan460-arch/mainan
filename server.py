import os
import sys
import json
import sqlite3
from flask import Flask, render_template, request, jsonify, send_from_directory

# Import functions and constants from app.py
from app import (
    DB_PATH,
    CHARACTERS_DIR,
    CONFIG_FILE,
    init_db,
    load_characters,
    get_all_facts,
    get_affinity,
    update_affinity,
    save_chat_message,
    get_recent_history,
    clear_chat_history,
    get_config,
    set_config,
    generate_response
)

app = Flask(__name__)

# Initialize Database on server startup
init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/gambarkarakter/<path:filename>')
def serve_gambarkarakter(filename):
    return send_from_directory('gambarkarakter', filename)

@app.route('/api/characters', methods=['GET'])
def api_get_characters():
    characters = load_characters()
    result = []
    for c in characters:
        char_id = c.get('id', 'default')
        c_copy = dict(c)
        c_copy['current_affinity'] = get_affinity(char_id)
        result.append(c_copy)
    return jsonify(result)

@app.route('/api/history/<char_id>', methods=['GET'])
def api_get_history(char_id):
    limit = request.args.get('limit', 30, type=int)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, sender, message, timestamp FROM chat_history 
        WHERE character_id = ? 
        ORDER BY id ASC LIMIT ?
    ''', (char_id, limit))
    rows = cursor.fetchall()
    conn.close()
    
    history = []
    for row in rows:
        history.append({
            "id": row[0],
            "sender": row[1],
            "message": row[2],
            "timestamp": row[3]
        })
    return jsonify(history)

@app.route('/api/chat', methods=['POST'])
def api_chat():
    data = request.get_json() or {}
    char_id = data.get('char_id')
    user_input = data.get('message', '').strip()
    
    if not char_id or not user_input:
        return jsonify({"error": "Missing character ID or message"}), 400

    characters = load_characters()
    active_char = next((c for c in characters if c.get('id') == char_id), None)
    if not active_char:
        return jsonify({"error": "Character not found"}), 404

    char_name = active_char.get('name', 'Bot')
    
    # Save User message to SQLite DB
    save_chat_message(char_id, "User", user_input)
    
    # Generate LLM response
    response_text = generate_response(active_char, user_input)
    
    # Save Assistant response to SQLite DB
    save_chat_message(char_id, char_name, response_text)
    
    # Updated affinity score & facts
    updated_affinity = get_affinity(char_id)
    all_facts = get_all_facts()
    
    return jsonify({
        "status": "success",
        "char_id": char_id,
        "sender": char_name,
        "message": response_text,
        "affinity_score": updated_affinity,
        "facts": all_facts
    })

@app.route('/api/clear/<char_id>', methods=['POST'])
def api_clear_history(char_id):
    clear_chat_history(char_id)
    return jsonify({"status": "success", "message": f"History cleared for {char_id}"})

@app.route('/api/facts', methods=['GET'])
def api_get_facts():
    facts = get_all_facts()
    return jsonify(facts)

@app.route('/api/key', methods=['GET', 'POST'])
def api_manage_key():
    if request.method == 'POST':
        data = request.get_json() or {}
        key = data.get('key', '').strip()
        set_config('groq_api_key', key)
        return jsonify({"status": "success", "has_key": bool(key)})
    else:
        cfg = get_config()
        has_key = bool(cfg.get('groq_api_key'))
        key_preview = cfg.get('groq_api_key', '')[:8] + '...' if has_key else ''
        return jsonify({"has_key": has_key, "key_preview": key_preview})

if __name__ == '__main__':
    print("\n=======================================================")
    print(" CHARACTER AI WEB APP - STARTING LOCAL FLASK SERVER")
    print(" Open in browser: http://localhost:5000")
    print("=======================================================\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
