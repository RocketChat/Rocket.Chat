RocketChat.saveRoomName = (rid, name) ->
	if not Meteor.userId()
		throw new Meteor.Error('error-invalid-user', "Invalid user", { function: 'RocketChat.saveRoomName' })

	room = RocketChat.models.Rooms.findOneById rid

	if room.t not in ['c', 'p']
		throw new Meteor.Error 'error-not-allowed', 'Not allowed', { function: 'RocketChat.saveRoomName' }

	unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)
		throw new Meteor.Error 'error-not-allowed', 'Not allowed', { function: 'RocketChat.saveRoomName' }

	try
		nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
	catch
		nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

	if not nameValidation.test name
		throw new Meteor.Error 'error-invalid-room-name', 'Invalid room name', { function: 'RocketChat.saveRoomName', channelName: name }

	# name = _.slugify name

	if name is room.name
		return

	# avoid duplicate names
	if RocketChat.models.Rooms.findOneByName name
		throw new Meteor.Error 'error-duplicate-channel-name', 'Duplicate channel name', { function: 'RocketChat.saveRoomName', channelName: name }

	RocketChat.models.Rooms.setNameById rid, name
	RocketChat.models.Subscriptions.updateNameByRoomId rid, name

	return name
