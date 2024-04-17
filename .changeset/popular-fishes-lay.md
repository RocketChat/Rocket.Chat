---
"@rocket.chat/meteor": patch
---

**fix: settings-related statistics not being updated according to license changes**

Changes were made to the statistics to ensure that settings-related information is current.

Previously, some parts of the code were accessing setting information directly from the collection, bypassing license considerations.
To address this, the code was changed to utilize the `settings.get` util function.

The util (`settings`) already has the logic built-in to deliver the correct setting value based on the active license, thus ensuring that the data is always up-to-date.
