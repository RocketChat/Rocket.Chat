Meteor.methods	
	updateRoom: (room) ->
		name = room.name
		if not Meteor.userId()
			throw new Meteor.Error('error-invalid-user', "Invalid user", { method: 'updateRoom' })

		originalRoom = RocketChat.models.Rooms.findOneById room._id

		if not originalRoom?._id?
			return
		hasPermission = RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', room.rid)
		editAllowed = RocketChat.settings.get 'Room_AllowEditing'
		editOwn = originalRoom?.u?._id is Meteor.userId()

		me = RocketChat.models.Users.findOneById Meteor.userId()

		unless hasPermission or (editAllowed and editOwn)
			throw new Meteor.Error 'error-action-not-allowed', 'Room editing not allowed', { method: 'updateRoom', action: 'Room_editing' }

		blockEditInMinutes = RocketChat.settings.get 'Room_AllowEditing_BlockEditInMinutes'
		if blockEditInMinutes? and blockEditInMinutes isnt 0
			msgTs = moment(originalRoom.ts) if originalRoom.ts?
			currentTsDiff = moment().diff(msgTs, 'minutes') if msgTs?
			if currentTsDiff > blockEditInMinutes
				throw new Meteor.Error 'error-room-editing-blocked', 'Room editing is blocked', { method: 'updateRoom' }


		# If we keep history of edits, insert a new room to store history information
		if RocketChat.settings.get 'Room_KeepHistory'
			RocketChat.models.Rooms.cloneAndSaveAsHistoryById originalRoom._id

		room.editedAt = new Date()
		room.editedBy =
			_id: Meteor.userId()
			username: me.username

		tempid = room._id
		delete room._id
		console.log tempid, name
		RocketChat.models.Rooms.update 
			_id: tempid,
			{$set: room}

		RocketChat.models.Subscriptions.update
			rid: tempid,
			{$set: {name: room.name}},
			multi: true

		return {
			rid: tempid
		}
