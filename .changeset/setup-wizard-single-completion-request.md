---
'@rocket.chat/meteor': patch
'@rocket.chat/ui-client': patch
---

Fixes the setup wizard getting stuck after cloud registration when saving the workspace settings requires two-factor confirmation: the final step now saves everything in a single request, so it asks for confirmation once instead of three times, no longer starts overlapping confirmation attempts while a prompt is open, and only reports the workspace as ready once setup has actually been marked complete
