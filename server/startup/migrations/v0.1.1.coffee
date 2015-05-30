Meteor.startup ->
	Migrations.add
		version: new Date("2015-05-30T22:51:26.759Z").getTime()
		up: ->
			Meteor.users.find({username: {$exists: false}, lastLogin: {$exists: true}}).forEach (user) ->
				username = generateSuggestion(user)
				if username? and username.trim() isnt ''
					Meteor.users.update({_id: user._id}, {$set: {username: username}})
				else
					console.log "User without username", JSON.stringify(user, null, ' ')