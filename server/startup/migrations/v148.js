import { Migrations } from '../../../app/migrations/server';
import { settings } from '../../../app/settings';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 148,
	up() {
		settings.get('Accounts_OAuth_Gitlab', function(key, value) {
			if (value) {
				const setting = Settings.findById('Accounts_OAuth_Gitlab_identity_path');
				const newValue = '/api/v3/user';

				if (setting) {
					Settings.updateValueById('Accounts_OAuth_Gitlab_identity_path', newValue);
				} else {
					Settings.createWithIdAndValue('Accounts_OAuth_Gitlab_identity_path', newValue);
				}
			}
		});
	},
	down() {
		// Down migration does not apply in this case
	},
});
