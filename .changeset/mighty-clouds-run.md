---
"@rocket.chat/meteor": patch
---

Fix issue where resending the welcome email could include unresolved placeholders (e.g., `[name]`, `[email]`).
