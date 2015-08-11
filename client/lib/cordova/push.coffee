if Meteor.isCordova
	Push.addListener 'token', (token) ->
		Meteor.call 'log', 'CLIENT', 'token', arguments

	Push.addListener 'error', (err) ->
		Meteor.call 'log', 'CLIENT', 'error', arguments
		if error.type == 'apn.cordova'
			Meteor.call 'log', 'CLIENT', err.error

	Push.addListener 'register', (evt) ->
		Meteor.call 'log', 'CLIENT', 'register', arguments

	Push.addListener 'alert', (notification) ->
		Meteor.call 'log', 'CLIENT', 'alert', arguments

	Push.addListener 'sound', (notification) ->
		Meteor.call 'log', 'CLIENT', 'sound', arguments

	Push.addListener 'badge', (notification) ->
		Meteor.call 'log', 'CLIENT', 'badge', arguments

	Push.addListener 'startup', (notification) ->
		Meteor.call 'log', 'CLIENT', 'startup', arguments

		if notification.open is true and notification.payload?.rid?
			FlowRouter.go 'room', _id: notification.payload.rid

	Push.addListener 'message', (notification) ->
		Meteor.call 'log', 'CLIENT', 'message', arguments

	Tracker.autorun ->
		if RocketChat.settings.get('Push_enable') is true
			Push.Configure
				gcm:
					projectNumber: RocketChat.settings.get 'Push_gcm_project_number'
				badge: true
				sound: true
				alert: true
				vibrate: true
