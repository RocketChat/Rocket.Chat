Meteor.startup(function() {
	RocketChat.settings.add('MapView_Enabled', false, {type: 'boolean', group: 'Message', section: 'Google Maps', public: true, i18nLabel: 'MapView_Enabled', i18nDescription: 'MapView_Enabled_Description'});
	return RocketChat.settings.add('MapView_GMapsAPIKey', '', {type: 'string', group: 'Message', section: 'Google Maps', public: true, i18nLabel: 'MapView_GMapsAPIKey', i18nDescription: 'MapView_GMapsAPIKey_Description'});
});
