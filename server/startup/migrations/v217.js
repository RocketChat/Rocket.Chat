import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models';

addMigration({
	version: 217,
	up() {
		const oldPermission = Permissions.findOne('view-livechat-queue');
		if (oldPermission) {
			Permissions.update({ _id: 'view-livechat-queue' }, { $addToSet: { roles: 'livechat-agent' } });
		}
	},
});
