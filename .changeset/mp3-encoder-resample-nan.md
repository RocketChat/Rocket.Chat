---
'@rocket.chat/mp3-encoder': patch
'@rocket.chat/meteor': patch
---

Fixes voice messages being encoded from corrupted (NaN) samples when the recording sample rate differs from the MP3 output rate, which is the case for the default 32 kbps bitrate on 48 kHz devices
