@msgStream = new Meteor.Streamer 'room-messages'

msgStream.allowWrite('none')

msgStream.allowRead (eventName) ->
	try
		return false if not Meteor.call 'canAccessRoom', eventName, this.userId

		return true
	catch e
		return false

msgStream.allowRead('__my_messages__', 'all')

msgStream.allowEmit '__my_messages__', (eventName, msg) ->
	try
		return false if not Meteor.call 'canAccessRoom', msg.rid, this.userId

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
				msgStream.emit '__my_messages__', record
				msgStream.emit record.rid, record
