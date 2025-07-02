import os
import json
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Path for users.json data file
# Move users.json OUTSIDE of backend watched folders (to avoid uvicorn reload loop on file writes)
BASE_PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
USERS_DB_DIR = os.path.join(BASE_PROJECT_DIR, "journalapp_data")
USERS_DB_FILE = os.path.join(USERS_DB_DIR, "users.json")

# Make sure the external database directory exists
os.makedirs(USERS_DB_DIR, exist_ok=True)

app = FastAPI(
    title="JournalApp Auth API",
    description="Signup and login endpoints for JournalApp. Stores users in users.json file.",
    version="1.0.0",
    openapi_tags=[{"name": "auth", "description": "User signup and login"}]
)

# Allow frontend connection (CORS for development)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust as needed for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# Request model for signup
class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32, description="Desired username. Must be unique.")
    password: str = Field(..., min_length=5, max_length=128, description="Password for the account.")
    confirmPassword: str = Field(..., min_length=5, max_length=128, description="Password again to confirm.")

# Response model for success
class SignupResponse(BaseModel):
    message: str = Field(..., description="Status message")

# Utilities

def load_all_users():
    """Load the list of user dicts from users.json, or return empty list if file does not exist/corrupt."""
    try:
        if not os.path.exists(USERS_DB_FILE):
            return []
        with open(USERS_DB_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            # Defensive: ensure data is a list
            if isinstance(data, list):
                return data
            return []
    except Exception:
        return []

def save_all_users(users):
    """Write the user list to users.json (atomic)"""
    tmpfile = USERS_DB_FILE + ".tmp"
    with open(tmpfile, "w", encoding="utf-8") as f:
        json.dump(users, f, indent=2)
    os.replace(tmpfile, USERS_DB_FILE)

# PUBLIC_INTERFACE
@app.post("/signup", response_model=SignupResponse, tags=["auth"], summary="Sign up a new user",
          description="Create a new user account if the username is unique and password matches confirmation.")
async def signup(signup: SignupRequest):
    """
    Sign up a new user.
    - Validates that password and confirmPassword match.
    - Validates that the username does not already exist in users.json.
    - Stores the new user as a JSON entry in JournalApp/database/users.json.
    Password hashing is omitted for this demo implementation.

    Args:
        signup (SignupRequest): The username, password, and confirmPassword.

    Returns:
        SignupResponse: Status message of sign-up.
    """
    # Check passwords match
    if signup.password != signup.confirmPassword:
        raise HTTPException(status_code=400, detail="Password and confirm password do not match.")

    # Load existing users
    users = load_all_users()

    # Check that username is unique (case-insensitive)
    for user in users:
        if user.get("username", "").lower() == signup.username.lower():
            raise HTTPException(status_code=409, detail="Username already exists.")

    # Hash the password
    hashed_pw = hashlib.sha256(signup.password.encode("utf-8")).hexdigest()

    # Persist the new user
    new_user = {"username": signup.username, "password": hashed_pw}
    users.append(new_user)
    save_all_users(users)

    return SignupResponse(message="Signup successful.")
# Request model for login
class LoginRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=32, description="Registered username.")
    password: str = Field(..., min_length=5, max_length=128, description="Password for the account.")

# Response model for login
class LoginResponse(BaseModel):
    message: str = Field(..., description="Login result message")

# PUBLIC_INTERFACE
@app.post("/login", response_model=LoginResponse, tags=["auth"], summary="Log in",
          description="Check submitted credentials against users.json. On success, returns 'Login Successful'.")
async def login(login: LoginRequest):
    """
    Attempt to log in a user by verifying credentials.

    Reads JournalApp/database/users.json, checks if the username exists, then verifies
    the password (hashed with SHA-256) against the stored hash.

    Args:
        login (LoginRequest): The username and password.

    Returns:
        LoginResponse: {"message": "Login Successful"} on success; error on mismatch.
    """
    # Load all users
    users = load_all_users()

    user = next((u for u in users if u.get("username", "").lower() == login.username.lower()), None)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    hashed_input_pw = hashlib.sha256(login.password.encode("utf-8")).hexdigest()
    if hashed_input_pw != user.get("password", ""):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    return LoginResponse(message="Login Successful")

# For local/development use: health endpoint
@app.get("/", tags=["health"])
def health():
    """Simple health check endpoint."""
    return {"status": "ok"}
