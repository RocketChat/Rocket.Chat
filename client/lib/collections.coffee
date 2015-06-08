@UserFullName = {}
@UserAndRoom = new Meteor.Collection null
@ChatMessageHistory = new Meteor.Collection null

@ChatRoom = new Meteor.Collection 'data.ChatRoom'
@ChatSubscription = new Meteor.Collection 'data.ChatSubscription'
@ChatMessage = new Meteor.Collection 'data.ChatMessage'

# ,
# 	transform: (room) ->
# 		if room.t is 'd' and Meteor.userId()?
# 			if not UserFullName[Meteor.userId()]?
# 				user = Meteor.users.findOne Meteor.userId()
# 				UserFullName[Meteor.userId()] = user.name

# 			regex = new RegExp('\\|?' + UserFullName[Meteor.userId()] + '\\|?')
# 			room.name = room.name.replace(regex, '')

# 		return room



Meteor.startup ->
	ChatMessage.find().observe
		added: (record) ->
			if ChatMessageHistory._collection._docs._map[record._id]?
				ChatMessageHistory.remove record._id

		removed: (record) ->
			if ChatRoom._collection._docs._map[record.rid]? and not ChatMessageHistory._collection._docs._map[record._id]?
				ChatMessageHistory.insert record

