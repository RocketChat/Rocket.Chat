RocketChat.Migrations.add({
	version: 107,
	up() {
		const roles = RocketChat.models.Roles.find({
			_id: { $ne: 'guest' },
			scope: 'Users'
		}).fetch().map((role)=>{ return role._id; });
		RocketChat.models.Permissions.createOrUpdate('leave-c', roles);
	}
});
