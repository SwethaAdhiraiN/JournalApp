import os
import json
import hashlib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ---- Flask App Config ----
app = Flask(__name__)
CORS(app, supports_credentials=True)

# Path config for users.json (persistent user database OUTSIDE backend/ tree)
BASE_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
USERS_DB_DIR = os.path.join(BASE_PROJECT_DIR, "journalapp_data")
USERS_DB_FILE = os.path.join(USERS_DB_DIR, "users.json")

# Ensure data dir exists
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

# ---- API Route Definitions ----

# PUBLIC_INTERFACE
@app.route("/signup", methods=["POST"])
def signup():
    """
    User signup endpoint.

    POST JSON: { "username": str, "password": str, "confirmPassword": str }

    - Username must be unique (case-insensitive).
    - Passwords must match.
    - On success: Saves user to users.json (with hashed password).
    - Returns: { "message": "Signup successful." }

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

    return jsonify(message="Signup successful."), 200

# PUBLIC_INTERFACE
@app.route("/login", methods=["POST"])
def login():
    """
    User login endpoint.

    POST JSON: { "username": str, "password": str }

    - Looks up user by username (case-insensitive).
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
