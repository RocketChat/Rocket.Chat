---
'@rocket.chat/license': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds a new `licenses.validate` REST endpoint that validates a Rocket.Chat license (V2 or V3 JWT) against the current workspace without applying it, so a license can be previewed before it is applied from the UI. A valid license responds with success; an invalid one responds with the validation behaviors that rejected it.
