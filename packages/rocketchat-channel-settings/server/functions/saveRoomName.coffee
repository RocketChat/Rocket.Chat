RocketChat.saveRoomName = (rid, name, user, sendMessage=true) ->
	room = RocketChat.models.Rooms.findOneById rid

	if room.t not in ['c', 'p']
		throw new Meteor.Error 'error-not-allowed', 'Not allowed', { function: 'RocketChat.saveRoomName' }

	try
		nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
	catch
		nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

	if not nameValidation.test name
		throw new Meteor.Error 'error-invalid-room-name', name + ' is not a valid room name. Use only letters, numbers, hyphens and underscores', { function: 'RocketChat.saveRoomName', room_name: name }


	# name = _.slugify name

	if name is room.name
		return

	# avoid duplicate names
	if RocketChat.models.Rooms.findOneByName name
		throw new Meteor.Error 'error-duplicate-channel-name', 'A channel with name \'' + name + '\' exists', { function: 'RocketChat.saveRoomName', channel_name: name }

	update = RocketChat.models.Rooms.setNameById(rid, name) and RocketChat.models.Subscriptions.updateNameAndAlertByRoomId(rid, name)
	if update and sendMessage
		RocketChat.models.Messages.createRoomRenamedWithRoomIdRoomNameAndUser rid, name, user

	return name
