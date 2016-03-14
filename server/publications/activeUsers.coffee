Meteor.publish 'activeUsers', ->
	if not this.userId and RocketChat.settings.get("Accounts_AnonymousAccess") is 'None'
		return this.ready()

	RocketChat.models.Users.findUsersNotOffline
		fields:
			username: 1
			status: 1
			utcOffset: 1
