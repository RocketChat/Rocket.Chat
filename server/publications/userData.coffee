Meteor.publish 'userData', ->
	unless this.userId
		return this.ready()

	console.log '[publish] userData'.green

	###
		Please note this returns the information for all users back to the client.
		Make sure to not add any more fields that are sensitive like access inside
		the profile or the entire profile object which would contain the access.
	###
	Meteor.users.find {},
		fields:
			name: 1
			'profile.first_name': 1
			'profile.last_name': 1
			username: 1
			emails: 1
			phone: 1
			status: 1
			statusDefault: 1
			statusConnection: 1
			avatarOrigin: 1
			admin: 1
			'profile.statusMessages': 1
			utcOffset: 1
			language: 1
