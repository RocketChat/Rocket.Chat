Meteor.publish 'subscription', ->
	unless this.userId
		return this.ready()

	console.log '[publish] subscription'.green

	ChatSubscription.find
		'u._id': this.userId
	,
		fields:
			t: 1
			ts: 1
			ls: 1
			name: 1
			rid: 1
			f: 1
			open: 1
			alert: 1
			unread: 1
