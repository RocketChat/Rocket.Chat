---
'@rocket.chat/fuselage': minor
---

`Menu` takes `size`, one of `mini`, `tiny`, `small`, `medium` or `large`, for the size of its trigger; `small` stays the default. The boolean props it replaces (`mini`, `tiny`, `small`, `medium`, `large`) are deprecated and keep working. A custom trigger passed as `is` now receives `size` instead of those boolean props, which an `IconButton` it renders understands as before.
