RocketChat.Migrations.add({
	version: 36,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Permissions) {

			// Find permission add-user (changed it to create-user)
			const addUserPermission = RocketChat.models.Permissions.findOne('add-user');

			if (addUserPermission) {
				RocketChat.models.Permissions.upsert({ _id: 'create-user' }, { $set: { roles: addUserPermission.roles } });
				RocketChat.models.Permissions.remove({ _id: 'add-user' });
			}
		}
	}
});