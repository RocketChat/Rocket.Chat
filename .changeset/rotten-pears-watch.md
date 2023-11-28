---
"@rocket.chat/meteor": patch
---

fix: wrong client hash calculation due to race condition on assets

Some deployments may suffer from some reloads if running multiple instances. It's caused by different client hashes generated due to a possible race condition on custom assets load at the startup time. Forcing the clients to talk to the right backend instances, which causes reloads if sticky sessions are not enabled.
This change removes the assets from the hash calculation preventing the race condition and possible different hashes. After this change, the clients will not reload when the admin changes assets.
