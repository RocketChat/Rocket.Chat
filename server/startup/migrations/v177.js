import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 177,
	up() {
		// Disable auto opt in for existent installations
		Settings.upsert({
			_id: 'Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In',
		}, {
			$set: {
				value: false,
			},
		});
	},
});
