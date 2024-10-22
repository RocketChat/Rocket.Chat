---
"@rocket.chat/meteor": patch
---


 Changes the default base Docker image to Alpine. Previously we were shipping Alpine as an alternative flavor under the tag rocketchat/rocket.chat:{release}.alpine , we have been testing this for a while now so we're migrating to use the official one to Alpine.

We'll still ship a Debian variant under the tag rocketchat/rocket.chat:{release}.debian.
