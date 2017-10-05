Meteor.startup(function() {
	RocketChat.settings.add('AutoTranslate_Enabled', false, { type: 'boolean', group: 'Message', section: 'AutoTranslate', public: true });
	RocketChat.settings.add('AutoTranslate_GoogleAPIKey', '', { type: 'string', group: 'Message', section: 'AutoTranslate', enableQuery: { _id: 'AutoTranslate_Enabled', value: true } });
});
