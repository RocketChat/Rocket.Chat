import { Meteor } from 'meteor/meteor';
import limax from 'limax';

import { hasPermission } from '../../../authorization';
import { RocketChatFile } from '../../../file';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';
import { api } from '../../../../server/sdk/api';

Meteor.methods({
	uploadEmojiCustom(binaryContent, contentType, emojiData) {
		if (!hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		emojiData.name = limax(emojiData.name, { replacement: '_' });
		// delete aliases for notification purposes. here, it is a string rather than an array
		delete emojiData.aliases;
		const file = Buffer.from(binaryContent, 'binary');

		const rs = RocketChatFile.bufferToStream(file);
		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${ emojiData.name }.${ emojiData.extension }`));
		const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${ emojiData.name }.${ emojiData.extension }`), contentType);
		ws.on('end', Meteor.bindEnvironment(() =>
			Meteor.setTimeout(() => api.broadcast('emoji.updateCustom', emojiData), 500),
		));

		rs.pipe(ws);
	},
});
