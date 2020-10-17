import URL from 'url';

import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import _ from 'underscore';

import { LivechatRooms, LivechatVisitors, LivechatDepartment, LivechatTrigger, LivechatFilter } from '../../../../models';
import { Livechat } from '../../lib/Livechat';
import { callbacks } from '../../../../callbacks/server';
import { normalizeAgent } from '../../lib/Helper';
import { Apps, AppEvents } from '../../../../apps/server';

export function online(department) {
	return Livechat.online(department);
}

export function findFilters() {
	return LivechatFilter.findEnabled().fetch().map((trigger) => _.pick(trigger, '_id', 'regex', 'slug'));
}

export function findTriggers() {
	return LivechatTrigger.findEnabled().fetch().map((trigger) => _.pick(trigger, '_id', 'actions', 'conditions', 'runOnce'));
}

export function findDepartments() {
	return LivechatDepartment.findEnabledWithAgents().fetch().map((department) => _.pick(department, '_id', 'name', 'showOnRegistration', 'showOnOfflineForm'));
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
		v: 1,
		ts: 1,
	};

	if (!rid) {
		return LivechatRooms.findOneByVisitorToken(token, fields);
	}

	return LivechatRooms.findOneByIdAndVisitorToken(rid, token, fields);
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
	const rooms = departmentId ? LivechatRooms.findOpenByVisitorTokenAndDepartmentId(token, departmentId, options).fetch() : LivechatRooms.findOpenByVisitorToken(token, options).fetch();
	if (rooms && rooms.length > 0) {
		room = rooms[0];
	}

	if (room) {
		Livechat.addTypingListener(room._id, _.debounce((username, typing) => {
			Apps.triggerEvent(AppEvents.IRoomUserTyping, { roomId: room._id, username, typing });
		}, 4000, true));
	}
	return room;
}

export function getRoom({ guest, rid, roomInfo, agent, extraParams }) {
	const token = guest && guest.token;

	const message = {
		_id: Random.id(),
		rid,
		msg: '',
		token,
		ts: new Date(),
	};

	Livechat.addTypingListener(rid, _.debounce((username, typing) => {
		Apps.triggerEvent(AppEvents.IRoomUserTyping, { roomId: rid, username, typing });
	}, 4000, true),
	);

	return Livechat.getRoom(guest, message, roomInfo, agent, extraParams);
}

export function findAgent(agentId) {
	return normalizeAgent(agentId);
}

export function normalizeHttpHeaderData(headers = {}) {
	const httpHeaders = Object.assign({}, headers);
	return { httpHeaders };
}

export function settings(url) {
	const initSettings = Livechat.getInitSettings();
	const triggers = findTriggers();
	const filters = findFilters();
	const departments = findDepartments();
	const sound = `${ Meteor.absoluteUrl() }sounds/chime.mp3`;
	const emojis = Meteor.call('listEmojiCustom');

	const shouldShowRegistrationForm = () => {
		if (!url) {
			return initSettings.Livechat_registration_form;
		}

		let skipOnDomainList = initSettings.Livechat_skip_registration_form_DomainsList;
		skipOnDomainList = (!_.isEmpty(skipOnDomainList.trim()) && _.map(skipOnDomainList.split(','), function(domain) {
			return domain.trim();
		})) || [];

		const urlObject = URL.parse(url);
		const { hostname: urlHost, pathname: urlPath } = urlObject;

		const matchedDomain = skipOnDomainList.find((domain) => {
			if (!domain.match(/^[a-zA-Z]+:\/\//)) {
				domain = `http://${ domain }`;
			}
			const domainUrlObject = URL.parse(domain);
			const { hostname: domainHost, pathname: domainPath } = domainUrlObject;

			if (domainPath !== '/') {
				return domainHost.includes(urlHost) && (domainPath === urlPath);
			}
			return domainHost.includes(urlHost);
		});

		return initSettings.Livechat_registration_form && !matchedDomain;
	};

	return {
		enabled: initSettings.Livechat_enabled,
		settings: {
			registrationForm: shouldShowRegistrationForm(),
			allowSwitchingDepartments: initSettings.Livechat_allow_switching_departments,
			nameFieldRegistrationForm: initSettings.Livechat_name_field_registration_form,
			emailFieldRegistrationForm: initSettings.Livechat_email_field_registration_form,
			guestDefaultAvatar: initSettings.Assets_livechat_guest_default_avatar,
			displayOfflineForm: initSettings.Livechat_display_offline_form,
			videoCall: initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true,
			fileUpload: initSettings.Livechat_fileupload_enabled && initSettings.FileUpload_Enabled,
			language: initSettings.Language,
			transcript: initSettings.Livechat_enable_transcript,
			historyMonitorType: initSettings.Livechat_history_monitor_type,
			forceAcceptDataProcessingConsent: initSettings.Livechat_force_accept_data_processing_consent,
			showConnecting: initSettings.Livechat_Show_Connecting,
			agentHiddenInfo: initSettings.Livechat_show_agent_info === false,
			limitTextLength: initSettings.Livechat_enable_message_character_limit
			&& (initSettings.Livechat_message_character_limit || initSettings.Message_MaxAllowedSize),
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
		filters,
		departments,
		resources: {
			sound,
			emojis,
		},
	};
}

export async function getExtraConfigInfo(room) {
	return callbacks.run('livechat.onLoadConfigApi', { room });
}

export function onCheckRoomParams(params) {
	return callbacks.run('livechat.onCheckRoomApiParams', params);
}
