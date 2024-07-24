---
"@rocket.chat/meteor": minor
---

Added a new setting `Livechat_transcript_send_always` that allows admins to decide if email transcript should be sent all the times when a conversation is closed. This setting bypasses agent's preferences. For this setting to work, `Livechat_enable_transcript` should be off, meaning that visitors will no longer receive the option to decide if they want a transcript or not.
