RocketChat.Migrations.add({
	version: 37,
	up: function() {
		if (RocketChat && RocketChat.settings && RocketChat.settings.get) {
			const allowPinning = RocketChat.settings.get('Message_AllowPinningByAnyone');

			// If public pinning was allowed, add pinning permissions to 'users', else leave it to 'owners' and 'moderators'
			if (allowPinning) {
				if (RocketChat.models && RocketChat.models.Permissions) {
					RocketChat.models.Permissions.update({ _id: 'pin-message' }, { $addToSet: { roles: 'user' } });
				}
			}
		}
	}
});