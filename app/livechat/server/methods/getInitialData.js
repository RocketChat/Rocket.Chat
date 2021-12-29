import { Meteor } from 'meteor/meteor';
import _ from 'underscore';

import { LivechatRooms, Users, LivechatDepartment, LivechatVisitors } from '../../../models/server';
import { LivechatTrigger } from '../../../models/server/raw';
import { Livechat } from '../lib/Livechat';
import { deprecationWarning } from '../../../api/server/helpers/deprecationWarning';

Meteor.methods({
	async 'livechat:getInitialData'(visitorToken, departmentId) {
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
			fileUpload: null,
			conversationFinishedMessage: null,
			conversationFinishedText: null,
			nameFieldRegistrationForm: null,
			emailFieldRegistrationForm: null,
			registrationFormMessage: null,
			showConnecting: false,
		};

		const options = {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				v: 1,
				servedBy: 1,
				departmentId: 1,
			},
		};
		const room = departmentId
			? LivechatRooms.findOpenByVisitorTokenAndDepartmentId(visitorToken, departmentId, options).fetch()
			: LivechatRooms.findOpenByVisitorToken(visitorToken, options).fetch();
		if (room && room.length > 0) {
			info.room = room[0];
		}

		const visitor = LivechatVisitors.getVisitorByToken(visitorToken, {
			fields: {
				name: 1,
				username: 1,
				visitorEmails: 1,
				department: 1,
			},
		});

		if (room) {
			info.visitor = visitor;
		}

		const initSettings = Livechat.getInitSettings();

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
		info.videoCall = initSettings.Omnichannel_call_provider === 'Jitsi' && initSettings.Jitsi_Enabled === true;
		info.fileUpload = initSettings.Livechat_fileupload_enabled && initSettings.FileUpload_Enabled;
		info.transcript = initSettings.Livechat_enable_transcript;
		info.transcriptMessage = initSettings.Livechat_transcript_message;
		info.conversationFinishedMessage = initSettings.Livechat_conversation_finished_message;
		info.conversationFinishedText = initSettings.Livechat_conversation_finished_text;
		info.nameFieldRegistrationForm = initSettings.Livechat_name_field_registration_form;
		info.emailFieldRegistrationForm = initSettings.Livechat_email_field_registration_form;
		info.registrationFormMessage = initSettings.Livechat_registration_form_message;
		info.showConnecting = initSettings.Livechat_Show_Connecting;

		info.agentData = room && room[0] && room[0].servedBy && Users.getAgentInfo(room[0].servedBy._id);

		await LivechatTrigger.findEnabled().forEach((trigger) => {
			info.triggers.push(_.pick(trigger, '_id', 'actions', 'conditions', 'runOnce'));
		});

		LivechatDepartment.findEnabledWithAgents().forEach((department) => {
			info.departments.push(department);
		});
		info.allowSwitchingDepartments = initSettings.Livechat_allow_switching_departments;

		info.online = Users.findOnlineAgents().count() > 0;

		return deprecationWarning({
			endpoint: 'livechat:getInitialData',
			versionWillBeRemoved: '5.0',
			response: info,
		});
	},
});
