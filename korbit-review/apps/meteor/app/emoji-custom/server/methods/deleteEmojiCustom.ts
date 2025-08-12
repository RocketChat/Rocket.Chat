import { api } from '@rocket.chat/core-services';
import type { ICustomEmojiDescriptor } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { EmojiCustom } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		deleteEmojiCustom(emojiID: ICustomEmojiDescriptor['_id']): boolean;
	}
}

export const deleteEmojiCustom = async (userId: string, emojiID: ICustomEmojiDescriptor['_id']): Promise<boolean> => {
	if (!(await hasPermissionAsync(userId, 'manage-emoji'))) {
		throw new Meteor.Error('not_authorized');
	}

	const emoji = await EmojiCustom.findOneById(emojiID);
	if (emoji == null) {
		throw new Meteor.Error('Custom_Emoji_Error_Invalid_Emoji', 'Invalid emoji', {
			method: 'deleteEmojiCustom',
		});
	}

	await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emoji.name}.${emoji.extension}`));
	await EmojiCustom.removeById(emojiID);
	void api.broadcast('emoji.deleteCustom', emoji);

	return true;
};

Meteor.methods<ServerMethods>({
	async deleteEmojiCustom(emojiID) {
		if (!this.userId) {
			throw new Meteor.Error('not_authorized');
		}

		return deleteEmojiCustom(this.userId, emojiID);
	},
});
