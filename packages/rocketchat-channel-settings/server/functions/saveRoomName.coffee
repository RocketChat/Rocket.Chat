RocketChat.saveRoomName = (rid, name) ->
	if not Meteor.userId()
		throw new Meteor.Error('invalid-user', "[methods] sendMessage -> Invalid user")

	room = RocketChat.models.Rooms.findOneById rid

	if room.t not in ['c', 'p']
		throw new Meteor.Error 403, 'Not allowed'

	unless RocketChat.authz.hasPermission(Meteor.userId(), 'edit-room', rid)
		throw new Meteor.Error 403, 'Not allowed'

	try
		nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
	catch
		nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

	if not nameValidation.test name
		throw new Meteor.Error 'name-invalid', 'Invalid_room_name', { channelName: name }

	# name = _.slugify name

	if name is room.name
		return

	# avoid duplicate names
	if RocketChat.models.Rooms.findOneByName name
		throw new Meteor.Error 'duplicate-name', 'Duplicate_channel_name', { channelName: name }

	RocketChat.models.Rooms.setNameById rid, name
	RocketChat.models.Subscriptions.updateNameByRoomId rid, name

	return name
