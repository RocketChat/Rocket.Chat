Meteor.startup ->
	Tracker.autorun ->
		if RocketChat.settings.get('Chatops_Enabled')
			console.log 'Adding chatops to tabbar'
			RocketChat.TabBar.addButton
				groups: ['channel', 'privategroup', 'directmessage']
				id: 'chatops-button2'
				i18nTitle: 'rocketchat-chatops:Chatops_Title'
				icon: 'octicon octicon-hubot'
				template: 'chatops-dynamicUI'
				order: 4

			console.log 'Adding chatops to tabbar'
			RocketChat.TabBar.addButton
				groups: ['channel', 'privategroup', 'directmessage']
				id: 'chatops-button3'
				i18nTitle: 'rocketchat-chatops:Chatops_Title'
				icon: 'octicon octicon-inbox'
				template: 'chatops_droneflight'
				width: 675
				order: 5
		else
			RocketChat.TabBar.removeButton 'chatops-button2'
			RocketChat.TabBar.removeButton 'chatops-button3'
