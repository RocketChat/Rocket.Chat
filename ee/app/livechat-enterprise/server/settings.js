import { settings } from '../../../../app/settings';
import { Settings } from '../../../../app/models/server';

export const createSettings = () => {
	settings.add('Livechat_waiting_queue', false, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Routing',
		i18nLabel: 'Waiting_queue',
		enterprise: true,
		invalidValue: false,
	});

	settings.add('Livechat_waiting_queue_message', '', {
		type: 'string',
		group: 'Omnichannel',
		section: 'Routing',
		i18nLabel: 'Waiting_queue_message',
		i18nDescription: 'Waiting_queue_message_description',
		enableQuery: { _id: 'Livechat_waiting_queue', value: true },
		enterprise: true,
		invalidValue: '',
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_maximum_chats_per_agent', 0, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Routing',
		i18nLabel: 'Max_number_of_chats_per_agent',
		i18nDescription: 'Max_number_of_chats_per_agent_description',
		enableQuery: { _id: 'Livechat_waiting_queue', value: true },
		enterprise: true,
		invalidValue: 0,
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_number_most_recent_chats_estimate_wait_time', 100, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Routing',
		i18nLabel: 'Number_of_most_recent_chats_estimate_wait_time',
		i18nDescription: 'Number_of_most_recent_chats_estimate_wait_time_description',
		enableQuery: { _id: 'Livechat_waiting_queue', value: true },
		enterprise: true,
		invalidValue: 100,
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_abandoned_rooms_action', 'none', {
		type: 'select',
		group: 'Omnichannel',
		section: 'Sessions',
		values: [
			{ key: 'none', i18nLabel: 'Do_Nothing' },
			{ key: 'close', i18nLabel: 'Livechat_close_chat' },
			{ key: 'on-hold', i18nLabel: 'Livechat_onHold_Chat' },
		],
		enterprise: true,
		public: true,
		invalidValue: 'none',
		modules: [
			'livechat-enterprise',
		],
	});


	settings.add('Livechat_abandoned_rooms_closed_custom_message', '', {
		type: 'string',
		group: 'Omnichannel',
		section: 'Sessions',
		i18nLabel: 'Livechat_abandoned_rooms_closed_custom_message',
		enableQuery: { _id: 'Livechat_abandoned_rooms_action', value: 'close' },
		enterprise: true,
		invalidValue: '',
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_last_chatted_agent_routing', false, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Routing',
		enterprise: true,
		invalidValue: false,
		modules: [
			'livechat-enterprise',
		],
	});

	settings.addGroup('Omnichannel', function() {
		this.section('Business_Hours', function() {
			this.add('Livechat_business_hour_type', 'Single', {
				type: 'select',
				values: [{
					key: 'Single',
					i18nLabel: 'Single',
				}, {
					key: 'Multiple',
					i18nLabel: 'Multiple',
				}],
				public: true,
				i18nLabel: 'Livechat_business_hour_type',
				enterprise: true,
				invalidValue: 'Single',
				modules: [
					'livechat-enterprise',
				],
			});
		});
	});

	settings.add('Omnichannel_contact_manager_routing', true, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Routing',
		enterprise: true,
		invalidValue: false,
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_auto_close_on_hold_chats_timeout', 60, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Sessions',
		enterprise: true,
		invalidValue: 0,
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_auto_close_on_hold_chats_custom_message', '', {
		type: 'string',
		group: 'Omnichannel',
		section: 'Sessions',
		enableQuery: { _id: 'Livechat_auto_close_on_hold_chats_timeout', value: { $gte: 1 } },
		enterprise: true,
		invalidValue: '',
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_allow_manual_on_hold', true, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Sessions',
		enterprise: true,
		value: true,
		invalidValue: false,
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_manual_on_hold_timeout', 60, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Sessions',
		enterprise: true,
		invalidValue: 0,
		enableQuery: { _id: 'Livechat_allow_manual_on_hold', value: true },
		modules: [
			'livechat-enterprise',
		],
	});

	settings.add('Livechat_auto_transfer_chat_timeout', 0, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Sessions',
		i18nDescription: 'Livechat_auto_transfer_chat_timeout_description',
		enterprise: true,
		invalidValue: 0,
		modules: [
			'livechat-enterprise',
		],
	});

	Settings.addOptionValueById('Livechat_Routing_Method', { key: 'Load_Balancing', i18nLabel: 'Load_Balancing' });
};
