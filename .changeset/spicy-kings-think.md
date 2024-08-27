---
"@rocket.chat/meteor": patch
---

Fixes multiple problems with the `processRoomAbandonment` hook. This hook is in charge of calculating the time a room has been abandoned (this means, the time that elapsed since a room was last answered by an agent until it was closed). However, when business hours were enabled and the user didn't open on one day, if an abandoned room happened to be abandoned _over_ the day there was no business hour configuration, then the process will error out.
Additionally, the values the code was calculating were not right. When business hours are enabled, this code should only count the abandonment time _while a business hour was open_. When rooms were left abandoned for days or weeks, this will also throw an error or output an invalid count.
