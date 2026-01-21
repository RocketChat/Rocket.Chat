#!/bin/bash
set -u

# Configuration
API_URL="${API_URL:-http://localhost:3000}"
USER="${USER:-admin}"
PASS="${PASS:-admin}"
TEAM_NAME="smoke-intake-test-$(date +%s)"

echo "--------------------------------------------------"
echo "Smoke Test: Intake Message Posting"
echo "Target: $API_URL"
echo "User: $USER"
echo "Team: $TEAM_NAME"
echo "--------------------------------------------------"

# 1. Login
echo "Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/login" \
  -H "Content-Type: application/json" \
  -d "{\"user\":\"$USER\",\"password\":\"$PASS\"}")

STATUS=$(echo "$LOGIN_RESPONSE" | jq -r .status)
if [ "$STATUS" != "success" ]; then
  echo "❌ Login failed"
  echo "$LOGIN_RESPONSE"
  exit 1
fi

AUTH_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r .data.authToken)
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r .data.userId)

echo "✅ Login successful (ID: $USER_ID)"

# 2. Create Team
echo "Creating team '$TEAM_NAME' with intake channel..."
CREATE_TEAM_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/teams.create" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$TEAM_NAME\",\"type\":0,\"createIntakeChannel\":true}")

SUCCESS=$(echo "$CREATE_TEAM_RESPONSE" | jq -r .success)
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Failed to create team"
  echo "$CREATE_TEAM_RESPONSE"
  exit 1
fi

TEAM_ID=$(echo "$CREATE_TEAM_RESPONSE" | jq -r .team._id)
echo "✅ Team created (ID: $TEAM_ID)"

# 3. Find Intake Room
# The intake channel should be named <team-name>-intake
# We can search for rooms belonging to this team
echo "Finding intake room..."

INTAKE_ROOM_NAME="${TEAM_NAME}-intake"
# Wait a brief moment for room propagation if needed, though usually synchronous
sleep 1

ROOM_INFO_RESPONSE=$(curl -s -X GET "$API_URL/api/v1/teams.listRooms?teamId=$TEAM_ID" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID")

# Filter for the intake room
ROOM_ID=$(echo "$ROOM_INFO_RESPONSE" | jq -r ".rooms[] | select(.name == \"$INTAKE_ROOM_NAME\") | ._id")

if [ -z "$ROOM_ID" ] || [ "$ROOM_ID" == "null" ]; then
    echo "❌ Could not find room with name '$INTAKE_ROOM_NAME' in team"
    echo "Rooms found:"
    echo "$ROOM_INFO_RESPONSE" | jq .rooms[].name
    
    # Clean up attempt
    curl -s -X POST "$API_URL/api/v1/teams.delete" \
      -H "X-Auth-Token: $AUTH_TOKEN" \
      -H "X-User-Id: $USER_ID" \
      -H "Content-Type: application/json" \
      -d "{\"teamId\":\"$TEAM_ID\"}" > /dev/null
    exit 1
fi

echo "✅ Intake room found: $INTAKE_ROOM_NAME (ID: $ROOM_ID)"

# 4. Post Message
echo "Posting message to intake room..."
MESSAGE_TEXT="Smoke test message $(date)"
POST_MSG_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/chat.postMessage" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"roomId\":\"$ROOM_ID\",\"text\":\"$MESSAGE_TEXT\"}")

SUCCESS=$(echo "$POST_MSG_RESPONSE" | jq -r .success)
if [ "$SUCCESS" != "true" ]; then
  echo "❌ Failed to post message"
  echo "$POST_MSG_RESPONSE"
  exit 1
fi

MSG_ID=$(echo "$POST_MSG_RESPONSE" | jq -r .message._id)
echo "✅ Message posted (ID: $MSG_ID)"

# 5. Cleanup
echo "Cleaning up..."
DELETE_RESPONSE=$(curl -s -X POST "$API_URL/api/v1/teams.delete" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -H "X-User-Id: $USER_ID" \
  -H "Content-Type: application/json" \
  -d "{\"teamId\":\"$TEAM_ID\"}")

SUCCESS=$(echo "$DELETE_RESPONSE" | jq -r .success)
if [ "$SUCCESS" != "true" ]; then
  echo "⚠️ Failed to delete team"
  echo "$DELETE_RESPONSE"
else
  echo "✅ Team deleted"
fi

echo "--------------------------------------------------"
echo "✅ SMOKE TEST PASSED"
echo "--------------------------------------------------"
