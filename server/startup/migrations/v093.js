import { Migrations } from '../../../app/migrations';
import { Settings, Permissions } from '../../../app/models';

Migrations.add({
	version: 93,
	up() {

		if (Settings) {
			const setting = Settings.findOne({ _id: 'Accounts_AllowAnonymousAccess' });
			if (setting && setting.value === true) {
				Settings.update({ _id: 'Accounts_AllowAnonymousRead' }, { $set: { value: setting.value } });
			}
		}

		const query = {
			_id: {
				$in: [
					'view-c-room',
					'view-history',
					'view-joined-room',
					'view-p-room',
					'preview-c-room',
				],
			},
		};

		const update = {
			$addToSet: {
				roles: 'anonymous',
			},
		};

		Permissions.update(query, update, { multi: true });
	},
});
