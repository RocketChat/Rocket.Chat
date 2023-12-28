import { api, Media } from '@rocket.chat/core-services';
import type { ServerMethods } from '@rocket.chat/ui-contexts';
import limax from 'limax';
import { Meteor } from 'meteor/meteor';
import sharp from 'sharp';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../../file/server';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

const getFile = async (file: Buffer, extension: string) => {
	if (extension !== 'svg+xml') {
		return file;
	}

	return sharp(file).png().toBuffer();
};

declare module '@rocket.chat/ui-contexts' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadEmojiCustom(
			binaryContent: string,
			contentType: string,
			emojiData: {
				name: string;
				aliases?: string;
				extension: string;
			},
		): void;
	}
}

Meteor.methods<ServerMethods>({
	async uploadEmojiCustom(binaryContent, contentType, emojiData) {
		// technically, since this method doesnt have any datatype validations, users can
		// upload videos as emojis. The FE won't play them, but they will waste space for sure.
		if (!this.userId || !(await hasPermissionAsync(this.userId, 'manage-emoji'))) {
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
		await RocketChatFileEmojiCustomInstance.deleteFile(encodeURIComponent(`${emojiData.name}.${emojiData.extension}`));

		return new Promise((resolve) => {
			const ws = RocketChatFileEmojiCustomInstance.createWriteStream(
				encodeURIComponent(`${emojiData.name}.${emojiData.extension}`),
				contentType,
			);
			ws.on('end', () => {
				setTimeout(() => api.broadcast('emoji.updateCustom', emojiData), 500);
				resolve();
			});

			rs.pipe(ws);
		});
	},
});
