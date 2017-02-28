msgStream = new Meteor.Streamer 'room-messages'

@visitor = new class
	token = new ReactiveVar null
	room = new ReactiveVar null
	roomToSubscribe = new ReactiveVar null
	roomSubscribed = null

	register = ->
		if not localStorage.getItem 'visitorToken'
			localStorage.setItem 'visitorToken', Random.id()

		token.set localStorage.getItem 'visitorToken'

	getToken = ->
		return token.get()

	setRoom = (rid) ->
		room.set rid

	getRoom = (createOnEmpty = false) ->
		roomId = room.get()
		if not roomId? and createOnEmpty
			roomId = Random.id()
			room.set roomId

		return roomId

	isSubscribed = (roomId) ->
		return roomSubscribed is roomId

	subscribeToRoom = (roomId) ->
		if roomSubscribed?
			return if roomSubscribed is roomId

		roomSubscribed = roomId

		msgStream.on roomId, (msg) ->
			if msg.t is 'command'
				Commands[msg.msg]?()
			else if msg.t isnt 'livechat_video_call'
				ChatMessage.upsert { _id: msg._id }, msg

				if msg.t is 'livechat-close'
					parentCall('callback', 'chat-ended')

				# notification sound
				if Session.equals('sound', true)
					if msg.u._id isnt Meteor.user()._id
						$('#chatAudioNotification')[0].play();

	register: register
	getToken: getToken
	setRoom: setRoom
	getRoom: getRoom
	subscribeToRoom: subscribeToRoom
	isSubscribed: isSubscribed
