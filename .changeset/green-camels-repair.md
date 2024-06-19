---
"@rocket.chat/meteor": patch
---

Fixed 2 issues with `QueueInactivityMonitor` callback. This callback was in charge of scheduling the job that would close the inquiry, but it was checking on a property that didn't exist. This caused the callback to early return without scheduling the job, making the feature to not to work.
