# @rocket.chat/mediapipe-models

The two MediaPipe segmentation models Rocket.Chat's background blur uses, so a workspace serves them itself instead
of every client downloading them from Google.

The models are not in git: `build` and `prepack` fill `models/` from `manifest.json` (versioned upstream URL +
SHA-256), and the published tarball carries them. Updating a model means changing its URL and checksum there.
