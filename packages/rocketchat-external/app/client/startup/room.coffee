msgStream = new Meteor.Stream 'messages'
Tracker.autorun ->
	msgStream.on visitor.getRoom(), (msg) ->
		ChatMessage.upsert { _id: msg._id }, msg
