Template.starredRooms.helpers
	isActive: ->
		return 'active' if ChatSubscription.findOne({ f: true, rid: Session.get('openedRoom') }, { fields: { _id: 1 } })?

	rooms: ->
		query = { f: true, open: true }

		if Meteor.user()?.settings?.preferences?.unreadRoomsMode
			query.alert =
				$ne: true

		return ChatSubscription.find query, { sort: 't': 1, 'name': 1 }
	total: ->
		return ChatSubscription.find({ f: true }).count()
