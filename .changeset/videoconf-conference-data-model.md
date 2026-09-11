---
'@rocket.chat/core-services': minor
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ddp-client': minor
'@rocket.chat/models': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Groundwork for the video conference window: new API, no change to how any call behaves today.

Conference records gain per-member lifecycle fields (joined, declined, left, last seen, ringing) and the service
gains the operations a call window needs, behind new REST endpoints:

| Endpoint | What it does |
| --- | --- |
| `POST /v1/video-conference.leave` | Records that the caller left a call, ending it when nobody is left in it |
| `POST /v1/video-conference.heartbeat` | Renews the caller's presence lease, so a participant whose client vanishes is treated as gone |
| `POST /v1/video-conference.decline` | Records that the caller turned a call down, without ending it for anyone else |
| `POST /v1/video-conference.ring` | Rings a member who has not answered yet, again |
| `POST /v1/video-conference.rename` | Renames a running group call, for the person who started it |
| `POST /v1/video-conference.add-participants` | Adds people to a call in progress, and rings them |
| `POST /v1/video-conference.share-chat` | Gives members who cannot read the call's chat access to it |
| `GET /v1/video-conference.joinable` | Lists the calls the caller could still join |

A cron sweeps presence leases so a call whose participants vanish is closed rather than left running, and a
`video-conference` stream carries per-conference updates to whoever is watching one.

All of the new behaviour is reserved for providers whose call renders inside Rocket.Chat, identified by an
`embedded` capability. No provider registers that capability yet, so on any existing workspace every one of
these paths is skipped and calls placed through Jitsi, Google Meet, BBB or Pexip behave exactly as before. The
endpoints are additive and no client calls them yet.
