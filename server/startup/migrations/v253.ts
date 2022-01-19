import { Permissions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 253,
	up() {
		return Permissions.update({ _id: 'toggle-room-e2e-encryption' }, { $addToSet: { roles: 'admin' } });
	},
});
