---
'@rocket.chat/fuselage': minor
'@rocket.chat/meteor': patch
---

Narrows `CardBody` to the values it is used with, and stops the app from borrowing `Card` classes as styles.

### Breaking for npm consumers

- `CardBody` `flexDirection` is now `'row' | 'column'` and `height` is now `'full'`.
