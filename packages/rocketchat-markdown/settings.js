Meteor.startup(() => {
	RocketChat.settings.add('Markdown_Headers', false, {
		type: 'boolean',
		group: 'Message',
		section: 'Markdown',
		public: true
	});
	RocketChat.settings.add('Markdown_Colors', 'no', {
		type: 'select',
		values: [
			{
				key: 'no',
				i18nLabel: 'Markdown_No_Colors'
			}, {
				key: 'irc',
				i18nLabel: 'Markdown_IRC_Colors'
			}, {
				key: 'full',
				i18nLabel: 'Markdown_Full_Colors'
			}
		],
		group: 'Message',
		section: 'Markdown',
		public: true,
		i18nDescription: 'Markdown_ColorSupport_Description'
	});
	return RocketChat.settings.add('Markdown_SupportSchemesForLink', 'http,https', {
		type: 'string',
		group: 'Message',
		section: 'Markdown',
		public: true,
		i18nDescription: 'Markdown_SupportSchemesForLink_Description'
	});

});
