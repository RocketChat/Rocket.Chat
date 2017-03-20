Meteor.startup(function () {
	RocketChat.settings.addGroup('dbsAI');

	RocketChat.settings.add('Assistify_AI_Enabled', false, {
		type: 'boolean',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Enabled'
	});

	RocketChat.settings.add('Assistify_AI_Source', '', {
		type: 'select',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		values: [
			{ key: '0', i18nLabel: 'Assistify_AI_Source_APIAI'},
			{ key: '1', i18nLabel: 'Assistify_AI_Source_Redlink'}
		],
		public: true,
		i18nLabel: 'Assistify_AI_Source'
	});

	RocketChat.settings.add('Assistify_AI_Redlink_URL', '', {
		type: 'string',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Assistify_AI_Redlink_URL'
	});

	/* Currently, Redlink does not offer hashed API_keys, but uses simple password-auth
	 * This is of course far from perfect and is hopeully going to change sometime later */
	RocketChat.settings.add('Assistify_AI_Redlink_Auth_Token', '', {
		type: 'string',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Assistify_AI_Redlink_Auth_Token'
	});

	RocketChat.settings.add('Assistify_AI_Redlink_Domain', RocketChat.settings.get('Site_Url'), {
		type: 'string',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Assistify_AI_Redlink_Domain'
	});

	RocketChat.settings.add('Assistify_AI_DBSearch_Suffix','', {
		type: 'code',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Assistify_AI_DBSearch_Suffix'
	});
});

RocketChat.theme.addPackageAsset(() => {
	return Assets.getText('assets/stylesheets/redlink.less');
});
