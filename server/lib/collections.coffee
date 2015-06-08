@UserFullName = {}

@ChatMessage = new Meteor.Collection 'data.ChatMessage'
@ChatRoom = new Meteor.Collection 'data.ChatRoom'
# ,
# 	transform: (room) ->
# 		if room.t is 'd' and Meteor.userId()?
# 			if not UserFullName[Meteor.userId()]?
# 				user = Meteor.users.findOne Meteor.userId()
# 				UserFullName[Meteor.userId()] = user.name

# 			regex = new RegExp('\\|?' + UserFullName[Meteor.userId()] + '\\|?')
# 			room.name = room.name.replace(regex, '')

# 		return room

@ChatSubscription = new Meteor.Collection 'data.ChatSubscription'
