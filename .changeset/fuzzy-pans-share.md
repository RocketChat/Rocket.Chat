---
"@rocket.chat/meteor": minor
"@rocket.chat/apps": minor
"@rocket.chat/core-typings": minor
"@rocket.chat/model-typings": minor
---

Adds a `source` field to livechat visitors, which stores the channel (eg API, widget, SMS, email-inbox, app) that's been used by the visitor to send messages.
Uses the new `source` field to assure each visitor is linked to a single source, so that each connection through a distinct channel creates a new visitor.
