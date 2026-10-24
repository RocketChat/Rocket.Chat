---
'@rocket.chat/fuselage': minor
---

`borderRadius`, `borderWidth`, `fontFamily`, `fontScale`, `strokeColor`, `fontColor` and `backgroundColor` only accept names from the Fuselage token lists, so a misspelled token fails to typecheck instead of silently resolving to no style. They also always return a value. `Box` styling props still accept any value at runtime, as before.
