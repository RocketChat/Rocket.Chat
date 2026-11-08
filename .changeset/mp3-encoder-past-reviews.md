---
'@rocket.chat/mp3-encoder': patch
---

Fixes latent bugs in encoder code paths that are currently disabled (ReplayGain analysis hanging on sample windows that are not a multiple of 8, and small-spectrum truncation sorting the wrong range lexically), and reduces per-frame allocations and per-chunk copying in the worker. The encoded MP3 output is unchanged.
