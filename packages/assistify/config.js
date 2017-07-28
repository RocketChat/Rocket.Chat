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

	RocketChat.settings.add('DBS_AI_Enabled', false, {
		type: 'boolean',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Enabled'
	});

	RocketChat.settings.add('DBS_AI_Source', '', {
		type: 'select',
		group: 'Assistify',
		section: 'Knowledge_Base',
		values: [
			{ key: '0', i18nLabel: 'DBS_AI_Source_APIAI'},
			{ key: '1', i18nLabel: 'DBS_AI_Source_Redlink'},
			{ key: '2', i18nLabel: 'DBS_AI_Source_Smarti'}
		],
		public: true,
		i18nLabel: 'DBS_AI_Source'
	});

	RocketChat.settings.add('DBS_AI_Redlink_URL', '', {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_URL'
	});

	/* Currently, Redlink does not offer hashed API_keys, but uses simple password-auth
	 * This is of course far from perfect and is hopeully going to change sometime later */
	RocketChat.settings.add('DBS_AI_Redlink_Auth_Token', '', {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_Auth_Token'
	});

	RocketChat.settings.add('DBS_AI_Redlink_Hook_Token', '', {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_Hook_Token'
	});

	let domain = RocketChat.settings.get('Site_Url');
	if (domain) {
		domain = domain
			.replace('https://', '')
			.replace('http://', '');
		while (domain.charAt(domain.length - 1) === '/') {
			domain = domain.substr(0, domain.length - 1);
		}
	}
	RocketChat.settings.add('DBS_AI_Redlink_Domain', domain, {
		type: 'string',
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_Domain'
	});

	RocketChat.settings.add('Assistify_AI_Widget_Posting_Type', '', {
		type: 'select',
		group: 'Assistify',
		section: 'Knowledge_Base',
		values: [
			{ key: 'suggestText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_SuggestText'},
			{ key: 'postText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostText'},
			{ key: 'postRichText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostRichText'}
		],
		public: true,
		i18nLabel: 'Assistify_AI_Widget_Posting_Type'
	});

	RocketChat.settings.add('Assistify_AI_DBSearch_Suffix', '', {
		type: 'code',
		multiline: true,
		group: 'Assistify',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Assistify_AI_DBSearch_Suffix'
	});
});
