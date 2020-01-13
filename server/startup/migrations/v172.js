import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 172,
	up() {
		// Disable auto opt in for existant installations
		Settings.upsert({
			_id: 'Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In',
		}, {
			$set: {
				value: false,
			},
		});
	},
});
