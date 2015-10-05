updateTheme = ->
	el = $('#theme-colors')[0]
	el.href = el.href.replace(/\?.*$/, '') + '?_dc=' + Random.id()

Meteor.startup ->
	connected = Meteor.status().connected
	Tracker.autorun ->
		if connected is false and Meteor.status().connected is true
			updateTheme()

		connected = Meteor.status().connected

	RocketChat.Notifications.onAll 'theme-updated', ->
		updateTheme()
