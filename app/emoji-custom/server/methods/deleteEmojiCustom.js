import { Meteor } from 'meteor/meteor';
import { hasPermission } from '../../../authorization';
import { EmojiCustom } from '../../../models';
import { Notifications } from '../../../notifications';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

Meteor.methods({
	deleteEmojiCustom(emojiID) {
		let emoji = null;

		if (hasPermission(this.userId, 'manage-emoji')) {
			emoji = EmojiCustom.findOneByID(emojiID);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (emoji == null) {
			throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', { method: 'deleteEmojiCustom' });
		}

		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${ emoji.name }.${ emoji.extension }`));
		EmojiCustom.removeByID(emojiID);
		Notifications.notifyLogged('deleteEmojiCustom', { emojiData: emoji });

		return true;
	},
});
