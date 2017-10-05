/* globals RocketChatFileEmojiCustomInstance */
Meteor.methods({
	deleteEmojiCustom(emojiID) {
		let emoji = null;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-emoji')) {
			emoji = RocketChat.models.EmojiCustom.findOneByID(emojiID);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (emoji == null) {
			throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', { method: 'deleteEmojiCustom' });
		}

		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${ emoji.name }.${ emoji.extension }`));
		RocketChat.models.EmojiCustom.removeByID(emojiID);
		RocketChat.Notifications.notifyLogged('deleteEmojiCustom', {emojiData: emoji});

		return true;
	}
});
