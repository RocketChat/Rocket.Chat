RocketChat.Migrations.add({
	version: 84,
	up() {
		if (RocketChat.models && RocketChat.models.Permissions) {

			// Update permission name, copy values from old name
			const oldPermission = RocketChat.models.Permissions.findOne('add-user-to-room');
			if (oldPermission && oldPermission.roles.length) {
				RocketChat.models.Permissions.upsert({ _id: 'add-user-to-joined-room' }, { $set: { roles: oldPermission.roles } });
				RocketChat.models.Permissions.remove({ _id: 'add-user-to-room' });
			}
		}
	},

	down() {
		if (RocketChat.models && RocketChat.models.Permissions) {

			// Revert permission name, copy values from updated name
			const newPermission = RocketChat.models.Permissions.findOne('add-user-to-joined-room');
			if (newPermission && newPermission.roles.length) {
				RocketChat.models.Permissions.upsert({ _id: 'add-user-to-room' }, { $set: { roles: newPermission.roles } });
				RocketChat.models.Permissions.remove({ _id: 'add-user-to-joined-room' });
			}
		}
	}
});
