import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models';

addMigration({
	version: 228,
	up() {
		if (Permissions) {
			Permissions.update({ _id: 'manage-livechat-canned-responses' }, { $addToSet: { roles: 'livechat-monitor' } });
		}
	},
});
