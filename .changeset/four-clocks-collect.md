---
"@rocket.chat/meteor": patch
"@rocket.chat/model-typings": patch
"@rocket.chat/models": patch
---

Fixes the behavior of "Maximum number of simultaneous chats" settings, making them more predictable. Previously, we applied a single limit per operation, being the order: `Department > Agent > Global`. This caused the department limit to take prescedence over agent's specific limit, causing some unwanted side effects.

The new way of applying the filter is as follows:
- An agent can accept chats from multiple departments, respecting each department’s limit individually.
- The total number of active chats (across all departments) must not exceed the configured Agent-Level or Global limit.
- If neither the Agent-Level nor Global Limit is set, only department-specific limits apply.
- If no limits are set at any level, there is no restriction on the number of chats an agent can handle.
