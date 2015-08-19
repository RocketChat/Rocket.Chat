Meteor.publish 'fullUsers', (filter, limit) ->
	unless this.userId
		return this.ready()

	user = Meteor.users.findOne this.userId
	if user.admin isnt true
		return this.ready()

	filter = _.trim filter
	if filter
		if limit is 1
			query = { username: filter }
		else
			filterReg = new RegExp filter, "i"
			query = { $or: [ { username: filterReg }, { name: filterReg }, { "emails.address": filterReg } ] }
	else
		query = {}

	console.log '[publish] fullUsers'.green, filter, limit

	Meteor.users.find query,
		fields:
			name: 1
			username: 1
			emails: 1
			phone: 1
			status: 1
			statusDefault: 1
			statusConnection: 1
			avatarOrigin: 1
			admin: 1
			utcOffset: 1
			language: 1
			lastLogin: 1
			active: 1
		limit: limit
		sort: { username: 1 }