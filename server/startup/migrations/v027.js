RocketChat.Migrations.add({
	version: 27,
	up() {

		RocketChat.models.Users.update({}, {
			$rename: {
				roles: '_roles'
			}
		}, {
			multi: true
		});

		RocketChat.models.Users.find({
			_roles: {
				$exists: 1
			}
		}).forEach((user) => {
			for (const scope of Object.keys(user._roles)) {
				const roles = user._roles[scope];
				RocketChat.models.Roles.addUserRoles(user._id, roles, scope);
			}
		});

		return RocketChat.models.Users.update({}, {
			$unset: {
				_roles: 1
			}
		}, {
			multi: true
		});
	}
});
