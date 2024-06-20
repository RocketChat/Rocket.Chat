---
"@rocket.chat/meteor": minor
"@rocket.chat/core-typings": minor
"@rocket.chat/model-typings": minor
"@rocket.chat/models": minor
---

Now, we are not fetching cloud credentials from a cache, by doing so, we are avoiding the use of stale cloud credentials when comunication with cloud services. We are, also, using a new collection to store the credentials and their scopes.