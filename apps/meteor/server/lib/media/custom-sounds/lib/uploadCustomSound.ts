import { api } from '@rocket.chat/core-services';
import type { RequiredField } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';

import type { ICustomSoundData } from './insertOrUpdateSound';
import { RocketChatFile } from '../../file';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const uploadCustomSound = async (
	buffer: Buffer,
	contentType: string,
	soundData: RequiredField<ICustomSoundData, '_id'>,
): Promise<void> => {
	const rs = RocketChatFile.bufferToStream(buffer);

	if (soundData.previousExtension) {
		// oxlint-disable-next-line typescript/no-unsafe-call -- RocketChatFileCustomSoundsInstance is exported untyped from custom-sounds.js
		await RocketChatFileCustomSoundsInstance.deleteFile(`${soundData._id}.${soundData.previousExtension}`);
	}

	return new Promise((resolve, reject) => {
		// oxlint-disable-next-line typescript/no-unsafe-call -- RocketChatFileCustomSoundsInstance is exported untyped from custom-sounds.js
		const ws = RocketChatFileCustomSoundsInstance.createWriteStream(`${soundData._id}.${soundData.extension}`, contentType);

		// oxlint-disable-next-line typescript/no-unsafe-call -- RocketChatFileCustomSoundsInstance is exported untyped from custom-sounds.js
		ws.on('error', (err: Error) => {
			reject(err);
		});

		rs.on('error', (err: Error) => {
			// oxlint-disable-next-line typescript/no-unsafe-call -- RocketChatFileCustomSoundsInstance is exported untyped from custom-sounds.js
			ws.destroy();
			reject(err);
		});

		// oxlint-disable-next-line typescript/no-unsafe-call -- RocketChatFileCustomSoundsInstance is exported untyped from custom-sounds.js
		ws.on('end', () => {
			setTimeout(async () => {
				const sound = await CustomSounds.findOneById(soundData._id);
				if (sound) {
					void api.broadcast('notify.updateCustomSound', { soundData: sound });
				}
			}, 500);
			resolve();
		});

		rs.pipe(ws);
	});
};
