import { Migrations } from '/app/migrations';
import { Users, Roles } from '/app/models';

Migrations.add({
	version: 27,
	up() {

		Users.update({}, {
			$rename: {
				roles: '_roles',
			},
		}, {
			multi: true,
		});

		Users.find({
			_roles: {
				$exists: 1,
			},
		}).forEach((user) => {
			for (const scope of Object.keys(user._roles)) {
				const roles = user._roles[scope];
				Roles.addUserRoles(user._id, roles, scope);
			}
		});

		return Users.update({}, {
			$unset: {
				_roles: 1,
			},
		}, {
			multi: true,
		});
	},
});
