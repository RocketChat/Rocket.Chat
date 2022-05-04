import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 205,
	up() {
		// Disable this new enforcement setting for existent installations.
		Settings.update(
			{
				_id: 'Accounts_TwoFactorAuthentication_Enforce_Password_Fallback',
			},
			{
				$set: {
					value: false,
				},
			},
			{
				upsert: true,
			},
		);
	},
});
