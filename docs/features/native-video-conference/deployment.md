# Deploying LiveKit next to Rocket.Chat

How to run a self-hosted LiveKit server beside a Rocket.Chat deployed with the official
[rocketchat-compose](https://github.com/RocketChat/rocketchat-compose) stack, reusing its Traefik for TLS and routing.
LiveKit Cloud works too: skip to [Rocket.Chat settings](#4-rocketchat-settings) and use its URL and keys.

> **Enterprise licence required.** The provider is part of the `videoconference-enterprise` module; without it the
> settings below do not exist.

## Prerequisites

- Rocket.Chat running from rocketchat-compose with `compose.traefik.yml` (Let's Encrypt enabled).
- A DNS name for LiveKit pointing at the same host, e.g. `livekit.example.com` next to `chat.example.com`.
- Inbound `7881/tcp` and `7882/udp` open on the host (media), plus `5349/tcp` if you enable [TURN](#turn-restrictive-networks). Signalling goes through Traefik on 443.

## 1. LiveKit configuration

Generate an API key pair:

```bash
echo "APIKey$(openssl rand -hex 8)"   # key
openssl rand -base64 32               # secret
```

Create `files/livekit/livekit.yaml` in the rocketchat-compose checkout:

```yaml
port: 7880
rtc:
  tcp_port: 7881
  # One UDP port for all media: simple firewall rules, one docker-proxy.
  udp_port: 7882
  use_external_ip: true
  # Behind NAT (most cloud VMs), set the public IP instead:
  # node_ip: 203.0.113.10
  stun_servers:
    - stun.l.google.com:19302
keys:
  <API key>: <API secret>
logging:
  level: info
```

## 2. The LiveKit service

Create `compose.livekit.yml` beside the other compose files. Pin a LiveKit release you have tested:

```yaml
services:
  livekit:
    image: docker.io/livekit/livekit-server:${LIVEKIT_RELEASE?pin a tested livekit-server release}
    restart: always
    command: --config /etc/livekit.yaml
    expose:
      - 7880
    ports:
      - 7881:7881/tcp
      - 7882:7882/udp
    volumes:
      - ./files/livekit/livekit.yaml:/etc/livekit.yaml:ro
```

## 3. Route it through Traefik

`compose.traefik.yml` generates Traefik's file-provider configuration in its `traefik-init` service. Add a router and a
service for LiveKit to the generated `https/dynamic.yml` (and `http/dynamic.yml` if you run without TLS), next to the
`rocketchat` ones:

```yaml
http:
  routers:
    livekit:
      entryPoints:
        - https
      service: livekit
      rule: Host(`{{ env "LIVEKIT_DOMAIN" }}`)
      tls:
        certResolver: le
  services:
    livekit:
      loadBalancer:
        servers:
          - url: "http://livekit:7880"
```

and pass `LIVEKIT_DOMAIN` to the `traefik` service's `environment`. Traefik forwards WebSocket upgrades as is and
obtains the certificate with the same `le` resolver Rocket.Chat uses.

Do not put SSO or proxy authentication in front of the LiveKit host: a LiveKit client cannot answer a proxy challenge.

Start everything with the extra file:

```bash
docker compose -f compose.database.yml -f compose.monitoring.yml -f compose.traefik.yml -f compose.yml -f compose.livekit.yml up -d
```

`curl -s https://livekit.example.com` answering anything but an error means signalling is reachable.

## 4. Rocket.Chat settings

Under **Administration → Settings → Conference Call**:

| Setting | Value |
| --- | --- |
| `VideoConf_Conference_Window_Enabled` | on (the call runs in the conference window, so the provider is only offered with it) |
| `VideoConf_LiveKit_Enabled` | on |
| `VideoConf_LiveKit_Url` | `wss://livekit.example.com` |
| `VideoConf_LiveKit_Api_Key` / `VideoConf_LiveKit_Api_Secret` | the pair from step 1 |
| `VideoConf_Default_Provider` | `livekit`, once it appears in the list |

The provider appears as soon as all of them are filled. `OVERWRITE_SETTING_<key>` in the `rocketchat` service's
environment sets them from the compose file instead, at the cost of making them read-only in the admin UI.

Background blur and noise suppression need nothing else: their runtime and models are served by Rocket.Chat itself,
so airgapped workspaces work as is.

## 5. Verify

1. Start a call in a DM, pass the preflight, and check your own tile appears.
2. Join from a second user **on a different network** (a phone on cellular data). A LAN test proves nothing about
   NAT or port forwarding: ICE succeeds over private addresses without touching the router.
3. In LiveKit's logs (`docker compose logs livekit | grep "participant active"`) check the selected pair is `udp`
   with your public IP.

| Symptom | Likely cause |
| --- | --- |
| No LiveKit option in the provider list | Licence missing, a setting empty, or the conference window disabled |
| Call window opens but nobody connects | `VideoConf_LiveKit_Url` wrong or the Traefik router missing |
| Connected, no audio/video | 7882/udp blocked, or `node_ip` not set behind NAT |
| Works on LAN only | LiveKit advertises private addresses: set `node_ip` |

## TURN (restrictive networks)

Clients that cannot reach UDP 7882 need LiveKit's TURN relay over TLS. Traefik already owns 443, so use 5349:

```yaml
turn:
  enabled: true
  domain: livekit.example.com
  tls_port: 5349
  cert_file: /etc/livekit/tls/cert.pem
  key_file: /etc/livekit/tls/key.pem
```

Publish `5349:5349/tcp` on the `livekit` service and open inbound `5349/tcp` on the host firewall, as for 7881 and 7882. Traefik keeps its certificates in `acme.json`, not as PEM files; export
them with a certificate dumper (for example `ldez/traefik-certs-dumper` watching the `traefik_ssl` volume) into a volume
mounted read-only at `/etc/livekit/tls`, or use a certificate of your own.

## Production notes

- **Scaling:** one LiveKit node handles many rooms. For more, run LiveKit on its own machine or use LiveKit Cloud; a
  multi-node LiveKit cluster needs Redis (`redis.address` in `livekit.yaml`).
- **Monitoring:** `prometheus_port: 6789` in `livekit.yaml` exposes metrics for the monitoring stack.
- **Port ranges:** the single UDP port covers most deployments. A port range needs `network_mode: host`; mapping
  thousands of ports through Docker spawns one proxy process per port.
