import { OmnichannelSortingMechanismSettingType } from '@rocket.chat/core-typings';

import { showConnecting } from './utils';
import { settings } from '../../../settings/server';

export const getInquirySortMechanismSetting = (): OmnichannelSortingMechanismSettingType =>
	settings.get<OmnichannelSortingMechanismSettingType>('Omnichannel_sorting_mechanism') || OmnichannelSortingMechanismSettingType.Timestamp;

export async function getInitSettings() {
	const validSettings = [
		'Livechat_title',
		'Livechat_title_color',
		'Livechat_enable_message_character_limit',
		'Livechat_message_character_limit',
		'Message_MaxAllowedSize',
		'Livechat_enabled',
		'Livechat_registration_form',
		'Livechat_allow_switching_departments',
		'Livechat_offline_title',
		'Livechat_offline_title_color',
		'Livechat_offline_message',
		'Livechat_offline_success_message',
		'Livechat_offline_form_unavailable',
		'Livechat_display_offline_form',
		'Omnichannel_call_provider',
		'Language',
		'Livechat_enable_transcript',
		'Livechat_transcript_message',
		'Livechat_fileupload_enabled',
		'FileUpload_Enabled',
		'Livechat_conversation_finished_message',
		'Livechat_conversation_finished_text',
		'Livechat_name_field_registration_form',
		'Livechat_email_field_registration_form',
		'Livechat_registration_form_message',
		'Livechat_force_accept_data_processing_consent',
		'Livechat_data_processing_consent_text',
		'Livechat_show_agent_info',
		'Livechat_clear_local_storage_when_chat_ended',
		'Livechat_history_monitor_type',
		'Livechat_hide_system_messages',
		'Livechat_widget_position',
		'Livechat_background',
		'Assets_livechat_widget_logo',
		'Livechat_hide_watermark',
		'Omnichannel_allow_visitors_to_close_conversation',
	] as const;

	type SettingTypes = (typeof validSettings)[number] | 'Livechat_Show_Connecting';

	const rcSettings = validSettings.reduce<Record<SettingTypes, string | boolean>>((acc, setting) => {
		acc[setting] = settings.get(setting);
		return acc;
	}, {} as any);

	rcSettings.Livechat_Show_Connecting = showConnecting();

	return rcSettings;
}
