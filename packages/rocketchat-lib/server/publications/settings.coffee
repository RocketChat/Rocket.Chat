Meteor.methods
	getPublicSettings: ->
		this.unblock()

		return RocketChat.models.Settings.findNotHiddenPublic().fetch()

	getPrivateSettings: ->
		unless Meteor.userId()
			return []

		this.unblock()

		if not RocketChat.authz.hasPermission Meteor.userId(), 'view-privileged-setting'
			return []

		return RocketChat.models.Settings.findNotHidden().fetch()


subscriptionsReady = false
RocketChat.models.Settings.findNotHidden().observe
	added: (record) ->
		if subscriptionsReady
			e = if record.public is true then 'public-settings-changed' else 'private-settings-changed'
			RocketChat.Notifications.notifyAll e, 'added', record

	changed: (record) ->
		if subscriptionsReady
			e = if record.public is true then 'public-settings-changed' else 'private-settings-changed'
			RocketChat.Notifications.notifyAll e, 'changed', record

	removed: (record) ->
		if subscriptionsReady
			e = if record.public is true then 'public-settings-changed' else 'private-settings-changed'
			RocketChat.Notifications.notifyAll e, 'removed', { _id: record._id }

subscriptionsReady = true


RocketChat.Notifications.streamAll.allowRead 'private-settings-changed', ->
	if not @userId? then return false

	return RocketChat.authz.hasPermission @userId, 'view-privileged-setting'
