---
"@rocket.chat/meteor": major
"rocketchat-services": major
---

Upgrades the version of the Meteor framework to 3.0

The main reason behind this is the upgrade of the Node.js version, where version 14 will be removed and version 20 will be used instead.

Internally, significant changes have been made, mostly due to the removal of fibers.

As a result, it was necessary to adapt our code to work with the new version.

No functionality should have been affected by this, but if you are running Rocket.Chat in unconventional ways, please note that you need to upgrade your Node.js version.
