---
'@rocket.chat/meteor': major
---

Added migration to change default behavior of E2E_Allow_Unencrypted_Messages and E2E_Enable_Encrypt_Files settings, the default behavior wouldn't allow to send un-encrypted messages in end to end encrypted channels and would allow users to send encrypted files and attachments.
