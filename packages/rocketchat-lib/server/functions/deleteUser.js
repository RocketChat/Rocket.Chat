import { Meteor } from 'meteor/meteor';
import { TAPi18n } from 'meteor/tap:i18n';
import { FileUpload } from 'meteor/rocketchat:file-upload';

RocketChat.deleteUser = function(userId) {
	const user = RocketChat.models.Users.findOneById(userId, {
		fields: { username: 1, avatarOrigin: 1 },
	});

	// Users without username can't do anything, so there is nothing to remove
	if (user.username != null) {
		const roomCache = [];

		// Iterate through all the rooms the user is subscribed to, to check if they are the last owner of any of them.
		RocketChat.models.Subscriptions.db.findByUserId(userId).forEach((subscription) => {
			const roomData = {
				rid: subscription.rid,
				t: subscription.t,
				subscribers: null,
			};

			// DMs can always be deleted, so let's ignore it on this check
			if (roomData.t !== 'd') {
				// If the user is an owner on this room
				if (RocketChat.authz.hasRole(user._id, 'owner', subscription.rid)) {
					// Fetch the number of owners
					const numOwners = RocketChat.authz.getUsersInRole('owner', subscription.rid).fetch().length;
					// If it's only one, then this user is the only owner.
					if (numOwners === 1) {
						// If the user is the last owner of a public channel, then we need to abort the deletion
						if (roomData.t === 'c') {
							throw new Meteor.Error('error-user-is-last-owner', `To delete this user you'll need to set a new owner to the following room: ${ subscription.name }.`, {
								method: 'deleteUser',
							});
						}

						// For private groups, let's check how many subscribers it has. If the user is the only subscriber, then it will be eliminated and doesn't need to abort the deletion
						roomData.subscribers = RocketChat.models.Subscriptions.findByRoomId(subscription.rid).count();

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

		const messageErasureType = RocketChat.settings.get('Message_ErasureType');
		switch (messageErasureType) {
			case 'Delete':
				const store = FileUpload.getStore('Uploads');
				RocketChat.models.Messages.findFilesByUserId(userId).forEach(function({ file }) {
					store.deleteById(file._id);
				});
				RocketChat.models.Messages.removeByUserId(userId);
				break;
			case 'Unlink':
				const rocketCat = RocketChat.models.Users.findOneById('rocket.cat');
				const nameAlias = TAPi18n.__('Removed_User');
				RocketChat.models.Messages.unlinkUserId(userId, rocketCat._id, rocketCat.username, nameAlias);
				break;
		}

		roomCache.forEach((roomData) => {
			if (roomData.subscribers === null && roomData.t !== 'd' && roomData.t !== 'c') {
				roomData.subscribers = RocketChat.models.Subscriptions.findByRoomId(roomData.rid).count();
			}

			// Remove DMs and non-channel rooms with only 1 user (the one being deleted)
			if (roomData.t === 'd' || (roomData.t !== 'c' && roomData.subscribers === 1)) {
				RocketChat.models.Subscriptions.removeByRoomId(roomData.rid);
				RocketChat.models.Messages.removeFilesByRoomId(roomData.rid);
				RocketChat.models.Messages.removeByRoomId(roomData.rid);
				RocketChat.models.Rooms.removeById(roomData.rid);
			}
		});

		RocketChat.models.Subscriptions.removeByUserId(userId); // Remove user subscriptions
		RocketChat.models.Rooms.removeDirectRoomContainingUsername(user.username); // Remove direct rooms with the user

		// removes user's avatar
		if (user.avatarOrigin === 'upload' || user.avatarOrigin === 'url') {
			FileUpload.getStore('Avatars').deleteByName(user.username);
		}

		RocketChat.models.Integrations.disableByUserId(userId); // Disables all the integrations which rely on the user being deleted.
		RocketChat.Notifications.notifyLogged('Users:Deleted', { userId });
	}

	RocketChat.models.Users.removeById(userId); // Remove user from users database
};
