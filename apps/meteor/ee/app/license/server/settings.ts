import { settingsRegistry } from '../../../../app/settings/server';

// The proper name for this group is Premium, but we can't change it because it's already in use and we will break the settings
// TODO: Keep this until next major updates
await settingsRegistry.addGroup('Enterprise', async function () {
	await this.section('Enterprise', async function () {
		await this.add('Enterprise_License', '', {
			type: 'string',
			i18nLabel: 'Premium_License',
			alert: 'Premium_License_alert',
		});
		await this.add('Enterprise_License_Data', '', {
			type: 'string',
			hidden: true,
			public: false,
		});
		await this.add('Enterprise_License_Status', '', {
			readonly: true,
			type: 'string',
			i18nLabel: 'Status',
		});
	});
});
