import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

const roleName = 'user';

addMigration({
	version: 223,
	up() {
		Permissions.update({ _id: 'message-impersonate' }, { $addToSet: { roles: roleName } });
	},
});
