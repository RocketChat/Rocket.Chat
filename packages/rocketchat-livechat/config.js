Meteor.startup(function() {
	RocketChat.settings.addGroup('Livechat');

	RocketChat.settings.add('Livechat_enabled', false, { type: 'boolean', group: 'Livechat', public: true });

	RocketChat.settings.add('Livechat_title', 'Rocket.Chat', { type: 'string', group: 'Livechat', public: true });
	RocketChat.settings.add('Livechat_title_color', '#C1272D', { type: 'color', group: 'Livechat', public: true });

	RocketChat.settings.add('Livechat_display_offline_form', true, {
		type: 'boolean',
		group: 'Livechat',
		public: true,
		section: 'Offline',
		i18nLabel: 'Display_offline_form'
	});

	RocketChat.settings.add('Livechat_offline_form_unavailable', '', {
		type: 'string',
		group: 'Livechat',
		public: true,
		section: 'Offline',
		i18nLabel: 'Offline_form_unavailable_message'
	});

	RocketChat.settings.add('Livechat_offline_title', 'Leave a message', {
		type: 'string',
		group: 'Livechat',
		public: true,
		section: 'Offline',
		i18nLabel: 'Title'
	});
	RocketChat.settings.add('Livechat_offline_title_color', '#666666', {
		type: 'color',
		group: 'Livechat',
		public: true,
		section: 'Offline',
		i18nLabel: 'Color'
	});
	RocketChat.settings.add('Livechat_offline_message', 'We are not online right now. Please leave us a message:', {
		type: 'string',
		group: 'Livechat',
		public: true,
		section: 'Offline',
		i18nLabel: 'Instructions',
		i18nDescription: 'Instructions_to_your_visitor_fill_the_form_to_send_a_message'
	});
	RocketChat.settings.add('Livechat_offline_email', '', {
		type: 'string',
		group: 'Livechat',
		i18nLabel: 'Email_address_to_send_offline_messages',
		section: 'Offline'
	});
	RocketChat.settings.add('Livechat_offline_success_message', '', {
		type: 'string',
		group: 'Livechat',
		public: true,
		section: 'Offline',
		i18nLabel: 'Offline_success_message'
	});

	RocketChat.settings.add('Livechat_registration_form', true, { type: 'boolean', group: 'Livechat', public: true, i18nLabel: 'Show_preregistration_form' });
	RocketChat.settings.add('Livechat_guest_count', 1, { type: 'int', group: 'Livechat' });

	RocketChat.settings.add('Livechat_Room_Count', 1, {
		type: 'int',
		group: 'Livechat',
		i18nLabel: 'Livechat_room_count'
	});

	RocketChat.settings.add('Livechat_forward_open_chats', false, {
		type: 'boolean',
		group: 'Livechat'
	});

	RocketChat.settings.add('Livechat_forward_open_chats_timeout', 60, {
		type: 'int',
		group: 'Livechat',
		enableQuery: { _id: 'Livechat_forward_open_chats', value: true }
	});

	RocketChat.settings.add('Livechat_webhookUrl', false, {
		type: 'string',
		group: 'Livechat',
		section: 'CRM Integration',
		i18nLabel: 'Webhook_URL'
	});

	RocketChat.settings.add('Livechat_secret_token', false, {
		type: 'string',
		group: 'Livechat',
		section: 'CRM Integration',
		i18nLabel: 'Secret_token'
	});

	RocketChat.settings.add('Livechat_webhook_on_close', false, {
		type: 'boolean',
		group: 'Livechat',
		section: 'CRM Integration',
		i18nLabel: 'Send_request_on_chat_close'
	});

	RocketChat.settings.add('Livechat_webhook_on_offline_msg', false, {
		type: 'boolean',
		group: 'Livechat',
		section: 'CRM Integration',
		i18nLabel: 'Send_request_on_offline_messages'
	});

	RocketChat.settings.add('Livechat_Knowledge_Enabled', false, {
		type: 'boolean',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Enabled'
	});

	RocketChat.settings.add('Livechat_Knowledge_Apiai_Key', '', {
		type: 'string',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Apiai_Key'
	});

	RocketChat.settings.add('Livechat_Knowledge_Apiai_Language', 'en', {
		type: 'string',
		group: 'Livechat',
		section: 'Knowledge Base',
		public: true,
		i18nLabel: 'Apiai_Language'
	});

	RocketChat.settings.add('Livechat_history_monitor_type', 'url', {
		type: 'select',
		group: 'Livechat',
		i18nLabel: 'Monitor_history_for_changes_on',
		values: [
			{ key: 'url', i18nLabel: 'Page_URL' },
			{ key: 'title', i18nLabel: 'Page_title' }
		]
	});

	RocketChat.settings.add('Livechat_Routing_Method', 'Least_Amount', {
		type: 'select',
		group: 'Livechat',
		public: true,
		values: [
			{key: 'Least_Amount', i18nLabel: 'Least_Amount'},
			{key: 'Guest_Pool', i18nLabel: 'Guest_Pool'}
		]
	});
});
