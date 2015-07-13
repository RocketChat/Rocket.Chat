Meteor.startup ->
	Migrations.add
		version: 1
		up: ->
			Meteor.users.find({username: {$exists: false}, lastLogin: {$exists: true}}).forEach (user) ->
				username = generateSuggestion(user)
				if username? and username.trim() isnt ''
					Meteor.users.update({_id: user._id}, {$set: {username: username}})
				else
					console.log "User without username", JSON.stringify(user, null, ' ')