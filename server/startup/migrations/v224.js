import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

const roleName = 'app';

addMigration({
	version: 224,
	up() {
		Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: roleName } });
	},
});
