import { api } from '@rocket.chat/core-services';
import { CustomSounds } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { hasPermissionAsync } from '../../../authorization/server/functions/hasPermission';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const deleteCustomSound = async (userId: string | null, _id: string): Promise<boolean> => {
	let sound;

	if (userId && (await hasPermissionAsync(userId, 'manage-sounds'))) {
		sound = await CustomSounds.findOneById(_id);
	} else {
		throw new Meteor.Error('not_authorized');
	}

	if (!sound) {
		throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', {
			method: 'deleteCustomSound',
		});
	}

	await RocketChatFileCustomSoundsInstance.deleteFile(`${sound._id}.${sound.extension}`);
	await CustomSounds.removeById(_id);
	void api.broadcast('notify.deleteCustomSound', { soundData: sound });

	return true;
};
