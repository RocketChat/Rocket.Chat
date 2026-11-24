---
'@rocket.chat/fuselage': minor
---

Narrows `CardBody` `flexDirection` and `height` to the values it is used with.

### Breaking for npm consumers

- `CardBody` `flexDirection` is now `'row' | 'column'` and `height` is now `'full'`.
