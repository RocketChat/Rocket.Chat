RocketChat.setUsername = (user, username) ->
	username = s.trim username
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
		RocketChat.models.Messages.updateAllUsernamesByUserId user._id, username

		RocketChat.models.Messages.findByMention(previousUsername).forEach (msg) ->
			updatedMsg = msg.msg.replace(new RegExp("@#{previousUsername}", "ig"), "@#{username}")
			RocketChat.models.Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername msg._id, previousUsername, username, updatedMsg

		RocketChat.models.Rooms.replaceUsername previousUsername, username
		RocketChat.models.Rooms.replaceUsernameOfUserByUserId user._id, username

		RocketChat.models.Subscriptions.setUserUsernameByUserId user._id, username
		RocketChat.models.Subscriptions.setNameForDirectRoomsWithOldName previousUsername, username

	# Set new username
	RocketChat.models.Users.setUsername user._id, username
	user.username = username
	return user
