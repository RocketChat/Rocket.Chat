import { Migrations } from '../../migrations';
import { Permissions } from '../../../app/models/server';

Migrations.add({
	version: 162,
	up() {
		const bulkCreateC = Permissions.findOne({ _id: 'bulk-create-c' });

		if (bulkCreateC) {
			Permissions.remove({ _id: 'bulk-create-c' });
		}
	},
	down() {
		Permissions.upsert({ _id: 'bulk-create-c' }, { _id: 'bulk-create-c', roles: [] });
	},
});
