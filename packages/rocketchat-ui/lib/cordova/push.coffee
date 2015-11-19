if Meteor.isCordova
	window.addEventListener 'push-notification', (evt) ->
		Meteor.call 'log', 'CLIENT', 'startup', arguments

		notification = evt.detail

		if notification.additionalData.foreground is true
			return

		if notification.additionalData.ejson?.rid?
			switch notification.additionalData.ejson.type
				when 'c'
					FlowRouter.go 'channel', name: notification.additionalData.ejson.name
				when 'p'
					FlowRouter.go 'group', name: notification.additionalData.ejson.name
				when 'd'
					FlowRouter.go 'direct', username: notification.additionalData.ejson.sender.username


	Tracker.autorun ->
		if RocketChat.settings.get('Push_enable') is true and Meteor.userId()?
			android_senderID = RocketChat.settings.get 'Push_gcm_project_number'
			if android_senderID?
				localStorage.setItem 'android_senderID', android_senderID

			if window.pushToken?
				data =
					id: localStorage.getItem 'push_stored_id'
					token: window.pushToken,
					appName: 'main',
					userId: Meteor.userId()
					metadata: undefined

				Meteor.call 'raix:push-update', data, (err, result) ->
					console.log err, result
					if not err? and result?
						localStorage.setItem 'push_stored_id', result._id
