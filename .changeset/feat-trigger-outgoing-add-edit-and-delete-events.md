---
'@rocket.chat/meteor': major
---

- Added support for outgoing triggers on events:
  - messageEdited
  - messageDeleted

- Purpose:
  These triggers allow external integrations or listeners to be notified
  whenever a message is edited or deleted, similar to existing outgoing
  triggers for messageSent.

- Changes:
  - Updated outgoing trigger mechanism to handle `messageEdited`
    and `messageDeleted` events.
  - Ensured that event payloads include the necessary information
    (message details and user context).

