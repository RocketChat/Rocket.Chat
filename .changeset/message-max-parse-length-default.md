---
'@rocket.chat/meteor': major
---

Changes the default value of the `MESSAGE_MAX_PARSE_LENGTH` environment variable from `0` (no limit) to `10000` characters. Messages longer than that are no longer parsed for markdown and render as plain text, which keeps a single very large message from blocking the server and producing a stored markdown tree larger than the message itself. Workspaces using the default `Message_MaxAllowedSize` (5000) are not affected. To keep parsing longer messages, set `MESSAGE_MAX_PARSE_LENGTH` to a higher value, or to `0` to restore the previous unlimited behavior.
