Meteor.startup ->
	ChatRoom.find().observe
		added: (data) ->
			Session.set('roomData' + data._id, data)
		changed: (newData, oldData) ->
			handleRoomNameChanged( newData, oldData)
			Session.set('roomData' + newData._id, null)
			Session.set('roomData' + newData._id, newData)
		removed: (data) ->
			Session.set('roomData' + data._id, undefined)

handleRoomNameChanged = (newData, oldData) ->
	if newData.t in ['p','c'] and newData.name isnt oldData.name
		oldTypeName = oldData.t + oldData.name
		RoomManager.remove oldTypeName
		openedRoom = Session.get('openedRoom')
		if openedRoom is newData._id
			newTypeName = newData.t + newData.name
			Tracker.autorun (c) ->
				if RoomManager.open(newTypeName).ready() isnt true
					return
				c.stop()
				RoomManager.removeDomOfRoom()
				RoomManager.refreshDomOfRoom( newTypeName, newData._id )
				Session.set 'openedRoom', newData._id
				Session.set 'editRoomTitle', false
				Meteor.call 'readMessages', newData._id if Meteor.userId()?
				# KonchatNotification.removeRoomNotification(params._id)

				if Meteor.Device.isDesktop()
					setTimeout ->
						$('.message-form .input-message').focus()
					, 100	

