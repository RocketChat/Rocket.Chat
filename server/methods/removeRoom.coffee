Meteor.methods
	removeRoom: (rid) ->
		fromId = Meteor.userId()
		# console.log '[methods] removeRoom -> '.green, 'fromId:', fromId, 'rid:', rid

		ChatRoom.update({ _id: rid}, {'$pull': { userWatching: Meteor.userId(), userIn: Meteor.userId() }})

		# ChatMessage.remove({rid: rid})
		# RocketChat.models.Rooms.removeById(rid)
		# @TODO remove das mensagens lidas do usuário
