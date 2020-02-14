import { Migrations } from '../../../app/migrations';
import { Users, Settings } from '../../../app/models';
import { settings } from '../../../app/settings';

Migrations.add({
	version: 137,
	up() {
		const firstUser = Users.getOldest({ emails: 1 });
		const reportStats = settings.get('Statistics_reporting');

		Settings.updateValueById('Organization_Email', firstUser && firstUser.emails && firstUser.emails[0].address);
		Settings.updateValueById('Register_Server', reportStats);
	},
});
