Meteor.startup ->
	Tracker.autorun ->
		RocketChat.TabBar.addButton({
			groups: ['channel', 'privategroup', 'directmessage'],
			id: 'skype_integration',
			i18nTitle: 'Skype_Integration',
			icon: 'icon-skype',
			template: 'skypeIntegration',
			order: 20
		})
