---
'@rocket.chat/fuselage-ui-kit': patch
---

Fix race condition in ImageBlock where cached images could trigger load event before event listener was attached, causing images to never render properly in UIKit blocks.