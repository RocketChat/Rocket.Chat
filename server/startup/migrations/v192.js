import { Migrations } from '../../../app/migrations/server';
import { Permissions, Settings } from '../../../app/models/server';

Migrations.add({
	version: 192,
	up() {
		Settings.remove({ _id: 'Livechat_enable_office_hours' });
		Settings.remove({ _id: 'Livechat_allow_online_agents_outside_office_hours' });
		const permission = Permissions.findOneById('view-livechat-officeHours');
		Permissions.upsert({ _id: 'view-livechat-business-hours' }, { $set: { roles: permission.roles } });
		Permissions.remove({ _id: 'view-livechat-officeHours' });
	},
});
