import { Meteor } from 'meteor/meteor';
import limax from 'limax';
import sharp from 'sharp';

import { hasPermission } from '../../../authorization';
import { RocketChatFile } from '../../../file';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';
import { api } from '../../../../server/sdk/api';
import { Media } from '../../../../server/sdk';

const getFile = async (file, extension) => {
	if (extension !== 'svg+xml') {
		return file;
	}

	return sharp(file)
		.png()
		.toBuffer();
};

Meteor.methods({
	async uploadEmojiCustom(binaryContent, contentType, emojiData) {
		if (!hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		emojiData.name = limax(emojiData.name, { replacement: '_' });
		// delete aliases for notification purposes. here, it is a string rather than an array
		delete emojiData.aliases;

		const file = await getFile(Buffer.from(binaryContent, 'binary'), emojiData.extension);

		emojiData.extension = emojiData.extension === 'svg+xml' ? 'png' : emojiData.extension;
		const { data: resizedEmojiBuffer } = await Media.resizeFromBuffer(file, 128, 128, true, false, 'inside');
		const rs = RocketChatFile.bufferToStream(resizedEmojiBuffer);
		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${ emojiData.name }.${ emojiData.extension }`));
		const ws = RocketChatFileEmojiCustomInstance.createWriteStream(encodeURIComponent(`${ emojiData.name }.${ emojiData.extension }`), contentType);
		ws.on('end', Meteor.bindEnvironment(() =>
			Meteor.setTimeout(() => api.broadcast('emoji.updateCustom', emojiData), 500),
		));

		rs.pipe(ws);
	},
});
