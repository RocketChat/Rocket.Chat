---
"@rocket.chat/meteor": patch
---


 Changes the default base Docker image to Alpine. We will generate a tag with the debian suffix, e.g., `7.0.0` -> `7.0.0-debian`. On the other hand, if you are already used to using alpine verision, you will need to remove the alpine suffix from the tag `7.0.0-alpine` -> `7.0.0`.
