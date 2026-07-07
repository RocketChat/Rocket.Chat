---
'@rocket.chat/meteor': patch
---

fix: Buttons from emoji picker misbehaving on clicks

An infinite render loop was preventing proper behavior when clicking on the emoji picker buttons. It was fixed by removing the unnecessary state update that was causing the loop and replacing multiple fires of the same mouseover event (when a mouseenter event was the right one to use). There is a chance this pre-existing bug was hidden by React 18's event delegation.
