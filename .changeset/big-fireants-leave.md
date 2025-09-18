---
'@rocket.chat/apps-engine': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where apps that import node native modules with the optional `node:` specifier would fail to construct
