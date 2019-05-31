import { Meteor } from 'meteor/meteor';

import { settings } from '../../settings';

Meteor.startup(function() {
	settings.addGroup('WhatsApp Gateway', function() {
		this.add('WhatsApp_Gateway_Enabled', false, {
			type: 'boolean',
			i18nLabel: 'Enabled',
		});

		this.add('WhatsApp_Gateway_Service', 'caixa', {
			type: 'select',
			values: [
				{
					key: 'caixa',
					i18nLabel: 'Caixa',
				},
			],
			i18nLabel: 'Service',
		});

		this.section('Caixa', function() {
			this.add('WhatsApp_Gateway_Base_API_URL', '', {
				type: 'string',
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'WhatsApp_Gateway_Base_API_URL',
				i18nDescription: 'Whatsapp_Gateway_Base_API_URL_Description',
				secret: true,
			});
			this.add('WhatsApp_Gateway_Allow_Invalid_SelfSigned_Certs', true, {
				type: 'boolean',
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'WhatsApp_Gateway_Allow_Invalid_SelfSigned_Certs',
				secret: true,
			});
			this.add('WhatsApp_Gateway_Default_Department', '', {
				type: 'string',
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'WhatsApp_Gateway_Default_Department',
				i18nDescription: 'WhatsApp_Gateway_Default_Department_Description',
				secret: true,
			});
			this.add('WhatsApp_Gateway_Fallback_Message', '', {
				type: 'string',
				multiline: true,
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'WhatsApp_Gateway_Fallback_Message',
				i18nDescription: 'WhatsApp_Gateway_Fallback_Message_Description',
				secret: true,
			});
			this.add('WhatsApp_Gateway_Welcome_Message', '', {
				type: 'string',
				multiline: true,
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'WhatsApp_Gateway_Welcome_Message',
				i18nDescription: 'WhatsApp_Gateway_Welcome_Message_Description',
				secret: true,
			});
			this.add('WhatsApp_Gateway_Queue_Message', '', {
				type: 'string',
				multiline: true,
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'WhatsApp_Gateway_Queue_Message',
				i18nDescription: 'WhatsApp_Gateway_Queue_Message_Description',
				secret: true,
			});
			this.add('WhatsApp_Gateway_conversation_finished_message', '', {
				type: 'string',
				multiline: true,
				enableQuery: {
					_id: 'WhatsApp_Gateway_Service',
					value: 'caixa',
				},
				i18nLabel: 'Conversation_finished_message',
				i18nDescription: 'WhatsApp_Gateway_conversation_finished_message_Description',
				secret: true,
			});
		});
	});
});
