RocketChat.Migrations.add
	version: 10
	up: ->
		###
		# Remove duplicated usernames from rooms
		###

		count = 0
		RocketChat.models.Rooms.find({'usernames.0': {$exists: true}}, {fields: {usernames: 1}}).forEach (room) ->
			newUsernames = _.uniq room.usernames
			if newUsernames.length isnt room.usernames.length
				count++
				RocketChat.models.Rooms.update {_id: room._id}, {$set: {usernames: newUsernames}}

		console.log "Removed duplicated usernames from #{count} rooms"
