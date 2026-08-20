import os
import sys
import json
import re
import sqlite3
import random
import socket
import urllib.request
import urllib.parse
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
    set_affinity,
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

# --- DATASET INDEX CACHE ---
DATASET_INDEX_PATH = os.path.join(os.path.dirname(__file__), 'dataset', 'dataset_index.json')
dataset_cache = {}

def get_character_dataset(char_id):
    global dataset_cache
    if not dataset_cache and os.path.exists(DATASET_INDEX_PATH):
        try:
            with open(DATASET_INDEX_PATH, 'r', encoding='utf-8') as f:
                dataset_cache = json.load(f).get('characters', {})
        except Exception as e:
            print("Error loading dataset index:", e)
    return dataset_cache.get(char_id, [])

# Comprehensive Dictionary: Indonesian & English keywords -> Danbooru tags
SYNONYM_TAGS = {
    # Outfits & Costumes
    "bikini": ["bikini", "swimsuit", "two-piece_swimsuit", "side-tie_bikini_bottom", "micro_bikini", "string_bikini", "cleavage"],
    "renang": ["swimsuit", "bikini", "one-piece_swimsuit", "school_swimsuit", "wet"],
    "pantai": ["beach", "sea", "ocean", "swimsuit", "bikini", "sand", "summer", "outdoors", "sky"],
    "kamar": ["bedroom", "bed", "sheet", "pillow", "lying", "room", "indoors"],
    "tidur": ["bed", "lying", "sleeping", "pillow", "sheet", "night", "indoors"],
    "kasur": ["bed", "lying", "on_bed", "sheet", "pillow"],
    "mandi": ["bath", "bathtub", "shower", "wet", "wet_clothes", "towel", "water", "onsen", "soap_bubbles", "bare_shoulders"],
    "onsen": ["onsen", "hot_spring", "towel", "steam", "bath", "water"],
    "gaun": ["dress", "gown", "evening_gown", "white_dress", "black_dress", "frills"],
    "baju": ["shirt", "dress", "outfit", "top", "clothes", "cleavage"],
    "pakaian": ["clothes", "outfit", "dress"],
    "kimono": ["kimono", "yukata", "japanese_clothes", "obi", "sash"],
    "yukata": ["yukata", "kimono", "festival"],
    "maid": ["maid", "maid_apron", "maid_headdress", "maid_outfit"],
    "sekolah": ["school_uniform", "serafuku", "pleated_skirt", "sailor_collar"],
    "seragam": ["uniform", "school_uniform", "military_uniform"],
    "lingerie": ["lingerie", "underwear", "panties", "bra", "lace", "nightie", "cleavage"],
    "underwear": ["underwear", "panties", "bra", "thighs"],
    "dalam": ["underwear", "panties", "bra", "cleavage"],
    "celana dalam": ["panties", "underwear", "side-tie_panties", "thighs"],
    "bra": ["bra", "strapless_bra", "lace_bra", "cleavage"],
    "hot": ["cleavage", "bare_shoulders", "thighs", "bare_legs", "navel", "stomach", "collarbone", "exposed", "breasts"],
    "seksi": ["cleavage", "bare_shoulders", "thighs", "ass", "bare_legs", "seductive_smile", "blush", "breasts"],
    "telanjang": ["nude", "completely_nude", "bare_breasts", "nipples", "ass", "uncensored"],
    "uncen": ["nude", "bare_breasts", "nipples", "pussy", "uncensored", "ass"],
    # Wedding & Romance
    "pengantin": ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
    "nikah": ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
    "menikah": ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
    "wedding": ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
    "bride": ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],
    "kekkon": ["wedding_dress", "veil", "bride", "dress", "white_dress", "bouquet", "wedding"],

    # Bunny & Special Cosplay
    "bunny": ["bunny_suit", "playboy_bunny", "bunny_ears", "rabbit_ears", "fishnets", "leotard"],
    "kelinci": ["bunny_suit", "playboy_bunny", "bunny_ears", "rabbit_ears", "fishnets"],
    "selfie": ["selfie", "holding_phone", "looking_at_viewer", "camera", "portrait"],
    "close-up": ["close-up", "portrait", "looking_at_viewer", "face", "smile"],
    "closeup": ["close-up", "portrait", "looking_at_viewer", "face", "smile"],
    "stoking": ["thighhighs", "pantyhose", "black_thighhighs", "fishnet_pantyhose", "stockings"],
    "rok": ["skirt", "miniskirt", "pleated_skirt", "short_skirt"],
    
    # Poses & Angles
    "duduk": ["sitting", "on_chair", "seiza", "crossed_legs", "sitting_on_bed"],
    "berbaring": ["lying", "on_back", "on_stomach", "on_side", "reclining"],
    "tiduran": ["lying", "on_bed", "on_back", "reclining", "pillow"],
    "berdiri": ["standing", "full_body", "looking_at_viewer"],
    "pose": ["looking_at_viewer", "portrait", "upper_body", "standing", "sitting"],
    "melihat": ["looking_at_viewer", "eye_contact", "looking_back"],
    "tatap": ["looking_at_viewer", "eye_contact"],
    "belakang": ["from_behind", "back", "facing_away", "ass_focus", "backboob"],
    "pantat": ["ass", "ass_focus", "from_behind", "butt"],
    "dada": ["breasts", "cleavage", "large_breasts", "huge_breasts", "bare_shoulders"],
    "paha": ["thighs", "bare_legs", "zettai_ryouiki", "thighhighs"],
    "kaki": ["bare_legs", "barefoot", "legs", "thighs"],
    "jongkok": ["squatting", "crouching"],
    
    # Expressions & Emotions
    "senyum": ["smile", "happy", "grin", "open_mouth", "blush"],
    "manis": ["blush", "smile", "sweet", "cute", "sparkle"],
    "merona": ["blush", "embarrassed", "flustered", "shy"],
    "blush": ["blush", "shy", "embarrassed"],
    "malu": ["blush", "embarrassed", "shy", "looking_away"],
    "kedip": ["wink", "one_eye_closed", "playful"],
    "goda": ["seductive_smile", "smirk", "blush", "looking_at_viewer", "cleavage"],
    "menggoda": ["seductive_smile", "smirk", "wink", "cleavage"],
    "marah": ["angry", "annoyed", "pout", "tsundere"],
    "cemberut": ["pout", "annoyed", "blush"],
    "nangis": ["tears", "crying", "sad"],
    "tertawa": ["laughing", "smile", "open_mouth", "happy"],
    
    # Actions & Interactions
    "peluk": ["hugging", "arms_up", "holding"],
    "cium": ["kiss", "kissing", "lips", "open_mouth"],
    "santai": ["relaxed", "sitting", "lying", "smile", "peace_sign"],
    "makan": ["eating", "food", "drinking", "tea", "cup", "sweets"],
    "minum": ["drinking", "cup", "bottle", "sake", "wine_glass", "glass"],
    "sake": ["sake", "bottle", "drinking", "alcohol", "cup"],
    
    # Environment & Lighting
    "malam": ["night", "dark", "moon", "stars", "night_sky", "bedroom", "indoors"],
    "siang": ["day", "sunlight", "bright", "outdoors", "sky"],
    "luar": ["outdoors", "sky", "tree", "grass", "sunlight", "day"],
    "dalam": ["indoors", "room", "bedroom"],
    "hujan": ["rain", "wet", "umbrella", "water_drops"],
    "kantor": ["office", "desk", "indoor", "suit", "business_suit"]
}

