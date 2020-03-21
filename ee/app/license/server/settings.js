import { Meteor } from 'meteor/meteor';

import { settings } from '../../../../app/settings/server';
import { Settings } from '../../../../app/models/server';
import { addLicense } from './license';

Meteor.startup(function() {
	settings.addGroup('Enterprise', function() {
		this.section('License', function() {
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

settings.get('Enterprise_License', (key, license) => {
	if (!license || String(license).trim() === '') {
		return;
	}

	if (!addLicense(license)) {
		Settings.updateValueById('Enterprise_License_Status', 'Invalid');
		return;
	}

	Settings.updateValueById('Enterprise_License_Status', 'Valid');
});

if (process.env.ROCKETCHAT_LICENSE) {
	Meteor.startup(() => {
		Settings.updateValueById('Enterprise_License', process.env.ROCKETCHAT_LICENSE);
	});
}
