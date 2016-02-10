if Meteor.isCordova
	document.addEventListener 'pause', ->
		UserPresence.setAway()
		readMessage.disable()

	document.addEventListener 'resume', ->
		UserPresence.setOnline()
		readMessage.enable()