---
'@rocket.chat/meteor': patch
---

Optimize Kubernetes health probes following SRE best practices

- `/livez` now returns 200 OK immediately without checking MongoDB, memory, or event loop
- `/readyz` continues to check all dependencies (MongoDB, memory, event loop) to determine traffic readiness
- Reduces unnecessary MongoDB load from liveness probes while maintaining proper readiness checks
