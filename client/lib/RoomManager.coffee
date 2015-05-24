@RoomManager = new class
	defaultTime = 600000 # 10 minutes
	openedRooms = {}
	myRoomActivity = null

	Dep = new Tracker.Dependency

	init = ->
		myRoomActivity = Meteor.subscribe('myRoomActivity')
		return myRoomActivity

	expireRoom = (roomId) ->
		if openedRooms[roomId]
			if openedRooms[roomId].sub?
				for sub in openedRooms[roomId].sub
					sub.stop()
			openedRooms[roomId].ready = false
			openedRooms[roomId].active = false
			delete openedRooms[roomId].timeout

	computation = Tracker.autorun ->
		for roomId, record of openedRooms when record.active is true
			record.sub = [
				Meteor.subscribe 'dashboardRoom', roomId, moment().subtract(2, 'hour').startOf('day').toDate()
			]
			# @TODO talvez avaliar se todas as subscriptions do array estão 'ready', mas por enquanto, as mensagens são o mais importante
			record.ready = record.sub[0].ready()
			if record.ready is true and record.historyCalled isnt true
				record.historyCalled = true
				RoomHistoryManager.initRoom roomId, moment().subtract(2, 'hour').startOf('day').toDate()
				Tracker.nonreactive ->
					if Session.get('roomData' + roomId)?.msgs > 9 and ChatMessage.find({ rid: roomId }).count() < 10 and ChatMessageHistory.find({ rid: roomId }).count() is 0
						RoomHistoryManager.getMore roomId

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

		if myRoomActivity.ready()
			if ChatSubscription.findOne { rid: roomId, uid: Meteor.userId() }, { reactive: false }
				openedRooms[roomId].active = true
				setRoomExpireExcept roomId
				computation.invalidate()
			else
				Meteor.call 'canAccessRoom', roomId, (error, result) ->
					if result
						openedRooms[roomId].active = true
						setRoomExpireExcept roomId
						computation.invalidate()
					else
						if error.error is 'without-permission'
							toastr.error 'Sem permissões para ver a sala'

						Router.go 'index'

		return {
			ready: ->
				Dep.depend()
				return openedRooms[roomId].ready
		}

	open: open
	close: expireRoom
	init: init
