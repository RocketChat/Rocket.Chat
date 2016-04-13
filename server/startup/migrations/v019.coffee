RocketChat.Migrations.add
	version: 19
	up: ->
		###
		# Migrate existing admin users to Role based admin functionality
		# 'admin' role applies to global scope
		###
		admins = Meteor.users.find({ admin: true }, { fields: { _id: 1, username:1 } }).fetch()
		RocketChat.authz.addUsersToRoles( _.pluck(admins, '_id'), ['admin'])
		Meteor.users.update({}, { $unset :{admin:''}}, {multi:true})
		usernames = _.pluck( admins, 'username').join(', ')
		console.log "Migrate #{usernames} from admin field to 'admin' role".green

		# Add 'user' role to all users
		users = Meteor.users.find().fetch()
		RocketChat.authz.addUsersToRoles( _.pluck(users, '_id'), ['user'])
		usernames = _.pluck( users, 'username').join(', ')
		console.log "Add #{usernames} to 'user' role".green

		# Add 'moderator' role to channel/group creators
		rooms = RocketChat.models.Rooms.findByTypes(['c','p']).fetch()
		_.each rooms, (room) ->
			creator = room?.u?._id
			if creator
				if Meteor.users.findOne({_id: creator})
					RocketChat.authz.addUsersToRoles( creator, ['moderator'], room._id)
				else
					RocketChat.models.Subscriptions.removeByRoomId room._id
					RocketChat.models.Messages.removeByRoomId room._id
					RocketChat.models.Rooms.removeById room._id
