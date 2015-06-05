Meteor.publish 'subscription', ->
	unless this.userId
		return this.ready()

	console.log '[publish] subscription'.green

	ChatSubscription.find
		'u._id': this.userId
		ts:
			$gte: moment().subtract(2, 'days').startOf('day').toDate()
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

	# Meteor.publishWithRelations
	# 	handle: this
	# 	collection: ChatSubscription
	# 	filter: { 'u._id': this.userId, $or: [ { ts: { $gte: moment().subtract(1, 'days').startOf('day').toDate() } }, { f: true } ] }
	# 	options:
	# 		fields:
	# 			t: 1
	# 			ts: 1
	# 			ls: 1
	# 			name: 1
	# 			rid: 1
	# 			f: 1
	# 			open: 1
	# 			alert: 1
	# 			unread: 1
	# 	mappings: [
	# 		key: 'rid'
	# 		reverse: false
	# 		collection: ChatRoom
	# 		options:
	# 			fields:
	# 				name: 1
	# 				t: 1
	# 	]


