# TURN servers for voice calls

Voice calls (`VoIP_TeamCollab`) read ICE servers from two settings in *Workspace > Settings > Team voice calls (VoIP) > WebRTC settings*:

| Setting | Visibility | Use it for |
|---|---|---|
| **ICE servers** (`VoIP_TeamCollab_Ice_Servers`) | Public: readable by anyone, signed in or not | STUN servers only |
| **TURN servers** (`VoIP_TeamCollab_TURN_Servers`) | Private: kept on the server, `secret`, never readable by apps | TURN servers and their credentials |

When a call is created, the server sends each participant, on the call's `new` signal, the TURN servers with credentials for that user. The client uses them after the ICE servers from the public setting. Users who aren't on a call never receive them.

## The TURN servers setting

A JSON list. Each entry has `urls` (a `stun:`, `stuns:`, `turn:` or `turns:` URI, or a list of them) and an optional `auth`:

```json
[
	{ "urls": "turn:legacy.example.com:3478", "auth": { "type": "static", "username": "rocketchat", "credential": "…" } },
	{
		"urls": ["turn:turn.example.com:3478", "turns:turn.example.com:443?transport=tcp"],
		"auth": { "type": "shared-secret", "secret": "…", "ttl": 3600 }
	}
]
```

| `auth.type` | Credentials sent to the user |
|---|---|
| none | No credentials |
| `static` | `username` and `credential` as written. Long-lived, so anyone on a call can reuse them until you rotate them; prefer `shared-secret` where the TURN server supports it |
| `shared-secret` | Issued per user and per call, expiring after `ttl` seconds (default 86400) |

The value is validated against a schema when saved. A value that does not match is refused with an error, and one that reaches the server some other way (for instance an environment override) is ignored and logged.

### Shared secret credentials

These follow the TURN REST API ([draft-uberti-behave-turn-rest](https://datatracker.ietf.org/doc/draft-uberti-behave-turn-rest/00/)):

- username: `<expiry unix timestamp>:<user id>`
- password: `base64(HMAC-SHA1(secret, username))`

The protocol mandates HMAC-SHA1; coturn refuses credentials signed with any other hash. The TURN server checks them on its own: it recomputes the HMAC and refuses a username whose timestamp has passed. It never calls back to Rocket.Chat, and since the secret is a workspace setting, every Rocket.Chat instance issues credentials the TURN server accepts.

## Configuring a shared secret TURN server

1. Configure the TURN server with a shared secret (see the coturn example below).
2. Add an entry with `"auth": { "type": "shared-secret", "secret": "<static-auth-secret>" }` to **TURN servers**.
3. Remove any `username:password@turn:` entry from **ICE servers**, keeping only STUN entries there.

## coturn example

```ini
listening-port=3478
tls-listening-port=443
cert=/etc/coturn/fullchain.pem
pkey=/etc/coturn/privkey.pem

realm=turn.example.com
use-auth-secret
static-auth-secret=<the same value as the entry's auth.secret>

fingerprint
no-cli
no-multicast-peers

# Never relay into private or loopback ranges, so the TURN server can't be used to reach internal networks
denied-peer-ip=0.0.0.0-0.255.255.255
denied-peer-ip=10.0.0.0-10.255.255.255
denied-peer-ip=100.64.0.0-100.127.255.255
denied-peer-ip=127.0.0.0-127.255.255.255
denied-peer-ip=169.254.0.0-169.254.255.255
denied-peer-ip=172.16.0.0-172.31.255.255
denied-peer-ip=192.168.0.0-192.168.255.255
denied-peer-ip=::1
denied-peer-ip=fc00::-fdff:ffff:ffff:ffff:ffff:ffff:ffff:ffff
denied-peer-ip=fe80::-febf:ffff:ffff:ffff:ffff:ffff:ffff:ffff

# Bound what a single credential can consume
user-quota=12
total-quota=1200
```

TURN over TLS on 443 (`turns:` URIs) can get through restrictive networks that allow outbound TLS on 443; proxies that inspect HTTPS traffic still block it. If your media servers live on a private network the TURN server must reach, add an `allowed-peer-ip` for exactly those addresses instead of dropping the denied ranges.

## Shared secret credential lifetime (`ttl`)

- Credentials are minted whenever a participant receives the call's `new` signal: when the call is created, and again when a reconnecting client resyncs it. A peer connection that already exists keeps the credentials it started with.
- An allocation that already exists keeps relaying after its credentials expire. New allocations, which happen on ICE restarts after a network change, need valid credentials: a call whose network changes after the lifetime has passed will not recover. Keep the lifetime longer than your longest expected call.
- A deactivated user's credentials stay valid until they expire. Shorter lifetimes shrink that window.

The default is 86400 (24 hours) and the minimum 60. One to a few hours is a reasonable hardened value. Rocket.Chat and the TURN server compare an absolute timestamp, so keep both clocks in sync (NTP), especially with short lifetimes.

## Verifying

- In the browser, the `new` media signal received over the WebSocket carries `iceServers` with a `<timestamp>:<user id>` username; the shared secret never appears.
- `turnutils_uclient -u '<username>' -w '<credential>' turn.example.com` with credentials copied from that signal should allocate; once the timestamp has passed, coturn answers `401 Unauthorized`.
- With the browser restricted to relayed candidates, `chrome://webrtc-internals` should show a selected candidate pair of type `relay`.
