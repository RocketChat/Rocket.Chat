import { Meteor } from 'meteor/meteor';

import { settings } from '../../../settings/server';
import { Settings } from '../../../models/server';

Meteor.startup(() => {
	const addAISettings = function() {
		this.section('Knowledge_Base', function() {
			this.add('Assistify_AI_Enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Enabled',
			});

			this.add('Assistify_AI_Source', '0', {
				type: 'select',
				values: [
					{ key: '0', i18nLabel: 'Assistify_AI_Source_Smarti' },
					{ key: '1', i18nLabel: 'Assistify_AI_Source_APIAI' },
				],
				public: true,
				i18nLabel: 'Assistify_AI_Source',
			});

			this.add('Assistify_AI_Reload', 'reloadSmarti', {
				type: 'action',
				actionText: 'Reload_Settings',
			});

			this.add('Assistify_AI_Smarti_Base_URL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Base_URL',
				i18nDescription: 'Assistify_AI_Smarti_Base_URL_Description',
			});

			let domain = settings.get('Site_Url');
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
				i18nLabel: 'Assistify_AI_Smarti_Domain',
				i18nDescription: 'Assistify_AI_Smarti_Domain_Description',
			});

			this.add('Assistify_AI_Smarti_Auth_Token', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Auth_Token',
				i18nDescription: 'Assistify_AI_Smarti_Auth_Token_Description',
			});

			this.add('Assistify_AI_Widget_Posting_Type', '', {
				type: 'select',
				values: [
					{ key: 'suggestText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_SuggestText' },
					{ key: 'postText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostText' },
					{ key: 'postRichText', i18nLabel: 'Assistify_AI_Widget_Posting_Type_PostRichText' },
				],
				public: true,
				i18nLabel: 'Assistify_AI_Widget_Posting_Type',
				i18nDescription: 'Assistify_AI_Widget_Posting_Type_Description',
			});

			this.add('Assistify_AI_RocketChat_Webhook_Token', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_RocketChat_Webhook_Token',
				i18nDescription: 'Assistify_AI_RocketChat_Webhook_Token_Description',
			});

			this.add('Assistify_AI_RocketChat_Callback_URL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_RocketChat_Callback_URL',
				i18nDescription: 'Assistify_AI_RocketChat_Callback_URL_Description',
			});

			this.add('Assistify_AI_Smarti_Inline_Highlighting_Enabled', false, {
				type: 'boolean',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Inline_Highlighting_Enabled',
				i18nDescription: 'Assistify_AI_Smarti_Inline_Highlighting_Enabled_Description',
			});

			this.add('Assistify_AI_Smarti_Inline_Highlighting_Excluded_Types', 'Attribute', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Inline_Highlighting_Excluded_Types',
				i18nDescription: 'Assistify_AI_Smarti_Inline_Highlighting_Excluded_Types_Description',
				enableQuery: [{ _id: 'Assistify_AI_Smarti_Inline_Highlighting_Enabled', value: true }],
			});

			this.add('Assistify_AI_Resync', 'triggerResync', {
				type: 'action',
				i18nDescription: 'Assistify_AI_Resync_Description',
				actionText: 'Assistify_AI_Resync_Text',
				sorter: 99,
			});

			this.add('Assistify_AI_Resync_Full', 'triggerFullResync', {
				type: 'action',
				i18nLabel: 'Assistify_AI_Resync_Full',
				i18nDescription: 'Assistify_AI_Resync_Full_Description',
				actionText: 'Assistify_AI_Resync_Full_Text',
				sorter: 100,
			});

			this.add('Assistify_AI_Resync_Batchsize', 10, {
				type: 'int',
				public: true,
				i18nLabel: 'Assistify_AI_Resync_Batchsize',
			});

			this.add('Assistify_AI_Resync_Batch_Timeout', 1000, {
				type: 'int',
				public: true,
				i18nLabel: 'Assistify_AI_Resync_Batch_Timeout',
			});

			this.add('Assistify_AI_Resync_Message_Limit', 1000, {
				type: 'int',
				public: true,
				i18nLabel: 'Assistify_AI_Resync_Message_Limit',
			});

			this.add('Assistify_AI_Smarti_Widget_i18n', '', {
				type: 'code',
				public: true,
				i18nLabel: 'Assistify_AI_Smarti_Widget_i18n',
				i18nDescription: 'Assistify_AI_Smarti_Widget_i18n_Description',
				sorter: 200,
			});
		});
		this.section('Assistify_AI_Google_CS', function() {
			this.add('Assistify_AI_Google_CS_URL', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Google_CS_URL',
				i18nDescription: 'Assistify_AI_Google_CS_URL_Description',
			});

			this.add('Assistify_AI_Google_CS_KEY', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Google_CS_KEY',
				i18nDescription: 'Assistify_AI_Google_CS_KEY_Description',
			});

			this.add('Assistify_AI_Google_CS_ID', '', {
				type: 'string',
				public: true,
				i18nLabel: 'Assistify_AI_Google_CS_ID',
				i18nDescription: 'Assistify_AI_Google_CS_ID_Description',
			});
		});
	};

	// add the setting group if needed or reuse the existing one
	settings.get('Assistify')
		? settings.get('Assistify', addAISettings)
		: settings.addGroup('Assistify', addAISettings);
});


/* Propagate settings to Chatpal */

const setChatpalUrl = (smartiUrl) => {
	Settings.update('CHATPAL_CONFIG', {
		$set:
			{
				'value.baseurl': smartiUrl,
				'value.backendtype': 'onsite',
			},
	});
};

settings.get('Assistify_AI_Smarti_Base_URL', (id, smartiUrl) => {
	const client = Settings.findOneNotHiddenById('Assistify_AI_Smarti_Domain');
	if (client) {
		setChatpalUrl(smartiUrl);
	}
});

settings.get('Assistify_AI_Smarti_Auth_Token', (id, smartiAuthToken) => {
	Settings.update('CHATPAL_CONFIG', { $set: { 'value.headerstring': `X-Auth-Token: ${ smartiAuthToken }` } });
});
