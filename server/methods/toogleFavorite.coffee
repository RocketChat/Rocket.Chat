Meteor.methods
	toogleFavorite: (roomId, fav) ->
		unless Meteor.userId()
			throw new Meteor.Error(403, "[methods] toogleFavorite -> Invalid user")

		fromId = Meteor.userId()
		console.log '[methods] toogleFavorite -> '.green, 'fromId:', fromId, 'roomId:', roomId, 'fav:', fav

		ChatSubscription.update { rid: roomId, uid: Meteor.userId() }, { $set: { f: fav } }
