RocketChat.settings.add('IssueLinks_Enabled', false, {
	type: 'boolean',
	i18nLabel: 'Enabled',
	i18nDescription: 'IssueLinks_Incompatible',
	group: 'Message',
	section: 'Issue_Links',
	public: true
});

RocketChat.settings.add('IssueLinks_Template', '', {
	type: 'string',
	i18nLabel: 'IssueLinks_LinkTemplate',
	i18nDescription: 'IssueLinks_LinkTemplate_Description',
	group: 'Message',
	section: 'Issue_Links',
	public: true
});

RocketChat.settings.add('IssueLinks_Format', '[0-9]+', {
	type: 'string',
	i18nLabel: 'IssueLinks_Format',
	i18nDescription: 'IssueLinks_Format_Description',
	group: 'Message',
	section: 'Issue_Links',
	public: true
});
