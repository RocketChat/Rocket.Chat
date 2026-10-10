---
'@rocket.chat/fuselage-forms': patch
---

Fixed wrapped inputs (`CheckBox`, `RadioButton`, `ToggleSwitch`) staying subscribed to their field's label clicks after being unmounted or replaced. Clicking the label no longer focuses and clicks detached inputs.
