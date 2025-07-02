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
uvicorn main:app --reload
```

OpenAPI docs will be available at `http://localhost:8000/docs` when running.

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
