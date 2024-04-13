---
"@rocket.chat/meteor": patch
---

Fixed an issue where Rocket.Chat would ask admins to confirm fingerprint change (new workspace vs configuration update), even with `AUTO_ACCEPT_FINGERPRINT` environment variable set to `"true"`.
