import { api } from '@rocket.chat/core-services';
import type { RequiredField } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFile } from '../../../file/server';
import type { ICustomSoundData } from '../methods/insertOrUpdateSound';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const uploadCustomSound = async (
	userId: string | null,
	binaryContent: string,
	contentType: string,
	soundData: RequiredField<ICustomSoundData, '_id'>,
): Promise<void> => {
	if (!userId || !(await hasPermissionAsync(userId, 'manage-sounds'))) {
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
};
