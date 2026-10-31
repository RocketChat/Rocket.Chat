---
'@rocket.chat/agenda': patch
---

Fixed `Job.run()` hanging forever when the initial job save fails. The pre-run bookkeeping (`lastRunAt`, `computeNextRunAt`, the first `save()`) ran outside the error handling inside a promise executor, so a database failure there left the returned promise pending and surfaced as an unhandled rejection, stranding the worker with the job still locked. Those steps now run inside the same error path as the job function itself, so the failure marks the job failed and settles `run()`.
