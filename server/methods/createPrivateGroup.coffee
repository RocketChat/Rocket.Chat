Meteor.methods
	createPrivateGroup: (name, members, accessPermissions) ->
		if not Meteor.userId()
			throw new Meteor.Error 'invalid-user', "[methods] createPrivateGroup -> Invalid user"

		console.log '[methods] createPrivateGroup -> '.green, 'userId:', Meteor.userId(), 'arguments:', arguments

		if not /^[0-9a-z-_]+$/i.test name
			throw new Meteor.Error 'name-invalid'

		now = new Date()

		me = Meteor.user()

		members.push me.username

		name = s.slugify name

		# avoid duplicate names
		if ChatRoom.findOne({name:name})
			throw new Meteor.Error 'duplicate-name'

		if not accessPermissions
			throw new Meteor.Error('invalid-argument', "Missing security label")

		if not Jedis.securityLabelIsValid(accessPermissions)
			throw new Meteor.Error('invalid-access-permissions', "Missing required access permissions")

		# RocketChat uses username as the identifier.  We use the imported LDAP username as both the _id and username value
		result = Meteor.call 'canAccessResource', members, accessPermissions
		deniedUserList = _.pluck(result.deniedUsers, 'user')
		
		# make sure current user can access the new permissions
		# should never be possible in GUI, but still must protect on back-end
		if _.contains deniedUserList, Meteor.user().username
			throw new Meteor.Error 'invalid-access-permissions', 'Current user cannot participate in the conversation with the specified access permissions.'

		# include only those specified users that have the correct permissions
		usersToAdd = _.difference( members, deniedUserList )
	

		# create new room
		rid = ChatRoom.insert
			usernames: usersToAdd
			ts: now
			t: 'p'
			u:
				_id: me._id
				username: me.username
			name: name
			msgs: 0
			accessPermissions: accessPermissions
			securityLabels: Jedis.legacyLabel accessPermissions

		for username in usersToAdd
			member = Meteor.users.findOne({ username: username },{ fields: { username: 1 }})
			if not member?
				continue

			subscription =
				rid: rid
				ts: now
				name: name
				t: 'p'
				open: true
				u:
					_id: member._id
					username: member.username

			if username is me.username
				subscription.ls = now
			else
				subscription.alert = true

			ChatSubscription.insert subscription

		return {
			rid: rid
		}
