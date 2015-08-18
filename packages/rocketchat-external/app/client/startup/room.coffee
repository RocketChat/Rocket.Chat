# Meteor.startup ->
# 	room = ChatRoom.findOne { "v.token": visitor.getToken() }, { fields: { _id: 1 }}
# 	if room?
# 		visitor.setRoom room._id


msgStream = new Meteor.Stream 'messages'
Tracker.autorun ->
	console.log 'visitor.getRoom ->',visitor.getRoom()
	msgStream.on visitor.getRoom(), (msg) ->
		ChatMessage.upsert { _id: msg._id }, msg
