---
'@rocket.chat/meteor': patch
---

Fixes the custom emoji picker returning zero emoji on workspaces running with `ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS=true`, caused by the client sending an empty `query` string to `emoji-custom.list`
