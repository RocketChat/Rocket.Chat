Meteor.methods
	'public-settings/get': ->
		this.unblock()

		return RocketChat.models.Settings.findNotHiddenPublic().fetch()

	'public-settings/sync': (updatedAt) ->
		this.unblock()

		result =
			update: RocketChat.models.Settings.findNotHiddenPublicUpdatedAfter(updatedAt).fetch()
			remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {hidden: { $ne: true }, public: true}, {fields: {_id: 1, _deletedAt: 1}}).fetch()

		return result

	'private-settings/get': ->
		unless Meteor.userId()
			return []

		this.unblock()

		if not RocketChat.authz.hasPermission Meteor.userId(), 'view-privileged-setting'
			return []

		return RocketChat.models.Settings.findNotHidden().fetch()

	'private-settings/sync': (updatedAt) ->
		unless Meteor.userId()
			return {}

		this.unblock()

		return RocketChat.models.Settings.dinamicFindChangesAfter('findNotHidden', updatedAt);


RocketChat.models.Settings.on 'change', (type, args...) ->
	records = RocketChat.models.Settings.getChangedRecords type, args[0]

	for record in records
		e = if record.public is true then 'public-settings-changed' else 'private-settings-changed'
		RocketChat.Notifications.notifyAll e, type, record


RocketChat.Notifications.streamAll.allowRead 'private-settings-changed', ->
	if not @userId? then return false

	return RocketChat.authz.hasPermission @userId, 'view-privileged-setting'
