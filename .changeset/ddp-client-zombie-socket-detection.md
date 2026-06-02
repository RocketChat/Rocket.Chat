---
"@rocket.chat/ddp-client": minor
---

Add `probe()`, `forceReopen()`, and `checkAndReopen()` to `Connection` and `ConnectionImpl` for zombie socket detection and recovery. `probe()` sends a DDP ping and resolves `true` if a pong arrives within a configurable timeout, allowing callers to detect sockets that remain `status === 'connected'` but whose underlying transport is silently dead (e.g. mobile NAT timeouts that never fire `onclose`). `forceReopen()` tears down the current socket and reconnects from scratch, deduplicating concurrent callers onto a single in-flight promise. `checkAndReopen()` combines both: it probes a connected socket and force-reopens only when the probe fails.
