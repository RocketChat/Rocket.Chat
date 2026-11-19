---
'@rocket.chat/fuselage': patch
'@rocket.chat/fuselage-hooks': patch
'@rocket.chat/fuselage-forms': patch
'@rocket.chat/fuselage-toastbar': patch
'@rocket.chat/fuselage-ui-kit': patch
---

Declares React 19 as the required peer version. These packages already pass `ref` as a regular prop and call `use()`, so they do not work with React 18.
