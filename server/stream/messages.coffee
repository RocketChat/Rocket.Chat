@msgStream = new Meteor.Stream 'messages'

msgStream.permissions.write (eventName) ->
	console.log('stream.permissions.write', this.userId);
	# return eventName == 'send' && this.userId;
	return false

msgStream.permissions.read (eventName) ->
	console.log('stream.permissions.read', this.userId, eventName);
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
		options.fields = { ets: 0 }

	RocketChat.models.Messages.findVisibleCreatedOrEditedAfterTimestamp(new Date(), options).observe
		added: (record) ->
			msgStream.emit record.rid, record

		changed: (record) ->
			msgStream.emit record.rid, record
