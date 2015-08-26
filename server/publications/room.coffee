Meteor.publish 'room', (typeName) ->
	unless this.userId
		return this.ready()

	console.log '[publish] room ->'.green, 'arguments:', arguments

	if typeof typeName isnt 'string'
		return this.ready()

	type = typeName.substr(0, 1)
	name = typeName.substr(1)

	query = {}

	if type in ['c', 'p']
		query =
			t: type
			name: name

		if type is 'p'
			user = Meteor.users.findOne this.userId, fields: username: 1
			query.usernames = user.username

	else if type is 'd'
		user = Meteor.users.findOne this.userId, fields: username: 1
		query =
			t: 'd'
			usernames:
				$all: [user.username, name]

	# Change to validate access manualy
	# if not Meteor.call 'canAccessRoom', rid, this.userId
	# 	return this.ready()
	sub = this
	console.log ChatRoom.find(query, {
		fields:
			name: 1
			t: 1
			cl: 1
			u: 1
			usernames: 1
	}).observe
		added: (doc) ->
			console.log 'added', arguments
			sub.added('rocketchat_room', String(doc.id), doc);
		changed: (newDoc, oldDoc) ->
			console.log 'changed', arguments
			sub.changed('rocketchat_room', String(newDoc.id), newDoc);
		removed: (doc) ->
			console.log 'removed', arguments
			sub.removed('rocketchat_room', String(doc.id));

	return this.ready()
	# ChatRoom.find query,
	# 	fields:
	# 		name: 1
	# 		t: 1
	# 		cl: 1
	# 		u: 1
	# 		usernames: 1
