Meteor.startup(()=> {
	RocketChat.settings.add('Assistify_Bot_Username', "", {
		group: 'Assistify',
		i18nLabel: 'Assistify_Bot_Username'
	});

	RocketChat.settings.add('Assistify_Bot_Automated_Response_Threshold', 50, {
		group: 'Assistify',
		i18nLabel: 'Assistify_Bot_Automated_Response_Threshold'
	});
});
