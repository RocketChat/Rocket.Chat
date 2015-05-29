Meteor.methods
	hideRoom: (roomId) ->
		fromId = Meteor.userId()
		# console.log '[methods] hideRoom -> '.green, 'fromId:', fromId, 'roomId:', roomId

		unless Meteor.userId()?
			throw new Meteor.Error 300, 'Usuário não logado'

		ChatSubscription.update({ rid: roomId, uid: Meteor.userId() }, { $unset: { ts: 1, f: 1 } })
