Meteor.publish 'fullUsers', (filter, limit, skip) ->
	unless this.userId
		return this.ready()

	user = Meteor.users.findOne this.userId
	if user.admin isnt true
		return this.ready()

	filter = _.trim filter
	if filter
		filterReg = new RegExp filter, "i"
		query = { $or: [ { username: filterReg }, { name: filterReg }, { "emails.address": filterReg } ] }
	else
		query = {}

	limit = Math.min limit, 50

	console.log '[publish] fullUsers'.green, filter, limit, skip

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
			utcOffset: 1
		limit: limit
		skip: skip
