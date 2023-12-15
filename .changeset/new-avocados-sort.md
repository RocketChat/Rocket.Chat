---
"@rocket.chat/meteor": patch
---

fix: Wrong `Message Roundtrip Time` metric

Removes the wrong metric gauge named `rocketchat_messages_roundtrip_time` and replace it by a new summary metric named `rocketchat_messages_roundtrip_time_summary`. Add new percentiles `0.5, 0.95 and 1` to all summary metrics.
