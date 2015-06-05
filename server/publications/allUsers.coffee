Meteor.publish 'allUsers', ->
	unless this.userId
		return this.ready()

	console.log '[publish] allUsers'.green

	Meteor.users.find
		username:
			$exists: 1
		status:
			$in: ['online', 'away', 'busy']
		,
			fields:
				username: 1
				status: 1
