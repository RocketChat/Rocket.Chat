Meteor.startup ->

	RocketChat.callbacks.add 'enter-room', ->
		if Meteor.user()?.services?.github?.id or Meteor.user()?.services?.gitlab?.id
			console.log 'Adding chatops to tabbar'
			RocketChat.TabBar.addButton
				id: 'chatops-button'
				i18nTitle: 'rocketchat-chatops:Chatops_Title'
				icon: 'icon-code'
				template: 'chatops'
				order: 4
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-chatops'
