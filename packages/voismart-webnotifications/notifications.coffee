@WebNotifications = new class
	callbacks: {}
	fallback: KonchatNotification
	enabled: false

	registerCallbacks: (prefix, cbs) ->
		for c in cbs
			@callbacks["#{prefix}::#{c.name}"] = c.callback

	start: ->
		if navigator.serviceWorker and !Meteor.isCordova
			console.debug 'Service Worker is supported'
			navigator.serviceWorker.addEventListener 'message', (event) =>
				cb = @callbacks[event.data]
				if cb
					cb()
				else
					console.warn('no callback defined')

			navigator.serviceWorker.register('/notifications_serviceworker.js').then((reg) =>
				console.info 'loaded notifications serviceworker', reg
				@enabled = true
			).catch((err) ->
				console.error 'errror loading notifications serviceworker', err
			)

		else
			@enabled = false
			console.info 'Service Worker is not supported'

	_showNotification: (notification) ->
		Notification.requestPermission((result) ->
			if result == 'granted'
				navigator.serviceWorker.ready.then((registration) ->
					registration.showNotification(notification.title, {
						body: notification.text or '',
						actions: notification.actions,
						icon: notification.icon,
						tag: notification.prefix
					})
				).catch((err) ->
					console.error 'error showing notification', err
				)
		)

	showNotification: (notification) ->
		try
			if @enabled
				for action in notification.actions
					action.action = notification.prefix + '::' + action.action

				if notification.payload?.sender?.username
					getAvatarAsPng notification.payload.sender.username, (data) =>
						notification.icon = data
						@_showNotification(notification)
				else
					@_showNotification(notification)
			else
				@fallback?.showDesktop(notification)
		catch error
			console.error "error showing notification", error


Meteor.startup ->
	WebNotifications.start()
