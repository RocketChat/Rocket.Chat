---
'@rocket.chat/meteor': patch
---

Fixes OAuth apps rejecting valid authorization requests when the configured Redirect URI had surrounding whitespace. A single redirect URI was stored verbatim, so a stray leading/trailing space or tab was kept and never matched the `redirect_uri` sent by the client, failing the authorization with `invalid_redirect_uri`. Redirect URIs are now trimmed consistently whether one or several are configured.
