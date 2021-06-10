import { Migrations } from '../migrations';
import { Settings } from '../../models';

Migrations.add({
	version: 205,
	up() {
		// Disable this new enforcement setting for existent installations.
		Settings.upsert({
			_id: 'Accounts_TwoFactorAuthentication_Enforce_Password_Fallback',
		}, {
			$set: {
				value: false,
			},
		});
	},
});
