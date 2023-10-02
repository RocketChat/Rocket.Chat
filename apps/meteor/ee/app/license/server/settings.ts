import { License } from '@rocket.chat/license';
import { Settings } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { settings, settingsRegistry } from '../../../../app/settings/server';

Meteor.startup(async () => {
	await settingsRegistry.addGroup('Enterprise', async function () {
		await this.section('License', async function () {
			await this.add('Enterprise_License', '', {
				type: 'string',
				i18nLabel: 'Enterprise_License',
			});
			await this.add('Enterprise_License_Status', '', {
				readonly: true,
				type: 'string',
				i18nLabel: 'Status',
			});
		});
	});
});

settings.watch<string>('Enterprise_License', async (license) => {
	if (!license || String(license).trim() === '') {
		return;
	}

	if (license === process.env.ROCKETCHAT_LICENSE) {
		return;
	}

	try {
		if (!(await License.setLicense(license))) {
			await Settings.updateValueById('Enterprise_License_Status', 'Invalid');
			return;
		}
	} catch (_error) {
		// do nothing
	}

	await Settings.updateValueById('Enterprise_License_Status', 'Valid');
});

if (process.env.ROCKETCHAT_LICENSE) {
	try {
		await License.setLicense(process.env.ROCKETCHAT_LICENSE);
	} catch (_error) {
		// do nothing
	}

	Meteor.startup(async () => {
		if (settings.get('Enterprise_License')) {
			console.warn(
				'Rocket.Chat Enterprise: The license from your environment variable was ignored, please use only the admin setting from now on.',
			);
			return;
		}
		await Settings.updateValueById('Enterprise_License', process.env.ROCKETCHAT_LICENSE);
	});
}
