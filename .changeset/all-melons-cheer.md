---
'@rocket.chat/ddp-server': patch
---

Fix DDP result encoding dropping falsy method return values (false, 0, "", null).
