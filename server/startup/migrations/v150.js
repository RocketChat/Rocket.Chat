import { Settings } from '../../../app/models';
import { Migrations } from '../../../app/migrations/server';

Migrations.add({
	version: 150,
	up() {
		if (Settings.findById('AutoTranslate_GoogleAPIKey').count()) {
			Settings.renameSetting('AutoTranslate_GoogleAPIKey', 'AutoTranslate_APIKey');
		}
	},
	down() {
		// No downgrade migrations applicable
	},
});
