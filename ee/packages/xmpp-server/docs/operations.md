# Operations

What an administrator configures, on both sides of the federation, and how the microservice
is run. Behaviour is specified in [specs/](specs/); the code layout in
[architecture.md](architecture.md).

Rocket.Chat acts as a native XMPP server: it federates directly with any other XMPP server
over the standard server-to-server (S2S) protocol, without bridges. This is independent from,
and can coexist with, the XMPP support offered through the Matrix federation appservice bridge
(`Federation_XMPP_*` settings). It requires an enterprise license with the `federation` module
and a microservices deployment running `xmpp-server-service`.

## Admin settings

Under **Admin → Settings → Federation → XMPP Server**:

| Setting | Default | Purpose |
| --- | --- | --- |
| `XMPP_Server_Enabled` | off | Master toggle for the native XMPP server |
| `XMPP_Server_Domain` | empty | The XMPP domain this server serves (e.g. `chat.example.com`). This is the domain part of every local user's JID |
| `XMPP_Server_Port` | `5269` | S2S listen port |
| `XMPP_Server_TLS_Certificate` | empty | PEM certificate chain used for STARTTLS |
| `XMPP_Server_TLS_Key` | empty | PEM private key |
| `XMPP_Server_MUC_Subdomain` | `conference` | Subdomain of the MUC service (`conference.chat.example.com`) |
| `XMPP_Server_Domain_Allow_List` | empty | Comma-separated remote domains allowed to federate; empty allows all |
| `XMPP_Server_Presence_Enabled` | on | Toggle presence exchange (both directions) |

