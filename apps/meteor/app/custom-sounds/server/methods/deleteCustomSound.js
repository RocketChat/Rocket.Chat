import { Meteor } from 'meteor/meteor';
import { CustomSounds } from '@rocket.chat/models';
import { api } from '@rocket.chat/core-services';

import { hasPermission } from '../../../authorization/server';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

Meteor.methods({
	async deleteCustomSound(_id) {
		let sound = null;

		if (hasPermission(this.userId, 'manage-sounds')) {
			sound = await CustomSounds.findOneById(_id);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (sound == null) {
			throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', {
				method: 'deleteCustomSound',
			});
		}

		RocketChatFileCustomSoundsInstance.deleteFile(`${sound._id}.${sound.extension}`);
		await CustomSounds.removeById(_id);
		api.broadcast('notify.deleteCustomSound', { soundData: sound });

		return true;
	},
});
