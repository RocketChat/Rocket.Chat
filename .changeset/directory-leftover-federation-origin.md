---
'@rocket.chat/model-typings': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes the admin and search directory omitting local users whose documents still carried data from the removed legacy federation, making them unsearchable in Directory > Users while still visible in Spotlight and Administration > Users.
