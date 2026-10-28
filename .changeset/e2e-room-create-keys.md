---
'@rocket.chat/meteor': patch
'@rocket.chat/models': patch
'@rocket.chat/model-typings': patch
---

Fixes initial members of an encrypted room created with members (for example with `groups.create`) not receiving the room key when the creator's client does not hand it out. Initial members that have an E2EE public key now enter the room's key queue, as members added later already do. The creator's client also keeps handing out the key to the other members when encryption fails for one member.
