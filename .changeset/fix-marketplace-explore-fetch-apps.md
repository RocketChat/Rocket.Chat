---
'@rocket.chat/meteor': patch
---

Fixes an issue where fetching marketplace apps by ID failed with a 404 error ("No App found by the id") by allowing `GET /apps/:id` to fetch from Marketplace without requiring a version parameter, falling back to Marketplace when the app is not installed locally, and avoiding unnecessary local settings/apis requests for uninstalled apps.
