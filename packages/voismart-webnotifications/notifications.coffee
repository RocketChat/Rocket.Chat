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
				console.log 'errror loading notifications serviceworker', err
			)

		else
			@enabled = false
			console.info 'Service Worker is not supported'

	testRegisterCallbacks: ->
		@registerCallbacks('phone', [
			{name: 'answer', callback: -> swal('answer')},
			{name: 'hangup', callback: -> swal('hangup')}
		])

	showNotification: (notification) ->
		if @enabled
			for action in notification.actions
				action.action = notification.prefix + '::' + action.action

			Notification.requestPermission((result) ->
				if result == 'granted'
					navigator.serviceWorker.ready.then((registration) ->
						registration.showNotification(notification.title, {
							body: notification.text or '',
							actions: notification.actions,
							icon: notification.icon,
							tag: notification.prefix
						})
					)
			)
		else
			@fallback?.showDesktop(notification)


Meteor.startup ->
	WebNotifications.start()
