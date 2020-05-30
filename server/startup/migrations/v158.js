import { Migrations } from '../../migrations';
import { Settings } from '../../../app/models/server';
import { settings } from '../../../app/settings/server';

Migrations.add({
	version: 158,
	up() {
		if (!settings.get('CAS_enabled')) {
			return;
		}

		Settings.upsert({
			_id: 'CAS_trust_username',
		},
		{
			_id: 'CAS_trust_username',
			value: true,
			type: 'boolean',
			group: 'CAS',
			i18nDescription: 'CAS_trust_username_description',
		});
	},
	down() {
		// Down migration does not apply in this case
	},
});
