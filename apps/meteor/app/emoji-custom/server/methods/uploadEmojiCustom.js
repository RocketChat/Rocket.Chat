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

	return sharp(file).png().toBuffer();
};

Meteor.methods({
	async uploadEmojiCustom(binaryContent, contentType, emojiData) {
		// technically, since this method doesnt have any datatype validations, users can
		// upload videos as emojis. The FE won't play them, but they will waste space for sure.
		if (!hasPermission(this.userId, 'manage-emoji')) {
			throw new Meteor.Error('not_authorized');
		}

		emojiData.name = limax(emojiData.name, { replacement: '_' });
		// delete aliases for notification purposes. here, it is a string rather than an array
		delete emojiData.aliases;

		const file = await getFile(Buffer.from(binaryContent, 'binary'), emojiData.extension);
		emojiData.extension = emojiData.extension === 'svg+xml' ? 'png' : emojiData.extension;

		let fileBuffer;
		// sharp doesn't support these formats without imagemagick or libvips installed
		// so they will be stored as they are :(
		if (['gif', 'x-icon', 'bmp', 'webm'].includes(emojiData.extension)) {
			fileBuffer = file;
		} else {
			// This is to support the idea of having "sticker-like" emojis
			const { data: resizedEmojiBuffer } = await Media.resizeFromBuffer(file, 512, 512, true, false, false, 'inside');
			fileBuffer = resizedEmojiBuffer;
		}

		const rs = RocketChatFile.bufferToStream(fileBuffer);
		RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));
		const ws = RocketChatFileEmojiCustomInstance.createWriteStream(
			encodeURIComponent(`${emojiData.name}.${emojiData.extension}`),
			contentType,
		);
		ws.on(
			'end',
			Meteor.bindEnvironment(() => Meteor.setTimeout(() => api.broadcast('emoji.updateCustom', emojiData), 500)),
		);

		rs.pipe(ws);
	},
});
