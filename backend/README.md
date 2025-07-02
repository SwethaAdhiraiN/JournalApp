# JournalApp Backend (Flask Edition)

This directory provides a Flask REST backend for authentication for the JournalApp project.

## Endpoints

### POST `/signup`

> Accepts:  
> `{ "username": str, "password": str, "confirmPassword": str }`

- Validates username (3-32 chars, unique, case-insensitive) and password (5-128 chars).
- Rejects signups with passwords that do not match or usernames that already exist.
- Password is securely hashed (SHA-256) in the persistent database.
- Saves user to `journalapp_data/users.json` (outside backend/ source tree).

Returns:
- Success: `{ "message": "Signup successful." }`
- Error: `{ "detail": "Error reason..." }` (HTTP 400/409)

### POST `/login`

> Accepts:  
> `{ "username": str, "password": str }`

- Looks up user by username (case-insensitive).
- Hashes password and compares to stored hash.
- On match: returns `{ "message": "Login Successful" }`.
- Else: `{ "detail": "Invalid username or password." }` (HTTP 401)

### GET `/`

- Simple health check endpoint.
- Returns: `{ "status": "ok" }`

## User Data Storage

- All users are stored as a JSON list in `journalapp_data/users.json` at the project root for safety.
- The backend will create the directory and JSON file as needed.
- Never edit `users.json` manually unless you know what you're doing.

## CORS

- CORS is enabled (accepts requests from any origin, suitable for local frontend development).
- For production, restrict allowed origins in `main.py` by changing the `CORS(app, ...)` config.

## Setup & Local Run

1. Install Python dependencies:

   ```bash
   pip install -r requirements.txt
   ```

2. Development (with auto-reload):  
   Flask debug mode is configured for local dev by a `.flaskenv` file in this folder:

   ```bash
   # This automatically enables debug, host, and port settings:
   # FLASK_APP=main.py
   # FLASK_DEBUG=1
   # FLASK_RUN_HOST=0.0.0.0
   # FLASK_RUN_PORT=8000

   # From JournalApp/backend/
   flask run
   ```

   Or:
   ```bash
   python main.py
   ```

   This will ensure the Flask server **only reloads on backend code changes** and NOT on external data or unrelated file modifications (such as journalapp_data/users.json).

3. Production (or when NOT editing backend code):  
   Always disable debug/reload for reliability:

   ```bash
   # Unset FLASK_DEBUG or set debug=False
   FLASK_DEBUG=0 python main.py
   # Or, for deployment:
   gunicorn main:app -b 0.0.0.0:8000
   ```

   > Never enable Flask debug mode in production.

4. Frontend can POST to `http://localhost:8000/signup` and `/login`.

5. User data is always saved to `../../journalapp_data/users.json` (at the project root, safely outside backend/ so server reload never triggers on data edits).

## API Contract

See `/signup` and `/login` endpoint notes above for expected request/response fields.
All responses are application/json.  
On error, HTTP status and `{ "detail": "...error..." }` key will describe the reason.

## Dev Notes

- For production use, run with gunicorn/uwsgi and restrict CORS origins.
- Flask auto-reload hot-reloads ONLY backend Python code. Data and external files are never watched for reload.
- If you encounter unwanted reloads, ensure your `journalapp_data` and user files remain outside of the backend app folder.
- For dev convenience, all relevant Flask debug/server env is in `.flaskenv`.

---

**2024-07**: This is a Flask-based version. For original FastAPI code, see earlier commits.

