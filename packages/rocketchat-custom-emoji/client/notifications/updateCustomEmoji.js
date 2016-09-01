/* globals updateCustomEmoji */
Meteor.startup(() =>
	RocketChat.Notifications.onAll('updateCustomEmoji', data => updateCustomEmoji(data.emojiData))
);
