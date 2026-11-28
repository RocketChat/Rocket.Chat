---
'@rocket.chat/fuselage': patch
---

Fixes a `MessageMetricsItem` with only a label, such as "No messages yet", sitting 4px right of the metrics around it: the metrics are spaced by gaps instead of margins
