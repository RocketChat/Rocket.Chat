Meteor.startup ->
	el = $('#theme-colors')[0]

	connected = Meteor.status().connected
	Tracker.autorun ->
		if connected is false and Meteor.status().connected is true
			el.href = el.href.replace(/\?.*$/, '') + '?_dc=' + Random.id()

		connected = Meteor.status().connected
