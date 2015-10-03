Meteor.publish 'settings', (ids = []) ->
	console.log '[publish] settings'.green

	filter =
		hidden: { $ne: true }
		public: true

	if ids.length > 0
		filter._id =
			$in: ids

	return RocketChat.models.Settings.find filter, { fields: _id: 1, value: 1 }

Meteor.publish 'admin-settings', ->
	console.log '[publish] admin-settings'.green

	unless @userId
		return @ready()

	if RocketChat.authz.hasPermission( @userId, 'view-privileged-setting')
		return RocketChat.models.Settings.find()
	else
		return @ready()

