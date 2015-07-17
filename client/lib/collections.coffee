@UserAndRoom = new Meteor.Collection null
@ChatMessageHistory = new Meteor.Collection null

@ChatRoom = new Meteor.Collection 'rocketchat_room'
@ChatSubscription = new Meteor.Collection 'rocketchat_subscription'
#@ChatMessage = new Meteor.Collection 'rocketchat_message'

# Meteor.startup ->
# 	ChatMessage.find().observe
# 		added: (record) ->
# 			if record._deleted is true
# 				ChatMessageHistory.remove {_id: record._id}
# 				return

# 			if ChatRoom._collection._docs._map[record.rid]? and not ChatMessageHistory._collection._docs._map[record._id]?
# 				ChatMessageHistory.insert record

# 		changed: (record) ->
# 			if record._deleted is true
# 				ChatMessageHistory.remove {_id: record._id}
# 				return

# 			_id = record._id
# 			delete record._id

# 			ChatMessageHistory.update { _id: _id }, { $set: record }

		# removed: (record) ->
		# 	ChatMessageHistory.remove {_id: record._id}
