import { api } from '@rocket.chat/core-services';
import type { RequiredField } from '@rocket.chat/core-typings';

import { RocketChatFile } from '../../../file/server';
import type { ICustomSoundData } from '../methods/insertOrUpdateSound';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const uploadCustomSound = async (
	buffer: Buffer,
	contentType: string,
	soundData: RequiredField<ICustomSoundData, '_id'>,
): Promise<void> => {
	const rs = RocketChatFile.bufferToStream(buffer);
	await RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.extension}`);

	return new Promise((resolve) => {
		const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.${soundData.extension}`, contentType);
		ws.on('end', () => {
			setTimeout(() => api.broadcast('notify.updateCustomSound', { soundData }), 500);
			resolve();
		});

		rs.pipe(ws);
	});
};
