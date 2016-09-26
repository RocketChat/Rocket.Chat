slug = (text) ->
	text = slugify text, '.'
	return text.replace(/[^0-9a-z-_.]/g, '')

usernameIsAvaliable = (username) ->
	if username.length < 1
		return false

	if username is 'all'
		return false

	return not RocketChat.models.Users.findOneByUsername({$regex : new RegExp("^" + username + "$", "i") })

@generateSuggestion = (user) ->
	usernames = []
	username = undefined

	if Meteor.settings.public.sandstorm
		usernames.push user.services.sandstorm.preferredHandle

	if Match.test(user?.name, String)
		if RocketChat.settings.get 'UTF8_Names_Slugify'
			usernames.push slug user.name
		else
			usernames.push user.name

		nameParts = user?.name?.split(' ')
		if nameParts.length > 1
			first = nameParts[0]
			last = nameParts[nameParts.length - 1]

			if RocketChat.settings.get 'UTF8_Names_Slugify'
				usernames.push slug first[0] + last
				usernames.push slug first + last[0]
			else
				usernames.push first[0] + last
				usernames.push first + last[0]

	if user.profile?.name?
		if RocketChat.settings.get 'UTF8_Names_Slugify'
			usernames.push slug user.profile.name
		else
			usernames.push user.profile.name

	if user.services?
		services = _.map user.services, (service) ->
			return _.values(_.pick(service, 'name', 'username', 'firstName', 'lastName'))

		services = _.uniq(_.flatten(services))

		for service in services
			if RocketChat.settings.get 'UTF8_Names_Slugify'
				usernames.push slug service
			else
				usernames.push service

	if user.emails?.length > 0
		for email in user.emails when email.address? and email.verified is true
			usernames.push slug email.address.replace(/@.+$/, '')

		for email in user.emails when email.address? and email.verified is true
			usernames.push slug email.address.replace(/(.+)@(\w+).+/, '$1.$2')

	usernames = _.compact(usernames)

	for item in usernames
		if usernameIsAvaliable item
			username = item
			break

	if usernames.length is 0 or usernames[0].length is 0
		usernames.push('user')

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
		unless Meteor.userId()
			throw new Meteor.Error 'error-invalid-user', 'Invalid user', { method: 'getUsernameSuggestion' }

		user = Meteor.user()
		return generateSuggestion(user)
