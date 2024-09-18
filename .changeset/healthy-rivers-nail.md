---
"@rocket.chat/meteor": minor
"@rocket.chat/i18n": minor
"@rocket.chat/livechat": minor
---

Added new setting `Allow visitors to finish conversations` that allows admins to decide if omnichannel visitors can close a conversation or not. This doesn't affect agent's capabilities of room closing, neither apps using the livechat bridge to close rooms.
However, if currently your integration relies on `livechat/room.close` endpoint for closing conversations, it's advised to use the authenticated version `livechat/room.closeByUser` of it before turning off this setting.
