# Native XMPP Server

Rocket.Chat can act as a native XMPP server: it federates directly with any other XMPP server over the standard server-to-server (S2S) protocol, without bridges or intermediary processes. Remote XMPP users can message Rocket.Chat users, exchange presence with them, and join dedicated XMPP rooms hosted by Rocket.Chat; Rocket.Chat users can message any XMPP address and participate in rooms on remote XMPP servers.

This is independent from (and can coexist with) the XMPP support offered through the Matrix federation appservice bridge (`Federation_XMPP_*` settings). The native server is implemented in the `@rocket.chat/xmpp-server` package (`ee/packages/xmpp-server`) and requires an enterprise license with the `federation` module.

## How it works

### Protocol layer

The package implements the XMPP server federation core in-process:

- **Transport**: a TCP listener (default port **5269**) accepts inbound S2S connections; outbound connections are established on demand when a local user addresses a remote domain. Outbound targets are resolved via DNS SRV (`_xmpp-server._tcp.<remote-domain>`), falling back to A/AAAA records on port 5269.
- **Encryption**: STARTTLS is negotiated on every stream and is required by default (both directions).
- **Peer authentication**: remote servers are authenticated by **Server Dialback** (XEP-0220) as the baseline, or **SASL EXTERNAL** when the peer presents a TLS certificate valid for its domain. Every inbound stanza is checked against the set of domains authenticated on its connection — stanzas with a spoofed `from` are dropped.
- **Service discovery**: the server answers disco#info/disco#items (XEP-0030) on the server domain and on the MUC service domain, and XMPP ping (XEP-0199). This is what lets remote servers and clients find the MUC service automatically.
- **MUC** (XEP-0045): Rocket.Chat hosts a Multi-User Chat service on a subdomain of its XMPP domain (default `conference.<domain>`). Only *dedicated* XMPP rooms are exposed there — regular Rocket.Chat channels are never reachable over XMPP.

### Integration layer

A Rocket.Chat service (`xmpp-server`) bridges the protocol core to the product:

- **Remote users** appear as local user records: username is the full bare JID (e.g. `alice@remote.tld`), marked `federated` with an `xmppFederation` field. They are created on demand when they first interact.
- **Outgoing messages** are picked up from the normal message pipeline (`afterSaveMessage`) for rooms marked as XMPP rooms and sent as XMPP `<message/>` stanzas.
- **Incoming messages** are stored through the standard federation message path, stamped with a namespaced event id (`xmpp:<domain>:<stanza-id>`) used for deduplication and echo suppression.
- **Presence**: local status changes (online/away/busy/offline) are pushed to remote contacts the user shares an XMPP DM with; presence received from remote users updates their local status.
- **Lifecycle**: the listener starts when `XMPP_Server_Enabled` is turned on (and a valid license is present) and stops cleanly when it is turned off; TLS/domain/port changes restart it automatically.

## Standards implemented

### Core specifications

