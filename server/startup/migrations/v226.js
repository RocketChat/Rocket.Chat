import { Migrations } from '../../../app/migrations/server';
import { Settings } from '../../../app/models/server';

Migrations.add({
	version: 226,
	up() {
		const siteUrl = Settings.findOneById('Site_Url');
		const siteName = Settings.findOneById('Site_Name');

		Settings.removeById('Site_Url');
		Settings.upsert({
			_id: 'Workspace_Url',
		}, {
			$set: {
				value: siteUrl.value,
			},
		});

		Settings.removeById('Site_Name');
		Settings.upsert({
			_id: 'Workspace_Name',
		}, {
			$set: {
				value: siteName.value,
			},
		});
	},
});
