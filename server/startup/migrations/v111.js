// Migration to give delete channel, delete group permissions to owner
RocketChat.Migrations.add({
	version: 111,
	up() {
		if (RocketChat.models && RocketChat.models.Permissions) {
			RocketChat.models.Permissions.update({ _id: 'delete-c' }, { $addToSet: { roles: 'owner' } });
			RocketChat.models.Permissions.update({ _id: 'delete-p' }, { $addToSet: { roles: 'owner' } });
		}
	},
});
