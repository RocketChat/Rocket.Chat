---
'@rocket.chat/fuselage': patch
'@rocket.chat/meteor': patch
---

Fixes inline emojis stretching the message line they sit on. The message body line box is now 22px, exposed as the `--rcx-message-body-line-height` token, and inline emojis are sized from it; native emoji glyphs in the app follow the same line height, and the body keeps block padding inside its overflow clip so they are not cropped on the first and last lines. Native emojis in message reactions also go back to the 16px box used by image emojis, so every reaction pill has the same height.
