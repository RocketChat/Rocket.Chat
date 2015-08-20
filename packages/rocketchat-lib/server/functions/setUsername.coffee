RocketChat.setUsername = (user, username) ->
	username = _.trim username
	if not user or not username
		return false

	if not /^[0-9a-zA-Z-_.]+$/.test username
		return false

	# User already has desired username, return
	if user.username is username
		return user

	# Check username availability 
	unless RocketChat.checkUsernameAvailability username
		return false

	previousUsername = user.username

	# Username is available; if coming from old username, update all references
	if previousUsername
		ChatMessage.update { "u._id": user._id }, { $set: { "u.username": username } }, { multi: true }
	
		ChatMessage.find({ "mentions.username": previousUsername }).forEach (msg) ->
			updatedMsg = msg.msg.replace(new RegExp("@#{previousUsername}", "ig"), "@#{username}")
			ChatMessage.update { _id: msg._id, "mentions.username": previousUsername }, { $set: { "mentions.$.username": username, "msg": updatedMsg } }

		ChatRoom.update { usernames: previousUsername }, { $set: { "usernames.$": username } }, { multi: true }
		ChatRoom.update { "u._id": user._id }, { $set: { "u.username": username } }, { multi: true }

		ChatSubscription.update { "u._id": user._id }, { $set: { "u.username": username } }, { multi: true }
		ChatSubscription.update { name: previousUsername, t: "d" }, { $set: { name: username } }, { multi: true }

	# Set new username
	Meteor.users.update { _id: user._id }, { $set: { username: username } }
	user.username = username
	return user
