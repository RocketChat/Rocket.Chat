import { api } from '@rocket.chat/core-services';
import type { RequiredField } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { fromBuffer } from 'file-type';
import { Meteor } from 'meteor/meteor';

import type { ICustomSoundData } from './insertOrUpdateSound';
import { MAX_CUSTOM_SOUND_SIZE_BYTES } from '../../../../lib/constants';
import { MIME } from '../../../../server/ufs/ufs-mime';
import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../../file/server';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

declare module '@rocket.chat/ddp-client' {
	// eslint-disable-next-line @typescript-eslint/naming-convention
	interface ServerMethods {
		uploadCustomSound(binaryContent: string, contentType: string, soundData: RequiredField<ICustomSoundData, '_id'>): void;
	}
}

Meteor.methods<ServerMethods>({
	async uploadCustomSound(binaryContent, contentType, soundData) {
		if (!this.userId || !(await hasPermissionAsync(this.userId, 'manage-sounds'))) {
			throw new Meteor.Error('not_authorized');
		}

		const file = Buffer.from(binaryContent, 'binary');
		if (file.length > MAX_CUSTOM_SOUND_SIZE_BYTES) {
			throw new Meteor.Error('file-too-large', 'Max size is 5MB');
		}

		const mimeType = await fromBuffer(file);
		if (!mimeType || mimeType.mime !== MIME.mp3 || mimeType.ext !== 'mp3' || soundData.extension !== 'mp3') {
			throw new Meteor.Error('invalid-file-type', 'Only MP3 files are allowed');
		}

		const rs = RocketChatFile.bufferToStream(file);
		await RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.extension}`);

		return new Promise((resolve) => {
			const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.mp3`, MIME.mp3);
			ws.on('end', () => {
				setTimeout(() => api.broadcast('notify.updateCustomSound', { soundData }), 500);
				resolve();
			});

			rs.pipe(ws);
		});
	},
});
