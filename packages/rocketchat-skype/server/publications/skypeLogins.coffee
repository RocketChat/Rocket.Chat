Meteor.publish 'skype-logins', ->
	unless this.userId
		return this.ready()

	fields =
		username: 1
		skypeLogin: 1

	options =
		fields: fields
		sort: { username: 1 }

	RocketChat.models.Users.find {}, options
