# @TODO implementar 'clicar na notificacao' abre a janela do chat
@KonchatNotification =
	# notificacoes HTML5
	getDesktopPermission: ->
		if window.Notification && Notification.permission != "granted"
			Notification.requestPermission (status) ->
				if Notification.permission != status
					Notification.permission = status

	# notificacoes HTML5
	showDesktop: (room, msg) ->
		unless Session.equals('user_' + Meteor.userId() + '_status', 'busy')
			roomName = room.name + ' - Rocket.Chat'
			if window.Notification && Notification.permission == "granted"
				n = new Notification roomName,
					icon: '/images/rocket-chat-logo-square.png'
					body: _.stripTags(msg)

				n.onclick = ->
					$('#chat-window-' + room._id + '.chat-window .chat-title').click()

				setTimeout ->
					n.close()
				, 2000

	newMessage: ->
		unless Session.equals('user_' + Meteor.userId() + '_status', 'busy')
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
			newRoomSound = Session.get('newRoomSound')
			newRoomSound = _.without newRoomSound, rid
			Session.set('newRoomSound', newRoomSound)

		$('.link-room-' + rid).removeClass('new-room-highlight')

Tracker.autorun ->
	if Session.get('newRoomSound')?.length > 0
		unless Session.equals('user_' + Meteor.userId() + '_status', 'busy')
			$('#chatNewRoomNotification').each ->
				this.play()
	else
		$('#chatNewRoomNotification').each ->
			this.pause()
			this.currentTime = 0
