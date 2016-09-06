RocketChat.Migrations.add
	version: 12
	up: ->
		# Set oldest user as admin, if none exists yet
		admin = RocketChat.models.Users.findOneAdmin true, { fields: { _id: 1 } }
		unless admin
			# get oldest user
			oldestUser = RocketChat.models.Users.findOne({}, { fields: { username: 1 }, sort: {createdAt: 1}})
			if oldestUser
				Meteor.users.update {_id: oldestUser._id}, {$set: {admin: true}}

				console.log "Set #{oldestUser.username} as admin for being the oldest user"
