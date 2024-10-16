---
"@rocket.chat/meteor": major
"@rocket.chat/core-typings": major
"@rocket.chat/model-typings": major
"@rocket.chat/models": major
---

Adds a new collection to store all the workspace cloud tokens to defer the race condition management to MongoDB instead of having to handle it within the settings cache.
Removes the Cloud_Workspace_Access_Token & Cloud_Workspace_Access_Token_Expires_At settings since they are not going to be used anymore.