---
"@rocket.chat/meteor": major
"@rocket.chat/core-typings": major
"@rocket.chat/model-typings": major
"@rocket.chat/models": major
---

Now, we are not fetching cloud credentials from a cache, by doing so, we are avoiding the use of stale cloud credentials when comunicating with cloud services. We are, also, using a new collection to store the credentials and their scopes.
