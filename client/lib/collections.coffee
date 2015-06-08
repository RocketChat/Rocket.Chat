@UserAndRoom = new Meteor.Collection null
@ChatMessageHistory = new Meteor.Collection null

Meteor.startup ->
	ChatMessage.find().observe
		added: (record) ->
			if ChatMessageHistory._collection._docs._map[record._id]?
				ChatMessageHistory.remove record._id

		removed: (record) ->
			if ChatRoom._collection._docs._map[record.rid]? and not ChatMessageHistory._collection._docs._map[record._id]?
				ChatMessageHistory.insert record
