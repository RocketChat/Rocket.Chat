import { Meteor } from 'meteor/meteor';

import { settingsRegistry } from '../../../../app/settings/server';

Meteor.startup(async () => {
	await settingsRegistry.addGroup('Enterprise', async function () {
		await this.section('License', async function () {
			await this.add('Enterprise_License', '', {
				type: 'string',
				i18nLabel: 'Enterprise_License',
			});
			await this.add('Enterprise_License_Data', '', {
				type: 'string',
				hidden: true,
				blocked: true,
				public: false,
			});
			await this.add('Enterprise_License_Status', '', {
				readonly: true,
				type: 'string',
				i18nLabel: 'Status',
			});
		});
	});
});
