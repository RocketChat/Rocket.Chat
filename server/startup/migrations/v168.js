import { Migrations } from '../../migrations';
import { Permissions } from '../../../app/models/server';

Migrations.add({
	version: 168,
	up() {
		const perm = Permissions.findOne({ _id: 'reset-other-user-e2e-key' });

		if (perm) {
			Permissions.remove({ _id: 'reset-other-user-e2e-key' });
		}
	},
	down() {
		Permissions.upsert({ _id: 'reset-other-user-e2e-key' }, { _id: 'reset-other-user-e2e-key', roles: ['admin'] });
	},
});
