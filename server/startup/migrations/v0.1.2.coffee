Meteor.startup ->
	Migrations.add
		version: new Date("2015-06-01T00:26:05.197Z").getTime()
		up: ->
			Meteor.users.find({avatarOrigin: {$exists: false}, username: {$exists: true}}).forEach (user) ->
				avatars = getAvatarSuggestionForUser user

				services = Object.keys avatars

				if services.length is 0
					return

				service = services[0]
				console.log user.username, '->', service

				blob = avatars[service].blob

				file = new FS.File blob
				file.attachData blob, ->
					file.name user.username

					Avatars.insert file, (err, fileObj) ->
						Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}