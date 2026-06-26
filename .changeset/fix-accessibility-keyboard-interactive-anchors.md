---
'@rocket.chat/meteor': patch
---

Fixed accessibility issues where interactive anchor elements lacked keyboard accessibility in multiple modals. Replaced inaccessible `<Box is='a' onClick>` elements with `<Box is='button' type='button'>` to ensure proper keyboard navigation and screen reader support, fixing WCAG 2.1 Level A violations (2.1.1 Keyboard, 4.1.2 Name/Role/Value).
