#!/usr/bin/env bash
set -euo pipefail

# ---------------------------------------------------------------------------
# seed-data.sh â€“ Bulk-generate Rocket.Chat users, channels & messages
#
# Usage:
#   ./scripts/seed-data.sh <x-user-id> <x-auth-token> [num_users] [num_channels] [num_messages_per_channel]
#
# Defaults: 50 users, 30 channels, 200 messages per channel
# ---------------------------------------------------------------------------

BASE_URL="http://localhost:3000"
USER_ID="${1:?Usage: $0 <x-user-id> <x-auth-token> [users] [channels] [msgs_per_channel]}"
AUTH_TOKEN="${2:?Usage: $0 <x-user-id> <x-auth-token> [users] [channels] [msgs_per_channel]}"

NUM_USERS="${3:-50}"
NUM_CHANNELS="${4:-30}"
MSGS_PER_CHANNEL="${5:-200}"

WORDS=(alpha bravo charlie delta echo foxtrot golf hotel india juliet kilo lima mike november oscar papa quebec romeo sierra tango uniform victor whiskey xray yankee zulu)

rand_word() {
  echo "${WORDS[$((RANDOM % ${#WORDS[@]}))]}"
}

# Generate a realistic message payload (Grafana alert or Sentry error style)
# Usage: generate_message <room_id>
# Outputs a full JSON body for chat.sendMessage
generate_message() {
  local rid="$1"
  python3 -c "
import json, random, uuid, string

SERVICES = [
    'lp-docs4sign', 'auth-gateway', 'payment-service', 'user-profile',
    'notification-hub', 'order-processor', 'api-gateway', 'file-storage',
    'report-generator', 'scheduler-service', 'cache-manager', 'audit-logger',
    'session-handler', 'rate-limiter', 'config-server', 'discovery-service',
]

ALERT_NAMES = [
    'STAFF API HTTP 403 ERROR', 'STUCK PROCESS', 'HIGH MEMORY USAGE',
    'CPU SPIKE DETECTED', 'REQUEST TIMEOUT', 'CONNECTION POOL EXHAUSTED',
    'DISK SPACE LOW', 'HTTP 5XX RATE HIGH', 'DEADLOCK DETECTED',
    'QUEUE OVERFLOW', 'SSL CERT EXPIRING', 'POD RESTART LOOP',
    'LATENCY P99 HIGH', 'GC PAUSE EXCEEDED', 'OOM KILL DETECTED',
]

ERROR_MESSAGES = [
    'Unable confirm draft id: {uuid} Invalid OTP code',
    'Connection refused to downstream service',
    'Timeout waiting for response from {service}',
    'Failed to validate file on DLP server',
    'Database connection pool exhausted, max connections reached',
    'Redis cluster node unreachable: {ip}:{port}',
    'JWT token validation failed: token expired',
    'S3 upload failed: bucket quota exceeded',
    'Kafka consumer lag exceeded threshold',
    'gRPC deadline exceeded for {service}',
    'Certificate chain validation failed',
    'Rate limit exceeded for client {ip}',
]

CULPRITS = [
    'com.bcs.bm.draftconfirm.processor.SESDraftProcessor in validateOtp',
    'com.bcs.bm.common.dlp.client.ICAPClientImpl in send',
    'com.bcs.bm.auth.service.TokenValidator in validate',
    'com.bcs.bm.payment.gateway.StripeClient in processCharge',
    'com.bcs.bm.notification.sender.PushService in dispatch',
    'com.bcs.bm.storage.s3.S3Uploader in uploadObject',
    'com.bcs.bm.cache.redis.RedisClusterClient in getConnection',
    'com.bcs.bm.order.saga.OrderSagaOrchestrator in execute',
]

def rand_ip():
    return f'10.{random.randint(128,135)}.{random.randint(1,80)}.{random.randint(1,254)}'

def rand_port():
    return random.choice([8080, 8226, 8443, 9090, 9200, 6379, 5432])

def rand_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=17))

def rand_dashboard_id():
    return str(uuid.uuid4())[:36]

def rand_alert_id():
    return ''.join(random.choices(string.ascii_lowercase + string.digits, k=16))

