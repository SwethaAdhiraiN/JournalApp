# Project Repository

This project contains the frontend (React) and backend (Flask) for JournalApp.

- **Frontend:** See `JournalApp/frontend/` (React, pixel-perfect CSS).
- **Backend:** See `JournalApp/backend` (Flask API for signup/login; stores users in `journalapp_data/users.json`).
- See backend/README.md and frontend/README.md for usage details.

## Quick Start

Backend:
```bash
cd JournalApp/backend
pip install -r requirements.txt

# Local Dev (auto-reloads only on code changes!)
flask run        # (uses settings from .flaskenv - best for dev/debug)

# Or (legacy explicit)
python main.py   # (defaults to debug=True if FLASK_DEBUG=1)
```

- For **production use** (or when not actively editing Python):  
  Always run with debug/reload **OFF** for reliability:
  ```bash
  FLASK_DEBUG=0 python main.py
  # Or with gunicorn (best for deploys):
  gunicorn main:app -b 0.0.0.0:8000
  ```

Frontend:
```bash
cd JournalApp/frontend
npm install
npm start
```

This will launch the React frontend and the Flask backend, allowing you to test signup/login.

- **Note:** All user data is saved outside the backend source tree in `journalapp_data/users.json`.
- Flask server will only reload on backend source code changes (not on external data/files) when using the configuration above.

