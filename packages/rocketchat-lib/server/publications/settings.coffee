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


RocketChat.models.Settings.on 'change', (type, args...) ->
	records = RocketChat.models.Settings.getChangedRecords type, args[0]

	for record in records
		e = if record.public is true then 'public-settings-changed' else 'private-settings-changed'
		RocketChat.Notifications.notifyAll e, type, record


RocketChat.Notifications.streamAll.allowRead 'private-settings-changed', ->
	if not @userId? then return false

	return RocketChat.authz.hasPermission @userId, 'view-privileged-setting'
