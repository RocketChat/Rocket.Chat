import { Migrations } from '../../../app/migrations';
import { Subscriptions } from '../../../app/models';

Migrations.add({
	version: 101,
	up() {
		Subscriptions.update({ lastActivity: { $exists: 1 } }, { $unset: { lastActivity: '' } }, { multi: true });
	},
});
