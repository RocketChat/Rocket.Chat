/* globals deleteCustomEmoji */
Meteor.startup(() =>
	RocketChat.Notifications.onAll('deleteCustomEmoji', data => deleteCustomEmoji(data.emojiData))
);
