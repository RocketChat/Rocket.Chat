RocketChat.Migrations.add({
	version: 84,
	up: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Permissions) {

			// Update permission name, copy values from old name
			var oldPermission = RocketChat.models.Permissions.findOne('add-user-to-room');
			if (oldPermission && oldPermission.roles.length) {
				RocketChat.models.Permissions.upsert({ _id: 'add-user-to-own-room' }, { $set: { roles: oldPermission.roles } });
				RocketChat.models.Permissions.remove({ _id: 'add-user-to-room' });
			}

		}
	},
	down: function() {
		if (RocketChat && RocketChat.models && RocketChat.models.Permissions) {

			// Revert permission name, copy values from updated name
			var newPermission = RocketChat.models.Permissions.findOne('add-user-to-own-room');
			if (newPermission && newPermission.roles.length) {
				RocketChat.models.Permissions.upsert({ _id: 'add-user-to-room' }, { $set: { roles: newPermission.roles } });
				RocketChat.models.Permissions.remove({ _id: 'add-user-to-own-room' });
			}

		}
	}
});
