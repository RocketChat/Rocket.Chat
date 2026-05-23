---
"@rocket.chat/ddp-client": patch
---

Fix `DDPDispatcher` dropping non-method frames (connect, sub, unsub, ping, pong) when a `wait` block is at the head of the queue. Previously every payload flowed through the same wait-serialization path: a `connect` frame dispatched after a `wait: true` method (e.g. `login`) would be queued in a new non-wait block but never actually sent, wedging the DDP handshake — the socket stayed open, the server never replied `connected`, and any caller awaiting the connection hung. Non-method payloads now bypass the queue and emit immediately; wait-method serialization between methods is unchanged.
