import { settingsRegistry } from '../../../app/settings/server';

settingsRegistry.add('GoogleNaturalLanguage_Enabled', false, {
	type: 'boolean',
	group: 'Message',
	section: 'Google Natural Language',
	public: true,
	i18nLabel: 'Enabled',
});
settingsRegistry.add('GoogleNaturalLanguage_ServiceAccount', '', {
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
