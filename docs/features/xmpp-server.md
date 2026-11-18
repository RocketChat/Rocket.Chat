# Native XMPP Server

Rocket.Chat can act as a native XMPP server: it federates directly with other XMPP servers
over the standard server-to-server protocol, without bridges. Remote XMPP users can message
Rocket.Chat users, exchange presence with them and join dedicated XMPP rooms hosted by
Rocket.Chat; Rocket.Chat users can message any XMPP address and take part in rooms on remote
servers. It is independent from, and coexists with, the XMPP support offered through the
Matrix federation bridge.

The feature is implemented by `@rocket.chat/xmpp-server` (`ee/packages/xmpp-server`) and
documented inside that package, which is developed spec-first:

- [How the package is developed](../../ee/packages/xmpp-server/docs/README.md): intents,
  specs, plans and ADRs.
- [Compliance matrix](../../ee/packages/xmpp-server/docs/compliance.md): which RFCs and XEPs
  are supported, planned or not.
- [Specs](../../ee/packages/xmpp-server/docs/specs/): behaviour per capability, with known
  defects.
- [Operations](../../ee/packages/xmpp-server/docs/operations.md): settings, DNS, TLS, the
  microservice, the end-to-end suite.
- [Architecture](../../ee/packages/xmpp-server/docs/architecture.md): module map and message
  flows.
