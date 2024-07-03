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

## Update User

Endpoint : PUT /api/users

Request Body :

```json
{
  "userId": "2",
  "name": "Admin  new",
  "email": "admin@gmail.com",
  "password": "rahasia",
  "nip": "12121" // optional
}
```

Response Body (Success):

```json
{
  "message": "Success Update User",
  "data": {
    "id": 1,
    "name": "Admin new",
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

## Update Current User

Endpoint : PUT /api/users/current/1

Request Body :

```json
{
  "name": "Teacher new",
  "email": "teacher@gmail.com",
  "password": "rahasia",
  "nip": "12121" // optional
}
```

Response Body (Success):

```json
{
  "message": "Success Update Current User",
  "data": {
    "id": 1,
    "name": "Teacher new",
    "email": "teacher@gmail.com",
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

## Get All User

Endpoint : GET /api/users

Headers :

- Authorization: Bearer generated_token_id

Response Body (Success):

```json
{
  "message": "Success get all User",
  "data": [
    {
      "id": 1,
      "name": "Admin",
      "email": "admin@gmail.com",
      "role": "ADMIN"
    }
  ]
}
```

## Get User

Endpoint : GET /api/users/current

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

Endpoint : DELETE /api/users/current/logout

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
