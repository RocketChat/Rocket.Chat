@UserAndRoom = new Meteor.Collection null
@ChatMessageHistory = new Meteor.Collection null

Meteor.startup ->
	ChatMessage.find().observe
		removed: (record) ->
			ChatMessageHistory.insert record