import { Migrations } from '../../../app/migrations';
import { Settings } from '../../../app/models';

Migrations.add({
	version: 74,
	up() {
		if (Settings) {
			Settings.remove({ _id: 'Assets_favicon_64' });
			Settings.remove({ _id: 'Assets_favicon_96' });
			Settings.remove({ _id: 'Assets_favicon_128' });
			Settings.remove({ _id: 'Assets_favicon_256' });
			Settings.update({ _id: 'Assets_favicon_192' }, {
				$set: {
					i18nLabel: 'android-chrome 192x192 (png)',
				},
			});
		}
	},
});
