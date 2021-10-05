import { addMigration } from '../../lib/migrations';
import { Settings } from '../../../app/models/server';

addMigration({
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
