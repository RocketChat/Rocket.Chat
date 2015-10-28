Meteor.startup ->

	RocketChat.callbacks.add 'enter-room', ->
		#if Meteor.user()?.services?.github?.id or Meteor.user()?.services?.gitlab?.id
		# console.log 'Adding chatops to tabbar'
		# RocketChat.TabBar.addButton
		# 	id: 'chatops-button'
		# 	i18nTitle: 'rocketchat-chatops:Chatops_Title'
		# 	icon: 'icon-code'
		# 	template: 'chatops'
		# 	order: 4

		if RocketChat.settings.get('Chatops_Enabled')
			console.log 'Adding chatops to tabbar'
			RocketChat.TabBar.addButton
				id: 'chatops-button2'
				i18nTitle: 'rocketchat-chatops:Chatops_Title'
				icon: 'octicon octicon-hubot'
				template: 'chatops-dynamicUI'
				order: 4

			console.log 'Adding chatops to tabbar'
			RocketChat.TabBar.addButton
				id: 'chatops-button3'
				i18nTitle: 'rocketchat-chatops:Chatops_Title'
				icon: 'octicon octicon-inbox'
				template: 'chatops_droneflight'
				width: 675
				order: 5
	, RocketChat.callbacks.priority.MEDIUM, 'enter-room-tabbar-chatops'
