import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(function() {
	settings.add('MapView_Enabled', false, { type: 'boolean', group: 'Message', section: 'Google Maps', public: true, i18nLabel: 'MapView_Enabled', i18nDescription: 'MapView_Enabled_Description' });
	return settings.add('MapView_GMapsAPIKey', '', { type: 'string', group: 'Message', section: 'Google Maps', public: true, i18nLabel: 'MapView_GMapsAPIKey', i18nDescription: 'MapView_GMapsAPIKey_Description', secret: true });
});
