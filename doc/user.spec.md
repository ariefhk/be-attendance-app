# User API Spec

## Register User

Endpoint : POST /api/auth/register

Request Body :

```json
{
  "name": "Admin",
  "email": "admin@gmail.com",
  "password": "rahasia",
  "role": "ADMIN"
}
```

Response Body (Success):

```json
{
  "message": "Success Create User",
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@gmail.com",
    "role": "ADMIN"
  }
}
```

Response Body (Error):

```json
{
  "errors": "Username already registered"
}
```

Response Body (Error):

```json
{
  "errors": []
}
```

## Login User

Endpoint : POST /api/auth/login

Request Body :

```json
{
  "email": "admin@gmail.com",
  "password": "rahasia"
}
```

Response Body (Success):

```json
{
  "message": "Success Login User",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MSwiaWF0IjoxNzE5OTI2ODkzLCJleHAiOjE3MjI1MTg4OTN9.T3-mONEb_nzk_tjQ6mHUAprue2l_LTOxrb60So3Y_J4"
  }
}
```

Response Body (Error):

```json
{
  "errors": "User not found!"
}
```

Response Body (Error):

```json
{
  "errors": []
}
```

## Get User

Endpoint : GET /api/user/current

Headers :

- Authorization: Bearer generated_token_id

Response Body (Success):

```json
{
  "message": "Success get current User",
  "data": {
    "id": 1,
    "name": "Admin",
    "email": "admin@gmail.com",
    "role": "ADMIN"
  }
}
```

Response Body (Error):

```json
{
  "errors": "User not found!"
}
```

Response Body (Error):

```json
{
  "errors": []
}
```

## Logout User

Endpoint : DELETE /api/user/current/logout

Headers :

- Authorization: Bearer generated_token_id

Response Body (Success):

```json
{
  "data": true
}
```

Response Body (Error):

```json
{
  "errors": "User not found  registered"
}
```
