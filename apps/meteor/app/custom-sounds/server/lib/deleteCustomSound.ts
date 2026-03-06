import { api } from '@rocket.chat/core-services';
import { CustomSounds } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const deleteCustomSound = async (_id: string): Promise<boolean> => {
	const sound = await CustomSounds.findOneById(_id);
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
