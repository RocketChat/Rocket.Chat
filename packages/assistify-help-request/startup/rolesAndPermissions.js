Meteor.startup(()=> {
	const permissions = [
		{_id: 'create-r', roles: ['admin', 'user', 'bot', 'guest', 'expert']},
		{_id: 'create-e', roles: ['admin', 'expert', 'bot']},
		{_id: 'view-r-rooms', roles: ['admin', 'user', 'bot', 'expert']}, //guests shall not view other requests
		{_id: 'view-e-rooms', roles: ['admin', 'user', 'bot', 'expert']},
	];

	for (const permission of permissions) {
		if (!RocketChat.models.Permissions.findOneById(permission._id)) {
			RocketChat.models.Permissions.upsert(permission._id, {$set: permission});
		}
	}

	const defaultRoles = [
		{ name: 'expert',    scope: 'Subscription',         description: 'Expert' } //scope obviously has something to do with what access is enabled with this role. No clear idea what though
	];

	for (const role of defaultRoles) {
		RocketChat.models.Roles.upsert({ _id: role.name }, { $setOnInsert: { scope: role.scope, description: role.description || '', protected: true } });
	}

});
