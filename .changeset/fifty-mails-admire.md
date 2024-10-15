---
'@rocket.chat/web-ui-registration': patch
"@rocket.chat/meteor": major
---

Login services button was not respecting the button color and text color settings. Implemented a fix to respect these settings and change the button colors accordingly.

Added a warning on all settings which allow admins to change OAuth button colors, so that they can be alerted about WCAG (Web Content Accessibility Guidelines) compliance.
