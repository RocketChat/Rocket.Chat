---
'@rocket.chat/meteor': patch
---

Stops rewriting `http://` to `https://` in generated workspace links (emails, push notifications, SAML) when "Force SSL" is enabled; links now use the scheme configured in "Site URL", so set an `https://` Site URL to get secure links
