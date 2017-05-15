/* globals updateEmojiCustom */
Meteor.startup(() =>
	RocketChat.Notifications.onLogged('updateEmojiCustom', data => updateEmojiCustom(data.emojiData))
);
