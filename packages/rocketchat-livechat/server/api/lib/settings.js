import _ from 'underscore';
import LivechatVisitors from '../../models/LivechatVisitors';

export default {

	online() {
		return RocketChat.models.Users.findOnlineAgents().count() > 0;
	},

	triggers() {
		return RocketChat.models.LivechatTrigger.findEnabled().fetch().map(trigger => _.pick(trigger, '_id', 'actions', 'conditions'));
	},

	departments() {
		return RocketChat.models.LivechatDepartment.findEnabledWithAgents().fetch().map(department => _.pick(department, '_id', 'name', 'showOnRegistration'));
	},

	visitor(visitorToken) {
		return LivechatVisitors.getVisitorByToken(visitorToken, {
			fields: {
				name: 1,
				username: 1,
				department: 1,
				token: 1
			}
		});
	},

	room(visitorToken, departmentId) {
		let room;
		const roomInfo = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
			fields: {
				servedBy: 1
			}
		}).fetch();

		if (roomInfo && roomInfo.length > 0) {
			room = roomInfo[0];
		}

		return room;
	},

	config() {
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
				transcript: initSettings.Livechat_enable_transcript
			},
			theme: {
				title: initSettings.Livechat_title,
				color: initSettings.Livechat_title_color,
				offlineTitle: initSettings.Livechat_offline_title,
				offlineColor: initSettings.Livechat_offline_title_color
			},
			messages: {
				offlineMessage: initSettings.Livechat_offline_message,
				offlineSuccessMessage: initSettings.Livechat_offline_success_message,
				offlineUnavailableMessage: initSettings.Livechat_offline_form_unavailable,
				conversationFinishedMessage: initSettings.Livechat_conversation_finished_message,
				transcriptMessage: initSettings.Livechat_transcript_message
			}
		};
	}
};
