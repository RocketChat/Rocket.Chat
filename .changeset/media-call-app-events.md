---
'@rocket.chat/apps-engine': minor
'@rocket.chat/media-calls': minor
'@rocket.chat/apps': minor
'@rocket.chat/meteor': minor
---

Adds media call lifecycle events to the Apps-Engine: an app implementing the new `IMediaCallHandler` interface can now observe calls starting, being answered and ending, and can block a call or change the features it was requested with before it is created
