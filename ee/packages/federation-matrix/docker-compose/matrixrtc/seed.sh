#!/usr/bin/env bash
# Creates alice on rc1 and carol on rc2, opens a federated DM between them from rc1, has carol
# accept it on rc2, and checks one message arrives in each direction. Safe to re-run: existing
# users and the existing DM are reused.
#
# Usage: ./seed.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Test fixtures, local environment only (the server's password policy wants 14+ mixed chars).
ADMIN_USER=admin
ADMIN_PASS=admin
ALICE_USER=alice
ALICE_PASS='Alice-MatrixRTC-1'
CAROL_USER=carol
CAROL_PASS='Carol-MatrixRTC-2'

RC1=https://rc1
RC2=https://rc2
CA_CERT="$(grep -E '^CERTS_DIR=' .env | tail -1 | cut -d= -f2-)/ca/rootCA.crt"

log() { printf '[seed] %s\n' "$*"; }
fail() { printf '[seed] FAILED: %s\n' "$*" >&2; exit 1; }

# api <base> <auth "uid:token" or ""> <METHOD> <path> [json body]
api() {
	local base="$1" auth="$2" method="$3" path="$4" body="${5:-}"
	local args=(-sS --max-time 30 --cacert "$CA_CERT" -X "$method" -H 'Content-Type: application/json')
	if [[ -n "$auth" ]]; then
		args+=(-H "X-User-Id: ${auth%%:*}" -H "X-Auth-Token: ${auth#*:}")
	fi
	if [[ -n "$body" ]]; then
		args+=(--data "$body")
	fi
	curl "${args[@]}" "$base/api/v1/$path"
}

login() {
	local base="$1" user="$2" pass="$3" res
	res="$(api "$base" '' POST login "$(jq -nc --arg u "$user" --arg p "$pass" '{user: $u, password: $p}')")"
	jq -er '.data | "\(.userId):\(.authToken)"' <<<"$res" || fail "login $user on $base: $res"
}

ensure_user() {
	local base="$1" admin="$2" user="$3" pass="$4" name="$5" res
	res="$(api "$base" "$admin" GET "users.info?username=$user")"
	if jq -e '.success == true' <<<"$res" >/dev/null; then
		log "$user already exists on $base"
		return
	fi
	res="$(api "$base" "$admin" POST users.create "$(jq -nc --arg u "$user" --arg p "$pass" --arg n "$name" \
		'{username: $u, password: $p, name: $n, email: "\($u)@\($u).test", verified: false, requirePasswordChange: false, sendWelcomeEmail: false}')")"
	jq -e '.success == true' <<<"$res" >/dev/null || fail "users.create $user on $base: $res"
	log "created $user on $base"
}

# retry <description> <attempts> <command...>: runs the command every 2s until it succeeds.
retry() {
	local what="$1" attempts="$2" i
	shift 2
	for ((i = 1; i <= attempts; i++)); do
		if "$@"; then
			return 0
		fi
		sleep 2
	done
	fail "$what (gave up after $attempts attempts)"
}

for base in "$RC1" "$RC2"; do
	code="$(curl -s -o /dev/null -w '%{http_code}' --cacert "$CA_CERT" "$base/_matrix/federation/v1/version" || true)"
	[[ "$code" == 200 ]] || fail "federation is not active on $base (HTTP $code); an expired or missing licence is the usual cause"
done

log "logging in as admin on both servers"
RC1_ADMIN="$(login "$RC1" "$ADMIN_USER" "$ADMIN_PASS")"
RC2_ADMIN="$(login "$RC2" "$ADMIN_USER" "$ADMIN_PASS")"

ensure_user "$RC1" "$RC1_ADMIN" "$ALICE_USER" "$ALICE_PASS" 'Alice (rc1)'
ensure_user "$RC2" "$RC2_ADMIN" "$CAROL_USER" "$CAROL_PASS" 'Carol (rc2)'

ALICE="$(login "$RC1" "$ALICE_USER" "$ALICE_PASS")"
CAROL="$(login "$RC2" "$CAROL_USER" "$CAROL_PASS")"

