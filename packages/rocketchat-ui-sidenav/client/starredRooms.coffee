Template.starredRooms.helpers
	isActive: ->
		return 'active' if ChatSubscription.findOne({ f: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

	rooms: ->
		query = { f: true, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		if Session.equals('RoomSortType', 'name')
			sort = {sort: 't': 1, 'name': 1 }
		else
			sort = {sort: 'la': -1 }

		return ChatSubscription.find query, sort
	total: ->
		return ChatSubscription.find({ f: true }).count()
