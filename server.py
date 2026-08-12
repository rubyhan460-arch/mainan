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
        groq_key = data.get('groq_key', '').strip()
        gemini_key = data.get('gemini_key', '').strip()
        if groq_key:
            set_config('groq_api_key', groq_key)
        if gemini_key:
            set_config('gemini_api_key', gemini_key)
        return jsonify({"status": "success"})
    else:
        cfg = get_config()
        groq_key = cfg.get('groq_api_key', '')
        gemini_key = cfg.get('gemini_api_key', '')
        colab_url = cfg.get('colab_gpu_url', '')
        return jsonify({
            "has_groq_key": bool(groq_key),
            "groq_preview": groq_key[:8] + '...' if groq_key else '',
            "has_gemini_key": bool(gemini_key),
            "gemini_preview": gemini_key[:8] + '...' if gemini_key else '',
            "colab_gpu_url": colab_url
        })

@app.route('/api/colab_gpu', methods=['GET', 'POST'])
def api_manage_colab_gpu():
    if request.method == 'POST':
        data = request.get_json() or {}
        colab_url = data.get('colab_url', '').strip()
        set_config('colab_gpu_url', colab_url)
        return jsonify({"status": "success", "colab_url": colab_url})
    else:
        cfg = get_config()
        return jsonify({"colab_url": cfg.get('colab_gpu_url', '')})

@app.route('/api/generate_lora_image', methods=['POST'])
def api_generate_lora_image():
    data = request.get_json() or {}
    char_id = data.get('char_id', 'char')
    prompt = data.get('prompt', '')
    
    cfg = get_config()
    colab_url = cfg.get('colab_gpu_url', '').strip().rstrip('/')
    
    if not colab_url:
        return jsonify({"status": "no_colab", "message": "Colab GPU not configured"}), 400
        
    try:
        req_url = f"{colab_url}/generate"
        payload = json.dumps({"char_id": char_id, "prompt": prompt}).encode('utf-8')
        headers = {
            "Content-Type": "application/json",
            "Bypass-Tunnel-Remainder": "1",
            "bypass-tunnel-reminder": "1",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
        }
        req = urllib.request.Request(req_url, data=payload, headers=headers, method="POST")
        # Hard 10-second timeout so app never hangs
        with urllib.request.urlopen(req, timeout=10) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            return jsonify(res_data)
    except Exception as e:
        print(f"Colab GPU Proxy Error / Timeout: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("\n=======================================================")
    print(" CHARACTER AI WEB APP - STARTING LOCAL FLASK SERVER")
    print(" Open in browser: http://localhost:5000")
    print("=======================================================\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
