import { api } from '@rocket.chat/core-services';
import type { ICustomSound } from '@rocket.chat/core-typings';
import { CustomSounds } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const deleteCustomSoundById = async (userId: string, _id: ICustomSound['_id']): Promise<void> => {
	if (!(await hasPermissionAsync(userId, 'manage-sounds'))) {
		throw new Meteor.Error('not_authorized');
	}

	const sound = await CustomSounds.findOneById(_id);

	if (sound == null) {
		throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', {
			method: 'deleteCustomSound',
		});
	}

	await RocketChatFileCustomSoundsInstance.deleteFile(`${sound._id}.${sound.extension}`);
	await CustomSounds.removeById(_id);
	void api.broadcast('notify.deleteCustomSound', { soundData: sound });
};
