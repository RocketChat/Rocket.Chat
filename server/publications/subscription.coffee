fields =
	t: 1
	ts: 1
	ls: 1
	name: 1
	rid: 1
	code: 1
	f: 1
	u: 1
	open: 1
	alert: 1
	roles: 1
	unread: 1
	archived: 1
	desktopNotifications: 1
	mobilePushNotifications: 1
	emailNotifications: 1
	_updatedAt: 1


Meteor.methods
	'subscriptions/get': ->
		unless Meteor.userId()
			return []

		this.unblock()

		options =
			fields: fields

		return RocketChat.models.Subscriptions.findByUserId(Meteor.userId(), options).fetch()

	'subscriptions/sync': (updatedAt) ->
		unless Meteor.userId()
			return {}

		this.unblock()

		options =
			fields: fields

		result =
			update: RocketChat.models.Subscriptions.findByUserIdUpdatedAfter(Meteor.userId(), updatedAt, options).fetch()
			remove: RocketChat.models.Subscriptions.trashFindDeletedAfter(updatedAt, {'u._id': Meteor.userId()}, {fields: {_id: 1, _deletedAt: 1}}).fetch()

		return result


RocketChat.models.Subscriptions.on 'change', (type, args...) ->
	records = RocketChat.models.Subscriptions.getChangedRecords type, args[0], fields

	for record in records
		RocketChat.Notifications.notifyUser record.u._id, 'subscriptions-changed', type, record
