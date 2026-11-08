---
'@rocket.chat/abac': minor
'@rocket.chat/meteor': minor
---

Returns every ABAC room creation, enforcement, member preview and room attribute editing error in one shape, with the error key in both `error` and `errorType`, and the refused attribute in `details` where one is at fault. The keys are listed in `ee/packages/abac/docs/error-contract.md`.
