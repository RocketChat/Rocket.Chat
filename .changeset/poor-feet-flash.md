---
'@rocket.chat/meteor': patch
---

This commit introduces a multi-delete feature to Rocket.Chat, allowing users to select and delete multiple messages within both RoomMessage and SystemMessages. New files MultiDeleteMessages.tsx, index.ts, and useMultiDeleteMessagesRoomAction.ts have been added to the contextualBar/MultiDeleteMessages directory. Key modifications were made to ui.ts, MessageToolbarActionMenu.tsx, useDeleteMessageAction.ts, RoomMessage.tsx, and SystemMessage.tsx to integrate this functionality seamlessly.

When the delete button is clicked in a room message, the UI enters a selecting mode by leveraging SelectedMessageContext and SelectedMessageProvider, displaying checkboxes next to each message for selection based on user permissions (deleteAllowed). 

For threaded messages, the delete action bypasses the multi-select UI and directly deletes the single message. This distinction is managed by passing the context to useDeleteMessageAction.ts. 