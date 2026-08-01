---
'@rocket.chat/core-typings': minor
'@rocket.chat/core-services': minor
'@rocket.chat/model-typings': minor
'@rocket.chat/models': minor
'@rocket.chat/rest-typings': minor
'@rocket.chat/fuselage-ui-kit': minor
'@rocket.chat/meteor': minor
---

Adding someone to a video conference now makes them a member of the **conference** rather than putting them in a room. Membership authorizes joining the call alongside room access, so a person from outside the conference's room can join without being given the room's chat history, and everyone added is rung. Whether a member can read the chat becomes a separate concern rather than a choice forced at invite time, so `video-conference.add-participants` no longer takes `keepHistory` and returns the ids it added.
