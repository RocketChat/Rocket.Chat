---
"@rocket.chat/meteor": patch
---

fix: hide Microsoft Edge/IE native password reveal icons (#31739)

Hides the browser-native password reveal and clear buttons (`::-ms-reveal`, `::-ms-clear`) on password inputs that create duplicate icons alongside Rocket.Chat's custom eye icon on login/registration screens.
