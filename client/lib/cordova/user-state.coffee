if Meteor.isCordova
	document.addEventListener 'pause', ->
		Meteor.disconnect()

	document.addEventListener 'resume', ->
		Meteor.reconnect()