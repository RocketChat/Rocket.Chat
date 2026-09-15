# Deploying LiveKit for Rocket.Chat native video conferencing

How to stand up a self-hosted LiveKit media server alongside Rocket.Chat so that the
embedded video conference feature works end to end. Everything runs via a single Docker
Compose file.

> **Enterprise licence required.** The native video conference provider is gated behind the
> `videoconference-enterprise` module. The admin settings described below will not appear
> without it.

---

## Prerequisites

| Requirement | Why |
|---|---|
| A valid Rocket.Chat Enterprise licence | Unlocks the LiveKit provider and persistent chat settings |
| Docker and Docker Compose v2 | Runs the entire stack |
| A domain with DNS you control (two subdomains) | `chat.example.com` for Rocket.Chat, `livekit.example.com` for LiveKit |
| Ports 443, 7880, 7881, 7882/UDP open | Signalling and media traffic (see TURN section for relay ports) |

---

## 1. Generate LiveKit API credentials

LiveKit authenticates every participant and every server-to-server call with an API key / secret
pair. Generate one before writing any configuration:

```bash
export LIVEKIT_API_KEY="APIKey$(openssl rand -hex 8)"
export LIVEKIT_API_SECRET="$(openssl rand -base64 32)"
echo "Key:    $LIVEKIT_API_KEY"
echo "Secret: $LIVEKIT_API_SECRET"
```

Keep both values — they go in `livekit.yaml` and in the Rocket.Chat environment variables.

---

## 2. Directory layout

Create a directory with the following files:

```
rocketchat-livekit/
├── docker-compose.yml
├── Caddyfile
└── livekit.yaml
```

---

## 3. LiveKit server configuration

Create `livekit.yaml`:

```yaml
port: 7880
rtc:
  # Single-port UDP mux: all media on one port. Simpler firewall rules
  # and only one docker-proxy process instead of thousands.
  udp_port: 7882
  # If the host has a public IP on an interface, this discovers it automatically.
  # On a NAT'd cloud VM, set node_ip to the public IP instead.
  use_external_ip: true
  # node_ip: 203.0.113.10
  # Explicit STUN servers for public IP discovery. Without these, LiveKit's
  # built-in lookup can time out and silently fall back to advertising the
  # LAN address — calls work locally, fail remotely.
  stun_servers:
    - stun.l.google.com:19302
    - stun1.l.google.com:19302

keys:
  # Replace with the key/secret from step 1.
  APIKeyGoesHere: SecretGoesHere

logging:
  level: info

# TURN is disabled by default — see "Enabling TURN" below for what it takes.
turn:
  enabled: false
  # domain: livekit.example.com
  # tls_port: 5349
```

Replace `APIKeyGoesHere` / `SecretGoesHere` with the values from step 1, and
`livekit.example.com` with the domain you will point at the LiveKit server.

---

## 4. Caddyfile

