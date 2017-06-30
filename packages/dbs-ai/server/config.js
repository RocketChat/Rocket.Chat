Meteor.startup(function() {
	RocketChat.settings.addGroup('dbsAI');

	RocketChat.settings.add('DBS_AI_Enabled', true, {
		type: 'boolean',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'Enabled'
	});

	RocketChat.settings.add('DBS_AI_Source', '1', {
		type: 'select',
		group: 'dbsAI',
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
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_URL'
	});

	/* Currently, Redlink does not offer hashed API_keys, but uses simple password-auth
	 * This is of course far from perfect and is hopeully going to change sometime later */
	RocketChat.settings.add('DBS_AI_Redlink_Auth_Token', '', {
		type: 'string',
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_Auth_Token'
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
		group: 'dbsAI',
		section: 'Knowledge_Base',
		public: true,
		i18nLabel: 'DBS_AI_Redlink_Domain'
	});
});

RocketChat.theme.addPackageAsset(() => {
	return Assets.getText('assets/stylesheets/redlink.less');
});
