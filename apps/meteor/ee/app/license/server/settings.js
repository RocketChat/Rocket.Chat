import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings, settingsRegistry } from '../../../../app/settings/server';
import { addLicense } from './license';

Meteor.startup(function () {
	settingsRegistry.addGroup('Enterprise', function () {
		this.section('License', function () {
			this.add('Enterprise_License', '', {
				type: 'string',
				i18nLabel: 'Enterprise_License',
			});
			this.add('Enterprise_License_Status', '', {
				readonly: true,
				type: 'string',
				i18nLabel: 'Status',
			});
		});
	});
});

settings.watch('Enterprise_License', (license) => {
	if (!license || String(license).trim() === '') {
		return;
	}

	if (license === process.env.ROCKETCHAT_LICENSE) {
		return;
	}

	if (!addLicense(license)) {
		Settings.updateValueById('Enterprise_License_Status', 'Invalid');
		return;
	}

	Settings.updateValueById('Enterprise_License_Status', 'Valid');
});

if (process.env.ROCKETCHAT_LICENSE) {
	addLicense(process.env.ROCKETCHAT_LICENSE);

	Meteor.startup(() => {
		if (settings.get('Enterprise_License')) {
			console.warn(
				'Rocket.Chat Enterprise: The license from your environment variable was ignored, please use only the admin setting from now on.',
			);
			return;
		}
		Settings.updateValueById('Enterprise_License', process.env.ROCKETCHAT_LICENSE);
	});
}
