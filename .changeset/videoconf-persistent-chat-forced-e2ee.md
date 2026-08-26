---
'@rocket.chat/meteor': patch
'@rocket.chat/i18n': patch
---

Fixed video calls failing to start when **Force end-to-end encryption on private rooms** and video conference persistent chat were both enabled. The persistent chat discussion is created unencrypted, so room creation was rejected by the encryption policy, and because that step runs before the call URL, start message and notifications, the call was aborted and left an unusable conference record behind — with direct calls stuck ringing. The persistent chat discussion is now skipped when encryption is enforced on private rooms, and the call starts normally. The **Force end-to-end encryption on private rooms** setting also warns that it is not compatible with video conference persistent chat.
