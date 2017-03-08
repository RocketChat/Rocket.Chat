Meteor.startup(function() {
	RocketChat.settings.add('GoogleNaturalLanguage_Enabled', false, {
		type: 'boolean',
		group: 'Message',
		section: 'GoogleNaturalLanguage',
		public: true
	});
	RocketChat.settings.add('GoogleNaturalLanguage_ServiceAccount', '', {
		type: 'string',
		group: 'Message',
		section: 'GoogleNaturalLanguage',
		multiline: true,
		enableQuery: {
			_id: 'GoogleNaturalLanguage_Enabled',
			value: true
		}
	});
});
