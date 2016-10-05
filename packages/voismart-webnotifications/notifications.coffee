@WebNotifications = new class
	callbacks: {}
	fallback: KonchatNotification
	enabled: false
	_default_tag: '_default_'

	# here will be stored a list of open notifications indexed by tag, so that
	# we have a reference to close them using the closeNotification() method.
	# Currently the reference is not removed on notification click or when it
	# is hidden after the timeout, but this is not a big deal, since we only
	# keep one reference per tag and no exception is raised when closing an
	# already closed notification.
	_notifications: {}

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
		self = @
		Notification.requestPermission((result) ->
			if result == 'granted'
				navigator.serviceWorker.ready.then((registration) ->
					p = registration.showNotification(notification.title, {
						body: notification.text or ''
						actions: notification.actions
						icon: notification.icon
						tag: notification.prefix
						requireInteraction: notification.requireInteraction or false
					}).then(() -> registration.getNotifications()
					).then((notifications) ->
						for n in notifications
							self._notifications[n.tag or self._default_tag] = n
					)
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

	closeNotification: (prefix) ->
		n = @_notifications[prefix or @_default_tag]
		if n
			n.close()
			delete @_notifications[prefix or @_default_tag]


Meteor.startup ->
	WebNotifications.start()
