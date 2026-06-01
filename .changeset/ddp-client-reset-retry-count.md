---
"@rocket.chat/ddp-client": patch
---

Reset `Connection.retryCount` to zero on a successful (re)connection. The counter was only ever incremented (in `ws.onclose`), never zeroed, so the retry budget was monotonically consumed across the connection's lifetime. With the default budget of `1`, any chain of two close events — for example the SDK reconnecting after a server force-logout, then the client running a follow-up `Meteor.logout()` whose server handler closes the WS again — drained the budget; the second close handler bailed at `retryCount >= retryOptions.retryCount` and the SDK stayed permanently disconnected. Method frames already in the dispatcher queue (e.g. a fresh `login` retry from the consumer) stayed queued forever.
