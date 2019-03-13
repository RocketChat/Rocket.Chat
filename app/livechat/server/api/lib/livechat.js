import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Users, Rooms, LivechatVisitors, LivechatDepartment, LivechatTrigger } from '/app/models';
import _ from 'underscore';
import { Livechat } from '../../lib/Livechat';

export function online() {
	return Users.findOnlineAgents().count() > 0;
}

export function findTriggers() {
	return LivechatTrigger.findEnabled().fetch().map((trigger) => _.pick(trigger, '_id', 'actions', 'conditions', 'runOnce'));
}

export function findDepartments() {
	return LivechatDepartment.findEnabledWithAgents().fetch().map((department) => _.pick(department, '_id', 'name', 'showOnRegistration'));
}

export function findGuest(token) {
	return LivechatVisitors.getVisitorByToken(token, {
		fields: {
			name: 1,
			username: 1,
			token: 1,
			visitorEmails: 1,
			department: 1,
		},
	});
}

export function findRoom(token, rid) {
	const fields = {
		t: 1,
		departmentId: 1,
		servedBy: 1,
		open: 1,
	};

	if (!rid) {
		return Rooms.findLivechatByVisitorToken(token, fields);
	}

	return Rooms.findLivechatByIdAndVisitorToken(rid, token, fields);
}

export function findOpenRoom(token, departmentId) {
	const options = {
		fields: {
			departmentId: 1,
			servedBy: 1,
			open: 1,
		},
	};

	let room;
	const rooms = departmentId ? Rooms.findOpenByVisitorTokenAndDepartmentId(token, departmentId, options).fetch() : Rooms.findOpenByVisitorToken(token, options).fetch();
	if (rooms && rooms.length > 0) {
		room = rooms[0];
	}

	return room;
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

	return Livechat.getRoom(guest, message, roomInfo);
}

export function findAgent(agentId) {
	return Users.getAgentInfo(agentId);
}

export function settings() {
	const initSettings = Livechat.getInitSettings();
	const triggers = findTriggers();
	const departments = findDepartments();
	const sound = `${ Meteor.absoluteUrl() }sounds/chime.mp3`;

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
			forceAcceptDataProcessingConsent: initSettings.Livechat_force_accept_data_processing_consent,
			showConnecting: initSettings.Livechat_Show_Connecting,
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
		},
	};
}