def rand_issue_id():
    return random.randint(100000, 999999)

rid = '$rid'
msg_type = random.choice(['grafana_alert', 'grafana_ok', 'sentry_error'])
service = random.choice(SERVICES)
dash_id = rand_dashboard_id()
panel_id = random.randint(1, 40)
alert_uid = rand_alert_id()
instance = f'{rand_ip()}:{rand_port()}'

if msg_type in ('grafana_alert', 'grafana_ok'):
    alert_name = random.choice(ALERT_NAMES)
    is_ok = msg_type == 'grafana_ok'
    status = '[OK]âœ…' if is_ok else '[ALERTING]ðŸ”¥'
    color = '#00FF00' if is_ok else '#FF0000'
    msg_text = f'{status}[{service}] {alert_name} \\nundefined'

    attachments = [{
        'color': color,
        'ts': '1970-01-01T00:00:00.000Z',
        'fields': [
            {
                'short': True,
                'title': 'Ð“Ñ€Ð°Ñ„Ð¸Ðº',
                'value': f'[Panel](https://grafana.example.com/grafana/d/{dash_id}?orgId=1&viewPanel={panel_id})'
            },
            {
                'short': True,
                'title': 'Ð”Ð°ÑˆÐ±Ð¾Ñ€Ð´',
                'value': f'[Dashboard](https://grafana.example.com/grafana/d/{dash_id}?orgId=1)'
            },
            {
                'short': True,
                'title': 'Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð¾Ð²Ð°Ñ‚ÑŒ Ð°Ð»ÐµÑ€Ñ‚',
                'value': f'[Edit](https://grafana.example.com/grafana/alerting/grafana/{alert_uid}/view?orgId=1)'
            },
            {
                'short': True,
                'title': 'Ð’Ñ€ÐµÐ¼ÐµÐ½Ð½Ð¾ Ð¾Ñ‚ÐºÐ»ÑŽÑ‡Ð¸Ñ‚ÑŒ Ð°Ð»ÐµÑ€Ñ‚',
                'value': f'[Silence](https://grafana.example.com/grafana/alerting/silence/new?alertmanager=grafana&matcher=alertname%3D%5B{service}%5D+{alert_name.replace(\" \", \"+\")}&matcher=app%3D{service}&matcher=instance%3D{instance}&orgId=1)'
            },
        ]
    }]

    payload = {
        'message': {
            'rid': rid,
            'msg': msg_text,
            'attachments': attachments,
            'parseUrls': False,
            'groupable': False,
            'alias': '',
        }
    }

else:
    err_tpl = random.choice(ERROR_MESSAGES)
    err_msg = err_tpl.format(
        uuid=str(uuid.uuid4()),
        service=random.choice(SERVICES),
        ip=rand_ip(),
        port=rand_port(),
    )
    culprit = random.choice(CULPRITS)
    issue_id = rand_issue_id()
    sentry_url = f'https://sentry.example.com/organizations/org/issues/{issue_id}/?referrer=webhooks_plugin'
    msg_text = f'Error in project *{service}* ({service}).\\n*Message:* {err_msg}\\n*Culprit:* {culprit}.\\n*Check url:* {sentry_url}'

    payload = {
        'message': {
            'rid': rid,
            'msg': msg_text,
            'attachments': [],
            'parseUrls': True,
            'groupable': False,
            'alias': '',
        }
    }

print(json.dumps(payload, ensure_ascii=False))
"
}

api() {
  local method="$1" endpoint="$2" data="${3:-}"
  local args=(
    -s -S
    -X "$method"
    -H "Content-Type: application/json"
    -H "X-User-Id: $USER_ID"
    -H "X-Auth-Token: $AUTH_TOKEN"
  )
  [[ -n "$data" ]] && args+=(-d "$data")
  curl "${args[@]}" "${BASE_URL}/api/v1/${endpoint}"
}

echo "=== Rocket.Chat Data Seeder ==="
echo "  Server:            $BASE_URL"
echo "  Users to create:   $NUM_USERS"
echo "  Channels to create: $NUM_CHANNELS"
echo "  Messages/channel:  $MSGS_PER_CHANNEL"
echo ""

