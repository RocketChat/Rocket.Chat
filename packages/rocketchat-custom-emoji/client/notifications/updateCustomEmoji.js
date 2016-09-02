/* globals updateEmojiCustom */
Meteor.startup(() =>
	RocketChat.Notifications.onAll('updateEmojiCustom', data => updateEmojiCustom(data.emojiData))
);
