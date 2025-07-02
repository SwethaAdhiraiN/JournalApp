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
python main.py
```

Frontend:
```bash
cd JournalApp/frontend
npm install
npm start
```

This will launch the React frontend and the Flask backend, allowing you to test signup/login.
