---
'@rocket.chat/abac': minor
'@rocket.chat/core-services': minor
'@rocket.chat/i18n': minor
'@rocket.chat/meteor': minor
---

Adds ABAC steps to **Create channel** and **Create team**. With ABAC enabled, the modals gain an **ABAC managed** switch: a room that is not ABAC-managed is created in two steps, its details and then its security settings, and an ABAC-managed room in four, adding its room attributes and a preview of which members will be added. An ABAC-managed room is always private and never federated. **Federated** moves to the first step, next to **ABAC managed**, and turning it on makes the room not ABAC-managed. While enforcement is on, every new room is ABAC-managed unless it is federated, the workspace's required attributes are filled in and cannot be removed. When attribute ownership is restricted, a creator who holds no value for a required attribute is told which one. With ABAC disabled, both modals are unchanged.

Adds `GET /v1/abac/attributes.listAssignable`, which lists the attribute values the caller may choose from on a room they create and, while enforcement is on, the attribute keys every new room must carry. Under an external PDP, the PDP still judges the chosen combination before the room is created. It requires the **Create ABAC-managed rooms** permission.
