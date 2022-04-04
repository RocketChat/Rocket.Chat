import { Meteor } from 'meteor/meteor';

import { CustomSounds } from '../../../models/server/raw';
import { hasPermission } from '../../../authorization/server';
import { api } from '../../../../server/sdk/api';
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
