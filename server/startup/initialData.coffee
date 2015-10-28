Meteor.startup ->
	Meteor.defer ->

		if not RocketChat.models.Rooms.findOneById('GENERAL')?
			RocketChat.models.Rooms.createWithIdTypeAndName 'GENERAL', 'c', 'general',
				default: true

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
						RocketChat.authz.addUsersToRoles( id, 'admin')

					else
						console.log 'E-mail exists; ignoring environment variables ADMIN_EMAIL and ADMIN_PASS'.red
				else
					console.log 'Admin user exists; ignoring environment variables ADMIN_EMAIL and ADMIN_PASS'.red
			else
				console.log 'E-mail provided is invalid; ignoring environment variables ADMIN_EMAIL and ADMIN_PASS'.red

		# Set oldest user as admin, if none exists yet
		if _.isEmpty( RocketChat.authz.getUsersInRole( 'admin' ).fetch())
			# get oldest user
			oldestUser = RocketChat.models.Users.findOne({}, { fields: { username: 1 }, sort: {createdAt: 1}})
			if oldestUser
				RocketChat.authz.addUsersToRoles( oldestUser._id, 'admin')
				console.log "No admins are found. Set #{oldestUser.username} as admin for being the oldest user"
