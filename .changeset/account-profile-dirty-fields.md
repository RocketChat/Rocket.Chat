---
'@rocket.chat/meteor': patch
---

Fixes the account profile form rewriting every profile field on save: saving now sends only the fields you changed (a status-only save no longer touches your name, username, nickname or bio), profile data that loads after the page opens now fills the form instead of leaving fields blank, and an open user card or profile reflects the save right away.
