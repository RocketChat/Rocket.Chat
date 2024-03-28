---
"@rocket.chat/meteor": patch
---

Fixed a problem that caused Business Hours feature (Multiple) to make bot agents not available when turning on the feature, and not making them available after that. Now, Business Hours will ignore Bot users, allowing admins to decide manually if a bot should be or not be active during a period of time
