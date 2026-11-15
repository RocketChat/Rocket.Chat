---
"@rocket.chat/meteor": patch
"@rocket.chat/web-ui-registration": patch
---

Improves the mobile web experience: the page background now follows the active theme so Safari no longer shows white strips in the overscroll/safe-area regions (and tints its toolbar) in dark mode; the login "Welcome to <workspace>" title is scaled down on small screens; focusing a field no longer triggers iOS Safari's auto zoom-in (inputs use a 16px minimum on mobile); the login email/username field no longer auto-capitalizes/auto-corrects; and the connection status bar layout no longer truncates its "Connect" button on narrow screens.
