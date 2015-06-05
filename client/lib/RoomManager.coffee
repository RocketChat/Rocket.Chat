@RoomManager = new class
	defaultTime = 600000 # 10 minutes
	openedRooms = {}
	subscription = null

	Dep = new Tracker.Dependency

	init = ->
		subscription = Meteor.subscribe('subscription')
		return subscription

	expireRoom = (roomId) ->
		if openedRooms[roomId]
			if openedRooms[roomId].sub?
				for sub in openedRooms[roomId].sub
					sub.stop()

			openedRooms[roomId].ready = false
			openedRooms[roomId].active = false
			delete openedRooms[roomId].timeout

			ChatMessageHistory.remove rid: roomId

	computation = Tracker.autorun ->
		for roomId, record of openedRooms when record.active is true
			record.sub = [
				Meteor.subscribe 'room', roomId
				Meteor.subscribe 'messages', roomId
			]

			record.ready = record.sub[0].ready() and record.sub[1].ready()

			Dep.changed()

	setRoomExpireExcept = (except) ->

		if openedRooms[except]?.timeout?
			clearTimeout openedRooms[except].timeout
			delete openedRooms[except].timeout

		for roomId of openedRooms
			if roomId isnt except and not openedRooms[roomId].timeout?
				openedRooms[roomId].timeout = setTimeout expireRoom, defaultTime, roomId

	open = (roomId) ->
		if not openedRooms[roomId]?
			openedRooms[roomId] =
				active: false
				ready: false

		if subscription.ready()
			if ChatSubscription.findOne { rid: roomId }, { reactive: false }
				openedRooms[roomId].active = true
				setRoomExpireExcept roomId
				computation.invalidate()

		return {
			ready: ->
				Dep.depend()
				return openedRooms[roomId].ready
		}

	open: open
	close: expireRoom
	init: init
