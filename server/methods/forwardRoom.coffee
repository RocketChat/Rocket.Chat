Meteor.methods
	forwardRoom: (forward) ->
		fromId = Meteor.userId()
		console.log '[methods] forwardRoom -> '.green, 'fromId:', fromId, 'forward:', forward

		# @TODO implementar validação para não poder convidar quem já está na sala

		now = new Date()

		userTo = Meteor.users.findOne forward.to
		unless userTo?
			throw new Meteor.Error 203, 'Usuário não encontrado'

		room = ChatRoom.findOne forward.rid

		ChatRoom.update forward.rid,
			$addToSet:
				uids: forward.to
			# $pull:
			# 	uids: Meteor.userId()

		ChatSubscription.upsert { rid: forward.rid, uid: forward.to },
			$setOnInsert:
				rn: room.name
				t: 'v'
				unread: 0
			$set:
				ts: now

		ChatMessage.insert
			rid: forward.rid
			ts: now
			t: 'au'
			msg: userTo.name
			by: Meteor.userId()

		# ChatSubscription.remove { rid: forward.rid, uid: Meteor.userId() }
