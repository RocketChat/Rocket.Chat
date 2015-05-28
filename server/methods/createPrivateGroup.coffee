Meteor.methods
	createPrivateGroup: (name, members) ->
		fromId = Meteor.userId()
		console.log '[methods] createPrivateGroup -> '.green, 'fromId:', fromId, 'members:', members

		now = new Date()

		members.push Meteor.userId()

		name = s.slugify name

		# create new room
		roomId = ChatRoom.insert
			uids: members
			ts: now
			t: 'p'
			uid: Meteor.userId()
			name: name
			msgs: 0

		for user in members
			sub =
				uid: user
				rid: roomId
				ts: now
				rn: name
				t: 'p'
				unread: 0

			if user is Meteor.userId()
				sub.ls = now

			ChatSubscription.insert sub

		return {
			rid: roomId
		}
