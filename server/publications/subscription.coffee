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
	desktopNotificationDuration: 1
	mobilePushNotifications: 1
	emailNotifications: 1
	_updatedAt: 1


Meteor.methods
	'subscriptions/get': (updatedAt) ->
		unless Meteor.userId()
			return []

		this.unblock()

		options =
			fields: fields

		records = RocketChat.cache.Subscriptions.findByUserId(Meteor.userId(), options).fetch()

		if updatedAt instanceof Date
			return records.filter (record) ->
				return record._updatedAt > updatedAt

		return records


RocketChat.cache.Subscriptions.on 'changed', (type, subscription) ->
	RocketChat.Notifications.notifyUser subscription.u._id, 'subscriptions-changed', type, RocketChat.cache.Subscriptions.processQueryOptionsOnResult(subscription, {fields: fields})
