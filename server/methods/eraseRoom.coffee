Meteor.methods
	eraseRoom: (rid) ->
		fromId = Meteor.userId()

		user = Meteor.users.findOne Meteor.userId()
		if user.admin is true


			# console.log '[methods] eraseRoom -> '.green, 'fromId:', fromId, 'rid:', rid

			# ChatRoom.update({ _id: rid}, {'$pull': { userWatching: Meteor.userId(), userIn: Meteor.userId() }})

			userUnset = {'$unset': {}}
			userUnset.$unset['readMessages.' + rid] = ''
			Meteor.users.update({_id: Meteor.userId()}, userUnset)

			ChatMessage.remove({rid: rid})
			ChatSubscription.remove({rid: rid})
			ChatRoom.remove(rid)
			# @TODO remove das mensagens lidas do usuário
