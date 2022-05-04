import { Permissions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

const roleId = 'admin';

addMigration({
	version: 214,
	up() {
		return Permissions.update({ _id: 'toggle-room-e2e-encryption' }, { $addToSet: { roles: roleId } });
	},
});
