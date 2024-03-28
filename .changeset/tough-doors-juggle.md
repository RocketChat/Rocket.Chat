---
"@rocket.chat/meteor": patch
---

Introduced a new step to the queue worker: when an inquiry that's on an improper status is selected for processing, queue worker will first check its status and will attempt to fix it.
For example, if an inquiry points to a closed room, there's no point in processing, system will now remove the inquiry
If an inquiry is already taken, the inquiry will be updated to reflect the new status and clean the queue.

This prevents issues where the queue worker attempted to process an inquiry _forever_ because it was in an improper state.
