#!/bin/bash
curl -X PUT http://localhost:8080/api/users/b1126c9b-206c-40d6-9ed1-07f60e41cdd1 \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Bumi",
    "lastName": "Test",
    "email": "mjuanda@gmail.com",
    "username": "mjuanda",
    "bio": "Test Bio",
    "phone": "123456789",
    "website": "https://example.com",
    "location": "Jakarta",
    "university": "UI",
    "department": "CS",
    "position": "Lecturer"
  }' | jq .
