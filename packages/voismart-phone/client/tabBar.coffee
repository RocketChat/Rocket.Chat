Meteor.startup ->
	if Meteor.isCordova
		return

	Tracker.autorun ->
		if RocketChat.settings.get('Phone_Enabled')
			RocketChat.TabBar.addButton({
				groups: ['channel', 'group', 'direct'],
				id: 'phone',
				i18nTitle: 'Phone',
				icon: 'icon-phone',
				template: 'phone',
				order: 10
			})
		else
			RocketChat.TabBar.removeButton 'phone'

