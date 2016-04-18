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
	options = {}

	if not RocketChat.settings.get 'Message_ShowEditedStatus'
		options.fields = { 'editedAt': 0 }

	RocketChat.models.Messages.findVisibleCreatedOrEditedAfterTimestamp(new Date(), options).observe
		added: (record) ->
			oldMsgStream.emit record.rid, record
			msgStream.emitWithoutBroadcast record.rid, record

		changed: (record) ->
			oldMsgStream.emit record.rid, record
			msgStream.emitWithoutBroadcast record.rid, record
