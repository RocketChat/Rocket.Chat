Meteor.startup ->
	Meteor.defer ->

		if not RocketChat.models.Rooms.findOneById('GENERAL')?
			RocketChat.models.Rooms.createWithIdTypeAndName 'GENERAL', 'c', 'general',
				default: true

		if not RocketChat.models.Users.findOneById('rocket.cat')?
			RocketChat.models.Users.create
				_id: 'rocket.cat'
				name: "Rocket.Cat"
				username: 'rocket.cat'
				status: "online"
				statusDefault: "online"
				utcOffset: 0
				active: true
				type: 'bot'

			rs = RocketChatFile.bufferToStream new Buffer(Assets.getBinary('avatars/rocketcat.png'), 'utf8')
			RocketChatFileAvatarInstance.deleteFile "rocket.cat.jpg"
			ws = RocketChatFileAvatarInstance.createWriteStream "rocket.cat.jpg", 'image/png'
			ws.on 'end', Meteor.bindEnvironment ->
				RocketChat.models.Users.setAvatarOrigin 'rocket.cat', 'local'

			rs.pipe(ws)


		if process.env.ADMIN_PASS?
			if _.isEmpty(RocketChat.authz.getUsersInRole( 'admin' ).fetch())
				console.log 'Inserting admin user:'.green

				adminUser =
					name: "Administrator"
					username: "admin"
					status: "offline"
					statusDefault: "online"
					utcOffset: 0
					active: true

				if process.env.ADMIN_NAME?
					adminUser.name = process.env.ADMIN_NAME
				console.log "Name: #{adminUser.name}".green

				if process.env.ADMIN_EMAIL?
					re = /^[^@].*@[^@]+$/i
					if re.test process.env.ADMIN_EMAIL
						if not RocketChat.models.Users.findOneByEmailAddress process.env.ADMIN_EMAIL
							adminUser.emails = [
								address: process.env.ADMIN_EMAIL
								verified: true
							]
							console.log "Email: #{process.env.ADMIN_EMAIL}".green
						else
							console.log 'E-mail provided already exists; Ignoring environment variables ADMIN_EMAIL'.red
					else
						console.log 'E-mail provided is invalid; Ignoring environment variables ADMIN_EMAIL'.red

				if process.env.ADMIN_USERNAME?
					try
						nameValidation = new RegExp '^' + RocketChat.settings.get('UTF8_Names_Validation') + '$'
					catch
						nameValidation = new RegExp '^[0-9a-zA-Z-_.]+$'
					if nameValidation.test process.env.ADMIN_USERNAME
						if RocketChat.checkUsernameAvailability(process.env.ADMIN_USERNAME)
							adminUser.username = process.env.ADMIN_USERNAME
						else
							console.log 'Username provided already exists; Ignoring environment variables ADMIN_USERNAME'.red
					else
						console.log 'Username provided is invalid; Ignoring environment variables ADMIN_USERNAME'.red
				console.log "Username: #{adminUser.username}".green

				id = RocketChat.models.Users.create adminUser

				Accounts.setPassword id, process.env.ADMIN_PASS
				console.log "Password: #{process.env.ADMIN_PASS}".green
				RocketChat.authz.addUserRoles( id, 'admin')

			else
				console.log 'Users with admin role already exist; Ignoring environment variables ADMIN_PASS'.red

		# Set oldest user as admin, if none exists yet
		if _.isEmpty( RocketChat.authz.getUsersInRole( 'admin' ).fetch())
			# get oldest user
			oldestUser = RocketChat.models.Users.findOne({ _id: { $ne: 'rocket.cat' }}, { fields: { username: 1 }, sort: {createdAt: 1}})
			if oldestUser
				RocketChat.authz.addUserRoles( oldestUser._id, 'admin')
				console.log "No admins are found. Set #{oldestUser.username} as admin for being the oldest user"
