---
'@rocket.chat/meteor': patch
---

Validate `src` URL scheme in the slash command composer preview popup. The `ComposerBoxPopupPreview` component now ignores preview media values that do not resolve to an `http`, `https`, `data`, or `blob` URL, blocking `javascript:` (and other non-media) URIs returned by `/v1/commands.preview`.
