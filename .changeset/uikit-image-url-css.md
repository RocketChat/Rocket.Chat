---
'@rocket.chat/fuselage-ui-kit': patch
---

Fixes the image URL of a UIKit image block or image element being interpolated into a CSS `url()` value without quoting, so a URL containing a closing parenthesis ended the declaration and added its own. The URL is now accepted only when it is http(s), and it is quoted and escaped.
