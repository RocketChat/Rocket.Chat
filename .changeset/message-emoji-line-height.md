---
'@rocket.chat/fuselage': patch
'@rocket.chat/meteor': patch
---

Fixes inline emojis stretching the message line they sit on. The message body line box is now 22px, exposed as the `--rcx-message-body-line-height` token, and inline emojis are sized from it; native emoji glyphs in the app follow the same line height, and the body keeps block padding inside its overflow clip so they are not cropped on the first and last lines. Native emojis in message reactions also go back to the 16px box used by image emojis and image emojis drop their extra horizontal margin, so every reaction pill has the same height and width. Emojis in headings, UiKit blocks, thread and discussion previews, the room header topic and the announcement banner are sized to the line they sit in, and emoji-only messages keep their own taller line so the glyph is not cropped.

Also fixes opening a message link (`?msg=`) in a room whose history is taller than the viewport: the list was scrolled back to the latest message while the jump target was being measured, so the linked message never came into view. The taller message line made the `jump-to-thread-message` E2E room overflow the CI viewport and exposed it.
