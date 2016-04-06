Meteor.methods
	createChannel: (name, members) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createChannel -> Invalid user"

		try
			nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
		catch
			nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'

		if not nameValidation.test name
			throw new Meteor.Error 'name-invalid'

		if RocketChat.authz.hasPermission(Meteor.userId(), 'create-c') isnt true
			throw new Meteor.Error 'not-authorized', '[methods] createChannel -> Not authorized'

		now = new Date()
		user = Meteor.user()

		members.push user.username if user.username not in members

		# avoid duplicate names
		if RocketChat.models.Rooms.findOneByName name
			if RocketChat.models.Rooms.findOneByName(name).archived
				throw new Meteor.Error 'archived-duplicate-name'
			else
				throw new Meteor.Error 'duplicate-name'

		# name = s.slugify name

		RocketChat.callbacks.run 'beforeCreateChannel', user,
			t: 'c'
			name: name
			ts: now
			usernames: members
			u:
				_id: user._id
				username: user.username

		# create new room
		room = RocketChat.models.Rooms.createWithTypeNameUserAndUsernames 'c', name, user, members,
			ts: now

		for username in members
			member = RocketChat.models.Users.findOneByUsername username
			if not member?
				continue

			extra = {}

			if username is user.username
				extra.ls = now
				extra.open = true

			RocketChat.models.Subscriptions.createWithRoomAndUser room, member, extra

		# set creator as channel moderator.  permission limited to channel by scoping to rid
		RocketChat.authz.addUserRoles(Meteor.userId(), ['owner'], room._id)

		Meteor.defer ->
			RocketChat.callbacks.run 'afterCreateChannel', user, room

		return {
			rid: room._id
		}
