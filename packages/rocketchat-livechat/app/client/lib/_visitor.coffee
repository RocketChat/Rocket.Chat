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

	register: register
	getToken: getToken
	setRoom: setRoom
	getRoom: getRoom
	setRoomToSubscribe: setRoomToSubscribe
	getRoomToSubscribe: getRoomToSubscribe
