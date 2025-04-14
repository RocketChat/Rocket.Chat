import type { ILivechatAgent, ILivechatDepartment, ILivechatTrigger, ILivechatVisitor, IOmnichannelRoom } from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { EmojiCustom, LivechatTrigger, LivechatVisitors, LivechatRooms, LivechatDepartment } from '@rocket.chat/models';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { i18n } from '../../../../../server/lib/i18n';
import { normalizeAgent } from '../../lib/Helper';
import { getInitSettings } from '../../lib/settings';

async function findTriggers(): Promise<Pick<ILivechatTrigger, '_id' | 'actions' | 'conditions' | 'runOnce'>[]> {
	const triggers = await LivechatTrigger.findEnabled().toArray();
	const hasLicense = License.hasModule('livechat-enterprise');
	const premiumActions = ['use-external-service'];

	return triggers
		.filter(({ actions }) => hasLicense || actions.some((c) => !premiumActions.includes(c.name)))
		.map(({ _id, actions, conditions, runOnce }) => ({
			_id,
			actions,
			conditions,
			runOnce,
		}));
}

async function findDepartments(
	businessUnit?: string,
): Promise<Pick<ILivechatDepartment, '_id' | 'name' | 'showOnRegistration' | 'showOnOfflineForm' | 'departmentsAllowedToForward'>[]> {
	// TODO: check this function usage
	return (
		await LivechatDepartment.findEnabledWithAgentsAndBusinessUnit<
			Pick<ILivechatDepartment, '_id' | 'name' | 'showOnRegistration' | 'showOnOfflineForm' | 'departmentsAllowedToForward'>
		>(businessUnit, {
			_id: 1,
			name: 1,
			showOnRegistration: 1,
			showOnOfflineForm: 1,
			departmentsAllowedToForward: 1,
		})
	).toArray();
}

export function findGuest(token: string): Promise<ILivechatVisitor | null> {
	return LivechatVisitors.getVisitorByToken(token);
}

export function findGuestWithoutActivity(token: string): Promise<ILivechatVisitor | null> {
	return LivechatVisitors.getVisitorByToken(token, { projection: { name: 1, username: 1, token: 1, visitorEmails: 1, department: 1 } });
}

export async function findRoom(token: string, rid?: string): Promise<IOmnichannelRoom | null> {
	const fields = {
		t: 1,
		departmentId: 1,
		servedBy: 1,
		open: 1,
		v: 1,
		ts: 1,
	};

	if (!rid) {
		return LivechatRooms.findOneByVisitorToken(token, fields);
	}

	return LivechatRooms.findOneByIdAndVisitorToken(rid, token, fields);
}

export async function findOpenRoom(token: string, departmentId?: string): Promise<IOmnichannelRoom | undefined> {
	const options = {
		projection: {
			departmentId: 1,
			servedBy: 1,
			open: 1,
			callStatus: 1,
		},
	};

	const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
	const rooms = departmentId
		? await LivechatRooms.findOpenByVisitorTokenAndDepartmentId(token, departmentId, options, extraQuery).toArray()
		: await LivechatRooms.findOpenByVisitorToken(token, options, extraQuery).toArray();
	if (rooms && rooms.length > 0) {
		return rooms[0];
	}
}

export async function findAgent(agentId?: string): Promise<void | { hiddenInfo: boolean } | ILivechatAgent> {
	return normalizeAgent(agentId);
}

export function normalizeHttpHeaderData(headers: Headers = new Headers()): {
	httpHeaders: Record<string, string | string[] | undefined>;
} {
	const httpHeaders = Object.fromEntries(headers.entries());
	return { httpHeaders };
}

