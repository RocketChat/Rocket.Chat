slug = (text) ->
	text = slugify text, '.'
	return text.replace(/[^0-9a-z-_.]/g, '')

usernameIsAvaliable = (username) ->
	if username.length < 1
		return false

	if username is 'all'
		return false

	return not RocketChat.models.Users.findOneByUsername({$regex : new RegExp(username, "i") })

@generateSuggestion = (user) ->
	usernames = []
	username = undefined

	usernames.push slug user.name

	nameParts = user?.name?.split()
	if nameParts.length > 1
		first = nameParts[0]
		last = nameParts[nameParts.length - 1]

		usernames.push slug first[0] + last
		usernames.push slug first + last[0]

	if user.profile?.name?
		usernames.push slug user.profile.name

	if user.services?
		for serviceName, service of user.services
			if service.name?
				usernames.push slug service.name
			else if service.username?
				usernames.push slug service.username

	if user.emails?.length > 0
		for email in user.emails when email.address? and email.verified is true
			usernames.push slug email.address.replace(/@.+$/, '')

		for email in user.emails when email.address? and email.verified is true
			usernames.push slug email.address.replace(/(.+)@(\w+).+/, '$1.$2')

	for item in usernames
		if usernameIsAvaliable item
			username = item
			break

	if usernames[0]? and usernames[0].length > 0
		index = 0
		while not username?
			index++
			if usernameIsAvaliable usernames[0] + '-' + index
				username = usernames[0] + '-' + index

	if usernameIsAvaliable username
		return username

	return undefined
RocketChat.generateUsernameSuggestion = generateSuggestion

Meteor.methods
	getUsernameSuggestion: ->
		if not Meteor.userId()
			throw new Meteor.Error 203, '[methods] getUsernameSuggestion -> Usuário não logado'

		user = Meteor.user()
		return generateSuggestion(user)
