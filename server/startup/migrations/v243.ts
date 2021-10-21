import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

addMigration({
	version: 243,
	up() {
		Permissions.create('view-omnichannel-contact-center', ['livechat-manager', 'livechat-agent', 'livechat-monitor', 'admin']);
	},
});
