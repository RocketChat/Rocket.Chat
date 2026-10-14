# TURN shared secret for voice calls

Voice calls (`VoIP_TeamCollab`) can authenticate with TURN servers in two ways, picked by **TURN authentication** (`VoIP_TeamCollab_TURN_Auth_Mode`) in *Workspace > Settings > Team voice calls (VoIP) > WebRTC settings*.

| Mode | Where the credentials come from | Who sees them |
|---|---|---|
| Static credentials | `username:password@turn:host:port` entries in **ICE servers** | Anyone: the ICE servers setting is public, readable without signing in |
| Shared secret (time-limited) | Issued by the server for each user on each call | Only the user on the call, and only until they expire |

Shared secret mode follows the TURN REST API ([draft-uberti-behave-turn-rest](https://datatracker.ietf.org/doc/draft-uberti-behave-turn-rest/00/)). When a call is created, the server sends each participant, on the call's `new` signal, credentials of the form:

- username: `<expiry unix timestamp>:<user id>`
- password: `base64(HMAC-SHA1(shared secret, username))`

The TURN server checks them on its own: it recomputes the HMAC and refuses a username whose timestamp has passed. It never calls back to Rocket.Chat, and since the secret is a workspace setting, every Rocket.Chat instance issues credentials the TURN server accepts.

## Configuring

1. Configure the TURN server with a shared secret (see the coturn example below).
2. In Rocket.Chat, set:
   - **TURN authentication**: Shared secret (time-limited)
   - **TURN servers**: the TURN URIs, comma separated, without credentials, e.g. `turn:turn.example.com:3478,turns:turn.example.com:443?transport=tcp`
   - **TURN shared secret**: the same value as the TURN server's `static-auth-secret`
   - **TURN credential lifetime (seconds)**: see below
3. Remove any `username:password@turn:` entry from **ICE servers**. That setting is still sent to every client as is, and its servers are used alongside the issued ones. Keep only STUN entries there.

Both TURN servers and shared secret are required. If either is empty, no credentials are issued and calls fall back to the ICE servers setting alone.

## coturn example

```ini
listening-port=3478
tls-listening-port=443
cert=/etc/coturn/fullchain.pem
pkey=/etc/coturn/privkey.pem

realm=turn.example.com
use-auth-secret
static-auth-secret=<the same value as TURN shared secret>

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

TURN over TLS on 443 (`turns:` URIs) gets through restrictive corporate networks that only allow HTTPS. If your media servers live on a private network the TURN server must reach, add an `allowed-peer-ip` for exactly those addresses instead of dropping the denied ranges.

## Credential lifetime

- Credentials are minted when the call is created and re-issued whenever the client re-syncs with the server (reconnects), so a lifetime only has to cover the gap between those.
- An allocation that already exists keeps relaying after its credentials expire. New allocations, which happen on ICE restarts after a network change, need valid credentials: a call that loses its network after the lifetime has passed and cannot reconnect to Rocket.Chat first will not recover.
- A deactivated user's credentials stay valid until they expire. Shorter lifetimes shrink that window.

The default is 86400 (24 hours). One to a few hours is a reasonable hardened value. Rocket.Chat and the TURN server compare an absolute timestamp, so keep both clocks in sync (NTP), especially with short lifetimes.

## Verifying

- In the browser, the `new` media signal received over the WebSocket carries `iceServers` with a `<timestamp>:<user id>` username; the shared secret never appears.
- `turnutils_uclient -u '<username>' -w '<credential>' turn.example.com` with credentials copied from that signal should allocate; once the timestamp has passed, coturn answers `401 Unauthorized`.
- With the browser restricted to relayed candidates, `chrome://webrtc-internals` should show a selected candidate pair of type `relay`.
