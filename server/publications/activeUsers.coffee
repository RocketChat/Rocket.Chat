Meteor.publish 'activeUsers', ->
	unless this.userId
		return this.ready()

	console.log '[publish] activeUsers'.green

	Meteor.users.find
		username:
			$exists: 1
		status:
			$in: ['custom', 'online', 'away', 'busy']
	,
		fields:
			username: 1
			status: 1
