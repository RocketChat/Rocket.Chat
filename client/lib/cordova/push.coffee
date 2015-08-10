if Meteor.isCordova
	Tracker.autorun ->
		if RocketChat.settings.get('Push_enable') is true
			Push.Configure {}

			Push.addListener 'token', (token) ->
				Meteor.call 'log', 'token', arguments

			Push.addListener 'error', (err) ->
				Meteor.call 'log', 'error', arguments
				if error.type == 'apn.cordova'
					Meteor.call 'log', err.error

			Push.addListener 'register', (evt) ->
				Meteor.call 'log', 'register', arguments

			Push.addListener 'alert', (notification) ->
				Meteor.call 'log', 'alert', arguments

			Push.addListener 'sound', (notification) ->
				Meteor.call 'log', 'sound', arguments

			Push.addListener 'badge', (notification) ->
				Meteor.call 'log', 'badge', arguments

			Push.addListener 'startup', (notification) ->
				Meteor.call 'log', 'startup', arguments

			Push.addListener 'message', (notification) ->
				Meteor.call 'log', 'message', arguments