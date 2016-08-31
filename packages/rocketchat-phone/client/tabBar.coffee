Meteor.startup ->
	enabled = RocketChat.settings.get('Phone_Enabled')
	if enabled is true and !Meteor.isCordova
		RocketChat.TabBar.addButton({
			groups: ['channel', 'privategroup', 'directmessage'],
			id: 'phone',
			i18nTitle: 'Phone',
			icon: 'icon-phone',
			template: 'phone',
			order: 10
		})

