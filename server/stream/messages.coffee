# COMPATIBILITY
oldMsgStream = new Meteor.Stream 'messages'

oldMsgStream.permissions.write (eventName) ->
	return false

oldMsgStream.permissions.read (eventName) ->
	try
		canAccess = Meteor.call 'canAccessRoom', eventName, this.userId

		return false if not canAccess

		return true
	catch e
		return false
# COMPATIBILITY


@msgStream = new Meteor.Streamer 'room-messages'

msgStream.allowWrite('none')

msgStream.allowRead (eventName) ->
	# console.log('stream.permissions.read', this.userId, eventName);
	# return this.userId == eventName;

	try
		canAccess = Meteor.call 'canAccessRoom', eventName, this.userId

		return false if not canAccess

		return true
	catch e
		return false


Meteor.startup ->
	fields = undefined

	if not RocketChat.settings.get 'Message_ShowEditedStatus'
		fields = { 'editedAt': 0 }

	RocketChat.models.Messages.on 'change', (type, args...) ->
		records = RocketChat.models.Messages.getChangedRecords type, args[0], fields

		for record in records
			if record._hidden isnt true
				oldMsgStream.emit record.rid, record
				msgStream.emit record.rid, record
