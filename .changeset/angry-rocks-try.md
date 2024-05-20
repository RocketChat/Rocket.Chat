---
"@rocket.chat/meteor": patch
---

Fixed an issue causing monitors to dissapear from a saved unit every time a user saved the item. This was caused by the UI not sending the correct _id of the monitors that were already saved, and this caused the Backend to ignore them and remove from the list.
