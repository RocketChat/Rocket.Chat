---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds an **ABAC managed** option to **Create channel** and **Create team** when ABAC is enabled. An ABAC-managed room is always private and walks the user through choosing its attributes and previewing which members will be added before it is created. While ABAC enforcement is on, every new room is ABAC-managed and the workspace's required attributes are filled in and cannot be removed. With ABAC disabled, both modals are unchanged.

Adds `GET /v1/abac/attributes.listAssignable`, which lists the attribute values a user may choose for a room they create.
