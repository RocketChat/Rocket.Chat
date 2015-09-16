Meteor.methods
	createPrivateGroup: (name, members) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createPrivateGroup -> Invalid user"

		unless RocketChat.authz.hasPermission(Meteor.userId(), 'create-p')
			throw new Meteor.Error 'not-authorized', '[methods] createPrivateGroup -> Not authorized'

		console.log '[methods] createPrivateGroup -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if not /^[0-9a-z-_]+$/.test name
			throw new Meteor.Error 'name-invalid'

		now = new Date()

		me = Meteor.user()

		members.push me.username

		name = s.slugify name

		# avoid duplicate names
		if ChatRoom.findOne({name:name})
			throw new Meteor.Error 'duplicate-name'

		# create new room
		room =
			usernames: members
			ts: now
			t: 'p'
			u:
				_id: me._id
				username: me.username
			name: name
			msgs: 0

		room._id = ChatRoom.insert room

		# set creator as group moderator.  permission limited to group by scoping to rid
		RocketChat.authz.addUsersToRoles(Meteor.userId(), 'moderator', room._id)

		for username in members
			member = RocketChat.models.Users.findOneByUsername(username, { fields: { username: 1 }})
			if not member?
				continue

			extra = {}

			if username is me.username
				extra.ls = now
			else
				extra.alert = true

			RocketChat.models.Subscriptions.createWithRoomAndUser room, member, extra

		return {
			rid: room._id
		}
