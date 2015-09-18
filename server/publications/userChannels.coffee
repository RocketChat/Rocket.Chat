Meteor.publish 'userChannels', (userId) ->
	unless this.userId
		return this.ready()

	if RocketChat.authz.hasPermission( @userId, 'view-other-user-channels') isnt true
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