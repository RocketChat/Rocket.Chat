---
'@rocket.chat/meteor': patch
'@rocket.chat/ui-client': patch
---

Fixes the setup wizard getting stuck after cloud registration when saving the workspace settings requires two-factor confirmation: the final step now saves everything in a single request, so it asks for confirmation once instead of three times, stops polling once the registration is confirmed instead of starting overlapping attempts, offers a retry instead of retrying on its own when completing fails, and only reports the workspace as ready once setup has actually been marked complete
