import { Permissions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 224,
	up() {
		return Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: 'app' } });
	},
});
