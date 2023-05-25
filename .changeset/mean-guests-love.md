---
'@rocket.chat/meteor': minor
---

feat: *Enterprise* Add support for different transporters to connect multiple monolith instances.

To use that, a new env var called `MONOLITH_TRANSPORTER` should be set. A commonly used transporter is NATS:

```bash
export MONOLITH_TRANSPORTER=nats://localhost:4222
```
