import { Settings } from '../../../app/models/server/raw';
import { addMigration } from '../../lib/migrations';

addMigration({
	version: 177,
	up() {
		// Disable auto opt in for existent installations
		Settings.update(
			{
				_id: 'Accounts_TwoFactorAuthentication_By_Email_Auto_Opt_In',
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
