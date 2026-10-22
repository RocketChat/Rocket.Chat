---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': patch
---

Renames the `Outlook_Calendar` settings group to `Microsoft_Exchange` and the `Outlook_Calendar_Enabled` setting to `Microsoft_Exchange_Enabled`. A migration carries the stored value over, so the integration keeps its state. Deployments that set `Outlook_Calendar_Enabled` or `OVERWRITE_SETTING_Outlook_Calendar_Enabled` as an environment variable must rename it to `Microsoft_Exchange_Enabled` or `OVERWRITE_SETTING_Microsoft_Exchange_Enabled`.
