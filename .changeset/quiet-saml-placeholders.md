---
'@rocket.chat/meteor': patch
---

Fixes the SAML User Data Field Map ignoring the `{{field}}` placeholders shown in the setting description example, so templates like `{{firstName}} {{lastName}}` and the `{{identifier}}` key now work the same as their `__field__` forms
