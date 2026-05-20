import { api } from '@rocket.chat/core-services';
import type { RequiredField } from '@rocket.chat/core-typings';

import type { ICustomSoundData } from './insertOrUpdateSound';
import { RocketChatFile } from '../../../file/server';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const uploadCustomSound = async (
	buffer: Buffer,
	contentType: string,
	soundData: RequiredField<ICustomSoundData, '_id'>,
): Promise<void> => {
	const rs = RocketChatFile.bufferToStream(buffer);

	if (soundData.previousExtension) {
		await RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.previousExtension}`);
	}

	return new Promise((resolve, reject) => {
		const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.${soundData.extension}`, contentType);

		ws.on('error', (err: Error) => {
			reject(err);
		});

		rs.on('error', (err: Error) => {
			ws.destroy();
			reject(err);
		});

		ws.on('end', () => {
			setTimeout(() => api.broadcast('notify.updateCustomSound', { soundData }), 500);
			resolve();
		});

		rs.pipe(ws);
	});
};