export async function settings({ businessUnit = '' }: { businessUnit?: string } = {}): Promise<Record<string, string | number | any>> {
	// Putting this ugly conversion while we type the livechat service
	const initSettings = await getInitSettings();
	const triggers = await findTriggers();
	const departments = await findDepartments(businessUnit);
	const sound = `${Meteor.absoluteUrl()}sounds/chime.mp3`;
	const emojis = await EmojiCustom.find().toArray();
	return {
		enabled: initSettings.Livechat_enabled,
		settings: {
			registrationForm: initSettings.Livechat_registration_form,
			allowSwitchingDepartments: initSettings.Livechat_allow_switching_departments,
			nameFieldRegistrationForm: initSettings.Livechat_name_field_registration_form,
			emailFieldRegistrationForm: initSettings.Livechat_email_field_registration_form,
			displayOfflineForm: initSettings.Livechat_display_offline_form,
			videoCall: initSettings.Omnichannel_call_provider === 'default-provider',
			fileUpload: initSettings.Livechat_fileupload_enabled && initSettings.FileUpload_Enabled,
			language: initSettings.Language,
			transcript: initSettings.Livechat_enable_transcript,
			historyMonitorType: initSettings.Livechat_history_monitor_type,
			forceAcceptDataProcessingConsent: initSettings.Livechat_force_accept_data_processing_consent,
			showConnecting: initSettings.Livechat_Show_Connecting,
			agentHiddenInfo: initSettings.Livechat_show_agent_info === false,
			clearLocalStorageWhenChatEnded: initSettings.Livechat_clear_local_storage_when_chat_ended,
			limitTextLength:
				initSettings.Livechat_enable_message_character_limit &&
				(initSettings.Livechat_message_character_limit || initSettings.Message_MaxAllowedSize),
			hiddenSystemMessages: initSettings.Livechat_hide_system_messages,
			livechatLogo: initSettings.Assets_livechat_widget_logo,
			hideWatermark: initSettings.Livechat_hide_watermark || false,
			visitorsCanCloseChat: initSettings.Omnichannel_allow_visitors_to_close_conversation,
		},
		theme: {
			title: initSettings.Livechat_title,
			color: initSettings.Livechat_title_color,
			offlineTitle: initSettings.Livechat_offline_title,
			offlineColor: initSettings.Livechat_offline_title_color,
			position: initSettings.Livechat_widget_position || 'right',
			background: initSettings.Livechat_background,
			actionLinks: {
				webrtc: [
					{
						actionLinksAlignment: 'flex-start',
						i18nLabel: 'Join_call',
						label: i18n.t('Join_call'),
						method_id: 'joinLivechatWebRTCCall',
					},
					{
						i18nLabel: 'End_call',
						label: i18n.t('End_call'),
						method_id: 'endLivechatWebRTCCall',
						danger: true,
					},
				],
				jitsi: [
					{ icon: 'icon-videocam', i18nLabel: 'Accept' },
					{ icon: 'icon-cancel', i18nLabel: 'Decline' },
				],
			},
		},
		messages: {
			offlineMessage: initSettings.Livechat_offline_message,
			offlineSuccessMessage: initSettings.Livechat_offline_success_message,
			offlineUnavailableMessage: initSettings.Livechat_offline_form_unavailable,
			conversationFinishedMessage: initSettings.Livechat_conversation_finished_message,
			conversationFinishedText: initSettings.Livechat_conversation_finished_text,
			transcriptMessage: initSettings.Livechat_transcript_message,
			registrationFormMessage: initSettings.Livechat_registration_form_message,
			dataProcessingConsentText: initSettings.Livechat_data_processing_consent_text,
		},
		survey: {
			items: ['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'],
			values: ['1', '2', '3', '4', '5'],
		},
		triggers,
		departments,
		resources: {
			sound,
			emojis,
		},
	};
}

export async function getExtraConfigInfo(room?: IOmnichannelRoom): Promise<any> {
	return callbacks.run('livechat.onLoadConfigApi', { room });
}

// TODO: please forgive me for this. Still finding the good types for these callbacks
export function onCheckRoomParams(params: any): Promise<unknown> {
	return callbacks.run('livechat.onCheckRoomApiParams', params);
}
