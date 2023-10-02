import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';
import { Settings } from '@rocket.chat/models';

import { settingsRegistry } from '../../../../app/settings/server';

const omnichannelEnabledQuery = { _id: 'Livechat_enabled', value: true };
const businessHoursEnabled = { _id: 'Livechat_enable_business_hours', value: true };

export const createSettings = async (): Promise<void> => {
	await settingsRegistry.add('Livechat_abandoned_rooms_action', 'none', {
		type: 'select',
		group: 'Omnichannel',
		section: 'Sessions',
		values: [
			{ key: 'none', i18nLabel: 'Do_Nothing' },
			{ key: 'close', i18nLabel: 'Livechat_close_chat' },
			{ key: 'on-hold', i18nLabel: 'Omnichannel_onHold_Chat' },
		],
		enterprise: true,
		public: true,
		invalidValue: 'none',
		modules: ['livechat-enterprise'],
		enableQuery: omnichannelEnabledQuery,
	});

	await settingsRegistry.add('Livechat_abandoned_rooms_closed_custom_message', '', {
		type: 'string',
		group: 'Omnichannel',
		section: 'Sessions',
		i18nLabel: 'Livechat_abandoned_rooms_closed_custom_message',
		enableQuery: [{ _id: 'Livechat_abandoned_rooms_action', value: 'close' }, omnichannelEnabledQuery],
		enterprise: true,
		invalidValue: '',
		modules: ['livechat-enterprise'],
	});

	await settingsRegistry.add('Livechat_last_chatted_agent_routing', false, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Routing',
		enterprise: true,
		invalidValue: false,
		modules: ['livechat-enterprise'],
		enableQuery: omnichannelEnabledQuery,
	});

	await settingsRegistry.addGroup('Omnichannel', async function () {
		await this.section('Business_Hours', async function () {
			await this.add('Livechat_business_hour_type', 'Single', {
				type: 'select',
				values: [
					{
						key: 'Single',
						i18nLabel: 'Single',
					},
					{
						key: 'Multiple',
						i18nLabel: 'Multiple',
					},
				],
				public: true,
				i18nLabel: 'Livechat_business_hour_type',
				enterprise: true,
				invalidValue: 'Single',
				modules: ['livechat-enterprise'],
				enableQuery: [omnichannelEnabledQuery, businessHoursEnabled],
			});
		});

		await this.section('Queue_management', async function () {
			await this.add('Livechat_waiting_queue', false, {
				type: 'boolean',
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Waiting_queue',
				enterprise: true,
				invalidValue: false,
				modules: ['livechat-enterprise'],
				enableQuery: omnichannelEnabledQuery,
			});

			await this.add('Livechat_waiting_queue_message', '', {
				type: 'string',
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Waiting_queue_message',
				i18nDescription: 'Waiting_queue_message_description',
				enableQuery: [{ _id: 'Livechat_waiting_queue', value: true }, omnichannelEnabledQuery],
				enterprise: true,
				invalidValue: '',
				modules: ['livechat-enterprise'],
			});

			await this.add('Livechat_maximum_chats_per_agent', 0, {
				type: 'int',
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Max_number_of_chats_per_agent',
				i18nDescription: 'Max_number_of_chats_per_agent_description',
				enableQuery: [{ _id: 'Livechat_waiting_queue', value: true }, omnichannelEnabledQuery],
				enterprise: true,
				invalidValue: 0,
				modules: ['livechat-enterprise'],
			});

			await this.add('Omnichannel_calculate_dispatch_service_queue_statistics', true, {
				type: 'boolean',
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Omnichannel_calculate_dispatch_service_queue_statistics',
				enableQuery: [{ _id: 'Livechat_waiting_queue', value: true }, omnichannelEnabledQuery],
				enterprise: true,
				invalidValue: false,
				modules: ['livechat-enterprise'],
			});

			await this.add('Livechat_number_most_recent_chats_estimate_wait_time', 100, {
				type: 'int',
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Number_of_most_recent_chats_estimate_wait_time',
				i18nDescription: 'Number_of_most_recent_chats_estimate_wait_time_description',
				enableQuery: [{ _id: 'Livechat_waiting_queue', value: true }, omnichannelEnabledQuery],
				enterprise: true,
				invalidValue: 100,
				modules: ['livechat-enterprise'],
			});

			await this.add('Livechat_max_queue_wait_time', -1, {
				type: 'int',
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Livechat_maximum_queue_wait_time',
				enableQuery: omnichannelEnabledQuery,
				i18nDescription: 'Livechat_maximum_queue_wait_time_description',
				enterprise: true,
				invalidValue: -1,
				modules: ['livechat-enterprise'],
			});

			await this.add('Omnichannel_sorting_mechanism', 'Timestamp', {
				type: 'select',
				values: [
					{ key: OmnichannelSortingMechanismSettingType.Timestamp, i18nLabel: 'Timestamp' },
					{ key: OmnichannelSortingMechanismSettingType.Priority, i18nLabel: 'Priorities' },
					{ key: OmnichannelSortingMechanismSettingType.SLAs, i18nLabel: 'SLA_Policies' },
				],
				group: 'Omnichannel',
				section: 'Queue_management',
				i18nLabel: 'Sorting_mechanism',
				enableQuery: [omnichannelEnabledQuery],
				enterprise: true,
				public: true,
				modules: ['livechat-enterprise'],
				invalidValue: '',
			});
		});
	});

	await settingsRegistry.add('Omnichannel_contact_manager_routing', true, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Routing',
		enterprise: true,
		invalidValue: false,
		modules: ['livechat-enterprise'],
		enableQuery: omnichannelEnabledQuery,
	});

	await settingsRegistry.add('Livechat_auto_close_on_hold_chats_timeout', 3600, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Sessions',
		enterprise: true,
		invalidValue: 0,
		modules: ['livechat-enterprise'],
		enableQuery: omnichannelEnabledQuery,
	});

	await settingsRegistry.add('Livechat_auto_close_on_hold_chats_custom_message', '', {
		type: 'string',
		group: 'Omnichannel',
		section: 'Sessions',
		enableQuery: [{ _id: 'Livechat_auto_close_on_hold_chats_timeout', value: { $gte: 1 } }, omnichannelEnabledQuery],
		enterprise: true,
		invalidValue: '',
		modules: ['livechat-enterprise'],
	});

	await settingsRegistry.add('Livechat_allow_manual_on_hold', false, {
		type: 'boolean',
		group: 'Omnichannel',
		section: 'Sessions',
		enterprise: true,
		invalidValue: false,
		public: true,
		modules: ['livechat-enterprise'],
		enableQuery: omnichannelEnabledQuery,
	});

	await settingsRegistry.add('Livechat_auto_transfer_chat_timeout', 0, {
		type: 'int',
		group: 'Omnichannel',
		section: 'Sessions',
		i18nDescription: 'Livechat_auto_transfer_chat_timeout_description',
		enterprise: true,
		invalidValue: 0,
		modules: ['livechat-enterprise'],
		enableQuery: omnichannelEnabledQuery,
	});

	await settingsRegistry.add('Accounts_Default_User_Preferences_omnichannelTranscriptPDF', false, {
		type: 'boolean',
		public: true,
		i18nLabel: 'Omnichannel_transcript_pdf',
	});

	await Settings.addOptionValueById('Livechat_Routing_Method', {
		key: 'Load_Balancing',
		i18nLabel: 'Load_Balancing',
	});
	await Settings.addOptionValueById('Livechat_Routing_Method', {
		key: 'Load_Rotation',
		i18nLabel: 'Load_Rotation',
	});
};