# ---- Create users --------------------------------------------------------
echo "--- Creating $NUM_USERS users ---"
declare -a USERNAMES
for ((i = 1; i <= NUM_USERS; i++)); do
  username="seed_$(rand_word)_${i}"
  email="${username}@seed.local"
  password="SeedPass123!"
  name="Seed User ${i}"

  result=$(api POST "users.create" "$(cat <<JSON
{
  "username": "$username",
  "email": "$email",
  "password": "$password",
  "name": "$name",
  "verified": true,
  "joinDefaultChannels": false
}
JSON
  )")

  success=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('success',''))" 2>/dev/null || true)

  if [[ "$success" == "True" ]]; then
    USERNAMES+=("$username")
    printf "  [%3d/%d] Created user: %s\n" "$i" "$NUM_USERS" "$username"
  else
    error=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))" 2>/dev/null || echo "$result")
    printf "  [%3d/%d] FAILED user: %s (%s)\n" "$i" "$NUM_USERS" "$username" "$error"
  fi
done

echo ""
echo "Created ${#USERNAMES[@]} users successfully."
echo ""

# ---- Create channels & invite random users --------------------------------
echo "--- Creating $NUM_CHANNELS channels ---"
declare -a CHANNEL_IDS
declare -a CHANNEL_NAMES
for ((i = 1; i <= NUM_CHANNELS; i++)); do
  chname="seed-$(rand_word)-$(rand_word)-${i}"

  # Pick a random subset of usernames to invite (up to 10)
  members="[]"
  if [[ ${#USERNAMES[@]} -gt 0 ]]; then
    count=$(( (RANDOM % 10) + 1 ))
    [[ $count -gt ${#USERNAMES[@]} ]] && count=${#USERNAMES[@]}
    picked=()
    for ((m = 0; m < count; m++)); do
      picked+=("\"${USERNAMES[$((RANDOM % ${#USERNAMES[@]}))]]}\"")
    done
    members="[$(IFS=,; echo "${picked[*]}")]"
  fi

  result=$(api POST "channels.create" "$(cat <<JSON
{
  "name": "$chname",
  "members": $members
}
JSON
  )")

  cid=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('channel',{}).get('_id',''))" 2>/dev/null || true)

  if [[ -n "$cid" ]]; then
    CHANNEL_IDS+=("$cid")
    CHANNEL_NAMES+=("$chname")
    printf "  [%3d/%d] Created channel: %-40s (id: %s)\n" "$i" "$NUM_CHANNELS" "$chname" "$cid"
  else
    error=$(echo "$result" | python3 -c "import sys,json; print(json.load(sys.stdin).get('error','unknown'))" 2>/dev/null || echo "$result")
    printf "  [%3d/%d] FAILED channel: %s (%s)\n" "$i" "$NUM_CHANNELS" "$chname" "$error"
  fi
done

echo ""
echo "Created ${#CHANNEL_IDS[@]} channels successfully."
echo ""

# ---- Send messages --------------------------------------------------------
total_msgs=$(( ${#CHANNEL_IDS[@]} * MSGS_PER_CHANNEL ))
echo "--- Sending $MSGS_PER_CHANNEL messages to each of ${#CHANNEL_IDS[@]} channels ($total_msgs total) ---"

msg_count=0
for ((c = 0; c < ${#CHANNEL_IDS[@]}; c++)); do
  cid="${CHANNEL_IDS[$c]}"
  cname="${CHANNEL_NAMES[$c]}"

  for ((m = 1; m <= MSGS_PER_CHANNEL; m++)); do
    payload=$(generate_message "$cid")
    api POST "chat.sendMessage" "$payload" > /dev/null

    msg_count=$((msg_count + 1))
    if (( msg_count % 50 == 0 )); then
      printf "  [%d/%d] messages sent (current channel: %s)\n" "$msg_count" "$total_msgs" "$cname"
    fi
  done
done

echo ""
echo "=== Done ==="
echo "  Users created:    ${#USERNAMES[@]}"
echo "  Channels created: ${#CHANNEL_IDS[@]}"
echo "  Messages sent:    $msg_count"