---
'@rocket.chat/apps': patch
'@rocket.chat/meteor': patch
---

Fixes the blocks that apps nest in UiKit `container` and `layout` blocks, in a `conditional` block's `render` or in a `data_table` action cell: they and their elements now get an `appId`, `blockId` and `actionId` generated like those of top-level blocks.
