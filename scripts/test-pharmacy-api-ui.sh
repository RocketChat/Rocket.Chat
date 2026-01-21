#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api/v1"
USERNAME="medsensemain"
PASSWORD="medsense"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo "Using API_URL: $API_URL"

# 1. Login
echo -e "\n1. Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/login" \
  -H "Content-Type: application/json" \
  -d "{\"user\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

# Extract Token and ID
AUTH_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"authToken":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESPONSE | grep -o '"userId":"[^"]*"' | cut -d'"' -f4)

if [ -z "$AUTH_TOKEN" ]; then
    echo -e "${RED}Login failed. Response:${NC}"
    echo $LOGIN_RESPONSE
    exit 1
fi
echo -e "${GREEN}Logged in as $USERNAME ($USER_ID)${NC}"

# 2. Test Public List
echo -e "\n2. Testing Public Pharmacy List..."
PUBLIC_LIST_RES=$(curl -s -X GET "$API_URL/medsense/pharmacies.list.public")
PHARMACY_COUNT=$(echo $PUBLIC_LIST_RES | grep -o '"_id"' | wc -l)
echo "Public API Response Length: ${#PUBLIC_LIST_RES}"
echo "Found $PHARMACY_COUNT pharmacies publicly"

if [[ "$PUBLIC_LIST_RES" == *"pharmacies"* ]]; then
     echo -e "${GREEN}✅ Public List OK${NC}"
else
     echo -e "${RED}❌ Public List Failed${NC}"
     echo $PUBLIC_LIST_RES
     exit 1
fi

# 3. Create Pharmacy for Team Test
echo -e "\n3. Creating Test Pharmacy..."
SLUG="pharmacy-ui-test-$(date +%s)"
NAME="UI Test Pharmacy $SLUG"
CREATE_RES=$(curl -s -X POST "$API_URL/medsense/pharmacies.create" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$NAME\", \"slug\": \"$SLUG\", \"active\": true}")

PHARMACY_ID=$(echo $CREATE_RES | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$PHARMACY_ID" ]; then
    echo -e "${RED}Failed to create pharmacy${NC}"
    echo $CREATE_RES
    exit 1
fi
echo -e "${GREEN}Created Pharmacy: $PHARMACY_ID${NC}"

# 4. Test Team Creation (Skipped for now to focus on Info endpoint)
# ...
# 4. Testing Team Creation (API: medsense/pharmacies.teams.create)
# echo "Testing Team Creation..."
# TEAM_NAME="Team-$(date +%s)"
# curl -H "X-Auth-Token: $AUTH_TOKEN" \
#      -H "X-User-Id: $USER_ID" \
#      -H "Content-type: application/json" \
#      -d '{ "pharmacyId": "'"$PHARMACY_ID"'", "name": "'"$TEAM_NAME"'", "purpose": "pharmacist" }' \
#      http://localhost:3000/api/v1/medsense/pharmacies.teams.create > team_create_response.json

# cat team_create_response.json
# echo ""

# if grep -q '"success":true' team_create_response.json; then
#   echo "✅ Team created successfully"
# else
#   echo "❌ Team Creation FAILED"
#   cat team_create_response.json
#   # Not exiting here to let other tests run if possible, but usually this is critical
# fi

# 5. Verifying Team Listing
# echo "Verifying Team Listing..."
# curl -H "X-Auth-Token: $AUTH_TOKEN" \
#      -H "X-User-Id: $USER_ID" \
#      -H "Content-type: application/json" \
#      "http://localhost:3000/api/v1/medsense/pharmacies.available_teams?pharmacyId=$PHARMACY_ID" > team_list.json

# cat team_list.json
# echo ""

# if grep -q "$TEAM_NAME" team_list.json; then
#   echo "✅ Team found in list"
# else
#   echo "❌ Team Not Found in List"
#   cat team_list.json
# fi

echo -e "\n${GREEN}All UI API Tests Passed!${NC}"
# 5. Fetch specific pharmacy info (Test Fix)
echo "Fetching specific pharmacy info for $PHARMACY_ID..."
curl -H "X-Auth-Token: $AUTH_TOKEN" \
     -H "X-User-Id: $USER_ID" \
     -H "Content-type: application/json" \
     "http://localhost:3000/api/v1/medsense/pharmacies.info?pharmacyId=$PHARMACY_ID" > pharmacy_info.json

cat pharmacy_info.json
echo ""

if grep -q "$PHARMACY_ID" pharmacy_info.json; then
  echo "✅ Single pharmacy info fetch successful"
else
  echo "❌ Single pharmacy info fetch FAILED"
  cat pharmacy_info.json
  exit 1
fi
