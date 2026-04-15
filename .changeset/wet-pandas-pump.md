---
'@rocket.chat/model-typings': patch
'@rocket.chat/omni-core': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixed an issue where the Omnichannel routing system ignored the `Livechat_accept_chats_with_no_agents` setting. The agent availability queries have been updated to properly evaluate this setting, ensuring offline agents are correctly included in the routing pool when allowed.
