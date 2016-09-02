/* globals isSetNotNull, RocketChatFileCustomEmojiInstance */
Meteor.methods({
	deleteCustomEmoji(emojiID) {
		let emoji = null;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-assets')) {
			emoji = RocketChat.models.CustomEmoji.findOneByID(emojiID);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (!isSetNotNull(() => emoji)) {
			throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', { method: 'deleteCustomEmoji' });
		}

		RocketChatFileCustomEmojiInstance.deleteFile(encodeURIComponent(`${emoji.name}.${emoji.extension}`));
		RocketChat.models.CustomEmoji.removeByID(emojiID);
		RocketChat.Notifications.notifyAll('deleteCustomEmoji', {emojiData: emoji});

		return true;
	}
});
