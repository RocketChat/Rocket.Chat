---
'@rocket.chat/meteor': minor
---

feat: *Enterprise* Add support for different transporters to connect multiple monolith instances.

To use that, you can use the `TRANSPORTER` env var adding "monolith+" to the transporter value. To use NATS for example, your env var should be:

```bash
export TRANSPORTER="monolith+nats://localhost:4222"
```