def search_character_dataset_image(char_id, query_text, excluded_urls=None):
    """
    Intelligently searches through up to 500 images per character in dataset_index.json
    using semantic scoring based on dialogue keywords and Danbooru tags.
    """
    images = get_character_dataset(char_id)
    if not images:
        return None

    excluded_set = set(excluded_urls or [])
    query_lower = query_text.lower()
    cover_url = images[0].get('url', '') if images else ''
    
    # Extract matching tag targets from user/bot prompt
    target_tags = set()
    for kw, tags in SYNONYM_TAGS.items():
        if kw in query_lower:
            target_tags.update(tags)

    # If specific english words match danbooru tags directly
    query_words = re.findall(r'[a-zA-Z0-9_-]+', query_lower)
    for w in query_words:
        if len(w) > 3:
            target_tags.add(w)

    scored_candidates = []

    for idx, img_obj in enumerate(images):
        url = img_obj.get('url', '')
        if not url:
            continue

        is_cover = (url == cover_url)
        img_tags = img_obj.get('tags', '').lower()
        score_val = img_obj.get('score', 0)
        
        match_score = 0
        matched_reasons = []

        # Calculate keyword match points
        for t in target_tags:
            if t in img_tags:
                match_score += 10
                matched_reasons.append(t)

        # Quality bonus (Danbooru upvotes)
        if score_val > 0:
            match_score += min(15, score_val // 2)

        # Penalty for recently shown images in same session
        if url in excluded_set:
            match_score -= 100

        # Heavy penalty for cover image (ensure chat photos are ALWAYS fresh & different)
        if is_cover:
            match_score -= 50

        scored_candidates.append({
            "url": url,
            "preview": img_obj.get('preview', url),
            "rating": img_obj.get('rating', 's'),
            "score": match_score,
            "tags": img_tags,
            "matched_tags": list(set(matched_reasons))[:5]
        })

    # Sort candidates by score descending
    scored_candidates.sort(key=lambda x: x['score'], reverse=True)

    # Filter out cover image from top candidate pool whenever possible
    top_pool = [c for c in scored_candidates[:8] if c['url'] != cover_url]
    if not top_pool:
        top_pool = scored_candidates[:5]

    if not top_pool:
        return images[0]

    chosen = random.choice(top_pool)
    return chosen

# --- FLASK ROUTES ---
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
    limit = request.args.get('limit', 40, type=int)
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

@app.route('/api/affinity/<char_id>', methods=['GET', 'POST'])
def api_manage_affinity(char_id):
    if request.method == 'POST':
        data = request.get_json() or {}
        score = data.get('score', 10)
        new_score = set_affinity(char_id, score)
        return jsonify({"status": "success", "char_id": char_id, "affinity_score": new_score})
    else:
        return jsonify({"char_id": char_id, "affinity_score": get_affinity(char_id)})

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
    
    # Check for direct /affinity or /setaffinity command in chat
    affinity_match = re.match(r'^\/(?:affinity|setaffinity|score)\s+(\d+)', user_input.lower())
    if affinity_match:
        new_score = int(affinity_match.group(1))
        set_affinity(char_id, new_score)
        ack_msg = f"*System: Affinity score untuk {char_name} berhasil diubah menjadi {new_score}/100!*"
        save_chat_message(char_id, char_name, ack_msg)
        return jsonify({
            "status": "success",
            "char_id": char_id,
            "sender": char_name,
            "message": ack_msg,
            "affinity_score": new_score,
            "facts": get_all_facts()
        })

    # Generate Uncensored LLM response
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

@app.route('/api/settings', methods=['GET', 'POST'])
@app.route('/api/key', methods=['GET', 'POST'])
def api_manage_settings():
    if request.method == 'POST':
        data = request.get_json() or {}
        llm_engine = data.get('llm_engine', '').strip()
        gemini_api_key = data.get('gemini_api_key', '').strip()
        gemini_model = data.get('gemini_model', '').strip()
        pollinations_model = data.get('pollinations_model', '').strip()
        local_llm_url = data.get('local_llm_url', '').strip()
        local_llm_model = data.get('local_llm_model', '').strip()

        if llm_engine:
            set_config('llm_engine', llm_engine)
        if gemini_api_key:
            set_config('gemini_api_key', gemini_api_key)
        if gemini_model:
            set_config('gemini_model', gemini_model)
        if pollinations_model:
            set_config('pollinations_model', pollinations_model)
        if local_llm_url:
            set_config('local_llm_url', local_llm_url)
        if local_llm_model:
            set_config('local_llm_model', local_llm_model)

        return jsonify({"status": "success", "config": get_config()})
    else:
        cfg = get_config()
        return jsonify({
            "status": "success",
            "llm_engine": cfg.get('llm_engine', 'gemini'),
            "gemini_api_key": cfg.get('gemini_api_key', ''),
            "gemini_model": cfg.get('gemini_model', 'gemini-2.5-flash'),
            "pollinations_model": cfg.get('pollinations_model', 'openai'),
            "local_llm_url": cfg.get('local_llm_url', 'http://localhost:11434/v1'),
            "local_llm_model": cfg.get('local_llm_model', 'mistral')
        })

@app.route('/api/search_character_image', methods=['POST'])
@app.route('/api/generate_lora_image', methods=['POST'])
def api_search_image():
    """
    Searches the character's 500-image dataset for matching visual photos.
    """
    data = request.get_json() or {}
    char_id = data.get('char_id', 'char')
    prompt = data.get('prompt', '')
    excluded = data.get('excluded_urls', [])

    matched = search_character_dataset_image(char_id, prompt, excluded_urls=excluded)
    if matched:
        return jsonify({
            "status": "success",
            "image_url": matched.get('url'),
            "preview_url": matched.get('preview'),
            "matched_tags": matched.get('matched_tags', []),
            "source": "parquet_dataset"
        })

    return jsonify({"status": "error", "message": "No dataset image found"}), 404

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"

if __name__ == '__main__':
    local_ip = get_local_ip()
    print("\n=======================================================")
    print(" CHATBOT MAINAN - UNCENSORED LOCAL WEB SERVER")
    print(" Open in Laptop Browser  : http://localhost:5000")
    print(f" Open in Phone (Wi-Fi)    : http://{local_ip}:5000")
    print("=======================================================\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
