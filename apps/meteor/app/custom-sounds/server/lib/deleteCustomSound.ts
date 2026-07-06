import { api } from '@rocket.chat/core-services';
import { CustomSounds } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

export const deleteCustomSound = async (_id: string): Promise<void> => {
	const sound = await CustomSounds.findOneById(_id);

	if (!sound) {
		throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', {
			method: 'deleteCustomSound',
		});
	}

	// blob first, record last: a failure leaves a retryable record instead of an unreachable blob
	await RocketChatFileCustomSoundsInstance.deleteFile(`${sound._id}.${sound.extension}`);

	const deletedSound = await CustomSounds.findOneAndDeleteById(_id);

	if (!deletedSound) {
		throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', {
			method: 'deleteCustomSound',
		});
	}

	void api.broadcast('notify.deleteCustomSound', { soundData: deletedSound });
};
