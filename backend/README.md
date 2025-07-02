# JournalApp Backend

This backend provides a signup endpoint to receive validated username and password information and persists users to the database/users.json file.

## Debug note (2024-07): 
If main.py is reloading repeatedly, investigate for temp/editor/sync files in this directory using:
- `ls -la` to list all files (including hidden dotfiles).
- Look for `.swp`, `.tmp`, `.~`, or files named like `main.py~` or `.#main.py`.
- Check if `.users.json.tmp` files are written here (should be outside backend/).
Check permissions with:
- `ls -la JournalApp/backend`

Reload loops may be caused by:
- Cloud sync or backup tools writing shadow files
- Multiple editors open or auto-formatting aggressively
- Permission errors preventing stable writes

## VS Code/Code-Server Specific Note

If you are running VS Code or code-server (either locally or in browser), be aware:
- The built-in file watcher may save shadow/lock/temp files (.code-workspace, .~main.py, .#main.py, .main.py.swp, etc) in the backend folder if you have VS Code settings like `files.autoSave: afterDelay`, autosave extensions, or aggressive formatters installed. 
- Cloud editing/sync (Dropbox, Google Drive, OneDrive, etc) can also write hidden shadow or backup files which trigger backend/main.py reload.
- Recommended: Disable automatic workspace storage in project directory, and do NOT use extensions that write local shadow or lock files in watched uvicorn directory.
- Always save atomically outside the backend/ tree; see FastAPI/uvicorn WatchFiles docs for more info.

If you observe frequent reloads without code changes:
1. Check for hidden/backup/temp files in backend/. If present, update editor/external tool config to avoid saving or syncing shadow files in backend/.
2. Try running backend/editor in a directory outside watched folders, or disable auto-save/auto-backup.
3. Use `uvicorn main:app --reload --reload-dir backend` (not --reload-dir ..) for minimal watch scope.

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
