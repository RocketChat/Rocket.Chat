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
		$or: [
			ts:
				$gt: new Date()
		,
			ets:
				$gt: new Date()
		]

	options = {}

	ChatMessage.find(filter, options).observe
		added: (record) ->
			console.log 'added ->', record
			if record._history isnt true
				msgStream.emit record.rid, record

		changed: (record) ->
			console.log 'changed ->', record
			if record._history isnt true
				msgStream.emit record.rid, record
			else
				deleteMsgStream.emit record.rid, { _id: record._id }