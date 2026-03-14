---
'@rocket.chat/ui-client': patch
'@rocket.chat/ui-contexts': patch
---

Refactor Callbacks class with stricter generic constraints using semantic callback signature types (EventLikeCallbackSignature, ChainedCallbackSignature). Improve ActionManager listener typing and add structured GetRoomPathAvatar type. No runtime behavior changes.
