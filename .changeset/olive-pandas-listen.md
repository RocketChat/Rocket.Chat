---
'@rocket.chat/meteor': patch
---

Fixes rooms showing up more than once in the sidebar, caused by the cached stores keeping a separate entry for every merge of a record whose `_id` does not arrive as a string.
