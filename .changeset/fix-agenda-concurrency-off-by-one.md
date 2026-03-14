---
'@rocket.chat/agenda': patch
---

Fixes an off-by-one error in `JobProcessingQueue.returnNextConcurrencyFreeJob` where the loop condition `> 0` skipped checking the job at index 0, potentially allowing jobs with `concurrency: 1` to run in parallel. Also adds a guard for the `undefined` return in the caller.
