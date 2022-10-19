import { Meteor } from 'meteor/meteor';

import { settingsRegistry } from '../../settings/server';

Meteor.startup(function () {
	settingsRegistry.add('MapView_Enabled', false, {
		type: 'boolean',
		group: 'Message',
		section: 'Google Maps',
		public: true,
		i18nLabel: 'MapView_Enabled',
		i18nDescription: 'MapView_Enabled_Description',
	});
	settingsRegistry.add('MapView_GMapsAPIKey', '', {
		type: 'string',
		group: 'Message',
		section: 'Google Maps',
		public: true,
		i18nLabel: 'MapView_GMapsAPIKey',
		i18nDescription: 'MapView_GMapsAPIKey_Description',
		secret: true,
	});
});
