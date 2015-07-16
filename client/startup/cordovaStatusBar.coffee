Meteor.startup ->
	if Meteor.isCordova
		StatusBar.hide()
