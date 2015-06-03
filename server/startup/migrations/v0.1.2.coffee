Meteor.startup ->
	Migrations.add
		version: new Date("2015-06-03T00:49:41.269Z").getTime()
		up: ->
			Meteor.users.find({avatarOrigin: {$exists: false}, username: {$exists: true}}).forEach (user) ->
				avatars = getAvatarSuggestionForUser user

				services = Object.keys avatars

				if services.length is 0
					return

				service = services[0]
				console.log user.username, '->', service

				dataURI = avatars[service].blob

				{image, contentType} = RocketFile.dataURIParse dataURI

				rs = RocketFile.bufferToStream new Buffer(image, 'base64')
				ws = RocketFileAvatarInstance.createWriteStream "#{user.username}.jpg", contentType
				ws.on 'end', Meteor.bindEnvironment ->
					Meteor.users.update {_id: user._id}, {$set: {avatarOrigin: service}}

				rs.pipe(ws)