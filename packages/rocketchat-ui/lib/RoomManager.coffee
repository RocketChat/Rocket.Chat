loadMissedMessages = (rid) ->
	lastMessage = ChatMessage.findOne({rid: rid}, {sort: {ts: -1}, limit: 1})
	if not lastMessage?
		return

	Meteor.call 'loadMissedMessages', rid, lastMessage.ts, (err, result) ->
		for item in result
			RocketChat.promises.run('onClientMessageReceived', item).then (item) ->
				item.roles = _.union(UserRoles.findOne(item.u?._id)?.roles, RoomRoles.findOne({rid: item.rid, 'u._id': item.u?._id})?.roles)
				ChatMessage.upsert {_id: item._id}, item

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
			if RoomManager.getOpenedRoomByRid(record.rid)?
				recordBefore = ChatMessage.findOne {ts: {$lt: record.ts}}, {sort: {ts: -1}}
				if recordBefore?
					ChatMessage.update {_id: recordBefore._id}, {$set: {tick: new Date}}

				recordAfter = ChatMessage.findOne {ts: {$gt: record.ts}}, {sort: {ts: 1}}
				if recordAfter?
					ChatMessage.update {_id: recordAfter._id}, {$set: {tick: new Date}}


onDeleteMessageStream = (msg) ->
	ChatMessage.remove _id: msg._id


RocketChat.Notifications.onUser 'message', (msg) ->
	msg.u =
		username: 'rocketbot'
	msg.private = true

	ChatMessage.upsert { _id: msg._id }, msg


@RoomManager = new class
	openedRooms = {}
	subscription = null
	msgStream = new Meteor.Streamer 'messages'
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
				msgStream.removeAllListeners openedRooms[typeName].rid
				RocketChat.Notifications.unRoom openedRooms[typeName].rid, 'deleteMessage', onDeleteMessageStream

			openedRooms[typeName].ready = false
			openedRooms[typeName].active = false
			if openedRooms[typeName].template?
				Blaze.remove openedRooms[typeName].template
			delete openedRooms[typeName].dom
			delete openedRooms[typeName].template

			rid = openedRooms[typeName].rid
			delete openedRooms[typeName]

			if rid?
				RoomHistoryManager.clear rid


	computation = Tracker.autorun ->
		for typeName, record of openedRooms when record.active is true
			do (typeName, record) ->

				username = Meteor.user()?.username

				unless username
					return

				record.sub = [
					Meteor.subscribe 'room', typeName
				]

				if record.ready is true
					return

				ready = record.sub[0].ready() and subscription.ready()

				if ready is true
					type = typeName.substr(0, 1)
					name = typeName.substr(1)

					query =
						t: type

					if type is 'd'
						query.usernames = $all: [username, name]
					else
						query.name = name

					room = ChatRoom.findOne query, { reactive: false }

					if not room?
						record.ready = true
					else
						openedRooms[typeName].rid = room._id

						RoomHistoryManager.getMoreIfIsEmpty room._id
						record.ready = RoomHistoryManager.isLoading(room._id) is false
						Dep.changed()

						if openedRooms[typeName].streamActive isnt true
							openedRooms[typeName].streamActive = true
							msgStream.on openedRooms[typeName].rid, (msg) ->

								RocketChat.promises.run('onClientMessageReceived', msg).then (msg) ->

									# Should not send message to room if room has not loaded all the current messages
									if RoomHistoryManager.hasMoreNext(openedRooms[typeName].rid) is false

										# Do not load command messages into channel
										if msg.t isnt 'command'
											msg.roles = _.union(UserRoles.findOne(msg.u?._id)?.roles, RoomRoles.findOne({rid: msg.rid, 'u._id': msg.u?._id})?.roles)
											ChatMessage.upsert { _id: msg._id }, msg

										Meteor.defer ->
											RoomManager.updateMentionsMarksOfRoom typeName

										RocketChat.callbacks.run 'streamMessage', msg

							RocketChat.Notifications.onRoom openedRooms[typeName].rid, 'deleteMessage', onDeleteMessageStream

				Dep.changed()


	closeOlderRooms = ->
		maxRoomsOpen = 10
		if Object.keys(openedRooms).length <= maxRoomsOpen
			return

		roomsToClose = _.sortBy(_.values(openedRooms), 'lastSeen').reverse().slice(maxRoomsOpen)
		for roomToClose in roomsToClose
			close roomToClose.typeName


	closeAllRooms = ->
		for key, openedRoom of openedRooms
			close openedRoom.typeName


	open = (typeName) ->
		if not openedRooms[typeName]?
			openedRooms[typeName] =
				typeName: typeName
				active: false
				ready: false
				unreadSince: new ReactiveVar undefined

		openedRooms[typeName].lastSeen = new Date

		if openedRooms[typeName].ready
			closeOlderRooms()

		if subscription.ready() && Meteor.userId()

			if openedRooms[typeName].active isnt true
				openedRooms[typeName].active = true

				computation?.invalidate()

		return {
			ready: ->
				Dep.depend()
				return openedRooms[typeName].ready
		}

	getOpenedRoomByRid = (rid) ->
		for typeName, openedRoom of openedRooms
			if openedRoom.rid is rid
				return openedRoom

	getDomOfRoom = (typeName, rid) ->
		room = openedRooms[typeName]
		if not room?
			return

		if not room.dom? and rid?
			room.dom = document.createElement 'div'
			room.dom.classList.add 'room-container'
			contentAsFunc = (content) ->
				return -> content

			room.template = Blaze._TemplateWith { _id: rid }, contentAsFunc(Template.room)
			Blaze.render room.template, room.dom #, nextNode, parentView

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
				_id: user._id
				status: status
				utcOffset: utcOffset

		onlineUsers.set onlineUsersValue

	updateMentionsMarksOfRoom = (typeName) ->
		dom = getDomOfRoom typeName
		if not dom?
			return

		ticksBar = $(dom).find('.ticks-bar')
		$(dom).find('.ticks-bar > .tick').remove()

		scrollTop = $(dom).find('.messages-box > .wrapper').scrollTop() - 50
		totalHeight = $(dom).find('.messages-box > .wrapper > ul').height() + 40

		$('.messages-box .mention-link-me').each (index, item) ->
			topOffset = $(item).offset().top + scrollTop
			percent = 100 / totalHeight * topOffset
			ticksBar.append('<div class="tick" style="top: '+percent+'%;"></div>')


	open: open
	close: close
	closeAllRooms: closeAllRooms
	init: init
	getDomOfRoom: getDomOfRoom
	existsDomOfRoom: existsDomOfRoom
	msgStream: msgStream
	openedRooms: openedRooms
	updateUserStatus: updateUserStatus
	onlineUsers: onlineUsers
	updateMentionsMarksOfRoom: updateMentionsMarksOfRoom
	getOpenedRoomByRid: getOpenedRoomByRid


RocketChat.callbacks.add 'afterLogoutCleanUp', ->
	RoomManager.closeAllRooms()
