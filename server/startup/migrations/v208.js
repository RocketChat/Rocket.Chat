import { Migrations } from '../../../app/migrations';
import { Users, Sessions } from '../../../app/models/server';

Migrations.add({
	version: 208,
	up() {
		const users = Users.find({}, {
			fields: {
				roles: 1,
			},
		});
		users.forEach(({ _id, roles }) => {
			Sessions.update({
				userId: _id,
			}, {
				$set: {
					roles,
				},
			}, {
				multi: true,
			});
		});
	},
});
