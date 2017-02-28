Meteor.methods
	'public-settings/get': (updatedAt) ->
		this.unblock()

		records = RocketChat.models.Settings.find().fetch().filter (record) ->
			return record.hidden isnt true and record.public is true

		if updatedAt instanceof Date
			result =
				update: records.filter (record) ->
					return record._updatedAt > updatedAt
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {hidden: { $ne: true }, public: true}, {fields: {_id: 1, _deletedAt: 1}}).fetch()

			return result

		return records

	'private-settings/get': (updatedAt) ->
		unless Meteor.userId()
			return []

		this.unblock()

		if not RocketChat.authz.hasPermission Meteor.userId(), 'view-privileged-setting'
			return []

		records = RocketChat.models.Settings.find().fetch().filter (record) ->
			return record.hidden isnt true

		if updatedAt instanceof Date
			return {
				update: records.filter (record) ->
					return record._updatedAt > updatedAt
				remove: RocketChat.models.Settings.trashFindDeletedAfter(updatedAt, {hidden: { $ne: true }}, {fields: {_id: 1, _deletedAt: 1}}).fetch()
			}

		return records


RocketChat.models.Settings.cache.on 'changed', (type, setting) ->
	if setting.public is true
		RocketChat.Notifications.notifyAllInThisInstance 'public-settings-changed', type, _.pick(setting, '_id', 'value')

	RocketChat.Notifications.notifyLoggedInThisInstance 'private-settings-changed', type, setting


RocketChat.Notifications.streamAll.allowRead 'private-settings-changed', ->
	if not @userId? then return false

	return RocketChat.authz.hasPermission @userId, 'view-privileged-setting'
