Meteor.startup ->
	RocketChat.settings.add 'Markdown_Headers', false, {type: 'boolean', group: 'Message', section: 'Markdown', public: true, i18nLabel: 'Markdown_Headers'}
	RocketChat.settings.add 'Markdown_Schemes', 'http,https', {type: 'string', group: 'Message', section: 'Markdown', public: true, i18nLabel: 'Markdown_SupportSchemesForLink', i18nDescription: 'Markdown_SupportSchemesForLink_Description',}
