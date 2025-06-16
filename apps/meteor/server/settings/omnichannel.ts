import { SettingEditor } from '@rocket.chat/core-typings';

import { settingsRegistry } from '../../app/settings/server';

const omnichannelEnabledQuery = { _id: 'Livechat_enabled', value: true };

export const createOmniSettings = () =>
	settingsRegistry.addGroup('Omnichannel', async function () {
		await this.add('Livechat_enabled', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
		});

		await this.add('Livechat_title', 'Rocket.Chat', {
			type: 'string',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_title_color', '#C1272D', {
			type: 'color',
			editor: SettingEditor.COLOR,
			// allowedTypes: ['color', 'expression'],
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_enable_message_character_limit', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_message_character_limit', 0, {
			type: 'int',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_display_offline_form', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Display_offline_form',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_clear_local_storage_when_chat_ended', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Clear_livechat_session_when_chat_ended',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_validate_offline_email', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Validate_email_address',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_offline_form_unavailable', '', {
			type: 'string',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Offline_form_unavailable_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_offline_title', 'Leave a message', {
			type: 'string',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Title',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_offline_title_color', '#666666', {
			type: 'color',
			editor: SettingEditor.COLOR,
			// allowedTypes: ['color', 'expression'],
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Color',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_offline_message', '', {
			type: 'string',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Instructions',
			i18nDescription: 'Instructions_to_your_visitor_fill_the_form_to_send_a_message',
			enableQuery: omnichannelEnabledQuery,
			multiline: true,
		});

		await this.add('Livechat_offline_email', '', {
			type: 'string',
			group: 'Omnichannel',
			i18nLabel: 'Email_address_to_send_offline_messages',
			section: 'Livechat',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_offline_success_message', '', {
			type: 'string',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Offline_success_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_allow_switching_departments', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			section: 'Livechat',
			i18nLabel: 'Allow_switching_departments',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_show_agent_info', true, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Show_agent_info',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_show_agent_email', true, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: [{ _id: 'Livechat_show_agent_info', value: true }, omnichannelEnabledQuery],
			i18nLabel: 'Show_agent_email',
		});

		await this.add('Omnichannel_allow_visitors_to_close_conversation', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_request_comment_when_closing_conversation', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			i18nLabel: 'Request_comment_when_closing_conversation',
			i18nDescription: 'Request_comment_when_closing_conversation_description',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Omnichannel_allow_force_close_conversations', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'API',
			public: true,
			enableQuery: omnichannelEnabledQuery,
			alert: 'Omnichannel_allow_force_close_conversations_alert',
		});

		await this.add('Livechat_conversation_finished_message', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Conversation_finished_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_conversation_finished_text', '', {
			type: 'string',
			multiline: true,
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Conversation_finished_text',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_registration_form', true, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Show_preregistration_form',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_name_field_registration_form', true, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Show_name_field',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_email_field_registration_form', true, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Show_email_field',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_guest_count', 1, { type: 'int', group: 'Omnichannel', hidden: true });

		await this.add('Livechat_enabled_when_agent_idle', true, {
			type: 'boolean',
			group: 'Omnichannel',
			i18nLabel: 'Accept_new_livechats_when_agent_is_idle',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhookUrl', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Webhook_URL',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_secret_token', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Secret_token',
			secret: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_start', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_chat_start',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_close', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_chat_close',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_chat_taken', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_chat_taken',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_chat_queued', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_chat_queued',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_forward', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_forwarding',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_offline_msg', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_offline_messages',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_visitor_message', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_visitor_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_webhook_on_agent_message', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_agent_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Send_visitor_navigation_history_livechat_webhook_request', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_visitor_navigation_history_on_request',
			i18nDescription: 'Feature_Depends_on_Livechat_Visitor_navigation_as_a_message_to_be_enabled',
			enableQuery: [{ _id: 'Livechat_Visitor_navigation_as_a_message', value: true }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_webhook_on_capture', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Send_request_on_lead_capture',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_lead_email_regex', '\\b[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\\.)+[A-Z]{2,4}\\b', {
			type: 'string',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Lead_capture_email_regex',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add(
			'Livechat_lead_phone_regex',
			'((?:\\([0-9]{1,3}\\)|[0-9]{2})[ \\-]*?[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$)|[0-9]{4,5}(?:[\\-\\s\\_]{1,2})?[0-9]{4}(?:(?=[^0-9])|$))',
			{
				type: 'string',
				group: 'Omnichannel',
				section: 'CRM_Integration',
				i18nLabel: 'Lead_capture_phone_regex',
				enableQuery: omnichannelEnabledQuery,
			},
		);

		await this.add('Livechat_history_monitor_type', 'url', {
			type: 'select',
			group: 'Omnichannel',
			section: 'Livechat',
			i18nLabel: 'Monitor_history_for_changes_on',
			values: [
				{ key: 'url', i18nLabel: 'Page_URL' },
				{ key: 'title', i18nLabel: 'Page_title' },
			],
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_http_timeout', 5000, {
			type: 'int',
			group: 'Omnichannel',
			section: 'CRM_Integration',
			i18nLabel: 'Livechat_http_timeout',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_Visitor_navigation_as_a_message', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Send_Visitor_navigation_history_as_a_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await settingsRegistry.addGroup('Omnichannel', async function () {
			await this.section('Business_Hours', async function () {
				await this.add('Livechat_enable_business_hours', false, {
					type: 'boolean',
					group: 'Omnichannel',
					public: true,
					i18nLabel: 'Business_hours_enabled',
					enableQuery: omnichannelEnabledQuery,
				});
			});
		});

		await this.add('Livechat_continuous_sound_notification_new_livechat_room', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			i18nLabel: 'Continuous_sound_notifications_for_new_livechat_room',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_fileupload_enabled', true, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			i18nLabel: 'FileUpload_Enabled',
			enableQuery: [{ _id: 'FileUpload_Enabled', value: true }, omnichannelEnabledQuery],
		});

		// Making these 2 settings "depend" on each other
		// Prevents us from having both as true and then asking visitor if it wants a Transcript
		// But send it anyways because of send_always being enabled. So one can only be turned on
		// if the other is off.
		await this.add('Livechat_enable_transcript', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			i18nLabel: 'Transcript_Enabled',
			enableQuery: [{ _id: 'Livechat_transcript_send_always', value: false }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_transcript_send_always', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			enableQuery: [{ _id: 'Livechat_enable_transcript', value: false }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_transcript_show_system_messages', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_transcript_message', '', {
			type: 'string',
			group: 'Omnichannel',
			public: true,
			i18nLabel: 'Transcript_message',
			enableQuery: [{ _id: 'Livechat_enable_transcript', value: true }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_transcript_email_subject', '', {
			type: 'string',
			group: 'Omnichannel',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Omnichannel_enable_department_removal', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			i18nLabel: 'Omnichannel_enable_department_removal',
			alert: 'Omnichannel_enable_department_removal_alert',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_registration_form_message', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Livechat_registration_form_message',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_AllowedDomainsList', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			i18nLabel: 'Livechat_AllowedDomainsList',
			i18nDescription: 'Domains_allowed_to_embed_the_livechat_widget',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_OfflineMessageToChannel_enabled', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_OfflineMessageToChannel_channel_name', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'Livechat',
			public: true,
			enableQuery: [{ _id: 'Livechat_OfflineMessageToChannel_enabled', value: true }, omnichannelEnabledQuery],
			i18nLabel: 'Channel_name',
		});

		await this.add('Livechat_Routing_Method', 'Auto_Selection', {
			type: 'select',
			group: 'Omnichannel',
			public: true,
			section: 'Routing',
			values: [
				{ key: 'External', i18nLabel: 'External_Service' },
				{ key: 'Auto_Selection', i18nLabel: 'Auto_Selection' },
				{ key: 'Manual_Selection', i18nLabel: 'Manual_Selection' },
			],
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_accept_chats_with_no_agents', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Routing',
			i18nLabel: 'Accept_with_no_online_agents',
			i18nDescription: 'Accept_incoming_livechat_requests_even_if_there_are_no_online_agents',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_assign_new_conversation_to_bot', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'Routing',
			i18nLabel: 'Assign_new_conversations_to_bot_agent',
			i18nDescription: 'Assign_new_conversations_to_bot_agent_description',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_guest_pool_max_number_incoming_livechats_displayed', 0, {
			type: 'int',
			group: 'Omnichannel',
			section: 'Routing',
			public: true,
			i18nLabel: 'Max_number_incoming_livechats_displayed',
			i18nDescription: 'Max_number_incoming_livechats_displayed_description',
			enableQuery: [{ _id: 'Livechat_Routing_Method', value: 'Manual_Selection' }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_show_queue_list_link', false, {
			type: 'boolean',
			group: 'Omnichannel',
			public: true,
			section: 'Routing',
			i18nLabel: 'Show_queue_list_to_all_agents',
			enableQuery: [{ _id: 'Livechat_Routing_Method', value: { $ne: 'External' } }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_External_Queue_URL', '', {
			type: 'string',
			group: 'Omnichannel',
			public: false,
			section: 'Routing',
			i18nLabel: 'External_Queue_Service_URL',
			i18nDescription: 'For_more_details_please_check_our_docs',
			enableQuery: [{ _id: 'Livechat_Routing_Method', value: 'External' }, omnichannelEnabledQuery],
		});

		await this.add('Livechat_External_Queue_Token', '', {
			type: 'string',
			group: 'Omnichannel',
			public: false,
			section: 'Routing',
			i18nLabel: 'Secret_token',
			enableQuery: [{ _id: 'Livechat_Routing_Method', value: 'External' }, omnichannelEnabledQuery],
		});

		await this.add('Omnichannel_queue_delay_timeout', 5, {
			type: 'int',
			group: 'Omnichannel',
			section: 'Queue_management',
			i18nLabel: 'Queue_delay_timeout',
			i18nDescription: 'Time_in_seconds',
			enableQuery: [{ _id: 'Livechat_Routing_Method', value: { $ne: 'Manual_Selection' } }, omnichannelEnabledQuery],
			invalidValue: 5,
		});

		await this.add('Livechat_Allow_collect_and_store_HTTP_header_informations', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'GDPR',
			public: true,
			i18nLabel: 'Allow_collect_and_store_HTTP_header_informations',
			i18nDescription: 'Allow_collect_and_store_HTTP_header_informations_description',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_force_accept_data_processing_consent', false, {
			type: 'boolean',
			group: 'Omnichannel',
			section: 'GDPR',
			public: true,
			alert: 'Force_visitor_to_accept_data_processing_consent_enabled_alert',
			i18nLabel: 'Force_visitor_to_accept_data_processing_consent',
			i18nDescription: 'Force_visitor_to_accept_data_processing_consent_description',
			enableQuery: [omnichannelEnabledQuery, { _id: 'Livechat_Allow_collect_and_store_HTTP_header_informations', value: true }],
		});

		await this.add('Livechat_data_processing_consent_text', '', {
			type: 'string',
			multiline: true,
			group: 'Omnichannel',
			section: 'GDPR',
			public: true,
			i18nLabel: 'Data_processing_consent_text',
			i18nDescription: 'Data_processing_consent_text_description',
			enableQuery: [
				{ _id: 'Livechat_force_accept_data_processing_consent', value: true },
				{ _id: 'Livechat_Allow_collect_and_store_HTTP_header_informations', value: true },
				omnichannelEnabledQuery,
			],
		});

		await this.add('Livechat_agent_leave_action', 'none', {
			type: 'select',
			group: 'Omnichannel',
			section: 'Sessions',
			values: [
				{ key: 'none', i18nLabel: 'None' },
				{ key: 'forward', i18nLabel: 'Forward' },
				{ key: 'close', i18nLabel: 'Close' },
			],
			i18nLabel: 'How_to_handle_open_sessions_when_agent_goes_offline',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Livechat_agent_leave_action_timeout', 60, {
			type: 'int',
			group: 'Omnichannel',
			section: 'Sessions',
			enableQuery: [{ _id: 'Livechat_agent_leave_action', value: { $ne: 'none' } }, omnichannelEnabledQuery],
			i18nLabel: 'How_long_to_wait_after_agent_goes_offline',
			i18nDescription: 'Time_in_seconds',
		});

		await this.add('Livechat_agent_leave_comment', '', {
			type: 'string',
			group: 'Omnichannel',
			section: 'Sessions',
			enableQuery: [{ _id: 'Livechat_agent_leave_action', value: 'close' }, omnichannelEnabledQuery],
			i18nLabel: 'Comment_to_leave_on_closing_session',
		});

		await this.add('Livechat_visitor_inactivity_timeout', 3600, {
			type: 'int',
			group: 'Omnichannel',
			section: 'Sessions',
			i18nLabel: 'How_long_to_wait_to_consider_visitor_abandonment',
			i18nDescription: 'Time_in_seconds',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Omnichannel_call_provider', 'none', {
			type: 'select',
			public: true,
			group: 'Omnichannel',
			section: 'Video_and_Audio_Call',
			values: [
				{ key: 'none', i18nLabel: 'None' },
				{ key: 'default-provider', i18nLabel: 'Default Provider' },
			],
			i18nDescription: 'Feature_depends_on_selected_call_provider_to_be_enabled_from_administration_settings',
			i18nLabel: 'Call_provider',
			enableQuery: omnichannelEnabledQuery,
		});

		await this.add('Omnichannel_Metrics_Ignore_Automatic_Messages', false, {
			type: 'boolean',
			public: true,
			group: 'Omnichannel',
			section: 'Analytics',
			i18nLabel: 'Omnichannel_Ignore_automatic_responses_for_performance_metrics',
		});
	});
await settingsRegistry.addGroup('SMS', async function () {
	await this.add('SMS_Enabled', false, {
		type: 'boolean',
		i18nLabel: 'Enabled',
	});

	await this.add('SMS_Service', 'twilio', {
		type: 'select',
		values: [
			{
				key: 'twilio',
				i18nLabel: 'Twilio',
			},
			{
				key: 'voxtelesys',
				i18nLabel: 'Voxtelesys',
			},
			{
				key: 'mobex',
				i18nLabel: 'Mobex',
			},
		],
		i18nLabel: 'Service',
	});

	await this.add('SMS_Default_Omnichannel_Department', '', {
		type: 'string',
	});

	await this.section('Twilio', async function () {
		await this.add('SMS_Twilio_Account_SID', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'twilio',
			},
			i18nLabel: 'Account_SID',
			secret: true,
		});
		await this.add('SMS_Twilio_authToken', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'twilio',
			},
			i18nLabel: 'Auth_Token',
			secret: true,
		});
		await this.add('SMS_Twilio_FileUpload_Enabled', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'twilio',
			},
			i18nLabel: 'FileUpload_Enabled',
			secret: true,
		});
		await this.add('SMS_Twilio_FileUpload_MediaTypeWhiteList', 'image/*,audio/*,video/*,text/*,application/pdf', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'twilio',
			},
			i18nLabel: 'FileUpload_MediaTypeWhiteList',
			i18nDescription: 'FileUpload_MediaTypeWhiteListDescription',
			secret: true,
		});
	});

	await this.section('Voxtelesys', async function () {
		await this.add('SMS_Voxtelesys_authToken', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'voxtelesys',
			},
			i18nLabel: 'Auth_Token',
			secret: true,
		});
		await this.add('SMS_Voxtelesys_URL', 'https://smsapi.voxtelesys.net/api/v1/sms', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'voxtelesys',
			},
			i18nLabel: 'URL',
			secret: true,
		});
		await this.add('SMS_Voxtelesys_FileUpload_Enabled', true, {
			type: 'boolean',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'voxtelesys',
			},
			i18nLabel: 'FileUpload_Enabled',
			secret: true,
		});
		await this.add('SMS_Voxtelesys_FileUpload_MediaTypeWhiteList', 'image/*,audio/*,video/*,text/*,application/pdf', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'voxtelesys',
			},
			i18nLabel: 'FileUpload_MediaTypeWhiteList',
			i18nDescription: 'FileUpload_MediaTypeWhiteListDescription',
			secret: true,
		});
	});

	await this.section('Mobex', async function () {
		await this.add('SMS_Mobex_gateway_address', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'mobex',
			},
			i18nLabel: 'Mobex_sms_gateway_address',
			i18nDescription: 'Mobex_sms_gateway_address_desc',
		});
		await this.add('SMS_Mobex_restful_address', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'mobex',
			},
			i18nLabel: 'Mobex_sms_gateway_restful_address',
			i18nDescription: 'Mobex_sms_gateway_restful_address_desc',
		});
		await this.add('SMS_Mobex_username', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'mobex',
			},
			i18nLabel: 'Mobex_sms_gateway_username',
		});
		await this.add('SMS_Mobex_password', '', {
			type: 'password',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'mobex',
			},
			i18nLabel: 'Mobex_sms_gateway_password',
		});
		await this.add('SMS_Mobex_from_number', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'mobex',
			},
			i18nLabel: 'Mobex_sms_gateway_from_number',
			i18nDescription: 'Mobex_sms_gateway_from_number_desc',
		});
		await this.add('SMS_Mobex_from_numbers_list', '', {
			type: 'string',
			enableQuery: {
				_id: 'SMS_Service',
				value: 'mobex',
			},
			i18nLabel: 'Mobex_sms_gateway_from_numbers_list',
			i18nDescription: 'Mobex_sms_gateway_from_numbers_list_desc',
		});
	});
	await this.section('External Frame', async function () {
		await this.add('Omnichannel_External_Frame_Enabled', false, {
			type: 'boolean',
			public: true,
			alert: 'Experimental_Feature_Alert',
		});

		await this.add('Omnichannel_External_Frame_URL', '', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});

		await this.add('Omnichannel_External_Frame_Encryption_JWK', '', {
			type: 'string',
			public: true,
			enableQuery: {
				_id: 'Omnichannel_External_Frame_Enabled',
				value: true,
			},
		});
	});
});
