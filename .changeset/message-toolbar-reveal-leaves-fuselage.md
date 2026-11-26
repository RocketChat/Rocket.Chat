---
'@rocket.chat/fuselage': minor
---

`MessageToolbarWrapper` no longer shows itself when its `Message` is hovered or focused: it is shown only while `visible` is set, so the application decides when a message shows its toolbar. `MessageToolbar` and `MessageToolbarWrapper` position themselves against the nearest positioned ancestor, inside a `Message` or not.

Breaking for npm consumers: a toolbar that relied on the hover of its `Message` to appear stays hidden. Pass `visible` to `MessageToolbarWrapper`, or reveal it from your own stylesheet. A `MessageToolbar` rendered without a `MessageToolbarWrapper` is always shown. It also no longer has the 20px inline margin it had before, because that inset now belongs to `MessageToolbarWrapper` (`inset-inline-end: lengths.margin(20)`), so a bare `MessageToolbar` rendered outside the wrapper sits 20px closer to the inline edge.
