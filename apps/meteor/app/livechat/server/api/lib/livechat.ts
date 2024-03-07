import type {
	ILivechatAgent,
	ILivechatDepartment,
	ILivechatTrigger,
	ILivechatVisitor,
	IOmnichannelRoom,
	SelectedAgent,
} from '@rocket.chat/core-typings';
import { License } from '@rocket.chat/license';
import { EmojiCustom, LivechatTrigger, LivechatVisitors, LivechatRooms, LivechatDepartment } from '@rocket.chat/models';
import { Random } from '@rocket.chat/random';
import { Meteor } from 'meteor/meteor';

import { callbacks } from '../../../../../lib/callbacks';
import { i18n } from '../../../../../server/lib/i18n';
import { normalizeAgent } from '../../lib/Helper';
import { Livechat as LivechatTyped } from '../../lib/LivechatTyped';

export function online(department: string, skipSettingCheck = false, skipFallbackCheck = false): Promise<boolean> {
	return LivechatTyped.online(department, skipSettingCheck, skipFallbackCheck);
}

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
): Promise<Pick<ILivechatDepartment, '_id' | 'name' | 'showOnRegistration' | 'showOnOfflineForm'>[]> {
	// TODO: check this function usage
	return (
		await (
			await LivechatDepartment.findEnabledWithAgentsAndBusinessUnit(businessUnit, {
				_id: 1,
				name: 1,
				showOnRegistration: 1,
				showOnOfflineForm: 1,
			})
		).toArray()
	).map(({ _id, name, showOnRegistration, showOnOfflineForm }) => ({
		_id,
		name,
		showOnRegistration,
		showOnOfflineForm,
	}));
}

export function findGuest(token: string): Promise<ILivechatVisitor | null> {
	return LivechatVisitors.getVisitorByToken(token, {
		projection: {
			name: 1,
			username: 1,
			token: 1,
			visitorEmails: 1,
			department: 1,
			activity: 1,
		},
	});
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
export function getRoom({
	guest,
	rid,
	roomInfo,
	agent,
	extraParams,
}: {
	guest: ILivechatVisitor;
	rid: string;
	roomInfo: {
		source?: IOmnichannelRoom['source'];
	};
	agent?: SelectedAgent;
	extraParams?: Record<string, any>;
}): Promise<{ room: IOmnichannelRoom; newRoom: boolean }> {
	const token = guest?.token;

	const message = {
		_id: Random.id(),
		rid,
		msg: '',
		token,
		ts: new Date(),
	};

	return LivechatTyped.getRoom(guest, message, roomInfo, agent, extraParams);
}

export async function findAgent(agentId?: string): Promise<void | { hiddenInfo: boolean } | ILivechatAgent> {
	return normalizeAgent(agentId);
}

export function normalizeHttpHeaderData(headers: Record<string, string | string[] | undefined> = {}): {
	httpHeaders: Record<string, string | string[] | undefined>;
} {
	const httpHeaders = Object.assign({}, headers);
	return { httpHeaders };
}

export async function settings({ businessUnit = '' }: { businessUnit?: string } = {}): Promise<Record<string, string | number | any>> {
	// Putting this ugly conversion while we type the livechat service
	const initSettings = await LivechatTyped.getInitSettings();
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
			livechatLogo: initSettings.Assets_livechat_widget_logo,
			hideWatermark: initSettings.Livechat_hide_watermark || false,
		},
		theme: {
			title: initSettings.Livechat_title,
			color: initSettings.Livechat_title_color,
			offlineTitle: initSettings.Livechat_offline_title,
			offlineColor: initSettings.Livechat_offline_title_color,
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
