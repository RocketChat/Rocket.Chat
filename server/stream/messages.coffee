@msgStream = new Meteor.Streamer 'room-messages'

msgStream.allowWrite('none')

msgStream.allowRead (eventName) ->
	try
		room = Meteor.call 'canAccessRoom', eventName, this.userId
		if not room
			return false

		if room.t is 'c' and not RocketChat.authz.hasPermission(this.userId, 'preview-c-room') and room.usernames.indexOf(room.username) is -1
			return false

		return true
	catch e
		return false

msgStream.allowRead('__my_messages__', 'all')

msgStream.allowEmit '__my_messages__', (eventName, msg, options) ->
	try
		room = Meteor.call 'canAccessRoom', msg.rid, this.userId
		if not room
			return false

		options.roomParticipant = room.usernames.indexOf(room.username) > -1
		options.roomType = room.t

		return true
	catch e
		return false


Meteor.startup ->
	fields = undefined

	if not RocketChat.settings.get 'Message_ShowEditedStatus'
		fields = { 'editedAt': 0 }

	publishMessage = (type, record) ->
		if record._hidden isnt true and not record.imported?
			msgStream.emitWithoutBroadcast '__my_messages__', record, {}
			msgStream.emitWithoutBroadcast record.rid, record

	query =
		collection: RocketChat.models.Messages.model._name

	MongoInternals.defaultRemoteCollectionDriver().mongo._oplogHandle.onOplogEntry query, (action) ->
		if action.op.op is 'i'
			publishMessage 'inserted', action.op.o
			return

		if action.op.op is 'u'
			publishMessage 'updated', RocketChat.models.Messages.findOne({_id: action.id})
			return

		# if action.op.op is 'd'
		# 	publishMessage 'deleted', {_id: action.id}
		# 	return
