---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds ABAC steps to **Create channel** and **Create team**. With ABAC enabled, the modals gain an **ABAC managed** switch: a room that is not ABAC-managed is created in two steps, its details and then its security settings, and an ABAC-managed room in four, adding its room attributes and a preview of which members will be added. An ABAC-managed room is always private and never federated. While enforcement is on, every new room is ABAC-managed, the workspace's required attributes are filled in and cannot be removed, and a creator who holds no value for one of them is told which. With ABAC disabled, both modals are unchanged.

Adds `GET /v1/abac/assignable-attributes`, which lists the attribute values the caller may set on a room they create, following the same rules as creation. It requires the **Create ABAC-managed rooms** permission.
