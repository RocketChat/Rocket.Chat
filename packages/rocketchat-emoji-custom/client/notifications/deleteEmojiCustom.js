/* globals deleteEmojiCustom */
Meteor.startup(() =>
	RocketChat.Notifications.onAll('deleteEmojiCustom', data => deleteEmojiCustom(data.emojiData))
);
