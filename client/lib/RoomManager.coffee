@RoomManager = new class
	defaultTime = 600000 # 10 minutes
	openedRooms = {}
	subscription = null

	Dep = new Tracker.Dependency

	init = ->
		subscription = Meteor.subscribe('subscription')
		return subscription

	close = (rid) ->
		if openedRooms[rid]
			if openedRooms[rid].sub?
				for sub in openedRooms[rid].sub
					sub.stop()

			openedRooms[rid].ready = false
			openedRooms[rid].active = false
			delete openedRooms[rid].timeout

			ChatMessageHistory.remove rid: rid

	computation = Tracker.autorun ->
		for rid, record of openedRooms when record.active is true
			record.sub = [
				Meteor.subscribe 'room', rid
				Meteor.subscribe 'messages', rid
			]

			record.ready = record.sub[0].ready() and record.sub[1].ready()

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

		if subscription.ready()
			# if ChatSubscription.findOne { rid: rid }, { reactive: false }
			if openedRooms[rid].active isnt true
				openedRooms[rid].active = true
				setRoomExpireExcept rid
				computation.invalidate()

		return {
			ready: ->
				Dep.depend()
				return openedRooms[rid].ready
		}

	open: open
	close: close
	init: init
