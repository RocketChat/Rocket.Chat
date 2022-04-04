import { Meteor } from 'meteor/meteor';

import { api } from '../../../../server/sdk/api';
import { hasPermission } from '../../../authorization';
import { EmojiCustom } from '../../../models/server/raw';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

Meteor.methods({
	async deleteEmojiCustom(emojiID) {
		if (!hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		const emoji = await EmojiCustom.findOneById(emojiID);
		if (emoji == null) {
			throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', {
				method: 'deleteEmojiCustom',
			});
		}

		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emoji.name}.${emoji.extension}`));
		await EmojiCustom.removeById(emojiID);
		api.broadcast('emoji.deleteCustom', emoji);

		return true;
	},
});
