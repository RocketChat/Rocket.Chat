@WebNotifications = new class
	callbacks: {}
	fallback: KonchatNotification

	registerCallbacks: (prefix, cbs) ->
		for c in cbs
			@callbacks["#{prefix}::#{c.name}"] = c.callback

	start: ->
		if navigator.serviceWorker and !Meteor.isCordova
			console.debug 'Service Worker is supported'
			@enabled = true
			navigator.serviceWorker.addEventListener 'message', (event) =>
				cb = @callbacks[event.data]
				if cb
					cb()
				else
					console.warn('no callback defined')

			navigator.serviceWorker.register('/notifications_serviceworker.js').then((reg) ->
				console.info 'loaderd notifications serviceworker', reg
			).catch((err) ->
				console.log 'errro loading notifications serviceworker', err
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
			@fallback?(notification)


Meteor.startup ->
	WebNotifications.start()
