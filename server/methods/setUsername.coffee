slug = (text) ->
	text = slugify text, '.'
	return text.replace(/[^0-9a-z-_.]/g, '')

usernameIsAvaliable = (username) ->
	if username.length < 1
		return false

	return not Meteor.users.findOne({username: username})?

Meteor.methods
	setUsername: (username) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] typingStatus -> Usuário não logado'

		user = Meteor.user()

		if user.username?
			throw new Meteor.Error 'username-already-setted'

		if not usernameIsAvaliable username
			throw new Meteor.Error 'username-unavaliable'

		if not /^[0-9a-z-_.]+$/.test username
			throw new Meteor.Error 'username-invalid'

		Meteor.users.update({_id: user._id},  {$set: {username: username}})

		return username
