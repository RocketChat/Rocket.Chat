import { api, Media } from '@rocket.chat/core-services';
import { EmojiCustom } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import limax from 'limax';
import { Meteor } from 'meteor/meteor';
import sharp from 'sharp';

import type { EmojiData } from './insertOrUpdateEmoji';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../../file/server';
import { RocketChatFileEmojiCustomInstance } from '../startup/emoji-custom';

const getFile = async (file: Buffer, extension: string) => {
	if (extension !== 'svg+xml') {
		return file;
	}

	return sharp(file).png().toBuffer();
};

export type EmojiDataWithAliases = Omit<EmojiData, 'aliases'> & { aliases?: string | string[] };

export async function uploadEmojiCustom(
	userId: string | null,
	binaryContent: string,
	contentType: string,
	emojiData: EmojiDataWithAliases,
) {
	return uploadEmojiCustomWithBuffer(userId, Buffer.from(binaryContent, 'binary'), contentType, emojiData);
}

export async function uploadEmojiCustomWithBuffer(
	userId: string | null,
	buffer: Buffer,
	contentType: string,
	emojiData: EmojiDataWithAliases,
): Promise<void> {
	// technically, since this method doesnt have any datatype validations, users can
	// upload videos as emojis. The FE won't play them, but they will waste space for sure.
	if (!userId || !(await hasPermissionAsync(userId, 'manage-emoji'))) {
		throw new Meteor.Error('not_authorized');
	}

	if (!Array.isArray(emojiData.aliases)) {
		// delete aliases for notification purposes. here, it is a string or undefined rather than an array
		delete emojiData.aliases;
	}

	emojiData.name = limax(emojiData.name, { replacement: '_' });

	const file = await getFile(buffer, emojiData.extension);
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
		ws.on('end', async () => {
			const etag = Random.hexString(6);
			await EmojiCustom.setETagByName(emojiData.name, etag);
			setTimeout(() => api.broadcast('emoji.updateCustom', { ...emojiData, etag }), 500);
			resolve();
		});

		rs.pipe(ws);
	});
}
