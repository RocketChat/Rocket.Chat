---
'@rocket.chat/meteor': patch
---

Fixes SlackBridge posting a file shared in Slack as a bare link to Slack: every file of the message is now uploaded to Rocket.Chat and the text sent with it is kept. A file that can't be imported is still linked. Importing files needs the `files:read` scope on the Slack app.
