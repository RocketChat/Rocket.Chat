@msgStream = new Meteor.Stream 'messages'
@deleteMsgStream = new Meteor.Stream 'delete-message'

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


deleteMsgStream.permissions.write (eventName) ->
	return false

deleteMsgStream.permissions.read (eventName) ->
	try
		canAccess = Meteor.call 'canAccessRoom', eventName, this.userId

		return !!canAccess
	catch e
		return false

Meteor.startup ->
	filter =
		_hidden: { $ne: true }
		$or: [
			ts:
				$gt: new Date()
		,
			ets:
				$gt: new Date()
		]

	options = {}

	if not RocketChat.settings.get 'Message_ShowEditedStatus'
		options.fields = { ets: 0 }

	ChatMessage.find(filter, options).observe
		added: (record) ->
			msgStream.emit record.rid, record

		changed: (record) ->
			msgStream.emit record.rid, record
