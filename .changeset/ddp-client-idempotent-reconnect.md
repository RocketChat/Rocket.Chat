---
"@rocket.chat/ddp-client": patch
---

Make `Connection.connect()` and `Connection.reconnect()` idempotent. Previously they rejected with `Error('Connection in progress')` when called while a connection was already in flight or established. Because the internal retry timer (`ws.onclose` → `setTimeout(() => void this.reconnect(), …)`) fires with no `.catch`, that rejection surfaced as an unhandled rejection at the page level whenever an external caller (e.g. an SDK consumer's bootstrap path) won the race against the timer. The timer now no-ops when the connection has already been re-established, and a stale `ws.onclose` from a replaced socket no longer clobbers the new socket's status or schedules a redundant retry.
