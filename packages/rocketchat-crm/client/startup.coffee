Meteor.startup ->
	console.log('startup hooked')

	Meteor.methods
		openPanel: (userId, payload) ->
			if Meteor.userId() is userId
				Session.set('RocketchatCRM-lead', payload);
				RocketChat.TabBar.setTemplate('rocketchatcrm_leads')
				RocketChat.TabBar.openFlex()
