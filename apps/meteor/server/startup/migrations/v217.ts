import { Permissions } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 217,
	async up() {
		const oldPermission = await Permissions.findOne('view-livechat-queue');
		if (oldPermission) {
			return Permissions.update({ _id: 'view-livechat-queue' }, { $addToSet: { roles: 'livechat-agent' } });
		}
	},
});
