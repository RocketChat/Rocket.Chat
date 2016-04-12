@msgStream = new Meteor.Streamer 'messages'

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
			msgStream.emitWithoutBroadcast record.rid, record

		changed: (record) ->
			msgStream.emitWithoutBroadcast record.rid, record
