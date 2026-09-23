---
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Turning on **Enforce ABAC across all workspace rooms** now switches **Discussion > Enable** off for as long as enforcement lasts, so no discussion can be created anywhere on the workspace. The value the setting had beforehand is remembered and put back when enforcement is switched off, including when the ABAC license is removed and when it has lapsed by the time the workspace next starts. While enforcement is on the setting cannot be switched back on, and a workspace that already had discussions off keeps them off afterwards.

Existing discussions are locked by enforcement whatever attributes they carry, and their callout no longer suggests setting attributes, which would not unlock them.
