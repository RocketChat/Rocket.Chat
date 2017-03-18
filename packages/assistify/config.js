Meteor.startup(()=>{
	RocketChat.settings.addGroup('Assistify');

	RocketChat.settings.add('Assistify_Show_Standard_Features', false, {
		group: 'Assistify',
		i18nLabel: 'Assistify_Show_Standard_Features',
		type: 'boolean',
		public: true
	});

	// Copy Settings from dbs-ai in order to simplify maintenance.
	// Consequently hide the original group
	RocketChat.settings.removeById('dbsAI');

	RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
		type: 'boolean',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Enabled'
	});

	RocketChat.settings.add('Livechat_Knowledge_Source', '', {
		type: 'select',
		group: 'Assistify',
		section: 'Knowledge_Base',
		values: [
			{ key: '0', i18nLabel: 'Livechat_Knowledge_Source_APIAI'},
			{ key: '1', i18nLabel: 'Livechat_Knowledge_Source_Redlink'}
		],
		public: true,
		i18nLabel: 'Livechat_Knowledge_Source'
	});

	RocketChat.settings.add('Livechat_Knowledge_Redlink_URL', '', {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Livechat_Knowledge_Redlink_URL'
	});

	/* Currently, Redlink does not offer hashed API_keys, but uses simple password-auth
	 * This is of course far from perfect and is hopeully going to change sometime later */
	RocketChat.settings.add('Livechat_Knowledge_Redlink_Auth_Token', '', {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Livechat_Knowledge_Redlink_Auth_Token'
	});

	RocketChat.settings.add('Livechat_Knowledge_Redlink_Domain', 'demo.assistify.de', {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Livechat_Knowledge_Redlink_Domain'
	});

});
