import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

const roleName = 'app';

addMigration({
	version: 230,
	up() {
		Permissions.update({ _id: 'start-discussion' }, { $addToSet: { roles: roleName } });
		Permissions.update({ _id: 'start-discussion-other-user' }, { $addToSet: { roles: roleName } });
	},
});
