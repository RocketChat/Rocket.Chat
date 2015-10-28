msgStream = new Meteor.Stream 'messages'
Tracker.autorun ->
	if visitor.getRoom()?
		msgStream.on visitor.getRoom(), (msg) ->
			ChatMessage.upsert { _id: msg._id }, msg
