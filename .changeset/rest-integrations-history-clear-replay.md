---
'@rocket.chat/rest-typings': minor
'@rocket.chat/meteor': minor
---

Added `POST /v1/integrations.history.clear` and `POST /v1/integrations.outgoing.replay` (replace the deprecated `clearIntegrationHistory` and `replayOutgoingIntegration` DDP methods). Bodies `{ integrationId }` and `{ integrationId, historyId }` respectively. Permissions (`manage-outgoing-integrations` or `manage-own-outgoing-integrations`) are enforced the same way the DDP methods did. Legacy DDP methods remain registered with deprecation logs pointing at the new routes.
