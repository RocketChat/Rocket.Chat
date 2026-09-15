---
'@rocket.chat/streamer': patch
'@rocket.chat/ddp-streamer': patch
'@rocket.chat/meteor': patch
---

Moves the Streamer, Notifications and Listeners modules out of `apps/meteor` into the new `@rocket.chat/streamer` package so that the `ddp-streamer` service no longer compiles sources from the monolith. Runtime behaviour is unchanged; only import paths, build wiring and the error-log labels of the moved modules differ.
