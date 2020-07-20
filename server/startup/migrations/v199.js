import { Settings } from '../../../app/models/server';
import { Migrations } from '../../../app/migrations/server';

Migrations.add({
	version: 199,
	up: () => {
		Settings.upsert({
			_id: 'Accounts_AvatarBlockUnauthenticatedAccess',
		}, {
			$set: {
				public: true,
			},
		});
	},
});
