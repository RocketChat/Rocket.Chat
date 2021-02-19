import { Migrations } from '../../../app/migrations';
import { Permissions } from '../../../app/models';

Migrations.add({
	version: 217,
	up() {
		const alreadyExists = Permissions.findOne('view-livechat-queue');
		if (alreadyExists) {
			Permissions.update({ _id: 'view-livechat-queue' }, { $addToSet: { roles: 'livechat-agent' } });
		}
	},
});
