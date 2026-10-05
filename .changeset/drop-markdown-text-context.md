---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Removes `MarkdownTextContext` from `@rocket.chat/ui-client`. `UserCard` and `UserInfo` now render the `bio` and custom status nodes they receive, and `UserInfo` takes an optional `renderCustomFieldValue` prop; the web app renders those values as Markdown itself.
