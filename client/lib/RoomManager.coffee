Meteor.startup ->
	ChatMessage.find().observe
		removed: (record) ->
			recordBefore = ChatMessage.findOne {ts: {$lt: record.ts}}, {sort: {ts: -1}}
			if recordBefore?
				ChatMessage.update {_id: recordBefore._id}, {$set: {tick: new Date}}


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

	close = (rid) ->
		if openedRooms[rid]
			if openedRooms[rid].sub?
				for sub in openedRooms[rid].sub
					sub.stop()

			msgStream.removeListener rid
			deleteMsgStream.removeListener rid

			openedRooms[rid].ready = false
			openedRooms[rid].active = false
			delete openedRooms[rid].timeout
			delete openedRooms[rid].dom

			RoomHistoryManager.clear rid

			ChatMessage.remove rid: rid

	computation = Tracker.autorun ->
		for rid, record of openedRooms when record.active is true
			record.sub = [
				Meteor.subscribe 'room', rid
				# Meteor.subscribe 'messages', rid
			]

			record.ready = record.sub[0].ready()
			# record.ready = record.sub[0].ready() and record.sub[1].ready()

			Dep.changed()

	setRoomExpireExcept = (except) ->

		if openedRooms[except]?.timeout?
			clearTimeout openedRooms[except].timeout
			delete openedRooms[except].timeout

		for rid of openedRooms
			if rid isnt except and not openedRooms[rid].timeout?
				openedRooms[rid].timeout = setTimeout close, defaultTime, rid

	open = (rid) ->

		if not openedRooms[rid]?
			openedRooms[rid] =
				active: false
				ready: false

		setRoomExpireExcept rid

		if subscription.ready()
			# if ChatSubscription.findOne { rid: rid }, { reactive: false }
			if openedRooms[rid].active isnt true
				openedRooms[rid].active = true

				msgStream.on rid, (msg) ->
					ChatMessage.upsert { _id: msg._id }, msg

				deleteMsgStream.on rid, (msg) ->
					ChatMessage.remove _id: msg._id

				computation?.invalidate()

		return {
			ready: ->
				Dep.depend()
				return openedRooms[rid].ready
		}

	getDomOfRoom = (rid) ->
		room = openedRooms[rid]
		if not room?
			return

		if not room.dom?
			room.dom = document.createElement 'div'
			room.dom.classList.add 'room-container'
			Blaze.renderWithData Template.room, { _id: rid }, room.dom

		return room.dom

	existsDomOfRoom = (rid) ->
		room = openedRooms[rid]
		return room?.dom?

	updateUserStatus = (user, status) ->
		onlineUsersValue = onlineUsers.curValue

		if status is 'offline'
			delete onlineUsersValue[user.username]
		else
			onlineUsersValue[user.username] = status

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
