import { Meteor } from 'meteor/meteor';
import { RocketChat } from 'meteor/rocketchat:lib';

Meteor.startup(function() {
	RocketChat.settings.add('AutoTranslate_Enabled', false, {
		type: 'boolean',
		group: 'Message',
		section: 'AutoTranslate',
		public: true,
	});
	RocketChat.settings.add('AutoTranslate_ServiceProvider', 'google-translate', {
		type: 'select',
		group: 'Message',
		section: 'AutoTranslate',
		values: [{
			key: 'google-translate',
			i18nLabel: 'AutoTranslate_Google',
		}, {
			key: 'deepl-translate',
			i18nLabel: 'AutoTranslate_DeepL',
		}, {
			key: 'dbs-translate',
			i18nLabel: 'AutoTranslate_DBS',
		}],
		enableQuery: [{ _id: 'AutoTranslate_Enabled', value: true }],
		i18nLabel: 'AutoTranslate_ServiceProvider',
		public: true,
	});
	RocketChat.settings.add('AutoTranslate_ServiceProviderURL', '', {
		type: 'string',
		group: 'Message',
		section: 'AutoTranslate',
		public: true,
		enableQuery: [{ _id: 'AutoTranslate_Enabled', value: true }],
		i18nLabel: 'AutoTranslate_ServiceProviderURL',
	});

	if (RocketChat.models.Settings.findById('AutoTranslate_GoogleAPIKey').count()) {
		RocketChat.models.Settings.renameSetting('AutoTranslate_GoogleAPIKey', 'AutoTranslate_APIKey');
	} else {
		RocketChat.settings.add('AutoTranslate_APIKey', '', {
			type: 'string',
			group: 'Message',
			section: 'AutoTranslate',
			public: true,
			enableQuery: [
				{
					_id: 'AutoTranslate_Enabled', value: true,
				}],
		});
	}
});
