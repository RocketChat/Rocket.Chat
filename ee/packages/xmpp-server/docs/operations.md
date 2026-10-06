# Operations

What an administrator configures, on both sides of the federation, and how the microservice
is run. Behaviour is specified in [specs/](specs/); the code layout in
[architecture.md](architecture.md).

Rocket.Chat acts as a native XMPP server: it federates directly with any other XMPP server
over the standard server-to-server (S2S) protocol, without bridges. This is independent from,
and can coexist with, the XMPP support offered through the Matrix federation appservice bridge
(`Federation_XMPP_*` settings). It requires an enterprise license with the `federation` module
and the `xmpp-server-service` microservice.

## Admin settings

Under **Admin → Settings → Federation → XMPP Server (Native)**. The section labelled
**XMPP** next to it configures the Matrix bridge, not this server. Every setting except
**Enabled** is read-only until **Enabled** is on.

| Setting | Label | Default | Purpose |
| --- | --- | --- | --- |
| `XMPP_Server_Enabled` | Enabled | off | Master toggle for the native XMPP server |
| `XMPP_Server_Domain` | XMPP Domain | empty | The XMPP domain this server serves (e.g. `chat.example.com`). This is the domain part of every local user's JID. The server does not start while it is empty |
| `XMPP_Server_Port` | S2S Port | `5269` | S2S listen port |
| `XMPP_Server_TLS_Certificate` | TLS Certificate (PEM) | empty | PEM certificate chain used for STARTTLS |
| `XMPP_Server_TLS_Key` | TLS Private Key (PEM) | empty | PEM private key |
| `XMPP_Server_MUC_Subdomain` | MUC Subdomain | `conference` | Subdomain of the MUC service (`conference.chat.example.com`) |
| `XMPP_Server_Domain_Allow_List` | Domain Allow List | empty | Comma-separated remote domains allowed to federate; empty allows all. Matched exactly, see below |
| `XMPP_Server_Presence_Enabled` | Exchange Presence | on | Toggle presence exchange (both directions). See [Presence](#presence) for what works today |

A hidden setting, `XMPP_Server_Message_Id_Secret`, is generated once at first start. Inbound
message ids are derived from it, and corrections depend on those ids staying stable
([ADR 0014](adr/0014-inbound-message-id-is-derived-from-room-author-and-sender-id.md)).
Do not change or clear it.

### When a change takes effect

- **Domain, port, MUC subdomain, certificate or key**: the listener restarts at once and every
  open S2S connection is dropped.
- **Exchange Presence**: takes effect at once.
- **Domain Allow List**: applied only the next time the listener starts. Restart the service,
  turn **Enabled** off and on, or change one of the listener settings above
  ([configuration-and-lifecycle D1](specs/configuration-and-lifecycle.md#d1-allow-list-changes-need-a-service-restart)).

### Domain allow list

Each entry is compared with the whole remote domain after IDNA and lowercase normalization;
subdomains are not included. A peer's rooms live on its MUC domain, so allowing `remote.tld`
does not allow `conference.remote.tld`. To use the remote server's rooms, list both:

```
remote.tld, conference.remote.tld
```

The list is checked on every outbound stanza and on every inbound connection, SASL and
dialback attempt.

### Changing the domain on a live install

Hosted rooms store their MUC address (`<room>@conference.<old domain>`) when they are
created, and nothing rewrites it. After a domain or MUC subdomain change, existing hosted
rooms can no longer be joined from XMPP, and remote contacts keep the old JIDs of local
users. Choose the domain before creating XMPP rooms. Renaming a hosted room in Rocket.Chat
does not change its MUC address either.

## DNS

For other XMPP servers to reach you, publish SRV records for the XMPP domain **and** the MUC
subdomain, pointing at the host running the microservice and the port in `XMPP_Server_Port`:

```
_xmpp-server._tcp.chat.example.com.            IN SRV 0 5 5269 rc-host.example.com.
_xmpp-server._tcp.conference.chat.example.com. IN SRV 0 5 5269 rc-host.example.com.
```

If no SRV records exist, remote servers fall back to resolving the domain itself on port 5269.
In that case `chat.example.com` and `conference.chat.example.com` must resolve to the host
directly, and the listener must be on 5269. With any other port the SRV records are required.

This server resolves peers the same way: SRV `_xmpp-server._tcp.<domain>`, then the domain on
5269.

## TLS certificate

The certificate should cover both the XMPP domain and the MUC subdomain (SAN entries for
`chat.example.com` and `conference.chat.example.com`, or a wildcard). TLS is on only when
both the certificate and the key are set.

**With a certificate**, TLS is mandatory in both directions. Inbound connections are told
STARTTLS is required, and outbound connections to a peer that does not offer STARTTLS are
abandoned. A publicly trusted certificate also enables SASL EXTERNAL with peers. With a
self-signed one, federation still works through dialback, as long as the peer accepts
encrypted streams it cannot verify (see [Configuration on the XMPP side](#configuration-on-the-xmpp-side)).
This server accepts peers' self-signed certificates the same way.

**Without a certificate**, the server never offers STARTTLS and never starts it outbound,
even when the peer offers it. It federates over cleartext dialback only with peers that allow
cleartext, which excludes peers configured to require encryption
([ADR 0004](adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)).

## Network

The listener binds `0.0.0.0:<XMPP_Server_Port>` inside the `xmpp-server-service`
microservice, not in the main Rocket.Chat process. It is not HTTP: it cannot sit behind the
usual reverse proxy. Expose the port directly or through a TCP-level proxy.

| Direction | What |
| --- | --- |
| Inbound TCP to `XMPP_Server_Port` | remote servers connecting to you, including the dialback verification connections they make back to you |
| Outbound TCP to remote S2S ports | connections you originate, including your own dialback verification connections. The port is 5269 or whatever the peer's SRV records give |
| Outbound DNS | SRV and address lookups for every peer domain |

## The microservice

`ee/apps/xmpp-server-service` is the only host of `XMPPServerService`. Meteor does not
register it in either deployment mode. Without the microservice, Meteor's `XMPPServer.*`
calls from the hooks resolve to nothing and the feature is inactive
([ADR 0002](adr/0002-integration-service-runs-only-as-a-microservice.md)).

```sh
# Meteor started with TRANSPORTER=TCP (or a NATS URL), then:
yarn workspace @rocket.chat/xmpp-server-service ms
```

`ms` defaults `TRANSPORTER` to `TCP` and `MONGO_URL` to `mongodb://localhost:3001/meteor`
(the Meteor development database); set both for anything else. The service reads and writes
MongoDB directly.

The process starts only after Meteor's `settings` and `license` services are reachable. The
S2S listener binds `XMPP_Server_Port` in this process. `GET /health`, `GET /stats` and
`GET /metrics` are served on `PORT`.

The generic `ee/apps/Dockerfile` builds it with `SERVICE=xmpp-server-service`, with a FIPS
variant alongside. The image sets `PORT=3000` and exposes only 3000 and 9458: publish the S2S
port yourself.

Each process opens its own listener with its own in-memory state, so run **one instance per
XMPP domain** ([ADR 0012](adr/0012-core-state-is-ephemeral-and-rebuilt-from-the-database.md)).

### Environment variables

| Variable | Effect |
| --- | --- |
| `MONGO_URL` | Required. The Rocket.Chat database |
| `TRANSPORTER` | The broker transport, the same value Meteor runs with (`TCP` or a NATS URL) |
| `PORT` | Health, stats and metrics port. Default 3039; the Docker image sets 3000 |
| `LOG_LEVEL` | `warn`, `info` or `debug`; any other value is ignored. Without it loggers stay at `warn`, because the `Log_Level` admin setting only takes effect inside Meteor's own process. At `debug` each inbound event is logged by name, together with connection, dialback and dropped-stanza diagnostics |
| `XMPP_DECODE_ONLY` | `true` parses, routes and answers at the protocol level but forwards nothing to Rocket.Chat; hosted-MUC joins skip the database check and remote-MUC joins request no history. For load-testing decoding alone |
| `XMPP_DNS_OVERRIDES` | `domain=host:port,…` answers S2S lookups for the listed domains without DNS; every other domain resolves normally. Lets load-test peers on local ports pass dialback. A malformed entry stops the service at startup |
| `MS_METRICS`, `MS_METRICS_PORT` | The broker's own Prometheus metrics, off unless `MS_METRICS=true`, on port 9458 by default. Same as every other microservice |

### Observability

`GET /stats` on `PORT` returns a JSON snapshot:

- `decoded`: running totals of every inbound event the protocol core has decoded, by event name.
- `inflight`, `completed`, `failed`: the Rocket.Chat-side handling of those events. A handler
  counts as in flight from the moment its event is decoded until its database writes and
  broker calls settle.
- `decodeOnly`: whether the service runs with `XMPP_DECODE_ONLY=true`.
- `durations`: handler latency per event, as cumulative histogram buckets (`le` in seconds,
  `counts`) and a `total`.
- `eventLoopLagP99Ms`: the 99th-percentile event-loop delay since the previous `/stats` read.
  Every read resets it, so let only one poller read it.
- `rssBytes`.

`GET /metrics` exposes, in Prometheus format, the Node defaults plus:

| Metric | Labels |
| --- | --- |
| `xmpp_inbound_decoded_total` | `event` |
| `xmpp_handler_inflight` | `event` |
| `xmpp_handler_completed_total` | `event`, `outcome` |
| `xmpp_handler_duration_seconds` | `event` |

Inbound handling has no queue and no concurrency limit: handlers start as stanzas arrive and
never throttle the socket. An overloaded service accepts everything and falls behind silently;
what grows is `inflight`, not refused traffic.

### Load testing

`yarn workspace @rocket.chat/xmpp-server-service loadtest` starts fake remote XMPP servers on
local ports and drives DM, presence, MUC or mixed traffic at a running service, either on a
ramp or at maximum rate, and writes a report. `loadtest overrides` prints the
`XMPP_DNS_OVERRIDES` value to start the service with, and `loadtest --help` prints every
option. A full run is walked through in [architecture.md](architecture.md#load-testing).

## Configuration on the XMPP side

Usually **none**: this is standard XMPP federation, and public XMPP servers federate with
unknown domains by default. Checks for the remote administrator if federation does not come
up:

- S2S must be enabled and port 5269 open in both directions (the default on Prosody, ejabberd
  and Openfire).
- If the remote server **requires verified TLS certificates for S2S** (Prosody
  `s2s_secure_auth = true`), the Rocket.Chat certificate must be publicly trusted or
  explicitly allowed on their side (Prosody `s2s_insecure_domains`).
- If the remote server **requires encryption**, Rocket.Chat must have a certificate
  configured (see [TLS certificate](#tls-certificate)).
- If the remote server runs a domain allowlist, `chat.example.com` and
  `conference.chat.example.com` must be on it.

## How users start communicating

### From the Rocket.Chat side

- **Direct message a remote XMPP user**: open the new Direct Message dialog and type the full
  JID (`alice@remote.tld`). A DM room is created; messages are delivered to the remote server
  and replies arrive in the same room. The remote user shows up like any other federated user.
- **Create an XMPP room**: in the channel-creation dialog, under **Advanced settings**, turn
  on **XMPP Federated**. The toggle is enabled when the XMPP server is on, the license has the
  `federation` module and you hold `access-federation`. It cannot be combined with Matrix
  federation, encryption, broadcast or read-only. This creates a normal Rocket.Chat channel
  or group that is also a MUC room at `<name>@conference.chat.example.com`, with the name
  escaped as XEP-0106 requires. Public channels can be joined by anyone on the XMPP network,
  subject to the allow list; private groups only by invited users. Changing a room between
  public and private, or changing its topic, is advertised over XMPP at once.
- **Invite a remote XMPP user to a room you host**: add them by full JID in the members field
  of the channel-creation dialog or later through **Members → Add users**. They become a
  member and receive a mediated MUC invitation. A JID can only be added to a room created as
  XMPP Federated; any other room refuses it with `error-xmpp-users-in-non-xmpp-rooms`.
- **Join a room hosted on a remote XMPP server**: not possible on your own initiative. A
  remote user must invite you. The invitation is acted on at once, with no step to accept it:
  you are joined to the remote room, which appears in your sidebar as a **private group**
  named `<room>:<conference domain>` with a globe icon. Other members of the group can add
  local users, who are joined to the remote room too. The `/xmpp-join` slash command belongs
  to the Matrix bridge and does not reach this server.

### From the XMPP side

- **Direct message a Rocket.Chat user**: message `username@chat.example.com` from any client.
  No prior contact or subscription is required.
- **Presence**: send a subscription request to a Rocket.Chat user you already share a DM
  with; it is accepted automatically, and a request back is sent. Requests from anyone else
  are declined. See [Presence](#presence) for what is exchanged after that.
- **Join a Rocket.Chat-hosted room**: join `<room>@conference.chat.example.com` as a regular
  MUC. Public channels admit anyone; private groups require an invitation (a join without one
  is refused with `registration-required`). `disco#items` on `chat.example.com` lists the
  conference service, and `disco#items` on `conference.chat.example.com` lists its public
  rooms.
- **Invite a Rocket.Chat user to a room on your server**: send a MUC invite, mediated
  (XEP-0045 §7.8) or direct (XEP-0249), to `username@chat.example.com`. Rocket.Chat joins the
  room on their behalf immediately and mirrors it as a private group. Anyone on an allowed
  domain can do this. A second invite to the same room adds the new invitee to the existing
  group.

## Known limitations

Gaps an administrator or user will notice today. Each is recorded in its spec, as a known
defect or as out of scope; the spec has the details.

### Presence

Presence does not work in either direction yet. Presence from XMPP contacts is discarded
([presence D1](specs/presence.md#d1-presence-from-xmpp-users-is-ignored)), and Rocket.Chat
status changes do not reach XMPP contacts
([presence D2](specs/presence.md#d2-rocketchat-status-changes-do-not-reach-xmpp-contacts)).
Subscription requests are still answered as described above, even with **Exchange Presence**
off.

### Hosted rooms

- A topic changed in Rocket.Chat reaches only XMPP occupants who join afterwards
  ([hosted-muc D3](specs/hosted-muc.md#d3-a-new-topic-does-not-reach-occupants-already-in-the-room)).
- A room deleted in Rocket.Chat keeps running for its XMPP occupants until the service
  restarts ([hosted-muc D4](specs/hosted-muc.md#d4-a-deleted-room-keeps-running-until-the-service-restarts)).
- An XMPP user removed from a room is not told, and their client still shows them in it
  ([hosted-muc D1](specs/hosted-muc.md#d1-kicked-xmpp-users-are-not-told-they-were-removed)).

### Remote rooms

Invitations to a remote room whose name the workspace's channel-name validation rejects are
dropped ([remote-muc](specs/remote-muc.md), Out of scope).

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
  includes both the XMPP server's domain and its MUC domain. The suite checks only the
  domain, so a missing MUC domain shows up as `remote-muc` failures.
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
node --import tsx --test --test-force-exit --test-name-pattern='stores a message from the room once' tests/end-to-end/remote-muc.spec.ts
```

| Variable | Default |
| --- | --- |
| `XMPP_E2E_XMPP_DOMAIN` | required: the XMPP server's domain |
| `XMPP_E2E_XMPP_SERVICE` | `xmpp://localhost:5222` |
| `XMPP_E2E_XMPP_MUC_DOMAIN` | `conference.<domain>` |
| `TEST_API_URL` | `http://localhost:3000`, the same variable as every other e2e suite |
| `XMPP_E2E_RC_DDP_URL` | `TEST_API_URL`. With microservices, point it at the DDP streamer (for example `http://localhost:4000`): it owns websocket sessions, and presence depends on them |
| `XMPP_E2E_SERVICE_URL` | `http://localhost:3039`. When it does not answer, the `/stats` checks are skipped |
