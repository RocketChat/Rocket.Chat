loadMissedMessages = (rid) ->
	lastMessage = ChatMessage.findOne({rid: 'GENERAL'}, {sort: {ts: -1}, limit: 1})
	if not lastMessage?
		return

	Meteor.call 'loadMissedMessages', rid, lastMessage.ts, (err, result) ->
		ChatMessage.upsert {_id: item._id}, item for item in result

connectionWasOnline = true
Tracker.autorun ->
	connected = Meteor.connection.status().connected

	if connected is true and connectionWasOnline is false and RoomManager.openedRooms?
		for key, value of RoomManager.openedRooms
			if value.rid?
				loadMissedMessages(value.rid)

	connectionWasOnline = connected


Meteor.startup ->
	ChatMessage.find().observe
		removed: (record) ->
			recordBefore = ChatMessage.findOne {ts: {$lt: record.ts}}, {sort: {ts: -1}}
			if recordBefore?
				ChatMessage.update {_id: recordBefore._id}, {$set: {tick: new Date}}

			recordAfter = ChatMessage.findOne {ts: {$gt: record.ts}}, {sort: {ts: 1}}
			if recordAfter?
				ChatMessage.update {_id: recordAfter._id}, {$set: {tick: new Date}}


@RoomManager = new class
	defaultTime = 600000 # 10 minutes
	openedRooms = {}
	subscription = null
	msgStream = new Meteor.Stream 'messages'
	deleteMsgStream = new Meteor.Stream 'delete-message'
	onlineUsers = new ReactiveVar {}

	Dep = new Tracker.Dependency

	init = ->
		subscription = Meteor.subscribe('subscription')
		return subscription

	close = (typeName) ->
		if openedRooms[typeName]
			if openedRooms[typeName].sub?
				for sub in openedRooms[typeName].sub
					sub.stop()

			if openedRooms[typeName].rid?
				msgStream.removeListener openedRooms[typeName].rid
				deleteMsgStream.removeListener openedRooms[typeName].rid

			openedRooms[typeName].ready = false
			openedRooms[typeName].active = false
			delete openedRooms[typeName].timeout
			delete openedRooms[typeName].dom

			if openedRooms[typeName].rid?
				RoomHistoryManager.clear openedRooms[typeName].rid
				ChatMessage.remove rid: openedRooms[typeName].rid

	computation = Tracker.autorun ->
		for typeName, record of openedRooms when record.active is true
			do (typeName, record) ->
				record.sub = [
					Meteor.subscribe 'room', typeName
					# Meteor.subscribe 'messages', typeName
				]

				record.ready = record.sub[0].ready()
				# record.ready = record.sub[0].ready() and record.sub[1].ready()

				if record.ready is true
					type = typeName.substr(0, 1)
					name = typeName.substr(1)

					query =
						t: type

					if type in ['c', 'p']
						query.name = name
					else if type is 'd'
						query.usernames = $all: [Meteor.user().username, name]

					room = ChatRoom.findOne query, { reactive: false }

					if room?
						openedRooms[typeName].rid = room._id

						msgStream.on openedRooms[typeName].rid, (msg) ->
							ChatMessage.upsert { _id: msg._id }, msg
							# If room was renamed then close current room and send user to the new one
							Tracker.nonreactive ->
								if msg.t is 'r'
									if Session.get('openedRoom') is msg.rid
										type = if FlowRouter.current().route.name is 'channel' then 'c' else 'p'
										RoomManager.close type + FlowRouter.getParam('name')
										FlowRouter.go FlowRouter.current().route.name, name: msg.msg

						deleteMsgStream.on openedRooms[typeName].rid, (msg) ->
							ChatMessage.remove _id: msg._id

				Dep.changed()

	setRoomExpireExcept = (except) ->

		if openedRooms[except]?.timeout?
			clearTimeout openedRooms[except].timeout
			delete openedRooms[except].timeout

		for typeName of openedRooms
			if typeName isnt except and not openedRooms[typeName].timeout?
				openedRooms[typeName].timeout = setTimeout close, defaultTime, typeName

	open = (typeName) ->

		if not openedRooms[typeName]?
			openedRooms[typeName] =
				active: false
				ready: false

		setRoomExpireExcept typeName

		if subscription.ready()

			if openedRooms[typeName].active isnt true
				openedRooms[typeName].active = true

				computation?.invalidate()

		return {
			ready: ->
				Dep.depend()
				return openedRooms[typeName].ready
		}

	getDomOfRoom = (typeName, rid) ->
		room = openedRooms[typeName]
		if not room?
			return

		if not room.dom?
			room.dom = document.createElement 'div'
			room.dom.classList.add 'room-container'
			Blaze.renderWithData Template.room, { _id: rid }, room.dom

		return room.dom

	existsDomOfRoom = (typeName) ->
		room = openedRooms[typeName]
		return room?.dom?

	updateUserStatus = (user, status, utcOffset) ->
		onlineUsersValue = onlineUsers.curValue

		if status is 'offline'
			delete onlineUsersValue[user.username]
		else
			onlineUsersValue[user.username] =
				status: status
				utcOffset: utcOffset

		onlineUsers.set onlineUsersValue

	open: open
	close: close
	init: init
	getDomOfRoom: getDomOfRoom
	existsDomOfRoom: existsDomOfRoom
	msgStream: msgStream
	openedRooms: openedRooms
	updateUserStatus: updateUserStatus
	onlineUsers: onlineUsers
