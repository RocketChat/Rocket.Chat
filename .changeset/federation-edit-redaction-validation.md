---
'@rocket.chat/meteor': patch
'@rocket.chat/federation-matrix': patch
'@rocket.chat/core-services': patch
---

Fixes message edits and deletions received from federated rooms being applied without first checking them against the Matrix rules for edits and redactions
