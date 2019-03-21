import _ from 'underscore';
import LivechatVisitors from '../../models/LivechatVisitors';

export function online() {
	const onlineAgents = RocketChat.models.Livechat.getOnlineAgents();
	return (onlineAgents && onlineAgents.count() > 0) || RocketChat.settings.get('Livechat_guest_pool_with_no_agents');
}

export function findTriggers() {
	return RocketChat.models.LivechatTrigger.findEnabled().fetch().map((trigger) => _.pick(trigger, '_id', 'actions', 'conditions'));
}

export function findDepartments() {
	return RocketChat.models.LivechatDepartment.findEnabledWithAgents().fetch().map((department) => _.pick(department, '_id', 'name', 'showOnRegistration'));
}

export function findGuest(token) {
	return LivechatVisitors.getVisitorByToken(token, {
		fields: {
			name: 1,
			username: 1,
			token: 1,
		},
	});
}

export function findRoom(token, rid) {
	const fields = {
		departmentId: 1,
		servedBy: 1,
		open: 1,
	};

	if (!rid) {
		return RocketChat.models.Rooms.findLivechatByVisitorToken(token, fields);
	}

	return RocketChat.models.Rooms.findLivechatByIdAndVisitorToken(rid, token, fields);
}

export function getRoom(guest, rid, roomInfo) {
	const token = guest && guest.token;

	const message = {
		_id: Random.id(),
		rid,
		msg: '',
		token,
		ts: new Date(),
	};

	return RocketChat.Livechat.getRoom(guest, message, roomInfo);
}

export function findAgent(agentId) {
	return RocketChat.models.Users.getAgentInfo(agentId);
}

export function settings() {
	const initSettings = RocketChat.Livechat.getInitSettings();

	return {
		enabled: initSettings.Livechat_enabled,
		settings: {
			registrationForm: initSettings.Livechat_registration_form,
			allowSwitchingDepartments: initSettings.Livechat_allow_switching_departments,
			nameFieldRegistrationForm: initSettings.Livechat_name_field_registration_form,
			emailFieldRegistrationForm: initSettings.Livechat_email_field_registration_form,
			displayOfflineForm: initSettings.Livechat_display_offline_form,
			videoCall: initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true,
			fileUpload: initSettings.Livechat_fileupload_enabled && initSettings.FileUpload_Enabled,
			language: initSettings.Language,
			transcript: initSettings.Livechat_enable_transcript,
			historyMonitorType: initSettings.Livechat_history_monitor_type,
		},
		theme: {
			title: initSettings.Livechat_title,
			color: initSettings.Livechat_title_color,
			offlineTitle: initSettings.Livechat_offline_title,
			offlineColor: initSettings.Livechat_offline_title_color,
			actionLinks: [
				{ icon: 'icon-videocam', i18nLabel: 'Accept', method_id: 'createLivechatCall', params: '' },
				{ icon: 'icon-cancel', i18nLabel: 'Decline', method_id: 'denyLivechatCall', params: '' },
			],
		},
		messages: {
			offlineMessage: initSettings.Livechat_offline_message,
			offlineSuccessMessage: initSettings.Livechat_offline_success_message,
			offlineUnavailableMessage: initSettings.Livechat_offline_form_unavailable,
			conversationFinishedMessage: initSettings.Livechat_conversation_finished_message,
			transcriptMessage: initSettings.Livechat_transcript_message,
		},
		survey: {
			items: ['satisfaction', 'agentKnowledge', 'agentResposiveness', 'agentFriendliness'],
			values: ['1', '2', '3', '4', '5'],
		},
	};
}


