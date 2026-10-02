# Compliance matrix

Every standard the package implements, implements in part, plans to implement or has decided
against, and the spec that owns it. The rows are derived from the `standards` and `status`
frontmatter of the specs in [specs/](specs/); edit the spec, then this table.

Status: `implemented`, `partial` (the spec's Out of scope says what is missing), `planned`
(a spec is agreed, no plan yet), `draft` (a spec exists, not yet agreed), `intent` (wanted,
requirements open), `not-planned` (reason in Notes).

FMN: `M` marks a standard the FMN Spiral 3 Basic Text-based Collaboration profile mandates.
A `not-planned` row marked `M` is an exception a conformance assessment will raise; its
Notes are the reason we give. Which Spiral and ADatP-34 edition is the target is open in
[accreditation-readiness](intents/accreditation-readiness.md).

## Core specifications

| Standard | Title | Status | FMN | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| [RFC 6120](https://datatracker.ietf.org/doc/html/rfc6120) | XMPP Core | implemented | M | [s2s-connectivity](specs/s2s-connectivity.md) | S2S only; no C2S. In-order processing (§10.1) is not guaranteed: [message-ordering](intents/message-ordering.md) |
| [RFC 6121](https://datatracker.ietf.org/doc/html/rfc6121) | XMPP IM and Presence | partial | M | [direct-messages](specs/direct-messages.md), [presence](specs/presence.md) | chat messages, availability, subscription stanzas; no roster, probes unanswered |
| [RFC 6122](https://datatracker.ietf.org/doc/html/rfc6122) | XMPP Address Format | implemented | M | [addressing](specs/addressing.md) | IDNA domains; no PRECIS |
| [RFC 2782](https://datatracker.ietf.org/doc/html/rfc2782) | DNS SRV | implemented | | [s2s-connectivity](specs/s2s-connectivity.md) | |
| [RFC 7590](https://datatracker.ietf.org/doc/html/rfc7590) | Use of TLS in XMPP | intent | | [accreditation-readiness](intents/accreditation-readiness.md) | TLS versions and cipher suites are Node's defaults; no stated policy |

## XEPs

| Standard | Title | Status | FMN | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| [XEP-0012](https://xmpp.org/extensions/xep-0012.html) | Last Activity | intent | M | [entity-information](intents/entity-information.md) | queries are answered `service-unavailable` today |
| [XEP-0030](https://xmpp.org/extensions/xep-0030.html) | Service Discovery | implemented | M | [service-discovery](specs/service-discovery.md) | |
| [XEP-0045](https://xmpp.org/extensions/xep-0045.html) | Multi-User Chat | partial | M | [hosted-muc](specs/hosted-muc.md), [remote-muc](specs/remote-muc.md) | no configuration, admin IQ, history on join, passwords, nick changes |
| [XEP-0047](https://xmpp.org/extensions/xep-0047.html) | In-Band Bytestreams | draft | M | [file-transfer](specs/file-transfer.md) | one of the two candidate Jingle transports; the choice is an open question |
| [XEP-0054](https://xmpp.org/extensions/xep-0054.html) | vcard-temp | intent | M | [entity-information](intents/entity-information.md) | queries are answered `service-unavailable` today |
| [XEP-0055](https://xmpp.org/extensions/xep-0055.html) | Jabber Search | intent | M | [entity-information](intents/entity-information.md) | whether it is wanted at all is an open question |
| [XEP-0060](https://xmpp.org/extensions/xep-0060.html) | Publish-Subscribe | intent | M | [entity-information](intents/entity-information.md) | only as PEP, if avatars and nicknames need it; no general PubSub service |
| [XEP-0065](https://xmpp.org/extensions/xep-0065.html) | SOCKS5 Bytestreams | draft | M | [file-transfer](specs/file-transfer.md) | the other candidate Jingle transport; needs a proxy both ends reach |
| [XEP-0066](https://xmpp.org/extensions/xep-0066.html) | Out of Band Data | draft | | [file-transfer](specs/file-transfer.md) | file URLs both ways; the only file path in rooms |
| [XEP-0085](https://xmpp.org/extensions/xep-0085.html) | Chat State Notifications | draft | | [chat-states](specs/chat-states.md) | typing indicators in DMs; rooms open |
| [XEP-0092](https://xmpp.org/extensions/xep-0092.html) | Software Version | intent | M | [entity-information](intents/entity-information.md) | disclosure is the administrator's choice |
| [XEP-0106](https://xmpp.org/extensions/xep-0106.html) | JID Escaping | implemented | | [addressing](specs/addressing.md) | |
| [XEP-0138](https://xmpp.org/extensions/xep-0138.html) | Stream Compression | intent | | [tactical-edge](intents/tactical-edge.md) | |
| [XEP-0160](https://xmpp.org/extensions/xep-0160.html) | Best Practices for Handling Offline Messages | partial | M | [direct-messages](specs/direct-messages.md) | every message to a local user is stored whatever their presence; a message we cannot deliver outbound is dropped ([connection-recovery](intents/connection-recovery.md)) |
| [XEP-0178](https://xmpp.org/extensions/xep-0178.html) | Best Practices for Use of SASL EXTERNAL with Certificates | implemented | | [s2s-connectivity](specs/s2s-connectivity.md) | dNSName identities only ([ADR 0005](adr/0005-peer-certificates-are-matched-on-dnsname-only.md)) |
| [XEP-0184](https://xmpp.org/extensions/xep-0184.html) | Message Delivery Receipts | draft | | [delivery-receipts](specs/delivery-receipts.md) | required for the end product |
| [XEP-0185](https://xmpp.org/extensions/xep-0185.html) | Dialback Key Generation and Validation | implemented | M | [s2s-connectivity](specs/s2s-connectivity.md) | |
| [XEP-0199](https://xmpp.org/extensions/xep-0199.html) | XMPP Ping | implemented | M | [ping](specs/ping.md) | answers only; never sends |
| [XEP-0202](https://xmpp.org/extensions/xep-0202.html) | Entity Time | intent | M | [entity-information](intents/entity-information.md) | queries are answered `service-unavailable` today |
| [XEP-0203](https://xmpp.org/extensions/xep-0203.html) | Delayed Delivery | intent | M | [message-ordering](intents/message-ordering.md) | replayed room history is stored at arrival time; no spec says whether the `<delay/>` stamp is kept |
| [XEP-0220](https://xmpp.org/extensions/xep-0220.html) | Server Dialback | implemented | M | [s2s-connectivity](specs/s2s-connectivity.md) | all three roles |
| [XEP-0234](https://xmpp.org/extensions/xep-0234.html) | Jingle File Transfer | draft | | [file-transfer](specs/file-transfer.md) | required for the end product; transport open |
| [XEP-0249](https://xmpp.org/extensions/xep-0249.html) | Direct MUC Invitations | partial | | [remote-muc](specs/remote-muc.md) | inbound only; hosted rooms send mediated invites |
| [XEP-0258](https://xmpp.org/extensions/xep-0258.html) | Security Labels in XMPP | intent | M | [security-labels](intents/security-labels.md) | not advertised, so clients should not send labels; a labelled message is stored and relayed without its label |
| [XEP-0289](https://xmpp.org/extensions/xep-0289.html) | Federated MUC for Constrained Environments | intent | | [tactical-edge](intents/tactical-edge.md) | |
| [XEP-0308](https://xmpp.org/extensions/xep-0308.html) | Last Message Correction | partial | | [message-corrections](specs/message-corrections.md) | both ways; hosted rooms strip corrections they relay between XMPP users |
| [XEP-0313](https://xmpp.org/extensions/xep-0313.html) | Message Archive Management | intent | | [room-history](intents/room-history.md) | hosted rooms serve no history over XMPP; the intent weighs MAM against XEP-0045 history on join |
| [XEP-0322](https://xmpp.org/extensions/xep-0322.html) | Efficient XML Interchange (EXI) Format | intent | | [tactical-edge](intents/tactical-edge.md) | |
| [XEP-0359](https://xmpp.org/extensions/xep-0359.html) | Unique and Stable Stanza IDs | partial | | [message-deduplication](specs/message-deduplication.md) | inbound only; nothing stamped outbound |
| [XEP-0361](https://xmpp.org/extensions/xep-0361.html) | Zero Handshake Server to Server Protocol | intent | | [tactical-edge](intents/tactical-edge.md) | |
| [XEP-0363](https://xmpp.org/extensions/xep-0363.html) | HTTP File Upload | draft | | [file-transfer](specs/file-transfer.md) | the URLs its clients produce are accepted; the upload slot service itself is C2S and is not implemented |
| [XEP-0365](https://xmpp.org/extensions/xep-0365.html) | Server to Server communication over STANAG 5066 ARQ | intent | | [tactical-edge](intents/tactical-edge.md) | HF radio links |
| [XEP-0421](https://xmpp.org/extensions/xep-0421.html) | Occupant identifiers for semi-anonymous MUCs | partial | | [message-corrections](specs/message-corrections.md) | read in remote rooms to tell apart occupants who held the same nick; hosted rooms do not stamp it |
| [XEP-0424](https://xmpp.org/extensions/xep-0424.html) | Message Retraction | draft | | [message-retraction](specs/message-retraction.md) | required for the end product; needs outbound XEP-0359 ids |

## Not planned

Decided against, with the reason. A row moves out of here by an intent or a spec that says
why the reason no longer holds.

| Standard | Title | Status | FMN | Owner | Notes |
| --- | --- | --- | --- | --- | --- |
| [XEP-0004](https://xmpp.org/extensions/xep-0004.html) | Data Forms | not-planned | M | | a payload format, not a capability: it arrives with the first spec that needs it (room configuration, search). Until then no form is sent or accepted |
| [XEP-0049](https://xmpp.org/extensions/xep-0049.html) | Private XML Storage | not-planned | M | | a client storing data on its own server; Rocket.Chat users have no XMPP client, and a remote user's storage is their own server's |
| [XEP-0114](https://xmpp.org/extensions/xep-0114.html) | Jabber Component Protocol | not-planned | M | | the native server is a server, not a component attached to another one; administrators who want a component have the Matrix-bridge XMPP integration ([ADR 0002](adr/0002-integration-service-runs-only-as-a-microservice.md)) |
| [XEP-0115](https://xmpp.org/extensions/xep-0115.html) | Entity Capabilities | not-planned | M | | peers fall back to `disco#info`, which every entity here answers ([service-discovery](specs/service-discovery.md)); caps only save that round trip |
| [XEP-0167](https://xmpp.org/extensions/xep-0167.html) | Jingle RTP Sessions | not-planned | | | voice and video over XMPP are outside the end product |
| [XEP-0198](https://xmpp.org/extensions/xep-0198.html) | Stream Management | not-planned | M | | optional on S2S and peers interoperate without it; only guards stanzas lost on a socket that dies mid-write, documented in [s2s-connectivity](specs/s2s-connectivity.md) R10. Revisited by [connection-recovery](intents/connection-recovery.md) and [tactical-edge](intents/tactical-edge.md) |
| [XEP-0333](https://xmpp.org/extensions/xep-0333.html) | Chat Markers | not-planned | | | expresses displayed state, but most servers' S2S paths do not implement it ([delivery-receipts](specs/delivery-receipts.md)) |
| [XEP-0368](https://xmpp.org/extensions/xep-0368.html) | SRV records for XMPP over TLS | not-planned | | | STARTTLS on 5269 is enough for the end product; direct TLS would add a second listener and SRV name for a transport peers treat as optional ([ADR 0004](adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)) |
