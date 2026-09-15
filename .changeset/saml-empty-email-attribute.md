---
"@rocket.chat/meteor": patch
---

Fixed SAML login accepting a profile whose email attribute has no usable value. An attribute with no values, or one holding only blank values, is now rejected during profile mapping, and the account lookup no longer runs when there is no valid address to search for.
