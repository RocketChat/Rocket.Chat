---
'@rocket.chat/core-typings': minor
'@rocket.chat/license': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Adds a new `licenses.validate` REST endpoint that validates a Rocket.Chat license (V2 or V3 JWT) against the current workspace's validation structure without applying it, returning the validation details (validity, granted modules and any validation errors) so a license can be previewed before it is applied from the UI.
