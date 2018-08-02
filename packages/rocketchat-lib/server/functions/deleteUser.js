RocketChat.deleteUser = function(userId) {
	const user = RocketChat.models.Users.findOneById(userId, {
		fields: { username: 1, avatarOrigin: 1 }
	});

	// Users without username can't do anything, so there is nothing to remove
	if (user.username != null) {
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

		RocketChat.models.Subscriptions.db.findByUserId(userId).forEach((subscription) => {
			const room = RocketChat.models.Rooms.findOneById(subscription.rid);
			if (room) {
				if (room.t !== 'c' && RocketChat.models.Subscriptions.findByRoomId(room._id).count() === 1) {
					RocketChat.models.Messages.removeFilesByRoomId(subscription.rid);
					RocketChat.models.Rooms.removeById(subscription.rid); // Remove non-channel rooms with only 1 user (the one being deleted)
				}
				if (room.t === 'd') {
					RocketChat.models.Subscriptions.removeByRoomId(subscription.rid);
					RocketChat.models.Messages.removeFilesByRoomId(subscription.rid);
					RocketChat.models.Messages.removeByRoomId(subscription.rid);
				}
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
