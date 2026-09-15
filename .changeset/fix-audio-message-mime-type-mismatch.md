---
'@rocket.chat/meteor': patch
---

Fixes the audio message (mic) button staying disabled when `audio/mpeg` is whitelisted in the File Upload media type settings. The composer validation still checked for the legacy `audio/mp3` MIME type, while the audio recorder has produced `audio/mpeg` blobs since v3.5.1. Also fixed the `Message_AudioRecorderEnabled` setting's description never rendering, due to referencing an i18n key the setting doesn't use.
