import { settingsRegistry } from '../../settings/server';

settingsRegistry.add('Markdown_Parser', 'original', {
	type: 'select',
	values: [
		{
			key: 'disabled',
			i18nLabel: 'Disabled',
		},
		{
			key: 'original',
			i18nLabel: 'Original',
		},
		{
			key: 'marked',
			i18nLabel: 'Marked',
		},
	],
	group: 'Message',
	section: 'Markdown',
	public: true,
	alert: 'This_is_a_deprecated_feature_alert',
});

const enableQueryOriginal = { _id: 'Markdown_Parser', value: 'original' };
settingsRegistry.add('Markdown_Headers', false, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	enableQuery: enableQueryOriginal,
	alert: 'This_is_a_deprecated_feature_alert',
});
settingsRegistry.add('Markdown_SupportSchemesForLink', 'http,https', {
	type: 'string',
	group: 'Message',
	section: 'Markdown',
	public: true,
	i18nDescription: 'Markdown_SupportSchemesForLink_Description',
	enableQuery: enableQueryOriginal,
	alert: 'This_is_a_deprecated_feature_alert',
});

const enableQueryMarked = { _id: 'Markdown_Parser', value: 'marked' };
settingsRegistry.add('Markdown_Marked_GFM', true, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	enableQuery: enableQueryMarked,
	alert: 'This_is_a_deprecated_feature_alert',
});
settingsRegistry.add('Markdown_Marked_Tables', true, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	enableQuery: enableQueryMarked,
	alert: 'This_is_a_deprecated_feature_alert',
});
settingsRegistry.add('Markdown_Marked_Breaks', true, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	enableQuery: enableQueryMarked,
	alert: 'This_is_a_deprecated_feature_alert',
});
settingsRegistry.add('Markdown_Marked_Pedantic', false, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	alert: 'This_is_a_deprecated_feature_alert',
	enableQuery: [
		{
			_id: 'Markdown_Parser',
			value: 'marked',
		},
		{
			_id: 'Markdown_Marked_GFM',
			value: false,
		},
	],
});
settingsRegistry.add('Markdown_Marked_SmartLists', true, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	enableQuery: enableQueryMarked,
	alert: 'This_is_a_deprecated_feature_alert',
});
settingsRegistry.add('Markdown_Marked_Smartypants', true, {
	type: 'boolean',
	group: 'Message',
	section: 'Markdown',
	public: true,
	enableQuery: enableQueryMarked,
	alert: 'This_is_a_deprecated_feature_alert',
});