CAROL_MXID="@$CAROL_USER:rc2"
ALICE_MXID="@$ALICE_USER:rc1"

log "alice creates a DM with $CAROL_MXID on rc1"
res="$(api "$RC1" "$ALICE" POST dm.create "$(jq -nc --arg u "$CAROL_MXID" '{username: $u}')")"
RC1_RID="$(jq -er '.room._id' <<<"$res")" || fail "dm.create: $res"

res="$(api "$RC1" "$ALICE" GET "rooms.info?roomId=$RC1_RID")"
jq -e '.room.federated == true' <<<"$res" >/dev/null || fail "room $RC1_RID on rc1 is not federated: $res"
MRID="$(jq -er '.room.federation.mrid' <<<"$res")" || fail "no federation.mrid on $RC1_RID: $res"
log "rc1 room $RC1_RID  matrix room $MRID"

find_rc2_room() {
	RC2_RID="$(api "$RC2" "$CAROL" GET rooms.get | jq -r --arg m "$MRID" '.update[]? | select(.federation.mrid == $m) | ._id' | head -1)"
	[[ -n "$RC2_RID" ]]
}
retry "the DM reaching rc2" 30 find_rc2_room
log "rc2 room $RC2_RID"

SUB_STATUS="$(api "$RC2" "$CAROL" GET "subscriptions.getOne?roomId=$RC2_RID" | jq -r '.subscription.status // "JOINED"')"
if [[ "$SUB_STATUS" == "INVITED" ]]; then
	log "carol accepts the invite on rc2"
	res="$(api "$RC2" "$CAROL" POST rooms.invite "$(jq -nc --arg r "$RC2_RID" '{roomId: $r, action: "accept"}')")"
	jq -e '.success == true' <<<"$res" >/dev/null || fail "rooms.invite accept: $res"
else
	log "carol's subscription on rc2 is $SUB_STATUS"
fi

# rc1 records the accepted invite as a "user joined" system message.
carol_joined_on_rc1() {
	api "$RC1" "$ALICE" GET "dm.history?roomId=$RC1_RID&count=100" |
		jq -e --arg u "$CAROL_MXID" '.messages[]? | select(.t == "uj" and .u.username == $u)' >/dev/null
}
retry "carol's join reaching rc1" 30 carol_joined_on_rc1
log "carol is a member of the DM on rc1"

send() {
	local base="$1" auth="$2" rid="$3" text="$4" res
	res="$(api "$base" "$auth" POST chat.sendMessage "$(jq -nc --arg r "$rid" --arg t "$text" '{message: {rid: $r, msg: $t}}')")"
	jq -e '.success == true' <<<"$res" >/dev/null || fail "chat.sendMessage on $base: $res"
}

has_message() {
	local base="$1" auth="$2" rid="$3" text="$4"
	api "$base" "$auth" GET "dm.history?roomId=$rid&count=50" |
		jq -e --arg t "$text" '.messages[]? | select(.msg == $t)' >/dev/null
}

STAMP="$(date '+%Y-%m-%dT%H:%M:%S')"

MSG1="hello carol, from alice@rc1 ($STAMP)"
log "alice -> carol: $MSG1"
send "$RC1" "$ALICE" "$RC1_RID" "$MSG1"
retry "alice's message reaching rc2" 30 has_message "$RC2" "$CAROL" "$RC2_RID" "$MSG1"
log "arrived on rc2"

MSG2="hello alice, from carol@rc2 ($STAMP)"
log "carol -> alice: $MSG2"
send "$RC2" "$CAROL" "$RC2_RID" "$MSG2"
retry "carol's message reaching rc1" 30 has_message "$RC1" "$ALICE" "$RC1_RID" "$MSG2"
log "arrived on rc1"

cat <<INFO

Federated DM ready.
  rc1  https://rc1  $ALICE_USER / $ALICE_PASS   ($ALICE_MXID)  room $RC1_RID
  rc2  https://rc2  $CAROL_USER / $CAROL_PASS   ($CAROL_MXID)  room $RC2_RID
  matrix room $MRID
INFO
