Meteor.startup ->
	RocketChat.settings.add 'MapView_Enabled', true, {type: 'boolean', group: 'Message', section: 'Google Maps', public: true}
	RocketChat.settings.add 'MapView_GMapsAPIKey', '', {type: 'string', group: 'Message', section: 'Google Maps', public: true}