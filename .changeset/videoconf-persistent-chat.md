---
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/ddp-client': minor
'@rocket.chat/fuselage-ui-kit': minor
'@rocket.chat/ui-client': minor
'@rocket.chat/ui-kit': minor
'@rocket.chat/ui-voip': minor
'@rocket.chat/i18n': minor
'@rocket.chat/mock-providers': minor
'@rocket.chat/meteor': minor
---

Gives a video conference a chat that outlives it, and a window of its own to hold both.

Joining a conference now opens a dedicated call window at `/conference/:id` — the provider's call beside the conference's chat, with the people on the call in a panel of their own — instead of handing the user off to the provider's page. A preflight screen opens first: it is where the camera and microphone are chosen, where whoever started a group call can name it, and where confirming is what actually creates the call, so a call nobody confirmed leaves no message, no ring and no history behind. Closing the window reports leaving, and a call nobody is left in ends by itself.

Adding someone to a conference makes them a member of the **conference** rather than putting them in a room. Membership authorizes joining the call alongside room access, so a person from outside the conference's room can join without being handed the room's history — and whether they can read the chat becomes a separate question, surfaced once it matters with a choice of how to resolve it: bring them into the room, or move the chat to a discussion. `video-conference.info` reports the members who can't read it and `POST /v1/video-conference.share-chat` applies the remedy; `video-conference.add-participants` takes just the users and returns the ids it added.

An incoming call is no longer a popup demanding an answer. It is the first item of a list of the calls running now — docked in the sidebar — where it can be accepted, turned down, or silenced and left ringing while the user finishes what they were doing. That list is also how a call is reached when its ring was missed entirely, which a one-shot ring in a room of more than ten people always is (`GET /v1/video-conference.joinable`).

Conferences appear in the personal Call History from the moment they start, as `ongoing`, settling per member into `ended` or `not-answered` when the call stops — so a call that was declined or never answered is still in the log, and still joinable from it. Conference discussions carry a banner back into the ongoing call, and the room's own call list stops counting members who were added but never joined.

New endpoints: `video-conference.decline` (recorded against the caller's own membership, never ending the call for anyone else), `.leave`, `.ring` (to try someone again — a ring is one-shot, so there was previously no second attempt), `.rename` and `.share-chat`. A single `video-conference.updated` stream event tells an open call window that the conference it is showing has changed.
