import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

const roleName = 'admin';

addMigration({
	version: 214,
	up() {
		Permissions.update({ _id: 'toggle-room-e2e-encryption' }, { $addToSet: { roles: roleName } });
	},
});
