Meteor.methods
	subscriptions: ->
		unless Meteor.userId()
			return []

		options =
			fields:
				t: 1
				ts: 1
				ls: 1
				name: 1
				rid: 1
				code: 1
				f: 1
				open: 1
				alert: 1
				roles: 1
				unread: 1
				archived: 1
				desktopNotifications: 1
				mobilePushNotifications: 1
				emailNotifications: 1

		return RocketChat.models.Subscriptions.findByUserId(Meteor.userId(), options).fetch()

subscriptionsReady = false
RocketChat.models.Subscriptions.find().observe
	added: (record) ->
		if subscriptionsReady
			console.log('added', record)
			RocketChat.Notifications.notifyUser record.u._id, 'subscription-change', 'added', record

	changed: (record) ->
		if subscriptionsReady
			console.log('changed', record)
			RocketChat.Notifications.notifyUser record.u._id, 'subscription-change', 'changed', record

	removed: (record) ->
		if subscriptionsReady
			console.log('removed', record)
			RocketChat.Notifications.notifyUser record.u._id, 'subscription-change', 'removed', {_id: record._id}

subscriptionsReady = true
