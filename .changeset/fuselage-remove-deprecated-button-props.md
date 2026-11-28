---
'@rocket.chat/fuselage': minor
---

`Button`, `IconButton` and `Menu` no longer accept their deprecated boolean props. Use `variant` instead of `primary`, `secondary`, `info` (`IconButton`), `danger`, `warning` and `success`, combining `secondary` with a kind as `secondary-danger`, `secondary-warning` or `secondary-success`; and `size` instead of `mini`, `tiny`, `small`, `medium` and `large`. The `IconButtonSize` type is removed, and a `Menu` trigger defaults to `size='small'` as before.
