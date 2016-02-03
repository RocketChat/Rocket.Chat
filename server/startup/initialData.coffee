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
				status: "offline"
				statusDefault: "offline"
				utcOffset: 0
				active: true
				bot: true

			rs = RocketChatFile.bufferToStream new Buffer(Assets.getBinary('avatars/rocketcat.png'), 'utf8')
			RocketChatFileAvatarInstance.deleteFile "rocket.cat.jpg"
			ws = RocketChatFileAvatarInstance.createWriteStream "rocket.cat.jpg", 'image/png'
			ws.on 'end', Meteor.bindEnvironment ->
				RocketChat.models.Users.setAvatarOrigin 'rocket.cat', 'local'

			rs.pipe(ws)


		if process.env.ADMIN_EMAIL? and process.env.ADMIN_PASS?
			re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i
			if re.test process.env.ADMIN_EMAIL
				if _.isEmpty(RocketChat.authz.getUsersInRole( 'admin' ).fetch())
					if not RocketChat.models.Users.findOneByEmailAddress process.env.ADMIN_EMAIL
						console.log 'Inserting admin user'.red
						console.log "email: #{process.env.ADMIN_EMAIL} | password: #{process.env.ADMIN_PASS}".red

						id = RocketChat.models.Users.create
							emails: [
								address: process.env.ADMIN_EMAIL
								verified: true
							],
							name: 'Admin'

						Accounts.setPassword id, process.env.ADMIN_PASS
						RocketChat.authz.addUserRoles( id, 'admin')

					else
						console.log 'E-mail exists; ignoring environment variables ADMIN_EMAIL and ADMIN_PASS'.red
				else
					console.log 'Admin user exists; ignoring environment variables ADMIN_EMAIL and ADMIN_PASS'.red
			else
				console.log 'E-mail provided is invalid; ignoring environment variables ADMIN_EMAIL and ADMIN_PASS'.red

		# Set oldest user as admin, if none exists yet
		if _.isEmpty( RocketChat.authz.getUsersInRole( 'admin' ).fetch())
			# get oldest user
			oldestUser = RocketChat.models.Users.findOne({ _id: { $ne: 'rocket.cat' }}, { fields: { username: 1 }, sort: {createdAt: 1}})
			if oldestUser
				RocketChat.authz.addUserRoles( oldestUser._id, 'admin')
				console.log "No admins are found. Set #{oldestUser.username} as admin for being the oldest user"
