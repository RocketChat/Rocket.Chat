# Compliance matrix

Every standard the package implements, implements in part, plans to implement or has decided
against, and the spec that owns it. The rows are derived from the `standards` and `status`
frontmatter of the specs in [specs/](specs/); edit the spec, then this table.

Status: `implemented`, `partial` (the spec's Out of scope says what is missing), `planned`
(a spec is agreed, no plan yet), `draft` (a spec exists, not yet agreed), `intent` (wanted,
requirements open), `not-planned` (reason in Notes).

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
| [XEP-0308](https://xmpp.org/extensions/xep-0308.html) | Last Message Correction | partial | [message-corrections](specs/message-corrections.md) | both ways; hosted rooms strip corrections they relay between XMPP users |
| [XEP-0421](https://xmpp.org/extensions/xep-0421.html) | Occupant identifiers for semi-anonymous MUCs | partial | [message-corrections](specs/message-corrections.md) | read in remote rooms to tell apart occupants who held the same nick; hosted rooms do not stamp it |
| [XEP-0359](https://xmpp.org/extensions/xep-0359.html) | Unique and Stable Stanza IDs | partial | [message-deduplication](specs/message-deduplication.md) | inbound only; nothing stamped outbound |
| [XEP-0184](https://xmpp.org/extensions/xep-0184.html) | Message Delivery Receipts | draft | [delivery-receipts](specs/delivery-receipts.md) | required for the end product |
| [XEP-0234](https://xmpp.org/extensions/xep-0234.html) | Jingle File Transfer | draft | [file-transfer](specs/file-transfer.md) | required for the end product; transport open |
| [XEP-0066](https://xmpp.org/extensions/xep-0066.html) | Out of Band Data | draft | [file-transfer](specs/file-transfer.md) | file URLs both ways; the only file path in rooms |
| [XEP-0363](https://xmpp.org/extensions/xep-0363.html) | HTTP File Upload | draft | [file-transfer](specs/file-transfer.md) | the URLs its clients produce are accepted; the upload slot service itself is C2S and is not implemented |
| [XEP-0424](https://xmpp.org/extensions/xep-0424.html) | Message Retraction | draft | [message-retraction](specs/message-retraction.md) | required for the end product; needs outbound XEP-0359 ids |
| [XEP-0085](https://xmpp.org/extensions/xep-0085.html) | Chat State Notifications | draft | [chat-states](specs/chat-states.md) | typing indicators in DMs; rooms open |
| [XEP-0313](https://xmpp.org/extensions/xep-0313.html) | Message Archive Management | intent | [room-history](intents/room-history.md) | hosted rooms serve no history over XMPP; the intent weighs MAM against XEP-0045 history on join |

## Not planned

Decided against, with the reason. A row moves out of here by an intent or a spec that says
why the reason no longer holds.

| Standard | Title | Status | Owner | Notes |
| --- | --- | --- | --- | --- |
| [XEP-0368](https://xmpp.org/extensions/xep-0368.html) | SRV records for XMPP over TLS | not-planned | | STARTTLS on 5269 is enough for the end product; direct TLS would add a second listener and SRV name for a transport peers treat as optional ([ADR 0004](adr/0004-starttls-required-sasl-external-preferred-dialback-fallback.md)) |
| [XEP-0198](https://xmpp.org/extensions/xep-0198.html) | Stream Management | not-planned | | optional on S2S and peers interoperate without it; only guards stanzas lost on a socket that dies mid-write, documented in [s2s-connectivity](specs/s2s-connectivity.md) R10. Revisit if operations show losses |
| [XEP-0114](https://xmpp.org/extensions/xep-0114.html) | Jabber Component Protocol | not-planned | | the native server is a server, not a component attached to another one; administrators who want a component have the Matrix-bridge XMPP integration ([ADR 0002](adr/0002-integration-service-runs-only-as-a-microservice.md)) |
