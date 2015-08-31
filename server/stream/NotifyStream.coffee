# ALL
@notifyAllStream = new Meteor.Stream 'notify-all'

notifyAllStream.permissions.write -> return @userId?
notifyAllStream.permissions.read -> return @userId?

notifyAllStream.on 'notify', (data) ->
	notifyAllStream.emit 'notify', data


# ROOM
@notifyRoomStream = new Meteor.Stream 'notify-room'

notifyRoomStream.permissions.write -> return @userId?
notifyRoomStream.permissions.read (event) ->
	if not @userId?
		return false

	if event is 'notify' then return true

	user = Meteor.users.findOne @userId, {fields: {username: 1}}
	return ChatRoom.findOne({_id: event, usernames: user.username}, {fields: {_id: 1}})?

notifyRoomStream.on 'notify', (room, data) ->
	notifyRoomStream.emit room, data


# USER
@notifyUserStream = new Meteor.Stream 'notify-user'

notifyUserStream.permissions.write -> return @userId?
notifyUserStream.permissions.read (event) ->
	if not @userId?
		return false

	if event is 'notify' then return true

	return @userId is event

notifyUserStream.on 'notify', (userId, data) ->
	notifyUserStream.emit userId, data
