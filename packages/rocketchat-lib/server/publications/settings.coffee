Meteor.publish 'settings', (ids = []) ->
	filter =
		hidden: { $ne: true }
		public: true

	if ids.length > 0
		filter._id =
			$in: ids

	return RocketChat.models.Settings.find filter, { fields: _id: 1, value: 1 }

Meteor.publish 'admin-settings', ->
	unless @userId
		return @ready()

	if RocketChat.authz.hasPermission( @userId, 'view-privileged-setting')
		return RocketChat.models.Settings.find({ hidden: { $ne: true } })
	else
		return @ready()

