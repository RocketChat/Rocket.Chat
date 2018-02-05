/* globals RocketChat */

Meteor.startup(() => {
	const addAISettings = function() {

		this.section('Knowledge_Base', function() {

			this.add('Assistify_AI_Enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Enabled'
			});

			this.add('Assistify_AI_Source', '0', {
				type: 'select',
				values: [
					{key: '0', i18nLabel: 'Assistify_AI_Source_Smarti'},
					{key: '1', i18nLabel: 'Assistify_AI_Source_APIAI'}
				],
				public: true,
				i18nLabel: 'Assistify_AI_Source'
			});

			this.add('Assistify_AI_Reload', 'reloadSmarti', {
				type: 'action',
				actionText: 'Reload_Settings'
			});

			this.add('Assistify_AI_Smarti_Base_URL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Base_URL'
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
			this.add('Assistify_AI_Smarti_Domain', domain, {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Domain'
			});

			this.add('Assistify_AI_Smarti_Auth_Token', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Auth_Token'
			});

			this.add('Assistify_AI_Widget_Posting_Type', '', {
				type: 'select',
				values: [
					{key: 'suggestText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_SuggestText'},
					{key: 'postText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostText'},
					{key: 'postRichText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostRichText'}
				],
				public: true,
				i18nLabel: 'Assistify_AI_Widget_Posting_Type'
			});

			this.add('Assistify_AI_RocketChat_Webhook_Token', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_RocketChat_Webhook_Token'
			});
		});
	};

	// add the setting group if needed or reuse the existing one
	RocketChat.settings.get('Assistify') ?
		RocketChat.settings.get('Assistify', addAISettings) :
		RocketChat.settings.addGroup('Assistify', addAISettings);
});

RocketChat.settings.get('Assistify_AI_Smarti_Base_URL', (id, smartiValue) => {
	const domain = RocketChat.models.Settings.findOneNotHiddenById('Assistify_AI_Smarti_Domain');
	if (domain) {
		RocketChat.models.Settings.update({_id: 'CHATPAL_BASEURL'}, {
			$set: {
				value: `${ smartiValue }rocket/${ domain.value }/search-message`,
				readonly: true,
				enableQuery: '{"_id":"Assistify_AI_Smarti_Base_URL","value":""}'

			}
		});
	}
});

RocketChat.settings.get('Assistify_AI_Smarti_Domain', (id, domain) => {
	const url = RocketChat.models.Settings.findOneNotHiddenById('Assistify_AI_Smarti_Base_URL');
	if (domain) {
		RocketChat.models.Settings.update({_id: 'CHATPAL_BASEURL'}, {
			$set: {
				value: `${ url.value }rocket/${ domain }/search-message`,
				readonly: true,
				enableQuery: '{"_id":"Assistify_AI_Smarti_Base_URL","value":""}'

			}
		});
	}
});

RocketChat.settings.get('Assistify_AI_Smarti_Auth_Token', (id, smartiValue) => {
	RocketChat.models.Settings.update({_id: 'CHATPAL_AUTH_TOKEN'}, {
		$set: {
			value: smartiValue, readonly: true, enableQuery: '{"_id":"Assistify_AI_Smarti_Auth_Token","value":""}'
		}
	});
});

