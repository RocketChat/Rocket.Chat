---
"@rocket.chat/meteor": major
---

Randomizes `e2eKeyId` generation instead of derive it from encoded key. Previously, we used the stringified & encoded version of the key to extract a keyID, however this generated the same keyID for all rooms. As we didn't use this keyID, and rooms didn't have the capability of having multiple keys, this was harmless.
This PR introduces a new way of generating that identifier, making it random and unique, so multiple room keys can be used on the same room as long as the keyID is different.

NOTE: new E2EE rooms created _after_ this PR is merged will not be compatible with older versions of Rocket.Chat. Old rooms created before this update will continue to be compatible.
