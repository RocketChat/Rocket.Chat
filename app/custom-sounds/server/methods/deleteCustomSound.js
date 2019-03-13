import { Meteor } from 'meteor/meteor';
import { CustomSounds } from '/app/models';
import { hasPermission } from '/app/authorization';
import { Notifications } from '/app/notifications';
import { RocketChatFileCustomSoundsInstance } from '../startup/custom-sounds';

Meteor.methods({
	deleteCustomSound(_id) {
		let sound = null;

		if (hasPermission(this.userId, 'manage-sounds')) {
			sound = CustomSounds.findOneByID(_id);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (sound == null) {
			throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', { method: 'deleteCustomSound' });
		}

		RocketChatFileCustomSoundsInstance.deleteFile(`${ sound._id }.${ sound.extension }`);
		CustomSounds.removeByID(_id);
		Notifications.notifyAll('deleteCustomSound', { soundData: sound });

		return true;
	},
});
