---
'@rocket.chat/meteor': patch
---

Fixed business hours closing for one minute a day when configured as `00:00`-`23:59`. Work hours are set at minute granularity, but the finish time was treated as exclusive, so consecutive daily windows never met and the service dropped to closed for the whole `23:59` minute — agents could not become available and the Livechat widget rendered the offline form. A work hour now stays open until the end of its finish minute.
