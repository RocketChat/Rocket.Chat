---
"@rocket.chat/meteor": patch
---

Allow to use the token from `room.v` when requesting transcript instead of visitor token. Visitors may change their tokens at any time, rendering old conversations impossible to access for them (or for APIs depending on token) as the visitor token won't match the `room.v` token.
