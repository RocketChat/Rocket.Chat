---
'@rocket.chat/ui-voip': patch
---

Replaces the timed debounce in the media call available-view tracker with a microtask-based flush, so register/unregister cycles from re-running effects are coalesced without an arbitrary delay or transient "view unregistered" state
