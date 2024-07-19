---
'@rocket.chat/omnichannel-services': minor
'@rocket.chat/pdf-worker': minor
'@rocket.chat/core-services': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Added system messages support for Omnichannel PDF transcripts and email transcripts. Currently these transcripts don't render system messages and is shown as an empty message in PDF/email. This PR adds this support for all valid livechat system messages.

Also added a new setting under transcripts, to toggle the inclusion of system messages in email and PDF transcripts.
