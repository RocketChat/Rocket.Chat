const _createRolesAndPermissions = function() {
	const permissions = [
		{_id: 'create-r', roles: ['admin', 'user', 'bot', 'guest', 'expert']},
		{_id: 'create-e', roles: ['admin', 'expert', 'bot']},
		{_id: 'view-r-room', roles: ['admin', 'user', 'bot', 'expert']}, //guests shall not view other requests
		{_id: 'view-e-room', roles: ['admin', 'user', 'bot', 'expert']}
	];

	for (const permission of permissions) {
		if (!RocketChat.models.Permissions.findOneById(permission._id)) {
			RocketChat.models.Permissions.upsert(permission._id, {$set: permission});
		}
	}

	const defaultRoles = [
		{name: 'expert', scope: 'Subscription', description: 'Expert'} //scope obviously has something to do with what access is enabled with this role. No clear idea what though
	];

	for (const role of defaultRoles) {
		RocketChat.models.Roles.upsert({_id: role.name}, {
			$setOnInsert: {
				scope: role.scope,
				description: role.description || '',
				protected: true
			}
		});
	}
};

const _registerExpertsChannelCallback = function() {
	RocketChat.callbacks.add('afterJoinRoom', function(user, room) {
		const expertRoomName = RocketChat.settings.get('Assistify_Expert_Channel').toLowerCase();

		if (room.name === expertRoomName) {
			RocketChat.authz.addUserRoles(user._id, 'expert');
		}
	});

	RocketChat.callbacks.add('afterLeaveRoom', function(user, room) {
		const expertRoomName = RocketChat.settings.get('Assistify_Expert_Channel').toLowerCase();

		if (room.name === expertRoomName) {
			RocketChat.authz.removeUserFromRoles(user._id, 'expert');
		}
	});
};

Meteor.startup(() => {

	// Adding custom permissions leads to exceptions in streamer => Disabled for the time being
	// _createRolesAndPermissions();
    //
	// _registerExpertsChannelCallback();
});
