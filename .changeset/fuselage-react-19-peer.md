---
'@rocket.chat/fuselage': patch
'@rocket.chat/fuselage-hooks': patch
'@rocket.chat/fuselage-forms': patch
'@rocket.chat/fuselage-toastbar': patch
'@rocket.chat/fuselage-ui-kit': patch
---

Declares React 19 as the required peer version of the Fuselage packages:

- `@rocket.chat/fuselage` calls `use()` and reads `ref` as a regular prop instead of through `forwardRef`, so it doesn't work with React 18.
- `@rocket.chat/fuselage-forms` reads `ref` as a regular prop and builds on `@rocket.chat/fuselage`.
- `@rocket.chat/fuselage-toastbar` and `@rocket.chat/fuselage-ui-kit` build on `@rocket.chat/fuselage`.
- `@rocket.chat/fuselage-hooks` uses no React 19-only API, but takes the same range as the other packages, since it is only tested against React 19.
