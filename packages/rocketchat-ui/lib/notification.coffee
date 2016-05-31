# @TODO implementar 'clicar na notificacao' abre a janela do chat
@KonchatNotification =
	notificationStatus: new ReactiveVar

	# notificacoes HTML5
	getDesktopPermission: ->
		if window.Notification && Notification.permission != "granted"
			Notification.requestPermission (status) ->
				KonchatNotification.notificationStatus.set status
				if Notification.permission != status
					Notification.permission = status

	notify: (notification) ->
		if window.Notification && Notification.permission == "granted"
			message = { rid: notification.payload?.rid, msg: notification.text, notification: true }
			RocketChat.promises.run('onClientMessageReceived', message).then (message) ->
				n = new Notification notification.title,
					icon: notification.icon or getAvatarUrlFromUsername notification.payload.sender.username
					body: _.stripTags(message.msg)
					silent: true

				notificationDuration = RocketChat.settings.get('Desktop_Notifications_Duration') * 1000
				if notificationDuration > 0
					setTimeout ( -> n.close() ), notificationDuration

				if notification.payload?.rid?
					n.onclick = ->
						window.focus()
						switch notification.payload.type
							when 'd'
								FlowRouter.go 'direct', {username: notification.payload.sender.username}
							when 'c'
								FlowRouter.go 'channel', {name: notification.payload.name}
							when 'p'
								FlowRouter.go 'group', {name: notification.payload.name}

	showDesktop: (notification) ->
		if not window.document.hasFocus?() and Meteor.user().status isnt 'busy'
			if Meteor.settings.public.sandstorm
				KonchatNotification.notify(notification)
			else
				getAvatarAsPng notification.payload.sender.username, (avatarAsPng) ->
					notification.icon = avatarAsPng
					KonchatNotification.notify(notification)

	newMessage: ->
		if not Session.equals('user_' + Meteor.userId() + '_status', 'busy') and Meteor.user()?.settings?.preferences?.newMessageNotification isnt false
			$('#chatAudioNotification')[0].play()

	newRoom: (rid, withSound = true) ->
		Tracker.nonreactive ->
			newRoomSound = Session.get('newRoomSound')
			if newRoomSound?
				newRoomSound = _.union newRoomSound, rid
			else
				newRoomSound = [rid]

			Session.set('newRoomSound', newRoomSound)

		# $('.link-room-' + rid).addClass('new-room-highlight')

	removeRoomNotification: (rid) ->
		Tracker.nonreactive ->
			Session.set('newRoomSound', [])

		$('.link-room-' + rid).removeClass('new-room-highlight')

Tracker.autorun ->
	if Session.get('newRoomSound')?.length > 0
		Tracker.nonreactive ->
			if not Session.equals('user_' + Meteor.userId() + '_status', 'busy') and Meteor.user()?.settings?.preferences?.newRoomNotification isnt false
				$('#chatNewRoomNotification').each ->
					this.play()
	else
		$('#chatNewRoomNotification').each ->
			this.pause()
			this.currentTime = 0
