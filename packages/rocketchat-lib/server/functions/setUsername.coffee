RocketChat._setUsername = (userId, username) ->
	username = s.trim username
	if not userId or not username
		return false

	try
		nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
	catch
		nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

	if not nameValidation.test username
		return false

	user = RocketChat.models.Users.findOneById userId

	# User already has desired username, return
	if user.username is username
		return user

	previousUsername = user.username

	# Check username availability or if the user already owns a different casing of the name
	if ( !previousUsername or !(username.toLowerCase() == previousUsername.toLowerCase()))
		unless RocketChat.checkUsernameAvailability username
			return false



	# If first time setting username, send Enrollment Email
	if not previousUsername and user.emails?.length > 0 and RocketChat.settings.get 'Accounts_Enrollment_Email'
		Accounts.sendEnrollmentEmail(user._id)

	# Username is available; if coming from old username, update all references
	if previousUsername
		RocketChat.models.Messages.updateAllUsernamesByUserId user._id, username
		RocketChat.models.Messages.updateUsernameOfEditByUserId user._id, username

		RocketChat.models.Messages.findByMention(previousUsername).forEach (msg) ->
			updatedMsg = msg.msg.replace(new RegExp("@#{previousUsername}", "ig"), "@#{username}")
			RocketChat.models.Messages.updateUsernameAndMessageOfMentionByIdAndOldUsername msg._id, previousUsername, username, updatedMsg

		RocketChat.models.Rooms.replaceUsername previousUsername, username
		RocketChat.models.Rooms.replaceMutedUsername previousUsername, username
		RocketChat.models.Rooms.replaceUsernameOfUserByUserId user._id, username

		RocketChat.models.Subscriptions.setUserUsernameByUserId user._id, username
		RocketChat.models.Subscriptions.setNameForDirectRoomsWithOldName previousUsername, username

		rs = RocketChatFileAvatarInstance.getFileWithReadStream(encodeURIComponent("#{previousUsername}.jpg"))
		if rs?
			RocketChatFileAvatarInstance.deleteFile encodeURIComponent("#{username}.jpg")
			ws = RocketChatFileAvatarInstance.createWriteStream encodeURIComponent("#{username}.jpg"), rs.contentType
			ws.on 'end', Meteor.bindEnvironment ->
				RocketChatFileAvatarInstance.deleteFile encodeURIComponent("#{previousUsername}.jpg")
			rs.readStream.pipe(ws)

	# Set new username
	RocketChat.models.Users.setUsername user._id, username
	user.username = username
	return user

RocketChat.setUsername = RocketChat.RateLimiter.limitFunction RocketChat._setUsername, 1, 60000,
	0: (userId) -> return not Meteor.userId() or not RocketChat.authz.hasPermission(Meteor.userId(), 'edit-other-user-info') # Administrators have permission to change others usernames, so don't limit those
