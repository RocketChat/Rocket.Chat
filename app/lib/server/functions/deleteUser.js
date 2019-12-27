import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { FileUpload } from '../../../file-upload';
import { Users, Subscriptions, Messages, Rooms, Integrations, FederationServers } from '../../../models';
import { settings } from '../../../settings';
import { Notifications } from '../../../notifications';
import { relinquishRoomOwnerships } from './relinquishRoomOwnerships';

export const deleteUser = function(userId) {
	const user = Users.findOneById(userId, {
		fields: { username: 1, avatarOrigin: 1, federation: 1 },
	});

	if (user.federation) {
		const existingSubscriptions = Subscriptions.find({ 'u._id': user._id }).count();

		if (existingSubscriptions > 0) {
			throw new Meteor.Error('FEDERATION_Error_user_is_federated_on_rooms');
		}
	}

	// Users without username can't do anything, so there is nothing to remove
	if (user.username != null) {
		relinquishRoomOwnerships(user._id);

		const messageErasureType = settings.get('Message_ErasureType');
		switch (messageErasureType) {
			case 'Delete':
				const store = FileUpload.getStore('Uploads');
				Messages.findFilesByUserId(userId).forEach(function({ file }) {
					store.deleteById(file._id);
				});
				Messages.removeByUserId(userId);
				break;
			case 'Unlink':
				const rocketCat = Users.findOneById('rocket.cat');
				const nameAlias = TAPi18n.__('Removed_User');
				Messages.unlinkUserId(userId, rocketCat._id, rocketCat.username, nameAlias);
				break;
		}

		Subscriptions.removeByUserId(userId); // Remove user subscriptions
		Rooms.removeDirectRoomContainingUsername(user.username); // Remove direct rooms with the user

		// removes user's avatar
		if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url') {
			FileUpload.getStore('Avatars').deleteByName(user.username);
		}

		Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.
		Notifications.notifyLogged('Users:Deleted', { userId });
	}

	Users.removeById(userId); // Remove user from users database

	// Refresh the servers list
	FederationServers.refreshServers();
};
