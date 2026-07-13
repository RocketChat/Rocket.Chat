---
'@rocket.chat/ddp-client': patch
---

Adds connection liveness checking to recover from zombie WebSocket sockets (a `connected` socket whose transport is dead, common on mobile NAT timeouts that never fire `onclose`):

- `Connection.probe(timeoutMs?)` — sends a DDP `ping` and resolves `true` if a `pong` arrives in time.
- `Connection.forceReopen()` — tears down and reconnects, deduplicating concurrent callers via a shared in-flight promise.
- `Connection.checkAndReopen(probeTimeoutMs?)` — probes when connected, force-reopens when not connected or on a dead probe. Also exposed on `DDPSDK`.
- `Connection.close()` now severs socket handlers before closing so a dying socket can't deliver late messages or clobber the live connection.
