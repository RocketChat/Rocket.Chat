Meteor.methods
	createDirectRoom: (toUserId) ->
		fromId = Meteor.userId()
		# console.log '[methods] createDirectRoom -> '.green, 'fromId:', fromId, 'toUserId:', toUserId

		if Meteor.userId() is toUserId
			return

		roomId = [Meteor.userId(), toUserId].sort().join('')

		userTo = Meteor.users.findOne { _id: toUserId }

		me = Meteor.user()

		now = new Date()

		# create new room
		ChatRoom.upsert { _id: roomId },
			$set:
				uids: [Meteor.userId(),toUserId]
			$setOnInsert:
				t: 'd'
				name: "#{me.name}|#{userTo.name}"
				msgs: 0
				ts: now

		ChatSubscription.upsert { uid: Meteor.userId(), rid: roomId },
			$set:
				ts: now
				ls: now
				rn: userTo.name
			$setOnInsert:
				t: 'd'
				unread: 0

		ChatSubscription.upsert { uid: userTo._id, rid: roomId },
			$set:
				rn: me.name
			$setOnInsert:
				t: 'd'
				unread: 0

		return {
			rid: roomId
		}
