msgStream = new Meteor.Streamer 'room-messages'

@visitor = new class
	token = new ReactiveVar null
	room = new ReactiveVar null
	roomToSubscribe = new ReactiveVar null

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

	getRoomToSubscribe = ->
		return roomToSubscribe.get()

	setRoomToSubscribe = (rid) ->
		room.set(rid)
		return roomToSubscribe.set(rid)

	subscribeToRoom = (roomId) ->
		msgStream.on roomId, (msg) ->
			if msg.t is 'command'
				if msg.msg is 'survey'
					unless $('body #survey').length
						Blaze.render(Template.survey, $('body').get(0))
			else
				ChatMessage.upsert { _id: msg._id }, msg

				# notification sound 
				if Session.equals('sound', true) 
					if msg.u._id isnt Meteor.user()._id
						$('#chatAudioNotification')[0].play();

	register: register
	getToken: getToken
	setRoom: setRoom
	getRoom: getRoom
	setRoomToSubscribe: setRoomToSubscribe
	getRoomToSubscribe: getRoomToSubscribe

	subscribeToRoom: subscribeToRoom
