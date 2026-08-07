---
'@rocket.chat/core-typings': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/jwt': minor
'@rocket.chat/ui-voip': minor
'@rocket.chat/meteor': minor
---

Adds LiveKit as a native video conference provider, so a call can run inside Rocket.Chat instead of handing the user to someone else's page.

Every provider until now has been a URL: the workspace knows a call is open and nothing else — not who is in it, not what was said, and certainly not how to record it. A native provider changes what the server can know. Conferences now carry the people actually connected, so the call itself can be the source of who is present rather than an inference from who clicked join.

On top of that: multi-party calls with a grid and spotlight, screen sharing, hand-raise and reactions, and a floating widget that keeps the call with the user when they navigate to another room. Recording runs through LiveKit egress and lands as an ordinary upload posted in a thread under the call's message. Live captions are opt-in per user and come from a worker that joins each room as a hidden participant; with note-taking on, the transcript is kept and an AI summary is posted alongside it when the call ends.

The provider is enterprise, off unless configured, and sits beside the existing URL-based providers rather than replacing them — a workspace with no LiveKit deployment behaves exactly as before.
