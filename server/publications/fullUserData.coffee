Meteor.publish 'fullUserData', (filter, limit) ->
	unless @userId
		return @ready()

	user = Meteor.users.findOne @userId

	fields =
		name: 1
		username: 1
		status: 1
		utcOffset: 1
		
	if user.admin is true
		fields = _.extend fields,
			emails: 1
			phone: 1
			statusConnection: 1
			admin: 1
			createdAt: 1
			lastLogin: 1
			active: 1
			services: 1
	else
		limit = 1

	filter = s.trim filter

	if not filter and limit is 1
		return @ready()

	if filter
		if limit is 1
			query = { username: filter }
		else
			filterReg = new RegExp filter, "i"
			query = { $or: [ { username: filterReg }, { name: filterReg }, { "emails.address": filterReg } ] }
	else
		query = {}

	console.log '[publish] fullUserData'.green, filter, limit

	Meteor.users.find query, 
		fields: fields
		limit: limit
		sort: { username: 1 }
