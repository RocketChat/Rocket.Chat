RocketChat.roomTypes = new class roomTypesClient extends roomTypesCommon
	checkCondition: (roomType) ->
		return not roomType.condition? or roomType.condition()

	getTypes: ->
		orderedTypes = []

		_.sortBy(@roomTypesOrder, 'order').forEach (type) =>
			orderedTypes.push @roomTypes[type.identifier]

		return orderedTypes

	getIcon: (roomType) ->
		return @roomTypes[roomType]?.icon

	getRoomName: (roomType, roomData) ->
		return @roomTypes[roomType]?.roomName roomData

	getIdentifiers: (except) ->
		except = [].concat except
		list = _.reject @roomTypesOrder, (t) -> return except.indexOf(t.identifier) isnt -1
		return _.map list, (t) -> return t.identifier

	findRoom: (roomType, identifier, user) ->
		return @roomTypes[roomType]?.findRoom identifier, user

	canSendMessage: (roomId) ->
		return ChatSubscription.find({ rid: roomId }).count() > 0

	readOnly: (roomId, user) ->

		fields = { ro: 1 }

		# if a user has been specified then we want to see if that user has been muted in the room
		if user
			fields.muted = 1

		room = ChatRoom.findOne({ _id: roomId }, fields : fields)

		unless user
			return room?.ro;

		return room?.ro is true and Array.isArray(room?.muted) and room?.muted.indexOf(user.username) != -1

	archived: (roomId) ->
		fields = { archived: 1 }

		room = ChatRoom.findOne({ _id: roomId }, fields : fields)

		return room?.archived is true

	verifyCanSendMessage: (roomId) ->
		room = ChatRoom.findOne({ _id: roomId }, { fields: { t: 1 } })
		return if not room?.t?

		roomType = room.t

		return @roomTypes[roomType]?.canSendMessage roomId if @roomTypes[roomType]?.canSendMessage?

		return @canSendMessage roomId

	verifyShowJoinLink: (roomId) ->
		room = ChatRoom.findOne({ _id: roomId }, { fields: { t: 1 } })
		return if not room?.t?

		roomType = room.t

		if not @roomTypes[roomType]?.showJoinLink?
			return false

		return @roomTypes[roomType].showJoinLink roomId

	getNotSubscribedTpl: (roomId) ->
		room = ChatRoom.findOne({ _id: roomId }, { fields: { t: 1 } })
		return if not room?.t?

		roomType = room.t

		if not @roomTypes[roomType]?.notSubscribedTpl?
			return false

		return @roomTypes[roomType].notSubscribedTpl
