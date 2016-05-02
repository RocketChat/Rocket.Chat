Meteor.methods({
	'livechat:getInitialData'(visitorToken) {
		var info = {
			enabled: null,
			title: null,
			color: null,
			registrationForm: null,
			room: null,
			triggers: [],
			departments: []
		};

		const room = RocketChat.models.Rooms.findByVisitorToken(visitorToken, {
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

		RocketChat.models.Settings.findNotHiddenPublic([
			'Livechat_title',
			'Livechat_title_color',
			'Livechat_enabled',
			'Livechat_registration_form'
		]).forEach((setting) => {
			if (setting._id === 'Livechat_title') {
				info.title = setting.value;
			} else if (setting._id === 'Livechat_title_color') {
				info.color = setting.value;
			} else if (setting._id === 'Livechat_enabled') {
				info.enabled = setting.value;
			} else if (setting._id === 'Livechat_registration_form') {
				info.registrationForm = setting.value;
			}
		});

		RocketChat.models.LivechatTrigger.find().forEach((trigger) => {
			info.triggers.push(trigger);
		});

		RocketChat.models.LivechatDepartment.findEnabledWithAgents().forEach((department) => {
			info.departments.push(department);
		});

		return info;
	}
});
