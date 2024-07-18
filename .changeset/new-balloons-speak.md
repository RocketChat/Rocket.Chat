---
'@rocket.chat/meteor': patch
---

Fixed web client crashing on Firefox private window. Firefox disables access to service workers inside private windows. Rocket.Chat needs service workers to process E2EE encrypted files on rooms. These types of files won't be available inside private windows, but the rest of E2EE encrypted features should work normally
