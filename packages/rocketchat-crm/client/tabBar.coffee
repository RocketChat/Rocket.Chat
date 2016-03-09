Meteor.startup ->
	Tracker.autorun ->

		console.log 'Adding chatops to tabbar'
		RocketChat.TabBar.addButton
			groups: ['channel', 'privategroup', 'directmessage']
			id: 'chatops-button3'
			i18nTitle: 'rocketchat-crm:CRM_Title'
			icon: 'octicon octicon-inbox'
			template: 'rocketchatcrm_leads'
			order: 10
