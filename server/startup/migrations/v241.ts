import { addMigration } from '../../lib/migrations';
import { Permissions } from '../../../app/models/server';

addMigration({
	version: 241,
	up() {
		(Permissions as any).create("view-omnichannel-contact-center",['livechat-manager', 'livechat-agent', 'livechat-monitor', 'admin']);
	},
});
