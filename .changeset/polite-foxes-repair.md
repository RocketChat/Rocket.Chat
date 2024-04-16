---
'@rocket.chat/meteor': minor
---

Added the `getMessages` method in the Apps Engine, this method will allow Apps to read room messages. You can pass your own query to filter the messages you want to retrieve. The available options are:

- `limit`: The number of messages to retrieve. (Default: 100 and Max: 100)
- `skip`: The number of messages to skip.
- `sort`: The sort order of the messages. e.g. `{ ts: -1 }` will sort the messages by timestamp in descending order.
