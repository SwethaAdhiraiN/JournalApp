# JournalApp Backend

This backend provides a signup endpoint to receive validated username and password information and persists users to the database/users.json file.

## Features

- POST /signup: Validates that `password == confirmPassword` and that `username` is unique, and appends the new user as JSON to `../database/users.json`.
- File is created automatically if it doesn't exist.
- Simple Python FastAPI implementation.

## Run Locally

From the `JournalApp/backend` directory:

```bash
pip install -r requirements.txt
# IMPORTANT: Only reload on backend code, not on database file writes!
# Use this for seamless dev, or you may get *infinite reload loops* if users.json updates:
uvicorn main:app --reload --reload-dir backend
```

OpenAPI docs will be available at `http://localhost:8000/docs` when running.

# Note on Hot Reload and Data
- The backend will save user info to a data file OUTSIDE the backend source tree (see main.py).
- If you must keep user data inside the source folder, reload will loop on every signup/login.
- Always use `--reload-dir backend` with uvicorn for development!
- **Never write atomic temp files (like .tmp created during data save) into backend or its subfolders**: If you edit code to change database structure or save atomically, `.tmp` files in backend/ will trigger WatchFiles reloads as if source code changed. *All data and temp files must be kept outside the backend watched tree, e.g., in journalapp_data only.*

### Signup Request

`POST /signup`

```json
{
  "username": "alice",
  "password": "pass1234",
  "confirmPassword": "pass1234"
}
```

A successful response will return:

```json
{
  "message": "Signup successful."
}
```

If username is taken or passwords don't match, an appropriate error will be returned.
