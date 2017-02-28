/* globals deleteEmojiCustom */
Meteor.startup(() =>
	RocketChat.Notifications.onLogged('deleteEmojiCustom', data => deleteEmojiCustom(data.emojiData))
);
