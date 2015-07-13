Meteor.startup ->
	Meteor.defer ->


		if not ChatRoom.findOne('name': 'general')?
			ChatRoom.insert
				_id: 'GENERAL'
				usernames: []
				ts: new Date()
				t: 'c'
				name: 'general'
				msgs: 0


		# if not Meteor.users.findOne()?
		# 	console.log 'Inserting user admin'.red
		# 	console.log 'email: admin@admin.com | password: admin'.red

		# 	id = Meteor.users.insert
		# 		createdAt: new Date
		# 		emails: [
		# 			address: 'admin@admin.com'
		# 			verified: true
		# 		],
		# 		name: 'Admin'
		# 		avatarOrigin: 'none'

		# 	Accounts.setPassword id, 'admin'
