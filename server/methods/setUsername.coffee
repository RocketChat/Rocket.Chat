# Meteor.methods
# 	setUsername: (username) ->
# 		if not Meteor.userId()
# 			throw new Meteor.Error('invalid-user', "[methods] setUsername -> Invalid user")

# 		console.log '[methods] setUsername -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

# 		user = Meteor.user()

# 		if not usernameIsAvaliable username
# 			throw new Meteor.Error 'username-unavailable'

# 		if not /^[0-9a-zA-Z-_.]+$/.test username
# 			throw new Meteor.Error 'username-invalid'

# 		if not user.username?
# 			ChatRoom.find({default: true, t: {$in: ['c', 'p']}}).forEach (room) ->
# 				# put user in default rooms
# 				ChatRoom.update room._id,
# 					$addToSet:
# 						usernames: username

# 				if not ChatSubscription.findOne(rid: room._id, 'u._id': user._id)?
# 					ChatSubscription.insert
# 						rid: room._id
# 						name: room.name
# 						ts: new Date()
# 						t: room.t
# 						f: false
# 						open: true
# 						alert: true
# 						unread: 1
# 						u:
# 							_id: user._id
# 							username: username

# 					ChatMessage.insert
# 						rid: room._id
# 						ts: new Date()
# 						t: 'uj'
# 						msg: ''
# 						u:
# 							_id: user._id
# 							username: username

# 		Meteor.users.update({_id: user._id}, {$set: {username: username}})

# 		return username

# slug = (text) ->
# 	text = slugify text, '.'
# 	return text.replace(/[^0-9a-z-_.]/g, '')

# usernameIsAvaliable = (username) ->
# 	if username.length < 1
# 		return false
# 	return not Meteor.users.findOne({username: {$regex : new RegExp("^" + username + "$", "i") }})
