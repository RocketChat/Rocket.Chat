msgStream = new Meteor.Streamer 'room-messages'

@visitor = new class
	token = new ReactiveVar null
	room = new ReactiveVar null
	roomToSubscribe = new ReactiveVar null
	roomState = new ReactiveVar null

	name = new ReactiveVar null
	email = new ReactiveVar null

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

	getRoomState = ->
		return roomState.get()

	setRoomState = (state) ->
		roomState.set state

	subscribeToRoom = (roomId) ->
		msgStream.on roomId, (msg) ->
			if msg.t is 'command'
				console.log msg
				switch msg.msg
					when 'survey'
						unless $('body #survey').length
							Blaze.render(Template.survey, $('body').get(0))
					when 'endCall'
						LivechatVideoCall.finish()
			else if msg.t isnt 'livechat_video_call'
				ChatMessage.upsert { _id: msg._id }, msg

				# notification sound
				if Session.equals('sound', true)
					if msg.u._id isnt Meteor.user()._id
						$('#chatAudioNotification')[0].play();

	getName = ->
		return name.get()

	setName = (n) ->
		name.set(n)

	getEmail = ->
		return email.get()

	setEmail = (e) ->
		email.set(e)


	register: register
	getToken: getToken
	
	setRoom: setRoom
	getRoom: getRoom
	
	setRoomToSubscribe: setRoomToSubscribe
	getRoomToSubscribe: getRoomToSubscribe
	
	getRoomState: getRoomState
	setRoomState: setRoomState
	
	setName: setName
	getName: getName

	setEmail: setEmail
	getEmail: getEmail

	subscribeToRoom: subscribeToRoom
