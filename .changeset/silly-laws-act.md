---
"@rocket.chat/http-router": patch
---

This change fixes the HTTP route validation to return the correct error message 'invalid-params' instead of 'error-invalid-params', ensuring consistency with our API error codes. The body validation should now return 'invalid-params' instead of 'error-invalid-params'.'
