---
status: partial
standards: [RFC 6121]
adrs: [0006, 0007]
code:
  [
    src/handlers/parse.ts,
    src/router/StanzaRouter.ts,
    src/XMPPServer.ts,
    src/service/XMPPServerService.ts,
    apps/meteor/ee/server/hooks/xmpp/index.ts,
  ]
tests: [src/handlers/parse.spec.ts, tests/integration/routing.spec.ts, tests/end-to-end/direct-messages.spec.ts]
---

# Spec: Direct messages

## Summary

A Rocket.Chat user and a remote XMPP user exchange one-to-one messages. On the Rocket.Chat
side the conversation is an ordinary DM room with a federated user; on the XMPP side it is
a chat with `<username>@<domain>`.

## Motivation

The simplest federation use case and the one every other capability is measured against:
a user on either side starts a conversation with an address, without an administrator
pre-arranging anything.

## Behaviour

**Inbound**

- **R1** A `<message/>` of type `chat` or `normal` with a `<body/>`, from an authenticated
  domain, addressed to `<username>@<domain>`, is stored as a message in the DM room between
  that local user and the sender. The sender's user record is created or refreshed first
  ([ADR 0006](../adr/0006-remote-users-are-local-users-keyed-by-bare-jid.md)); the DM room is
  created when it does not exist and stamped `xmppFederation: { role: 'dm', with: <sender bare JID>, origin: <sender domain> }`.
- **R2** A message to a username that does not exist is dropped. No error stanza is sent.
- **R3** A message without a `<body/>`, or of any other type, is ignored by this capability.
  (Groupchat traffic is handled by the MUC specs; invitations by [remote-muc](remote-muc.md).)
- **R4** The message is stored once per distinct id ([message-deduplication](message-deduplication.md)).

**Outbound**

- **R5** A message saved by a local user in a room with role `dm` is sent as
  `<message type='chat' id='<message _id>'>` with the text as `<body/>`, from the user's
  JID to `xmppFederation.with`. System messages, messages that came from the wire and
  messages by federated users are never sent.
- **R6** The sender does not receive their own message back from the remote side; the
  outgoing hook ignores anything carrying a federation stamp.
- **R7** When a local user opens a DM by typing a bare JID, the remote user record is created
  and the room stamped before the first message is sent.
- **R8** Delivery is at most once. A message that cannot be delivered (unreachable domain
  after backoff, full queue) is logged on the service; the sender is not told.
- **R9** An edit by the author is sent as a correction ([message-corrections](message-corrections.md)).

## Design

The router emits `message.received` for chat and normal messages with a body;
`XMPPServerService.onIncomingMessage` resolves the local user, upserts the remote one,
calls `Room.createDirectMessage` (idempotent), stamps the room when it is new, and persists
through the federation path. Outbound, the Meteor `afterSaveMessage` hook calls
`XMPPServer.sendMessage`, which builds the stanza and hands it to the S2S routes. DM creation
from the UI goes through `federation.beforeCreateDirectMessage` (stamps the room) and
`beforeCreateDirectRoom` (materializes the user).

## Out of scope

- Message types `headline` and `groupchat` addressed to a user.
- Rich content: XHTML-IM (XEP-0071), mentions, markdown. The Rocket.Chat text is sent as
  the body verbatim and the remote body is stored verbatim.
- Threads: the `<thread/>` element is parsed and can be sent, but is not mapped to
  Rocket.Chat threads.
- Chat states (XEP-0085), pending triage in [compliance.md](../compliance.md).
- Delivery receipts: [delivery-receipts](delivery-receipts.md), planned.
- Attachments: [file-transfer](file-transfer.md), planned.
- Deletion: [message-retraction](message-retraction.md), planned.

## Known defects

None of its own. Defects that show in DMs are owned by the cross-cutting specs:

- a correction stored as a new message: [message-corrections D1](message-corrections.md#d1-corrections-from-xmpp-users-arrive-as-new-messages)

## Open questions

- Should an error stanza (`<message type='error'/>`) from the peer be surfaced to the
  sender? See [s2s-connectivity](s2s-connectivity.md) open questions.
- Should a message to an unknown local user be answered `item-not-found` or
  `service-unavailable`, as RFC 6121 §8.5 suggests for a non-existent account?

## References

- RFC 6121 §5 (exchanging messages), §8.5 (server rules for processing stanzas)
