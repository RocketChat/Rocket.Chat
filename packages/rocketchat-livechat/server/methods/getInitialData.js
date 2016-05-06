Meteor.methods({
	'livechat:getInitialData'(visitorToken) {
		var info = {
			enabled: null,
			title: null,
			color: null,
			registrationForm: null,
			room: null,
			triggers: [],
			departments: [],
			online: true,
			offlineColor: null,
			offlineMessage: null
		};

		const room = RocketChat.models.Rooms.findOpenByVisitorToken(visitorToken, {
			fields: {
				name: 1,
				t: 1,
				cl: 1,
				u: 1,
				usernames: 1,
				v: 1
			}
		}).fetch();

		if (room && room.length > 0) {
			info.room = room[0];
		}

		const initSettings = RocketChat.Livechat.getInitSettings();

		info.title = initSettings.Livechat_title;
		info.color = initSettings.Livechat_title_color;
		info.enabled = initSettings.Livechat_enabled;
		info.registrationForm = initSettings.Livechat_registration_form;
		info.offlineTitle = initSettings.Livechat_offline_title;
		info.offlineColor = initSettings.Livechat_offline_title_color;
		info.offlineMessage = initSettings.Livechat_offline_message;

		RocketChat.models.LivechatTrigger.find().forEach((trigger) => {
			info.triggers.push(trigger);
		});

		RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach((department) => {
			info.departments.push(department);
		});

		info.online = RocketChat.models.Users.findOnlineAgents().count() > 0;

		return info;
	}
});
