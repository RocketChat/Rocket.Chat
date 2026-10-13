---
'@rocket.chat/ui-client': patch
'@rocket.chat/meteor': patch
---

Removes `MarkdownTextContext` from `@rocket.chat/ui-client`. `UserCard` renders the custom status node it receives, and `UserInfo` takes an optional `renderMarkdown` prop for the bio and the custom field values; the web app passes its own Markdown renderer.
