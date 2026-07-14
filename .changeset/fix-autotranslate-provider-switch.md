---
'@rocket.chat/meteor': patch
---

Fixed AutoTranslate silently continuing to use the previous translation provider after `AutoTranslate_ServiceProvider` was changed while AutoTranslate was enabled, until it was toggled off and on again or the server restarted.
