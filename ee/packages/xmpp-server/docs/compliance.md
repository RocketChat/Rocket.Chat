# Compliance matrix

Every standard the package implements, implements in part, plans to implement or has decided
against, and the spec that owns it. The rows are derived from the `standards` and `status`
frontmatter of the specs in [specs/](specs/); edit the spec, then this table.

Status: `implemented`, `partial` (the spec's Out of scope says what is missing), `planned`
(a spec exists, no plan yet), `intent` (wanted, requirements open), `not-planned` (reason in
Notes), `pending triage` (decision not yet taken).

## Core specifications

| Standard | Title | Status | Owner | Notes |
| --- | --- | --- | --- | --- |
| [RFC 6120](https://datatracker.ietf.org/doc/html/rfc6120) | XMPP Core | implemented | [s2s-connectivity](specs/s2s-connectivity.md) | S2S only; no C2S |
| [RFC 6121](https://datatracker.ietf.org/doc/html/rfc6121) | XMPP IM and Presence | partial | [direct-messages](specs/direct-messages.md), [presence](specs/presence.md) | chat messages, availability, subscription stanzas; no roster, probes unanswered |
| [RFC 6122](https://datatracker.ietf.org/doc/html/rfc6122) | XMPP Address Format | implemented | [addressing](specs/addressing.md) | IDNA domains; no PRECIS |
| [RFC 2782](https://datatracker.ietf.org/doc/html/rfc2782) | DNS SRV | implemented | [s2s-connectivity](specs/s2s-connectivity.md) | |

## XEPs

| Standard | Title | Status | Owner | Notes |
| --- | --- | --- | --- | --- |
| [XEP-0030](https://xmpp.org/extensions/xep-0030.html) | Service Discovery | implemented | [service-discovery](specs/service-discovery.md) | |
| [XEP-0045](https://xmpp.org/extensions/xep-0045.html) | Multi-User Chat | partial | [hosted-muc](specs/hosted-muc.md), [remote-muc](specs/remote-muc.md) | no configuration, admin IQ, history on join, passwords, nick changes |
| [XEP-0106](https://xmpp.org/extensions/xep-0106.html) | JID Escaping | implemented | [addressing](specs/addressing.md) | |
| [XEP-0185](https://xmpp.org/extensions/xep-0185.html) | Dialback Key Generation and Validation | implemented | [s2s-connectivity](specs/s2s-connectivity.md) | |
| [XEP-0199](https://xmpp.org/extensions/xep-0199.html) | XMPP Ping | implemented | [ping](specs/ping.md) | answers only; never sends |
| [XEP-0220](https://xmpp.org/extensions/xep-0220.html) | Server Dialback | implemented | [s2s-connectivity](specs/s2s-connectivity.md) | all three roles |
| [XEP-0249](https://xmpp.org/extensions/xep-0249.html) | Direct MUC Invitations | partial | [remote-muc](specs/remote-muc.md) | inbound only; hosted rooms send mediated invites |
| [XEP-0308](https://xmpp.org/extensions/xep-0308.html) | Last Message Correction | partial | [message-corrections](specs/message-corrections.md) | outbound; inbound parsed, not applied |
| [XEP-0359](https://xmpp.org/extensions/xep-0359.html) | Unique and Stable Stanza IDs | partial | [message-deduplication](specs/message-deduplication.md) | inbound only; nothing stamped outbound |
| [XEP-0184](https://xmpp.org/extensions/xep-0184.html) | Message Delivery Receipts | planned | [delivery-receipts](specs/delivery-receipts.md) | required for the end product |
| [XEP-0234](https://xmpp.org/extensions/xep-0234.html) | Jingle File Transfer | planned | [file-transfer](specs/file-transfer.md) | required for the end product; transport open |
| [XEP-0424](https://xmpp.org/extensions/xep-0424.html) | Message Retraction | planned | [message-retraction](specs/message-retraction.md) | required for the end product; needs outbound XEP-0359 ids |

## Pending triage

Listed as unsupported during the proof of concept. Each is decided one at a time: `planned`
(a spec), `intent` (an intent file), or `not-planned` (a reason here).

| Standard | Title | Status | Owner | Notes |
| --- | --- | --- | --- | --- |
| [XEP-0368](https://xmpp.org/extensions/xep-0368.html) | SRV records for XMPP over TLS | pending triage | | direct TLS on 5270; STARTTLS on 5269 only today ([ADR 0004](adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)) |
| [XEP-0198](https://xmpp.org/extensions/xep-0198.html) | Stream Management | pending triage | | no acknowledgements; a dropped stream may lose in-flight stanzas |
| [XEP-0313](https://xmpp.org/extensions/xep-0313.html) | Message Archive Management | pending triage | | rooms serve no history over XMPP |
| [XEP-0085](https://xmpp.org/extensions/xep-0085.html) | Chat State Notifications | pending triage | | no typing indicators |
| [XEP-0363](https://xmpp.org/extensions/xep-0363.html) | HTTP File Upload | pending triage | | with XEP-0066; see [file-transfer](specs/file-transfer.md) open questions |
| [XEP-0114](https://xmpp.org/extensions/xep-0114.html) | Jabber Component Protocol | pending triage | | the native server is in-process; XEP-0114 is what the Matrix-bridge XMPP integration uses |
