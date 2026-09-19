---
'@rocket.chat/meteor': patch
---

Fixes omnichannel transfer comment text not wrapping to multiple lines by adding `white-space: pre-wrap` to the SystemMessage and ContactHistoryMessage components.
