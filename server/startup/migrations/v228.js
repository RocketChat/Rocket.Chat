import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 228,
	up() {
		if (Permissions) {
			Permissions.update({ _id: 'manage-livechat-canned-responses' }, { $addToSet: { roles: 'livechat-monitor' } });
		}
	},
});
