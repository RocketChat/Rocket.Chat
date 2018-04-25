import _ from 'underscore';

import LivechatVisitors from '../models/LivechatVisitors';

Meteor.methods({
	'livechat:getInitialData'(visitorToken) {
		const info = {
			enabled: null,
			title: null,
			color: null,
			registrationForm: null,
			room: null,
			visitor: null,
			triggers: [],
			departments: [],
			allowSwitchingDepartments: null,
			online: true,
			offlineColor: null,
			offlineMessage: null,
			offlineSuccessMessage: null,
			offlineUnavailableMessage: null,
			displayOfflineForm: null,
			videoCall: null,
			conversationFinishedMessage: null
		};

		const room = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				v: 1,
				servedBy: 1
			}
		}).fetch();

		if (room && room.length > 0) {
			info.room = room[0];
		}

		const visitor = LivechatVisitors.getVisitorByToken(visitorToken, {
			fields: {
				name: 1,
				username: 1,
				visitorEmails: 1
			}
		});

		if (room) {
			info.visitor = visitor;
		}

		const initSettings = RocketChat.Livechat.getInitSettings();

		info.title = initSettings.Livechat_title;
		info.color = initSettings.Livechat_title_color;
		info.enabled = initSettings.Livechat_enabled;
		info.registrationForm = initSettings.Livechat_registration_form;
		info.offlineTitle = initSettings.Livechat_offline_title;
		info.offlineColor = initSettings.Livechat_offline_title_color;
		info.offlineMessage = initSettings.Livechat_offline_message;
		info.offlineSuccessMessage = initSettings.Livechat_offline_success_message;
		info.offlineUnavailableMessage = initSettings.Livechat_offline_form_unavailable;
		info.displayOfflineForm = initSettings.Livechat_display_offline_form;
		info.language = initSettings.Language;
		info.videoCall = initSettings.Livechat_videocall_enabled === true && initSettings.Jitsi_Enabled === true;
		info.transcript = initSettings.Livechat_enable_transcript;
		info.transcriptMessage = initSettings.Livechat_transcript_message;
		info.conversationFinishedMessage = initSettings.Livechat_conversation_finished_message;

		info.agentData = room && room[0] && room[0].servedBy && RocketChat.models.Users.getAgentInfo(room[0].servedBy._id);

		RocketChat.models.LivechatTrigger.findEnabled().forEach((trigger) => {
			info.triggers.push(_.pick(trigger, '_id', 'actions', 'conditions'));
		});

		RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach((department) => {
			info.departments.push(department);
		});
		info.allowSwitchingDepartments = initSettings.Livechat_allow_switching_departments;

		info.online = RocketChat.models.Users.findOnlineAgents().count() > 0;

		return info;
	}
});
