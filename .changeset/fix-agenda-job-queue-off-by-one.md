---
"@rocket.chat/agenda": patch
---

Fixed off-by-one error in `returnNextConcurrencyFreeJob` that skipped concurrency checks for the first job in the queue, and fixed potential crash when the queue is empty or all jobs are blocked by concurrency limits.
