---
'@rocket.chat/meteor': patch
---

Schedule the statistics cronjob to run 12h apart of the server startup time. Also sends server statistics only once a day despite multiple instance being started at different times.