Caddy handles TLS (automatic Let's Encrypt) and reverse-proxies both Rocket.Chat and
LiveKit signalling:

```
chat.example.com {
    reverse_proxy rocketchat:3000
}

livekit.example.com {
    reverse_proxy livekit:7880
}
```

Replace the domains with yours.

---

## 5. Docker Compose

This is the full stack: MongoDB, Rocket.Chat (from the PR branch image), LiveKit, and Caddy.

```yaml
services:
  mongodb:
    image: mongo:8.0
    restart: unless-stopped
    command: mongod --oplogSize 128 --replSet rs0
    volumes:
      - mongodb_data:/data/db
    healthcheck:
      test: >
        mongosh --quiet --eval "
          try { rs.status().ok } catch(e) { rs.initiate({ _id: 'rs0', members: [{ _id: 0, host: 'mongodb:27017' }] }).ok }
        "
      interval: 10s
      timeout: 5s
      retries: 5

  rocketchat:
    # PR image from GitHub Container Registry.
    # Replace with the official release image once the feature ships.
    # The pr-* tag moves on every commit — pin by digest for reproducibility:
    #   docker pull ghcr.io/rocketchat/rocket.chat:pr-41735
    #   docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/rocketchat/rocket.chat:pr-41735
    # Then use the sha256 digest in place of the tag.
    image: ghcr.io/rocketchat/rocket.chat:pr-41735
    restart: unless-stopped
    depends_on:
      mongodb:
        condition: service_healthy
    # Rocket.Chat makes server-side API calls to LiveKit over the public URL
    # (wss://livekit.example.com). Behind NAT, this requires hairpin NAT to
    # work. Pinning the hostname to the Docker host's LAN address avoids that
    # dependency — correct TLS certificate, no round-trip through the router.
    extra_hosts:
      - "livekit.example.com:host-gateway"
    environment:
      MONGO_URL: mongodb://mongodb:27017/rocketchat?replicaSet=rs0
      MONGO_OPLOG_URL: mongodb://mongodb:27017/local?replicaSet=rs0
      ROOT_URL: https://chat.example.com
      PORT: "3000"

      # --- Conference provider: select LiveKit as the default ---
      OVERWRITE_SETTING_VideoConf_Default_Provider: livekit

      # --- LiveKit connection ---
      OVERWRITE_SETTING_VideoConf_LiveKit_Enabled: "true"
      OVERWRITE_SETTING_VideoConf_LiveKit_Mode: self_hosted
      OVERWRITE_SETTING_VideoConf_LiveKit_Url: wss://livekit.example.com
      OVERWRITE_SETTING_VideoConf_LiveKit_Api_Key: APIKeyGoesHere
      OVERWRITE_SETTING_VideoConf_LiveKit_Api_Secret: SecretGoesHere

      # --- Persistent chat (optional) ---
      # Keeps a text conversation alongside the call so participants can
      # exchange messages, links, and files that survive after the call ends.
      OVERWRITE_SETTING_VideoConf_Enable_Persistent_Chat: "true"
      # Where chat messages go: "thread" (replies under the call's message)
      # or "main_room" (posted directly in the room timeline).
      OVERWRITE_SETTING_VideoConf_Persistent_Chat_Mode: thread

      # --- Room-type toggles (all enabled by default) ---
      # OVERWRITE_SETTING_VideoConf_Enable_DMs: "true"
      # OVERWRITE_SETTING_VideoConf_Enable_Channels: "true"
      # OVERWRITE_SETTING_VideoConf_Enable_Groups: "true"
      # OVERWRITE_SETTING_VideoConf_Enable_Teams: "true"
    ports:
      - "3000:3000"

  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro

  caddy:
    image: caddy:latest
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy_data:/data

volumes:
  mongodb_data:
  caddy_data:
```

Replace every `example.com`, `APIKeyGoesHere`, and `SecretGoesHere` with your real values.

### Why bridge networking, not `network_mode: host`

The compose file maps only the three ports LiveKit actually needs:

| Port | Protocol | Purpose |
|---|---|---|
| 7880 | TCP | WebSocket signalling (proxied by Caddy) |
| 7881 | TCP | WebRTC/TCP fallback |
| 7882 | UDP | All media via single-port mux |

The `udp_port: 7882` setting in `livekit.yaml` multiplexes every media stream onto one port,
so Docker only creates three `docker-proxy` processes. Without the mux, a port range like
50000–60000 would spawn ~10,000 proxy processes and consume 20 GB+ of RAM — mapped port
ranges are not practical.

Bridge networking also works on Docker Desktop (macOS/Windows), where `network_mode: host` is
not available.

If you prefer host networking (e.g. for maximum throughput on a dedicated machine), replace the
`ports:` block with `network_mode: host` and change the Caddyfile's LiveKit upstream from
`livekit:7880` to `localhost:7880`.

### Using nginx instead of Caddy

Replace the Caddy service with nginx if that is what you already run. The key requirement is
WebSocket upgrade support on the LiveKit upstream:

```nginx
server {
    listen 443 ssl;
    server_name livekit.example.com;

    ssl_certificate     /etc/letsencrypt/live/livekit.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/livekit.example.com/privkey.pem;

    location / {
        proxy_pass http://localhost:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 86400;
    }
}
```

### Using an existing reverse proxy

If you already run a reverse proxy (nginx, Traefik, HAProxy, etc.) that owns ports 80/443,
remove the Caddy service entirely and add two hostnames to your existing proxy instead — one
for Rocket.Chat, one for LiveKit signalling. Both need WebSocket upgrade support.

Do **not** put SSO or proxy-level authentication in front of the LiveKit hostname — a
LiveKit client cannot complete a proxy auth challenge.

### Enabling TURN

LiveKit's built-in TURN relay lets clients behind restrictive firewalls reach the server by
tunnelling media over TLS. It is **disabled by default** in this guide because it requires TLS
certificates that LiveKit can read directly, and getting them there cleanly depends on your
setup.

To enable it, uncomment the `turn` block in `livekit.yaml`:

```yaml
turn:
  enabled: true
  domain: livekit.example.com
  tls_port: 5349
  cert_file: /etc/livekit/tls/fullchain.pem
  key_file: /etc/livekit/tls/privkey.pem
```

> **Port 5349, not 443.** Port 443 is already taken by Caddy, so use 5349 (the IANA-assigned
> port for TURN over TLS) or another free port. Add `- "5349:5349/tcp"` and
> `- "5349:5349/udp"` to the livekit service's `ports:` block, and open the port in your
> firewall.

**How to provide certificates:**

| Approach | Pros | Cons |
|---|---|---|
| **Certbot on the host** — run Certbot standalone or via DNS challenge, mount the live certs into the LiveKit container | Works with any setup; certs renew via cron | Requires Certbot installed on the host; renewal needs a hook to restart LiveKit |
| **Mount Caddy's certs** — Caddy stores them in its data volume; mount the relevant path into LiveKit read-only | No extra tooling | Caddy's internal storage layout is not a stable API; path depends on the domain name and may change across Caddy versions |
| **Dedicated certificate** — use a separate cert (e.g. from your organisation's PKI) | Full control | Manual renewal |

Each approach mounts the cert files into the LiveKit container and points `cert_file` /
`key_file` at them. Example volume mount (adjust paths to match your cert source):

```yaml
  livekit:
    image: livekit/livekit-server:latest
    restart: unless-stopped
    command: --config /etc/livekit.yaml
    ports:
      - "7880:7880"
      - "7881:7881"
      - "7882:7882/udp"
      - "5349:5349/tcp"
      - "5349:5349/udp"
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml:ro
      - /etc/letsencrypt/live/livekit.example.com/fullchain.pem:/etc/livekit/tls/fullchain.pem:ro
      - /etc/letsencrypt/live/livekit.example.com/privkey.pem:/etc/livekit/tls/privkey.pem:ro
```

Without TURN, clients that cannot reach the UDP port range (e.g. behind strict corporate
firewalls that block all UDP) will fail to establish media. Most networks allow UDP, so TURN
is not required for testing or many production environments — but plan for it if your users
are on locked-down networks.

---

## 6. Start the stack

```bash
docker compose up -d
```

Wait for MongoDB to initialise its replica set (the healthcheck handles `rs.initiate`
automatically). Once Rocket.Chat is up, open `https://chat.example.com` and complete the
setup wizard.

Verify LiveKit is reachable:

```bash
curl -s https://livekit.example.com
```

Any non-error response means the signalling endpoint is up.

---

## 7. Rocket.Chat settings reference

All settings are under **Administration -> Settings -> Conference Call**.

### Default provider

| Setting | Key | Value |
|---|---|---|
| **Conference Call Provider** | `VideoConf_Default_Provider` | `livekit` |

This is a lookup field that lists registered providers. Once LiveKit is enabled and configured
(URL + key + secret), it appears in the dropdown. Select it so calls default to LiveKit
instead of any other installed provider.

### LiveKit connection (section: LiveKit)

| Setting | Key | Type | Default |
|---|---|---|---|
| **LiveKit Enabled** | `VideoConf_LiveKit_Enabled` | boolean | `false` |
| **Mode** | `VideoConf_LiveKit_Mode` | select | `self_hosted` |
| **LiveKit URL** | `VideoConf_LiveKit_Url` | string | — |
| **API Key** | `VideoConf_LiveKit_Api_Key` | string (secret) | — |
| **API Secret** | `VideoConf_LiveKit_Api_Secret` | password | — |

**Mode** is informational only — `self_hosted` and `cloud` behave identically at runtime.
The provider registers itself automatically once all four fields (enabled + URL + key + secret)
are filled.

### Persistent chat

| Setting | Key | Type | Default |
|---|---|---|---|
| **Enable Persistent Chat** | `VideoConf_Enable_Persistent_Chat` | boolean | `false` |
| **Chat Mode** | `VideoConf_Persistent_Chat_Mode` | select | `thread` |
| **Discussion Name** | `VideoConf_Persistent_Chat_Discussion_Name` | string | `Video Call Chat` |

When enabled, a text conversation runs alongside the call. Messages are visible to all call
participants and persist after the call ends.

**Chat Mode** controls where messages go:
- `thread` — replies are threaded under the call's started message in the room.
- `main_room` — messages appear directly in the room timeline. When `main_room` is selected
  and the Discussion feature is enabled, a discussion room is created using the template in
  **Discussion Name**.

### Room-type toggles

| Setting | Key | Default |
|---|---|---|
| **Enable in DMs** | `VideoConf_Enable_DMs` | `true` |
| **Enable in Channels** | `VideoConf_Enable_Channels` | `true` |
| **Enable in Groups** | `VideoConf_Enable_Groups` | `true` |
| **Enable in Teams** | `VideoConf_Enable_Teams` | `true` |

### Environment variable overrides

Every setting can be forced via `OVERWRITE_SETTING_<key>`:

```bash
OVERWRITE_SETTING_VideoConf_Default_Provider=livekit
OVERWRITE_SETTING_VideoConf_LiveKit_Enabled=true
OVERWRITE_SETTING_VideoConf_LiveKit_Mode=self_hosted
OVERWRITE_SETTING_VideoConf_LiveKit_Url=wss://livekit.example.com
OVERWRITE_SETTING_VideoConf_LiveKit_Api_Key=APIKeyGoesHere
OVERWRITE_SETTING_VideoConf_LiveKit_Api_Secret=SecretGoesHere
OVERWRITE_SETTING_VideoConf_Enable_Persistent_Chat=true
OVERWRITE_SETTING_VideoConf_Persistent_Chat_Mode=thread
```

> **Note:** `OVERWRITE_SETTING_*` variables make the corresponding settings **read-only in
> the admin UI**. This is the right trade for reproducibility, but anyone who later tries to
> change the LiveKit URL from the Settings page will find it locked. To change it, update the
> environment variable in the compose file and recreate the container.

---

## 8. Verify the integration

### Basic smoke test

1. Open a DM or channel in Rocket.Chat.
2. Click the camera icon in the room header to start a call.
3. The preflight screen should appear. Choose your devices and click **Start call**.
4. The call window opens with a LiveKit session — you should see your own camera tile.
5. From another user or browser, join the same call and confirm two-way audio and video.
6. If persistent chat is enabled, type a message in the call's chat panel and verify it
   appears as a thread reply (or in the room timeline, depending on the mode).

### Verify remote connectivity

> **A LAN-only test proves nothing about your production setup.** If both endpoints are on
> the same network, ICE negotiation succeeds over private addresses and never touches the
> router — so a misconfigured `node_ip` or missing port forward is invisible.

Test from a device on **cellular data** (not wifi on the same network), then check LiveKit's
logs for the selected candidate pair:

```bash
docker logs <livekit-container> 2>&1 | grep "participant active"
```

Confirm three things in the output:

- `"connectionType": "udp"` — media is not being forced onto TCP
- The local address is your **public IP**, not a 192.168.x.x or 10.x.x.x address
- The remote address is outside your LAN range

> **Don't trust port scanners.** `nmap -sU` on UDP ports often reports `open|filtered` even
> when the forward is working correctly. UDP scanning is inherently ambiguous and the probing
> host's own egress filtering produces false negatives. Use a real call, not a port scan.

### Troubleshooting

| Symptom | Likely cause |
|---|---|
| Camera icon missing from the room header | Default provider not set to `livekit`, or the LiveKit provider is not registered (check all four settings) |
| Preflight opens but the call window is blank | LiveKit URL is wrong or unreachable from the client browser |
| Call connects but no audio/video | UDP port 7882 is blocked; or `node_ip` is not set on a NAT'd host |
| "Provider not available" in the admin panel | Missing enterprise licence, or not all four settings are filled |
| Call works on LAN but not remotely | LiveKit is advertising private IPs. Check that `stun_servers` are configured in `livekit.yaml`. If behind NAT, set `node_ip` explicitly. With `network_mode: host`, also set `interfaces.includes` to the physical NIC |
| Chat panel is empty during a call | `VideoConf_Enable_Persistent_Chat` is not enabled |
| LiveKit settings don't appear in admin | The enterprise licence is missing or expired — without it the settings are not registered in the database at all (not hidden, absent). Verify with `db.rocketchat_settings.find({_id:/LiveKit/})` in the mongo shell |

---

## 9. Network requirements

### Ports

| Port | Protocol | Direction | Purpose |
|---|---|---|---|
| 80 | TCP | inbound | HTTP (Caddy redirect to HTTPS) |
| 443 | TCP | inbound | TLS signalling (WSS) |
| 3000 | TCP | inbound | Rocket.Chat (behind Caddy; not needed if Caddy proxies) |
| 5349 | TCP | inbound | TURN/TLS relay (only if TURN is enabled) |
| 7880 | TCP | inbound | LiveKit signalling (plain HTTP/WS, behind Caddy) |
| 7881 | TCP | inbound | WebRTC over TCP fallback |
| 7882 | UDP | inbound | WebRTC media (audio, video, screen share) — single-port mux |

With the `udp_port: 7882` mux, only **two ports** need forwarding beyond what the reverse
proxy already handles: 7881/TCP and 7882/UDP. If you use the port range instead of the mux,
forward the entire range.

### Firewall rules for participants

Browsers need:

- Outbound TCP 443 to both the Rocket.Chat and LiveKit domains
- Outbound UDP 7882 to the LiveKit server (media)

When UDP is blocked (corporate firewalls), LiveKit's built-in TURN relay (port 5349 in this
guide) can carry the media over TLS/TCP — see "Enabling TURN" above. This adds latency;
UDP is strongly preferred.

---

## 10. Noise cancellation notes

| Method | Requires | Notes |
|---|---|---|
| **Krisp** | LiveKit Cloud account | Does not work self-hosted — `setEnabled` calls a licensing endpoint that returns 404 |
| **RNNoise** | Nothing extra | Ships with Rocket.Chat in `public/noise-suppressor/`; works airgapped |
| **Browser native** | Nothing extra | Basic suppression via the `noiseSuppression` media constraint |

On a self-hosted deployment, users get RNNoise and browser-native suppression. The Krisp
option will not appear in the mic menu if it fails its entitlement check.

---

## 11. Production considerations

### NAT and public IP discovery

If the machine has a public IP directly on an interface, `use_external_ip: true` in
`livekit.yaml` discovers it automatically. If the machine is behind NAT (common on cloud
providers like AWS, GCP, Azure), set `node_ip` to the public IP explicitly — otherwise
clients outside the LAN will fail ICE negotiation and see no media.

With bridge networking (the default in this guide), the container sees only its virtual
interface, so `interfaces.includes` is unnecessary. If you switch to `network_mode: host`,
set `interfaces.includes` to the physical NIC name (e.g. `eth0`, `enp4s0`) — without it,
LiveKit enumerates every Docker bridge gateway as an ICE candidate, polluting negotiation.

The explicit `stun_servers` in `livekit.yaml` ensure public IP discovery works even when the
machine is behind NAT.

### TLS certificates

LiveKit clients connect via `wss://` — an expired or self-signed certificate prevents
connections from browsers. Use a trusted CA; Let's Encrypt via Caddy is the simplest path.

### Scaling

A single LiveKit server handles many concurrent rooms. For high call volume:

- The single-port UDP mux (`udp_port`) works for most deployments. For very high
  concurrency, remove `udp_port` and switch to `network_mode: host` with a port range
  (e.g. 50000–65535). Mapped port ranges are impractical due to Docker's per-port proxy
  overhead.
- Run LiveKit on a dedicated machine with sufficient bandwidth.
- Consider LiveKit Cloud for managed scaling.

### Redis (multi-node LiveKit)

A single-node LiveKit deployment does not need Redis. For multiple LiveKit nodes behind a
load balancer:

```yaml
# In livekit.yaml
redis:
  address: redis:6379
```

### Monitoring

LiveKit exposes Prometheus metrics on port 6789 by default:

```yaml
# In livekit.yaml
prometheus_port: 6789
```

### Rocket.Chat image

The `docker-compose.yml` above uses the PR image from the GitHub Container Registry:

```
ghcr.io/rocketchat/rocket.chat:pr-41735
```

This image is built by CI from
[PR #41735](https://github.com/RocketChat/Rocket.Chat/pull/41735).

> **Pin by digest, not by tag.** The `pr-*` tag is mutable — it moves every time the PR gets
> a new commit, so a plain tag will silently swap the application under you on any container
> recreate. Pull the image once, then use the digest:
>
> ```bash
> docker pull ghcr.io/rocketchat/rocket.chat:pr-41735
> docker inspect --format='{{index .RepoDigests 0}}' ghcr.io/rocketchat/rocket.chat:pr-41735
> # Use the sha256:... output as the image reference in docker-compose.yml
> ```

Once the feature ships to a release, replace it with the official release tag:

```
ghcr.io/rocketchat/rocket.chat:7.x.x
```

or the Docker Hub equivalent:

```
registry.rocket.chat/rocketchat/rocket.chat:7.x.x
```
