---
"@rocket.chat/meteor": patch
---

Fixed a bad behavior with the interaction between OTR system messages & trash collection. We use trash collection as a temporary storage that holds recently deleted items from some collections. Messages is one of those. This was causing "User joined OTR" messages to be viewable when querying the trash collection.
Since OTR messages are by definition private, code was updated to bypass trash collection when removing these special messages.

Note: this only applies to these system messages. OTR user's messages are not stored on the database.
