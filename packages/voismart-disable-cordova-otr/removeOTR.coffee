Meteor.startup ->
	if Meteor.isCordova
		RocketChat.OTR.enabled.set(false)
		RocketChat.TabBar.removeButton('otr')
