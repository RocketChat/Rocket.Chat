---
'@rocket.chat/model-typings': patch
'@rocket.chat/omni-core': patch
'@rocket.chat/models': patch
'@rocket.chat/meteor': patch
---

Fixes an issue where the Omnichannel routing system ignored the `Livechat_accept_chats_with_no_agents` setting. Now, offline agents are correctly considered for assignment when the setting allows it.