| Spec | Coverage |
| --- | --- |
| [RFC 6120](https://datatracker.ietf.org/doc/html/rfc6120) — XMPP Core | S2S stream negotiation, STARTTLS, SASL EXTERNAL, stream and stanza errors, restricted-XML parsing (DOCTYPE/entity rejection), `service-unavailable` for unhandled IQ get/set |
| [RFC 6121](https://datatracker.ietf.org/doc/html/rfc6121) — XMPP IM & Presence | `<message type='chat'/>` delivery both directions, availability presence (`show`/`status`), presence probes, subscription stanzas (`subscribe`/`subscribed`/`unsubscribe`/`unsubscribed`). No server-side roster storage — subscription state is derived from shared DM rooms |
| [RFC 6122](https://datatracker.ietf.org/doc/html/rfc6122) — XMPP Address Format | JID parsing/normalization, IDNA domain normalization, 1023-byte localpart limit |
| [RFC 2782](https://datatracker.ietf.org/doc/html/rfc2782) — DNS SRV | `_xmpp-server._tcp` resolution with weighted priority-group ordering, A/AAAA fallback on port 5269, and the "service not provided" (`.` target) convention |

### XEPs

| XEP | Name | Coverage |
| --- | --- | --- |
| [XEP-0030](https://xmpp.org/extensions/xep-0030.html) | Service Discovery | disco#info and disco#items on the server domain (advertises identity `server/im`, ping, dialback, and the MUC service as a child item), on the MUC service domain (identity `conference/text`, public room list), and on individual hosted rooms (`muc_persistent`, `muc_public`/`muc_hidden`, `muc_open`/`muc_membersonly`, …). Unknown room JIDs answer `item-not-found`; occupant lists are not disclosed |
| [XEP-0045](https://xmpp.org/extensions/xep-0045.html) | Multi-User Chat | Subset — hosted rooms: join/leave, roster delivery on join, occupant presence broadcast with affiliations/roles, self-presence status `110`, subject on join close (§7.2.1), groupchat message reflection, kick with status `307`, nick conflict → `conflict`, unauthorized join → `registration-required`, ban → `forbidden`, mediated invitations (§7.8.2). Remote rooms: joining, occupant tracking, message receipt. **Not implemented**: room configuration forms (§10), owner/admin IQ, moderation beyond kick, discussion history on join, room passwords, nick changes, room destruction stanzas |
| [XEP-0106](https://xmpp.org/extensions/xep-0106.html) | JID Escaping | Rocket.Chat usernames containing characters illegal in a localpart (spaces, `@`, `/`, …) are escaped into valid JIDs and unescaped on the way back |
| [XEP-0185](https://xmpp.org/extensions/xep-0185.html) | Dialback Key Generation and Validation | HMAC-SHA256 key derivation over `{receiving domain} {originating domain} {stream id}`, keyed with the hex-encoded SHA256 of the server secret; constant-time comparison on verification |
| [XEP-0199](https://xmpp.org/extensions/xep-0199.html) | XMPP Ping | Answers `urn:xmpp:ping` IQ gets and advertises the feature in disco#info |
| [XEP-0220](https://xmpp.org/extensions/xep-0220.html) | Server Dialback | All three roles — originating (sends `db:result`), receiving (verifies a presented key with the claimed authoritative server over a separate stream), and authoritative (answers `db:verify`). Advertises `urn:xmpp:features:dialback` in stream features |
| [XEP-0249](https://xmpp.org/extensions/xep-0249.html) | Direct MUC Invitations | Inbound only — direct invites (`jabber:x:conference`) to a Rocket.Chat user are parsed and surfaced as room invitations. Rocket.Chat-hosted rooms always send *mediated* invites instead |
| [XEP-0359](https://xmpp.org/extensions/xep-0359.html) | Unique and Stable Stanza IDs | Inbound only — `<stanza-id/>` on messages from remote MUCs is preferred over the stanza `id` for deduplication. Rocket.Chat does not stamp its own outbound stanzas |
| [XEP-0308](https://xmpp.org/extensions/xep-0308.html) | Last Message Correction | Parsed only — `<replace/>` is decoded off inbound messages, but corrections are not yet applied to the stored message |

### Explicitly not supported

| XEP | Name | Why |
| --- | --- | --- |
| [XEP-0368](https://xmpp.org/extensions/xep-0368.html) | SRV records for XMPP over TLS | Direct TLS (`_xmpps-server._tcp`, port 5270) is not resolved or offered; STARTTLS on 5269 only |
| [XEP-0198](https://xmpp.org/extensions/xep-0198.html) | Stream Management | No stanza acknowledgements or stream resumption; a dropped S2S stream is re-established with exponential backoff and in-flight stanzas may be lost |
| [XEP-0313](https://xmpp.org/extensions/xep-0313.html) | Message Archive Management | Rooms serve no history over XMPP; remote occupants see only messages sent while they are joined |
| [XEP-0085](https://xmpp.org/extensions/xep-0085.html) / [XEP-0184](https://xmpp.org/extensions/xep-0184.html) | Chat State Notifications / Message Receipts | No typing indicators or delivery/read receipts |
| [XEP-0363](https://xmpp.org/extensions/xep-0363.html) / [XEP-0234](https://xmpp.org/extensions/xep-0234.html) | HTTP File Upload / Jingle File Transfer | Text messages only |
| [XEP-0424](https://xmpp.org/extensions/xep-0424.html) | Message Retraction | Deletions are local-only |
| [XEP-0114](https://xmpp.org/extensions/xep-0114.html) | Jabber Component Protocol | The native server is in-process, not a component; XEP-0114 is what the separate Matrix-bridge XMPP integration uses |

## Configuration on the Rocket.Chat side

### Admin settings

Under **Admin → Settings → Federation → XMPP Server**:

| Setting | Default | Purpose |
| --- | --- | --- |
| `XMPP_Server_Enabled` | off | Master toggle for the native XMPP server |
| `XMPP_Server_Domain` | — | The XMPP domain this server serves (e.g. `chat.example.com`). This is the domain part of every local user's JID |
| `XMPP_Server_Port` | `5269` | S2S listen port |
| `XMPP_Server_TLS_Certificate` | — | PEM certificate chain used for STARTTLS |
| `XMPP_Server_TLS_Key` | — | PEM private key |
| `XMPP_Server_MUC_Subdomain` | `conference` | Subdomain of the MUC service (`conference.chat.example.com`) |
| `XMPP_Server_Domain_Allow_List` | empty | Comma-separated remote domains allowed to federate; empty allows all |
| `XMPP_Server_Presence_Enabled` | on | Toggle presence exchange (both directions) |

### DNS

For other XMPP servers to reach you, publish SRV records for the XMPP domain **and** the MUC subdomain, pointing at the host running Rocket.Chat:

```
_xmpp-server._tcp.chat.example.com.            IN SRV 0 5 5269 rc-host.example.com.
_xmpp-server._tcp.conference.chat.example.com. IN SRV 0 5 5269 rc-host.example.com.
```

If no SRV records exist, remote servers fall back to resolving the domain itself on port 5269 — in that case `chat.example.com` (and `conference.chat.example.com`) must resolve to the Rocket.Chat host directly.

### TLS certificate

The certificate should cover both the XMPP domain and the MUC subdomain (SAN entries for `chat.example.com` and `conference.chat.example.com`, or a wildcard). A publicly trusted certificate additionally enables SASL EXTERNAL authentication with peers; with a self-signed certificate, federation still works via dialback as long as the peer accepts encrypted-but-unverified streams (Prosody/ejabberd default policies vary — see below).

### Network

Port 5269 (or the configured port) must be reachable from the internet, TCP, both directions (inbound for remote servers connecting to you, outbound for connections you originate — including the dialback verification connections remote servers make back to you).

Note: the XMPP listener binds inside the main Rocket.Chat process. It is not HTTP — it cannot sit behind the usual reverse proxy; expose the port directly or via a TCP-level proxy.

## Configuration on the XMPP side

Usually **none** — this is standard XMPP federation, and public XMPP servers federate with unknown domains by default. Checks for the remote administrator only if federation does not come up:

- S2S must be enabled and outbound/inbound port 5269 open (it is by default on Prosody, ejabberd, Openfire).
- If the remote server **requires verified TLS certificates for S2S** (e.g. Prosody `s2s_secure_auth = true`), the Rocket.Chat certificate must be publicly trusted (or explicitly whitelisted on their side, e.g. Prosody `s2s_insecure_domains`).
- If the remote server runs a domain allowlist, `chat.example.com` must be added to it.

## Entrypoints — how users start communicating

### From the Rocket.Chat side

- **Direct message a remote XMPP user**: open the new Direct Message dialog and type the person's full JID (e.g. `alice@remote.tld`). A DM room is created; messages you send are delivered to the remote server, replies arrive in the same room. The remote user shows up like any other (federated) user.
- **Create an XMPP room**: in the channel-creation dialog, enable the **XMPP Federated** toggle (visible when the feature is enabled and you hold the `access-federation` permission). This creates a normal-looking Rocket.Chat channel that is simultaneously a MUC room at `<name>@conference.chat.example.com`. Public channels are joinable by anyone on the XMPP network (subject to the domain allow list); private groups only by users you invited.
- **Invite a remote XMPP user to a room you host**: add them by full JID (e.g. `alice@remote.tld`) either in the members field of the channel-creation dialog or later through **Team/Members → Add users**. They are added as a member and receive a MUC invitation; joining puts them in the room's roster and their messages land in the channel.
- **Join a room hosted on a remote XMPP server**: you cannot join proactively from Rocket.Chat in v1. A remote user must invite you (see below); accepting the invite joins you to the remote room, which appears as a channel in your sidebar.

### From the XMPP side

- **Direct message a Rocket.Chat user**: message `username@chat.example.com` from any XMPP client — the Rocket.Chat username is the JID localpart. No prior contact or subscription is required for messages to be delivered.
- **Presence**: send a subscription request to a Rocket.Chat user you already share a DM with; it is auto-accepted and status updates flow both ways. Requests from strangers are declined (v1 policy).
- **Join a Rocket.Chat-hosted XMPP room**: join `<room>@conference.chat.example.com` as a regular MUC from any client. Public channels admit anyone; private groups require an invitation (a join without one is refused with `registration-required`). Discovery works too: a disco query on `chat.example.com` lists the conference service and its public rooms.
- **Invite a Rocket.Chat user to a room on your server**: send a MUC invite (mediated, XEP-0045 §7.8, or direct, XEP-0249) to `username@chat.example.com`. The Rocket.Chat user receives a room invitation; on accepting it, Rocket.Chat joins the remote MUC on their behalf and mirrors the room as a channel.

## v1 limitations

- Text messages only — no file/attachment transfer.
- Message edits and deletions are not propagated over XMPP (local-only); XEP-0308/XEP-0424 support may come later.
- No typing indicators or read receipts.
- No proactive joining/searching of remote MUC rooms from the Rocket.Chat UI (invite-only).
- Presence subscriptions have no UI; the auto-accept policy above is fixed.
- Single-instance deployments only: in a multi-instance cluster each instance would bind its own listener with independent state.
- Direct TLS on port 5270 (XEP-0368) is not supported; STARTTLS on 5269 only.
