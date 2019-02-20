import { Migrations } from 'meteor/rocketchat:migrations';
import { Settings } from 'meteor/rocketchat:models';

Migrations.add({
	version: 23,
	up() {
		Settings.remove({
			_id: 'Accounts_denyUnverifiedEmails',
		});

		return console.log('Deleting not used setting Accounts_denyUnverifiedEmails');
	},
});
