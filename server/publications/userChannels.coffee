Meteor.publish 'userChannels', (userId) ->
	unless this.userId
		return this.ready()

	user = Meteor.users.findOne this.userId
	if user.admin isnt true
		return this.ready()

	query = { "u._id": userId }

	console.log '[publish] userChannels'.green, userId

	ChatSubscription.find query,
		fields:
			rid: 1,
			name: 1,
			t: 1,
			u: 1
		sort: { t: 1, name: 1 }