---
"@rocket.chat/meteor": minor
---

Avoid streaming inquiries to client when routing algorithm is not manual selection. Previously, all inquiries where sent to the client no matter which routing was used. Inquiries are not shown on the UI or interacted with when the inquiry is not manual selection.
Moreover, when the algorithm changes from Auto to Manual, the UI gets the updated list of inquiries from the server, cleaning the ones received up to that point.

Change will reduce the data sent over the wire and stored on the client's db.
