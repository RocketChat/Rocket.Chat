---
'@rocket.chat/meteor': minor
---

Adds `separateResponse` param to incoming webhooks to return per-channel statuses; when false or omitted, validates all targets and aborts sending to any channel if one fails.
