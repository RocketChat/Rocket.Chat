---
'@rocket.chat/meteor': major
---

Removed deprecated methods `livechat:requestTranscript` and `livechat:discardTranscript`. Moving forward use `livechat/transcript/:rid` endpoint's POST and DELETE methods.
