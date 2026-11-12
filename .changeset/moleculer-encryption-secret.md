---
'@rocket.chat/meteor': minor
---

Adds the `MOLECULER_ENCRYPTION_SECRET` environment variable to encrypt the traffic between instances of a multi-instance workspace, so that only instances sharing the secret can exchange events. Set the same secret on every instance and restart them together, as instances with different secrets stop seeing each other. Without it, the instance-to-instance port keeps accepting unauthenticated packets, and a warning is now logged at startup
