import { settingsRegistry } from '../../settings/server';

settingsRegistry.add('IssueLinks_Enabled', false, {
	type: 'boolean',
	i18nLabel: 'Enabled',
	i18nDescription: 'IssueLinks_Incompatible',
	group: 'Message',
	section: 'Issue_Links',
	public: true,
});

settingsRegistry.add('IssueLinks_Template', '', {
	type: 'string',
	i18nLabel: 'IssueLinks_LinkTemplate',
	i18nDescription: 'IssueLinks_LinkTemplate_Description',
	group: 'Message',
	section: 'Issue_Links',
	public: true,
});
