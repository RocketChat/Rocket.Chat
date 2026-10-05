---
'@rocket.chat/meteor': patch
---

Fixes UiKit contextual bars ignoring `errors` from apps: after a submit the app rejects with `errors`, the contextual bar now stays open and shows them on the fields.
