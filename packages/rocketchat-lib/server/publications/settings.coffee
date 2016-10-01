Meteor.methods
	'public-settings/get': (updatedAt) ->
		this.unblock()

		if updatedAt instanceof Date
			result =
				update: RocketChat.models.Settings.findNotHiddenPublicUpdatedAfter(updatedAt).fetch()
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {hidden: { $ne: true }, public: true}, {fields: {_id: 1, _deletedAt: 1}}).fetch()

			return result

		return RocketChat.models.Settings.findNotHiddenPublic().fetch()

	'private-settings/get': (updatedAt) ->
		unless Meteor.userId()
			return []

		this.unblock()

		if not RocketChat.authz.hasPermission Meteor.userId(), 'view-privileged-setting'
			return []

		if updatedAt instanceof Date
			return RocketChat.models.Settings.dinamicFindChangesAfter('findNotHidden', updatedAt);

		return RocketChat.models.Settings.findNotHidden().fetch()


RocketChat.models.Settings.on 'change', (type, args...) ->
	records = RocketChat.models.Settings.getChangedRecords type, args[0]

	for record in records
		if record.public is true
			RocketChat.Notifications.notifyAll 'public-settings-changed', type, _.pick(record, '_id', 'value')

		RocketChat.Notifications.notifyAll 'private-settings-changed', type, record


RocketChat.Notifications.streamAll.allowRead 'private-settings-changed', ->
	if not @userId? then return false

	return RocketChat.authz.hasPermission @userId, 'view-privileged-setting'
