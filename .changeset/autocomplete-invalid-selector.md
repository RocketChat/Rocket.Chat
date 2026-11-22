---
'@rocket.chat/meteor': patch
---

Fixes the autocomplete endpoints answering a raw parser or type error, or an unfiltered list, when the `selector` parameter is not a JSON object; they now answer `The selector must be a JSON object` with the `error-invalid-params` error
