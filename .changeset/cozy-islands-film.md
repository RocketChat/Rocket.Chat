---
'@rocket.chat/meteor': patch
---

Rejects the first Custom OAuth login when the mapped username does not match the `UTF8_User_Names_Validation` setting, instead of creating a user that cannot save its profile later. Widen the setting to keep accepting such usernames (for example, `[0-9a-zA-Z-_.@]+` for email addresses).
