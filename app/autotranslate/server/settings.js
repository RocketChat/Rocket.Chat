import { Meteor } from 'meteor/meteor';
import { settings } from '../../settings';

Meteor.startup(function() {
	settings.add('AutoTranslate_Enabled', false, {
		type: 'boolean',
		group: 'Message',
		section: 'AutoTranslate',
		public: true,
	});
	settings.add('AutoTranslate_ServiceProvider', 'google-translate', {
		type: 'select',
		group: 'Message',
		section: 'AutoTranslate',
		values: [{
			key: 'google-translate',
			i18nLabel: 'AutoTranslate_Google',
		}, {
			key: 'deepl-translate',
			i18nLabel: 'AutoTranslate_DeepL',
		}],
		enableQuery: [{ _id: 'AutoTranslate_Enabled', value: true }],
		i18nLabel: 'AutoTranslate_ServiceProvider',
		public: true,
	});
	settings.add('AutoTranslate_ServiceProviderURL', '', {
		type: 'string',
		group: 'Message',
		section: 'AutoTranslate',
		public: true,
		enableQuery: [{ _id: 'AutoTranslate_Enabled', value: true }],
		i18nLabel: 'AutoTranslate_ServiceProviderURL',
	});

	settings.add('AutoTranslate_APIKey', '', {
		type: 'string',
		group: 'Message',
		section: 'AutoTranslate',
		public: true,
		enableQuery: [
			{
				_id: 'AutoTranslate_Enabled', value: true,
			}],
	});
});
