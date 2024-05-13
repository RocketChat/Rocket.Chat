---
"@rocket.chat/meteor": patch
"@rocket.chat/core-services": patch
"@rocket.chat/omnichannel-services": patch
"@rocket.chat/pdf-worker": patch
---

Fixed multiple issues with PDF generation logic when a quoted message was too big to fit in one single page. This was causing an internal infinite loop within the library (as it tried to make it fit, failing and then trying to fit on next page where the same happened thus causing a loop).
The library was not able to break down some nested views and thus was trying to fit the whole quote on one single page. Logic was updated to allow wrapping of the contents when messages are quoted (so they can span multiple lines) and removed a bunch of unnecesary views from the code.
