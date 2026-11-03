---
'@rocket.chat/meteor': patch
---

Fixes a server whose startup fails staying alive without serving requests; it now exits so Docker or Kubernetes can restart it
