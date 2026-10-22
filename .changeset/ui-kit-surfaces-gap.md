---
'@rocket.chat/fuselage-ui-kit': patch
'@rocket.chat/meteor': patch
---

UiKit surfaces space their blocks with a 16px gap instead of per-block margins, so blocks sit 16px apart, divider and tabs no longer add their own 24px margins, and only the message surface keeps 16px of space after its last block.
