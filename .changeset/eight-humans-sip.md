---
"@rocket.chat/meteor": minor
"@rocket.chat/i18n": minor
"@rocket.chat/rest-typings": minor
---

Allows agents and managers to close Omnichannel rooms that for some reason ended up in a bad state. This "bad state" could be a room that appears open but it's closed. Now, the endpoint `livechat/room.closeByUser` will accept an optional `forceClose` parameter that will allow users to bypass most state checks we do on rooms and perform the room closing again so its state can be recovered.
