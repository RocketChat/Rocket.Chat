RocketChat.Migrations.add({
	version: 37,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Permissions) {

			// Find permission add-user (changed it to create-user)
			var addUserPermission = RocketChat.models.Permissions.findOne('add-user');

			if (addUserPermission) {
				RocketChat.models.Permissions.upsert({ _id: 'create-user' }, { $set: { roles: addUserPermission.roles } });
				RocketChat.models.Permissions.remove({ _id: 'add-user' });
			}
		}
	}
});
