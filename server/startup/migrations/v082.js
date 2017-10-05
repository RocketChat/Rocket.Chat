RocketChat.Migrations.add({
	version: 82,
	up() {
		const admins = RocketChat.authz.getUsersInRole('admin').fetch();
		if (admins.length === 1 && admins[0]._id === 'rocket.cat') {
			RocketChat.authz.removeUserFromRoles('rocket.cat', 'admin');
		}
	}
});
