/* globals RocketChatFileCustomSoundsInstance */
Meteor.methods({
	deleteCustomSound(_id) {
		let sound = null;

		if (RocketChat.authz.hasPermission(this.userId, 'manage-sounds')) {
			sound = RocketChat.models.CustomSounds.findOneByID(_id);
		} else {
			throw new Meteor.Error('not_authorized');
		}

		if (sound == null) {
			throw new Meteor.Error('Custom_Sound_Error_Invalid_Sound', 'Invalid sound', { method: 'deleteCustomSound' });
		}

		RocketChatFileCustomSoundsInstance.deleteFile(`${ sound._id }.${ sound.extension }`);
		RocketChat.models.CustomSounds.removeByID(_id);
		RocketChat.Notifications.notifyAll('deleteCustomSound', {soundData: sound});

		return true;
	}
});
