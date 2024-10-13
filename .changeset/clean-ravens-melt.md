---
"@rocket.chat/meteor": minor
"@rocket.chat/core-typings": minor
---

Added three new settings to control how the agent might be handled down to the Omnichannel queue, they are:
- Livechat_Block_Unknown_Contacts: if the contact associated with the livechat visitor is unknown, the conversation won't be handled down to an agent;
- Livechat_Contact_Verification_App: Defines the app that is going to be used to verify the contact;
- Livechat_Request_Verification_On_First_Contact_Only: if the contact associated with the livechat visitor should be verified every time he starts a new conversation or only once.
