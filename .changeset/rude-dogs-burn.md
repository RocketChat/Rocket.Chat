---
"@rocket.chat/meteor": patch
---

Fixed a behavior when updating messages that prevented the `customFields` prop from being updated if there were no changes to the `msg` property. Now, `customFields` will be always updated on message update even if `msg` doesn't change
