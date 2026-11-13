---
'@rocket.chat/meteor': patch
---

Renders the room message list (messages, system messages, thread previews, reactions, metrics, link previews, dividers and the message toolbar) with the Fuselage message parts that no longer take `style`. Class changes for anyone styling the client with custom CSS: the message parts keep their `rcx-message-*` classes, but the declarations come from frames, so rules that relied on their specificity need a review, and the unread divider bar is now `rcx-message-divider__bar--unread`. The mention and highlight classes of the message body were already moved to the markup by the `gazzodown-alt` change and are unaffected.

Visible changes:

- Link previews with an embedded iframe (e.g. YouTube) sit 5px tighter below, since the preview no longer zeroes its font size.
- In the Threads list the follow button column is 8px narrower and the preview text 8px wider (the metrics items are spaced with gap).
