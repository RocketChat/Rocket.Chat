import { Meteor } from 'meteor/meteor';
import { settings } from 'meteor/rocketchat:settings';

Meteor.startup(function() {
	settings.add('GoogleNaturalLanguage_Enabled', false, {
		type: 'boolean',
		group: 'Message',
		section: 'Google Natural Language',
		public: true,
		i18nLabel: 'Enabled',
	});
	settings.add('GoogleNaturalLanguage_ServiceAccount', '', {
		type: 'string',
		group: 'Message',
		section: 'Google Natural Language',
		multiline: true,
		enableQuery: {
			_id: 'GoogleNaturalLanguage_Enabled',
			value: true,
		},
		i18nLabel: 'Service_account_key',
	});
});
