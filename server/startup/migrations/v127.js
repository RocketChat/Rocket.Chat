RocketChat.Migrations.add({
	version: 127,
	up() {
		if (RocketChat.models && RocketChat.models.Permissions) {

			const newPermission = RocketChat.models.Permissions.findOne('view-livechat-manager');
			if (newPermission && newPermission.roles.length) {
				RocketChat.models.Permissions.upsert({ _id: 'remove-closed-livechat-rooms' }, { $set: { roles: newPermission.roles } });
			}
		}
	},

	down() {
		if (RocketChat.models && RocketChat.models.Permissions) {

			// Revert permission
			RocketChat.models.Permissions.remove({ _id: 'remove-closed-livechat-rooms' });
		}
	},
});
