#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/v1"
USERNAME="medsensemain"
PASSWORD="medsense"

echo "Using API_URL: $API_URL"

# Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"user\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

# Extract Token and ID using rudimentary grep/sed (since jq is missing)
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"authToken":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo "Login failed. Response:"
    echo $LOGIN_RESPONSE
    exit 1
fi
echo "Logged in as $USER_ID"

# 2. Create Pharmacy
echo -e "\n2. Creating Pharmacy..."
SLUG="pharmacy-$(date +%s)"
NAME="Test Pharmacy $SLUG"
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/medsense/pharmacies.create" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$NAME\", \"slug\": \"$SLUG\", \"active\": true}")

echo "Response: $CREATE_RESPONSE"
PHARMACY_ID=$(echo $CREATE_RESPONSE | grep -o '"_id":"[^"]*"' | head -n 1 | cut -d'"' -f4)

if [ -z "$PHARMACY_ID" ]; then
    echo "Failed to create pharmacy."
    exit 1
fi
echo "Created Pharmacy ID: $PHARMACY_ID"

# 3. List
echo -e "\n3. Listing Pharmacies..."
LIST_RESPONSE=$(curl -s -X GET "$API_URL/medsense/pharmacies.list" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID")
echo "Response: $LIST_RESPONSE"

if [[ "$LIST_RESPONSE" == *"$PHARMACY_ID"* ]]; then
    echo "✅ List Verified"
else
    echo "❌ List Failed"
    exit 1
fi

# 4. Set Patient Preference
echo -e "\n4. Setting Patient Preference..."
SET_RESPONSE=$(curl -s -X POST "$API_URL/medsense/patient.pharmacy.set" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"pharmacyId\": \"$PHARMACY_ID\"}")
echo "Response: $SET_RESPONSE"

# 5. Get Patient Preference
echo -e "\n5. Getting Patient Preference..."
GET_RESPONSE=$(curl -s -X GET "$API_URL/medsense/patient.pharmacy.mine" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID")
echo "Response: $GET_RESPONSE"

if [[ "$GET_RESPONSE" == *"$PHARMACY_ID"* ]]; then
    echo "✅ Patient Preference Verified"
else
    echo "❌ Patient Preference Failed"
    exit 1
fi
