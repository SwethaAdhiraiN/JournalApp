import os
import json
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ---- Flask App Config ----
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Path config for users.json (now using JournalApp/database/users.json per requirements)
BASE_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
USERS_DB_DIR = os.path.join(BASE_PROJECT_DIR, "JournalApp", "database")
USERS_DB_FILE = os.path.join(USERS_DB_DIR, "users.json")
MOOD_DB_FILE = os.path.join(USERS_DB_DIR, "mood.json")
JOURNAL_DB_FILE = os.path.join(USERS_DB_DIR, "journal.json")

# Ensure database dir exists
os.makedirs(USERS_DB_DIR, exist_ok=True)

# ---- Data utility functions ----

def load_all_users():
    """Load all users from users.json, or empty list if none exist/corrupt."""
    try:
        if not os.path.exists(USERS_DB_FILE):
            return []
        with open(USERS_DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []

def save_all_users(users):
    """Write user array to users.json atomically. Use .tmp file in same dir to avoid backend reload loops."""
    tmpfile = os.path.join(USERS_DB_DIR, "users.json.tmp")
    with open(tmpfile, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
    os.replace(tmpfile, USERS_DB_FILE)

def hash_password(pw):
    """Hashes the password using SHA-256."""
    return hashlib.sha256(pw.encode("utf-8")).hexdigest()

def load_json_dict(filepath):
    """Load a dictionary from JSON file, or return {} if nonexistent/corrupt."""
    try:
        if not os.path.exists(filepath):
            return {}
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
            return data if isinstance(data, dict) else {}
    except Exception:
        return {}

def save_json_dict(filepath, data):
    """Atomically write dict data to JSON; use a .tmp file and replace."""
    tmpfile = filepath + ".tmp"
    with open(tmpfile, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    os.replace(tmpfile, filepath)

# ---- API Route Definitions ----

# PUBLIC_INTERFACE
@app.route("/get-moods", methods=["POST"])
def get_moods():
    """
    Retrieve all mood entries for a given user.

    POST JSON: { "username": str }

    Returns all mood entries for that user as { "moods": { "date": [mood, ...], ... } }
    or empty "moods": {} if not found.

    Status 200 on success (including empty), 400/500 for errors.
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify(detail="No JSON body sent."), 400

    username = (data.get("username") or "").strip()
    if not username or len(username) < 3 or len(username) > 32:
        return jsonify(detail="Username must be 3-32 characters."), 400

    mood_data = load_json_dict(MOOD_DB_FILE)
    if not mood_data or username not in mood_data:
        return jsonify(moods={}), 200

    return jsonify(moods=mood_data.get(username, {})), 200

# PUBLIC_INTERFACE
@app.route("/submit-mood", methods=["POST"])
def submit_mood():
    """
    Overwrite mood entry for a user and date.

    POST JSON: { "username": str, "date": str, "mood": str }

    - Stores in JournalApp/database/mood.json as:
      { "username": { "date": [mood], ... }, ... }
      Overwrites any previous mood for this date/user; only the latest submission is kept.
    - Creates file/entries if not present.
    - Returns: { "message": "...", "moods": [str], "username": ..., "date": ... }
    - Error cases: { "detail": "..." }, status 400/409/500

    Frontend CORS supported.
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify(detail="No JSON body sent."), 400

    username = (data.get("username") or "").strip()
    date = (data.get("date") or "").strip()
    mood = (data.get("mood") or "").strip()

    if not username or len(username) < 3 or len(username) > 32:
        return jsonify(detail="Username must be 3-32 characters."), 400
    if not date:
        return jsonify(detail="Missing required field: date."), 400
    if not mood or len(mood) > 24:
        return jsonify(detail="Mood must be non-empty and less than 24 characters."), 400

    mood_data = load_json_dict(MOOD_DB_FILE)

    # Ensure user exists as a dict, and date overwrite previous entry
    if username not in mood_data:
        mood_data[username] = {}
    user_moods = mood_data[username]

    # Overwrite the entry for this user/date: always store as one-item list
    user_moods[date] = [mood]

    try:
        save_json_dict(MOOD_DB_FILE, mood_data)
    except Exception:
        return jsonify(detail="Could not save mood data."), 500

    return jsonify(
        message="Mood entry saved.",
        moods=user_moods[date],
        username=username,
        date=date
    ), 200

# PUBLIC_INTERFACE
@app.route("/submit-journal", methods=["POST"])
def submit_journal():
    """
    Overwrite journal entry for a user and date.

    POST JSON: { "username": str, "date": str, "journal": str }

    - Stores in JournalApp/database/journal.json as:
      { "username": { "date": [journal], ... }, ... }
      Overwrites any previous journal for this user/date; only the latest submission is kept.
    - Creates file/entries if not present.
    - Returns: { "message": "...", "journals": [str], "username": ..., "date": ... }
    - Error cases: { "detail": "..." }, status 400/409/500

    Frontend CORS supported.
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify(detail="No JSON body sent."), 400

    username = (data.get("username") or "").strip()
    date = (data.get("date") or "").strip()
    journal = (data.get("journal") or "").strip()

    if not username or len(username) < 3 or len(username) > 32:
        return jsonify(detail="Username must be 3-32 characters."), 400
    if not date:
        return jsonify(detail="Missing required field: date."), 400
    if not journal or len(journal) > 10000:
        return jsonify(detail="Journal entry must be non-empty (max 10,000 characters)."), 400

    journal_data = load_json_dict(JOURNAL_DB_FILE)

    if username not in journal_data:
        journal_data[username] = {}
    user_entries = journal_data[username]

    # Overwrite the journal for this user/date: always store as one-item list
    user_entries[date] = [journal]

    try:
        save_json_dict(JOURNAL_DB_FILE, journal_data)
    except Exception:
        return jsonify(detail="Could not save journal data."), 500

    return jsonify(
        message="Journal entry saved.",
        journals=user_entries[date],
        username=username,
        date=date
    ), 200

# PUBLIC_INTERFACE
@app.route("/signup", methods=["POST"])
def signup():
    """
    User signup endpoint.

    POST JSON: { "username": str, "password": str, "confirmPassword": str }

    - Username must be unique (case-insensitive).
    - Passwords must match.
    - On success: Saves user to JournalApp/database/users.json (with hashed password).
    - Returns: { "message": "Signup successful: User details added to users.json" }

    Error cases: { "detail": "..." }, status 400/409
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify(detail="No JSON body sent."), 400

    # Field validation
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    confirm_password = data.get("confirmPassword") or ""

    # Enforce requirements
    if not username or len(username) < 3 or len(username) > 32:
        return jsonify(detail="Username must be 3-32 characters."), 400
    if not password or len(password) < 5 or len(password) > 128:
        return jsonify(detail="Password must be 5-128 characters."), 400
    if password != confirm_password:
        return jsonify(detail="Password and confirm password do not match."), 400

    users = load_all_users()

    # Check uniqueness
    for user in users:
        if user.get("username", "").lower() == username.lower():
            return jsonify(detail="Username already exists."), 409

    # Hash and save
    hashed_pw = hash_password(password)
    users.append({"username": username, "password": hashed_pw})
    try:
        save_all_users(users)
    except Exception:
        return jsonify(detail="Could not write user file."), 500

    return jsonify(message="Signup successful: User details added to users.json"), 200

# PUBLIC_INTERFACE
@app.route("/login", methods=["POST"])
def login():
    """
    User login endpoint.

    POST JSON: { "username": str, "password": str }

    - Looks up user by username (case-insensitive) in JournalApp/database/users.json.
    - Hashes provided password and compares to stored hash.
    - On success: { "message": "Login Successful" }
    - On failure: { "detail": "Invalid username or password." }, status 401
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify(detail="No JSON body sent."), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or len(username) < 3 or len(username) > 32:
        return jsonify(detail="Invalid username or password."), 401
    if not password or len(password) < 5 or len(password) > 128:
        return jsonify(detail="Invalid username or password."), 401

    users = load_all_users()
    user = next((u for u in users if u.get("username", "").lower() == username.lower()), None)
    if user is None:
        return jsonify(detail="Invalid username or password."), 401

    hashed_input_pw = hash_password(password)
    if hashed_input_pw != user.get("password", ""):
        return jsonify(detail="Invalid username or password."), 401

    return jsonify(message="Login Successful"), 200

# PUBLIC_INTERFACE
@app.route("/", methods=["GET"])
def health():
    """Health check endpoint for the service."""
    return jsonify(status="ok")

if __name__ == "__main__":
    # Flask dev server launch for local runs. Deployment should use gunicorn/uwsgi.
    import sys
    # Read debug mode from env (overridden by .flaskenv or envvar)
    debug_mode = os.environ.get("FLASK_DEBUG", "0") in ("1", "true", "True", "yes")
    host = os.environ.get("FLASK_RUN_HOST", "0.0.0.0")
    port = int(os.environ.get("FLASK_RUN_PORT", 8000))
    # Restrict reload to only main.py source file (no data/user files)
    if debug_mode:
        # Explicit only reload on code, not outside files (users.json)
        import pathlib
        import threading
        import time
        from flask.cli import run_command

        def run_dev_flask():
            from flask.cli import load_dotenv
            load_dotenv()
            # Pass reloader_type=stat and extra files = empty (default: only .py)
            app.run(
                host=host,
                port=port,
                debug=True,
                use_reloader=True,   # Only reload on .py changes
            )
        # Just invoke normally -- reloader now ignores journalapp_data
        run_dev_flask()
    else:
        # Production: No reload, no debug, run only once, safe for prod use
        app.run(host=host, port=port, debug=False)
