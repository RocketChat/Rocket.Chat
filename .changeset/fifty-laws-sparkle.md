---
"@rocket.chat/meteor": patch
"@rocket.chat/core-typings": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
---

Now, we are not fetching cloud credentials from a cache, by doing so, we are avoiding the use of stale cloud credentials when comunication with cloud services. We are, also, using a new collection to store the credentials and their scopes.