Changing the domain, port, MUC subdomain or TLS material restarts the listener. Changing the
allow list currently needs a service restart
([configuration-and-lifecycle D1](specs/configuration-and-lifecycle.md#d1-allow-list-changes-need-a-service-restart)).

## DNS

For other XMPP servers to reach you, publish SRV records for the XMPP domain **and** the MUC
subdomain, pointing at the host running the microservice:

```
_xmpp-server._tcp.chat.example.com.            IN SRV 0 5 5269 rc-host.example.com.
_xmpp-server._tcp.conference.chat.example.com. IN SRV 0 5 5269 rc-host.example.com.
```

If no SRV records exist, remote servers fall back to resolving the domain itself on port 5269.
In that case `chat.example.com` and `conference.chat.example.com` must resolve to the host
directly.

## TLS certificate

The certificate should cover both the XMPP domain and the MUC subdomain (SAN entries for
`chat.example.com` and `conference.chat.example.com`, or a wildcard). A publicly trusted
certificate additionally enables SASL EXTERNAL authentication with peers. With a self-signed
certificate, federation still works via dialback as long as the peer accepts
encrypted-but-unverified streams (Prosody and ejabberd default policies vary, see below).

Without any certificate the server does not offer STARTTLS at all and federates over
cleartext dialback with peers that tolerate it ([ADR 0004](adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)).

## Network

Port 5269 (or the configured port) must be reachable from the internet, TCP, both directions:
inbound for remote servers connecting to you, outbound for connections you originate,
including the dialback verification connections remote servers make back to you.

The listener binds inside the `xmpp-server-service` microservice, not the main Rocket.Chat
process. It is not HTTP: it cannot sit behind the usual reverse proxy. Expose the port
directly or through a TCP-level proxy.

## The microservice

`ee/apps/xmpp-server-service` is the only host of `XMPPServerService`. Meteor does not
register it in either deployment mode. Without the microservice, Meteor's `XMPPServer.*`
calls from the hooks resolve to nothing and the feature is inactive
([ADR 0002](adr/0002-integration-service-runs-only-as-a-microservice.md)).

```sh
# Meteor started with TRANSPORTER=TCP (or a NATS URL), then:
yarn workspace @rocket.chat/xmpp-server-service ms
```

The process starts only after Meteor's `settings` and `license` services are reachable. The
S2S listener binds `XMPP_Server_Port` in this process. The health check listens on `PORT`
(default 3039); moleculer metrics use the broker's usual port (9458). The generic
`ee/apps/Dockerfile` builds it with `SERVICE=xmpp-server-service`. Each process opens its own
listener with its own in-memory state, so run **one instance per XMPP domain**
([ADR 0012](adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).

### Environment variables

| Variable | Effect |
| --- | --- |
| `PORT` | Health and stats port. Default 3039 |
| `LOG_LEVEL` | `warn`, `info` or `debug`. Without it loggers stay at `warn`, because the `Log_Level` admin setting only takes effect inside Meteor's own process. At `debug` every inbound event is logged with its payload, including the stanza XML; payloads are only serialized when debug is on, so leave it off during throughput runs |
| `XMPP_DECODE_ONLY` | `true` parses, routes and answers at the protocol level but forwards nothing to Rocket.Chat; hosted-MUC joins skip the database check and remote-MUC joins request no history. For load-testing decoding alone |
| `XMPP_DNS_OVERRIDES` | `domain=host:port,…` answers S2S lookups for the listed domains without DNS; every other domain resolves normally. Lets load-test peers on local ports pass dialback |

### Observability

`GET /stats` on the health port returns a JSON snapshot:

- `decoded`: running totals of every inbound event the protocol core has decoded, by event name.
- `inflight`, `completed`, `failed`: the Rocket.Chat-side handling of those events. A handler
  counts as in flight from the moment its event is decoded until its database writes and
  broker calls settle.
- `decodeOnly`: whether the service runs with `XMPP_DECODE_ONLY=true`.
- `durations`: raw handler-latency histogram buckets.
- `eventLoopLagP99Ms`: the worst event-loop delay since the previous read.
- `rssBytes`.

`GET /metrics` exposes the same in Prometheus format, plus the Node defaults.

Inbound handling has no queue and no concurrency limit: handlers start as stanzas arrive and
never throttle the socket. An overloaded service accepts everything and falls behind silently;
what grows is `inflight`, not refused traffic.

## Configuration on the XMPP side

Usually **none**: this is standard XMPP federation, and public XMPP servers federate with
unknown domains by default. Checks for the remote administrator if federation does not come
up:

- S2S must be enabled and port 5269 open in both directions (the default on Prosody, ejabberd
  and Openfire).
- If the remote server **requires verified TLS certificates for S2S** (Prosody
  `s2s_secure_auth = true`), the Rocket.Chat certificate must be publicly trusted or
  explicitly allowed on their side (Prosody `s2s_insecure_domains`).
- If the remote server runs a domain allowlist, `chat.example.com` must be on it.

## How users start communicating

### From the Rocket.Chat side

- **Direct message a remote XMPP user**: open the new Direct Message dialog and type the full
  JID (`alice@remote.tld`). A DM room is created; messages are delivered to the remote server
  and replies arrive in the same room. The remote user shows up like any other federated user.
- **Create an XMPP room**: in the channel-creation dialog, enable **XMPP Federated** (visible
  when the feature is enabled and you hold `access-federation`). This creates a normal
  Rocket.Chat channel that is simultaneously a MUC room at `<name>@conference.chat.example.com`.
  Public channels are joinable by anyone on the XMPP network, subject to the allow list;
  private groups only by invited users.
- **Invite a remote XMPP user to a room you host**: add them by full JID in the members field
  of the channel-creation dialog or later through **Members → Add users**. They become a
  member and receive a MUC invitation.
- **Join a room hosted on a remote XMPP server**: not possible proactively. A remote user must
  invite you; accepting joins you to the remote room, which appears in your sidebar as
  `<room>:<conference domain>` with a globe icon.

### From the XMPP side

- **Direct message a Rocket.Chat user**: message `username@chat.example.com` from any client.
  No prior contact or subscription is required.
- **Presence**: send a subscription request to a Rocket.Chat user you already share a DM
  with; it is auto-accepted. Requests from strangers are declined.
- **Join a Rocket.Chat-hosted room**: join `<room>@conference.chat.example.com` as a regular
  MUC. Public channels admit anyone; private groups require an invitation (a join without one
  is refused with `registration-required`). A disco query on `chat.example.com` lists the
  conference service and its public rooms.
- **Invite a Rocket.Chat user to a room on your server**: send a MUC invite, mediated
  (XEP-0045 §7.8) or direct (XEP-0249), to `username@chat.example.com`. Rocket.Chat joins the
  room on their behalf and mirrors it as a channel.

## Running the end-to-end suite

The suite in `tests/end-to-end/` runs against servers you already have; it sets none of them
up and is not part of CI.

What the servers need:

- **ejabberd**: `mod_register` allows registration and `registration_timeout: infinity` is
  set (otherwise one registration per IP every ten minutes); `mod_muc` and `mod_mam` are on,
  so rooms archive and stamp XEP-0359 stanza ids, which some of the duplicate cases depend
  on; `s2s_use_starttls: optional` when Rocket.Chat has no TLS certificate.
- **Rocket.Chat**: the repo's test admin exists (as under `TEST_MODE`,
  `apps/meteor/tests/data/user.ts`); the XMPP server is enabled; the allow list is empty or
  includes the XMPP server's domain.
- **xmpp-server-service**: runs without `XMPP_DECODE_ONLY`.
- **Name resolution**: each server resolves the other's domain and MUC subdomain, through
  DNS, `/etc/hosts` or `XMPP_DNS_OVERRIDES` on the service.
- **Node**: trusts the XMPP server's certificate, for example with `NODE_EXTRA_CA_CERTS`
  pointing at a local mkcert root.

```sh
NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem" XMPP_E2E_XMPP_DOMAIN=xmpp.host \
yarn workspace @rocket.chat/xmpp-server test:e2e
```

One file, or a single case by name, from `ee/packages/xmpp-server`:

```sh
node --import tsx --test --test-name-pattern='stores a message from the room once' tests/end-to-end/remote-muc.spec.ts
```

| Variable | Default |
| --- | --- |
| `XMPP_E2E_XMPP_DOMAIN` | required: the XMPP server's domain |
| `XMPP_E2E_XMPP_SERVICE` | `xmpp://localhost:5222` |
| `XMPP_E2E_XMPP_MUC_DOMAIN` | `conference.<domain>` |
| `TEST_API_URL` | `http://localhost:3000`, the same variable as every other e2e suite |
| `XMPP_E2E_RC_DDP_URL` | `TEST_API_URL`. With microservices, point it at the DDP streamer (for example `http://localhost:4000`): it owns websocket sessions, and presence depends on them |
| `XMPP_E2E_SERVICE_URL` | `http://localhost:3039`. When it does not answer, the `/stats` checks are skipped |
