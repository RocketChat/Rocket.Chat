import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 23,
	up() {
		Settings.remove({
			_id: 'Accounts_denyUnverifiedEmails',
		});

		return console.log('Deleting not used setting Accounts_denyUnverifiedEmails');
	},
});
