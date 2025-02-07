---
"@rocket.chat/meteor": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
---

Fixes the queue processing of Omnichannel's waiting queue focusing on 3 main areas:
- Changes the way we fetch the queue list to not append the public queue by default. This makes the server to not run the public queue always (as it is now) even if there was no work to be done.
- Changes how the queue executes: previously, it was executed in a kind of chain: We fetched a list of "queues", then we took one, processed it, and after that we scheduled the next run, which could take some time. Now, every TIMEOUT, server will try to process all the queues, 1 by 1, and then schedule the next run for all queues after TIMEOUT. This should speed up chat assignment and reduce waiting time when waiting queue is enabled.
- Removes the unlockAndRequeue and replcaes it with just unlock. This change shouldn't be noticeable. The original idea of the requeueing was to iterate over the inquiries when 1 wasn't being able to be taken. Idea was to avoid blocking the queue by rotating them instead of fetching the same until it gets routed, however this never worked cause we never modified the global sorting for the inquiries and it kept using the ts as the sorting, which returned always the oldest and ignored the requeing. So we're removing those extra steps as well.

