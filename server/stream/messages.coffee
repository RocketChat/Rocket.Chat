msgStream = new Meteor.Stream 'messages'

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
	filter =
		$or: [
			ts:
				$gt: new Date()
		,
			ets:
				$gt: new Date()
		]
		_deleted:
			$ne: true

	options = {}

	ChatMessage.find(filter, options).observe
		added: (record) ->
			msgStream.emit record.rid, record

		changed: (record) ->
			msgStream.emit record.rid, record

	ChatMessage.find({ _deleted: true }, { fields: { rid: 1, _id: 1 } }).observeChanges
		added: (_id, record) ->
			msgStream.emit record.rid, { _id: _id, _deleted: true }
		changed: (_id, record) ->
			msgStream.emit record.rid, { _id: _id, _deleted: true }
			ChatMessage.remove
				_id: message.id
				'u._id': Meteor.userId()
