---
"@rocket.chat/meteor": patch
---

fix: Validate rooms are not taken before processing by queue. This will prevent an issue that caused a room, that's on an invalid state, to be re-processed by the queue worker, assigning it again to another user despite being already assigned to one. This happens when a room's inquiry gets to an state where it desyncs from the room object. Room is taken & served while inquriy is still queued. This fix will also reconciliate both when something like this happens: whenever the queue picks a chat that's already taken, it will update it's inquiry object to reflect that and avoid processing again.
