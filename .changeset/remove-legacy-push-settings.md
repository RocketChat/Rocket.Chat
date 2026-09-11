---
'@rocket.chat/meteor': major
'@rocket.chat/i18n': major
---

Removes the `Push_UseLegacy`, `Push_gcm_project_number` and `Push_gcm_api_key` settings. The legacy GCM push notification provider they configured was shut down by Google on June 20, 2024, so these settings no longer had any effect. Android push notifications continue to work through the push gateway or the FCM credentials configured in `Push_google_api_credentials`. On upgrade the removed settings are deleted from the database.
