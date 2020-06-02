import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

import { FileUpload } from '../../../file-upload/server';
import { Users, Subscriptions, Messages, Rooms, Integrations, FederationServers } from '../../../models/server';
import { hasRole, getUsersInRole } from '../../../authorization/server';
import { settings } from '../../../settings/server';
import { Notifications } from '../../../notifications/server';
import { updateGroupDMsName } from './updateGroupDMsName';

const bulkRoomCleanUp = (rids) => {
	// no bulk deletion for files
	rids.forEach((rid) => FileUpload.removeFilesByRoomId(rid));

	return Promise.await(Promise.all([
		Subscriptions.removeByRoomIds(rids),
		Messages.removeByRoomIds(rids),
		Rooms.removeByIds(rids),
	]));
};

export const deleteUser = function(userId) {
	const user = Users.findOneById(userId, {
		fields: { username: 1, avatarOrigin: 1, federation: 1 },
	});

	if (!user) {
		return;
	}

	if (user.federation) {
		const existingSubscriptions = Subscriptions.find({ 'u._id': user._id }).count();

		if (existingSubscriptions > 0) {
			throw new Meteor.Error('FEDERATION_Error_user_is_federated_on_rooms');
		}
	}

	// Users without username can't do anything, so there is nothing to remove
	if (user.username != null) {
		const roomCache = [];

		// Iterate through all the rooms the user is subscribed to, to check if they are the last owner of any of them.
		Subscriptions.db.findByUserId(userId).forEach((subscription) => {
			const roomData = {
				rid: subscription.rid,
				t: subscription.t,
				subscribers: null,
			};

			// DMs can always be deleted, so let's ignore it on this check
			if (roomData.t !== 'd') {
				// If the user is an owner on this room
				if (hasRole(user._id, 'owner', subscription.rid)) {
					// Fetch the number of owners
					const numOwners = getUsersInRole('owner', subscription.rid).fetch().length;
					// If it's only one, then this user is the only owner.
					if (numOwners === 1) {
						// If the user is the last owner of a public channel, then we need to abort the deletion
						if (roomData.t === 'c') {
							throw new Meteor.Error('error-user-is-last-owner', `To delete this user you'll need to set a new owner to the following room: ${ subscription.name }.`, {
								method: 'deleteUser',
							});
						}

						// For private groups, let's check how many subscribers it has. If the user is the only subscriber, then it will be eliminated and doesn't need to abort the deletion
						roomData.subscribers = Subscriptions.findByRoomId(subscription.rid).count();

						if (roomData.subscribers > 1) {
							throw new Meteor.Error('error-user-is-last-owner', `To delete this user you'll need to set a new owner to the following room: ${ subscription.name }.`, {
								method: 'deleteUser',
							});
						}
					}
				}
			}

			roomCache.push(roomData);
		});

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

		const roomIds = roomCache.filter((roomData) => {
			if (roomData.subscribers === null && roomData.t !== 'd' && roomData.t !== 'c') {
				roomData.subscribers = Subscriptions.findByRoomId(roomData.rid).count();
			}

			// Remove non-channel rooms with only 1 user (the one being deleted)
			return roomData.t !== 'c' && roomData.subscribers === 1;
		}).map(({ rid }) => rid);

		Rooms.find1On1ByUserId(user._id, { fields: { _id: 1 } }).forEach(({ _id }) => roomIds.push(_id));

		bulkRoomCleanUp(roomIds);

		Rooms.updateGroupDMsRemovingUsernamesByUsername(user.username); // Remove direct rooms with the user
		Rooms.removeDirectRoomContainingUsername(user.username); // Remove direct rooms with the user

		Subscriptions.removeByUserId(userId); // Remove user subscriptions

		// removes user's avatar
		if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url') {
			FileUpload.getStore('Avatars').deleteByName(user.username);
		}

		Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.
		Notifications.notifyLogged('Users:Deleted', { userId });
	}

	// Remove user from users database
	Users.removeById(userId);

	// update name and fname of group direct messages
	updateGroupDMsName(user);

	// Refresh the servers list
	FederationServers.refreshServers();
};
