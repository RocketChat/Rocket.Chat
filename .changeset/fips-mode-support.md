---
'@rocket.chat/meteor': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/federation-matrix': minor
'@rocket.chat/account-service': minor
'@rocket.chat/authorization-service': minor
'@rocket.chat/ddp-streamer': minor
'@rocket.chat/omnichannel-transcript': minor
'@rocket.chat/presence-service': minor
'@rocket.chat/queue-worker': minor
---

Adds support for running Rocket.Chat in FIPS mode. The monolith and all microservices (ddp-streamer, account-service, authorization-service, presence-service, queue-worker, omnichannel-transcript) can now enforce FIPS-compliant cryptography via Node.js/OpenSSL FIPS, with dedicated FIPS Docker images. Running in FIPS mode requires a license including the new `fips` module, and FIPS status is now reported in server logs and statistics.
