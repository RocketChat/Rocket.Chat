import { Migrations } from '../../../app/migrations';
import { LivechatAgentActivity } from '../../../app/models/server';

Migrations.add({
	version: 207,
	up() {
		// Disable this new enforcement setting for existent installations.
		LivechatAgentActivity.upsert({
			_id: 'Accounts_TwoFactorAuthentication_Enforce_Password_Fallback',
		}, {
			$set: {
				value: false,
			},
		});
	},
});
