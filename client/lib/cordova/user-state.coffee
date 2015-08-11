if Meteor.isCordova
	document.addEventListener 'pause', ->
		UserPresence.setAway()

	document.addEventListener 'resume', ->
		UserPresence.setOnline()