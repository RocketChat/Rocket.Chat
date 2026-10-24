---
'@rocket.chat/meteor': patch
---

Fixed incorrect aspect ratios for URL image previews (e.g., Giphy GIFs) by adding `object-fit: contain` and `width: auto` to the `UrlImagePreview` component, ensuring images scale proportionally within the max-height constraint.
