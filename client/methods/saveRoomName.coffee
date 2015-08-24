Meteor.methods
	saveRoomName: (rid, name) ->
		if not Meteor.userId()
			throw new Meteor.Error 203, t('User_logged_out')

		room = ChatRoom.findOne rid

		if room.u._id isnt Meteor.userId() or room.t not in ['c', 'p']
			throw new Meteor.Error 403, t('Not allowed')

		name = _.slugify name

		if name is room.name
			return

		ChatRoom.update rid,
			$set:
				name: name

		ChatSubscription.update
			rid: rid
		,
			$set:
				name: name

		return name
