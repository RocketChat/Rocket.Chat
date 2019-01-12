import { readMessage as _readMessage } from 'meteor/rocketchat:ui-utils';
/* DEFINITIONS
- If window loses focus user needs to scroll or click/touch some place
- On hit ESC enable read, force read of current room and remove unread mark
- When user change room disable read until user interaction
- Only read if mark of *first-unread* is visible for user or if flag *force* was passed
- Always read the opened room
- The default method *read* has a delay of 2000ms to prevent multiple reads and to user be able to see the mark
*/

// Meteor.startup ->
// window.addEventListener 'focus', ->
// readMessage.refreshUnreadMark(undefined, true)

readMessage = _readMessage;
