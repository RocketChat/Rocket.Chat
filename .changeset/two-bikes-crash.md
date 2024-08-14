---
'@rocket.chat/meteor': patch
---

Fixed an issue related to setting Accounts_ForgetUserSessionOnWindowClose, this setting was not working as expected.

The new meteor 2.16 release introduced a new option to configure the Accounts package and choose between the local storage or session storage. They also changed how Meteor.\_localstorage works internally. Due to these changes in Meteor, our setting to use session storage wasn't working as expected. This PR fixes this issue and configures the Accounts package according to the workspace settings.
