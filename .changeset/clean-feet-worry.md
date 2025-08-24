---
"@rocket.chat/meteor": minor
"@rocket.chat/gazzodown": patch
"@rocket.chat/rest-typings": minor
---

Fixes search by name in custom emojis list, by adding a correct parameter to the endpoint `emoji-custom.all`

Now the endpoint `emoji-custom.all` accepts a `name` as parameter, so the filter should work on emojis page withouth the necessity of set `ALLOW_UNSAFE_QUERY_AND_FIELDS_API_PARAMS` env var
