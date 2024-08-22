import { api } from '@rocket.chat/core-services';
import type { RequiredField } from '@rocket.chat/core-typings';
import type { ServerMethods } from '@rocket.chat/ddp-client';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../../file/server';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';
import type { ICustomSoundData } from './insertOrUpdateSound';

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

		const rs = RocketChatFile.bufferToStream(file);
		await RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.extension}`);

		return new Promise((resolve) => {
			const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.${soundData.extension}`, contentType);
			ws.on('end', () => {
				setTimeout(() => api.broadcast('notify.updateCustomSound', { soundData }), 500);
				resolve();
			});

			rs.pipe(ws);
		});
	},
});
