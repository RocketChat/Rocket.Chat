Meteor.publish 'userChannels', (userId) ->
	unless this.userId
		return this.ready()

	if RocketChat.authz.hasPermission( @userId, 'view-other-user-channels') isnt true
		return this.ready()

	RocketChat.models.Subscriptions.findByUserId userId,
		fields:
			rid: 1,
			name: 1,
			t: 1,
			u: 1
		sort: { t: 1, name: 1 }
